import { init, auth, api, notion, prop, db, ApiError } from "/data.js";
import { mcp } from "/mcp.js";
import { sample } from "/ai.js";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const msg = (el, text, kind) => { el.textContent = text || ""; el.hidden = !text; el.className = "msg" + (kind ? " " + kind : ""); };

// bases do Notion (ids das fontes de dados, iguais aos do painel no artifact)
const DS = { workouts: "1bcb0f63-2167-8150-a8a5-000bd0b37ee6", runs: "1bcb0f63-2167-818a-a3e0-000b84b54d0b", sets: "1bcb0f63-2167-812e-89e0-000bc5e1725f" };

// ---------- tema (lembrado neste aparelho) ----------
const THEME_KEY = "painel.theme", root = document.documentElement;
function applyTheme(t) { if (t) root.dataset.theme = t; else delete root.dataset.theme; }
try { applyTheme(localStorage.getItem(THEME_KEY)); } catch {}
function toggleTheme() {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const t = dark ? "light" : "dark"; applyTheme(t); try { localStorage.setItem(THEME_KEY, t); } catch {}
}
document.querySelectorAll("[data-act=theme]").forEach(b => b.onclick = toggleTheme);
document.querySelectorAll("[data-act=out]").forEach(b => b.onclick = () => auth.signOut());

// ---------- navegação por abas (#hash) ----------
const NAMES = { config: "Configurações", saude: "Saúde & corpo", financas: "Finanças", self: "Self Improvement", carreira: "Carreira", agenda: "Agenda", estudos: "Leitura & estudos" };
const READY = { config: "view-inicio", saude: "view-saude", financas: "view-financas", self: "view-self", carreira: "view-carreira", agenda: "view-agenda" };
function route() {
  const tab = currentTab();
  document.querySelectorAll(".tab").forEach(t => { if (t.dataset.tab === tab) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
  const vid = READY[tab] || "view-other";
  ["view-inicio", "view-saude", "view-financas", "view-self", "view-carreira", "view-agenda", "view-other"].forEach(id => { $(id).style.display = id === vid ? "flex" : "none"; });
  if (vid === "view-other") $("ph-title").textContent = NAMES[tab];
  document.title = NAMES[tab] + " · Painel";
  if (tab === "saude") loadTab("saude").then(() => { window.dispatchEvent(new Event("painel:saude")); saudeMode(); });
  if (tab === "financas") loadTab("financas");
  if (tab === "agenda") loadTab("agenda").then(() => window.painelAgenda && window.painelAgenda.start());
  if (tab === "carreira") loadTab("carreira").then(() => window.dispatchEvent(new Event("painel:carreira")));
  if (tab === "self") loadTab("self").then(() => window.dispatchEvent(new Event("painel:self")));
  scrollTo(0, 0);
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => { if (currentTab() !== t.dataset.tab) location.hash = t.dataset.tab; else route(); }));
addEventListener("hashchange", route);

// barra superior compacta: aparece quando o título grande sai da tela (padrão do iOS)

// ---------- ponte com o código das abas do artifact ----------
// As abas vieram do painel no claude.ai e pedem o banco com window.claude.use("db").
// Aqui essa chamada devolve o banco do Supabase, com a mesma interface.
// O conector do Notion ("mcp") vira chamadas à API do Notion pelo servidor do app (mcp.js).
// O "sample" (Claude) só existe se o servidor tiver a chave da Anthropic (ANTHROPIC_API_KEY).
let healthP = null;
const health = () => healthP || (healthP = api("health").catch(e => { healthP = null; throw e; }));
window.claude = { use: async cap => {
  if (!auth.user) return null;
  if (cap === "db") return db;
  if (cap === "mcp") return mcp;
  if (cap === "sample") { try { return (await health()).anthropic ? sample : null; } catch { return null; } }
  return null;
} };
const TAB_JS = { financas: "/financas.js?v=3", self: "/self.js?v=2", carreira: "/carreira.js?v=1", agenda: "/agenda.js?v=2", saude: "/saude.js?v=5" }, tabP = {};
function loadTab(name) {
  return tabP[name] || (tabP[name] = new Promise((ok, bad) => {
    const s = document.createElement("script"); if (name === "agenda") s.type = "module"; s.src = TAB_JS[name]; s.onload = ok; s.onerror = bad; document.body.appendChild(s);
  }));
}

// ---------- computador: barra lateral recolhível (o conteúdo ocupa a tela toda) ----------
const SIDE_KEY = "painel.side.fechada";
function setSide(closed) {
  document.documentElement.classList.toggle("side-closed", closed);
  $("side-open").hidden = !closed || $("app").hidden;
  try { localStorage.setItem(SIDE_KEY, closed ? "1" : "0"); } catch {}
  setTimeout(() => dispatchEvent(new Event("resize")), 260); // gráficos se redesenham na largura nova
}
$("side-close").onclick = () => setSide(true);
$("side-open").onclick = () => setSide(false);
try { if (localStorage.getItem(SIDE_KEY) === "1") document.documentElement.classList.add("side-closed"); } catch {}

// ---------- Saúde: Painel · Treino · Alimentação ----------
const MODE_KEY = "painel.saude.modo";
function saudeMode(m) {
  if (m) { try { localStorage.setItem(MODE_KEY, m); } catch {} } else { try { m = localStorage.getItem(MODE_KEY) || "painel"; } catch { m = "painel"; } }
  $("view-saude").dataset.mode = m;
  document.querySelectorAll("#saude-mode button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
  $("treino-root").hidden = m !== "treino"; $("dieta-root").hidden = m !== "dieta";
  if (m === "treino") import("/treino.js?v=3").then(x => x.start());
  if (m === "dieta") import("/dieta.js?v=3").then(x => x.start());
  if (m === "painel") window.dispatchEvent(new Event("painel:saude"));
}
document.querySelectorAll("#saude-mode button").forEach(b => b.addEventListener("click", () => { saudeMode(b.dataset.mode); scrollTo(0, 0); }));
// treino em andamento continua acessível de qualquer aba (mini barra)
try { if (localStorage.getItem("painel.treino.atual")) setTimeout(() => import("/treino.js?v=3").then(x => x.start && window.painelSaude ? x.start() : null), 1500); } catch {}

// ---------- puxar para atualizar (com elástico e mola) ----------
// O que cada aba faz ao atualizar. Devolve uma promessa: o indicador gira até ela terminar.
// o hash pode trazer parâmetros depois de "&" (ex.: volta do Google em #agenda&g=…)
const HOME = "agenda"; // o app abre na Agenda
function currentTab() { let t = (location.hash || "").slice(1).split("&")[0]; if (t === "inicio") t = "config"; return NAMES[t] ? t : HOME; }
async function refreshTab() {
  navigator.serviceWorker?.getRegistration?.().then(r => r && r.update()).catch(() => {});
  const tab = currentTab();
  if (tab === "config") return Promise.all([checks(), workouts()]);
  if (tab === "saude") { const m = $("view-saude").dataset.mode; if (m === "treino" && window.painelTreino) return window.painelTreino.refresh(); if (m === "dieta" && window.painelDieta) return window.painelDieta.refresh(); return db.reloadAll(); }
  if (tab === "agenda") return window.painelAgenda && window.painelAgenda.refresh();
  if (tab === "financas" || tab === "self" || tab === "carreira") {
    const b = $({ financas: "refresh", self: "s-refresh", carreira: "c-refresh" }[tab]); if (!b || b.disabled) return;
    b.click(); const t0 = Date.now();
    await new Promise(r => setTimeout(r, 120));
    while (b.disabled && Date.now() - t0 < 30000) await new Promise(r => setTimeout(r, 150));
    return;
  }
  return new Promise(r => setTimeout(r, 500));
}

const PTR = (() => {
  const el = $("ptr"), ball = el.querySelector(".ptr-ball"), spin = $("ptr-spin"), main = $("main");
  // 8 raios, como o indicador de atividade do iOS; vão acendendo conforme o puxão
  spin.innerHTML = Array.from({ length: 8 }, (_, i) => `<line x1="12" y1="3.2" x2="12" y2="7.4" transform="rotate(${i * 45} 12 12)" style="--i:${i}"/>`).join("");
  const rays = [...spin.querySelectorAll("line")];
  const DIM = 260, TRIGGER = 72, HOLD = 64;
  // elástico do iOS: quanto mais se puxa, mais resiste (x → (1 - 1/(x·c/d + 1))·d)
  const rubber = x => (1 - 1 / (x * 0.55 / DIM + 1)) * DIM;
  let y = 0, v = 0, startY = null, lastY = 0, lastT = 0, vel = 0, pulling = false, busy = false, raf = 0, armed = false;

  function paint() {
    const p = Math.max(0, Math.min(1, y / TRIGGER));
    main.style.transform = y > 0.3 ? `translate3d(0, ${y.toFixed(2)}px, 0)` : "";
    el.style.transform = `translate3d(-50%, ${(y - 48).toFixed(2)}px, 0)`;
    el.style.opacity = Math.min(1, y / 28).toFixed(3);
    // a bolinha "estica" um pouco no puxão e volta ao normal (sensação de material elástico)
    const s = 0.6 + 0.4 * p, stretch = pulling ? 1 + Math.min(0.18, Math.max(0, (y - TRIGGER) / 400)) : 1;
    ball.style.transform = `scale(${(s / Math.sqrt(stretch)).toFixed(3)}, ${(s * stretch).toFixed(3)}) rotate(${busy ? 0 : (p * 270).toFixed(1)}deg)`;
    if (!busy) rays.forEach((r, i) => { r.style.opacity = p * 8 > i ? (0.25 + 0.75 * ((i + 1) / 8)).toFixed(2) : "0"; });
  }
  // mola física: massa 1, rigidez k, amortecimento c; integra até parar no alvo
  function springTo(target, { k = 260, c = 24, v0 = 0 } = {}) {
    cancelAnimationFrame(raf); v = v0;
    let t = performance.now();
    const step = now => {
      const dt = Math.min(0.032, (now - t) / 1000); t = now;
      for (let i = 0; i < 4; i++) { const h = dt / 4; const a = -k * (y - target) - c * v; v += a * h; y += v * h; }
      if (Math.abs(v) < 2 && Math.abs(y - target) < 0.3) { y = target; v = 0; paint(); if (target === 0) { main.style.transform = ""; el.classList.remove("on"); } return; }
      paint(); raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  const atTop = () => (document.scrollingElement || document.documentElement).scrollTop <= 0;
  const blocked = t => t.closest("input, textarea, select, .modal, .tabs, [contenteditable], .tr-sheet, .tr-live, .ft-scan") || !$("login").hidden
    || ((sc => sc && sc.scrollTop > 0)(t.closest(".ag-scroll"))); // grade da Agenda rolada: o puxão é dela

  addEventListener("touchstart", e => {
    if (busy || e.touches.length !== 1 || !atTop() || blocked(e.target)) { startY = null; return; }
    startY = e.touches[0].clientY; lastY = startY; lastT = performance.now(); vel = 0; pulling = false; armed = false;
  }, { passive: true });
  addEventListener("touchmove", e => {
    if (startY === null) return;
    const cy = e.touches[0].clientY, d = cy - startY, now = performance.now();
    if (!pulling) { if (d > 6 && atTop()) { pulling = true; cancelAnimationFrame(raf); el.classList.add("on"); } else if (d < 0) { startY = null; return; } else return; }
    if (e.cancelable) e.preventDefault();          // segura a rolagem nativa enquanto puxa
    vel = (cy - lastY) / Math.max(1, now - lastT) * 1000; lastY = cy; lastT = now;
    y = rubber(Math.max(0, d - 6));
    const nowArmed = y >= TRIGGER;
    if (nowArmed !== armed) { armed = nowArmed; el.classList.toggle("armed", armed); if (armed && navigator.vibrate) navigator.vibrate(8); }
    paint();
  }, { passive: false });
  const release = async () => {
    if (startY === null) return; startY = null;
    if (!pulling) return; pulling = false;
    // a velocidade do dedo entra na mola (o "quique" depende de como você soltou)
    const v0 = Math.max(-1500, Math.min(1500, vel * 0.35));
    if (y >= TRIGGER) {
      busy = true; el.classList.add("busy"); springTo(HOLD, { k: 320, c: 22, v0 });
      const t0 = performance.now();
      try { await refreshTab(); } catch {}
      // gira pelo menos ~0,7 s: atualizações instantâneas parecem não ter acontecido
      await new Promise(r => setTimeout(r, Math.max(250, 700 - (performance.now() - t0))));
      el.classList.remove("busy", "armed"); busy = false; armed = false;
      springTo(0, { k: 200, c: 22 });
    } else { el.classList.remove("armed"); springTo(0, { k: 280, c: 20, v0 }); }
  };
  addEventListener("touchend", release, { passive: true });
  addEventListener("touchcancel", release, { passive: true });
  return { refresh: refreshTab };
})();

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

// ---------- início ----------
async function checks() {
  const box = $("c-checks");
  const row = (ok, label, note) => `<li><span class="s ${ok ? "ok" : "no"}">${ok ? "✓" : "✗"}</span><span>${esc(label)}${note ? ` <span class="hint">· ${esc(note)}</span>` : ""}</span></li>`;
  try {
    healthP = null; const h = await health();
    box.innerHTML = row(true, "Login", h.user) + row(true, "Servidor") + row(h.notion, "Notion", h.notion ? "token configurado" : "falta NOTION_TOKEN")
      + row(h.anthropic, "Claude", h.anthropic ? "chave configurada" : "falta ANTHROPIC_API_KEY")
      + row(h.google, "Google Calendar", h.google ? "configurado no servidor" : "falta GOOGLE_CLIENT_ID / SECRET");
  } catch (e) { box.innerHTML = row(false, "Servidor", e.message); }
}
async function workouts() {
  const box = $("c-workouts"); box.innerHTML = `<p class="hint">Carregando…</p>`;
  try {
    const rows = await notion.query(DS.workouts, { sorts: [{ property: "Date", direction: "descending" }], page_size: 6 });
    if (!rows.length) { box.innerHTML = `<p class="hint">Nenhum treino encontrado. A integração tem acesso ao Workout Tracker?</p>`; return; }
    box.innerHTML = `<ul class="ios-list">${rows.map(r => {
      const p = r.properties, d = prop.date(p.Date), st = prop.select(p.Status);
      const when = d ? new Date(d.start.length > 10 ? d.start : d.start + "T12:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }) : "sem data";
      return `<li><span>${esc(prop.text(p.Name) || "Sem nome")}</span><span class="hint">${esc(st)} · ${esc(when)}</span></li>`;
    }).join("")}</ul>`;
  } catch (e) {
    const why = e instanceof ApiError && e.status === 404 ? "a integração do Notion não tem acesso à base Workouts" : e.message;
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
    msg(el, back.exists && back.data().at === at ? `Banco ok: gravado e lido de volta às ${new Date(at).toLocaleTimeString("pt-BR")}.` : "Gravou, mas a leitura não bateu.", back.exists ? "ok" : "err");
  } catch (e) { msg(el, "Falhou: " + (e.message || e), "err"); }
};

// ---------- importação (arquivo exportado do banco do artifact) ----------
$("imp-file").onchange = async e => {
  const f = e.target.files[0], el = $("imp-msg"); e.target.value = "";
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.formato !== "painel-docs" || !j.docs || typeof j.docs !== "object") throw new Error("este arquivo não é uma exportação do painel.");
    const entries = Object.entries(j.docs).filter(([p, d]) => /^[\w.~:@+-]+(\/[\w.~:@+-]+)*$/.test(p) && d && typeof d === "object");
    if (!entries.length) throw new Error("o arquivo não tem documentos.");
    const n = k => entries.filter(([p]) => p.startsWith(k)).length;
    if (!confirm(`Importar ${entries.length} documentos (${n("saude/nutricao/dias/")} dias de alimentação, ${n("saude/treinos/sessoes/")} treinos e configurações)?`)) return;
    msg(el, "Importando…");
    await db.bulkSet(entries, (i, t) => msg(el, `Importando… ${i} de ${t}`));
    msg(el, `Pronto: ${entries.length} documentos importados. Abra a aba Saúde.`, "ok");
  } catch (err) { msg(el, "Não consegui importar: " + (err.message || err), "err"); }
};

// ---------- início do app ----------
let started = false;
function show(signedIn) {
  $("login").hidden = signedIn; $("app").hidden = !signedIn; $("sb-blur").hidden = !signedIn; $("gear").hidden = !signedIn; $("side-open").hidden = !signedIn || !document.documentElement.classList.contains("side-closed");
  if (signedIn) {
    $("c-user").textContent = auth.user ? `Conectado como ${auth.user.email}.` : "";
    route(); if (!started) { started = true; checks(); workouts(); }
  }
}
(async () => {
  try { await init(); }
  catch (e) { $("login").hidden = false; msg($("l-msg"), e.message, "err"); $("login-email").querySelector("button").disabled = true; return; }
  show(!!auth.user);
  auth.onChange(s => show(!!s));
})();

// app instalável / offline: registra o service worker
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
