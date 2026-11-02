// Google Calendar (leitura e escrita) pelo servidor do app.
//
// Fluxo:
//  1. GET  /api/google/auth-url   (com login) → link de consentimento do Google; o "state" é assinado e leva o id do usuário.
//  2. GET  /api/google/callback   (o Google redireciona para cá) → troca o código pelo refresh token, cifra o token
//     (AES-GCM, chave derivada de GOOGLE_CLIENT_SECRET) e devolve o app em /#agenda com o token cifrado.
//  3. O app guarda só o token cifrado no banco (docs: app/google) e o manda em cada chamada abaixo (com login):
//     POST /api/google/calendars | events | create | update | delete
// O refresh token nunca aparece em claro fora deste servidor. O token cifrado só vale para o mesmo usuário.

const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.calendarlist.readonly", "openid", "email"];
const CAL = "https://www.googleapis.com/calendar/v3";
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

// ---------- cripto (Web Crypto) ----------
const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const keys = new Map();
async function key(env, use) {
  const k = `${use}:${env.GOOGLE_CLIENT_SECRET}`;
  if (!keys.has(k)) {
    const raw = await crypto.subtle.digest("SHA-256", enc.encode(`painel-google-${use}:${env.GOOGLE_CLIENT_SECRET}`));
    keys.set(k, use === "hmac"
      ? crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
      : crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]));
  }
  return keys.get(k);
}
async function sign(env, payload) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(env, "hmac"), enc.encode(body));
  return `${body}.${b64u(sig)}`;
}
async function verify(env, token) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify("HMAC", await key(env, "hmac"), unb64u(sig), enc.encode(body));
  if (!ok) return null;
  const p = JSON.parse(dec.decode(unb64u(body)));
  return p.e && p.e < Date.now() ? null : p;
}
async function seal(env, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(env, "aes"), enc.encode(JSON.stringify(obj)));
  return `${b64u(iv)}.${b64u(ct)}`;
}
async function unseal(env, token) {
  try {
    const [iv, ct] = String(token || "").split(".");
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv) }, await key(env, "aes"), unb64u(ct));
    return JSON.parse(dec.decode(pt));
  } catch { return null; }
}

// ---------- tokens do Google ----------
const access = new Map(); // refresh token → { at, exp } (cache por instância)
async function accessToken(env, rt) {
  const c = access.get(rt);
  if (c && c.exp > Date.now() + 60_000) return c.at;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: rt, grant_type: "refresh_token" }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw { status: 401, error: "google_reauth", message: j.error === "invalid_grant" ? "O acesso ao Google expirou ou foi revogado. Conecte de novo." : `Google recusou o acesso (${j.error || r.status}).` };
  access.set(rt, { at: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 });
  if (access.size > 20) access.delete(access.keys().next().value);
  return j.access_token;
}
async function gcal(env, rt, path, init = {}) {
  const at = await accessToken(env, rt);
  const r = await fetch(`${CAL}${path}`, { ...init, headers: { authorization: `Bearer ${at}`, "content-type": "application/json", ...(init.headers || {}) } });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) { access.delete(rt); throw { status: 401, error: "google_reauth", message: "O Google pediu login de novo. Conecte a agenda novamente." }; }
  if (!r.ok) throw { status: r.status === 404 ? 404 : 502, error: "google_error", message: (j.error && j.error.message) || `Google respondeu ${r.status}.` };
  return j;
}

// evento do app → formato do Google
function toGoogle(e) {
  const out = {};
  if (e.titulo !== undefined) out.summary = String(e.titulo || "").slice(0, 500);
  if (e.local !== undefined) out.location = String(e.local || "").slice(0, 500);
  if (e.notas !== undefined) out.description = String(e.notas || "").slice(0, 8000);
  if (e.inicio) {
    const tz = e.fuso || "America/Sao_Paulo";
    if (e.diaInteiro) {
      // no Google, o fim de um evento de dia inteiro é exclusivo (dia seguinte)
      const end = new Date(`${e.fim || e.inicio}T12:00:00Z`); end.setUTCDate(end.getUTCDate() + 1);
      out.start = { date: e.inicio.slice(0, 10) };
      out.end = { date: end.toISOString().slice(0, 10) };
    } else {
      out.start = { dateTime: e.inicio.length === 16 ? e.inicio + ":00" : e.inicio, timeZone: tz };
      out.end = { dateTime: (e.fim || e.inicio).length === 16 ? (e.fim || e.inicio) + ":00" : (e.fim || e.inicio), timeZone: tz };
    }
  }
  return out;
}
const calId = id => encodeURIComponent(String(id || "primary"));
const evId = id => { const s = String(id || ""); if (!/^[a-zA-Z0-9_@.-]{1,1024}$/.test(s)) throw { status: 400, error: "bad_request", message: "Evento inválido." }; return encodeURIComponent(s); };

// ---------- rotas ----------
export async function onRequest({ request, env, params, data }) {
  const op = [].concat(params.op || []).join("/");
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    if (op === "callback") return Response.redirect(new URL("/#agenda&gerr=not_configured", request.url).toString(), 302);
    return json(503, { error: "not_configured", message: "GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não estão configurados no Cloudflare." });
  }
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/google/callback`;

  try {
    if (op === "auth-url" && request.method === "GET") {
      const state = await sign(env, { u: data.user.id, e: Date.now() + 10 * 60_000, n: b64u(crypto.getRandomValues(new Uint8Array(9))) });
      const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: "code", scope: SCOPES.join(" "), access_type: "offline", prompt: "consent", include_granted_scopes: "true", state, login_hint: data.user.email || "" });
      return json(200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${q}` });
    }

    if (op === "callback" && request.method === "GET") {
      const back = frag => Response.redirect(new URL(`/#agenda&${frag}`, request.url).toString(), 302);
      if (url.searchParams.get("error")) return back(`gerr=${encodeURIComponent(url.searchParams.get("error"))}`);
      const st = await verify(env, url.searchParams.get("state"));
      if (!st) return back("gerr=state");
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code: url.searchParams.get("code") || "", client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.refresh_token) return back(`gerr=${encodeURIComponent(j.error || (j.access_token ? "no_refresh" : "token"))}`);
      let email = "";
      try { email = JSON.parse(dec.decode(unb64u(String(j.id_token || "").split(".")[1] || ""))).email || ""; } catch {}
      access.set(j.refresh_token, { at: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 });
      const sealed = await seal(env, { u: st.u, rt: j.refresh_token, email, t: Date.now() });
      return back(`g=${encodeURIComponent(sealed)}&gemail=${encodeURIComponent(email)}`);
    }

    if (request.method !== "POST") return json(405, { error: "bad_request", message: "Método não permitido." });
    const body = await request.json().catch(() => ({}));
    const tok = await unseal(env, body.token);
    if (!tok || tok.u !== data.user.id) return json(401, { error: "google_reauth", message: "Conecte o Google Calendar." });
    const rt = tok.rt;

    if (op === "calendars") {
      const r = await gcal(env, rt, "/users/me/calendarList?maxResults=100&minAccessRole=reader");
      return json(200, { email: tok.email, calendars: (r.items || []).map(c => ({ id: c.id, nome: c.summaryOverride || c.summary, cor: c.backgroundColor, principal: !!c.primary, escrita: c.accessRole === "owner" || c.accessRole === "writer", visivel: c.selected !== false, fuso: c.timeZone })) });
    }
    if (op === "events") {
      const ids = [].concat(body.calendars || ["primary"]).slice(0, 25);
      const q = new URLSearchParams({ timeMin: body.de, timeMax: body.ate, singleEvents: "true", orderBy: "startTime", maxResults: "500" });
      const out = [], errs = [];
      await Promise.all(ids.map(async id => {
        try {
          const r = await gcal(env, rt, `/calendars/${calId(id)}/events?${q}`);
          for (const e of r.items || []) if (e.status !== "cancelled") out.push({
            id: e.id, cal: id, titulo: e.summary || "(sem título)", local: e.location || "", notas: e.description || "", link: e.htmlLink,
            diaInteiro: !!(e.start && e.start.date), inicio: e.start && (e.start.dateTime || e.start.date), fim: e.end && (e.end.dateTime || e.end.date),
            meet: e.hangoutLink || "", recorrente: !!e.recurringEventId, cor: e.colorId || null,
          });
        } catch (err) { if (err.error === "google_reauth") throw err; errs.push(id); }
      }));
      return json(200, { events: out, falhas: errs });
    }
    if (op === "create") {
      const r = await gcal(env, rt, `/calendars/${calId(body.cal)}/events`, { method: "POST", body: JSON.stringify(toGoogle(body.evento || {})) });
      return json(200, { id: r.id, link: r.htmlLink });
    }
    if (op === "update") {
      const r = await gcal(env, rt, `/calendars/${calId(body.cal)}/events/${evId(body.id)}`, { method: "PATCH", body: JSON.stringify(toGoogle(body.evento || {})) });
      return json(200, { id: r.id, link: r.htmlLink });
    }
    if (op === "delete") {
      await gcal(env, rt, `/calendars/${calId(body.cal)}/events/${evId(body.id)}`, { method: "DELETE" });
      return json(200, { ok: true });
    }
    return json(404, { error: "bad_request", message: "Operação desconhecida." });
  } catch (e) {
    if (e && e.error) return json(e.status || 502, { error: e.error, message: e.message });
    return json(502, { error: "google_error", message: String(e && e.message || e) });
  }
}
