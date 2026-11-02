/* ===================== Self Improvement (portado do painel do claude.ai) ===================== */
/* ===================== Self Improvement ===================== */
(() => {
  const NOTION = "Notion", T_QUERY = "notion-query-data-sources", T_FETCH = "notion-fetch", T_UPDATE = "notion-update-page";
  const V_HAB = "https://www.notion.so/3ecb0f632167809fa7dbf3d5f903a3d4?v=3ecb0f632167811a8975000cb9d08571";
  const V_GOAL = "https://www.notion.so/130b0f63216781aeaf30dcbc406ace45?v=130b0f63216781a0bc48000ca19ab18c";
  const V_TASK = "https://www.notion.so/130b0f63216781a296ebdab70695e655?v=130b0f6321678177be8f000c08385fdc";
  const V_BOOK = "https://www.notion.so/1bcb0f63216781f99a4aef058031ed7d?v=1bcb0f63216781258823000cbfbe682e";
  const DS_HAB = "collection://3ecb0f63-2167-80a6-a3a1-000bb5a4b3cf";
  const CFG_DOC = "self/config";
  const CACHE_KEY = "painel-self-v1";
  const HIST_DAYS = 400;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = s => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, k) => { const x = new Date(d); x.setDate(x.getDate() + k); return x; };
  const shift = (s, k) => iso(addDays(parseISO(s), k));
  const ddmm = s => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
  const pct = v => Math.round(v * 100) + "%";
  const pageId = u => { const m = String(u || "").replace(/-/g, "").match(/[0-9a-f]{32}/i); return m ? m[0].toLowerCase() : null; };
  const rel = v => { if (!v) return []; try { const a = JSON.parse(v); return (Array.isArray(a) ? a : [a]).map(pageId).filter(Boolean); } catch { return [pageId(v)].filter(Boolean); } };
  const DOW1 = ["D", "S", "T", "Q", "Q", "S", "S"];
  const DOW_N = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const MON = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const V_PT = "https://www.notion.so/1b9b0f6321678028a04fed46d23bea1b?v=1b9b0f6321678010a561000c70275d73";
  const TAG_ORDER = ["Dieta", "Treino", "Disciplina", "Spending", "Pele", "Capilar"];
  const TAG_LABEL = { "Dieta": "Dieta", "Treino": "Treino", "Disciplina": "Disciplina", "Spending": "Spending", "Pele": "Pele", "Capilar": "Capilar" };
  const TAG_FALLBACK = { "Dieta": "orange", "Treino": "blue", "Disciplina": "green", "Spending": "pink", "Pele": "yellow", "Capilar": "brown" };
  // Cadência: intervalo esperado entre ocorrências, em dias
  const CAD_DAYS = { "2x por semana": 3.5, "Semanal": 7, "Quinzenal": 14, "Mensal": 30 };
  const isDaily = c => !c || c === "Diário";
  const GOAL_ST = { "In progress": ["Em andamento", "yellow", 0], "Planning": ["Planejando", "blue", 1], "Not planned": ["Não planejada", "gray", 2], "Done": ["Concluída", "green", 3] };
  const tagLabel = t => TAG_LABEL[t] || t || "Sem tag";

  const today = new Date(), todayISO = iso(today);
  const S = {
    mcp: null, db: null, cfg: null, started: false, loading: false, loadedAt: null,
    habits: [], goals: [], tasks: {}, books: {}, booksLoaded: false, tagColor: {}, ptasks: [],
    sub: "visao", day: todayISO, range: 14, sel: null, gfilter: "ativas", busy: new Set(),
  };

  // ---------- derivados ----------
  let IDX = null;
  function index() {
    const byName = {}, byDate = {}, tags = {}, cad = {};
    for (const h of S.habits) {
      (byName[h.name] ||= {});
      const prev = byName[h.name][h.date];
      if (!prev || (!prev.done && h.done)) byName[h.name][h.date] = h;
      if (!tags[h.name]) tags[h.name] = h.tag;
      if (!cad[h.name] || (!isDaily(h.cad) && isDaily(cad[h.name]))) cad[h.name] = h.cad;
    }
    for (const [n, m] of Object.entries(byName)) for (const [d, h] of Object.entries(m)) (byDate[d] ||= []).push(h);
    const names = Object.keys(byName).sort((a, b) => {
      const ta = TAG_ORDER.indexOf(tags[a]), tb = TAG_ORDER.indexOf(tags[b]);
      return ((ta < 0 ? 99 : ta) - (tb < 0 ? 99 : tb)) || a.localeCompare(b, "pt-BR");
    });
    const dates = Object.keys(byDate).sort();
    IDX = { byName, byDate, tags, cad, names, first: dates[0] || todayISO };
  }
  const colorOf = tag => `var(--n-${S.tagColor[tag] || TAG_FALLBACK[tag] || "default"})`;
  const habColor = name => colorOf(IDX.tags[name]);

  // sem lista de nomes: só hábitos diários (a menos que `all`), para não misturar com periódicos
  function rateRange(names, from, to, all) {
    let tot = 0, done = 0;
    for (let d = from; d <= to; d = shift(d, 1)) for (const h of IDX.byDate[d] || []) { if (names ? !names.includes(h.name) : (!all && !isDaily(h.cad))) continue; tot++; if (h.done) done++; }
    return { tot, done, r: tot ? done / tot : null };
  }
  function habitStreak(name) {
    const m = IDX.byName[name] || {}; let n = 0;
    for (let d = todayISO; d >= IDX.first; d = shift(d, -1)) {
      const h = m[d]; if (!h) continue;
      if (h.done) n++; else if (d === todayISO) continue; else break;
    }
    return n;
  }
  function habitBest(name) {
    const m = IDX.byName[name] || {}; let best = 0, cur = 0;
    for (const d of Object.keys(m).sort()) { if (m[d].done) { cur++; best = Math.max(best, cur); } else if (d !== todayISO) cur = 0; }
    return best;
  }
  const perfect = d => { const rows = (IDX.byDate[d] || []).filter(h => isDaily(h.cad)); return rows.length ? rows.every(h => h.done) : null; };
  function perfectStreak() {
    let n = 0;
    for (let d = todayISO; d >= IDX.first; d = shift(d, -1)) {
      const p = perfect(d);
      if (p === null) { if (d === todayISO) continue; break; }
      if (p) n++; else if (d === todayISO) continue; else break;
    }
    let best = 0, cur = 0;
    for (let d = IDX.first; d <= todayISO; d = shift(d, 1)) { const p = perfect(d); if (p) { cur++; best = Math.max(best, cur); } else if (!(p === false && d === todayISO)) cur = 0; }
    return { n, best: Math.max(best, n) };
  }

  // ---------- Notion ----------
  function payloadOf(res) { let p = res && (res.payload ?? res.content?.[0]?.text); if (typeof p === "string") { try { p = JSON.parse(p); } catch { /* texto */ } } return p; }
  async function call(tool, input, opts) {
    try { return await S.mcp.callTool(NOTION, tool, input, opts); }
    catch (e) {
      if (e && e.retryable) { await new Promise(r => setTimeout(r, (e.retryAfterMs || 1200) + Math.random() * 600)); return await S.mcp.callTool(NOTION, tool, input, opts); }
      throw e;
    }
  }
  async function queryView(view, stop, maxPages = 40) {
    const out = []; let cursor = null, page = 0;
    do {
      const data = { mode: "view", view_url: view, page_size: 100 };
      if (cursor) data.start_cursor = cursor;
      const p = payloadOf(await call(T_QUERY, { data }, { cache: { staleTime: 30000 } }));
      if (!p || !Array.isArray(p.results)) throw { code: "tool_error", message: "resposta em formato inesperado de uma view do Notion" };
      out.push(...p.results);
      if (stop && p.results.length && stop(p.results[p.results.length - 1])) break;
      cursor = p.has_more ? p.next_cursor : null; page++;
    } while (cursor && page < maxPages);
    return out;
  }
  const cutoff = iso(addDays(today, -HIST_DAYS));
  // dia do hábito: propriedade Date (antes era Created); datas com hora viram o dia local
  function habitDate(r) {
    const d = r["date:Date:start"];
    if (d) return r["date:Date:is_datetime"] === 1 && d.length > 10 ? iso(new Date(d)) : d.slice(0, 10);
    return r.Created ? iso(new Date(r.Created)) : null;
  }
  function normHabit(r) {
    const date = habitDate(r);
    if (!date) return null;
    let tags = []; try { tags = JSON.parse(r.Tags || "[]"); } catch {}
    return { id: pageId(r.url), url: r.url, name: (r.Name || "(sem nome)").trim(), tag: tags[0] || "", cad: r["Cadência"] || "Diário", done: r.Status === "Done", date };
  }
  // Personal Tasks: caixa "Done" e data de vencimento (com hora vira o dia local)
  function normPT(r) {
    const d = r["date:Due Date:start"];
    const date = d ? (r["date:Due Date:is_datetime"] === 1 && d.length > 10 ? iso(new Date(d)) : d.slice(0, 10)) : null;
    return { id: pageId(r.url), url: r.url, name: (r.Name || "(sem nome)").trim(), done: r.Done === "__YES__", date, kind: "ptask" };
  }
  function normTask(r) {
    const eta = r["date:ETA:start"] || r["date:Due Date:start"] || null;
    return { id: pageId(r.url), url: r.url, name: r.Name || "(sem nome)", status: r.Status || "Not started", done: r.Status === "Done" || r.Done === "__YES__", eta, etaTime: r["date:ETA:is_datetime"] === 1, goal: rel(r.Goals)[0] || null, kind: "task" };
  }
  function normBook(r) {
    return { id: pageId(r.url), url: r.url, name: (r.Name || "(sem nome)").replace(/\*\*/g, ""), status: r.Status || "", done: r.Status === "Read", reading: r.Status === "Reading", cur: +r["Current Page"] || 0, tot: +r["Total Page"] || 0, completed: r["date:Completed Date:start"] || null, kind: "book" };
  }
  function normGoal(r) {
    return { id: pageId(r.url), url: r.url, name: r.Name || "(sem nome)", status: r.Status || "Not planned", start: r["date:Timeline:start"] || null, end: r["date:Timeline:end"] || r["date:Timeline:start"] || null, taskIds: rel(r.Tasks) };
  }
  async function loadTagColors() {
    try {
      const res = await call(T_FETCH, { id: DS_HAB }, { cache: { staleTime: 600000, gcTime: 86400000 } });
      const p = res.payload ?? res.content?.[0]?.text;
      const txt = typeof p === "string" ? p : (p && typeof p.text === "string" ? p.text : JSON.stringify(p || ""));
      const m = txt.match(/<data-source-state>\s*([\s\S]*?)\s*<\/data-source-state>/);
      const st = m ? JSON.parse(m[1]) : null;
      const map = {};
      for (const o of st?.schema?.Tags?.options || []) map[o.name] = o.color === "default" ? (TAG_FALLBACK[o.name] || "default") : o.color;
      if (Object.keys(map).length) { S.tagColor = map; writeCache(); render(); }
    } catch { /* mantém as cores de reserva */ }
  }

  async function load(force) {
    if (S.loading) return;
    S.loading = true; $("s-refresh").disabled = true;
    setStatus("Lendo o Notion…", "");
    try {
      const mcp = S.mcp || await window.claude?.use?.("mcp");
      if (!mcp) { setStatus(S.loadedAt ? "Última leitura salva" : "Sem conexão com o Notion", "warn"); banner("Entre no app para ler e marcar hábitos e metas no Notion."); return; }
      S.mcp = mcp;
      if (force) { try { await mcp.invalidate(NOTION, T_QUERY); } catch {} }
      const [hab, goals, tasks, pts] = await Promise.all([
        queryView(V_HAB, r => { const d = habitDate(r); return d && d < cutoff; }, 60),
        queryView(V_GOAL),
        queryView(V_TASK),
        queryView(V_PT, null, 30).catch(() => null),
      ]);
      if (pts) S.ptasks = pts.map(normPT).filter(t => t.id);
      S.habits = hab.map(normHabit).filter(h => h && h.date >= cutoff);
      S.goals = goals.map(normGoal).filter(g => g.id);
      S.tasks = {}; for (const r of tasks) { const t = normTask(r); if (t.id) S.tasks[t.id] = t; }
      const missing = S.goals.some(g => g.taskIds.some(id => !S.tasks[id]));
      if (missing) {
        const books = await queryView(V_BOOK, null, 8);
        S.books = {}; for (const r of books) { const b = normBook(r); if (b.id) S.books[b.id] = b; }
        S.booksLoaded = true;
      }
      S.loadedAt = Date.now(); writeCache(); banner(null);
      setStatus(`Notion · ${new Date(S.loadedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, "live");
      render();
      if (!Object.keys(S.tagColor).length || force) loadTagColors();
    } catch (e) {
      const deny = ["needs_reauth", "server_not_connected", "not_in_manifest", "blocked_by_policy", "approval_required", "consent_required"].includes(e && e.code);
      if (deny) { S.habits = []; S.goals = []; S.tasks = {}; S.books = {}; S.ptasks = []; try { localStorage.removeItem(CACHE_KEY); } catch {} render(); }
      setStatus(deny ? "Notion desconectado" : (S.loadedAt ? "Mostrando a última leitura" : "Falha ao ler o Notion"), "err");
      banner(errCopy(e));
    } finally { S.loading = false; $("s-refresh").disabled = false; }
  }
  function errCopy(e) {
    switch (e && e.code) {
      case "needs_reauth": return "O Notion recusou o token do app. Confira NOTION_TOKEN no Cloudflare.";
      case "server_not_connected": return "O servidor do app não tem NOTION_TOKEN configurado.";
      case "not_in_manifest": case "consent_required": return "A integração Painel não tem acesso a uma das bases (Habit Tracker, Goals, Tasks, Books ou Personal Tasks). No Notion: ••• → Conexões → adicione Painel.";
      case "blocked_by_policy": case "approval_required": return "A política da sua organização bloqueou o acesso deste painel ao Notion.";
      case "server_unavailable": return "O Notion não respondeu agora. Tente Atualizar em alguns segundos.";
      case "tool_error": return "O Notion recusou a operação: " + (e.message || "sem detalhe") + ".";
      default: return "Não consegui falar com o Notion (" + ((e && e.code) || "erro") + "). Tente Atualizar.";
    }
  }

  // ---------- escrita ----------
  async function setStatusProp(item, value, label, prop = "Status") {
    if (!S.mcp) { toast("Entre no app para marcar no Notion"); return false; }
    S.busy.add(item.id); render();
    try {
      await call(T_UPDATE, { page_id: item.id, command: "update_properties", properties: { [prop]: value } }, { cache: false });
      try { await S.mcp.invalidate(NOTION, T_QUERY); } catch {}
      writeCache(); return true;
    } catch (e) {
      toast(e && e.code === "tool_error" ? "O Notion recusou: " + (e.message || "erro") : "Não consegui salvar " + label + " no Notion");
      return false;
    } finally { S.busy.delete(item.id); render(); }
  }
  async function toggleHabit(h) {
    const was = h.done; h.done = !was;
    // dia que já passou volta como "Not Done" (não acumula atrasados); hoje volta como "Not started"
    const ok = await setStatusProp(h, h.done ? "Done" : (h.date < todayISO ? "Not Done" : "Not started"), "o hábito");
    if (!ok) { h.done = was; render(); }
  }
  async function togglePT(t) {
    const was = t.done; t.done = !was;
    const ok = await setStatusProp(t, t.done ? "__YES__" : "__NO__", "a tarefa", "Done");
    if (!ok) { t.done = was; render(); }
    else toast(t.done ? "Tarefa concluída no Notion" : "Tarefa reaberta no Notion");
  }
  async function toggleTask(t) {
    const was = { done: t.done, status: t.status };
    t.done = !t.done; t.status = t.done ? "Done" : "Not started";
    const ok = await setStatusProp(t, t.status, "a tarefa");
    if (!ok) { Object.assign(t, was); render(); }
    else toast(t.done ? "Tarefa concluída no Notion" : "Tarefa reaberta no Notion");
  }
  async function saveLinks(vinculos) {
    if (!S.db) { toast("Entre no app para salvar vínculos"); return; }
    try { await S.db.doc(CFG_DOC).set(Object.assign({}, S.cfg || {}, { vinculos })); }
    catch { toast("Não consegui salvar o vínculo"); }
  }

  // ---------- cache local ----------
  function writeCache() { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ habits: S.habits, goals: S.goals, tasks: S.tasks, books: S.books, ptasks: S.ptasks, tagColor: S.tagColor, loadedAt: S.loadedAt })); } catch {} }
  function readCache() { try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); if (c && Array.isArray(c.habits)) Object.assign(S, { ptasks: c.ptasks || [], habits: c.habits, goals: c.goals || [], tasks: c.tasks || {}, books: c.books || {}, tagColor: c.tagColor || {}, loadedAt: c.loadedAt || null }); } catch {} }

  // ---------- UI util ----------
  function setStatus(t, k) { const s = $("s-status"); s.textContent = t; s.className = "pill" + (k ? " " + k : ""); }
  function banner(t) { const b = $("s-banner"); if (!t) { b.hidden = true; return; } b.innerHTML = "<strong>Atenção</strong><span>" + esc(t) + "</span>"; b.hidden = false; }
  let tt; function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => { el.hidden = true; }, 3200); }
  const dayLabel = d => d === todayISO ? "Hoje" : d === shift(todayISO, -1) ? "Ontem" : `${DOW_N[parseISO(d).getDay()]}, ${ddmm(d)}`;
  function ring(r, size = 54) {
    const R = (size - 8) / 2, C = 2 * Math.PI * R, off = C * (1 - Math.max(0, Math.min(1, r || 0)));
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="bg" cx="${size / 2}" cy="${size / 2}" r="${R}"/><circle class="fg" cx="${size / 2}" cy="${size / 2}" r="${R}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
  }
  const linkedGoal = name => (S.cfg?.vinculos || {})[name] || null;
  const goalById = id => S.goals.find(g => g.id === id);

  // ---------- render: hábitos ----------
  function renderKpis() {
    const t = rateRange(null, todayISO, todayISO, true);
    const w = rateRange(null, shift(todayISO, -6), todayISO);
    const m = rateRange(null, shift(todayISO, -29), todayISO);
    const pm = rateRange(null, shift(todayISO, -59), shift(todayISO, -30));
    const ps = perfectStreak();
    const delta = m.r != null && pm.r != null ? Math.round((m.r - pm.r) * 100) : null;
    $("hb-kpis").innerHTML = `
      <div class="kpi with-ring">${ring(t.r)}<div><div class="label">Hoje</div><div class="value">${t.done} de ${t.tot}</div><div class="sub">${t.tot ? (t.done === t.tot ? "Dia completo" : `${t.tot - t.done} pendente${t.tot - t.done > 1 ? "s" : ""}`) : "Nenhum hábito programado"}</div></div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="flame"></i>Sequência de dias completos</div><div class="value">${ps.n} ${ps.n === 1 ? "dia" : "dias"}</div><div class="sub">Recorde: ${ps.best} ${ps.best === 1 ? "dia" : "dias"}</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="calendar"></i>Últimos 7 dias</div><div class="value">${w.r == null ? "—" : pct(w.r)}</div><div class="sub">${w.done} de ${w.tot} feitos</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="calendar"></i>Últimos 30 dias</div><div class="value">${m.r == null ? "—" : pct(m.r)}</div><div class="sub">${delta == null ? `${m.done} de ${m.tot} feitos` : `<span class="delta ${delta >= 0 ? "good" : "bad"}">${delta >= 0 ? "+" : ""}${delta} p.p.</span> vs 30 dias anteriores`}</div></div>`;
  }
  function renderDay() {
    const d = S.day, rows = (IDX.byDate[d] || []).slice();
    $("hb-day-title").textContent = dayLabel(d);
    $("hb-next").disabled = d >= todayISO;
    $("hb-prev").disabled = d <= IDX.first;
    $("hb-today").hidden = d === todayISO;
    if (!rows.length) { $("hb-list").innerHTML = `<p class="empty">${d === todayISO ? "Nenhum hábito criado hoje ainda. Os modelos recorrentes do Notion criam as páginas ao longo do dia." : "Nenhum hábito programado neste dia."}</p>`; return; }
    const groups = {};
    for (const h of rows) (groups[h.tag] ||= []).push(h);
    const order = Object.keys(groups).sort((a, b) => ((TAG_ORDER.indexOf(a) + 100) % 100) - ((TAG_ORDER.indexOf(b) + 100) % 100));
    $("hb-list").innerHTML = order.map(tag => {
      const items = groups[tag].sort((a, b) => IDX.names.indexOf(a.name) - IDX.names.indexOf(b.name));
      const done = items.filter(h => h.done).length;
      return `<div class="hb-group" style="--c:${colorOf(tag)}"><div class="eyebrow"><i></i>${esc(tagLabel(tag))} · ${done}/${items.length}</div><div class="hb-items">${items.map(h => {
        const st = habitStreak(h.name), g = goalById(linkedGoal(h.name));
        const meta = [st ? (st === 1 ? "1 dia seguido" : `${st} dias seguidos`) : null, g ? "→ " + g.name : null].filter(Boolean).join(" · ") || "Comece a sequência";
        return `<button class="hb-item${S.busy.has(h.id) ? " busy" : ""}" data-hid="${esc(h.id)}" aria-pressed="${h.done}"><span class="chk">${CHECK}</span><span class="txt"><span class="nm">${esc(h.name)}</span><span class="meta">${esc(meta)}</span></span></button>`;
      }).join("")}</div></div>`;
    }).join("");
  }
  function renderTags() {
    const from = shift(todayISO, -29), out = [];
    for (const [tag, names] of Object.entries(dailyByTag())) { const r = rateRange(names, from, todayISO); if (r.tot) out.push({ tag, ...r }); }
    out.sort((a, b) => b.r - a.r);
    $("hb-tags").innerHTML = out.length ? out.map(o => `<div class="cat-row" style="--c:${colorOf(o.tag)}"><span class="name"><span class="sw"></span>${esc(tagLabel(o.tag))}</span><span><span class="bar" style="width:${Math.max(2, o.r * 100)}%"></span></span><span class="amt">${pct(o.r)} <small style="color:var(--muted);font-weight:500">${o.done}/${o.tot}</small></span></div>`).join("") : '<p class="empty">Ainda sem histórico.</p>';
  }
  function renderGrid() {
    const n = S.range, days = [];
    for (let i = n - 1; i >= 0; i--) days.push(shift(todayISO, -i));
    const head = `<thead><tr><th class="hn"></th>${days.map(d => `<th class="${d === todayISO ? "today" : ""}">${DOW1[parseISO(d).getDay()]}<br>${+d.slice(8)}</th>`).join("")}<th title="Sequência atual">Seq.</th><th title="Feitos sobre programados em 30 dias">30d</th></tr></thead>`;
    if (!IDX.names.length) { $("hb-grid").innerHTML = head + `<tbody><tr><td colspan="${n + 3}"><p class="empty">Sem hábitos ainda.</p></td></tr></tbody>`; return; }
    const body = IDX.names.map(name => {
      const m = IDX.byName[name], r30 = rateRange([name], shift(todayISO, -29), todayISO), st = habitStreak(name);
      const cells = days.map(d => {
        const h = m[d];
        if (!h) return `<td><span class="hc n" title="${ddmm(d)} · não programado"></span></td>`;
        const cls = h.done ? "d" : d === todayISO ? "p" : "m";
        return `<td><button class="hc ${cls}" data-hid="${esc(h.id)}" title="${esc(name)} · ${ddmm(d)} · ${h.done ? "feito" : d === todayISO ? "pendente" : "não feito"} (clique para alternar)" aria-label="${esc(name)} ${ddmm(d)} ${h.done ? "feito" : "não feito"}"></button></td>`;
      }).join("");
      return `<tr class="${S.sel === name ? "sel" : ""}" style="--c:${habColor(name)}"><td class="hn"><button data-hsel="${esc(name)}"><i></i><span>${esc(name)}</span></button></td>${cells}<td class="st${st ? "" : " muted"}">${st}</td><td class="st${r30.r == null ? " muted" : ""}">${r30.r == null ? "—" : pct(r30.r)}</td></tr>`;
    }).join("");
    $("hb-grid").innerHTML = head + "<tbody>" + body + "</tbody>";
  }
  function renderHeat() {
    const sel = S.sel && IDX.byName[S.sel] ? S.sel : null;
    // ano inteiro: da semana de 1º de janeiro até a semana de 31 de dezembro
    const Y = today.getFullYear(), jan1 = new Date(Y, 0, 1), dec31 = new Date(Y, 11, 31);
    const start = addDays(jan1, -((jan1.getDay() + 6) % 7));
    const weeks = Math.round((addDays(dec31, -((dec31.getDay() + 6) % 7)) - start) / 86400000 / 7) + 1;
    const color = sel ? habColor(sel) : "var(--self)";
    const lvl = r => r >= 1 ? 100 : r >= .67 ? 70 : r >= .34 ? 45 : r > 0 ? 22 : 0;
    let cells = "", months = "", lastM = -1, scheduled = 0, done = 0;
    for (let w = 0; w < weeks; w++) {
      const ws = addDays(start, w * 7);
      const mo = ws.getMonth();
      const mm = ws.getFullYear() < Y ? 0 : mo;
      months += `<span>${mm !== lastM ? MON[mm] : ""}</span>`; lastM = mm;
      for (let k = 0; k < 7; k++) {
        const d = iso(addDays(ws, k));
        if (d.slice(0, 4) !== String(Y)) { cells += '<i style="visibility:hidden"></i>'; continue; }
        if (d > todayISO) { cells += `<i class="fut" title="${ddmm(d)}"></i>`; continue; }
        const cur = d === S.day ? " c" : "";
        if (sel) {
          const h = IDX.byName[sel][d];
          if (!h) { cells += `<i class="none${cur}" title="${ddmm(d)} · não programado"></i>`; continue; }
          scheduled++; if (h.done) done++;
          cells += `<i class="${cur.trim()}" style="background:${h.done ? color : "var(--surface-2)"}" title="${ddmm(d)} · ${h.done ? "feito" : "não feito"}"></i>`;
        } else {
          const rows = (IDX.byDate[d] || []).filter(h => isDaily(h.cad));
          if (!rows.length) { cells += `<i class="none${cur}" title="${ddmm(d)} · sem hábitos"></i>`; continue; }
          const dn = rows.filter(h => h.done).length; scheduled += rows.length; done += dn;
          const p = lvl(dn / rows.length);
          cells += `<i class="${cur.trim()}" style="background:${p ? `color-mix(in oklab, ${color} ${p}%, var(--surface-2))` : "var(--surface-2)"}" title="${ddmm(d)} · ${dn} de ${rows.length}"></i>`;
        }
      }
    }
    $("hb-heat-title").textContent = sel ? `Mapa ${Y} · ${sel}` : `Mapa de ${Y}`;
    $("hb-heat-all").hidden = !sel;
    $("hb-heat-hint").textContent = sel
      ? `${done} de ${scheduled} dias programados feitos no período · recorde de ${habitBest(sel)} seguidos.`
      : `Intensidade = parte dos hábitos diários do dia que foram feitos. Contorno vazio = dia sem hábitos programados.`;
    const legend = sel
      ? `<span class="sheat-legend"><i style="background:var(--surface-2)"></i>não feito <i style="background:${color};margin-left:8px"></i>feito</span>`
      : `<span class="sheat-legend">menos ${[0, 22, 45, 70, 100].map(p => `<i style="background:${p ? `color-mix(in oklab, ${color} ${p}%, var(--surface-2))` : "var(--surface-2)"}"></i>`).join("")} mais</span>`;
    $("hb-heat").innerHTML = `<div style="overflow-x:auto"><div class="sheat-months" style="grid-template-columns:repeat(${weeks},var(--cs, 14px))">${months}</div><div class="sheat-wrap"><div class="sheat-days"><span>S</span><span></span><span>Q</span><span></span><span>S</span><span></span><span>D</span></div><div class="sheat">${cells}</div></div></div><div style="margin-top:10px">${legend}</div>`;
    sizeHeat(weeks);
  }
  // o mapa ocupa toda a largura do card: o tamanho do quadrado acompanha a largura disponível
  function sizeHeat(weeks) {
    const el = $("hb-heat"); if (!el) return;
    if (weeks) el.dataset.weeks = weeks; else weeks = +el.dataset.weeks;
    const W = el.clientWidth; if (!W || !weeks) return;
    const gap = W < 560 ? 3 : 4;
    const cs = Math.max(12, Math.min(34, Math.floor((W - 22 - gap * (weeks - 1)) / weeks)));
    el.style.setProperty("--cs", cs + "px"); el.style.setProperty("--cg", gap + "px");
  }
  try { new ResizeObserver(() => sizeHeat()).observe($("hb-heat")); } catch {}

  // ---------- render: metas ----------
  function goalItems(g) { return g.taskIds.map(id => S.tasks[id] || S.books[id]).filter(Boolean); }
  function goalProgress(g) {
    const items = goalItems(g), books = items.filter(i => i.kind === "book"), tasks = items.filter(i => i.kind === "task");
    const tm = g.name.match(/(\d+)\s*(books|livros)/i);
    if (books.length && books.length >= tasks.length) {
      const read = books.filter(b => b.done).length, target = tm ? +tm[1] : books.length;
      return { kind: "book", done: read, total: target, r: target ? Math.min(1, read / target) : 0, label: `${read} de ${target} livros lidos`, books, tasks };
    }
    const done = tasks.filter(t => t.done).length;
    return { kind: "task", done, total: tasks.length, r: tasks.length ? done / tasks.length : 0, label: tasks.length ? `${done} de ${tasks.length} tarefas` : "Sem tarefas ainda", books, tasks };
  }
  const isActive = g => g.status === "In progress" || g.status === "Planning";
  function fmtEta(t) {
    if (!t.eta) return "";
    const d = t.eta.slice(0, 10);
    let s = d.slice(0, 4) === todayISO.slice(0, 4) ? ddmm(d) : `${ddmm(d)}/${d.slice(2, 4)}`;
    if (t.etaTime && t.eta.length > 10) { const dt = new Date(t.eta); s = `${ddmm(iso(dt))} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`; }
    return s;
  }
  const etaDay = t => !t.eta ? null : (t.etaTime && t.eta.length > 10 ? iso(new Date(t.eta)) : t.eta.slice(0, 10));
  function taskRow(t, goalName) {
    const late = !t.done && etaDay(t) && etaDay(t) < todayISO;
    return `<div class="task${t.done ? " done" : ""}${S.busy.has(t.id) ? " busy" : ""}"><button class="tchk" data-tid="${esc(t.id)}" aria-pressed="${t.done}" aria-label="${t.done ? "Reabrir" : "Concluir"} ${esc(t.name)}">${CHECK}</button><span class="tn"><a href="${esc(t.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(t.name)}</a>${goalName ? `<small>${esc(goalName)}</small>` : ""}</span><span class="td${late ? " late" : ""}">${late ? "atrasada · " : ""}${fmtEta(t)}</span></div>`;
  }
  function renderGoals() {
    const act = S.goals.filter(isActive);
    const allT = act.flatMap(g => goalItems(g).filter(i => i.kind === "task"));
    const late = allT.filter(t => !t.done && etaDay(t) && etaDay(t) < todayISO).length;
    const links = Object.entries(S.cfg?.vinculos || {}).filter(([h, g]) => IDX.byName[h] && goalById(g)).map(([h]) => h);
    const lr = links.length ? rateRange(links, shift(todayISO, -29), todayISO) : null;
    $("gl-kpis").innerHTML = `
      <div class="kpi"><div class="label"><i class="ic" data-i="target"></i>Metas ativas</div><div class="value">${act.length}</div><div class="sub">${S.goals.filter(g => g.status === "In progress").length} em andamento · ${S.goals.filter(g => g.status === "Done").length} concluídas</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="tasks"></i>Tarefas das metas ativas</div><div class="value">${allT.filter(t => t.done).length} de ${allT.length}</div><div class="sub">${allT.length ? pct(allT.filter(t => t.done).length / allT.length) + " concluídas" : "Nenhuma tarefa"}</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="alert"></i>Tarefas atrasadas</div><div class="value" style="${late ? "color:var(--bad)" : ""}">${late}</div><div class="sub">Prazo (ETA) já passou</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="link"></i>Hábitos ligados a metas</div><div class="value">${lr && lr.r != null ? pct(lr.r) : "—"}</div><div class="sub">${links.length} hábito${links.length === 1 ? "" : "s"} · consistência em 30 dias</div></div>`;

    let list = S.goals.slice();
    if (S.gfilter === "ativas") list = list.filter(isActive);
    else if (S.gfilter === "feitas") list = list.filter(g => g.status === "Done");
    list.sort((a, b) => ((GOAL_ST[a.status] || [, , 9])[2] - (GOAL_ST[b.status] || [, , 9])[2]) || a.name.localeCompare(b.name, "pt-BR"));
    const linkMap = S.cfg?.vinculos || {};
    $("gl-cards").innerHTML = list.length ? list.map(g => {
      const [stl, stc] = GOAL_ST[g.status] || [g.status, "gray"];
      const pr = goalProgress(g);
      const lateGoal = g.status !== "Done" && g.end && g.end < todayISO;
      const meta = [g.start ? (g.end && g.end !== g.start ? `${ddmm(g.start)}/${g.start.slice(2, 4)} → ${ddmm(g.end)}/${g.end.slice(2, 4)}` : `${ddmm(g.start)}/${g.start.slice(2, 4)}`) : "Sem prazo definido"];
      const open = pr.tasks.filter(t => !t.done).sort((a, b) => (etaDay(a) || "9999").localeCompare(etaDay(b) || "9999")).slice(0, 4);
      const reading = pr.books.filter(b => b.reading);
      const habs = Object.keys(linkMap).filter(h => linkMap[h] === g.id && IDX.byName[h]);
      const free = IDX.names.filter(h => linkMap[h] !== g.id);
      const dots = h => { let s = ""; for (let i = 13; i >= 0; i--) { const d = shift(todayISO, -i), x = IDX.byName[h][d]; s += `<i class="${x ? (x.done ? "d" : "") : "n"}"></i>`; } return s; };
      return `<article class="goalcard">
        <div class="g-top"><h4><a href="${esc(g.url)}" target="_blank" rel="noopener">${esc(g.name)}</a></h4><span class="st-pill" style="--c:var(--n-${stc})">${esc(stl)}</span></div>
        <div class="g-meta"><span>${meta.join("")}</span>${lateGoal ? '<span class="late">prazo vencido</span>' : ""}</div>
        <div class="g-sec"><div class="g-prog"><span><b>${esc(pr.label)}</b></span><span>${pr.total ? pct(pr.r) : ""}</span></div><div class="track"><i style="width:${(pr.r * 100).toFixed(1)}%"></i></div></div>
        ${reading.length ? `<div class="g-sec"><div class="eyebrow">Lendo agora</div>${reading.map(b => `<div class="book"><span class="bn">${esc(b.name)}</span>${b.tot ? `<span class="track" title="${b.cur} de ${b.tot} páginas"><i style="width:${Math.min(100, b.cur / b.tot * 100).toFixed(1)}%"></i></span>` : '<span class="goal-meta">sem nº de páginas</span>'}</div>`).join("")}</div>` : ""}
        ${open.length ? `<div class="g-sec"><div class="eyebrow">Próximas tarefas</div><div class="tasklist">${open.map(t => taskRow(t)).join("")}</div></div>` : ""}
        <div class="g-sec"><div class="eyebrow">Hábitos que alimentam esta meta</div>
          ${habs.length ? `<div class="hlinks">${habs.map(h => { const r = rateRange([h], shift(todayISO, -29), todayISO); return `<div class="hlink" style="--c:${habColor(h)}"><span class="hn"><i></i><span>${esc(h)}</span></span><span class="dots" title="Últimos 14 dias">${dots(h)}</span><span class="pct">${r.r == null ? "—" : pct(r.r)}<button class="unlink" data-unlink="${esc(h)}" aria-label="Desvincular ${esc(h)}" title="Desvincular">×</button></span></div>`; }).join("")}</div>` : '<p class="empty" style="padding:0">Nenhum hábito vinculado.</p>'}
          ${S.db && free.length ? `<label class="g-link"><select data-link="${esc(g.id)}"><option value="">+ Vincular hábito…</option>${free.map(h => `<option value="${esc(h)}">${esc(h)}${linkMap[h] && goalById(linkMap[h]) ? " (em " + esc(goalById(linkMap[h]).name) + ")" : ""}</option>`).join("")}</select></label>` : ""}
        </div>
      </article>`;
    }).join("") : `<p class="empty">${S.goals.length ? "Nenhuma meta neste filtro." : "Nenhuma meta carregada."}</p>`;

    const horizon = shift(todayISO, 30);
    const up = [];
    for (const g of S.goals.filter(g => g.status !== "Done")) for (const t of goalItems(g)) if (t.kind === "task" && !t.done && etaDay(t) && etaDay(t) <= horizon) up.push([t, g]);
    up.sort((a, b) => etaDay(a[0]).localeCompare(etaDay(b[0])));
    $("gl-tasks").innerHTML = up.length ? up.map(([t, g]) => taskRow(t, g.name)).join("") : '<p class="empty">Nenhuma tarefa com prazo atrasado ou nos próximos 30 dias.</p>';
  }

  // ---------- render: hábitos periódicos ----------
  function dailyByTag() { const m = {}; for (const n of IDX.names) if (isDaily(IDX.cad[n])) (m[IDX.tags[n]] ||= []).push(n); return m; }
  const dayDiff = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000);
  const note10 = r => r == null ? "—" : (r * 10).toFixed(1).replace(".", ",");
  function renderPeriodic(id) {
    const el = $(id); if (!el) return;
    const names = IDX.names.filter(n => !isDaily(IDX.cad[n]));
    if (!names.length) { el.innerHTML = '<p class="empty">Nenhum hábito periódico. Defina a Cadência no modelo do Notion para ele aparecer aqui.</p>'; return; }
    el.innerHTML = names.map(name => {
      const m = IDX.byName[name], dates = Object.keys(m).sort();
      const last = dates.filter(d => m[d].done).pop() || null;
      const closed = dates.filter(d => d < todayISO || m[d].done);
      const done = closed.filter(d => m[d].done).length;
      const dueToday = !!(m[todayISO] && !m[todayISO].done);
      const interval = CAD_DAYS[IDX.cad[name]] || 7;
      const since = last ? dayDiff(todayISO, last) : null;
      const overdue = since == null ? closed.length > 0 : since > interval;
      const chip = dueToday ? ["Hoje", ""] : overdue ? ["Atrasado", " late"] : ["Em dia", " ok"];
      const dots = dates.slice(-10).map(d => { const h = m[d]; return `<i class="${h.done ? "d" : d >= todayISO ? "p" : "m"}" title="${ddmm(d)} · ${h.done ? "feito" : d >= todayISO ? "pendente" : "não feito"}"></i>`; }).join("");
      return `<div class="per" style="--c:${habColor(name)}"><div class="pn"><i></i><span>${esc(name)}</span></div><div class="pm"><b>${closed.length ? pct(done / closed.length) : "—"}</b> · ${done} de ${closed.length}</div><span class="pc${chip[1]}">${chip[0]}</span><div class="pd">${dots}<small>${esc(IDX.cad[name])} · última vez ${last ? ddmm(last) : "nunca"}</small></div></div>`;
    }).join("");
  }

  // ---------- render: tarefas pessoais ----------
  const ptDone = t => t.done;
  function ptRate(from, to, filter) {
    let tot = 0, done = 0;
    for (const t of S.ptasks) { if (!t.date || t.date < from || t.date > to || (filter && !filter(t))) continue; tot++; if (ptDone(t)) done++; }
    return { tot, done, r: tot ? done / tot : null };
  }
  function goalScore() {
    const rs = S.goals.filter(isActive).map(g => ({ g, items: goalItems(g) })).filter(x => x.items.length).map(x => goalProgress(x.g).r);
    return rs.length ? { r: rs.reduce((a, b) => a + b, 0) / rs.length, n: rs.length } : { r: null, n: 0 };
  }
  function ptRow(t) {
    const late = !t.done && t.date && t.date < todayISO;
    const d = t.date ? (t.date.slice(0, 4) === todayISO.slice(0, 4) ? ddmm(t.date) : `${ddmm(t.date)}/${t.date.slice(2, 4)}`) : "sem data";
    return `<div class="task${t.done ? " done" : ""}${S.busy.has(t.id) ? " busy" : ""}"><button class="tchk" data-ptid="${esc(t.id)}" aria-pressed="${t.done}" aria-label="${t.done ? "Reabrir" : "Concluir"} ${esc(t.name)}">${CHECK}</button><span class="tn"><a href="${esc(t.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(t.name)}</a></span><span class="td${late ? " late" : ""}">${late ? "atrasada · " : ""}${d}</span></div>`;
  }
  function renderTasks() {
    const r30 = ptRate(shift(todayISO, -29), todayISO), p30 = ptRate(shift(todayISO, -59), shift(todayISO, -30));
    const open = S.ptasks.filter(t => !t.done);
    const late = open.filter(t => t.date && t.date < todayISO);
    const soon = open.filter(t => t.date && t.date >= todayISO && t.date <= shift(todayISO, 6));
    const delta = r30.r != null && p30.r != null ? Math.round((r30.r - p30.r) * 100) : null;
    $("pt-kpis").innerHTML = `
      <div class="kpi with-ring">${ring(r30.r)}<div><div class="label">Cumprimento · 30 dias</div><div class="value">${r30.r == null ? "—" : pct(r30.r)}</div><div class="sub">${delta == null ? `${r30.done} de ${r30.tot} vencidas` : `<span class="delta ${delta >= 0 ? "good" : "bad"}">${delta >= 0 ? "+" : ""}${delta} p.p.</span> vs 30 dias anteriores`}</div></div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="tasks"></i>Em aberto</div><div class="value">${open.length}</div><div class="sub">${soon.length} nos próximos 7 dias</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="alert"></i>Atrasadas</div><div class="value" style="${late.length ? "color:var(--bad)" : ""}">${late.length}</div><div class="sub">Prazo já passou</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="calendar"></i>Concluídas · 30 dias</div><div class="value">${r30.done}</div><div class="sub">de ${r30.tot} com prazo no período</div></div>`;
    const sorted = open.slice().sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
    $("pt-open").innerHTML = sorted.length ? sorted.map(ptRow).join("") : '<p class="empty">Nenhuma tarefa em aberto.</p>';

    const from90 = shift(todayISO, -89), byName = {};
    for (const t of S.ptasks) if (t.date && t.date >= from90 && t.date <= todayISO) { const b = (byName[t.name] ||= { tot: 0, done: 0 }); b.tot++; if (t.done) b.done++; }
    const rows = Object.entries(byName).filter(([, b]) => b.tot >= 2).sort((a, b) => b[1].tot - a[1].tot || a[0].localeCompare(b[0], "pt-BR"));
    $("pt-rates").innerHTML = rows.length ? rows.map(([n, b]) => `<div class="rate-row"><span class="rn" title="${esc(n)}">${esc(n)}</span><span class="rb"><i style="width:${(b.done / b.tot * 100).toFixed(1)}%"></i></span><span class="ra">${pct(b.done / b.tot)} <small>${b.done}/${b.tot}</small></span></div>`).join("") : '<p class="empty">Ainda não há tarefas recorrentes com histórico.</p>';

    const months = {};
    for (const t of S.ptasks) if (t.date && t.date <= todayISO) { const k = t.date.slice(0, 7), b = (months[k] ||= { tot: 0, done: 0 }); b.tot++; if (t.done) b.done++; }
    const ks = Object.keys(months).sort().slice(-6).reverse();
    $("pt-months").innerHTML = ks.length ? ks.map(k => { const b = months[k]; return `<div class="rate-row"><span class="rn">${MON[+k.slice(5) - 1]}/${k.slice(2, 4)}</span><span class="rb"><i style="width:${(b.done / b.tot * 100).toFixed(1)}%"></i></span><span class="ra">${pct(b.done / b.tot)} <small>${b.done}/${b.tot}</small></span></div>`; }).join("") : '<p class="empty">Sem histórico.</p>';
  }

  // ---------- render: visão geral (roda da vida) ----------
  function renderRadar(axes) {
    const el = $("ov-radar");
    if (axes.length < 3) { el.innerHTML = '<p class="empty">Precisa de pelo menos 3 áreas com dados para desenhar a roda.</p>'; return; }
    const W = 520, H = 440, cx = W / 2, cy = H / 2 - 4, R = 140, n = axes.length;
    const ang = i => -Math.PI / 2 + i * 2 * Math.PI / n;
    const pt = (r, i) => [cx + R * r * Math.cos(ang(i)), cy + R * r * Math.sin(ang(i))];
    const poly = r => axes.map((_, i) => pt(r, i).map(v => v.toFixed(1)).join(",")).join(" ");
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Roda da vida: ${esc(axes.map(a => a.name + " " + note10(a.r)).join(", "))}">`;
    [.25, .5, .75, 1].forEach(r => { svg += `<polygon class="grid${r === 1 ? " out" : ""}" points="${poly(r)}"/>`; });
    axes.forEach((_, i) => { const [x, y] = pt(1, i); svg += `<line class="axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; });
    svg += `<text class="tick" x="${cx + 5}" y="${(cy - R * .5 + 3).toFixed(1)}">5</text><text class="tick" x="${cx + 5}" y="${(cy - R + 3).toFixed(1)}">10</text>`;
    svg += `<polygon class="area" points="${axes.map((a, i) => pt(a.r == null ? 0 : a.r, i).map(v => v.toFixed(1)).join(",")).join(" ")}"/>`;
    axes.forEach((a, i) => {
      const [px, py] = pt(a.r == null ? 0 : a.r, i);
      svg += `<circle class="pt" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="${a.color}"><title>${esc(a.name)} · ${note10(a.r)} de 10</title></circle>`;
      const c = Math.cos(ang(i)), s = Math.sin(ang(i)), lx = cx + (R + 20) * c, ly = cy + (R + 20) * s;
      const anchor = c > .3 ? "start" : c < -.3 ? "end" : "middle";
      const dy = s > .3 ? 12 : s < -.3 ? -8 : 4;
      svg += `<text x="${lx.toFixed(1)}" y="${(ly + dy - 6).toFixed(1)}" text-anchor="${anchor}">${esc(a.name)}</text><text class="sc" x="${lx.toFixed(1)}" y="${(ly + dy + 8).toFixed(1)}" text-anchor="${anchor}">${note10(a.r)}</text>`;
    });
    el.innerHTML = svg + "</svg>";
  }
  function renderOverview() {
    const from = shift(todayISO, -29), to = todayISO;
    const t = rateRange(null, todayISO, todayISO, true);
    const dm = rateRange(null, from, to), dp = rateRange(null, shift(todayISO, -59), shift(todayISO, -30));
    const tk = ptRate(from, to), gs = goalScore();
    const per = IDX.names.filter(n => !isDaily(IDX.cad[n]));
    const perOk = per.filter(n => {
      const m = IDX.byName[n], last = Object.keys(m).filter(d => m[d].done).sort().pop();
      return last && dayDiff(todayISO, last) <= (CAD_DAYS[IDX.cad[n]] || 7);
    }).length;
    const delta = dm.r != null && dp.r != null ? Math.round((dm.r - dp.r) * 100) : null;
    $("ov-kpis").innerHTML = `
      <div class="kpi with-ring">${ring(t.r)}<div><div class="label">Hábitos de hoje</div><div class="value">${t.done} de ${t.tot}</div><div class="sub">${t.tot ? (t.done === t.tot ? "Dia completo" : `${t.tot - t.done} pendente${t.tot - t.done > 1 ? "s" : ""}`) : "Nenhum hábito programado"}</div></div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="calendar"></i>Hábitos diários · 30 dias</div><div class="value">${dm.r == null ? "—" : pct(dm.r)}</div><div class="sub">${delta == null ? `${dm.done} de ${dm.tot} feitos` : `<span class="delta ${delta >= 0 ? "good" : "bad"}">${delta >= 0 ? "+" : ""}${delta} p.p.</span> vs 30 dias anteriores`}</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="tasks"></i>Tarefas · 30 dias</div><div class="value">${tk.r == null ? "—" : pct(tk.r)}</div><div class="sub">${tk.done} de ${tk.tot} concluídas no prazo</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="target"></i>Metas ativas</div><div class="value">${S.goals.filter(isActive).length}</div><div class="sub">${gs.r == null ? "Sem tarefas ligadas" : `Progresso médio ${pct(gs.r)}`}</div></div>
      <div class="kpi"><div class="label"><i class="ic" data-i="flame"></i>Periódicos em dia</div><div class="value">${perOk} de ${per.length}</div><div class="sub">Dentro da própria cadência</div></div>`;

    const areas = [];
    for (const tag of TAG_ORDER.concat(Object.keys(dailyByTag()).filter(x => !TAG_ORDER.includes(x)))) {
      const names = dailyByTag()[tag]; if (!names) continue;
      const r = rateRange(names, from, to);
      areas.push({ name: tagLabel(tag), r: r.r, done: r.done, tot: r.tot, color: colorOf(tag) });
    }
    const extra = [
      { name: "Tarefas", r: tk.r, done: tk.done, tot: tk.tot, color: "var(--self)" },
      { name: "Metas", r: gs.r, done: gs.n, tot: gs.n, color: "var(--n-purple)", goals: true },
    ];
    const row = a => `<div class="cat-row${a.r == null ? " na" : ""}" style="--c:${a.color}"><span class="name"><span class="sw"></span>${esc(a.name)}</span><span><span class="bar" style="width:${Math.max(2, (a.r || 0) * 100)}%"></span></span><span class="amt">${note10(a.r)} <small>${a.r == null ? "sem dados" : a.goals ? `${a.tot} meta${a.tot === 1 ? "" : "s"}` : `${a.done}/${a.tot}`}</small></span></div>`;
    $("ov-areas").innerHTML = `<div class="grp">Hábitos diários</div>${areas.map(row).join("") || '<p class="empty">Sem hábitos ainda.</p>'}<div class="grp">Tarefas e metas</div>${extra.map(row).join("")}`;
    renderRadar(areas.concat(extra));
    renderPeriodic("ov-per");
  }

  function render() {
    if (!S.started) return;
    index();
    document.querySelectorAll("[data-ssub]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.ssub === S.sub)));
    document.querySelectorAll("[data-spanel]").forEach(p => { p.style.display = p.dataset.spanel === S.sub ? "flex" : "none"; });
    if (S.sub === "visao") renderOverview();
    else if (S.sub === "habitos") { renderKpis(); renderDay(); renderTags(); renderPeriodic("hb-per"); renderGrid(); renderHeat(); }
    else if (S.sub === "tarefas") renderTasks();
    else renderGoals();
  }

  // ---------- eventos ----------
  const findHabit = id => S.habits.find(h => h.id === id);
  const findTask = id => S.tasks[id];
  document.addEventListener("click", e => {
    if (!S.started) return;
    const hb = e.target.closest("#view-self [data-hid]");
    if (hb) { const h = findHabit(hb.dataset.hid); if (h && !S.busy.has(h.id)) toggleHabit(h); return; }
    const pk = e.target.closest("#view-self [data-ptid]");
    if (pk) { const t = S.ptasks.find(x => x.id === pk.dataset.ptid); if (t && !S.busy.has(t.id)) togglePT(t); return; }
    const tk = e.target.closest("#view-self [data-tid]");
    if (tk) { const t = findTask(tk.dataset.tid); if (t && !S.busy.has(t.id)) toggleTask(t); return; }
    const hs = e.target.closest("#view-self [data-hsel]");
    if (hs) { S.sel = S.sel === hs.dataset.hsel ? null : hs.dataset.hsel; render(); return; }
    const ul = e.target.closest("#view-self [data-unlink]");
    if (ul) { const v = Object.assign({}, S.cfg?.vinculos || {}); delete v[ul.dataset.unlink]; saveLinks(v); return; }
  });
  document.addEventListener("change", e => {
    const s = e.target.closest && e.target.closest("#view-self select[data-link]");
    if (!s || !s.value) return;
    const v = Object.assign({}, S.cfg?.vinculos || {}); v[s.value] = s.dataset.link; saveLinks(v);
  });
  document.querySelectorAll("[data-ssub]").forEach(b => b.addEventListener("click", () => { S.sub = b.dataset.ssub; render(); }));
  $("hb-prev").addEventListener("click", () => { S.day = shift(S.day, -1); render(); });
  $("hb-next").addEventListener("click", () => { if (S.day < todayISO) { S.day = shift(S.day, 1); render(); } });
  $("hb-today").addEventListener("click", () => { S.day = todayISO; render(); });
  $("hb-heat-all").addEventListener("click", () => { S.sel = null; render(); });
  document.querySelectorAll("#hb-range button").forEach(b => b.addEventListener("click", () => {
    S.range = +b.dataset.r; document.querySelectorAll("#hb-range button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); render();
  }));
  document.querySelectorAll("#gl-filter button").forEach(b => b.addEventListener("click", () => {
    S.gfilter = b.dataset.f; document.querySelectorAll("#gl-filter button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); render();
  }));
  $("s-refresh").addEventListener("click", () => load(true));

  async function initDb() {
    const db = await window.claude?.use?.("db");
    if (!db) return;
    S.db = db;
    db.doc(CFG_DOC).onSnapshot(s => { S.cfg = s.exists ? s.data() : { vinculos: {} }; render(); }, () => {});
  }
  function start() {
    if (S.started) { render(); return; }
    S.started = true;
    readCache();
    if (S.loadedAt) setStatus("Última leitura salva", "");
    render();
    initDb();
    load(false);
  }
  window.addEventListener("painel:self", start);
})();
