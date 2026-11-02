// Agenda: Google Calendar (leitura e escrita) + tarefas com data do Notion, no estilo do Calendário do iOS.
// Fala com /api/google/* (servidor) levando o token cifrado guardado no banco (docs: app/google).
import { api, db, notion, prop, ApiError } from "/data.js";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = s => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, k) => { const x = new Date(d); x.setDate(x.getDate() + k); return x; };
const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
const hm = s => new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const LS = { cals: "painel.agenda.cals", tasks: "painel.agenda.tasks", mode: "painel.agenda.mode" };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// tarefas com data no Notion (só as abertas), por base
const NT = [
  { ds: "1b9b0f63-2167-801f-b5ec-000b992d92ed", date: "Due Date", label: "Pessoal", done: p => prop.check(p.Done) },
  { ds: "1bab0f63-2167-801f-834c-000b29a34dcd", date: "Due Date", label: "Job Tasks", done: p => prop.check(p.Done) },
  { ds: "130b0f63-2167-8109-a7a8-000b63cf7957", date: "ETA", label: "Metas", done: p => prop.select(p.Status) === "Done" },
];

const A = {
  token: null, email: "", configured: null, cals: [], hidden: new Set(lsGet(LS.cals, [])), showTasks: lsGet(LS.tasks, true),
  mode: lsGet(LS.mode, "mes"), month: new Date(new Date().getFullYear(), new Date().getMonth(), 1), day: iso(new Date()),
  events: [], tasks: [], loadedRange: null, loading: false, err: "", editing: null,
};

// ---------- servidor ----------
async function g(op, body) {
  try { return await api(`google/${op}`, { method: "POST", body: Object.assign({ token: A.token }, body) }); }
  catch (e) {
    if (e instanceof ApiError && e.code === "google_reauth") { A.token = null; render(); }
    throw e;
  }
}

// volta do consentimento do Google: /#agenda&g=<token cifrado>&gemail=… ou &gerr=…
async function takeReturn() {
  const h = location.hash; if (!/[&?](g|gerr)=/.test(h)) return;
  const q = new URLSearchParams(h.slice(h.indexOf("&") + 1));
  history.replaceState(null, "", "#agenda");
  if (q.get("g")) {
    A.token = q.get("g"); A.email = q.get("gemail") || "";
    await db.doc("app/google").set({ token: A.token, email: A.email, conectadoEm: new Date().toISOString() });
    toast("Google Calendar conectado");
  } else {
    const why = { access_denied: "Você não autorizou o acesso.", state: "O pedido expirou. Tente de novo.", no_refresh: "O Google não devolveu acesso permanente. Remova o app em myaccount.google.com → Segurança → Apps de terceiros e conecte de novo.", not_configured: "Falta GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET no Cloudflare." }[q.get("gerr")];
    A.err = "Não conectei o Google Calendar: " + (why || q.get("gerr"));
  }
}

async function connect() {
  try { const r = await api("google/auth-url"); location.href = r.url; }
  catch (e) { A.err = e.message; render(); }
}
async function disconnect() {
  if (!confirm("Desconectar o Google Calendar deste app? Os eventos continuam no Google.")) return;
  await db.doc("app/google").delete(); A.token = null; A.cals = []; A.events = []; render();
}

// ---------- dados ----------
function range() {
  if (A.mode === "lista") { const s = parseDay(A.day); return [s, addDays(s, 30)]; }
  const first = A.month, start = addDays(first, -first.getDay());
  return [start, addDays(start, 42)];
}
async function load(force) {
  if (!A.token || A.loading) return;
  const [s, e] = range(), key = `${iso(s)}|${iso(e)}`;
  if (!force && A.loadedRange === key) return;
  A.loading = true; A.err = ""; render();
  try {
    if (!A.cals.length || force) { const r = await g("calendars"); A.cals = r.calendars; A.email = r.email || A.email; }
    const ids = A.cals.filter(c => !A.hidden.has(c.id)).map(c => c.id);
    const [ev, tk] = await Promise.all([
      ids.length ? g("events", { calendars: ids, de: s.toISOString(), ate: e.toISOString() }) : { events: [] },
      A.showTasks ? loadTasks(iso(s), iso(e)) : [],
    ]);
    A.events = ev.events; A.tasks = tk; A.loadedRange = key;
    if (ev.falhas && ev.falhas.length) A.err = `Não consegui ler ${ev.falhas.length} agenda(s).`;
  } catch (err) { A.err = err.message || String(err); }
  finally { A.loading = false; render(); }
}
async function loadTasks(de, ate) {
  const out = [];
  await Promise.all(NT.map(async b => {
    try {
      const rows = await notion.query(b.ds, { filter: { and: [{ property: b.date, date: { on_or_after: de } }, { property: b.date, date: { before: ate } }] }, page_size: 100 }, 3);
      for (const r of rows) {
        const p = r.properties, d = prop.date(p[b.date]);
        if (!d || b.done(p)) continue;
        out.push({ id: r.id, nome: prop.text(p.Name) || "(sem nome)", dia: d.start.length > 10 ? iso(new Date(d.start)) : d.start.slice(0, 10), base: b.label, url: r.url });
      }
    } catch { /* base sem acesso: segue sem ela */ }
  }));
  return out;
}

// ---------- tela ----------
const calOf = id => A.cals.find(c => c.id === id) || { cor: "var(--tint)", nome: "" };
function dayEvents(day) {
  const d0 = parseDay(day), d1 = addDays(d0, 1);
  return A.events.filter(e => {
    if (e.diaInteiro) return e.inicio <= day && day < e.fim;
    const s = new Date(e.inicio), f = new Date(e.fim);
    return s < d1 && f > d0;
  }).sort((a, b) => (b.diaInteiro - a.diaInteiro) || a.inicio.localeCompare(b.inicio));
}
const dayTasks = day => A.tasks.filter(t => t.dia === day);

function render() {
  const root = $("ag-root"); if (!root) return;
  if (A.configured === false) { root.innerHTML = setupHtml(); return; }
  if (!A.token) {
    root.innerHTML = `<section class="card ag-connect">
      <div class="ag-connect-ico" aria-hidden="true">${ICON.cal}</div>
      <h3>Conecte o Google Calendar</h3>
      <p class="hint">O app pede permissão para ver e editar os eventos das suas agendas. O acesso fica guardado cifrado e pode ser revogado a qualquer momento na sua Conta Google.</p>
      <button class="btn primary big" id="ag-connect" type="button">Conectar Google Calendar</button>
      ${A.err ? `<p class="msg err">${esc(A.err)}</p>` : ""}
    </section>`;
    $("ag-connect").onclick = connect; return;
  }
  const today = iso(new Date());
  root.innerHTML = `
    <div class="ag-bar">
      <div class="seg" id="ag-mode"><button data-m="mes" aria-pressed="${A.mode === "mes"}">Mês</button><button data-m="lista" aria-pressed="${A.mode === "lista"}">Lista</button></div>
      <button class="gbtn small" id="ag-today" type="button">Hoje</button>
      <button class="gbtn small" id="ag-cals-b" type="button" aria-expanded="false">Agendas</button>
      ${A.loading ? `<span class="pill">Atualizando…</span>` : ""}
    </div>
    <div class="card ag-cals" id="ag-cals" hidden>
      ${A.cals.map(c => `<label class="ag-cal"><input type="checkbox" data-cal="${esc(c.id)}" ${A.hidden.has(c.id) ? "" : "checked"}><i style="--c:${esc(c.cor)}"></i><span>${esc(c.nome)}</span>${c.escrita ? "" : `<small>só leitura</small>`}</label>`).join("")}
      <label class="ag-cal"><input type="checkbox" id="ag-tasks" ${A.showTasks ? "checked" : ""}><i class="sq"></i><span>Tarefas com data do Notion</span></label>
      <p class="hint">${A.email ? `Conta: ${esc(A.email)} · ` : ""}<button class="linkbtn" id="ag-disc" type="button">Desconectar</button></p>
    </div>
    ${A.err ? `<p class="banner">${esc(A.err)}</p>` : ""}
    ${A.mode === "mes" ? monthHtml(today) : listHtml(today)}
    <button class="btn primary fab ag-fab" id="ag-add" aria-label="Novo evento" title="Novo evento"><i class="ic" data-i="plus"></i></button>`;
  bind();
}

function monthHtml(today) {
  const [start] = range(), m = A.month.getMonth();
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i), k = iso(d), ev = dayEvents(k), tk = dayTasks(k);
    const dots = ev.slice(0, 3).map(e => `<i style="--c:${esc(calOf(e.cal).cor)}"></i>`).join("") + (tk.length ? `<i class="sq"></i>` : "");
    cells += `<button class="ag-d${d.getMonth() !== m ? " out" : ""}${k === today ? " today" : ""}${k === A.day ? " sel" : ""}" data-day="${k}" aria-label="${d.getDate()} de ${MES[d.getMonth()]}${ev.length ? `, ${ev.length} evento(s)` : ""}"><b>${d.getDate()}</b><span class="dots">${dots}</span></button>`;
  }
  const sel = parseDay(A.day);
  return `<section class="card ag-month">
      <div class="ag-mh"><button class="iconbtn" id="ag-prev" aria-label="Mês anterior">‹</button><h3>${MES[m]} <span>${A.month.getFullYear()}</span></h3><button class="iconbtn" id="ag-next" aria-label="Próximo mês">›</button></div>
      <div class="ag-grid">${DOW.map(x => `<span class="ag-w">${x}</span>`).join("")}${cells}</div>
    </section>
    <section class="card ag-day">
      <h3 class="sec">${sel.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</h3>
      ${dayList(A.day)}
    </section>`;
}
function listHtml(today) {
  const s = parseDay(A.day); let h = "";
  for (let i = 0; i < 30; i++) {
    const k = iso(addDays(s, i)); const ev = dayEvents(k), tk = dayTasks(k);
    if (!ev.length && !tk.length && k !== today) continue;
    const d = parseDay(k);
    h += `<section class="card ag-day"><h3 class="sec${k === today ? " is-today" : ""}">${k === today ? "Hoje · " : ""}${d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</h3>${dayList(k)}</section>`;
  }
  return h || `<section class="card"><p class="empty">Nada nos próximos 30 dias.</p></section>`;
}
function dayList(k) {
  const ev = dayEvents(k), tk = dayTasks(k);
  if (!ev.length && !tk.length) return `<p class="empty">${A.loading ? "Carregando…" : "Nenhum evento."}</p>`;
  return `<ul class="ag-list">${ev.map(e => {
    const c = calOf(e.cal), when = e.diaInteiro ? "dia inteiro" : `${hm(e.inicio)}<br><small>${hm(e.fim)}</small>`;
    return `<li><button class="ag-ev" data-ev="${esc(e.id)}" data-cal="${esc(e.cal)}" style="--c:${esc(c.cor)}"><span class="t">${when}</span><span class="b"><b>${esc(e.titulo)}</b>${e.local ? `<small>${esc(e.local)}</small>` : ""}${e.meet ? `<small>Google Meet</small>` : ""}</span></button></li>`;
  }).join("")}${tk.map(t => `<li><a class="ag-task" href="${esc(t.url)}" target="_blank" rel="noopener"><span class="t"><i class="box"></i></span><span class="b"><b>${esc(t.nome)}</b><small>${esc(t.base)} · Notion</small></span></a></li>`).join("")}</ul>`;
}

function bind() {
  document.querySelectorAll("#ag-mode button").forEach(b => b.onclick = () => { A.mode = b.dataset.m; lsSet(LS.mode, A.mode); A.loadedRange = null; render(); load(); });
  $("ag-today").onclick = () => { const t = new Date(); A.day = iso(t); A.month = new Date(t.getFullYear(), t.getMonth(), 1); A.loadedRange = null; render(); load(); };
  $("ag-cals-b").onclick = () => { const p = $("ag-cals"); p.hidden = !p.hidden; $("ag-cals-b").setAttribute("aria-expanded", String(!p.hidden)); };
  document.querySelectorAll("[data-cal][type=checkbox]").forEach(x => x.onchange = () => {
    if (x.checked) A.hidden.delete(x.dataset.cal); else A.hidden.add(x.dataset.cal);
    lsSet(LS.cals, [...A.hidden]); A.loadedRange = null; load();
  });
  $("ag-tasks").onchange = e => { A.showTasks = e.target.checked; lsSet(LS.tasks, A.showTasks); A.loadedRange = null; load(); };
  $("ag-disc").onclick = disconnect;
  if ($("ag-prev")) {
    const move = k => { A.month = new Date(A.month.getFullYear(), A.month.getMonth() + k, 1); A.loadedRange = null; render(); load(); };
    $("ag-prev").onclick = () => move(-1); $("ag-next").onclick = () => move(1);
    document.querySelectorAll(".ag-d").forEach(b => b.onclick = () => {
      A.day = b.dataset.day; const d = parseDay(A.day);
      if (d.getMonth() !== A.month.getMonth()) { A.month = new Date(d.getFullYear(), d.getMonth(), 1); A.loadedRange = null; render(); load(); } else render();
    });
    swipe(document.querySelector(".ag-month"), k => $(k > 0 ? "ag-next" : "ag-prev").click());
  }
  document.querySelectorAll(".ag-ev").forEach(b => b.onclick = () => openSheet(A.events.find(e => e.id === b.dataset.ev && e.cal === b.dataset.cal)));
  $("ag-add").onclick = () => openSheet(null);
}
// deslizar o mês para os lados
function swipe(el, fn) {
  if (!el) return; let x0 = null, y0 = 0;
  el.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) fn(dx < 0 ? 1 : -1); }, { passive: true });
}

// ---------- criar / editar ----------
function openSheet(ev) {
  A.editing = ev;
  const writable = A.cals.filter(c => c.escrita && !A.hidden.has(c.id));
  if (!ev && !writable.length) { toast("Nenhuma agenda com permissão de escrita visível."); return; }
  const day = A.day, now = new Date(), h = pad(Math.min(22, now.getHours() + 1));
  const v = ev ? {
    titulo: ev.titulo, local: ev.local, notas: ev.notas, diaInteiro: ev.diaInteiro, cal: ev.cal,
    di: ev.inicio.slice(0, 10), hi: ev.diaInteiro ? "09:00" : hm(ev.inicio),
    df: ev.diaInteiro ? iso(addDays(parseDay(ev.fim), -1)) : iso(new Date(ev.fim)), hf: ev.diaInteiro ? "10:00" : hm(ev.fim),
  } : { titulo: "", local: "", notas: "", diaInteiro: false, cal: (writable.find(c => c.principal) || writable[0]).id, di: day, hi: `${h}:00`, df: day, hf: `${pad(Math.min(23, +h + 1))}:00` };
  const canEdit = !ev || (calOf(ev.cal).escrita);
  const m = $("ag-sheet");
  m.innerHTML = `<form class="modal-box ag-form" id="ag-form">
      <div class="modal-head"><button class="btn ghost" type="button" id="ag-cancel">Cancelar</button><h3>${ev ? (canEdit ? "Editar evento" : "Evento") : "Novo evento"}</h3>${canEdit ? `<button class="btn ghost strong" type="submit" id="ag-save">${ev ? "Salvar" : "Adicionar"}</button>` : `<span></span>`}</div>
      <div class="group-ios">
        <input id="af-t" placeholder="Título" value="${esc(v.titulo)}" ${canEdit ? "" : "readonly"} required>
        <input id="af-l" placeholder="Local ou link da chamada" value="${esc(v.local)}" ${canEdit ? "" : "readonly"}>
      </div>
      <div class="group-ios">
        <label class="row"><span>Dia inteiro</span><input type="checkbox" class="switch" id="af-all" ${v.diaInteiro ? "checked" : ""} ${canEdit ? "" : "disabled"}></label>
        <label class="row"><span>Início</span><span class="dt"><input type="date" id="af-di" value="${v.di}" ${canEdit ? "" : "readonly"}><input type="time" id="af-hi" value="${v.hi}" ${canEdit ? "" : "readonly"}></span></label>
        <label class="row"><span>Fim</span><span class="dt"><input type="date" id="af-df" value="${v.df}" ${canEdit ? "" : "readonly"}><input type="time" id="af-hf" value="${v.hf}" ${canEdit ? "" : "readonly"}></span></label>
      </div>
      <div class="group-ios">
        <label class="row"><span>Agenda</span><select id="af-c" ${ev || !canEdit ? "disabled" : ""}>${(ev ? [calOf(ev.cal)] : writable).map(c => `<option value="${esc(c.id)}" ${c.id === v.cal ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></label>
      </div>
      <div class="group-ios"><textarea id="af-n" rows="4" placeholder="Notas" ${canEdit ? "" : "readonly"}>${esc(v.notas)}</textarea></div>
      ${ev ? `<div class="group-ios ag-links">${ev.meet ? `<a href="${esc(ev.meet)}" target="_blank" rel="noopener">Entrar no Google Meet</a>` : ""}<a href="${esc(ev.link)}" target="_blank" rel="noopener">Abrir no Google Calendar</a>${ev.recorrente ? `<p class="hint">Evento recorrente: as mudanças valem só para esta ocorrência.</p>` : ""}</div>` : ""}
      ${ev && canEdit ? `<button class="gbtn danger big" type="button" id="ag-del">Apagar evento</button>` : ""}
      <p class="msg" id="af-msg" hidden></p>
    </form>`;
  m.hidden = false;
  const sync = () => { const all = $("af-all").checked; $("af-hi").hidden = all; $("af-hf").hidden = all; };
  sync(); $("af-all").onchange = sync;
  $("af-di").onchange = () => { if ($("af-df").value < $("af-di").value) $("af-df").value = $("af-di").value; };
  $("ag-cancel").onclick = closeSheet;
  m.onclick = e => { if (e.target === m) closeSheet(); };
  $("ag-form").onsubmit = save;
  if ($("ag-del")) $("ag-del").onclick = del;
  setTimeout(() => !ev && $("af-t").focus(), 80);
}
function closeSheet() { $("ag-sheet").hidden = true; A.editing = null; }
const fmsg = (t, kind) => { const el = $("af-msg"); el.textContent = t || ""; el.hidden = !t; el.className = "msg" + (kind ? " " + kind : ""); };
async function save(e) {
  e.preventDefault();
  const all = $("af-all").checked, di = $("af-di").value, df = $("af-df").value || di;
  const evento = { titulo: $("af-t").value.trim(), local: $("af-l").value.trim(), notas: $("af-n").value, diaInteiro: all, fuso: TZ,
    inicio: all ? di : `${di}T${$("af-hi").value}`, fim: all ? df : `${df}T${$("af-hf").value}` };
  if (!evento.titulo) return fmsg("Escreva um título.", "err");
  if (evento.fim < evento.inicio) return fmsg("O fim está antes do início.", "err");
  const btn = $("ag-save"); btn.disabled = true; fmsg("Salvando…");
  try {
    if (A.editing) await g("update", { cal: A.editing.cal, id: A.editing.id, evento });
    else await g("create", { cal: $("af-c").value, evento });
    closeSheet(); toast(A.editing ? "Evento atualizado" : "Evento adicionado ao Google Calendar");
    A.day = di; await load(true);
  } catch (err) { fmsg(err.message || "Não consegui salvar.", "err"); btn.disabled = false; }
}
async function del() {
  if (!confirm("Apagar este evento do Google Calendar?")) return;
  try { await g("delete", { cal: A.editing.cal, id: A.editing.id }); closeSheet(); toast("Evento apagado"); await load(true); }
  catch (err) { fmsg(err.message || "Não consegui apagar.", "err"); }
}

let toastT; function toast(t) { const el = $("toast"); if (!el) return; el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3000); }

function setupHtml() {
  return `<section class="card ag-setup">
    <h3>Falta configurar o Google no Cloudflare</h3>
    <p class="hint">O servidor do app ainda não tem <b>GOOGLE_CLIENT_ID</b> e <b>GOOGLE_CLIENT_SECRET</b>. O passo a passo está no README do projeto (seção Google Calendar). Depois de cadastrar as duas variáveis, refaça o deploy e volte aqui.</p>
  </section>`;
}
const ICON = { cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>' };

// ---------- início ----------
let started = false;
async function start() {
  if (!started) {
    started = true;
    try { A.configured = !!(await api("health")).google; } catch { A.configured = null; }
    try { const d = await db.doc("app/google").get(); if (d.exists) { A.token = d.data().token; A.email = d.data().email || ""; } } catch {}
    await takeReturn();
  } else await takeReturn();
  render(); load();
}
window.painelAgenda = { start, refresh: () => load(true) };
