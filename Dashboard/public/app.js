import { init, auth, api, notion, prop, db, ApiError } from "/data.js";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const msg = (el, text, kind) => { el.textContent = text || ""; el.hidden = !text; el.className = "msg" + (kind ? " " + kind : ""); };

// bases do Notion (ids das fontes de dados, iguais aos do painel no artifact)
const DS = { workouts: "1bcb0f63-2167-8150-a8a5-000bd0b37ee6", runs: "1bcb0f63-2167-818a-a3e0-000b84b54d0b", sets: "1bcb0f63-2167-812e-89e0-000bc5e1725f" };

// ---------- tema (lembrado neste aparelho) ----------
const THEME_KEY = "painel.theme";
function applyTheme(t) { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
try { applyTheme(localStorage.getItem(THEME_KEY)); } catch {}
$("b-theme").onclick = () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const t = dark ? "light" : "dark"; applyTheme(t); try { localStorage.setItem(THEME_KEY, t); } catch {}
};

// ---------- navegação por abas (#hash) ----------
const NAMES = { inicio: "Início", saude: "Saúde & corpo", financas: "Finanças", self: "Self Improvement", carreira: "Carreira", calendario: "Calendário" };
function route() {
  const tab = (location.hash || "#inicio").slice(1);
  document.querySelectorAll(".nav-i").forEach(a => a.classList.toggle("on", a.dataset.tab === tab));
  document.querySelectorAll(".view").forEach(v => { v.hidden = v.dataset.view !== (tab === "inicio" ? "inicio" : "placeholder"); });
  if (tab !== "inicio") $("ph-title").textContent = NAMES[tab] || tab;
}
addEventListener("hashchange", route);

// ---------- login ----------
let pendingEmail = "";
$("login-email").onsubmit = async e => {
  e.preventDefault(); const btn = e.submitter; btn.disabled = true; msg($("l-msg"));
  pendingEmail = $("l-email").value.trim().toLowerCase();
  const { error } = await auth.sendCode(pendingEmail);
  btn.disabled = false;
  if (error) return msg($("l-msg"), "Não consegui enviar o código: " + error.message, "err");
  $("login-email").hidden = true; $("login-code").hidden = false; $("l-sent").textContent = `Enviei um código para ${pendingEmail}.`;
  setTimeout(() => $("l-code").focus(), 50);
};
$("login-code").onsubmit = async e => {
  e.preventDefault(); const btn = e.submitter; btn.disabled = true; msg($("l-msg"));
  const { error } = await auth.verifyCode(pendingEmail, $("l-code").value.trim());
  btn.disabled = false;
  if (error) return msg($("l-msg"), "Código inválido ou vencido. Peça outro.", "err");
};
$("l-back").onclick = () => { $("login-code").hidden = true; $("login-email").hidden = false; msg($("l-msg")); };
$("b-out").onclick = () => auth.signOut();
document.querySelectorAll("[data-act=theme]").forEach(b => b.onclick = () => $("b-theme").click());
document.querySelectorAll("[data-act=out]").forEach(b => b.onclick = () => auth.signOut());

// ---------- tela de início (teste da estrutura) ----------
async function checks() {
  const box = $("c-checks");
  const row = (ok, label, note) => `<li><span class="s ${ok === null ? "wait" : ok ? "ok" : "no"}">${ok === null ? "…" : ok ? "✓" : "✗"}</span><span>${esc(label)}${note ? ` <span class="hint">· ${esc(note)}</span>` : ""}</span></li>`;
  try {
    const h = await api("health");
    box.innerHTML = row(true, "Login", h.user) + row(true, "Servidor") + row(h.notion, "Notion", h.notion ? "token configurado" : "falta NOTION_TOKEN")
      + row(h.anthropic, "Claude (Coach)", h.anthropic ? "chave configurada" : "falta ANTHROPIC_API_KEY · próxima etapa")
      + row(h.google, "Google Calendar", h.google ? "configurado" : "próxima etapa");
  } catch (e) {
    box.innerHTML = row(false, "Servidor", e.message);
  }
}
async function workouts() {
  const box = $("c-workouts"); box.innerHTML = `<p class="hint">Carregando…</p>`;
  try {
    const rows = await notion.query(DS.workouts, { sorts: [{ property: "Date", direction: "descending" }], page_size: 10 });
    if (!rows.length) { box.innerHTML = `<p class="hint">Nenhum treino encontrado. A integração tem acesso ao Workout Tracker?</p>`; return; }
    box.innerHTML = `<ul class="wl">${rows.map(r => {
      const p = r.properties, d = prop.date(p.Date), st = prop.select(p.Status);
      const when = d ? new Date(d.start.length > 10 ? d.start : d.start + "T12:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }) : "sem data";
      return `<li><span>${esc(prop.text(p.Name) || "Sem nome")} <span class="st ${st === "Done" ? "done" : "todo"}">${esc(st)}</span></span><span class="d">${esc(when)}</span></li>`;
    }).join("")}</ul>`;
  } catch (e) {
    const why = e instanceof ApiError && e.status === 404 ? "a integração do Notion não tem acesso à base Workouts (compartilhe o Workout Tracker com ela)" : e.message;
    box.innerHTML = `<p class="msg err">Não consegui ler o Notion: ${esc(why)}</p>`;
  }
}
$("b-reload").onclick = workouts;
$("b-db").onclick = async () => {
  const el = $("c-db"); msg(el, "Gravando…");
  try {
    const ref = db.doc("app/ping"), at = new Date().toISOString();
    await ref.set({ at, device: navigator.userAgent.slice(0, 80) });
    const back = await ref.get();
    msg(el, back.exists && back.data().at === at ? `Gravado e lido de volta (${new Date(at).toLocaleTimeString("pt-BR")}).` : "Gravou, mas a leitura não bateu.", back.exists ? "ok" : "err");
  } catch (e) { msg(el, "Falhou: " + (e.message || e), "err"); }
};

// ---------- início ----------
function show(signedIn) {
  $("login").hidden = signedIn; $("app").hidden = !signedIn;
  if (signedIn) { route(); checks(); workouts(); }
}
(async () => {
  try { await init(); }
  catch (e) { $("login").hidden = false; msg($("l-msg"), e.message, "err"); $("login-email").querySelector("button").disabled = true; return; }
  show(!!auth.user);
  auth.onChange(s => show(!!s));
})();

// app instalável / offline: registra o service worker
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
