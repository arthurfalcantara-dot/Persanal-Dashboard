import { init, auth, api, notion, prop, db, ApiError } from "/data.js";

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
const NAMES = { inicio: "Início", saude: "Saúde & corpo", financas: "Finanças", self: "Self Improvement", carreira: "Carreira", estudos: "Leitura & estudos" };
const READY = { inicio: "view-inicio", saude: "view-saude" };
function route() {
  const tab = NAMES[(location.hash || "#inicio").slice(1)] ? (location.hash || "#inicio").slice(1) : "inicio";
  document.querySelectorAll(".tab").forEach(t => { if (t.dataset.tab === tab) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
  const vid = READY[tab] || "view-other";
  ["view-inicio", "view-saude", "view-other"].forEach(id => { $(id).style.display = id === vid ? "flex" : "none"; });
  if (vid === "view-other") $("ph-title").textContent = NAMES[tab];
  $("tb-title").textContent = NAMES[tab];
  document.title = NAMES[tab] + " · Painel";
  if (tab === "saude") loadSaude().then(() => window.dispatchEvent(new Event("painel:saude")));
  scrollTo(0, 0); onScroll();
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => { if (location.hash !== "#" + t.dataset.tab) location.hash = t.dataset.tab; else route(); }));
addEventListener("hashchange", route);

// barra superior compacta: aparece quando o título grande sai da tela (padrão do iOS)
function onScroll() { $("topbar").classList.toggle("on", scrollY > 56); }
addEventListener("scroll", onScroll, { passive: true });

// ---------- ponte com o código das abas do artifact ----------
// As abas vieram do painel no claude.ai e pedem o banco com window.claude.use("db").
// Aqui essa chamada devolve o banco do Supabase, com a mesma interface.
window.claude = { use: async cap => (cap === "db" && auth.user ? db : null) };
let saudeP = null;
function loadSaude() {
  return saudeP || (saudeP = new Promise((ok, bad) => {
    const s = document.createElement("script"); s.src = "/saude.js?v=2"; s.onload = ok; s.onerror = bad; document.body.appendChild(s);
  }));
}

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
    const h = await api("health");
    box.innerHTML = row(true, "Login", h.user) + row(true, "Servidor") + row(h.notion, "Notion", h.notion ? "token configurado" : "falta NOTION_TOKEN")
      + row(h.anthropic, "Claude (Coach)", h.anthropic ? "chave configurada" : "próxima etapa")
      + row(h.google, "Google Calendar", h.google ? "configurado" : "próxima etapa");
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
  $("login").hidden = signedIn; $("app").hidden = !signedIn; $("topbar").hidden = !signedIn;
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
