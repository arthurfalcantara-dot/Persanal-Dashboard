/* ===================== Calendário (portado do painel do claude.ai) ===================== */
/* ===================== Calendário ===================== */
// Junta num calendário só o que tem data no painel: tarefas pessoais, Job Tasks, prazos de candidatura,
// oportunidades acadêmicas, tarefas e prazos de metas, hábitos, treinos (do banco do painel) e lançamentos
// agendados de finanças. Arrastar muda a data no Notion; clicar abre a ficha; clicar num dia vazio cria uma tarefa.
(() => {
  const NOTION = "Notion", T_QUERY = "notion-query-data-sources", T_UPDATE = "notion-update-page", T_CREATE = "notion-create-pages";
  const VIEWS = {
    ptask: "https://www.notion.so/1b9b0f6321678028a04fed46d23bea1b?v=1b9b0f6321678010a561000c70275d73",
    jtask: "https://www.notion.so/1bab0f6321678078ad4ef7317ad56e40?v=378b0f6321678097816f000cd0e2767e",
    apps: "https://www.notion.so/130b0f63216780c1a08ed64e69578509?v=6342a2d6a24b45329c8fcac4d4e3905c",
    acad: "https://www.notion.so/438e1928727743a9be01b3b7360ec029?v=b97a482d5a9b4f579d509160c1cf9972",
    devtask: "https://www.notion.so/130b0f63216781a296ebdab70695e655?v=130b0f6321678177be8f000c08385fdc",
    goal: "https://www.notion.so/130b0f63216781aeaf30dcbc406ace45?v=130b0f63216781a0bc48000ca19ab18c",
    habit: "https://www.notion.so/3ecb0f632167809fa7dbf3d5f903a3d4?v=3ecb0f632167811a8975000cb9d08571",
    fin: "https://www.notion.so/9e0b0f632167829ab437017a91bf14aa?v=3e6b0f63216781168060000c8a352b20",
  };
  const DS = { ptask: "1b9b0f63-2167-801f-b5ec-000b992d92ed", jtask: "1bab0f63-2167-801f-834c-000b29a34dcd", proj: "1d5b0f63-2167-81cf-a0f7-000ba782d68a", assign: "1bcb0f63-2167-81f7-b2fe-000b91c0aa2e", stask: "303b0f63-2167-81ff-86ed-000bc4d61c7d", devtask: "130b0f63-2167-8109-a7a8-000b63cf7957", read: "1bdb0f63-2167-814c-84fd-000b7b2e5e4f" };
  // bases do Notion para onde um item pode ir (trocar de calendário) e de onde pode sair
  const MOVE_TO = ["ptask", "devtask", "proj", "assign", "stask", "jtask"];
  const MOVE_FROM = MOVE_TO.concat(["ineuEv", "ineuTk", "read"]);
  // excluir pela tecla Delete (item sob o cursor): só tarefas e eventos, nunca candidaturas, metas ou finanças
  const DEL_KEY_OK = MOVE_FROM.concat(["workout", "run"]);
  // bases do Notion que o Notion Calendar mostra e que o painel não tinha: lidas por uma view sem filtro de data,
  // com o título, a(s) propriedade(s) de data e a forma de marcar como feito de cada uma
  const NDB = {
    proj:    { views: ["https://www.notion.so/1d5b0f6321678164ac6fc553b487a86c?v=1d5b0f63216781aea182000c3ffe1358", "https://www.notion.so/1d5b0f6321678164ac6fc553b487a86c?v=1d5b0f63216781b880e6000c25f726f6"], title: "Name", props: ["Date"], done: { k: "check", p: "Complete" } },
    ineuEv:  { views: ["https://www.notion.so/599b0f632167824baa400146cdcd29f8?v=2afb0f63216783e3bb4208e9c50b274d"], title: "Name", props: ["Date", "Due Date"], done: { k: "status", yes: ["Complete"], closed: ["Not Done"], on: "Complete", off: "Not Started" } },
    ineuTk:  { views: ["https://www.notion.so/08cb0f6321678298a02e81166123caa9?v=f5bb0f63216783b49f6b88b14154e6d9"], title: "", props: ["Due Date"], done: { k: "status", yes: ["Feito"], on: "Feito", off: "Não Iniciada" } },
    assign:  { views: ["https://www.notion.so/1bcb0f632167814bb1f5f87044481162?v=1bcb0f63216781bb9411000c938c5ae6"], title: "Title", props: ["Due Date"], done: { k: "status", yes: ["Complete"], closed: ["Not Done"], on: "Complete", off: "Not Started" } },
    stask:   { views: ["https://www.notion.so/303b0f63216780da882bd320f85719d5?v=303b0f63216781659084000c02b72e3a"], title: "Title", props: ["Due Date"], done: { k: "status", yes: ["Complete"], on: "Complete", off: "Not Started" } },
    read:    { views: ["https://www.notion.so/1bdb0f63216780369caef74924fc8395?v=1bdb0f632167813885f8000cd1661c44"], title: "Title", props: ["Due Date"], done: { k: "status", yes: ["Complete"], closed: ["Not Read"], on: "Complete", off: "Not Started" } },
    workout: { views: ["https://www.notion.so/1bcb0f63216781a0b10cdc55c7d07a00?v=1bcb0f632167810b80c6000ce6cf83b5"], title: "Name", props: ["Date"], done: { k: "status", yes: ["Done"], on: "Done", off: "Not Done" } },
    run:     { views: ["https://www.notion.so/1bcb0f6321678110982de769d0d89896?v=3feb0f632167816c856e000c3217e3f3"], title: "Name", props: ["Date"], done: { k: "status", yes: ["Completed"], closed: ["Cancelled"], on: "Completed", off: "Planned" } },
  };
  // fontes: rótulo, cor, aba do painel, propriedade de data, se aceita hora, como marcar feito.
  // Nomes e cores seguem o Notion Calendar; o que só existe no painel vem depois.
  const SRC = {
    ptask:   { l: "Personal Tasks", c: "var(--n-green)", tab: "self", prop: "Due Date", time: true, done: "check" },
    devtask: { l: "Personal Improvement Tasks", c: "var(--n-green)", tab: "self", prop: "ETA", time: true, done: "status" },
    proj:    { l: "Project Tasks", c: "var(--n-red)", tab: null, prop: "Date", time: true, done: "n" },
    ineuEv:  { l: "Eventos Repositório INEU", c: "var(--n-sky)", tab: null, prop: "Date", time: true, done: "n" },
    ineuTk:  { l: "Tarefas Repositório INEU", c: "var(--n-sky)", tab: null, prop: "Due Date", time: true, done: "n" },
    assign:  { l: "Assignments/Exams", c: "var(--n-blue)", tab: null, prop: "Due Date", time: true, done: "n" },
    stask:   { l: "Student Tasks", c: "var(--n-blue)", tab: null, prop: "Due Date", time: true, done: "n" },
    read:    { l: "Student Readings", c: "var(--n-gray)", tab: null, prop: "Due Date", time: true, done: "n" },
    jtask:   { l: "Job Applications Tasks", c: "var(--n-orange)", tab: "carreira", prop: "Date", time: true, done: "check" },
    prazo:   { l: "Job Application Tracker", c: "var(--n-brown)", tab: "carreira", prop: "Date", time: false, done: null },
    workout: { l: "Workouts", c: "var(--musc)", tab: "saude", prop: "Date", time: true, done: "n" },
    run:     { l: "Runs", c: "var(--n-purple)", tab: "saude", prop: "Date", time: true, done: "n" },
    acad:    { l: "Oportunidades acadêmicas", c: "var(--n-pink)", tab: "carreira", prop: "Prazo", time: false, done: null },
    goal:    { l: "Prazos de metas", c: "var(--n-pink)", tab: "self", prop: null, time: false, done: null },
    habit:   { l: "Hábitos", c: "var(--n-yellow)", tab: "self", prop: null, time: false, done: "habit" },
    treino:  { l: "Treinos do painel", c: "var(--n-purple)", tab: "saude", prop: null, time: false, done: null },
    fin:     { l: "Finanças agendadas", c: "var(--exp)", tab: "financas", prop: "Date", time: false, done: null },
  };
  const N_ORDER = ["ptask", "devtask", "proj", "ineuEv", "ineuTk", "assign", "stask", "read", "jtask", "prazo", "workout", "run"];
  const P_ORDER = ["acad", "goal", "habit", "treino", "fin"];
  const ORDER = N_ORDER.concat(P_ORDER); // as agendas do Google entram no fim, quando forem lidas
  // Google Calendar: o conector não informa a cor de cada agenda; usa a paleta do Google e deixa trocar na ficha
  const GCAL = "Google Calendar";
  // cores das agendas como estão no Notion Calendar (o conector do Google não informa a cor)
  const GCOLOR = { "1. Pessoal": "#4cc38a", "4. San Tiago Dantas": "#4aaee6", "4. MLog": "#4a84ee", "9. Estágio": "#9b5cf0", "5. Eventos": "#f4c03f", "9. Trabalho": "#c2357f", "6. Cursos e Linguas": "#2e7e98", "Holidays in Brazil": "#efb531" };
  const GPAL = ["#039be5", "#33b679", "#8e24aa", "#e67c73", "#f6bf26", "#f4511e", "#7986cb", "#0b8043", "#3f51b5", "#d50000", "#616161"];
  const PREF_KEY = "painel-cal-v1";
  const MON = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const MON3 = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const DOWS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
  const DOW_KEYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
  const H0 = 0, H1 = 24, VIS = [7, 20]; let HPX = (() => { try { return +localStorage.getItem("painel.cal.hpx") || 46; } catch { return 46; } })(); // altura de 1 hora (zoom − / +) // grade de horas da semana: 0h à meia-noite seguinte

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = s => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, k) => { const x = new Date(d); x.setDate(x.getDate() + k); return x; };
  const shift = (s, k) => iso(addDays(parseISO(s), k));
  const monday = d => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
  const dowIdx = s => (parseISO(s).getDay() + 6) % 7;
  const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const minsOf = d => d.getHours() * 60 + d.getMinutes();
  // id da página no link do Notion: o último bloco de 32 hex (ou UUID) do caminho, isolado. Pegar o primeiro bloco
  // juntava letras a–f do fim do título ao id ("Decade-1a2b…" → id errado → o Notion responde "não encontrada").
  const pageId = u => { const s = String(u || "").split(/[?#]/)[0]; const uu = [...s.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)].pop(); if (uu) return uu[0].replace(/-/g, "").toLowerCase(); const h = [...s.matchAll(/(?:^|[^0-9a-f])([0-9a-f]{32})(?![0-9a-f])/gi)].pop(); return h ? h[1].toLowerCase() : null; };
  const rel = v => { if (!v) return []; if (Array.isArray(v)) return v.map(pageId).filter(Boolean); try { const a = JSON.parse(v); return (Array.isArray(a) ? a : [a]).map(pageId).filter(Boolean); } catch { return [pageId(v)].filter(Boolean); } };
  const clean = s => String(s ?? "").replace(/\*\*/g, "").replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
  const fmtR = v => "R$ " + Math.round(Math.abs(v)).toLocaleString("pt-BR");
  const localIso = (day, t) => { const d = new Date(`${day}T${t}:00`), off = -d.getTimezoneOffset(), sg = off >= 0 ? "+" : "-", ab = Math.abs(off); return `${day}T${t}:00${sg}${pad(Math.floor(ab / 60))}:${pad(ab % 60)}`; };
  const todayISO = () => iso(new Date());
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let pref = { view: "month", off: ["prazo"], gc: {}, v: 2 };
  try { const p = JSON.parse(localStorage.getItem(PREF_KEY) || "null"); if (p && p.view) { pref = Object.assign({ view: "month", off: [], gc: {} }, p); } else if (window.matchMedia("(max-width: 640px)").matches) pref.view = "agenda"; } catch {}
  if (pref.v !== 2) { if (!pref.off.includes("prazo")) pref.off.push("prazo"); pref.v = 2; }
  pref.gc = pref.gc || {}; pref.sc = pref.sc || {}; pref.gx = pref.gx || {};
  if (pref.mgr === undefined) pref.mgr = !window.matchMedia("(max-width: 900px)").matches;
  const DEFC = {}; for (const k in SRC) { DEFC[k] = SRC[k].c; if (pref.sc[k]) SRC[k].c = pref.sc[k]; }
  // onde abrir cada base: a própria base no Notion (sem a view), ou a aba do painel
  const SURL = { ptask: VIEWS.ptask, jtask: VIEWS.jtask, prazo: VIEWS.apps, acad: VIEWS.acad, devtask: VIEWS.devtask, goal: VIEWS.goal, habit: VIEWS.habit, fin: VIEWS.fin };
  for (const k in NDB) SURL[k] = NDB[k].views[0];
  const savePref = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch {} };
  const S = { started: false, loading: false, mcp: null, db: null, cursor: todayISO(), ev: [], habits: [], finPast: {}, sess: [], hcfg: null, err: {}, loadedAt: null, apps: [], drag: null, busy: new Set(), g: { cals: [], ev: [], from: null, to: null, loading: false, err: null, ok: false } };
  const on = k => !pref.off.includes(k);

  // ---------- leitura ----------
  function payloadOf(res) { let p = res && (res.payload ?? res.content?.[0]?.text); if (typeof p === "string") { try { p = JSON.parse(p); } catch { /* texto */ } } return p; }
  async function call(tool, input, opts) {
    try { return await S.mcp.callTool(NOTION, tool, input, opts); }
    catch (e) { if (e && e.retryable) { await new Promise(r => setTimeout(r, (e.retryAfterMs || 1200) + Math.random() * 600)); return await S.mcp.callTool(NOTION, tool, input, opts); } throw e; }
  }
  // views ordenadas da data mais nova para a mais velha (finanças, hábitos) param ao passar de stopBefore
  async function queryView(view, maxPages, stopBefore, dateOf) {
    const out = []; let cursor = null, page = 0;
    do {
      const data = { mode: "view", view_url: view, page_size: 100 };
      if (cursor) data.start_cursor = cursor;
      const p = payloadOf(await call(T_QUERY, { data }, { cache: { staleTime: 60000 } }));
      if (!p || !Array.isArray(p.results)) throw { code: "tool_error", message: "resposta inesperada de uma view do Notion" };
      out.push(...p.results);
      let stop = false;
      if (stopBefore && dateOf) { const last = p.results.map(dateOf).filter(Boolean).sort()[0]; if (last && last < stopBefore) stop = true; }
      cursor = p.has_more && !stop ? p.next_cursor : null; page++;
    } while (cursor && page < maxPages);
    return out;
  }
  const rawD = (r, p) => r[`date:${p}:start`] ? { s: r[`date:${p}:start`], e: r[`date:${p}:end`] || null, dt: r[`date:${p}:is_datetime`] === 1 } : null;
  // evento a partir de uma data do Notion: dia local, hora local (se houver) e fim
  function when(raw) {
    if (!raw || !raw.s) return null;
    if (raw.dt && raw.s.length > 10) {
      const a = new Date(raw.s), b = raw.e && raw.e.length > 10 ? new Date(raw.e) : null;
      return { day: iso(a), allDay: false, start: a, end: b && b > a ? b : new Date(a.getTime() + 60 * 60000) };
    }
    return { day: raw.s.slice(0, 10), allDay: true, endDay: raw.e ? raw.e.slice(0, 10) : null };
  }
  const mk = (src, r, w, title, extra) => w ? Object.assign({ key: src + ":" + pageId(r.url), id: pageId(r.url), url: r.url, src, title: title || "(sem nome)", done: false, raw: null, row: r }, w, extra || {}) : null;

  const NORM = {
    ptask: r => mk("ptask", r, when(rawD(r, "Due Date")), clean(r.Name), { done: r.Done === "__YES__", raw: rawD(r, "Due Date"), meta: clean(r.Priority) }),
    jtask: r => mk("jtask", r, when(rawD(r, "Date")), clean(r.Name), { done: r.Done === "__YES__", raw: rawD(r, "Date"), meta: clean(r.Etapa), parent: rel(r["Parent task"])[0] || null }),
    apps: r => (r.Status || "Not Applied") === "Not Applied" ? mk("prazo", r, when(rawD(r, "Date")), "Prazo · " + clean(r.Name), { raw: rawD(r, "Date"), meta: "Não aplicada" }) : null,
    acad: r => ["Aprovado", "Recusado", "Encerrado"].includes(r.Status) ? null : mk("acad", r, when(rawD(r, "Prazo")), "Prazo · " + clean(r.Name), { raw: rawD(r, "Prazo"), meta: [clean(r.Tipo), clean(r.Status)].filter(Boolean).join(" · ") }),
    devtask: r => { const p = r["date:ETA:start"] ? "ETA" : "Due Date"; return mk("devtask", r, when(rawD(r, p)), clean(r.Name), { done: r.Status === "Done", raw: rawD(r, p), prop: p, meta: clean(r.Status), stname: clean(r.Status) }); },
    goal: r => { const end = r["date:Timeline:end"] || r["date:Timeline:start"]; return r.Status === "Done" || !end ? null : mk("goal", r, { day: end.slice(0, 10), allDay: true }, "Meta · " + clean(r.Name), { meta: r["date:Timeline:start"] ? `Prazo final da meta (início ${r["date:Timeline:start"].slice(8, 10)}/${r["date:Timeline:start"].slice(5, 7)})` : "Prazo da meta" }); },
  };
  function normN(k, r) {
    const n = NDB[k], p = n.props.find(x => r[`date:${x}:start`]) || n.props[0], raw = rawD(r, p);
    const st = n.done.k === "check" ? r[n.done.p] === "__YES__" : [...n.done.yes, ...(n.done.closed || [])].includes(r.Status);
    return mk(k, r, when(raw), clean(r[n.title]), { done: st, raw, prop: p, meta: n.done.k === "status" ? clean(r.Status) : "", stname: n.done.k === "status" ? clean(r.Status) : "" });
  }
  for (const k in NDB) NORM[k] = r => normN(k, r);
  function habitOf(r) {
    const d = r["date:Date:start"]; if (!d) return null;
    const day = r["date:Date:is_datetime"] === 1 && d.length > 10 ? iso(new Date(d)) : d.slice(0, 10);
    return { id: pageId(r.url), url: r.url, name: clean(r.Name), day, done: r.Status === "Done" };
  }
  function finOf(r) {
    if (r["Ignorar no painel"] === "__YES__") return null;
    const d = r["date:Date:start"]; if (!d) return null;
    const amt = Number(r.Amount) || 0; if (!amt) return null;
    const inc = r.Category === "Renda";
    return { id: pageId(r.url), url: r.url, name: clean(r.Name), day: d.slice(0, 10), amt, inc, cat: clean(r.Category), sub: clean(r.Subcategory), raw: rawD(r, "Date") };
  }

  async function load(force) {
    if (S.loading) return;
    S.loading = true; setStatus("Lendo o Notion…", "");
    try {
      const mcp = S.mcp || await window.claude?.use?.("mcp");
      if (!mcp) { setStatus("Sem conexão com o Notion", "warn"); banner("Entre no app para ver e editar o calendário."); return; }
      S.mcp = mcp;
      if (force) { try { await mcp.invalidate(NOTION, T_QUERY); } catch {} }
      const back = shift(todayISO(), -120);
      const jobs = {
        ptask: () => queryView(VIEWS.ptask, 30), jtask: () => queryView(VIEWS.jtask, 20), apps: () => queryView(VIEWS.apps, 10), acad: () => queryView(VIEWS.acad, 10),
        devtask: () => queryView(VIEWS.devtask, 20), goal: () => queryView(VIEWS.goal, 5),
        ...Object.fromEntries(Object.keys(NDB).map(k => [k, async () => (await Promise.all(NDB[k].views.map(v => queryView(v, 15)))).flat()])),
        habit: () => queryView(VIEWS.habit, 40, back, r => r["date:Date:start"] ? r["date:Date:start"].slice(0, 10) : null),
        fin: () => queryView(VIEWS.fin, 12, back, r => r["date:Date:start"] ? r["date:Date:start"].slice(0, 10) : null),
      };
      gLoad(force); // Google em paralelo, com estado próprio
      const keys = Object.keys(jobs), res = await Promise.allSettled(keys.map(k => jobs[k]()));
      const ev = [], err = {};
      res.forEach((r, i) => {
        const k = keys[i];
        if (r.status !== "fulfilled") { err[k] = r.reason; return; }
        if (k === "habit") { S.habits = r.value.map(habitOf).filter(Boolean); return; }
        if (k === "fin") {
          const rows = r.value.map(finOf).filter(Boolean), t = todayISO(), past = {};
          for (const f of rows) {
            if (f.day > t) ev.push({ key: "fin:" + f.id, id: f.id, url: f.url, src: "fin", title: `${f.inc ? "+" : "−"} ${fmtR(f.amt)} · ${f.name}`, day: f.day, allDay: true, raw: f.raw, meta: [f.cat, f.sub].filter(Boolean).join(" · "), inc: f.inc });
            else if (!f.inc) past[f.day] = (past[f.day] || 0) + f.amt;
          }
          S.finPast = past; return;
        }
        if (k === "apps") S.appNames = Object.fromEntries(r.value.map(x => [pageId(x.url), clean(x.Name)]));
        if (k === "apps") S.apps = r.value.filter(x => x.Status !== "Done").map(x => ({ id: pageId(x.url), url: x.url, name: clean(x.Name) })).filter(a => a.id);
        for (const row of r.value) { const e = NORM[k](row); if (e) ev.push(e); }
      });
      // job tasks: subtarefas sem data não aparecem; as com data, sim
      S.ev = ev; S.err = err; S.loadedAt = Date.now();
      const failed = Object.keys(err);
      if (failed.length === keys.length) { setStatus("Falha ao ler o Notion", "err"); banner(errCopy(err[keys[0]])); }
      else if (failed.length) { setStatus("Notion · leitura parcial", "warn"); banner(`Não consegui ler: ${failed.map(k => (SRC[k === "apps" ? "prazo" : k] || {}).l || k).join(", ")}. ${errCopy(err[failed[0]])}`); }
      else { setStatus(`Notion · ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, "live"); banner(null); }
      render();
      loadProj();
    } finally { S.loading = false; }
  }
  async function initDb() {
    try {
      const db = await window.claude?.use?.("db");
      if (!db) return;
      S.db = db;
      db.collection("saude/treinos/sessoes").limit(1000).onSnapshot(q => { S.sess = q.docs.map(d => Object.assign({ id: d.id }, d.data())); if (S.started) render(); }, () => {});
      db.doc("saude/config").onSnapshot(s => { S.hcfg = s.exists ? s.data() : null; if (S.started) render(); }, () => {});
    } catch { /* treinos ficam de fora */ }
  }
  function errCopy(e) {
    switch (e && e.code) {
      case "needs_reauth": return "O Notion recusou o token do app. Confira NOTION_TOKEN no Cloudflare.";
      case "server_not_connected": return "O conector do Notion não está ativo na sua conta.";
      case "not_in_manifest": case "consent_required": return "O painel ainda não tem permissão para usar o Notion. Clique em Atualizar e permita o acesso.";
      case "blocked_by_policy": case "approval_required": return "A política da sua organização bloqueou o acesso deste painel ao Notion.";
      case "server_unavailable": return "O Notion não respondeu agora. Tente Atualizar em alguns segundos.";
      case "tool_error": return "O Notion recusou a operação: " + (e.message || "sem detalhe") + ".";
      case "no_mcp": return "Entre no app para gravar no Notion.";
      default: return "Não consegui falar com o Notion (" + ((e && e.code) || "erro") + "). Tente Atualizar.";
    }
  }
  function setStatus(t, k) { const el = $("cal-status"); if (!el) return; el.textContent = t; el.className = "pill" + (k ? " " + k : ""); }
  function banner(t) { const el = $("cal-banner"); if (!el) return; el.hidden = !t; el.textContent = t || ""; }
  function toast(t) { const el = $("toast"); if (!el) return; el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2800); }

  // ---------- Google Calendar ----------
  async function gcall(tool, input, opts) {
    try { return await S.mcp.callTool(GCAL, tool, input, opts); }
    catch (e) { if (e && e.retryable && tool.startsWith("list")) { await new Promise(r => setTimeout(r, (e.retryAfterMs || 1200) + Math.random() * 600)); return await S.mcp.callTool(GCAL, tool, input, opts); } throw e; }
  }
  const gKey = id => "g:" + id;
  function gRegister() {
    S.g.cals.forEach((c, i) => {
      const k = gKey(c.id), ro = !["owner", "writer"].includes(c.role || "owner");
      DEFC[k] = GCOLOR[c.name] || GPAL[i % GPAL.length];
      SRC[k] = { l: c.name, c: pref.sc[k] || pref.gc[c.id] || DEFC[k], tab: null, prop: ro ? null : "g", time: true, done: null, g: c.id, ro };
      if (!ORDER.includes(k)) ORDER.push(k);
    });
  }
  function gEv(c, x) {
    if (!x || x.status === "cancelled" || !x.id) return null;
    const k = gKey(c.id), ro = !["owner", "writer"].includes(c.role || "owner");
    let w;
    if (x.start && x.start.dateTime) { const a = new Date(x.start.dateTime), b = x.end && x.end.dateTime ? new Date(x.end.dateTime) : null; w = { day: iso(a), allDay: false, start: a, end: b && b > a ? b : new Date(a.getTime() + 3600000) }; }
    else if (x.start && x.start.date) { const st = x.start.date, en = x.end && x.end.date ? shift(x.end.date, -1) : st; w = { day: st, allDay: true, endDay: en > st ? en : null }; }
    else return null;
    return Object.assign({ key: k + "|" + x.id, id: x.id, url: x.htmlLink || "https://calendar.google.com/", src: k, cal: c.id, title: clean(x.summary) || "(sem título)", done: false, raw: null, ro, gcal: true, meta: clean(x.location), desc: x.description || "", loc: x.location || "" }, w);
  }
  async function gList(c, from, to) {
    const out = []; let tok = null, n = 0;
    do {
      const input = { calendarId: c.id, startTime: from + "T00:00:00", endTime: to + "T00:00:00", pageSize: 250, orderBy: "startTime" };
      if (tok) input.pageToken = tok;
      const p = payloadOf(await gcall("list_events", input, { cache: { staleTime: 60000 } }));
      if (!p || typeof p !== "object") throw { code: "tool_error", message: "resposta inesperada do Google Calendar" };
      if (p.accessRole) c.role = p.accessRole;
      out.push(...(Array.isArray(p.events) ? p.events : []));
      tok = p.nextPageToken || null; n++;
    } while (tok && n < 6);
    return out;
  }
  // lê de 60 dias atrás a 120 à frente; navegar para fora disso amplia a janela
  async function gLoad(force, from, to) {
    if (S.g.loading || !S.mcp) return;
    S.g.loading = true; gStatus("Google…", "");
    from = from || S.g.from || shift(todayISO(), -60); to = to || S.g.to || shift(todayISO(), 120);
    try {
      if (force) { try { await S.mcp.invalidate(GCAL); } catch {} }
      if (!S.g.cals.length || force) {
        const p = payloadOf(await gcall("list_calendars", {}, { cache: { staleTime: 300000 } }));
        const list = p && Array.isArray(p.calendars) ? p.calendars : [];
        // a agenda principal primeiro, depois na ordem do Google
        S.g.cals = list.map(c => ({ id: c.id, name: clean(c.summary) || c.id, role: (S.g.cals.find(x => x.id === c.id) || {}).role || null }))
          .sort((a, b) => /^\d/.test(a.name) && /^\d/.test(b.name) ? a.name.localeCompare(b.name, "pt-BR", { numeric: true }) : /^\d/.test(a.name) ? -1 : /^\d/.test(b.name) ? 1 : 0);
      }
      const res = await Promise.allSettled(S.g.cals.map(c => gList(c, from, to)));
      const ev = [], bad = [];
      res.forEach((r, i) => { const c = S.g.cals[i]; if (r.status !== "fulfilled") { bad.push([c, r.reason]); return; } for (const x of r.value) { const e = gEv(c, x); if (e) ev.push(e); } });
      gRegister();
      S.g.ev = ev; S.g.from = from; S.g.to = to; S.g.ok = true;
      S.g.err = bad.length === S.g.cals.length && bad.length ? bad[0][1] : null;
      if (S.g.err) gStatus("Google · falhou", "err", gErrCopy(S.g.err));
      else if (bad.length) gStatus("Google · parcial", "warn", `Não li: ${bad.map(b => b[0].name).join(", ")}. ${gErrCopy(bad[0][1])}`);
      else gStatus(`Google · ${S.g.cals.length} agendas`, "live");
    } catch (e) { S.g.err = e; gStatus("Google · falhou", "err", gErrCopy(e)); }
    finally { S.g.loading = false; render(); }
  }
  function gEnsure(r) {
    if (!S.g.ok || S.g.loading) return;
    const a = iso(r.start), b = shift(iso(r.end), 1);
    if (a < S.g.from || b > S.g.to) gLoad(false, a < S.g.from ? shift(a, -30) : S.g.from, b > S.g.to ? shift(b, 60) : S.g.to);
  }
  function gErrCopy(e) {
    switch (e && e.code) {
      case "needs_reauth": return "O acesso ao Google Calendar expirou. Conecte de novo em Configurações → Google Calendar.";
      case "server_not_connected": case "selection_required": return "Conecte o Google Calendar em Configurações (engrenagem) para ver suas agendas aqui.";
      case "not_in_manifest": case "consent_required": return "O painel ainda não tem permissão para o Google Calendar. Clique em Atualizar e permita o acesso.";
      case "blocked_by_policy": case "approval_required": return "A política da sua organização bloqueou o Google Calendar neste painel.";
      case "server_unavailable": return "O Google Calendar não respondeu agora. Tente Atualizar em alguns segundos.";
      case "tool_error": return "O Google Calendar recusou a operação: " + (e.message || "sem detalhe") + ".";
      case "no_mcp": return "Entre no app para gravar no Google Calendar.";
      default: return "Não consegui falar com o Google Calendar (" + ((e && e.code) || "erro") + ").";
    }
  }
  function gStatus(t, k, tip) { const el = $("cal-gstatus"); if (!el) return; el.hidden = false; el.textContent = t; el.className = "pill" + (k ? " " + k : ""); el.title = tip || ""; if (tip && k === "err") toast(tip); }
  const locStr = d => `${iso(d)}T${hm(d)}:00`;
  // entrada do update_event/create_event: horário local sem fuso (o conector usa o fuso da conta)
  function gTimes(e, day, t1, t2) {
    if (!t1) return { allDay: true, startTime: `${day}T00:00:00`, endTime: `${shift(e && e.endDay && e.allDay ? shift(day, Math.round((parseISO(e.endDay) - parseISO(e.day)) / 864e5)) : day, 1)}T00:00:00` };
    const a = new Date(`${day}T${t1}:00`), dur = e && !e.allDay && e.start && e.end ? e.end - e.start : 3600000;
    const b = t2 && t2 > t1 && t2 !== "23:59" ? new Date(`${day}T${t2}:00`) : new Date(a.getTime() + dur); // 23:59 = fim cortado pela grade
    const o = { startTime: locStr(a), endTime: locStr(b) };
    if (e && e.allDay) o.allDay = false;
    return o;
  }
  // ---------- desfazer (Ctrl+Z ou o botão no aviso) ----------
  // cada ação que grava no Notion/Google empilha a ação contrária; Ctrl+Z (⌘Z) desfaz a última
  const UNDO = [];
  function pushUndo(label, run) { UNDO.push({ label, run }); if (UNDO.length > 40) UNDO.shift(); toastUndo(label); }
  function toastUndo(label) {
    const el = $("toast"); if (!el) return;
    el.innerHTML = `${esc(label)}<button type="button" class="toast-undo" data-undo="1">Desfazer</button><span class="toast-k">${/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘Z" : "Ctrl+Z"}</span>`;
    el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 7000);
  }
  async function undoLast() {
    if (S.undoing) return;
    const u = UNDO.pop(); if (!u) { toast("Nada para desfazer"); return; }
    S.undoing = true;
    try { await u.run(); toast("Desfeito: " + u.label.replace(/\s*·.*$/, "")); notifyTabs(); }
    catch (err) { toast("Não consegui desfazer. " + (err && err.g ? gErrCopy(err) : errCopy(err))); }
    finally { S.undoing = false; render(); }
  }
  const short = t => (t || "").length > 40 ? t.slice(0, 39) + "…" : (t || "");
  const tOf = e => e.allDay || !e.start ? null : hm(e.start), t2Of = e => e.allDay || !e.end ? null : hm(e.end);
  const gErr = e => Object.assign(e && typeof e === "object" ? e : { code: "erro" }, { g: true });
  // apaga de verdade: Google exclui o evento; Notion manda a página para a lixeira (dá para restaurar)
  async function removeEv(e) {
    if (!S.mcp) throw { code: "no_mcp" };
    if (e.gcal) {
      try { await S.mcp.callTool(GCAL, "delete_event", { calendarId: e.cal, eventId: e.id, notificationLevel: "NONE" }, { cache: false }); } catch (err) { throw gErr(err); }
      try { await S.mcp.invalidate(GCAL, "list_events"); } catch {}
      S.g.ev = S.g.ev.filter(x => x !== e);
    } else {
      await call("notion-delete-pages", { page_ids: [e.id], user_confirmed: true }, { cache: false });
      try { await S.mcp.invalidate(NOTION, T_QUERY); } catch {}
      S.ev = S.ev.filter(x => x !== e);
    }
  }
  // volta o item apagado: Notion tira da lixeira (mesma página, com tudo); Google recria o evento (novo id, mesmo título, horário, descrição e local)
  async function restoreEv(e) {
    if (!S.mcp) throw { code: "no_mcp" };
    if (!e.gcal) {
      await call("notion-restore-pages", { page_ids: [e.id] }, { cache: false });
      try { await S.mcp.invalidate(NOTION, T_QUERY); } catch {}
      if (!S.ev.includes(e)) S.ev.push(e);
      return e;
    }
    const input = Object.assign({ calendarId: e.cal, summary: e.title }, gTimes(e, e.day, tOf(e), t2Of(e)));
    if (e.desc) input.description = e.desc; if (e.loc) input.location = e.loc;
    return gCreate(e.cal, input);
  }
  async function gCreate(cal, input) {
    let res; try { res = await S.mcp.callTool(GCAL, "create_event", Object.assign({ notificationLevel: "NONE" }, input), { cache: false }); } catch (err) { throw gErr(err); }
    try { await S.mcp.invalidate(GCAL, "list_events"); } catch {}
    const p = payloadOf(res), c = S.g.cals.find(x => x.id === cal) || { id: cal, role: "owner" };
    const x = p && (p.event || p), ne = x && x.id ? gEv(c, x) : null;
    if (ne) { S.g.ev.push(ne); return ne; }
    gLoad(false); return null;
  }
  // um clique exclui; o aviso traz "Desfazer" (e Ctrl+Z)
  async function delEv(e, btn) {
    if (!e || e.ro || !e.id || S.busy.has(e.key)) return;
    if (!S.mcp) { msg("cf-msg", errCopy({ code: "no_mcp" })); toast(errCopy({ code: "no_mcp" })); return; }
    if (btn) btn.disabled = true; S.busy.add(e.key); render();
    try {
      await removeEv(e);
      S.busy.delete(e.key);
      if (!$("cal-sheet").hidden && $("cal-evf") && $("cal-evf").dataset.key === e.key) closeSheet();
      render(); notifyTabs();
      let back = e;
      pushUndo(`${e.gcal ? "Evento excluído" : "Movido para a lixeira do Notion"} · ${short(e.title)}`, async () => { back = await restoreEv(e); });
    } catch (err) { S.busy.delete(e.key); render(); const m = err && err.g ? gErrCopy(err) : errCopy(err); msg("cf-msg", m); if (!btn) toast(m); if (btn && btn.isConnected) btn.disabled = false; }
  }
  async function gUpdate(e, input) {
    if (!S.mcp) throw { code: "no_mcp" };
    await S.mcp.callTool(GCAL, "update_event", Object.assign({ calendarId: e.cal, eventId: e.id }, input), { cache: false });
    try { await S.mcp.invalidate(GCAL, "list_events"); } catch {}
  }
  // ---------- treinos: sessões registradas e plano da semana (do banco do painel) ----------
  function treinosFor(day) {
    if (!on("treino")) return [];
    // vale o do Notion: some o treino do painel que já aparece como Workout/Run no mesmo dia (mesmo tipo, até 3 h de diferença)
    const CRX = /cardio|esteira|corrid|run\b|running|bike|bicicleta|el[ií]ptic|caminhad|futebol|soccer|spinning|treadmill|walk/i;
    const nEv = S.ev.filter(e => (e.src === "workout" || e.src === "run") && e.day === day);
    const dup = s => s.notionId ? S.ev.some(e => e.id === s.notionId) : nEv.some(e => { const ec = e.src === "run" || CRX.test(e.title), sc = !s.forca; if (ec !== sc) return false; if (e.allDay || !e.start || !s.inicio || s.inicio.length < 16 || (s.titulo && e.title.trim().toLowerCase() === String(s.titulo).trim().toLowerCase())) return true; const [h, m] = s.inicio.slice(11, 16).split(":").map(Number); return Math.abs(h * 60 + m - minsOf(e.start)) <= 180; });
    const ss = S.sess.filter(s => s.data === day && !dup(s));
    if (ss.length) return ss.map(s => ({ key: "treino:" + s.id, src: "treino", day, allDay: !s.inicio || s.inicio.length < 16, start: s.inicio && s.inicio.length >= 16 ? new Date(s.inicio) : null, title: s.titulo || (s.forca ? "Musculação" : "Cardio"), meta: [s.duracaoMin ? `${s.duracaoMin} min` : "", s.cardio?.km ? `${String(s.cardio.km).replace(".", ",")} km` : ""].filter(Boolean).join(" · ") || "Treino registrado", done: true, ro: true }))
      .map(e => e.start ? Object.assign(e, { end: new Date(e.start.getTime() + (Number(e.meta.match(/(\d+) min/)?.[1]) || 60) * 60000) }) : e);
    if (!S.hcfg || day < todayISO()) return [];
    const cfg = S.hcfg, mkk = iso(monday(parseISO(day)));
    const k = Object.keys(cfg.agendas || {}).filter(x => x <= mkk).sort().pop();
    const plan = ((k ? cfg.agendas[k] : cfg.semana) || {})[DOW_KEYS[dowIdx(day)]];
    if (!plan || (!plan.forca && !plan.cardioMin)) return [];
    if (nEv.length) return []; // o plano já virou evento no Workouts/Runs
    const t = [plan.forca ? (plan.grupo || "Força") : "", plan.cardioMin ? `${String(plan.cardioTipo || "Cardio").replace(/\s*\(.*\)/, "")} ${plan.cardioMin} min` : ""].filter(Boolean).join(" + ");
    return [{ key: "treino:plan:" + day, src: "treino", day, allDay: true, title: t, meta: "Planejado na agenda de treinos", plan: true, ro: true }];
  }
  function habitsFor(day) { return on("habit") ? S.habits.filter(h => h.day === day) : []; }
  function eventsFor(day) {
    const hit = e => on(e.src) && (e.day === day || (e.allDay && e.endDay && e.day < day && day <= e.endDay));
    const list = S.ev.filter(hit).concat(S.g.ev.filter(hit), treinosFor(day));
    return list.sort((a, b) => (a.allDay === b.allDay ? 0 : a.allDay ? -1 : 1) || (a.start && b.start ? a.start - b.start : 0) || (a.done - b.done) || ORDER.indexOf(a.src) - ORDER.indexOf(b.src) || a.title.localeCompare(b.title));
  }

  // ---------- render ----------
  function range() {
    const c = parseISO(S.cursor);
    if (pref.view === "month") { const first = new Date(c.getFullYear(), c.getMonth(), 1), start = monday(first); const last = new Date(c.getFullYear(), c.getMonth() + 1, 0); const end = addDays(monday(last), 6); return { start, end, label: `${MON[c.getMonth()]} de ${c.getFullYear()}` }; }
    if (pref.view === "week") { const start = S.rolling || narrow() ? c : monday(c), end = addDays(start, stripN() - 1); return { start, end, label: start.getMonth() === end.getMonth() ? `${start.getDate()}–${end.getDate()} de ${MON[end.getMonth()]} de ${end.getFullYear()}` : `${start.getDate()} ${MON3[start.getMonth()]} – ${end.getDate()} ${MON3[end.getMonth()]} ${end.getFullYear()}` }; }
    if (pref.view === "day") return { start: c, end: c, label: `${["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][c.getDay()]}, ${c.getDate()} de ${MON[c.getMonth()]}` };
    const start = c, end = addDays(c, 20); return { start, end, label: `${c.getDate()} ${MON3[c.getMonth()]} – ${end.getDate()} ${MON3[end.getMonth()]}` };
  }
  function render() {
    if (!S.started) return;
    const r = visRange();
    $("cal-label").textContent = r.label;
    document.querySelectorAll("#cal-views button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === pref.view)));
    renderMgr(r);
    gEnsure(r);
    const body = $("cal-body");
    const keep = body.dataset.v === pref.view ? body.scrollTop : null;
    body.className = "cal-body v-" + pref.view; body.dataset.v = pref.view;
    if (pref.view === "month") body.innerHTML = monthHtml(r);
    else if (pref.view === "agenda") body.innerHTML = agendaHtml(r);
    else body.innerHTML = stripHtml();
    if (pref.view === "week" || pref.view === "day") { const wh = body.querySelector(".cal-pan .cal-wh"); if (wh) body.style.setProperty("--whh", wh.offsetHeight + "px"); setAdh(); }
    if (pref.view === "week" || pref.view === "day") {
      // janela padrão: 7h às 20h na altura do cartão; antes ou depois disso, arrasta-se a grade
      // o cabeçalho cresce com a faixa "dia inteiro" (animação de .15s): mede de novo quando ela termina
      // a linha das 7:00 fica logo abaixo do cabeçalho preso (com folga para o rótulo aparecer inteiro)
      const fit = top => {
        const st = body.querySelector(".cal-stick, .cal-axis-hd"), hdr = st ? st.offsetHeight : 0;
        body.style.height = `${hdr + 8 + (VIS[1] - VIS[0]) * HPX + 14}px`;
        if (!top) return;
        const hr = body.querySelectorAll(".cal-axis-tg .cal-hr, .cal-hrs .cal-hr")[VIS[0] - H0];
        if (hr && st) body.scrollTop += hr.getBoundingClientRect().top - st.getBoundingClientRect().bottom - 10;
      };
      if (keep !== null) body.scrollTop = keep; else body.scrollTop = (VIS[0] - H0) * HPX;
      fit(keep === null); clearTimeout(S.fitT); S.fitT = setTimeout(() => fit(keep === null), 220);
    } else body.style.height = "";
    renderSide();
  }
  // cardio registrado na base Workouts (natação, esteira, bike…) fica na cor do cardio, não no azul da musculação
  const CARDIO_RX = /cardio|esteira|corrid|run\b|running|bike|bicicleta|el[ií]ptic|caminhad|futebol|soccer|spinning|treadmill|walk|nata[cç][aã]o|swim|remo|rowing|pedal|trote|hiit|escada|stairs/i;
  const evC = e => e && e.src === "workout" && CARDIO_RX.test(e.title || "") ? SRC.run.c : e && e.src === "fin" && e.inc ? "var(--inc)" : SRC[e.src].c; // receitas agendadas no verde de receita
  const chip = (e, compact) => {
    const s = SRC[e.src], time = !e.allDay && e.start ? hm(e.start) : "";
    const drag = !e.ro && s.prop !== null && !S.busy.has(e.key);
    return `<div class="cal-ev${e.done ? " done" : ""}${s.done && !e.done && e.day < todayISO() ? " late" : ""}${e.plan ? " plan" : ""}${e.allDay ? " ad" : ""}${S.busy.has(e.key) ? " busy" : ""}${e.src === "fin" && e.inc ? " inc" : ""}" style="--c:${evC(e)}" data-ev="${esc(e.key)}"${drag ? ' data-drag="1"' : ""} title="${esc([e.title, s.l, e.meta].filter(Boolean).join(" · "))}">${(s.done || (s.done === "n" && NDB[e.src] && NDB[e.src].done)) && !e.ro ? `<button type="button" class="cal-ck" data-ck="${esc(e.key)}" aria-label="${e.done ? "Reabrir" : "Concluir"} ${esc(e.title)}">${CHECK}</button>` : `<i class="dot"></i>`}<span>${esc(e.title)}${pj(e) ? " " + pj(e) : ""}</span>${time ? `<b class="t">${time}</b>` : ""}</div>`;
  };
  const habitChip = (day, list) => { const d = list.filter(h => h.done).length; return `<div class="cal-ev hab${d === list.length ? " done" : ""}" style="--c:${SRC.habit.c}" data-habday="${day}" title="Hábitos de ${day.slice(8, 10)}/${day.slice(5, 7)}"><i class="dot"></i><span>Hábitos ${d}/${list.length}</span></div>`; };
  function monthHtml(r) {
    const t = todayISO(), cm = parseISO(S.cursor).getMonth();
    let h = `<div class="cal-month"><div class="cal-dows">${DOWS.map(d => `<span>${d}</span>`).join("")}</div><div class="cal-grid">`;
    for (let d = new Date(r.start); d <= r.end; d = addDays(d, 1)) {
      const day = iso(d), evs = eventsFor(day), hb = habitsFor(day), fin = on("fin") ? S.finPast[day] : 0;
      const MAX = 4, shown = evs.slice(0, hb.length ? MAX - 1 : MAX), more = evs.length - shown.length;
      h += `<div class="cal-cell${day === t ? " today" : ""}${d.getMonth() !== cm ? " out" : ""}${(d.getDay() + 6) % 7 >= 5 ? " we" : ""}" data-day="${day}"><div class="cal-dn"><button type="button" class="n" data-goday="${day}">${d.getDate() === 1 ? `${d.getDate()} ${MON3[d.getMonth()]}` : d.getDate()}</button>${fin ? `<span class="cal-fin" title="Gasto do dia">−${fmtR(fin)}</span>` : ""}</div><div class="cal-evs">${hb.length ? habitChip(day, hb) : ""}${shown.map(e => chip(e)).join("")}${more > 0 ? `<button type="button" class="cal-more" data-goday="${day}">+${more} mais</button>` : ""}</div></div>`;
    }
    return h + `</div></div>`;
  }
  function layoutDay(list) {
    // colunas para eventos sobrepostos
    const evs = list.filter(e => !e.allDay && e.start).map(e => ({ e, s: Math.max(H0 * 60, minsOf(e.start)), f: Math.min(H1 * 60, e.end && iso(e.end) === e.day ? Math.max(minsOf(e.start) + 20, minsOf(e.end)) : e.end && e.end > e.start ? H1 * 60 : minsOf(e.start) + 60) })).sort((a, b) => a.s - b.s || b.f - a.f);
    // como no Google Agenda: só ficam lado a lado os que começam quase juntos (dentro da altura de ~2 linhas de texto);
    // quem começa depois, sobre a parte vazia de um evento mais longo, entra por cima, recuado, sem cobrir o título dele
    const T = Math.max(30, Math.round(44 / HPX * 60)), bands = [];
    for (const x of evs) {
      let b = bands.find(b => x.s - b.s < T && b.items.some(i => i.f > x.s));
      if (!b) { const under = bands.filter(b => b.items.some(i => i.f > x.s)); b = { s: x.s, items: [], depth: under.length ? Math.min(3, Math.max(...under.map(u => u.depth)) + 1) : 0 }; bands.push(b); }
      b.items.push(x);
    }
    for (const b of bands) { const cols = []; for (const x of b.items) { let i = cols.findIndex(c => c <= x.s); if (i < 0) { i = cols.length; cols.push(0); } cols[i] = x.f; x.col = i; } b.items.forEach(x => { x.n = cols.length; x.depth = b.depth; }); }
    return evs;
  }
  // plano de treino do dia pela agenda da Saúde (a mesma regra de treinosFor), para qualquer dia
  function hPlan(day) {
    const cfg = S.hcfg; if (!cfg) return null;
    const mk = iso(monday(parseISO(day))), k = Object.keys(cfg.agendas || {}).filter(x => x <= mk).sort().pop();
    return ((k ? cfg.agendas[k] : cfg.semana) || {})[DOW_KEYS[dowIdx(day)]] || null;
  }
  const nf0 = n => Math.round(n).toLocaleString("pt-BR");
  // cabeçalho do dia: dia da semana e número; treino (força) com ✓/✗; cardio; meta de calorias e macros; hábitos
  function headInfo(day) {
    const d = parseISO(day), p = hPlan(day), has = p && (p.forca || +p.cardioMin);
    const fin = on("fin") && S.finPast[day] ? `<em title="Gasto do dia">−${fmtR(S.finPast[day])}</em>` : "";
    let out = `<span class="cal-whl"><small>${DOWS[dowIdx(day)]}</small><b>${d.getDate()}</b>${fin}</span>`;
    if (p) {
      const feito = has && day <= todayISO() ? (S.sess || []).some(s => s.data === day) : null;
      const ck = feito === null ? "" : ` <b class="ck ${feito ? "ok" : "no"}" title="${feito ? "Treino feito" : "Treino não feito"}">${feito ? "✓" : "✗"}</b>`;
      const parts = [p.forca ? `<span class="wf">${esc((window.painelGrpShort ? window.painelGrpShort(p.grupo) : p.grupo) || "Força")}</span>` : "", +p.cardioMin ? `<span class="wc">Cardio ${+p.cardioMin} min</span>` : ""].filter(Boolean);
      const tip = has ? `Treino planejado: ${[p.forca ? "musculação" : "", +p.cardioMin ? `cardio ${p.cardioMin} min (${p.cardioTipo || ""})` : ""].filter(Boolean).join(" + ")}` : "Dia de descanso";
      // uma linha para o treino (musculação, com ✓/✗) e outra para o cardio
      if (p.forca && ck) parts[0] = parts[0].replace(/<\/span>$/, ck + "</span>");
      else if (ck && parts.length) parts[parts.length - 1] = parts[parts.length - 1].replace(/<\/span>$/, ck + "</span>");
      out += `<span class="cal-whp" title="${esc(tip)}">${has ? parts.join("") : "Descanso"}</span>`;
      const tg = window.painelDayTarget ? window.painelDayTarget(day, S.hcfg) : null;
      if (tg && tg.kcal > 0) out += `<span class="cal-whk" title="Meta do dia (${tg.fonte}): ${nf0(tg.kcal)} kcal · proteína ${nf0(tg.prot)} g · carboidrato ${nf0(tg.carb)} g · gordura ${nf0(tg.gord)} g"><span class="mk">${nf0(tg.kcal)} kcal</span><span class="cal-whm"><span class="mp">P${nf0(tg.prot)}</span> <span class="mc">C${nf0(tg.carb)}</span> <span class="mg">G${nf0(tg.gord)}</span></span></span>`;
    }
    const hb = habitsFor(day);
    if (hb.length) { const dn = hb.filter(x => x.done).length; out += `<span data-habday="${day}" class="cal-whh${dn === hb.length ? " done" : ""}" title="Hábitos de ${day.slice(8, 10)}/${day.slice(5, 7)}"><i class="dot"></i>Hábitos ${dn}/${hb.length}</span>`; }
    return out;
  }
  function gridHtml(r, inPanel, allHtml) {
    const days = []; for (let d = new Date(r.start); d <= r.end; d = addDays(d, 1)) days.push(iso(d));
    const t = todayISO(), now = new Date();
    let head = `<div class="cal-wh">${inPanel ? "" : '<span class="g"></span>'}${days.map(day => `<button type="button" class="cal-whd${day === t ? " today" : ""}" data-goday="${day}">${headInfo(day)}</button>`).join("")}</div>`;
    const all = allHtml || "";
    let hours = ""; for (let h = H0; h < H1; h++) hours += `<div class="cal-hr" style="top:${(h - H0) * HPX}px"><span>${pad(h)}:00</span></div>`;
    const cols = days.map(day => {
      const evs = layoutDay(eventsFor(day));


      const nl = day === t && minsOf(now) >= H0 * 60 ? `<div class="cal-now" style="top:${(minsOf(now) - H0 * 60) / 60 * HPX}px"></div>` : "";
      return `<div class="cal-col${day === t ? " today" : ""}" data-day="${day}" data-slot="1">${evs.map(x => { const e = x.e, s = SRC[e.src]; const top = (x.s - H0 * 60) / 60 * HPX, ht = Math.max(18, (x.f - x.s) / 60 * HPX - 2); const hc = (s.done || (s.done === "n" && NDB[e.src] && NDB[e.src].done)) && !e.ro; return `<div class="cal-tev${x.depth ? " over" : ""}${hc ? " ck" : ""}${e.done ? " done" : ""}${ht < 34 ? " short" : ""}${S.busy.has(e.key) ? " busy" : ""}" style="--c:${evC(e)};top:${top}px;height:${ht}px;--ind:${x.depth * 14}%;left:calc(var(--ind) + ${x.col} * (100% - var(--ind)) / ${x.n} + 2px);width:calc((100% - var(--ind)) / ${x.n} - 4px)${x.depth ? `;z-index:${1 + x.depth}` : ""}" data-ev="${esc(e.key)}" data-move="${e.ro || s.prop === null ? "" : "1"}" title="${esc([e.title, s.l, e.meta].filter(Boolean).join(" · "))}">${hc ? `<button type="button" class="cal-ck" data-ck="${esc(e.key)}" aria-label="${e.done ? "Reabrir" : "Concluir"} ${esc(e.title)}">${CHECK}</button>` : ""}<span>${esc(e.title)}${pj(e) ? " " + pj(e) : ""}</span><b>${hm(e.start)}${e.end ? "–" + hm(e.end) : ""}</b>${e.ro || s.prop === null ? "" : `<i class="rz top" data-rz="t"></i><i class="rz" data-rz="b"></i>`}</div>`; }).join("")}${nl}</div>`;
    }).join("");
    return `<div class="cal-week" style="--n:${days.length};--hpx:${HPX}px"><div class="cal-stick">${head}${all}</div><div class="cal-scroll"><div class="cal-tg" style="height:${(H1 - H0) * HPX}px">${inPanel ? "" : `<div class="cal-hrs">${hours}</div>`}<div class="cal-cols">${cols}</div></div></div></div>`;
  }
  function agendaHtml(r) {
    const t = todayISO();
    const late = S.ev.filter(e => on(e.src) && SRC[e.src].done && !e.done && e.day < t).sort((a, b) => a.day.localeCompare(b.day));
    let h = "";
    if (late.length) h += `<div class="cal-ag-day late"><div class="cal-ag-h"><b>Atrasadas</b><small>${late.length}</small></div>${late.map(e => `<div class="cal-ag-row"><span class="cal-ag-t">${e.day.slice(8, 10)}/${e.day.slice(5, 7)}</span>${chip(e)}</div>`).join("")}</div>`;
    for (let d = new Date(r.start); d <= r.end; d = addDays(d, 1)) {
      const day = iso(d), evs = eventsFor(day), hb = habitsFor(day);
      if (!evs.length && !hb.length) continue;
      h += `<div class="cal-ag-day${day === t ? " today" : ""}"><div class="cal-ag-h"><button type="button" data-goday="${day}"><b>${day === t ? "Hoje" : ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][d.getDay()]}</b> <small>${d.getDate()} de ${MON[d.getMonth()]}</small></button><button type="button" class="btn ghost" data-new="${day}">+ Tarefa</button></div>${hb.length ? `<div class="cal-ag-row"><span class="cal-ag-t"></span>${habitChip(day, hb)}</div>` : ""}${evs.map(e => `<div class="cal-ag-row"><span class="cal-ag-t">${!e.allDay && e.start ? hm(e.start) : ""}</span>${chip(e)}<small class="cal-ag-m">${esc([SRC[e.src].l, e.meta].filter(Boolean).join(" · "))}</small></div>`).join("")}</div>`;
    }
    return h || `<p class="empty">${S.loadedAt ? "Nada com data nas próximas três semanas." : "Os itens aparecem aqui depois da leitura do Notion."}</p>`;
  }
  // ---------- lista de calendários (barra lateral retrátil) ----------
  const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  const EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M10 6c.6-.1 1.3-.2 2-.2 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.6 7.7A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const SOLO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/></svg>';
  const OPEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 14v4.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function hexOf(c) {
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    const el = document.createElement("span"); el.style.color = c; el.style.display = "none"; document.body.appendChild(el);
    const m = getComputedStyle(el).color.match(/\d+/g) || [0, 0, 0]; el.remove();
    return "#" + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, "0")).join("");
  }
  const cntOf = k => k === "habit" ? S.habits.length : k === "treino" ? S.sess.length : SRC[k].g ? S.g.ev.filter(e => e.src === k).length : S.ev.filter(e => e.src === k).length;
  function mgrGroups() {
    const gk = ORDER.filter(k => SRC[k] && SRC[k].g);
    return [
      { id: "notion", l: "Notion", sub: "bases com data", keys: N_ORDER },
      { id: "google", l: "Google Calendar", sub: S.g.cals.length ? "" : S.g.err ? "não conectado" : "lendo…", keys: gk },
      { id: "painel", l: "Painel", sub: "só deste painel", keys: P_ORDER },
    ];
  }
  function renderMini(r) {
    const el = $("cal-mini"); if (!el) return;
    const base = parseISO(S.mini || S.cursor), y = base.getFullYear(), m = base.getMonth();
    const start = monday(new Date(y, m, 1)), t = todayISO(), a = iso(r.start), b = iso(r.end);
    const busy = new Set(S.ev.concat(S.g.ev).filter(e => on(e.src)).map(e => e.day));
    let h = `<div class="cal-mini-h"><span>${MON[m]} ${y}</span><div><button type="button" data-mini="-1" aria-label="Mês anterior">‹</button><button type="button" data-mini="1" aria-label="Próximo mês">›</button></div></div><div class="cal-mini-g">${DOWS.map(d => `<span>${d[0]}</span>`).join("")}`;
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i), day = iso(d), inR = day >= a && day <= b && pref.view !== "month";
      h += `<button type="button" data-miniday="${day}" class="${d.getMonth() !== m ? "out" : ""}${day === t ? " today" : ""}${inR ? " in" : ""}${inR && (day === a || dowIdx(day) === 0) ? " s" : ""}${inR && (day === b || dowIdx(day) === 6) ? " e" : ""}${busy.has(day) ? " has" : ""}" aria-label="${d.getDate()} de ${MON[d.getMonth()]}"><i>${d.getDate()}</i></button>`;
    }
    el.innerHTML = h + `</div>`;
  }
  function renderMgr(r) {
    const wrap = $("cal-wrap"); if (!wrap) return;
    wrap.classList.toggle("mgr-off", !pref.mgr);
    $("cal-mgr-t").setAttribute("aria-expanded", String(!!pref.mgr));
    if (!pref.mgr) return;
    renderMini(r || range());
    const q = (S.mq || "").trim().toLowerCase();
    $("cal-mg-list").innerHTML = mgrGroups().map(g => {
      const keys = g.keys.filter(k => SRC[k] && (!q || SRC[k].l.toLowerCase().includes(q)));
      if (!keys.length && (q || g.id !== "google")) return "";
      const open = !pref.gx[g.id] || !!q, vis = keys.filter(on).length;
      return `<div class="cal-mg-grp"><div class="cal-mg-gh"><button type="button" data-mg-tg="${g.id}" aria-expanded="${open}"><span class="caret">▸</span>${esc(g.l)}${g.sub ? ` <small>· ${esc(g.sub)}</small>` : ""}</button>${keys.length ? `<span class="cal-mg-a"><button type="button" class="cal-mg-eye" data-mg-grp="${g.id}" title="${vis ? "Ocultar todos deste grupo" : "Mostrar todos deste grupo"}" aria-label="${vis ? "Ocultar" : "Mostrar"} ${esc(g.l)}">${vis ? EYE : EYE_OFF}</button></span>` : ""}</div>
        ${open ? keys.map(k => { const s = SRC[k], o = on(k), n = cntOf(k), url = s.g ? "https://calendar.google.com/calendar/r" : SURL[k];
          return `<div class="cal-mg-row${o ? "" : " off"}" style="--c:${s.c}"><label class="cal-mg-sw" title="Mudar a cor"><input type="color" class="cal-mg-col" data-k="${esc(k)}" value="${hexOf(s.c)}" aria-label="Cor de ${esc(s.l)}"></label><button type="button" class="cal-mg-n" data-src="${esc(k)}" aria-pressed="${o}" title="${o ? "Ocultar" : "Mostrar"} ${esc(s.l)}">${esc(s.l)}${s.ro ? `<span class="cal-mg-ro">leitura</span>` : ""}</button><span class="cal-mg-a">${n ? `<span class="cnt">${n}</span>` : ""}<button type="button" class="hov" data-solo="${esc(k)}" title="Mostrar só esta" aria-label="Mostrar só ${esc(s.l)}">${SOLO}</button>${url ? `<a class="hov" href="${esc(url)}" target="_blank" rel="noopener" title="Abrir ${s.g ? "no Google Calendar" : "no Notion"}" aria-label="Abrir ${esc(s.l)}">${OPEN}</a>` : ""}<button type="button" class="cal-mg-eye${o ? " hov" : ""}" data-src="${esc(k)}" aria-label="${o ? "Ocultar" : "Mostrar"} ${esc(s.l)}">${o ? EYE : EYE_OFF}</button></span></div>`; }).join("") : ""}</div>`;
    }).join("") || `<p class="empty">Nenhum calendário com esse nome.</p>`;
  }
  function setMgr(v) { pref.mgr = v; savePref(); render(); }
  const allKeys = () => ORDER.filter(k => SRC[k]);

  // painel lateral: hoje, próximos 7 dias e atrasadas
  function renderSide() {
    const t = todayISO(), el = $("cal-side"); if (!el) return;
    const late = S.ev.filter(e => on(e.src) && SRC[e.src].done && !e.done && e.day < t).length;
    const today = eventsFor(t), hb = habitsFor(t), next = [];
    for (let i = 1; i <= 7; i++) { const day = shift(t, i), evs = eventsFor(day).filter(e => e.src !== "treino" || !e.plan); if (evs.length) next.push([day, evs]); }
    el.innerHTML = `<section class="card cal-today"><div class="card-head"><div><h3 data-i="sun">Hoje</h3><p class="hint">${parseISO(t).getDate()} de ${MON[parseISO(t).getMonth()]}${late ? ` · <button type="button" class="cal-link" data-view="agenda">${late} ${late === 1 ? "atrasada" : "atrasadas"}</button>` : ""}</p></div><button class="btn ghost" data-new="${t}">+ Tarefa</button></div>
      ${hb.length ? `<div class="cal-habs">${hb.map(h => `<button type="button" class="cal-hab${h.done ? " done" : ""}${S.busy.has("habit:" + h.id) ? " busy" : ""}" data-hab="${h.id}"><span class="cal-ck">${CHECK}</span>${esc(h.name)}</button>`).join("")}</div>` : ""}
      <div class="cal-list">${today.length ? today.map(e => `<div class="cal-li"><span class="cal-ag-t">${!e.allDay && e.start ? hm(e.start) : ""}</span>${chip(e)}</div>`).join("") : `<p class="empty">Nada marcado para hoje.</p>`}</div></section>
      <section class="card"><div class="card-head"><div><h3 data-i="calendar">Próximos 7 dias</h3></div></div><div class="cal-list">${next.length ? next.map(([day, evs]) => `<div class="cal-nd"><button type="button" class="cal-link" data-goday="${day}">${DOWS[dowIdx(day)]} ${day.slice(8, 10)}/${day.slice(5, 7)}</button>${evs.slice(0, 6).map(e => chip(e)).join("")}${evs.length > 6 ? `<small class="c-mini">+${evs.length - 6}</small>` : ""}</div>`).join("") : `<p class="empty">Semana livre.</p>`}</div></section>`;
  }

  // ---------- propriedades das bases do Notion (select, status, multi-select, caixa, número, texto) ----------
  // o esquema vem do notion-fetch da data source; fica em memória por 10 min
  const PTYPES = ["select", "status", "multi_select", "relation", "checkbox", "number", "text", "rich_text", "url", "email", "phone_number"];
  const NCOL = { default: "var(--n-default)", gray: "var(--n-gray)", brown: "var(--n-brown)", orange: "var(--n-orange)", yellow: "var(--n-yellow)", green: "var(--n-green)", blue: "var(--n-blue)", purple: "var(--n-purple)", pink: "var(--n-pink)", red: "var(--n-red)" };
  function schemaOf(dest) {
    S.schemas = S.schemas || {};
    const dsid = DS[dest] || dest;
    if (!S.schemas[dest]) S.schemas[dest] = call("notion-fetch", { id: "collection://" + dsid }, { cache: { staleTime: 600000 } }).then(res => {
      const p = payloadOf(res), txt = typeof p === "string" ? p : p && (p.text || "");
      S.dbUrl = S.dbUrl || {}; if (p && p.url) S.dbUrl[dest] = String(p.url).split("?")[0];
      const m = String(txt).match(/<data-source-state>\s*([\s\S]*?)\s*<\/data-source-state>/);
      const st = m ? JSON.parse(m[1]) : (p && p.schema ? p : null);
      if (!st || !st.schema) throw { code: "tool_error", message: "esquema da base não veio na resposta" };
      return Object.entries(st.schema).map(([k, p]) => Object.assign({}, p, { key: k }));
    }).catch(err => { delete S.schemas[dest]; throw err; });
    return S.schemas[dest];
  }
  const dsOfUrl = u => String(u || "").replace(/[{}]/g, "").replace(/^collection:\/\//, "");
  // primeira view sem filtro da base (ou a primeira que houver), como URL que o modo "view" aceita
  async function viewOf(ds) {
    S.views = S.views || {};
    if (S.views[ds]) return S.views[ds];
    await schemaOf(ds);
    const db = (S.dbUrl || {})[ds]; if (!db) throw { code: "tool_error", message: "a base ligada não informou o endereço" };
    const p = payloadOf(await call("notion-fetch", { id: db }, { cache: { staleTime: 3600000 } }));
    const txt = typeof p === "string" ? p : p && (p.text || "");
    const vs = [...String(txt).matchAll(/<view url="\{\{view:\/\/([0-9a-f-]{36})\}\}">\s*(\{[^\n]*\})/g)].map(m => { let j = {}; try { j = JSON.parse(m[2]); } catch {} return { id: m[1], j }; })
      .filter(v => !v.j.dataSourceUrl || dsOfUrl(v.j.dataSourceUrl) === ds);
    const v = vs.find(x => !x.j.simpleFilters && !x.j.filters && !x.j.filter) || vs[0];
    if (!v) throw { code: "tool_error", message: "a base ligada não tem view" };
    const dbid = pageId(db);
    return (S.views[ds] = `https://www.notion.so/${dbid}?v=${v.id.replace(/-/g, "")}`);
  }
  function relOpts(p) {
    const ds = dsOfUrl(p.dataSourceUrl); S.rels = S.rels || {};
    if (!ds) return Promise.reject({ code: "tool_error", message: "o Notion não informou qual base esta relação usa" });
    if (!S.rels[ds]) S.rels[ds] = (async () => {
      const sc = await schemaOf(ds), tk = (sc.find(x => x.type === "title") || {}).key || "Name";
      // lê pela view da base (modo "view"): o modo "rows"/SQL do Notion tem cota por hora nos planos sem Business
      let rows;
      try { rows = await queryView(await viewOf(ds), 5); }
      catch (e1) { // sem view utilizável: tenta o modo "rows" (tem cota por hora no Notion)
        try { const pl = payloadOf(await call(T_QUERY, { data: { mode: "rows", data_source_url: "collection://" + ds, limit: 100 } }, { cache: { staleTime: 300000 } })); rows = pl && Array.isArray(pl.results) ? pl.results : []; }
        catch { throw e1; }
      }
      return rows.filter(r => r.url && r.Archive !== "__YES__").map(r => ({ id: pageId(r.url), url: r.url, name: clean(r[tk]) || "(sem nome)", row: r })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    })().catch(err => { delete S.rels[ds]; throw err; });
    return S.rels[ds];
  }
  // nome da página ligada depois do título, em fonte menor e mais clara: projeto, vaga, disciplina ou meta
  const APPS_DS = "f6caa859-7834-4a73-9649-68b0c59552ce", COURSE_DS = "1bcb0f63-2167-8109-ae9e-000bafd4f360";
  // cada base: lista de [relação, base ligada]; cada uma vira uma linha (na grade) ou um trecho "· nome" (nos chips)
  const ASSIGN_DS = "1bcb0f63-2167-81f7-b2fe-000b91c0aa2e";
  const REL_SHOW = { proj: [["Project", "1d5b0f63-2167-81b8-a847-000b40ebefba"]], jtask: [["Job Application Tracker", APPS_DS]], stask: [["Course", COURSE_DS], ["Student Assignments/Seminars", ASSIGN_DS]], assign: [["Course", COURSE_DS]], read: [["Course", COURSE_DS]], devtask: [["Goals", "130b0f63-2167-8188-8e26-000b32075145"]] };
  async function loadProj() {
    S.relNames = S.relNames || {};
    const need = [...new Set(S.ev.filter(e => REL_SHOW[e.src]).flatMap(e => REL_SHOW[e.src].map(r => r[1])))].filter(ds => ds !== APPS_DS && !S.relNames[ds]);
    if (!need.length) return;
    await Promise.all(need.map(async ds => { try { const ops = await relOpts({ dataSourceUrl: "collection://" + ds }); S.relNames[ds] = Object.fromEntries(ops.map(o => [o.id, o.name])); } catch { /* sem o nome, o título aparece sozinho */ } }));
    render();
  }
  function pj(e) {
    const rs = REL_SHOW[e.src]; if (!rs || !e.row) return "";
    return rs.map(([prop, ds]) => {
      const map = ds === APPS_DS ? (S.appNames || {}) : ((S.relNames || {})[ds] || {});
      // assignments: o nome também pode vir das que já estão no calendário
      const nm = id => map[id] || (ds === ASSIGN_DS ? (S.ev.find(x => x.src === "assign" && x.id === id) || {}).title : null);
      const names = rel(e.row[prop]).map(nm).filter(Boolean);
      return names.length ? `<i class="cal-pj">${esc(names.join(", "))}</i>` : "";
    }).filter(Boolean).join(" ");
  }
  const optsOf = p => p.type === "status" ? Object.values(p.groups || {}).flat() : (p.options || []);
  // o que a ficha já trata em outro campo: título, datas e a propriedade de "feito"
  function skipProps(dest, editing) {
    const N = NDB[dest], out = ["Name", "Title", "Done", SRC[dest] && SRC[dest].prop, "ETA", "Due Date", "Date"];
    if (N) { out.push(N.title, ...N.props); if (N.done.k === "check") out.push(N.done.p); else if (editing) out.push("Status"); }
    if (dest === "devtask" && editing) out.push("Status");
    if (dest === "proj") out.push("Complete");
    return new Set(out.filter(Boolean));
  }
  const parseMulti = v => { if (Array.isArray(v)) return v; if (!v) return []; try { const a = JSON.parse(v); return Array.isArray(a) ? a : [String(a)]; } catch { return String(v).split(",").map(x => x.trim()).filter(Boolean); } };
  function fieldHtml(p, v, foreign) {
    const n = esc(p.name), at = `data-p="${esc(p.key || p.name)}" data-t="${p.type}"`;
    if (p.type === "relation") {
      const ops = p.rel || [], on = new Set(parseMulti(v).map(pageId).filter(Boolean));
      if (p.relErr) return `<p class="c-mini" title="${esc(String(p.relErr))}">${n}: não consegui ler a base ligada (${esc(String(p.relErr).slice(0, 80))}).</p>`;
      // valor atual fora das 100 páginas lidas: entra como opção, com o nome que o painel conhecer
      const miss = [...on].filter(id => !ops.some(o => o.id === id)).map(id => ({ id, url: "https://www.notion.so/" + id, name: (S.appNames || {})[id] || Object.values(S.relNames || {}).map(m => m[id]).find(Boolean) || "Página ligada" }));
      const all = miss.concat(ops);
      // lista de seleção (como as demais), salvo quando a página já tem mais de um item ligado
      const ref = o => p.dep && o.row ? ` data-ref="${rel(o.row[p.dep]).join(",")}"` : "";
      if (on.size <= 1 || all.length > 30) return `<label class="field">${n}<select ${at} data-rel="1"${p.dep ? ` data-dep="${esc(p.dep)}"` : ""}><option value="">—</option>${all.map(o => `<option value="${esc(o.url)}"${ref(o)}${on.has(o.id) ? " selected" : ""}>${esc(o.name)}</option>`).join("")}</select></label>`;
      return `<fieldset class="cal-pm" ${at}${p.dep ? ` data-dep="${esc(p.dep)}"` : ""}><legend>${n}</legend>${all.map(o => `<label class="cal-pc"${ref(o)}><input type="checkbox" value="${esc(o.url)}"${on.has(o.id) ? " checked" : ""}><i></i>${esc(o.name)}</label>`).join("") || `<span class="c-mini">Nenhuma página na base ligada.</span>`}</fieldset>`;
    }
    if (p.type === "select" || p.type === "status") {
      const ops = optsOf(p), cur0 = v == null ? "" : String(v), cur = foreign && !ops.some(o => o.name === cur0) ? "" : cur0;
      return `<label class="field">${n}<select ${at}><option value="">—</option>${ops.map(o => `<option value="${esc(o.name)}"${o.name === cur ? " selected" : ""}>${esc(o.name)}</option>`).join("")}${cur && !ops.some(o => o.name === cur) ? `<option selected value="${esc(cur)}">${esc(cur)}</option>` : ""}</select></label>`;
    }
    if (p.type === "multi_select") {
      const on = new Set(parseMulti(v));
      return `<fieldset class="cal-pm" ${at}><legend>${n}</legend>${(p.options || []).map(o => `<label class="cal-pc" style="--c:${NCOL[o.color] || NCOL.gray}"><input type="checkbox" value="${esc(o.name)}"${on.has(o.name) ? " checked" : ""}><i></i>${esc(o.name)}</label>`).join("") || `<span class="c-mini">Sem opções nesta base.</span>`}</fieldset>`;
    }
    if (p.type === "checkbox") return `<label class="c-check-row"><input type="checkbox" ${at}${v === "__YES__" || v === true ? " checked" : ""}> ${n}</label>`;
    if (p.type === "number") return `<label class="field">${n}<input type="number" step="any" ${at} value="${v == null || v === "" ? "" : esc(v)}"></label>`;
    return `<label class="field">${n}<input type="${p.type === "url" ? "url" : p.type === "email" ? "email" : "text"}" ${at} value="${esc(v == null ? "" : clean(v))}"></label>`;
  }
  // valor de um campo no formato que o notion-create-pages / update-page aceitam
  function valOf(el) {
    const t = el.dataset.t;
    if (t === "relation") { const a = el.dataset.rel ? (el.value ? [el.value] : []) : [...el.querySelectorAll("input:checked")].map(i => i.value); return JSON.stringify(a); }
    if (t === "multi_select") { const a = [...el.querySelectorAll("input:checked")].map(i => i.value); return a.length ? JSON.stringify(a) : null; }
    if (t === "checkbox") return el.checked ? "__YES__" : "__NO__";
    if (t === "number") return el.value === "" ? null : Number(el.value);
    return el.value === "" ? null : el.value;
  }
  async function renderPropFields(pfx, dest, e, foreign) {
    const box = $(pfx + "-props"); if (!box) return;
    box.dataset.dest = dest; box.innerHTML = "";
    if (!DS[dest] || !S.mcp) return;
    box.innerHTML = `<p class="c-mini">Lendo as propriedades de ${esc(SRC[dest].l)}…</p>`;
    let sc; try { sc = await schemaOf(dest); } catch (err) { if (box.isConnected && box.dataset.dest === dest) box.innerHTML = `<p class="c-mini">Não consegui ler as propriedades desta base. ${esc(errCopy(err))}</p>`; return; }
    if (!box.isConnected || box.dataset.dest !== dest) return;
    const skip = skipProps(dest, !!e && !foreign), row = (e && e.row) || {};
    // relações: menos as que apontam para a própria base (subtarefas, tarefa-mãe) e a candidatura das Job Tasks (já tem campo)
    const own = DS[dest];
    const fields = sc.filter(p => PTYPES.includes(p.type) && !p.readOnly && !skip.has(p.name) && !skip.has(p.key)
        && !(p.type === "relation" && (dsOfUrl(p.dataSourceUrl) === own || (p.name === "Job Application Tracker" && (!e || foreign)))))
      .sort((a, b) => { const r = t => ({ status: 0, select: 1, relation: 2, multi_select: 4 }[t] ?? 3); return r(a.type) - r(b.type); });
    // candidaturas: a lista que o painel já leu (todas as vagas), em vez de só 100 páginas da base
    const appRel = p => dsOfUrl(p.dataSourceUrl) === "f6caa859-7834-4a73-9649-68b0c59552ce" && S.appNames && Object.keys(S.appNames).length;
    await Promise.all(fields.filter(p => p.type === "relation").map(async p => { try { p.rel = appRel(p) ? Object.entries(S.appNames).map(([id, name]) => ({ id, url: "https://www.notion.so/" + id, name: name || "(sem nome)" })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")) : await relOpts(p); } catch (err) { p.relErr = (err && (err.message || err.code)) || "erro"; console.warn("relação", p.name, err); } }));
    if (!box.isConnected || box.dataset.dest !== dest) return;
    // relação que depende de outra: se as páginas da lista B têm uma propriedade com o mesmo nome de outra relação A
    // da ficha (ex.: Assignments têm "Course"), a lista B mostra só as ligadas ao que estiver escolhido em A
    const rels = fields.filter(p => p.type === "relation" && p.rel);
    rels.forEach(b => { const a = rels.find(q => q !== b && b.rel.some(o => o.row && o.row[q.key] !== undefined)); if (a) b.dep = a.key; });
    box.innerHTML = fields.map(p => fieldHtml(p, foreign && p.type === "relation" ? null : row[p.key] !== undefined ? row[p.key] : row[p.name], foreign)).join("");
    box.querySelectorAll("[data-p]").forEach(el => { el.dataset.v0 = JSON.stringify(valOf(el)); });
    addSelFilters(box); applyDeps(box);
    if (!box.dataset.depBound) { box.dataset.depBound = "1"; box.addEventListener("change", () => applyDeps(box)); }
  }
  function applyDeps(box) {
    box.querySelectorAll("fieldset[data-dep]").forEach(fs => {
      const a = box.querySelector(`[data-p="${CSS.escape(fs.dataset.dep)}"]`); if (!a) return;
      const ids = new Set(parseMulti(valOf(a)).map(pageId).filter(Boolean));
      fs.querySelectorAll(".cal-pc").forEach(l => { const on = l.querySelector("input").checked; l.hidden = !(on || !ids.size || (l.dataset.ref || "").split(",").some(x => ids.has(x))); });
    });
    box.querySelectorAll("select[data-dep]").forEach(sel => {
      const a = box.querySelector(`[data-p="${CSS.escape(sel.dataset.dep)}"]`); if (!a) return;
      const ids = new Set(parseMulti(valOf(a)).map(pageId).filter(Boolean));
      let shown = 0;
      [...sel.options].forEach(o => { if (!o.value) return; const ok = !ids.size || (o.dataset.ref || "").split(",").some(x => ids.has(x)) || o.selected; o.hidden = !ok; o.disabled = !ok; if (ok) shown++; });
      sel.title = ids.size ? `Filtrado pela escolha em ${sel.dataset.dep}: ${shown}` : "";
    });
    box.querySelectorAll("select[data-sf]").forEach(selFilter);
  }
  // listas longas (relações e selects com muitas opções): campo para digitar e filtrar, sem acento/maiúscula
  const fold = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  function selFilter(sel) {
    const inp = sel.previousElementSibling; const q = inp && inp.classList.contains("cal-sf") ? fold(inp.value).trim() : "";
    const words = q ? q.split(/\s+/) : [];
    let n = 0, last = null;
    [...sel.options].forEach(o => { if (!o.value) { o.hidden = !!q; return; } const ok = !o.disabled && (!words.length || words.every(w => fold(o.textContent).includes(w))); o.hidden = !ok; if (ok) { n++; last = o; } });
    return { n, last };
  }
  function addSelFilters(box) {
    box.querySelectorAll(".field > select[data-p]").forEach(sel => {
      if (sel.dataset.sf || sel.options.length < 8) return;
      sel.dataset.sf = "1";
      const inp = document.createElement("input"); inp.type = "search"; inp.className = "cal-sf"; inp.placeholder = "Digite para filtrar…"; inp.autocomplete = "off";
      sel.before(inp);
      const open = on => { sel.size = on ? Math.min(7, Math.max(2, selFilter(sel).n)) : 0; sel.classList.toggle("open", !!on); };
      inp.addEventListener("input", () => { const r = selFilter(sel); if (!inp.value.trim()) return open(false); open(true); if (r.n === 1) { sel.value = r.last.value; } });
      inp.addEventListener("keydown", ev => {
        if (ev.key === "ArrowDown") { ev.preventDefault(); const f = [...sel.options].find(o => !o.hidden && o.value); if (f) sel.value = f.value; sel.focus(); }
        if (ev.key === "Enter") { ev.preventDefault(); const f = [...sel.options].find(o => !o.hidden && o.value && (o.selected || true)); const cur = sel.selectedOptions[0]; const pick = cur && !cur.hidden && cur.value ? cur : f; if (pick) { sel.value = pick.value; sel.dispatchEvent(new Event("change", { bubbles: true })); } inp.value = ""; selFilter(sel); open(false); }
        if (ev.key === "Escape") { inp.value = ""; selFilter(sel); open(false); }
      });
      sel.addEventListener("change", () => { if (sel.classList.contains("open")) { inp.value = ""; selFilter(sel); open(false); } });
      sel.addEventListener("click", () => { if (sel.classList.contains("open") && sel.value) { inp.value = ""; selFilter(sel); open(false); sel.dispatchEvent(new Event("change", { bubbles: true })); } });
      sel.addEventListener("keydown", ev => { if (ev.key === "Enter" && sel.classList.contains("open")) { ev.preventDefault(); inp.value = ""; selFilter(sel); open(false); sel.dispatchEvent(new Event("change", { bubbles: true })); } });
    });
  }
  // só o que mudou (edição) ou só o que foi preenchido (criação)
  function readProps(pfx, changedOnly) {
    const box = $(pfx + "-props"), out = {}, old = {};
    if (!box || box.hidden) return { out, old };
    box.querySelectorAll("[data-p]").forEach(el => {
      const v = valOf(el), v0 = JSON.parse(el.dataset.v0 || "null");
      if (changedOnly ? JSON.stringify(v) === el.dataset.v0 : (v === null || v === "__NO__" || v === "[]")) return;
      out[el.dataset.p] = v; old[el.dataset.p] = v0;
    });
    return { out, old };
  }

  // ---------- ficha do evento ----------
  const evBy = key => S.ev.find(e => e.key === key) || S.g.ev.find(e => e.key === key) || null;
  const titleProp = e => e.gcal ? "summary" : ["ptask", "jtask", "devtask"].includes(e.src) ? "Name" : NDB[e.src] && NDB[e.src].title ? NDB[e.src].title : null;
  function doneProps(e, v) {
    const s = SRC[e.src];
    if (s.done === "check") return { Done: v ? "__YES__" : "__NO__" };
    if (s.done === "status") return { Status: v ? "Done" : "Not started" };
    const n = NDB[e.src];
    return n.done.k === "check" ? { [n.done.p]: v ? "__YES__" : "__NO__" } : { Status: v ? n.done.on : n.done.off };
  }
  function openEv(key) {
    const e = evBy(key) || (key.startsWith("treino:") ? null : null);
    if (!e) { if (key.startsWith("treino:")) goTab("saude"); return; }
    const s = SRC[e.src], editable = s.prop !== null && !e.ro, titleEdit = !e.ro && !!titleProp(e);
    const st = e.allDay ? "" : hm(e.start), en = e.allDay || !e.end ? "" : hm(e.end);
    const canDel = !e.ro && !!e.id, canMove = !e.ro && !!e.id && (e.gcal || MOVE_FROM.includes(e.src));
    const gw = S.g.cals.filter(c => SRC[gKey(c.id)] && !SRC[gKey(c.id)].ro);
    const calSel = canMove ? `<label class="field wide">Calendário<select id="cf-cal"><optgroup label="Notion">${(MOVE_TO.includes(e.src) || e.gcal ? MOVE_TO : [e.src].concat(MOVE_TO)).map(k => `<option value="${k}"${k === e.src ? " selected" : ""}>${esc(SRC[k].l)}</option>`).join("")}</optgroup>${gw.length ? `<optgroup label="Google Calendar">${gw.map(c => `<option value="${esc(gKey(c.id))}"${gKey(c.id) === e.src ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</optgroup>` : ""}</select></label><p class="c-mini" id="cf-cal-n" hidden>Ao salvar, o item é criado no calendário escolhido (título, dia, horário, status e as propriedades abaixo) e o original vai para a lixeira${e.gcal ? " (o evento do Google é excluído)" : " do Notion"}. Outras propriedades e o conteúdo da página não vão junto. Ctrl+Z desfaz.</p>` : "";
    openSheet(`<div class="cal-sh-h" style="--c:${evC(e)}"><span class="cal-sh-src"><i></i>${esc(s.l)}</span>${canDel ? `<button type="button" class="btn ghost cal-sh-del" data-del-ev="${esc(e.key)}" title="Excluir (Delete)" aria-label="Excluir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5M10 11v5.5M14 11v5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ""}<button class="btn ghost" data-close-sheet>Fechar</button></div>
      <form id="cal-evf" data-key="${esc(e.key)}" class="cal-form" style="--c:${evC(e)}">
        ${titleEdit ? `<label class="field wide">Título<input id="cf-title" value="${esc(e.title)}"></label>` : `<h3 class="cal-sh-t">${esc(e.title)}</h3>`}
        ${e.meta ? `<p class="c-mini">${esc(e.meta)}</p>` : ""}
        ${dueOf(e) ? `<p class="cal-due">⚑ Entrega: <b>${esc(dueOf(e).label)}</b>${dueOf(e).from ? ` · ${esc(dueOf(e).from)}` : ""}</p>` : ""}
        ${calSel}
        ${(!e.gcal && !e.ro && e.id && DS[e.src]) || canMove ? `<div class="cal-props" id="cf-props"${DS[e.src] ? "" : " hidden"}></div>` : ""}
        ${editable ? `<div class="cal-fr"><label class="field">Dia<input id="cf-day" type="date" value="${e.day}"${dueOf(e) ? ` max="${dueOf(e).day}"` : ""}></label>${s.time ? `<label class="field">Início<input id="cf-t1" type="time" value="${st}"></label><label class="field">Fim<input id="cf-t2" type="time" value="${en}"></label>` : ""}</div>${s.time ? `<p class="c-mini">Sem horário, fica como dia inteiro.</p>` : ""}` : `<p class="cal-sh-d">${e.day.slice(8, 10)}/${e.day.slice(5, 7)}/${e.day.slice(0, 4)}</p>`}
        ${s.done ? `<label class="c-check-row"><input type="checkbox" id="cf-done"${e.done ? " checked" : ""}> Concluída</label>` : ""}
        ${e.gcal ? `<label class="cal-color">Cor desta agenda no painel <input type="color" id="cf-color" data-cal="${esc(e.cal)}" value="${esc(/^#/.test(s.c) ? s.c : "#039be5")}"></label>` : ""}
        <div class="c-actions">${editable || s.done || titleEdit || canMove || DS[e.src] ? `<button class="btn primary" type="submit">Salvar</button>` : ""}<a class="c-link" href="${esc(e.url)}" target="_blank" rel="noopener">Abrir no ${e.gcal ? "Google Calendar" : "Notion"} ↗</a>${canDel ? `<button type="button" class="btn ghost c-danger" data-del-ev="${esc(e.key)}">Excluir</button>` : ""}${(e.src === "workout" || e.src === "run") && !e.done && e.day <= iso(new Date()) && window.painelOpenReg ? `<button type="button" class="btn" data-reg-tr="${e.day}" data-reg-k="${e.src === "run" || /cardio|esteira|corrid|run\b|bike|bicic|el[ií]ptic|caminhad|futebol|soccer|remo|nata|escada|stair/i.test(e.title) ? "cardio" : "hevy"}">Registrar treino</button>` : ""}${s.tab ? `<button type="button" class="btn ghost" data-gotab="${s.tab}">Ver na aba ${esc({ self: "Self Improvement", carreira: "Carreira", saude: "Saúde", financas: "Finanças" }[s.tab])}</button>` : ""}</div>
        <p class="c-msg" id="cf-msg" hidden></p>
      </form>`);
    if (!e.gcal && !e.ro && e.id && DS[e.src]) renderPropFields("cf", e.src, e);
  }
  function openHabDay(day) {
    const hb = S.habits.filter(h => h.day === day);
    openSheet(`<div class="cal-sh-h" style="--c:${SRC.habit.c}"><span class="cal-sh-src"><i></i>Hábitos · ${day.slice(8, 10)}/${day.slice(5, 7)}</span><button class="btn ghost" data-close-sheet>Fechar</button></div><div class="cal-habs col">${hb.map(h => `<button type="button" class="cal-hab${h.done ? " done" : ""}" data-hab="${h.id}"><span class="cal-ck">${CHECK}</span>${esc(h.name)}</button>`).join("") || `<p class="empty">Nenhum hábito neste dia.</p>`}</div>`);
  }
  function openNew(day, t1, t2) {
    const apps = S.apps.slice().sort((a, b) => a.name.localeCompare(b.name));
    openSheet(`<div class="cal-sh-h"><span class="cal-sh-src">Novo item</span><button class="btn ghost" data-close-sheet>Fechar</button></div>
      <form id="cal-newf" class="cal-form">
        <label class="field wide">Título<input id="cn-title" required placeholder="Ex.: Pagar aluguel"></label>
        <div class="cal-fr"><label class="field">Onde<select id="cn-dest"><optgroup label="Notion">${MOVE_TO.map(k => `<option value="${k}">${esc(SRC[k].l)}</option>`).join("")}</optgroup>${S.g.cals.filter(c => !SRC[gKey(c.id)] || !SRC[gKey(c.id)].ro).length ? `<optgroup label="Google Calendar">${S.g.cals.filter(c => !SRC[gKey(c.id)] || !SRC[gKey(c.id)].ro).map(c => `<option value="${esc(gKey(c.id))}">${esc(c.name)}</option>`).join("")}</optgroup>` : ""}</select></label><label class="field" id="cn-app-w" hidden>Candidatura<select id="cn-app"><option value="">—</option>${apps.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select></label></div>
        <div class="cal-props" id="cn-props"></div>
        <div class="cal-fr"><label class="field">Dia<input id="cn-day" type="date" value="${day}"></label><label class="field">Início<input id="cn-t1" type="time" value="${t1 || ""}"></label><label class="field">Fim<input id="cn-t2" type="time" value="${t2 || ""}"></label></div>
        <div class="c-actions"><button class="btn primary" type="submit">Criar</button></div>
        <p class="c-msg" id="cn-msg" hidden></p>
      </form>`);
    setTimeout(() => $("cn-title")?.focus(), 30);
    renderPropFields("cn", $("cn-dest").value, null);
  }
  function openSheet(html) { const sh = $("cal-sheet"); $("cal-sheet-box").innerHTML = html; sh.hidden = false; }
  function closeSheet() { $("cal-sheet").hidden = true; $("cal-sheet-box").innerHTML = ""; }
  const msg = (id, t, ok) => { const el = $(id); if (!el) return; el.textContent = t || ""; el.hidden = !t; el.classList.toggle("ok", !!ok); };

  // ---------- escrita ----------
  async function update(id, props) {
    if (!S.mcp) throw { code: "no_mcp" };
    await call(T_UPDATE, { page_id: id, command: "update_properties", properties: props }, { cache: false });
    try { await S.mcp.invalidate(NOTION, T_QUERY); } catch {}
  }
  function dateProps(e, day, t1, t2) {
    const P = e.prop || SRC[e.src].prop, p = {};
    if (!day) { p[`date:${P}:start`] = null; return p; }
    if (t1 && SRC[e.src].time) { p[`date:${P}:start`] = localIso(day, t1); p[`date:${P}:end`] = t2 && t2 > t1 ? localIso(day, t2) : null; p[`date:${P}:is_datetime`] = 1; }
    else { p[`date:${P}:start`] = day; p[`date:${P}:is_datetime`] = 0; if (e.raw && e.raw.e) p[`date:${P}:end`] = null; }
    return p;
  }
  function applyLocal(e, day, t1, t2, dur) {
    if (t1 && SRC[e.src].time) { const a = new Date(`${day}T${t1}:00`); const b = t2 && t2 > t1 ? new Date(`${day}T${t2}:00`) : new Date(a.getTime() + (dur || 3600000)); Object.assign(e, { day, allDay: false, start: a, end: b, raw: { s: a.toISOString(), e: t2 ? b.toISOString() : null, dt: true } }); }
    else Object.assign(e, { day, allDay: true, start: null, end: null, raw: { s: day, e: null, dt: false } });
  }
  // ---------- prazo de entrega ("Due Date") ----------
  // Bases com uma data de execução (Date/ETA) e outra de entrega (Due Date): a tarefa não pode ser agendada depois da
  // entrega. Student Tasks herdam a entrega da Assignment ligada ("Student Assignments/Seminars").
  function dueFromRaw(s, dt) {
    if (!s) return null;
    if (dt && s.length > 10) { const d = new Date(s); return { day: iso(d), min: minsOf(d), label: `${iso(d).slice(8, 10)}/${iso(d).slice(5, 7)} ${hm(d)}` }; }
    return { day: s.slice(0, 10), min: null, label: `${s.slice(8, 10)}/${s.slice(5, 7)}` };
  }
  function dueOf(e) {
    if (!e || e.gcal || !e.row) return null;
    if (e.src === "stask") {
      const ids = rel(e.row["Student Assignments/Seminars"]); if (!ids.length) return null;
      const a = S.ev.find(x => x.src === "assign" && ids.includes(x.id)); if (!a) return null;
      const r = a.raw; const d = r && r.s ? dueFromRaw(r.e || r.s, r.dt) : dueFromRaw(a.endDay || a.day, false);
      return d && Object.assign(d, { from: a.title });
    }
    const P = e.prop || SRC[e.src].prop;
    if (P === "Due Date") return null; // a própria data agendada já é a entrega
    const s = e.row["date:Due Date:start"]; if (!s) return null;
    return dueFromRaw(e.row["date:Due Date:end"] || s, e.row["date:Due Date:is_datetime"] === 1);
  }
  const toMin = t => { const [h, m] = String(t).split(":").map(Number); return h * 60 + (m || 0); };
  function okDue(e, day, t1) {
    const d = dueOf(e); if (!d || !day) return true;
    if (day < d.day) return true; if (day > d.day) return false;
    return d.min == null || !t1 || toMin(t1) <= d.min;
  }
  const dueMsg = e => { const d = dueOf(e); return d ? `Entrega em ${d.label}${d.from ? ` (${d.from})` : ""}: não dá para agendar depois disso.` : ""; };
  async function moveEv(e, day, t1, t2, undo = true) {
    if (undo && !okDue(e, day, t1)) { toast(dueMsg(e)); render(); return; }
    const was = { day: e.day, allDay: e.allDay, start: e.start, end: e.end, raw: e.raw, endDay: e.endDay };
    const w1 = tOf(e), w2 = t2Of(e);
    const write = e.gcal ? gTimes(e, day, t1, t2) : dateProps(e, day, t1, t2), dur = !e.allDay && e.start && e.end ? e.end - e.start : null;
    applyLocal(e, day, t1, t2, dur); if (e.endDay && was.endDay) e.endDay = t1 ? null : shift(day, Math.round((parseISO(was.endDay) - parseISO(was.day)) / 864e5));
    S.busy.add(e.key); render();
    try {
      if (e.gcal) await gUpdate(e, write); else await update(e.id, write);
      notifyTabs();
      if (undo) pushUndo(`${short(e.title)} → ${day.slice(8, 10)}/${day.slice(5, 7)}${t1 ? " " + t1 : ""}`, () => moveEv(e, was.day, w1, w2, false));
    }
    catch (err) { Object.assign(e, was); if (!undo) throw err; toast(e.gcal ? gErrCopy(err) : errCopy(err)); }
    finally { S.busy.delete(e.key); render(); }
  }
  async function toggleDone(e, undo = true) {
    const s = SRC[e.src]; if (!s.done) return;
    const was = e.done; e.done = !was; S.busy.add(e.key); render();
    try { await update(e.id, doneProps(e, e.done)); notifyTabs(); if (undo) pushUndo(`${e.done ? "Concluída" : "Reaberta"} · ${short(e.title)}`, () => toggleDone(e, false)); }
    catch (err) { e.done = was; if (!undo) throw err; toast(errCopy(err)); }
    finally { S.busy.delete(e.key); render(); }
  }
  async function toggleHabit(h, undo = true) {
    const was = h.done; h.done = !was; S.busy.add("habit:" + h.id); render(); refreshSheetHabits(h.day);
    try { await update(h.id, { Status: h.done ? "Done" : (h.day < todayISO() ? "Not Done" : "Not started") }); notifyTabs(); if (undo) pushUndo(`Hábito ${h.done ? "feito" : "desmarcado"} · ${short(h.name)}`, () => toggleHabit(h, false)); }
    catch (err) { h.done = was; if (!undo) throw err; toast(errCopy(err)); }
    finally { S.busy.delete("habit:" + h.id); render(); refreshSheetHabits(h.day); }
  }
  function refreshSheetHabits(day) { if (!$("cal-sheet").hidden && $("cal-sheet-box").querySelector(".cal-habs.col")) openHabDay(day); }
  // trocar de calendário: cria no destino (título, dia, horário, status) e apaga o original; Ctrl+Z volta tudo
  async function moveCal(e, dest, title, day, t1, t2, done, btn, extra) {
    if (!S.mcp) { msg("cf-msg", errCopy({ code: "no_mcp" })); return; }
    if (dest.startsWith("g:") && !day) { msg("cf-msg", "Um evento do Google precisa de um dia."); return; }
    btn.disabled = true;
    let ne;
    try { ne = await createIn(dest, title, day, t1, t2, done, extra); }
    catch (err) { msg("cf-msg", err && err.g ? gErrCopy(err) : errCopy(err)); btn.disabled = false; return; }
    try { await removeEv(e); }
    catch (err) { closeSheet(); render(); toast("Criado em " + SRC[dest].l + ", mas não consegui apagar o original. " + (err && err.g ? gErrCopy(err) : errCopy(err))); return; }
    closeSheet(); render(); notifyTabs();
    pushUndo(`${short(title)} → ${SRC[dest].l}`, async () => { if (ne) await removeEv(ne); else gLoad(false); await restoreEv(e); });
  }
  async function saveEvForm(f) {
    const e = evBy(f.dataset.key); if (!e) return;
    const s = SRC[e.src], props = {}, btn = f.querySelector("[type=submit]");
    const title = $("cf-title") ? $("cf-title").value.trim() : null;
    const dest = $("cf-cal") ? $("cf-cal").value : e.src;
    if (dest !== e.src) {
      const day = $("cf-day") ? $("cf-day").value : e.day, t1 = $("cf-day") ? ($("cf-t1")?.value || "") : (tOf(e) || ""), t2 = $("cf-day") ? ($("cf-t2")?.value || "") : (t2Of(e) || "");
      const extra = DS[dest] && $("cf-props") && $("cf-props").dataset.dest === dest ? readProps("cf", false).out : {};
      return moveCal(e, dest, title || e.title, day, t1, t2, $("cf-done") ? $("cf-done").checked : e.done, btn, extra);
    }
    const old = { title: e.title, day: e.day, allDay: e.allDay, start: e.start, end: e.end, endDay: e.endDay, raw: e.raw, done: e.done }, o1 = tOf(e), o2 = t2Of(e), snap = Object.assign({}, e);
    if (title && title !== e.title) props[titleProp(e)] = title;
    let day = e.day, t1 = null, t2 = null, dateChanged = false;
    if ($("cf-day")) {
      day = $("cf-day").value; t1 = $("cf-t1")?.value || ""; t2 = $("cf-t2")?.value || "";
      const was1 = e.allDay ? "" : hm(e.start), was2 = e.allDay || !e.end ? "" : hm(e.end);
      dateChanged = day !== e.day || t1 !== was1 || (t1 && t2 !== was2);
      if (dateChanged) { if (e.gcal && !day) { msg("cf-msg", "Um evento do Google precisa de um dia."); return; } if (!okDue(e, day, t1)) { msg("cf-msg", dueMsg(e)); return; } Object.assign(props, e.gcal ? gTimes(e, day, t1, t2) : dateProps(e, day, t1, t2)); }
    }
    const done = $("cf-done") ? $("cf-done").checked : e.done;
    if (s.done && done !== e.done) Object.assign(props, doneProps(e, done));
    const xp = e.gcal ? { out: {}, old: {} } : readProps("cf", true);
    Object.assign(props, xp.out);
    if (!Object.keys(props).length) { msg("cf-msg", "Nada mudou.", true); return; }
    btn.disabled = true;
    try {
      const dur = !e.allDay && e.start && e.end ? e.end - e.start : null;
      if (e.gcal) await gUpdate(e, props); else await update(e.id, props);
      if (title && title !== e.title) e.title = title;
      if (dateChanged) { if (day) { applyLocal(e, day, t1, t2, dur); e.endDay = null; } else S.ev = S.ev.filter(x => x !== e); }
      e.done = done;
      const setRow = vals => { e.row = Object.assign({}, e.row, vals); for (const k in vals) if (e.src === "ptask" && k === "Priority") e.meta = clean(vals[k] || ""); };
      setRow(xp.out);
      closeSheet(); render(); notifyTabs();
      const rev = Object.assign({}, xp.old);
      if (title && title !== old.title) rev[titleProp(e)] = old.title;
      if (dateChanged) Object.assign(rev, e.gcal ? gTimes(snap, old.day, o1, o2) : dateProps(snap, old.day, o1, o2));
      if (s.done && done !== old.done) Object.assign(rev, doneProps(e, old.done));
      pushUndo(`${e.gcal ? "Salvo no Google Calendar" : "Salvo no Notion"} · ${short(e.title)}`, async () => {
        if (e.gcal) { try { await gUpdate(e, rev); } catch (err) { throw gErr(err); } } else await update(e.id, rev);
        Object.assign(e, old); setRow(xp.old); if (!e.gcal && !S.ev.includes(e)) S.ev.push(e);
      });
    } catch (err) { msg("cf-msg", errCopy(err)); }
    finally { if (btn.isConnected) btn.disabled = false; }
  }
  // cria no destino e devolve o novo item (já na lista); Google precisa de um dia
  async function createIn(dest, title, day, t1, t2, done, extra) {
    if (dest.startsWith("g:")) {
      const cal = dest.slice(2);
      return gCreate(cal, Object.assign({ calendarId: cal, summary: title }, gTimes(null, day, t1, t2)));
    }
    const N = NDB[dest], P = N ? N.props[0] : SRC[dest].prop;
    const props = N ? Object.assign({ [N.title]: title }, N.done.k === "check" ? { [N.done.p]: done ? "__YES__" : "__NO__" } : { Status: done ? N.done.on : N.done.off })
      : dest === "devtask" ? { Name: title, Status: done ? "Done" : "Not started" } : { Name: title, Done: done ? "__YES__" : "__NO__" };
    if (day) Object.assign(props, dateProps({ src: dest, prop: P }, day, t1, t2));
    if (extra) Object.assign(props, extra);
    const res = await call(T_CREATE, { parent: { data_source_id: DS[dest] }, pages: [{ properties: props }] }, { cache: false });
    try { await S.mcp.invalidate(NOTION, T_QUERY); } catch {}
    const p = payloadOf(res), url = p && Array.isArray(p.pages) && p.pages[0] ? p.pages[0].url : null;
    if (!url) return null;
    if (dest === "workout" && day && window.painelAddSetsView && !/cardio|esteira|corrid|run\b|bike|bicic|el[ií]ptic|caminhad|futebol|soccer|remo|nata|escada|stair/i.test(title)) { try { await window.painelAddSetsView(url, day); } catch {} }
    const e = { key: dest + ":" + pageId(url), id: pageId(url), url, src: dest, title, done: !!done, day, raw: null, prop: P, row: Object.assign({}, extra || {}) };
    if (dest === "ptask" && extra && extra.Priority) e.meta = extra.Priority;
    if (day) { applyLocal(e, day, t1, t2); S.ev.push(e); }
    return e;
  }
  async function createTask(f) {
    const title = $("cn-title").value.trim(), dest = $("cn-dest").value, day = $("cn-day").value, t1 = $("cn-t1").value, t2 = $("cn-t2").value, app = $("cn-app")?.value || "";
    if (!title) { msg("cn-msg", "Escreva o título."); return; }
    if (!S.mcp) { msg("cn-msg", errCopy({ code: "no_mcp" })); return; }
    if (dest.startsWith("g:") && !day) { msg("cn-msg", "Escolha o dia do evento."); return; }
    const btn = f.querySelector("[type=submit]"); btn.disabled = true;
    const extra = dest.startsWith("g:") ? {} : readProps("cn", false).out;
    try {
      let ne;
      if (dest === "jtask" && app) {
        // candidatura vinculada: mesma criação, com a relação
        const props = Object.assign({ Name: title, Done: "__NO__", "Job Application Tracker": [app] }, extra);
        if (day) Object.assign(props, dateProps({ src: dest, prop: SRC.jtask.prop }, day, t1, t2));
        const res = await call(T_CREATE, { parent: { data_source_id: DS.jtask }, pages: [{ properties: props }] }, { cache: false });
        try { await S.mcp.invalidate(NOTION, T_QUERY); } catch {}
        const p = payloadOf(res), url = p && Array.isArray(p.pages) && p.pages[0] ? p.pages[0].url : null;
        if (url) { ne = { key: "jtask:" + pageId(url), id: pageId(url), url, src: "jtask", title, done: false, day, raw: null, prop: SRC.jtask.prop, row: Object.assign({}, extra, { "Job Application Tracker": JSON.stringify([app]) }) }; if (day) { applyLocal(ne, day, t1, t2); S.ev.push(ne); } }
      } else ne = await createIn(dest, title, day, t1, t2, false, extra);
      closeSheet(); render(); notifyTabs();
      if (ne && ne.id) pushUndo(`Criado em ${SRC[dest] ? SRC[dest].l : "Google Calendar"} · ${short(title)}`, () => removeEv(ne));
      else toast(`Criado em ${SRC[dest] ? SRC[dest].l : "Google Calendar"}`);
    } catch (err) { msg("cn-msg", err && err.g ? gErrCopy(err) : errCopy(err)); }
    finally { if (btn.isConnected) btn.disabled = false; }
  }
  // outras abas releem o Notion quando forem abertas de novo
  function notifyTabs() { try { window.dispatchEvent(new CustomEvent("painel:notion-changed", { detail: { from: "calendario" } })); } catch {} }
  function goTab(tab) { document.querySelector(`.tab[data-tab="${tab}"]`)?.click(); }

  // ---------- arrastar ----------
  // mês e linha "dia todo": arrastar e soltar nativo entre dias; grade de horas: ponteiro, com encaixe de 15 min
  // arrastar itens com o ponteiro (mouse, caneta ou dedo). Um item com horário segue o cursor pela grade, troca de dia
  // e de hora e pode ir para a seção "dia todo"; um chip (dia todo, mês) vira uma sombra que vai aonde o cursor for.
  // Perto das bordas a grade rola sozinha: para cima/baixo e para os dias vizinhos. Soltar salva direto.
  function bindDnD(root) {
    const EDGE = 44;
    let D = null;
    const hitAt = (x, y) => {
      const h = document.elementFromPoint(x, y); if (!h) return null;
      let c = h.closest("[data-day]");
      if (!c && h.closest(".cal-adr")) c = [...h.closest(".cal-adr").querySelectorAll(".cal-allc")].find(z => { const q = z.getBoundingClientRect(); return x >= q.left && x < q.right; }) || null;
      return c && root.contains(c) ? c : null;
    };
    const setDrop = c => { if (D.drop === c) return; if (D.drop) D.drop.classList.remove("drop", "nodrop"); D.drop = c; if (c) { c.classList.add("drop"); if (D.due && c.dataset.day > D.due.day) c.classList.add("nodrop"); } };
    const dayTag = day => `${DOWS[dowIdx(day)]} ${day.slice(8, 10)}`;
    function autoScroll() {
      if (!D) return;
      const { x, y } = D.p, b = root.getBoundingClientRect(), vp = root.querySelector(".cal-vp");
      let did = false;
      if (vp && (pref.view === "week" || pref.view === "day") && y > b.top && y < b.bottom) {
        const v = vp.getBoundingClientRect();
        const k = x < v.left + EDGE ? -Math.min(1, (v.left + EDGE - x) / EDGE) : x > v.right - EDGE ? Math.min(1, (x - v.right + EDGE) / EDGE) : 0;
        if (k) { unroll(); stripMove(k * 0.07); did = true; }
        if (root.scrollHeight > root.clientHeight + 2) { // grade com rolagem própria
          const top = b.top + D.stickH;
          if (y < top + 28 && root.scrollTop > 0) { root.scrollTop -= Math.ceil(14 * Math.min(1, (top + 28 - y) / 28)); did = true; }
          else if (y > b.bottom - 28) { root.scrollTop += Math.ceil(14 * Math.min(1, (y - b.bottom + 28) / 28)); did = true; }
        } else { // grade do dia inteiro: quem rola é a página
          const top = Math.max(0, b.top) + D.stickH, bot = Math.min(innerHeight, b.bottom) - (matchMedia("(max-width: 760px)").matches ? 96 : 0);
          if (y < top + 36 && scrollY > 0) { scrollBy(0, -Math.ceil(16 * Math.min(1, (top + 36 - y) / 36))); did = true; }
          else if (y > bot - 36) { scrollBy(0, Math.ceil(16 * Math.min(1, (y - bot + 36) / 36))); did = true; }
        }
      }
      if (did) D.update();
      D.raf = requestAnimationFrame(autoScroll);
    }
    root.addEventListener("pointerdown", ev => {
      if (ev.button !== 0 || D || ev.target.closest("[data-ck], [data-adtg], [data-admore]")) return;
      const tev = ev.target.closest(".cal-tev[data-move='1']"), chipEl = !tev && ev.target.closest(".cal-ev[data-drag]");
      if (!tev && !chipEl) return;
      const e = evBy((tev || chipEl).dataset.ev); if (!e) return;
      ev.preventDefault(); // sem seleção de texto
      const x0 = ev.clientX, y0 = ev.clientY, el = tev || chipEl;
      D = { e, el, timed: !!tev, resize: tev && ev.target.closest("[data-rz]") ? ev.target.closest("[data-rz]").dataset.rz : null, moved: false, p: { x: x0, y: y0 }, drop: null, stickH: (root.querySelector(".cal-stick") || {}).offsetHeight || 0 };
      if (D.timed) {
        D.grab = y0 - el.getBoundingClientRect().top; D.col0 = el.closest(".cal-col"); D.target = D.col0;
        D.sMin = minsOf(e.start); D.dur = e.end ? Math.max(15, Math.round((e.end - e.start) / 60000)) : 60; D.ns = D.sMin; D.nd = D.dur;
      }
      const lbl = (day, a, b) => { const t = el.querySelector("b"); if (t) t.textContent = `${day !== e.day ? dayTag(day) + " · " : ""}${hmOf(a)}–${hmOf(b)}`; };
      D.update = () => {
        if (!D.moved) return;
        if (D.timed) {
          const cr0 = D.col0.getBoundingClientRect();
          if (D.resize === "t") {
            // borda de cima: o fim fica, o início anda (mínimo de 15 min)
            const end0 = D.sMin + D.dur, st = Math.round((H0 * 60 + (D.p.y - cr0.top) / HPX * 60) / 15) * 15;
            D.ns = Math.max(H0 * 60, Math.min(end0 - 15, st)); D.nd = end0 - D.ns;
            el.style.top = `${(D.ns - H0 * 60) / 60 * HPX}px`; el.style.height = `${D.nd / 60 * HPX - 2}px`; lbl(e.day, D.ns, end0); return;
          }
          if (D.resize) {
            const end = Math.round((H0 * 60 + (D.p.y - cr0.top) / HPX * 60) / 15) * 15;
            D.nd = Math.max(15, Math.min(H1 * 60 - D.sMin, end - D.sMin));
            el.style.height = `${D.nd / 60 * HPX - 2}px`; lbl(e.day, D.sMin, D.sMin + D.nd); return;
          }
          const hit = hitAt(D.p.x, D.p.y);
          if (hit && hit.classList.contains("cal-allc") && hit.closest(".cal-adr")) { setDrop(hit); D.toAll = hit; el.style.opacity = ".35"; return; }
          D.toAll = null; el.style.opacity = ""; setDrop(null);
          const col = hit && hit.closest(".cal-col[data-slot]"); if (col) D.target = col;
          const cr = D.target.getBoundingClientRect();
          D.ns = Math.max(H0 * 60, Math.min(Math.max(H0 * 60, H1 * 60 - D.dur), Math.round((H0 * 60 + (D.p.y - D.grab - cr.top) / HPX * 60) / 15) * 15));
          el.style.top = `${(D.ns - H0 * 60) / 60 * HPX}px`;
          el.style.transform = `translateX(${cr.left - cr0.left}px)`;
          lbl(D.target.dataset.day, D.ns, D.ns + D.dur);
          el.classList.toggle("nodue", !okDue(e, D.target.dataset.day, hmOf(D.ns)));
          return;
        }
        D.gh.style.transform = `translate(${D.p.x - x0}px, ${D.p.y - y0}px)`;
        const hit = hitAt(D.p.x, D.p.y); setDrop(hit);
        let tag = "";
        if (hit && hit.dataset.slot) { const m = Math.max(H0 * 60, Math.min(H1 * 60 - 15, Math.round((H0 * 60 + (D.p.y - hit.getBoundingClientRect().top) / HPX * 60) / 15) * 15)); tag = `${dayTag(hit.dataset.day)} · ${hmOf(m)}`; }
        else if (hit) tag = dayTag(hit.dataset.day);
        D.gh.dataset.t = tag;
      };
      const begin = () => {
        D.moved = true; S.dragging = true; root.classList.add("dnd");
        D.due = dueOf(e); if (D.due) root.querySelectorAll("[data-day]").forEach(c => { if (c.dataset.day > D.due.day) c.classList.add("pastdue"); });
        if (D.timed) { el.classList.add("moving"); el.style.pointerEvents = "none"; if (!D.resize) { el.style.left = "2px"; el.style.width = "calc(100% - 4px)"; } }
        else {
          const r = el.getBoundingClientRect();
          D.gh = el.cloneNode(true); D.gh.classList.add("cal-ghost");
          Object.assign(D.gh.style, { left: r.left + "px", top: r.top + "px", width: Math.max(140, r.width) + "px" });
          document.body.appendChild(D.gh); el.classList.add("dragging");
        }
        D.raf = requestAnimationFrame(autoScroll);
      };
      const mv = m => {
        if (!D) return;
        D.p = { x: m.clientX, y: m.clientY };
        if (!D.moved) { if (Math.abs(m.clientX - x0) < 4 && Math.abs(m.clientY - y0) < 4) return; begin(); }
        D.update();
      };
      const up = u => {
        window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
        const d = D; D = null; if (!d) return;
        cancelAnimationFrame(d.raf); S.dragging = false; root.classList.remove("dnd");
        root.querySelectorAll(".pastdue, .nodrop").forEach(c => c.classList.remove("pastdue", "nodrop")); el.classList.remove("nodue");
        if (d.drop) d.drop.classList.remove("drop");
        if (d.gh) d.gh.remove();
        el.classList.remove("dragging");
        if (!d.moved) { if (d.timed) { S.click = Date.now(); openEv(e.key); } return; } // chips abrem pelo clique
        S.click = S.dragEnd = Date.now();
        if (u.type === "pointercancel") { render(); return; }
        if (d.timed) {
          if (d.resize === "t") return d.ns === d.sMin ? render() : moveEv(e, e.day, hmOf(d.ns), hmOf(d.sMin + d.dur));
          if (d.resize) return d.nd === d.dur ? render() : moveEv(e, e.day, hmOf(d.sMin), hmOf(d.sMin + d.nd));
          if (d.toAll) return moveEv(e, d.toAll.dataset.day, null, null);
          const day = d.target.dataset.day;
          if (day === e.day && d.ns === d.sMin) { render(); return; }
          return moveEv(e, day, hmOf(d.ns), hmOf(d.ns + d.dur));
        }
        const c = d.drop; if (!c) return;
        const day = c.dataset.day;
        if (c.dataset.slot) {
          const m = Math.max(H0 * 60, Math.min(H1 * 60 - 15, Math.round((H0 * 60 + (d.p.y - c.getBoundingClientRect().top) / HPX * 60) / 15) * 15));
          const dur = e.allDay || !e.start || !e.end ? 30 : Math.round((e.end - e.start) / 60000); // de "dia todo" para a grade: 30 min
          return moveEv(e, day, hmOf(m), SRC[e.src].time ? hmOf(m + dur) : null);
        }
        if (c.classList.contains("cal-allc")) { if ((e.allDay || !e.start) && day === e.day) return; return moveEv(e, day, null, null); }
        if (day === e.day) return;
        moveEv(e, day, e.allDay || !e.start ? null : hm(e.start), e.allDay || !e.end ? null : hm(e.end));
      };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    });
  }
  const hmOf = m => { m = Math.max(0, Math.min(23 * 60 + 59, m)); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };

  // ---------- eventos ----------
  // arrastar com o mouse (ou o dedo) na área do calendário: o conteúdo acompanha o gesto, dia a dia, sem limite de semana.
  // Só começa em áreas vazias (não em eventos, botões ou campos) e só vale quando o movimento é mais horizontal.
  // visão contínua: três painéis lado a lado (dia ou semana anterior, atual e seguinte). O bloco fica parado;
  // a rolagem (ou o arraste dentro dele) desloca o conjunto em frações de dia, e pode parar no meio de um dia.
  // celular: a "Semana" mostra 3 dias por vez e desliza para os lados (no computador, 7)
  const narrow = () => window.matchMedia("(max-width: 640px)").matches;
  function stripN() { return pref.view === "day" ? 1 : narrow() ? 3 : 7; }
  function stripBase() { const c = parseISO(S.cursor); return pref.view === "week" && !S.rolling && !narrow() ? monday(c) : c; }
  function stripX() { return `translateX(${(-33.3333 - (S.frac || 0) * 100 / (3 * stripN())).toFixed(4)}%)`; }
  function visRange() {
    if (pref.view !== "week" && pref.view !== "day") return range();
    const kc = S.cursor, kr = S.rolling;
    S.cursor = iso(addDays(stripBase(), Math.round(S.frac || 0))); S.rolling = true;
    try { return range(); } finally { S.cursor = kc; S.rolling = kr; }
  }
  // seção "dia todo" como no Notion Calendar: fica sob os nomes dos dias, presa no topo; a altura é a mesma para os
  // dias visíveis e acompanha o deslize horizontal (some se nenhum dia visível tem itens). Itens de vários dias viram
  // uma barra contínua. Recolhida, mostra até 3 linhas e "+N" no dia que tem mais; o botão na coluna das horas expande.
  const AD_ROW = 20, AD_GAP = 2, AD_MAX = 3;
  function adLayout(first, n) {
    const fi = parseISO(first), idx = d => Math.round((parseISO(d) - fi) / 864e5);
    const seen = new Map();
    for (let i = 0; i < n; i++) for (const e of eventsFor(shift(first, i))) if ((e.allDay || !e.start) && !e.plan && !seen.has(e.key)) seen.set(e.key, e);
    const items = [...seen.values()].map((e, o) => { const end = e.allDay && e.endDay && e.endDay > e.day ? e.endDay : e.day; return { e, o, a: Math.max(0, idx(e.day)), b: Math.min(n - 1, idx(end)) }; })
      .sort((x, y) => x.a - y.a || (y.b - y.a) - (x.b - x.a) || x.o - y.o);
    const ends = [], depth = new Array(n).fill(0), hid = new Array(n).fill(0);
    for (const it of items) {
      let l = 0; while (ends[l] !== undefined && ends[l] >= it.a) l++;
      ends[l] = it.b; it.lane = l;
      for (let i = it.a; i <= it.b; i++) { depth[i] = Math.max(depth[i], l + 1); if (l >= AD_MAX) hid[i]++; }
    }
    return { first, n, items, depth, hid, max: Math.max(0, ...depth) };
  }
  function adHtml(L, p0, n) {
    const open = !!pref.adOpen;
    let rows = 0, more = "";
    const bars = L.items.filter(it => it.b >= p0 && it.a < p0 + n && (open || it.lane < AD_MAX)).map(it => {
      rows = Math.max(rows, it.lane + 1);
      const c0 = Math.max(it.a, p0) - p0 + 1, c1 = Math.min(it.b, p0 + n - 1) - p0 + 2;
      return `<div class="cal-adb${it.a < p0 ? " cont-l" : ""}${it.b > p0 + n - 1 ? " cont-r" : ""}" style="grid-column:${c0} / ${c1};grid-row:${it.lane + 2}">${chip(it.e)}</div>`;
    }).join("");
    if (!open) for (let i = 0; i < n; i++) if (L.hid[p0 + i]) { rows = AD_MAX + 1; more += `<button type="button" class="cal-admore" data-admore="1" style="grid-column:${i + 1};grid-row:${AD_MAX + 2}">+${L.hid[p0 + i]}</button>`; }
    const cells = Array.from({ length: n }, (_, i) => `<div class="cal-allc" data-day="${shift(L.first, p0 + i)}" style="grid-column:${i + 1};grid-row:1 / -1"></div>`).join("");
    return `<div class="cal-adr" style="grid-template-rows:${rows ? `3px repeat(${rows}, ${AD_ROW}px)` : "0px"}">${cells}${bars}${more}</div>`;
  }
  // altura da seção: o necessário para os dias que estão na tela agora (inclui os parcialmente visíveis)
  function adPx() {
    const L = S.adL; if (!L) return 0;
    const N = stripN(), f = S.frac || 0, i0 = Math.max(0, N + Math.floor(f)), i1 = Math.min(L.n - 1, N + Math.ceil(f + N) - 1);
    let m = 0; for (let i = i0; i <= i1; i++) m = Math.max(m, L.depth[i]);
    const rows = pref.adOpen ? m : Math.min(m, AD_MAX) + (m > AD_MAX ? 1 : 0);
    return rows ? 3 + rows * (AD_ROW + AD_GAP) + 3 : 0;
  }
  function setAdh() { const b = $("cal-body"); if (b) b.style.setProperty("--adh", adPx() + "px"); }
  function stripHtml() {
    const N = stripN(), base = stripBase(), kc = S.cursor, kr = S.rolling;
    const L = S.adL = adLayout(iso(addDays(base, -N)), 3 * N);
    const parts = [-1, 0, 1].map((k, j) => {
      S.cursor = iso(addDays(base, k * N)); S.rolling = true;
      try { return `<div class="cal-pan">${gridHtml(range(), true, adHtml(L, j * N, N))}</div>`; } finally { S.cursor = kc; S.rolling = kr; }
    });
    let hrs = ""; for (let hh = H0; hh < H1; hh++) hrs += `<div class="cal-hr" style="top:${(hh - H0) * HPX}px"><span>${pad(hh)}:00</span></div>`;
    const tg = L.max > AD_MAX || pref.adOpen ? `<button type="button" class="cal-adtg" data-adtg="1" title="${pref.adOpen ? "Recolher itens do dia todo" : "Mostrar todos os itens do dia todo"}" aria-expanded="${!!pref.adOpen}">${pref.adOpen ? "▴" : "▾"}</button>` : "";
    return `<div class="cal-frame"><div class="cal-axis"><div class="cal-axis-hd"><div class="cal-axis-ad">${tg}</div></div><div class="cal-axis-tg" style="height:${(H1 - H0) * HPX}px">${hrs}</div></div><div class="cal-vp"><div class="cal-strip" style="transform:${stripX()}">${parts.join("")}</div></div></div>`;
  }
  // d em dias (positivo = dias seguintes); ao passar de um painel inteiro, reancora o cursor e redesenha
  function stripMove(d) {
    const N = stripN();
    S.frac = (S.frac || 0) + d;
    if (S.dragging) S.frac = Math.max(-N + 0.001, Math.min(N - 0.001, S.frac));
    else if (Math.abs(S.frac) >= N) {
      const k = Math.trunc(S.frac / N) * N;
      S.frac -= k; S.cursor = iso(addDays(stripBase(), k));
      render(); return;
    }
    const s = $("cal-body").querySelector(".cal-strip"); if (s) s.style.transform = stripX();
    setAdh();
    $("cal-label").textContent = visRange().label;
  }
  // a semana (Seg–Dom) passa a começar no dia do gesto, sem pular de posição
  function unroll() {
    if (pref.view !== "week" || S.rolling) return;
    const c = parseISO(S.cursor);
    S.frac = (S.frac || 0) + Math.round((monday(c) - c) / 864e5); S.rolling = true;
  }
  function bindSwipe(root) {
    let st = null;
    const skip = el => el.closest("button, a, input, select, textarea, label, [draggable='true'], [data-drag], .cal-ev, .cal-tev, [data-move], .cal-sheet, .cal-chip");
    const px = () => Math.max(60, (root.querySelector(".cal-vp") || root).clientWidth / stripN()); // largura de um dia na tela
    const dayView = () => pref.view === "week" || pref.view === "day";
    root.addEventListener("pointerdown", ev => {
      if (ev.button !== 0 || skip(ev.target)) return;
      st = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, locked: false, lx: 0 };
    });
    root.addEventListener("pointermove", ev => {
      if (!st || ev.pointerId !== st.id) return;
      const dx = ev.clientX - st.x, dy = ev.clientY - st.y;
      if (!st.locked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx) || !dayView()) { st = null; return; }
        st.locked = true; st.lx = dx; root.style.userSelect = "none"; unroll();
        try { root.setPointerCapture(ev.pointerId); } catch {}
      }
      const d = dx - st.lx; st.lx = dx;
      if (d) stripMove(-d / px()); // o conteúdo acompanha o dedo
    });
    const end = ev => {
      if (!st || ev.pointerId !== st.id) return;
      st = null; root.style.userSelect = "";
    };
    root.addEventListener("pointerup", end);
    root.addEventListener("pointercancel", end);
    // roda lateral do mouse (rolagem horizontal) desloca o conteúdo; a roda vertical segue rolando as horas
    root.addEventListener("wheel", ev => {
      if (!dayView()) return;
      const h = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : 0;
      if (!h) return;
      ev.preventDefault();
      unroll();
      stripMove(h / px());
    }, { passive: false });
  }
  function nav(dir) {
    S.rolling = false; S.frac = 0; // setas e "Hoje" voltam às semanas de segunda a domingo
    const c = parseISO(S.cursor);
    if (dir === 0) S.cursor = todayISO();
    else if (pref.view === "month") S.cursor = iso(new Date(c.getFullYear(), c.getMonth() + dir, 1));
    else if (pref.view === "week") S.cursor = shift(S.cursor, stripN() * dir);
    else if (pref.view === "agenda") S.cursor = shift(S.cursor, 21 * dir);
    else S.cursor = shift(S.cursor, dir);
    S.mini = null; render();
  }
  function bind() {
    const root = $("view-calendario");
    root.addEventListener("click", ev => {
      const t = ev.target, q = s => t.closest(s); let el;
      if (t === $("cal-sheet") || q("[data-close-sheet]")) { closeSheet(); return; }
      if (q("#cal-prev")) return nav(-1);
      if (q("#cal-next")) return nav(1);
      if (q("#cal-today")) return nav(0);
      if (q("#cal-refresh")) return load(true);
      if (q("#cal-add")) return openNew(pref.view === "month" ? todayISO() : S.cursor);
      if (q("#cal-gstatus")) { const t = $("cal-gstatus").title; if (t) toast(t); return; }
      if (q("#cal-mgr-t")) return setMgr(!pref.mgr);
      if (q("#cal-mgr-x") || t === $("cal-mgr-bg")) return setMgr(false);
      if (q("#cal-mg-all")) { pref.off = []; savePref(); render(); return; }
      if (q("#cal-mg-reset")) { pref.sc = {}; pref.gc = {}; for (const k in DEFC) if (SRC[k]) SRC[k].c = DEFC[k]; savePref(); render(); return; }
      if ((el = q("[data-mg-tg]"))) { const g = el.dataset.mgTg; pref.gx[g] = !pref.gx[g]; savePref(); renderMgr(); return; }
      if ((el = q("[data-mg-grp]"))) { const g = mgrGroups().find(x => x.id === el.dataset.mgGrp); if (!g) return; const vis = g.keys.some(on); pref.off = vis ? [...new Set([...pref.off, ...g.keys])] : pref.off.filter(k => !g.keys.includes(k)); savePref(); render(); return; }
      if ((el = q("[data-solo]"))) { const k = el.dataset.solo, solo = allKeys().every(x => x === k ? on(x) : !on(x)); pref.off = solo ? [] : allKeys().filter(x => x !== k); savePref(); render(); return; }
      if ((el = q("[data-mini]"))) { const b = parseISO(S.mini || S.cursor); S.mini = iso(new Date(b.getFullYear(), b.getMonth() + Number(el.dataset.mini), 1)); renderMini(range()); return; }
      if ((el = q("[data-miniday]"))) { S.frac = 0; S.cursor = el.dataset.miniday; S.mini = null; if (window.matchMedia("(max-width: 900px)").matches) pref.mgr = false; savePref(); render(); return; }
      if (q(".cal-mg-sw")) return;
      if ((el = q("#cal-views button, [data-view]"))) { S.frac = 0; pref.view = el.dataset.v || el.dataset.view; savePref(); render(); return; }
      if ((el = q("#cal-mgr [data-src]"))) { const k = el.dataset.src; pref.off = on(k) ? [...pref.off, k] : pref.off.filter(x => x !== k); savePref(); render(); return; }
      if ((el = q("[data-adtg], [data-admore]"))) { pref.adOpen = el.dataset.admore ? true : !pref.adOpen; savePref(); render(); return; }
      if ((el = q("[data-ck]"))) { ev.stopPropagation(); const e = evBy(el.dataset.ck); if (e) toggleDone(e); return; }
      if ((el = q("[data-hab]"))) { const h = S.habits.find(x => x.id === el.dataset.hab); if (h) toggleHabit(h); return; }
      if ((el = q("[data-habday]"))) { openHabDay(el.dataset.habday); return; }
      if ((el = q("[data-gotab]"))) { closeSheet(); goTab(el.dataset.gotab); return; }
      if ((el = q("[data-reg-tr]"))) { const d = el.dataset.regTr, k = el.dataset.regK; closeSheet(); goTab("saude"); setTimeout(() => window.painelOpenReg && window.painelOpenReg(k, d), 60); return; }
      if ((el = q("[data-goday]"))) { S.frac = 0; S.cursor = el.dataset.goday; pref.view = "day"; savePref(); render(); return; }
      if ((el = q("[data-new]"))) { openNew(el.dataset.new); return; }
      if (S.dragEnd && Date.now() - S.dragEnd < 350) return;
      if ((el = q(".cal-ev[data-ev]"))) { openEv(el.dataset.ev); return; }
      if ((el = q(".cal-tev"))) { if (el.dataset.move !== "1") openEv(el.dataset.ev); return; } // os editáveis abrem pelo ponteiro
      if (S.click && Date.now() - S.click < 300) return;
      if ((el = q(".cal-col[data-slot]"))) { const y = ev.clientY - el.getBoundingClientRect().top; const m = Math.floor((H0 * 60 + y / HPX * 60) / 30) * 30; openNew(el.dataset.day, hmOf(m), hmOf(m + 60)); return; }
      if ((el = q(".cal-cell[data-day], .cal-allc[data-day]"))) { openNew(el.dataset.day); return; }
    });
    root.addEventListener("change", ev => {
      if (ev.target.id === "cn-dest") { $("cn-app-w").hidden = ev.target.value !== "jtask"; renderPropFields("cn", ev.target.value, null); }
      if (ev.target.id === "cf-color") { const k = gKey(ev.target.dataset.cal); pref.sc[k] = ev.target.value; savePref(); if (SRC[k]) SRC[k].c = ev.target.value; render(); }
      if (ev.target.classList.contains("cal-mg-col")) { const k = ev.target.dataset.k; pref.sc[k] = ev.target.value; savePref(); if (SRC[k]) SRC[k].c = ev.target.value; render(); }
    });
    root.addEventListener("input", ev => {
      if (ev.target.classList.contains("cal-mg-col")) { const row = ev.target.closest(".cal-mg-row"); if (row) row.style.setProperty("--c", ev.target.value); }
      if (ev.target.id === "cal-mg-q") { S.mq = ev.target.value; renderMgr(); }
    });
    root.addEventListener("submit", ev => { ev.preventDefault(); const f = ev.target; if (f.id === "cal-evf") saveEvForm(f); else if (f.id === "cal-newf") createTask(f); });
    $("cal-sheet-box").addEventListener("click", ev => { const b = ev.target.closest("[data-del-ev]"); if (b) delEv(evBy(b.dataset.delEv), b); });
    $("cal-sheet-box").addEventListener("change", ev => { if (ev.target.id === "cf-cal") { const e = evBy($("cal-evf")?.dataset.key || ""); const n = $("cf-cal-n"); if (n) n.hidden = !e || ev.target.value === e.src; const pp = $("cf-props"); if (pp && e) { const d = ev.target.value; pp.hidden = !DS[d]; if (DS[d]) renderPropFields("cf", d, e, d !== e.src); } const b = $("cal-evf")?.querySelector("[type=submit]"); if (b && e) b.textContent = ev.target.value === e.src ? "Salvar" : "Mover para " + (SRC[ev.target.value] ? SRC[ev.target.value].l : "outro calendário"); } });
    // item sob o cursor: Delete exclui (com desfazer)
    $("cal-body").addEventListener("mouseover", ev => { const el = ev.target.closest("[data-ev]"); S.hov = el ? el.dataset.ev : null; });
    $("cal-body").addEventListener("mouseleave", () => { S.hov = null; });
    document.addEventListener("click", ev => { if (ev.target.closest("#toast [data-undo]")) { $("toast").hidden = true; undoLast(); } });
    document.addEventListener("keydown", ev => {
      if ($("view-calendario").style.display === "none") return;
      const typing = /input|select|textarea/i.test(ev.target.tagName) || ev.target.isContentEditable;
      if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && !ev.altKey && ev.key.toLowerCase() === "z" && !typing) { ev.preventDefault(); undoLast(); return; }
      if ((ev.key === "Delete" || ev.key === "Backspace") && !typing && !ev.ctrlKey && !ev.metaKey) {
        if (!$("cal-sheet").hidden) { const b = $("cal-sheet-box").querySelector(".cal-sh-del"); if (b) { ev.preventDefault(); b.click(); } return; }
        const e = S.hov && evBy(S.hov); if (e && (e.gcal || DEL_KEY_OK.includes(e.src))) { ev.preventDefault(); delEv(e); } return;
      }
      if (ev.key === "Escape" && !$("cal-sheet").hidden) { closeSheet(); return; }
      if (ev.key === "Escape" && pref.mgr && window.matchMedia("(max-width: 900px)").matches) { setMgr(false); return; }
      if (/input|select|textarea/i.test(ev.target.tagName) || !$("cal-sheet").hidden) return;
      if (ev.key === "ArrowLeft") nav(-1); else if (ev.key === "ArrowRight") nav(1); else if (ev.key.toLowerCase() === "t") nav(0);
      else if (ev.key.toLowerCase() === "m") { pref.view = "month"; savePref(); render(); } else if (ev.key.toLowerCase() === "s") { pref.view = "week"; savePref(); render(); } else if (ev.key.toLowerCase() === "d") { pref.view = "day"; savePref(); render(); } else if (ev.key.toLowerCase() === "c") setMgr(!pref.mgr);
    });
    // zoom das horas (Semana/Dia): menos altura por hora = mais horas visíveis
    document.addEventListener("click", ev => { const z = ev.target.closest("[data-calzoom]"); if (!z) return; HPX = Math.max(22, Math.min(96, HPX + (+z.dataset.calzoom) * 8)); try { localStorage.setItem("painel.cal.hpx", HPX); } catch {} document.documentElement.style.setProperty("--hpx", HPX + "px"); render(); });
    document.documentElement.style.setProperty("--hpx", HPX + "px");
    window.matchMedia("(max-width: 640px)").addEventListener?.("change", () => render());
    bindDnD($("cal-body"));
    bindSwipe($("cal-body"));
  }
  window.addEventListener("painel:calendario", () => {
    if (!S.started) { S.started = true; bind(); initDb(); render(); load(false); }
    else { render(); if (!S.loadedAt || Date.now() - S.loadedAt > 120000) load(false); }
  });
})();
