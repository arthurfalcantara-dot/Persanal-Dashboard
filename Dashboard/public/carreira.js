/* ===================== Carreira ===================== */
(() => {
  const NOTION = "Notion", T_QUERY = "notion-query-data-sources", T_CREATE = "notion-create-pages", T_UPDATE = "notion-update-page";
  // views do Notion lidas em modo "view" (sem SQL, como nas outras abas)
  const V = {
    apps: "https://www.notion.so/130b0f63216780c1a08ed64e69578509?v=6342a2d6a24b45329c8fcac4d4e3905c",
    jtasks: "https://www.notion.so/1bab0f6321678078ad4ef7317ad56e40?v=378b0f6321678097816f000cd0e2767e",
    employers: "https://www.notion.so/1bcb0f632167802fab3fd79be31ed5ee?v=1bcb0f632167800d981e000cbe159b21",
    core: "https://www.notion.so/1bcb0f63216781078c94d1d6092f58aa?v=1bcb0f632167810d8380000c46f591a1",
    managerial: "https://www.notion.so/1e4b0f6321678042b7a8d169ed6c94ae?v=1e4b0f632167815197e4000c0f081ab5",
    cross: "https://www.notion.so/1e4b0f63216780d0884ec6979780e2d4?v=1e4b0f6321678167a4d2000c1ba1c1eb",
    devtasks: "https://www.notion.so/130b0f63216781a296ebdab70695e655?v=130b0f6321678177be8f000c08385fdc",
    courses: "https://www.notion.so/371b0f63216780f58b22fa6ea1733246?v=371b0f632167805988e9000c3a5650a7",
    skills: "https://www.notion.so/150b0f632167808aa959c50a8ba9f9dd?v=7bd460664e634c1d90f319e38123df24",
  };
  const DS = { apps: "f6caa859-7834-4a73-9649-68b0c59552ce", jtasks: "1bab0f63-2167-801f-834c-000b29a34dcd", employers: "1bcb0f63-2167-80e3-ad8d-000b90a1901a", devtasks: "130b0f63-2167-8109-a7a8-000b63cf7957" };
  const GOAL_ID = "130b0f63216781ae8739f44d38483b38"; // meta "Land First IR Job" no Goal Tracker
  const REL = { core: "Core Competencies", managerial: "Managerial Competencies", cross: "Cross-Functional Competencies " };
  const SRC_LABEL = { apps: "Job Application Tracker", jtasks: "Job Tasks", employers: "Employers", core: "Core Competencies", managerial: "Managerial Competencies", cross: "Cross-Functional Competencies", devtasks: "Personal Improvement Tasks", courses: "Courses", skills: "Skill Development Monitor" };
  const APP_ST = [
    { k: "Not Applied", l: "Não aplicada", c: "gray" },
    { k: "Applied", l: "Aplicada", c: "blue" },
    { k: "Tests", l: "Testes", c: "yellow" },
    { k: "Group Dinamic", l: "Dinâmica de grupo", c: "orange" },
    { k: "Interview", l: "Entrevista", c: "red" },
    { k: "Done", l: "Concluída", c: "green" },
  ];
  const ST_BY = Object.fromEntries(APP_ST.map(s => [s.k, s]));
  const ST_COUNT = { "Applied": ["aplicada", "aplicadas"], "Tests": ["em testes", "em testes"], "Group Dinamic": ["em dinâmica", "em dinâmica"], "Interview": ["em entrevista", "em entrevista"] };
  const ACTIVE = new Set(["Applied", "Tests", "Group Dinamic", "Interview"]);
  const RESULTADOS = ["", "Sem resposta", "Recusada", "Aprovada", "Oferta aceita", "Desisti"];
  const COURSE_ST = ["Não começou", "Em andamento", "Pronto"];
  const SKILL_ST = [["None", "Não iniciada"], ["Planned", "Planejada"], ["In Development", "Em desenvolvimento"], ["Almost There", "Quase lá"], ["Well Developed", "Bem desenvolvida"]];
  const GROUPS = [["core", "Core"], ["managerial", "Managerial"], ["cross", "Cross-functional"], ["valor", "Core Values"]];
  const GROUP_L = Object.fromEntries(GROUPS);
  const AREAS = [["POLNET", "Política, paz e humanitário"], ["DEVNET", "Econômico, social e desenvolvimento"], ["LEGALNET", "Jurídico"], ["INFONET", "Informação pública e conferências"], ["MAGNET", "Gestão e administração"], ["LOGNET", "Logística e cadeia de suprimentos"], ["ITECNET", "Tecnologia da informação"], ["SAFETYNET", "Segurança"], ["SCINET", "Ciência"], ["ONG", "ONGs e sociedade civil"], ["PESQ", "Pesquisa e think tanks"], ["BANCOS", "Bancos de desenvolvimento"], ["GOV", "Governo e diplomacia"]];
  const NIVEIS = ["Estágio", "UNV", "Consultoria", "YPP", "NO-A", "NO-B", "P-1", "P-2", "P-3", "G (local)", "Pesquisa ou bolsa"];
  const SOURCES = [
    { id: "s-uncareers", nome: "UN Careers", url: "https://careers.un.org/", g: "Sistema ONU" },
    { id: "s-undp", nome: "PNUD (UNDP)", url: "https://jobs.undp.org/cj_view_jobs.cfm", g: "Sistema ONU" },
    { id: "s-unicef", nome: "UNICEF", url: "https://jobs.unicef.org/cw/en-us/job", g: "Sistema ONU" },
    { id: "s-unhcr", nome: "ACNUR (UNHCR)", url: "https://unhcr.wd3.myworkdayjobs.com/External", g: "Sistema ONU" },
    { id: "s-wfp", nome: "PMA (WFP)", url: "https://wd3.myworkdaysite.com/recruiting/wfp/job_openings", g: "Sistema ONU" },
    { id: "s-fao", nome: "FAO", url: "https://jobs.fao.org/careersection/fao_external/jobsearch.ftl?lang=en", g: "Sistema ONU" },
    { id: "s-unfccc", nome: "UNFCCC", url: "https://unfccc.int/secretariat/employment/index.html", g: "Sistema ONU" },
    { id: "s-unsheet", nome: "Planilha de vagas da ONU", url: "https://lnkd.in/gBM6Cs8j", g: "Sistema ONU" },
    { id: "s-bid", nome: "BID", url: "https://iadbcareers.referrals.selectminds.com/", g: "Bancos e organismos regionais" },
    { id: "s-bm", nome: "Banco Mundial", url: "https://worldbankgroup.csod.com/ats/careersite/search.aspx?site=1&c=worldbankgroup", g: "Bancos e organismos regionais" },
    { id: "s-caf", nome: "CAF", url: "https://www.caf.com/pt/emprego/oportunidades-atuais/", g: "Bancos e organismos regionais" },
    { id: "s-ndb", nome: "Novo Banco de Desenvolvimento (BRICS)", url: "https://career15.sapsf.cn/career?company=newdevelop&career%5fns=job%5flisting%5fsummary&navBarLevel=JOB%5fSEARCH", g: "Bancos e organismos regionais" },
    { id: "s-afdb", nome: "Banco Africano de Desenvolvimento", url: "https://www.afdb.org/en/about-careers/current-vacancies", g: "Bancos e organismos regionais" },
    { id: "s-mercosul", nome: "Mercosul", url: "https://www.mercosur.int/pt-br/trabalhe-conosco/", g: "Bancos e organismos regionais" },
    { id: "s-oea", nome: "OEA", url: "https://www.oas.org/dhrs/dhr/employment_opportunities.asp", g: "Bancos e organismos regionais" },
    { id: "s-cidh", nome: "Corte Interamericana de Direitos Humanos", url: "https://www.corteidh.or.cr/oportunidades_de_empleo.cfm", g: "Bancos e organismos regionais" },
    { id: "s-otca", nome: "OTCA", url: "https://otca.org/en/job-offers/", g: "Bancos e organismos regionais" },
    { id: "s-itaipu", nome: "Itaipu Binacional", url: "https://www.itaipu.gov.br/processos-seletivos", g: "Bancos e organismos regionais" },
    { id: "s-impactpool", nome: "Impactpool", url: "https://www.impactpool.org/search", g: "Agregadores" },
    { id: "s-reliefweb", nome: "ReliefWeb Jobs", url: "https://reliefweb.int/jobs", g: "Agregadores" },
    { id: "s-unjobs", nome: "UNJobs", url: "https://unjobs.org/", g: "Agregadores" },
    { id: "s-napratica", nome: "Na Prática", url: "https://perfil.napratica.org.br/e/pt-BR/processos", g: "Agregadores" },
    { id: "s-gja", nome: "Global Jobs Atlas", url: "https://globaljobsatlas.com/", g: "Agregadores" },
    { id: "s-yah", nome: "Young and Hired", url: "http://www.youngandhired.org/", g: "Agregadores" },
    { id: "s-airtable", nome: "Lista de vagas (Airtable)", url: "https://airtable.com/appdaT39oc37S7NOq/shrM5v8bSyvZ2cdG2/tblVuLeAbVYCjnJEt?viewControls=on", g: "Agregadores" },
  ];
  const TIPOS_EXP = ["Emprego", "Estágio", "Voluntariado", "Consultoria", "Pesquisa", "Bolsa"];
  const NIVEIS_EDU = ["Ensino médio", "Técnico", "Graduação", "Especialização", "Mestrado", "Doutorado", "Pós-doutorado"];
  const STATUS_EDU = ["Concluído", "Em curso", "Interrompido"];
  const CEFR = ["Nativo", "C2", "C1", "B2", "B1", "A2", "A1"];
  const PUB_TIPOS = ["Artigo", "Capítulo", "Livro", "Relatório", "Policy brief", "Apresentação", "Outro"];
  const UN_LANGS = { ingles: "Inglês", english: "Inglês", frances: "Francês", french: "Francês", francais: "Francês", espanhol: "Espanhol", spanish: "Espanhol", espanol: "Espanhol", arabe: "Árabe", arabic: "Árabe", chines: "Chinês", chinese: "Chinês", mandarim: "Chinês", mandarin: "Chinês", russo: "Russo", russian: "Russo" };
  // Tabela de anos de experiência das notas da Mentoria (Professional & Higher Categories e National Professional Officers)
  const ELIG_P = [["P-1", 0, 1, 2], ["P-2", 2, 3, 4], ["P-3", 5, 6, 7], ["P-4", 7, 8, 9], ["P-5", 10, 11, 12]];
  const ELIG_NO = [["NO-A", 1], ["NO-B", 2], ["NO-C", 5], ["NO-D", 7]];
  const EV_LABEL = { 0: "No evidence", 1: "Marginal", 2: "Poor", 3: "Acceptable", 4: "Good", 5: "Outstanding" };
  const DENY = ["needs_reauth", "server_not_connected", "not_in_manifest", "blocked_by_policy", "approval_required", "consent_required", "selection_required"];
  const CACHE_KEY = "painel-carreira-v1";
  const RULE = "Regras de integridade: use apenas fatos que estejam no currículo, nas histórias ou no anúncio. Não invente cargos, datas, números, resultados, certificações, nomes de cursos nem fatos sobre a organização. Quando faltar um dado que faria diferença, escreva [COMPLETAR: o que falta].";

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = s => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
  const shift = (s, k) => { const d = parseISO(s); d.setDate(d.getDate() + k); return iso(d); };
  const today = new Date(), todayISO = iso(today), thisYM = todayISO.slice(0, 7);
  const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
  const ddmm = s => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
  const MON = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const ymLabel = ym => /^\d{4}-\d{2}/.test(ym || "") ? `${MON[+ym.slice(5, 7) - 1]}/${ym.slice(0, 4)}` : (ym || "");
  // id da página no link do Notion: o último bloco de 32 hex (ou UUID) do caminho, isolado. Pegar o primeiro bloco
  // juntava letras a–f do fim do título ao id ("Decade-1a2b…" → id errado → o Notion responde "não encontrada").
  const pageId = u => { const s = String(u || "").split(/[?#]/)[0]; const uu = [...s.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)].pop(); if (uu) return uu[0].replace(/-/g, "").toLowerCase(); const h = [...s.matchAll(/(?:^|[^0-9a-f])([0-9a-f]{32})(?![0-9a-f])/gi)].pop(); return h ? h[1].toLowerCase() : null; };
  const rel = v => { if (!v) return []; if (Array.isArray(v)) return v.map(pageId).filter(Boolean); try { const a = JSON.parse(v); return (Array.isArray(a) ? a : [a]).map(pageId).filter(Boolean); } catch { return [pageId(v)].filter(Boolean); } };
  const arr = v => { if (!v) return []; if (Array.isArray(v)) return v; try { const a = JSON.parse(v); return Array.isArray(a) ? a : [a]; } catch { return [String(v)]; } };
  const clean = s => String(s ?? "").replace(/\*\*/g, "").replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
  const normName = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  const notionUrl = id => "https://www.notion.so/" + id;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const n1 = v => (Math.round(v * 10) / 10).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
  const safeUrl = u => /^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "";
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const kpi = (icon, label, value, sub) => `<div class="kpi"><div class="label"><i class="ic" data-i="${icon}"></i>${label}</div><div class="value">${value}</div><div class="sub">${sub || ""}</div></div>`;
  const stPill = k => { const s = ST_BY[k] || { l: k || "—", c: "gray" }; return `<span class="c-status" style="--c:var(--n-${s.c})">${esc(s.l)}</span>`; };

  const emptyCv = () => ({ perfil: {}, experiencias: [], educacao: [], idiomas: [], certificacoes: [], habilidades: [], publicacoes: [], outros: "" });
  const C = {
    started: false, loading: false, loadedAt: null, mcp: null, db: null, sample: undefined,
    sub: "hunt", skv: "mapa", appFilter: "ativas", srcFilter: "todas", stFilter: "",
    apps: [], jtasks: [], employers: [], compRows: null, comps: [], devtasks: [], courses: [], skills: [],
    err: {}, fw: null, fwErr: null, fwLoading: false,
    cfg: {}, cv: emptyCv(), stories: [], dossies: {}, leads: [], treinos: [], fila: [], scout: null, fetchArg: undefined,
    dbReady: false, busy: new Set(), modal: null, buscaFilled: false,
  };

  // ---------- Notion: leitura ----------
  function payloadOf(res) { let p = res && (res.payload ?? res.content?.[0]?.text); if (typeof p === "string") { try { p = JSON.parse(p); } catch { /* texto */ } } return p; }
  async function callRead(tool, input, opts) {
    try { return await C.mcp.callTool(NOTION, tool, input, opts); }
    catch (e) {
      if (e && e.retryable) { await new Promise(r => setTimeout(r, (e.retryAfterMs || 1200) + Math.random() * 600)); return await C.mcp.callTool(NOTION, tool, input, opts); }
      throw e;
    }
  }
  async function queryView(view, maxPages = 20) {
    const out = []; let cursor = null, page = 0;
    do {
      const data = { mode: "view", view_url: view, page_size: 100 };
      if (cursor) data.start_cursor = cursor;
      const p = payloadOf(await callRead(T_QUERY, { data }, { cache: { staleTime: 30000 } }));
      if (!p || !Array.isArray(p.results)) throw { code: "tool_error", message: "resposta em formato inesperado de uma view do Notion" };
      out.push(...p.results);
      cursor = p.has_more ? p.next_cursor : null; page++;
    } while (cursor && page < maxPages);
    return out;
  }
  function normDate(r, prop) {
    const d = r[`date:${prop}:start`];
    if (!d) return null;
    return r[`date:${prop}:is_datetime`] === 1 && d.length > 10 ? iso(new Date(d)) : d.slice(0, 10);
  }
  const normApp = r => ({ id: pageId(r.url), url: r.url, name: clean(r.Name) || "(sem nome)", status: r.Status || "Not Applied", date: normDate(r, "Date"), link: safeUrl(r["userDefined:URL"]), platform: clean(r["Job Platform"]), employers: rel(r.Employer) });
  const normJTask = r => ({ id: pageId(r.url), url: r.url, name: clean(r.Name) || "(sem nome)", status: r.Status || "Not started", done: r.Status === "Done" || r.Done === "__YES__", due: normDate(r, "Due Date") || normDate(r, "Date"), apps: rel(r["Job Application Tracker"]) });
  const normEmployer = r => ({ id: pageId(r.url), url: r.url, name: clean(r.Name) || "(sem nome)", link: safeUrl(r["userDefined:URL"]), area: clean(r.Area), apps: rel(r["Job Apllication Tracker"]) });
  const normComp = (r, grupo) => ({ id: pageId(r.url), url: r.url, name: clean(r.Name) || "(sem nome)", rating: r.Rating === null || r.Rating === undefined || r.Rating === "" ? null : Number(r.Rating), grupo });
  function relSets(r) { return { core: rel(r["Core Competencies"]), managerial: rel(r["Managerial Competencies"]), cross: rel(r["Cross-Functional Competencies "] ?? r["Cross-Functional Competencies"]) }; }
  function normDev(r) {
    const rs = relSets(r);
    return { id: pageId(r.url), url: r.url, name: clean(r.Name) || "(sem nome)", status: r.Status || "Not started", done: r.Status === "Done", eta: normDate(r, "ETA") || normDate(r, "Due Date"), goal: rel(r.Goals)[0] || null, rel: rs, comps: [...rs.core, ...rs.managerial, ...rs.cross] };
  }
  function normCourse(r) {
    const rs = relSets(r);
    return { id: pageId(r.url), url: r.url, name: clean(r.Nome) || "(sem nome)", status: r.Status || "Não começou", done: r.Status === "Pronto", tags: arr(r.Tag).map(clean), platform: arr(r.Platform).map(clean), uni: clean(r.University), link: safeUrl(r["userDefined:URL"]), rel: rs, comps: [...rs.core, ...rs.managerial, ...rs.cross] };
  }
  const normSkill = r => ({ id: pageId(r.url), url: r.url, name: clean(r.Nome) || "(sem nome)", status: r.Status || "None" });

  function apply(k, rows) {
    if (k === "apps") C.apps = rows.map(normApp).filter(a => a.id);
    else if (k === "jtasks") C.jtasks = rows.map(normJTask).filter(t => t.id);
    else if (k === "employers") C.employers = rows.map(normEmployer).filter(e => e.id);
    else if (k === "core" || k === "managerial" || k === "cross") { C.compRows = Object.assign({}, C.compRows || {}, { [k]: rows.map(r => normComp(r, k)).filter(c => c.id) }); buildComps(); }
    else if (k === "devtasks") C.devtasks = rows.map(normDev).filter(t => t.id);
    else if (k === "courses") C.courses = rows.map(normCourse).filter(c => c.id);
    else if (k === "skills") C.skills = rows.map(normSkill).filter(s => s.id);
  }
  function clearNotion() { C.apps = []; C.jtasks = []; C.employers = []; C.compRows = null; C.devtasks = []; C.courses = []; C.skills = []; buildComps(); try { localStorage.removeItem(CACHE_KEY); } catch {} }
  async function load(force) {
    if (C.loading) return;
    C.loading = true; $("c-refresh").disabled = true;
    setStatus("Lendo o Notion…", "");
    try {
      const mcp = C.mcp || await window.claude?.use?.("mcp");
      if (!mcp) { setStatus(C.loadedAt ? "Última leitura salva" : "Sem conexão com o Notion", "warn"); banner("Entre no app para ler e atualizar suas candidaturas e competências no Notion."); return; }
      C.mcp = mcp;
      if (force) { try { await mcp.invalidate(NOTION, T_QUERY); } catch { /* nada em cache */ } }
      const keys = Object.keys(V);
      const res = await Promise.allSettled(keys.map(k => queryView(V[k])));
      const errs = {};
      res.forEach((r, i) => { if (r.status === "fulfilled") apply(keys[i], r.value); else errs[keys[i]] = r.reason; });
      C.err = errs;
      const failed = Object.keys(errs);
      if (failed.length === keys.length) {
        const e = errs[keys[0]], deny = DENY.includes(e && e.code);
        if (deny) clearNotion();
        setStatus(deny ? "Notion desconectado" : (C.loadedAt ? "Mostrando a última leitura" : "Falha ao ler o Notion"), "err");
        banner(errCopy(e));
      } else {
        C.loadedAt = Date.now(); writeCache();
        if (failed.length) { setStatus("Notion · leitura parcial", "warn"); banner(`Não consegui ler ${failed.map(k => SRC_LABEL[k]).join(", ")}. ${errCopy(errs[failed[0]])}`); }
        else { banner(null); setStatus(`Notion · ${new Date(C.loadedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, "live"); }
      }
      render(); refreshModal();
    } finally { C.loading = false; $("c-refresh").disabled = false; }
  }
  function errCopy(e) {
    switch (e && e.code) {
      case "no_mcp": return "Entre no app para gravar no Notion.";
      case "needs_reauth": return "O Notion recusou o token do app. Confira NOTION_TOKEN no Cloudflare.";
      case "server_not_connected": return "O servidor do app não tem NOTION_TOKEN configurado.";
      case "selection_required": return "Você tem mais de uma conexão do Notion. Escolha qual este painel deve usar quando o claude.ai perguntar.";
      case "not_in_manifest": case "consent_required": return "A integração Painel não tem acesso a uma das bases de Carreira no Notion (••• → Conexões → adicione Painel).";
      case "__x": return "O painel ainda não tem permissão para usar o Notion. Clique em Atualizar e permita o acesso.";
      case "blocked_by_policy": case "approval_required": return "A política da sua organização bloqueou o acesso deste painel ao Notion.";
      case "server_unavailable": return "O Notion não respondeu agora. Tente Atualizar em alguns segundos.";
      case "tool_error": return "O Notion recusou a operação: " + (e.message || "sem detalhe") + ".";
      default: return "Não consegui falar com o Notion (" + ((e && e.code) || "erro") + "). Tente Atualizar.";
    }
  }
  const writeErr = e => (e && (e.code === "server_unavailable" || e.code === "upstream_error" || e.code === "cancelled")) ? "O Notion não confirmou a gravação. Atualize e confira antes de tentar de novo, para não duplicar." : errCopy(e);
  function writeCache() { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ apps: C.apps, jtasks: C.jtasks, employers: C.employers, compRows: C.compRows, devtasks: C.devtasks, courses: C.courses, skills: C.skills, loadedAt: C.loadedAt })); } catch { /* sem armazenamento */ } }
  function readCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (c && Array.isArray(c.apps)) { Object.assign(C, { apps: c.apps, jtasks: c.jtasks || [], employers: c.employers || [], compRows: c.compRows || null, devtasks: c.devtasks || [], courses: c.courses || [], skills: c.skills || [], loadedAt: c.loadedAt || null }); buildComps(); }
    } catch { /* cache ilegível */ }
  }

  // ---------- Notion: escrita ----------
  async function notionUpdate(id, props) {
    if (!C.mcp) throw { code: "no_mcp" };
    const r = await C.mcp.callTool(NOTION, T_UPDATE, { page_id: id, command: "update_properties", properties: props }, { cache: false });
    try { await C.mcp.invalidate(NOTION, T_QUERY); } catch { /* sem cache */ }
    return r;
  }
  async function notionCreate(parent, props, content) {
    if (!C.mcp) throw { code: "no_mcp" };
    const page = { properties: props };
    if (content) page.content = content;
    const res = await C.mcp.callTool(NOTION, T_CREATE, { parent, pages: [page] }, { cache: false });
    try { await C.mcp.invalidate(NOTION, T_QUERY); } catch { /* sem cache */ }
    const p = payloadOf(res);
    const url = p && Array.isArray(p.pages) && p.pages[0] ? p.pages[0].url : null;
    return { url, id: pageId(url) };
  }
  // várias páginas na mesma base numa chamada só (as tarefas de um plano)
  async function notionCreateMany(parent, pages) {
    if (!C.mcp) throw { code: "no_mcp" };
    const res = await C.mcp.callTool(NOTION, T_CREATE, { parent, pages }, { cache: false });
    try { await C.mcp.invalidate(NOTION, T_QUERY); } catch { /* sem cache */ }
    const p = payloadOf(res);
    return p && Array.isArray(p.pages) ? p.pages.map(x => (x && x.url) || null) : [];
  }
  async function ensureEmployer(orgName) {
    if (!orgName) return null;
    const found = C.employers.find(e => normName(e.name) === normName(orgName));
    if (found) return found;
    const r = await notionCreate({ data_source_id: DS.employers }, { Name: orgName });
    const emp = { id: r.id, url: r.url, name: orgName, link: "", area: "", apps: [] };
    if (r.id) C.employers.push(emp);
    return emp;
  }

  // ---------- banco do painel (db) ----------
  const wq = new Map();
  function dbq(path, fn) { const prev = wq.get(path) || Promise.resolve(); const p = prev.catch(() => {}).then(fn); wq.set(path, p); return p; }
  const plain = o => JSON.parse(JSON.stringify(o));
  function dbErr(e) {
    switch (e && e.code) {
      case "quota_exceeded": return "O banco do painel está cheio. Apague histórias ou vagas antigas do radar e tente de novo.";
      case "resource_exhausted": return "Muitas gravações seguidas. Espere alguns segundos e tente de novo.";
      case "invalid_argument": return "O painel não aceitou esses dados (texto grande demais?).";
      case "revoked": case "not_granted": case "capability_disabled": return "Este acesso ao painel não pode gravar dados.";
      default: return "Não consegui salvar no painel (" + ((e && e.code) || "erro") + "). Tente de novo.";
    }
  }
  function needDb() { if (!C.db) { toast("Entre no app para salvar estes dados."); return false; } return true; }
  async function initDb() {
    const db = await window.claude?.use?.("db");
    if (!db) { C.dbReady = false; render(); return; }
    C.db = db; C.dbReady = true;
    const fail = e => { if (e && e.code === "revoked") { C.db = null; C.dbReady = false; } render(); };
    db.doc("carreira/config").onSnapshot(s => { C.cfg = s.exists ? s.data() : {}; render(); }, fail);
    db.doc("carreira/cv").onSnapshot(s => { C.cv = Object.assign(emptyCv(), s.exists ? s.data() : {}); render(); refreshModal(); }, fail);
    db.collection("carreira/banco/historias").limit(500).onSnapshot(q => { C.stories = q.docs.map(d => Object.assign({ id: d.id }, d.data())); render(); refreshModal(); }, fail);
    db.collection("carreira/vagas/dossies").limit(500).onSnapshot(q => { const m = {}; q.docs.forEach(d => { m[d.id] = d.data(); }); C.dossies = m; render(); }, fail);
    db.collection("carreira/radar/leads").limit(500).onSnapshot(q => { C.leads = q.docs.map(d => Object.assign({ id: d.id }, d.data())); render(); }, fail);
    db.collection("carreira/treino/tentativas").orderBy("data", "desc").limit(300).onSnapshot(q => { C.treinos = q.docs.map(d => Object.assign({ id: d.id }, d.data())); render(); refreshModal(); }, fail);
    // fila de links que a rotina do app lê; resumo da varredura semanal
    db.collection("carreira/fila/links").limit(200).onSnapshot(q => { C.fila = q.docs.map(d => Object.assign({ id: d.id }, d.data())); render(); }, fail);
    db.doc("carreira/scout").onSnapshot(s => { C.scout = s.exists ? s.data() : null; render(); }, fail);
  }
  async function saveCfg(patch) {
    if (!needDb()) return false;
    const next = Object.assign({}, C.cfg || {}, patch);
    C.cfg = next;
    try { await dbq("carreira/config", () => C.db.doc("carreira/config").set(plain(next))); return true; }
    catch (e) { toast(dbErr(e)); return false; }
  }
  async function saveCv(next) {
    if (!needDb()) return false;
    next = Object.assign(emptyCv(), next, { atualizado: new Date().toISOString() });
    C.cv = next; render();
    try { await dbq("carreira/cv", () => C.db.doc("carreira/cv").set(plain(next))); return true; }
    catch (e) { toast(dbErr(e)); return false; }
  }
  async function saveDoc(path, data) {
    if (!needDb()) return false;
    try { await dbq(path, () => C.db.doc(path).set(plain(data))); return true; }
    catch (e) { toast(dbErr(e)); return false; }
  }
  async function delDoc(path) {
    if (!needDb()) return false;
    try { await dbq(path, () => C.db.doc(path).delete()); return true; }
    catch (e) { toast(dbErr(e)); return false; }
  }
  function saveDossie(appId, patch) {
    const next = Object.assign({}, C.dossies[appId] || {}, patch, { atualizado: new Date().toISOString() });
    C.dossies = Object.assign({}, C.dossies, { [appId]: next });
    return saveDoc("carreira/vagas/dossies/" + appId, next);
  }

  // ---------- quadro de competências (arquivo competencias.json publicado junto) ----------
  async function loadFramework() {
    if (C.fw || C.fwLoading) return;
    C.fwLoading = true;
    try {
      const r = await fetch("competencias.json");
      if (!r.ok) throw new Error("HTTP " + r.status);
      C.fw = await r.json(); C.fwErr = null;
      buildComps(); render(); refreshModal();
    } catch (e) { C.fwErr = e; render(); }
    finally { C.fwLoading = false; }
  }
  const fwKey = key => (C.fw?.competencias || []).find(f => f.key === key) || null;
  function buildComps() {
    const fws = C.fw?.competencias || [];
    const byNid = {}, byName = {};
    for (const f of fws) { byNid[f.notionId] = f; byName[normName(f.nome)] = f; if (f.ohrm) byName[normName(f.ohrm.nome)] = f; if (f.unhcr) byName[normName(f.unhcr.nome)] = f; }
    const out = [], seen = new Set();
    for (const g of ["core", "managerial", "cross"]) {
      for (const r of (C.compRows?.[g] || [])) {
        const f = byNid[r.id] || byName[normName(r.name)] || null;
        const key = f ? f.key : "n:" + r.id;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ key, id: r.id, url: r.url, name: r.name, grupo: g, rating: r.rating, fw: f, notion: true });
      }
    }
    for (const f of fws) {
      if (seen.has(f.key)) continue;
      if (f.grupo !== "valor" && C.compRows && C.compRows[f.grupo]) continue; // a base do Notion manda: competência removida de lá não volta
      out.push({ key: f.key, id: f.notionId, url: notionUrl(f.notionId), name: f.nome, grupo: f.grupo, rating: null, fw: f, notion: false });
    }
    C.comps = out;
  }
  const compBy = key => C.comps.find(c => c.key === key) || null;
  const compName = key => compBy(key)?.name || fwKey(key)?.nome || key;
  const compsOf = g => C.comps.filter(c => c.grupo === g);
  const ratedComps = () => C.comps.filter(c => c.grupo !== "valor");

  // ---------- métricas derivadas ----------
  const appBy = id => C.apps.find(a => a.id === id) || null;
  const employerBy = id => C.employers.find(e => e.id === id) || null;
  const appOrgs = a => a.employers.map(employerBy).filter(Boolean);
  const appOrgText = a => appOrgs(a).map(e => e.name).join(", ");
  const tasksOf = a => C.jtasks.filter(t => t.apps.includes(a.id));
  function forcaNum(v) { if (v === "NE" || v === 0) return 0; const n = Number(v); return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null; }
  function evidenceOf(key) {
    let best = null;
    for (const s of C.stories) {
      if (!(s.competencias || []).includes(key)) continue;
      const n = forcaNum(s.forca && s.forca[key]);
      if (n !== null && (best === null || n > best)) best = n;
    }
    return best;
  }
  const storiesOf = key => C.stories.filter(s => (s.competencias || []).includes(key));
  function actionsOf(comp) {
    if (!comp) return { tasks: [], courses: [] };
    return { tasks: C.devtasks.filter(t => t.comps.includes(comp.id)), courses: C.courses.filter(c => c.comps.includes(comp.id)) };
  }
  function openActionsCount(comp) { const a = actionsOf(comp); return a.tasks.filter(t => !t.done).length + a.courses.filter(c => !c.done).length; }
  function demandOf(key) {
    let all = 0, active = 0;
    for (const [appId, d] of Object.entries(C.dossies)) {
      const ks = (d.analise?.competencias || []).map(x => x && x.key);
      if (!ks.includes(key)) continue;
      all++;
      const a = appBy(appId);
      if (!a || a.status !== "Done") active++;
    }
    return { all, active };
  }
  function scoreOf(an) {
    const reqs = an && Array.isArray(an.requisitos) ? an.requisitos : [];
    let num = 0, den = 0;
    for (const r of reqs) { const w = /obrig/i.test(r.tipo || "") ? 2 : 1; const v = r.atende === "sim" ? 1 : r.atende === "parcial" ? .5 : 0; num += w * v; den += w; }
    return den ? Math.round(100 * num / den) : null;
  }
  function priorities() {
    const out = [];
    for (const c of ratedComps()) {
      const ev = evidenceOf(c.key), dm = demandOf(c.key);
      if (dm.active && (ev === null || ev < 3)) out.push({ c, ev, dm, why: `Pedida em ${plural(dm.active, "vaga em andamento", "vagas em andamento")} · ${ev === null ? "sem história" : `evidência ${ev === 0 ? "NE" : ev}`}`, rank: 100 + dm.active * 10 - (ev ?? -1) });
    }
    for (const c of compsOf("core")) {
      if (out.some(o => o.c.key === c.key)) continue;
      if (!storiesOf(c.key).length) out.push({ c, ev: null, dm: demandOf(c.key), why: "Core sem nenhuma história no banco", rank: 10 });
    }
    return out.sort((a, b) => b.rank - a.rank || a.c.name.localeCompare(b.c.name));
  }
  function agendaItems() {
    const items = [], horizon = shift(todayISO, 45);
    for (const a of C.apps) if (a.status === "Not Applied" && a.date && a.date <= horizon) items.push({ kind: "prazo", date: a.date, app: a });
    for (const t of C.jtasks) if (!t.done) items.push({ kind: "tarefa", date: t.due, task: t, app: appBy(t.apps[0]) });
    for (const a of C.apps) if (a.status === "Interview") items.push({ kind: "entrevista", date: null, app: a });
    const rank = it => it.date ? (it.date < todayISO ? 0 : 1) : 2;
    return items.sort((x, y) => rank(x) - rank(y) || String(x.date || "").localeCompare(String(y.date || "")));
  }
  function ymIndex(ym) { const m = /^(\d{4})-(\d{2})/.exec(ym || ""); return m ? (+m[1]) * 12 + (+m[2] - 1) : null; }
  function experienceYears() {
    const load = new Map();
    for (const e of C.cv.experiencias || []) {
      if (e.conta === false) continue;
      const s = ymIndex(e.inicio); const f = e.atual || !e.fim ? ymIndex(thisYM) : ymIndex(e.fim);
      if (s === null || f === null || f < s) continue;
      const ded = Math.max(0, Math.min(100, Number(e.dedicacao) || 100)) / 100;
      for (let m = s; m <= f; m++) load.set(m, (load.get(m) || 0) + ded);
    }
    let months = 0; for (const v of load.values()) months += Math.min(1, v);
    return months / 12;
  }
  function degreeTier() {
    const done = (C.cv.educacao || []).filter(e => (e.status || "Concluído") === "Concluído");
    if (done.some(e => /mestrado|doutorado|pós-doutorado|pos-doutorado/i.test(e.nivel || ""))) return "mestrado";
    if (done.some(e => /graduação|graduacao|especialização|especializacao/i.test(e.nivel || ""))) return "graduacao";
    return null;
  }
  function unLanguages() {
    const out = [];
    for (const l of C.cv.idiomas || []) {
      const k = UN_LANGS[normName(l.idioma)];
      if (k && ["Nativo", "C2", "C1", "B2"].includes(l.nivel)) out.push(`${k} (${l.nivel})`);
    }
    return out;
  }
  function readiness() {
    const cv = C.cv, ex = cv.experiencias || [], ed = cv.educacao || [], id = cv.idiomas || [];
    const bullets = ex.flatMap(e => e.realizacoes || []);
    const quant = bullets.filter(b => /\d/.test(b)).length;
    return [
      { ok: !!(cv.perfil?.titulo && cv.perfil?.resumo), t: "Título e resumo de perfil", s: "Uma linha de posicionamento e um resumo de três a quatro linhas." },
      { ok: ed.some(e => (e.status || "Concluído") === "Concluído"), t: "Formação concluída registrada", s: "Nível, curso, instituição e ano; a elegibilidade depende disso." },
      { ok: ex.length > 0 && ex.every(e => e.inicio && (e.realizacoes || []).length >= 2), t: "Experiências com período e realizações", s: "Início e fim (mês e ano) e ao menos duas realizações por experiência." },
      { ok: bullets.length > 0 && quant / bullets.length >= .5, t: "Resultados mensuráveis", s: bullets.length ? `${quant} de ${bullets.length} realizações têm número ou percentual; a meta é metade.` : "Inclua números: pessoas atendidas, prazos, volumes, percentuais." },
      { ok: ex.length > 0 && ex.every(e => (e.competencias || []).length), t: "Competências marcadas nas experiências", s: "Liga o currículo ao Skill Development e às histórias de entrevista." },
      { ok: id.length >= 2 && id.every(l => l.nivel) && id.some(l => UN_LANGS[normName(l.idioma)] === "Inglês"), t: "Idiomas com nível", s: "Ao menos dois idiomas, com inglês, no padrão do Quadro Europeu (A1 a C2)." },
      { ok: (cv.certificacoes || []).length > 0, t: "Certificações e cursos", s: "Cursos e certificados que sustentam as competências técnicas." },
    ];
  }

  // ---------- Claude (sample) ----------
  async function getSample() {
    if (C.sample !== undefined) return C.sample;
    try { C.sample = (await window.claude?.use?.("sample")) || null; } catch { C.sample = null; }
    $("view-carreira").dataset.ai = C.sample ? "on" : "off";
    return C.sample;
  }
  function sampleErr(e) {
    switch (e && e.code) {
      case "not_granted": case "sampling_disabled": case "not_declared": case "capability_disabled": case "capability_removed":
        C.sample = null; $("view-carreira").dataset.ai = "off";
        return "O Claude não está disponível neste painel (o acesso foi recusado ou está desativado).";
      case "rate_limited": return "Muitas chamadas ao Claude agora. Espere um pouco e tente de novo.";
      case "session_expired": return "Sua sessão expirou. Entre de novo no app.";
      case "prompt_too_large": return "O texto ficou grande demais para o Claude. Encurte o anúncio ou o currículo e tente de novo.";
      case "invalid_json": return "O Claude respondeu fora do formato esperado. Tente de novo.";
      case "refused": return "O Claude recusou este pedido. Reformule o texto e tente de novo.";
      case "empty_completion": return "O Claude não produziu resposta. Simplifique o pedido e tente de novo.";
      case "cancelled": return "";
      default: return "Não consegui falar com o Claude (" + ((e && e.code) || "erro") + "). Tente de novo.";
    }
  }
  function showMsg(el, text, ok) { if (!el) return; el.textContent = text || ""; el.hidden = !text; el.classList.toggle("ok", !!ok); }
  async function withClaude(btn, msgEl, fn) {
    const sample = await getSample();
    if (!sample) { showMsg(msgEl, "O Claude ainda não está ligado ao app: falta a chave ANTHROPIC_API_KEY no Cloudflare."); return; }
    const label = btn ? btn.innerHTML : "";
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="c-thinking">Pensando…</span>'; }
    showMsg(msgEl, "");
    try { await fn(sample); }
    catch (e) { const m = sampleErr(e); if (m) showMsg(msgEl, m); }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = label; } }
  }
  function cvText(max = 14000) {
    const cv = C.cv, p = cv.perfil || {}, L = [];
    if (p.nome) L.push("# " + p.nome);
    if (p.titulo) L.push(p.titulo);
    const contato = [p.local, p.email, p.linkedin, p.site].filter(Boolean).join(" · ");
    if (contato) L.push(contato);
    if (p.resumo) L.push("", "## Resumo", p.resumo);
    if ((cv.experiencias || []).length) {
      L.push("", "## Experiência");
      for (const e of sortExp(cv.experiencias)) {
        const per = `${ymLabel(e.inicio) || "?"} – ${e.atual ? "atual" : (ymLabel(e.fim) || "?")}`;
        const extra = [e.tipo, e.local, e.dedicacao && Number(e.dedicacao) < 100 ? `${e.dedicacao}% de dedicação` : "", e.campo ? "experiência de campo" : ""].filter(Boolean).join(", ");
        L.push(`### ${e.cargo || "(cargo)"} — ${e.org || "(organização)"} (${per})${extra ? " · " + extra : ""}`);
        for (const b of e.realizacoes || []) L.push("- " + b);
        if ((e.competencias || []).length) L.push("Competências demonstradas: " + e.competencias.map(compName).join(", "));
      }
    }
    if ((cv.educacao || []).length) {
      L.push("", "## Formação");
      for (const e of cv.educacao) L.push(`- ${e.nivel || ""}: ${e.curso || ""} — ${e.instituicao || ""} (${[ymLabel(e.inicio), e.status === "Em curso" ? `previsão ${ymLabel(e.fim) || "?"}` : ymLabel(e.fim)].filter(Boolean).join(" – ")}; ${e.status || "Concluído"})${e.tese ? ` · Tese/TCC: ${e.tese}` : ""}`);
    }
    if ((cv.idiomas || []).length) L.push("", "## Idiomas", ...cv.idiomas.map(l => `- ${l.idioma}: ${l.nivel || "nível não informado"}${l.certificado ? ` (${l.certificado})` : ""}`));
    if ((cv.certificacoes || []).length) L.push("", "## Certificações e cursos", ...cv.certificacoes.map(c => `- ${c.nome}${c.instituicao ? " — " + c.instituicao : ""}${c.data ? ` (${ymLabel(c.data)})` : ""}`));
    if ((cv.habilidades || []).length) L.push("", "## Habilidades", cv.habilidades.join(", "));
    if ((cv.publicacoes || []).length) L.push("", "## Publicações", ...cv.publicacoes.map(p2 => `- ${p2.titulo}${p2.veiculo ? ". " + p2.veiculo : ""}${p2.ano ? `, ${p2.ano}` : ""}${p2.tipo ? ` (${p2.tipo})` : ""}`));
    if (cv.outros) L.push("", "## Outros destaques", cv.outros);
    const s = L.join("\n").trim();
    return s.length > max ? s.slice(0, max) + "\n[…]" : s;
  }
  function sortExp(list) { return (list || []).slice().sort((a, b) => (b.atual ? "9999" : (b.fim || b.inicio || "")).localeCompare(a.atual ? "9999" : (a.fim || a.inicio || "")) || String(b.inicio || "").localeCompare(String(a.inicio || ""))); }
  function storiesDigest(max = 7000) {
    const s = C.stories.map(st => `[${st.id}] ${st.titulo || "(sem título)"} — competências: ${(st.competencias || []).map(k => `${k} (${forcaNum(st.forca?.[k]) ?? "sem nota"})`).join(", ")}\n  C: ${clip(st.contexto, 220)}\n  A: ${clip(st.acao, 260)}\n  R: ${clip(st.resultado, 220)}`).join("\n");
    return s.length > max ? s.slice(0, max) + "\n[…]" : (s || "(banco vazio)");
  }
  const clip = (t, n) => { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
  const compCatalog = () => C.comps.map(c => `${c.key} — ${c.name} (${GROUP_L[c.grupo] || c.grupo})`).join("\n");
  function compBrief(key) {
    const c = compBy(key), f = c?.fw || fwKey(key);
    const L = [`${c ? c.name : key} (${GROUP_L[c?.grupo] || ""})`];
    if (f?.unhcr?.def) L.push("Definição (ACNUR): " + f.unhcr.def);
    if (f?.unhcr?.niveis) L.push("Níveis (ACNUR): " + Object.entries(f.unhcr.niveis).map(([k, v]) => `${k} ${v}`).join("; "));
    if (f?.ohrm?.pos?.length) L.push("Indicadores positivos (ONU): " + f.ohrm.pos.join(" | "));
    if (f?.ohrm?.neg?.length) L.push("Indicadores negativos (ONU): " + f.ohrm.neg.join(" | "));
    return L.join("\n");
  }
  function buscaText() {
    const b = C.cfg?.busca || {};
    const parts = [];
    if (b.palavras) parts.push("Palavras-chave: " + b.palavras);
    if ((b.areas || []).length) parts.push("Áreas: " + b.areas.map(a => (AREAS.find(x => x[0] === a) || [a, a])[1]).join(", "));
    if ((b.niveis || []).length) parts.push("Níveis: " + b.niveis.join(", "));
    if (b.locais) parts.push("Locais: " + b.locais);
    if (b.remoto) parts.push("Aceita remoto");
    if (b.excluir) parts.push("Evitar: " + b.excluir);
    return parts.join("\n") || "(perfil de busca não preenchido)";
  }

  // ---------- UI util ----------
  function setStatus(t, k) { const s = $("c-status"); s.textContent = t; s.className = "pill" + (k ? " " + k : ""); }
  function banner(t) { const b = $("c-banner"); if (!t) { b.hidden = true; return; } b.innerHTML = "<strong>Atenção</strong><span>" + esc(t) + "</span>"; b.hidden = false; }
  let tt; function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => { el.hidden = true; }, 3600); }
  function dayLabel(d) { if (!d) return "Sem data"; const k = daysBetween(todayISO, d); if (k === 0) return "Hoje"; if (k === 1) return "Amanhã"; if (k === -1) return "Ontem"; return ddmm(d); }
  function dateClass(d) { if (!d) return ""; const k = daysBetween(todayISO, d); return k < 0 ? "late" : k <= 7 ? "soon" : ""; }
  function dots(n) { return `<span class="c-dots" aria-hidden="true">${[1, 2, 3, 4, 5].map(i => `<i class="${n !== null && n >= i ? "f" : ""}"></i>`).join("")}</span>`; }
  function evChip(n) { const lbl = n === null ? "—" : n === 0 ? "NE" : String(n); const t = n === null ? "Sem história" : EV_LABEL[n]; return `<span class="c-ev${n === null || n === 0 ? " ne" : ""}" title="${esc(t)}">${dots(n)}<b>${lbl}</b></span>`; }
  const sinceLabel = d => { if (!d) return "nunca"; const k = daysBetween(d, todayISO); return k <= 0 ? "hoje" : k === 1 ? "ontem" : `há ${k} dias`; };
  const compChip = key => `<button type="button" class="c-tag" data-comp="${esc(key)}">${esc(compName(key))}</button>`;

  // ---------- render: Job Hunt ----------
  function renderHunt() {
    const apps = C.apps, nApplied = apps.filter(a => a.status === "Not Applied"), inProc = apps.filter(a => ACTIVE.has(a.status));
    const upcoming = nApplied.filter(a => a.date && a.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date));
    const late = nApplied.filter(a => a.date && a.date < todayISO);
    const openT = C.jtasks.filter(t => !t.done), lateT = openT.filter(t => t.due && t.due < todayISO);
    const done = apps.filter(a => a.status === "Done");
    const resCount = done.filter(a => C.dossies[a.id]?.resultado).length;
    $("c-hunt-kpis").innerHTML =
      kpi("flag", "A aplicar", nApplied.length, upcoming.length ? `Próximo prazo ${dayLabel(upcoming[0].date)}` : late.length ? `<span class="c-bad">${plural(late.length, "prazo vencido", "prazos vencidos")}</span>` : "Nenhum prazo registrado") +
      kpi("briefcase", "Em processo", inProc.length, inProc.length ? APP_ST.filter(s => ACTIVE.has(s.k)).map(s => [s.k, inProc.filter(a => a.status === s.k).length]).filter(x => x[1]).map(([k, n]) => `${n} ${ST_COUNT[k][n === 1 ? 0 : 1]}`).join(" · ") : "Nenhuma candidatura em andamento") +
      kpi("chat", "Entrevistas", apps.filter(a => a.status === "Interview").length, "Etapa Interview no tracker") +
      kpi("check", "Concluídas", done.length, done.length ? `${resCount} com resultado anotado` : "Nenhuma concluída") +
      kpi("tasks", "Tarefas abertas", openT.length, lateT.length ? `<span class="c-bad">${plural(lateT.length, "atrasada", "atrasadas")}</span>` : "Nenhuma atrasada");
    renderAgenda(); renderFunnel(); renderIntake(); renderBoard(); renderScout(); renderLeads(); fillBusca(); renderLinks(); renderSources();
  }
  function renderAgenda() {
    const items = agendaItems();
    if (!items.length) { $("c-agenda").innerHTML = `<p class="empty">${C.loadedAt ? "Nada pendente: nenhum prazo nos próximos 45 dias nem tarefa aberta no Job Tasks." : "Os prazos e as tarefas aparecem aqui depois da leitura do Notion."}</p>`; return; }
    $("c-agenda").innerHTML = items.map(it => {
      const cls = dateClass(it.date);
      if (it.kind === "tarefa") {
        const t = it.task;
        return `<div class="c-ag${C.busy.has(t.id) ? " busy" : ""}"><button class="tchk" data-jtask="${t.id}" aria-label="Concluir ${esc(t.name)}">${CHECK}</button><span class="ad ${cls}">${dayLabel(it.date)}</span><span class="at"><b>${esc(t.name)}</b><small>${it.app ? "Tarefa · " + esc(it.app.name) : "Tarefa"}</small></span><a class="c-link" href="${esc(t.url)}" target="_blank" rel="noopener" aria-label="Abrir no Notion"><i class="ic" data-i="ext"></i></a></div>`;
      }
      if (it.kind === "prazo") {
        const a = it.app, k = daysBetween(todayISO, a.date);
        return `<div class="c-ag"><span class="ak"><i class="ic" data-i="flag"></i></span><span class="ad ${cls}">${dayLabel(a.date)}</span><span class="at"><b>${esc(a.name)}</b><small>${k < 0 ? `Prazo passou há ${plural(-k, "dia", "dias")} · ainda como não aplicada` : `Prazo de candidatura${k > 1 ? ` · faltam ${k} dias` : ""}`}${appOrgText(a) ? " · " + esc(appOrgText(a)) : ""}</small></span><button class="btn ghost" data-app="${a.id}">Abrir</button></div>`;
      }
      const a = it.app;
      return `<div class="c-ag"><span class="ak"><i class="ic" data-i="chat"></i></span><span class="ad">Entrevista</span><span class="at"><b>${esc(a.name)}</b><small>Prepare as histórias para as competências da vaga</small></span><button class="btn ghost" data-app="${a.id}">Preparar</button></div>`;
    }).join("");
  }
  function renderFunnel() {
    const counts = APP_ST.map(s => [s, C.apps.filter(a => a.status === s.k).length]);
    const max = Math.max(1, ...counts.map(x => x[1]));
    const sent = C.apps.filter(a => a.status !== "Not Applied").length;
    $("c-funnel").innerHTML = counts.map(([s, n]) => `<div class="c-fn" title="${esc(s.l)}: ${n}"><span class="fl">${esc(s.l)}</span><span class="fb"><i class="${n ? "" : "z"}" style="width:${(n / max * 100).toFixed(1)}%"></i></span><span class="fv">${n}</span></div>`).join("")
      + `<div class="c-fsum"><span><b>${C.apps.length}</b> no tracker</span><span><b>${sent}</b> enviadas</span><span><b>${C.apps.filter(a => ["Tests", "Group Dinamic", "Interview"].includes(a.status)).length}</b> em etapas seletivas</span></div>`;
  }
  function renderBoard() {
    const cols = APP_ST.filter(s => C.appFilter === "todas" || s.k !== "Done");
    if (!C.apps.length) { $("c-board").innerHTML = `<p class="empty">${C.loadedAt ? "Nenhuma candidatura no Job Application Tracker. Use Nova candidatura ou leve uma vaga do radar." : "As candidaturas do Notion aparecem aqui."}</p>`; return; }
    const lists = cols.map(s => [s, C.apps.filter(a => a.status === s.k).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999") || a.name.localeCompare(b.name))]);
    $("c-board").style.gridTemplateColumns = lists.map(([, l]) => l.length ? "minmax(210px, 1fr)" : "144px").join(" ");
    $("c-board").innerHTML = lists.map(([s, list]) => `<div class="c-col${list.length ? "" : " z"}"><div class="c-col-h">${stPill(s.k)}<span class="n">${list.length}</span></div>${list.length ? list.map(appCard).join("") : `<p class="empty">Nenhuma</p>`}</div>`).join("");
  }
  function appCard(a) {
    const d = C.dossies[a.id], sc = scoreOf(d?.analise), nt = tasksOf(a).filter(t => !t.done).length;
    const org = [appOrgText(a), a.platform].filter(Boolean).join(" · ");
    const dl = a.date ? `<span class="${a.status === "Not Applied" ? dateClass(a.date) : ""}">${a.status === "Not Applied" ? "prazo " : ""}${ddmm(a.date)}</span>` : "";
    return `<button class="c-app" data-app="${a.id}"><span class="nm">${esc(a.name)}</span>${org ? `<span class="org">${esc(org)}</span>` : ""}<span class="mt">${dl}${sc !== null ? `<span class="chip">aderência ${sc}%</span>` : ""}${nt ? `<span class="chip">${plural(nt, "tarefa", "tarefas")}</span>` : ""}${d?.resultado ? `<span class="chip">${esc(d.resultado)}</span>` : ""}</span></button>`;
  }
  function renderLeads() {
    const list = C.leads.filter(l => (l.status || "novo") === "novo").sort((a, b) => String(a.prazo || "9999").localeCompare(String(b.prazo || "9999")));
    const done = C.leads.filter(l => l.status === "no-notion").length, arch = C.leads.filter(l => l.status === "arquivado").length;
    $("c-leads-label").textContent = `Caixa de entrada · ${list.length}` + (done || arch ? ` (${done} levadas ao Notion, ${arch} arquivadas)` : "");
    if (!C.dbReady) { $("c-leads").innerHTML = `<p class="empty">O radar fica no banco do app e aparece depois que você entra.</p>`; return; }
    if (!list.length) { $("c-leads").innerHTML = `<p class="empty">Nenhuma vaga nova. Cole um anúncio acima, ou peça ao Claude no chat para buscar vagas com o seu perfil de busca e colocá-las aqui.</p>`; return; }
    $("c-leads").innerHTML = list.map(l => {
      const k = l.prazo ? daysBetween(todayISO, l.prazo) : null;
      return `<div class="c-lead"><div class="lt"><b>${esc(l.titulo || "(sem título)")}</b>${l.prazo ? `<span class="c-mini ${k < 0 ? "c-bad" : k <= 7 ? "c-warn" : ""}">prazo ${ddmm(l.prazo)}</span>` : ""}</div>
        <div class="lm">${[l.organizacao, l.local, l.nivel, l.fonte].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}${safeUrl(l.link) ? `<a class="c-link" href="${esc(l.link)}" target="_blank" rel="noopener"><i class="ic" data-i="ext"></i>Anúncio</a>` : ""}</div>
        ${l.resumo ? `<p>${esc(l.resumo)}</p>` : ""}
        <div class="c-row-actions"><button class="btn c-ai-only" data-lead-plan="${l.id}"><i class="ic" data-i="spark"></i>Planejar tarefas</button><button class="btn" data-lead-promote="${l.id}">Levar ao Notion</button><button class="btn ghost" data-lead-edit="${l.id}">Editar</button><button class="btn ghost" data-lead-archive="${l.id}">Arquivar</button></div></div>`;
    }).join("");
  }
  function fillBusca() {
    if (C.buscaFilled) return;
    const b = C.cfg?.busca;
    if (!$("cb-areas").childElementCount) {
      $("cb-areas").innerHTML = AREAS.map(([k, l]) => `<label class="c-pick"><input type="checkbox" name="cb-area" value="${k}">${/NET$/.test(k) ? `${esc(l)} <small>${k}</small>` : esc(l)}</label>`).join("");
      $("cb-niveis").innerHTML = NIVEIS.map(n => `<label class="c-pick"><input type="checkbox" name="cb-nivel" value="${esc(n)}">${esc(n)}</label>`).join("");
    }
    if (!b) return;
    const form = $("c-busca");
    if (form.contains(document.activeElement)) return;
    $("cb-palavras").value = b.palavras || ""; $("cb-locais").value = b.locais || ""; $("cb-excluir").value = b.excluir || ""; $("cb-remoto").checked = !!b.remoto;
    form.querySelectorAll('input[name="cb-area"]').forEach(i => { i.checked = (b.areas || []).includes(i.value); });
    form.querySelectorAll('input[name="cb-nivel"]').forEach(i => { i.checked = (b.niveis || []).includes(i.value); });
    C.buscaFilled = true;
  }
  function readBusca() {
    const form = $("c-busca");
    return {
      palavras: $("cb-palavras").value.trim(), locais: $("cb-locais").value.trim(), excluir: $("cb-excluir").value.trim(), remoto: $("cb-remoto").checked,
      areas: [...form.querySelectorAll('input[name="cb-area"]:checked')].map(i => i.value),
      niveis: [...form.querySelectorAll('input[name="cb-nivel"]:checked')].map(i => i.value),
    };
  }
  function renderLinks() {
    const b = C.buscaFilled || !C.cfg?.busca ? readBusca() : C.cfg.busca;
    const terms = String(b.palavras || "").split(/[,;]/).map(s => s.trim()).filter(Boolean);
    if (!terms.length) { $("cb-links").innerHTML = `<span class="c-mini">Escreva palavras-chave para gerar buscas no LinkedIn, ReliefWeb e Google.</span>`; return; }
    const loc = String(b.locais || "").split(/[,;]/)[0]?.trim() || "";
    const q = terms.slice(0, 3).map(t => /\s/.test(t) ? `"${t}"` : t).join(" OR ");
    const enc = encodeURIComponent;
    const links = [
      ["LinkedIn Vagas", `https://www.linkedin.com/jobs/search/?keywords=${enc(terms.slice(0, 3).join(" "))}${loc ? "&location=" + enc(loc) : ""}`],
      ["ReliefWeb", `https://reliefweb.int/jobs?search=${enc(terms.slice(0, 3).join(" "))}`],
      ["Google · sites da ONU", `https://www.google.com/search?q=${enc(`(${q}) (site:careers.un.org OR site:jobs.undp.org OR site:jobs.unicef.org OR site:unjobs.org OR site:impactpool.org)`)}`],
      ["Google · vagas no Brasil", `https://www.google.com/search?q=${enc(`(${q}) vaga ${loc || "Brasil"}`)}`],
    ];
    $("cb-links").innerHTML = links.map(([l, u]) => `<a class="c-link" href="${esc(u)}" target="_blank" rel="noopener"><i class="ic" data-i="ext"></i>${esc(l)}</a>`).join("");
  }
  function renderSources() {
    const seen = C.cfg?.fontes || {};
    let rows = [];
    if (C.srcFilter !== "empregadores") rows.push(...SOURCES.map(s => ({ id: s.id, nome: s.nome, url: s.url, sub: s.g, kind: "Portal" })));
    if (C.srcFilter !== "portais") rows.push(...C.employers.map(e => {
      const n = e.apps.length || C.apps.filter(a => a.employers.includes(e.id)).length;
      return { id: "e-" + e.id, nome: e.name, url: e.link, notion: e.url, sub: [e.area, n ? plural(n, "candidatura", "candidaturas") : "sem candidatura"].filter(Boolean).join(" · "), kind: "Empregador" };
    }));
    const sv = C.scout?.vistos || {}; // fontes que a varredura semanal conferiu
    rows.forEach(r => { const a = seen[r.id] || null, b = sv[r.id] || null; r.last = a && b ? (a > b ? a : b) : (a || b); r.age = r.last ? daysBetween(r.last, todayISO) : Infinity; });
    rows = rows.sort((a, b) => (b.age - a.age) || a.nome.localeCompare(b.nome));
    if (!rows.length) { $("c-sources").innerHTML = `<p class="empty">Nenhum empregador lido do Notion ainda.</p>`; return; }
    const LIMIT = 12, shown = C.srcAll ? rows : rows.slice(0, LIMIT);
    $("c-sources").innerHTML = shown.map(r => `<div class="c-srow"><span class="sn"><b>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(r.nome)}</a>` : esc(r.nome)}</b><small>${esc(r.kind)} · ${esc(r.sub)}</small></span><span class="age ${r.age === Infinity ? "never" : r.age > 14 ? "stale" : ""}">${r.last ? "visto " + sinceLabel(r.last) : "nunca visto"}</span><span class="c-row-actions">${r.url ? `<a class="c-link" href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="Abrir ${esc(r.nome)}"><i class="ic" data-i="ext"></i>Abrir</a>` : r.notion ? `<a class="c-link" href="${esc(r.notion)}" target="_blank" rel="noopener" title="Sem link de vagas: adicione a URL no Notion">Notion</a>` : ""}<button class="c-seen" data-src-seen="${esc(r.id)}" ${r.last === todayISO ? "disabled" : ""} title="${r.last === todayISO ? "Visto hoje" : "Marcar como visto hoje"}" aria-label="${r.last === todayISO ? "Visto hoje" : "Marcar " + esc(r.nome) + " como visto hoje"}">${CHECK}</button></span></div>`).join("")
      + (rows.length > LIMIT ? `<div class="c-more" style="grid-column:1/-1"><button class="btn ghost" data-src-all>${C.srcAll ? "Mostrar só as 12 menos recentes" : `Mostrar todas (${rows.length})`}</button></div>` : "");
  }

  // ---------- render: Currículo ----------
  function renderCv() {
    const cv = C.cv;
    const checks = readiness(), ok = checks.filter(c => c.ok).length;
    $("c-cv-ready").innerHTML = `<div class="c-ready-top"><b>${ok}/${checks.length}</b><span class="c-mini">itens atendidos</span></div><div class="track"><i style="width:${Math.round(ok / checks.length * 100)}%"></i></div>`
      + checks.map(c => `<div class="c-ck${c.ok ? " ok" : ""}"><span class="m">${CHECK}</span><span class="t">${esc(c.t)}<small>${esc(c.s)}</small></span></div>`).join("")
      + (C.dbReady ? "" : `<p class="c-note">O currículo fica no banco do app e só pode ser editado depois que você entra.</p>`);
    renderElig();
    const p = cv.perfil || {};
    $("c-cv-perfil").innerHTML = `<div class="card-head"><div><h3 data-i="user">Perfil</h3><p class="hint">Cabeçalho e resumo que abrem o currículo.</p></div><button class="btn" data-cv-perfil>${p.nome || p.titulo ? "Editar" : "Preencher"}</button></div>`
      + (p.nome || p.titulo || p.resumo ? `<div class="c-profile">${p.nome ? `<span class="pn">${esc(p.nome)}</span>` : ""}${p.titulo ? `<span class="pt">${esc(p.titulo)}</span>` : ""}${p.resumo ? `<p>${esc(p.resumo)}</p>` : ""}<span class="pc">${[p.local, p.email, p.linkedin, p.site].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}</span></div>` : `<p class="empty">Sem perfil. Comece pelo título profissional e por um resumo de três ou quatro linhas.</p>`)
      + `<div class="c-sec"><p class="c-label">Habilidades técnicas</p>${(cv.habilidades || []).length ? `<div class="c-tags">${cv.habilidades.map(h => `<span class="c-tag">${esc(h)}</span>`).join("")}</div>` : `<p class="c-note">Ferramentas e métodos (ex.: Excel avançado, análise qualitativa, Power BI).</p>`}</div>`;
    $("c-cv-exp").innerHTML = cvSection("briefcase", "Experiência", "Trabalho, estágios, voluntariado, pesquisa e consultorias, com o que você entregou em cada um.", "exp",
      sortExp(cv.experiencias).map(e => {
        const per = `${ymLabel(e.inicio) || "início?"} – ${e.atual ? "atual" : ymLabel(e.fim) || "fim?"}`;
        const warn = !e.inicio ? "Falta o início" : (e.realizacoes || []).length < 2 ? "Adicione realizações" : "";
        return cvItem("exp", e.id, `${e.cargo || "(cargo)"} · ${e.org || "(organização)"}`, [per, e.tipo, e.local, Number(e.dedicacao) && Number(e.dedicacao) < 100 ? `${e.dedicacao}%` : "", e.campo ? "campo" : "", e.conta === false ? "fora da elegibilidade" : ""].filter(Boolean).join(" · "),
          `${(e.realizacoes || []).length ? `<ul>${e.realizacoes.slice(0, 4).map(b => `<li>${esc(b)}</li>`).join("")}${e.realizacoes.length > 4 ? `<li>+${e.realizacoes.length - 4}</li>` : ""}</ul>` : ""}${(e.competencias || []).length ? `<div class="c-tags">${e.competencias.map(compChip).join("")}</div>` : ""}${warn ? `<span class="warnline">${warn}</span>` : ""}`);
      }), "Nenhuma experiência registrada.");
    $("c-cv-edu").innerHTML = cvSection("school", "Formação", "Graduação, pós-graduação e cursos técnicos. Só a formação concluída conta na elegibilidade.", "edu",
      (cv.educacao || []).slice().sort((a, b) => String(b.fim || b.inicio || "").localeCompare(String(a.fim || a.inicio || ""))).map(e => cvItem("edu", e.id, `${e.nivel ? e.nivel + " · " : ""}${e.curso || "(curso)"}`, [e.instituicao, [ymLabel(e.inicio), ymLabel(e.fim)].filter(Boolean).join(" – "), e.status || "Concluído"].filter(Boolean).join(" · "), e.tese ? `<span class="im">Tese/TCC: ${esc(e.tese)}</span>` : "")), "Nenhuma formação registrada.");
    $("c-cv-lang").innerHTML = cvSection("globe", "Idiomas", "Nível pelo Quadro Europeu (A1 a C2). Inglês, francês, espanhol, árabe, chinês e russo são idiomas oficiais da ONU.", "lang",
      (cv.idiomas || []).map(l => cvItem("lang", l.id, `${l.idioma || "(idioma)"} · ${l.nivel || "nível?"}`, [UN_LANGS[normName(l.idioma)] ? "idioma oficial da ONU" : "", l.certificado].filter(Boolean).join(" · "), "")), "Nenhum idioma registrado.");
    $("c-cv-cert").innerHTML = cvSection("award", "Certificações e cursos", "Certificados, cursos e programas concluídos.", "cert",
      (cv.certificacoes || []).slice().sort((a, b) => String(b.data || "").localeCompare(String(a.data || ""))).map(c => cvItem("cert", c.id, c.nome || "(nome)", [c.instituicao, ymLabel(c.data)].filter(Boolean).join(" · "), `${safeUrl(c.link) ? `<a class="c-link" href="${esc(c.link)}" target="_blank" rel="noopener"><i class="ic" data-i="ext"></i>Credencial</a>` : ""}${(c.competencias || []).length ? `<div class="c-tags">${c.competencias.map(compChip).join("")}</div>` : ""}`)), "Nenhuma certificação registrada.");
    $("c-cv-pub").innerHTML = cvSection("book", "Publicações e pesquisa", "Artigos, capítulos, relatórios e apresentações.", "pub",
      (cv.publicacoes || []).slice().sort((a, b) => String(b.ano || "").localeCompare(String(a.ano || ""))).map(p2 => cvItem("pub", p2.id, p2.titulo || "(título)", [p2.tipo, p2.veiculo, p2.ano].filter(Boolean).join(" · "), safeUrl(p2.link) ? `<a class="c-link" href="${esc(p2.link)}" target="_blank" rel="noopener"><i class="ic" data-i="ext"></i>Link</a>` : "")), "Nenhuma publicação registrada.")
      + `<div class="c-sec"><p class="c-label">Outros destaques</p>${cv.outros ? `<p class="c-note" style="color:var(--ink-2)">${esc(cv.outros)}</p>` : `<p class="c-note">Prêmios, bolsas, representação estudantil, redes como Global Shapers.</p>`}<div><button class="btn ghost" data-cv-outros>Editar destaques</button></div></div>`;
    $("c-cv-md").textContent = cvText(60000) || "O currículo está vazio. Preencha as seções acima ou importe o texto com o Claude.";
  }
  function cvSection(icon, title, hint, sec, items, empty) {
    return `<div class="card-head"><div><h3 data-i="${icon}">${esc(title)}</h3><p class="hint">${esc(hint)}</p></div><button class="btn" data-cv-add="${sec}"><i class="ic" data-i="plus"></i>Adicionar</button></div>`
      + (items.length ? `<div class="c-items">${items.join("")}</div>` : `<p class="empty">${esc(empty)}</p>`);
  }
  function cvItem(sec, id, title, meta, extra) {
    return `<div class="c-item"><div class="it"><b>${esc(title)}</b>${meta ? `<span class="im">${esc(meta)}</span>` : ""}${extra || ""}</div><div class="c-row-actions"><button class="btn ghost" data-cv-edit="${sec}" data-id="${esc(id)}">Editar</button></div></div>`;
  }
  function renderElig() {
    const yrs = experienceYears(), tier = degreeTier(), langs = unLanguages();
    const tierL = tier === "mestrado" ? "Mestrado ou superior" : tier === "graduacao" ? "Graduação" : "Sem graduação concluída";
    const col = tier === "mestrado" ? 1 : 3;
    const status = need => yrs >= need ? `<span class="st c-good">Elegível</span>` : `<span class="st c-warn">Faltam ${n1(need - yrs)} ${need - yrs >= 1.95 ? "anos" : "ano"}</span>`;
    const pRows = ELIG_P.map(r => `<tr><td>${r[0]}</td><td>${r[1]} anos com mestrado · ${r[3]} com graduação</td><td>${tier ? status(r[col]) : `<span class="st c-mini">Exige graduação</span>`}</td></tr>`).join("");
    const noRows = ELIG_NO.map(r => `<tr><td>${r[0]}</td><td>${r[0] === "NO-A" ? "1 a 2 anos" : r[0] === "NO-B" ? "2 a 3 anos" : `mínimo de ${r[1]} anos`}</td><td>${tier ? status(r[1]) : `<span class="st c-mini">Exige graduação</span>`}</td></tr>`).join("");
    $("c-elig").innerHTML = `<div class="c-elig-sum"><span>Formação: <b>${tierL}</b></span><span>Experiência contada: <b>${n1(yrs)} ${yrs >= 1.95 || yrs === 0 ? "anos" : "ano"}</b></span><span>Idiomas da ONU em B2 ou acima: <b>${langs.length ? esc(langs.join(", ")) : "nenhum"}</b></span></div>
      <div class="table-wrap" style="margin-inline:0;padding-inline:0"><table class="c-elig"><thead><tr><th>Nível</th><th>Requisito (notas da Mentoria)</th><th>Situação</th></tr></thead><tbody>${pRows}${noRows}</tbody></table></div>
      <p class="c-note">A experiência soma os períodos marcados para contar, sem dobrar sobreposições, ponderados pela dedicação. Algumas agências só contam experiência posterior à graduação; desmarque as que não valem. NO são vagas para nacionais do país do posto. Confira sempre o requisito do anúncio.</p>`;
  }

  // ---------- render: Skill Development ----------
  function renderSkills() {
    document.querySelectorAll("#c-sk-seg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === C.skv)));
    ["mapa", "historias", "plano", "metodo"].forEach(v => { $("c-sk-" + v).hidden = v !== C.skv; });
    $("c-fw-note").textContent = C.fwErr ? "Não consegui carregar a referência das competências (definições, níveis e perguntas)." : C.fw ? "" : "Carregando a referência das competências…";
    if (C.skv === "mapa") renderMap();
    else if (C.skv === "historias") renderStories();
    else if (C.skv === "plano") renderPlan();
  }
  function renderMap() {
    const rc = ratedComps(), withEv = rc.filter(c => (evidenceOf(c.key) ?? 0) >= 3).length;
    const rated = rc.filter(c => c.rating !== null), avg = rated.length ? rated.reduce((s, c) => s + c.rating, 0) / rated.length : null;
    const covered = new Set(C.stories.flatMap(s => s.competencias || [])).size;
    const openAct = C.devtasks.filter(t => !t.done && t.comps.length).length + C.courses.filter(c => !c.done && c.comps.length).length;
    const recent = C.treinos.filter(t => t.data && daysBetween(String(t.data).slice(0, 10), todayISO) <= 30);
    const scored = recent.map(t => forcaNum(t.nota)).filter(n => n !== null);
    $("c-sk-kpis").innerHTML =
      kpi("check", "Com evidência ≥ 3", `${withEv} de ${rc.length || 21}`, "Histórias com nota Acceptable ou mais") +
      kpi("book", "Histórias no banco", C.stories.length, `${plural(covered, "competência coberta", "competências cobertas")}`) +
      kpi("tasks", "Ações em aberto", openAct, "Tarefas e cursos ligados a competências") +
      kpi("gauge", "Autoavaliação média", avg === null ? "—" : n1(avg), rated.length ? `Rating do Notion, escala 0 a 10` : "Sem notas no Notion") +
      kpi("chat", "Treinos em 30 dias", recent.length, scored.length ? `Nota média ${n1(scored.reduce((s, n) => s + n, 0) / scored.length)}` : "Nenhum treino avaliado");
    if (!C.comps.length) { $("c-matrix").innerHTML = `<p class="empty">As competências aparecem depois da leitura do Notion.</p>`; }
    else {
      const head = `<div class="c-mh"><span>Competência</span><span>Autoavaliação</span><span>Evidência</span><span>Histórias</span><span>Ações</span><span>Demanda</span></div>`;
      const pri = new Set(priorities().filter(p => p.dm.active).map(p => p.c.key));
      const rows = g => compsOf(g).map(c => {
        const ev = evidenceOf(c.key), ns = storiesOf(c.key).length, na = openActionsCount(c), dm = demandOf(c.key);
        return `<button class="c-comp" data-comp="${esc(c.key)}"><span class="cn">${pri.has(c.key) ? `<i class="pri" title="Prioridade: pedida por vaga em andamento"></i>` : ""}${esc(c.name)}</span><span class="c-rate">${g === "valor" ? `<span class="c-mini">sem nota</span><b class="na"></b>` : `<span class="track"><i style="width:${c.rating === null ? 0 : Math.max(0, Math.min(10, c.rating)) * 10}%"></i></span><b class="${c.rating === null ? "na" : ""}">${c.rating === null ? "—" : n1(c.rating)}</b>`}</span>${evChip(ev)}<span class="cnum${ns ? "" : " z"}">${ns}</span><span class="cnum${na ? "" : " z"}">${na}</span><span class="cnum${dm.all ? "" : " z"}">${dm.all ? plural(dm.all, "vaga", "vagas") : "—"}</span></button>`;
      }).join("");
      $("c-matrix").innerHTML = head + GROUPS.map(([g, l]) => compsOf(g).length ? `<div class="c-grp">${l}<small>${g === "valor" ? "base de tudo; o painel só registra a falta" : plural(compsOf(g).length, "competência", "competências")}</small></div>${rows(g)}` : "").join("");
    }
    const pr = priorities().slice(0, 6);
    $("c-prio").innerHTML = pr.length ? pr.map(p => `<div class="c-pr"><span class="pt"><b>${esc(p.c.name)}</b><small>${esc(p.why)}</small></span><span class="c-row-actions"><button class="btn ghost" data-story-new="${esc(p.c.key)}">História</button><button class="btn ghost" data-comp="${esc(p.c.key)}">Abrir</button></span></div>`).join("")
      : `<p class="empty">${C.stories.length ? "Nenhuma prioridade: as competências pedidas nas vagas analisadas já têm evidência 3 ou mais." : "Analise uma vaga no Job Hunt ou registre histórias para ver prioridades."}</p>`;
    const last = C.treinos.slice(0, 4);
    $("c-train-sum").innerHTML = last.length ? `<div class="c-attempts">${last.map(t => `<div class="c-att"><span class="ad">${t.data ? ddmm(String(t.data).slice(0, 10)) : ""}</span><span class="aq">${esc(compName(t.key))} · ${esc(t.pergunta || "")}</span>${evChip(forcaNum(t.nota))}</div>`).join("")}</div>` : `<p class="empty">Nenhum treino ainda.</p>`;
  }
  function renderStories() {
    const sel = $("c-st-filter");
    if (sel.options.length <= 1 && C.comps.length) sel.innerHTML = `<option value="">Todas as competências</option>` + GROUPS.map(([g, l]) => compsOf(g).length ? `<optgroup label="${l}">${compsOf(g).map(c => `<option value="${esc(c.key)}">${esc(c.name)}</option>`).join("")}</optgroup>` : "").join("");
    sel.value = C.stFilter;
    const list = C.stories.filter(s => !C.stFilter || (s.competencias || []).includes(C.stFilter)).sort((a, b) => String(b.atualizado || "").localeCompare(String(a.atualizado || "")));
    if (!C.dbReady) { $("c-stories").innerHTML = `<p class="empty">O banco de histórias fica no banco do app e aparece depois que você entra.</p>`; return; }
    if (!list.length) { $("c-stories").innerHTML = `<p class="empty">${C.stFilter ? "Nenhuma história para esta competência." : "Nenhuma história ainda. Escreva a primeira ou peça sugestões a partir do currículo."}</p>`; return; }
    $("c-stories").innerHTML = list.map(s => {
      const ks = s.competencias || [];
      const best = Math.max(-1, ...ks.map(k => forcaNum(s.forca?.[k]) ?? -1));
      const exp = (C.cv.experiencias || []).find(e => e.id === s.experiencia);
      return `<button class="c-story" data-story="${esc(s.id)}"><span class="st-t">${esc(s.titulo || "(sem título)")}</span><span class="st-x">${esc(clip(s.acao || s.contexto, 260))}</span><span class="c-tags">${ks.map(k => `<span class="c-tag">${esc(compName(k))}</span>`).join("")}</span><span class="st-m">${evChip(best < 0 ? null : best)}${exp ? `<span>${esc(exp.cargo || "")}${exp.org ? " · " + esc(exp.org) : ""}</span>` : ""}${s.atualizado ? `<span>${ddmm(String(s.atualizado).slice(0, 10))}</span>` : ""}</span></button>`;
    }).join("");
  }
  function renderPlan() {
    const goalTasks = C.devtasks.filter(t => t.comps.length || t.goal === GOAL_ID);
    const open = goalTasks.filter(t => !t.done).sort((a, b) => String(a.eta || "9999").localeCompare(String(b.eta || "9999")));
    const doneT = goalTasks.filter(t => t.done).sort((a, b) => String(b.eta || "").localeCompare(String(a.eta || ""))).slice(0, 6);
    const opts = `<option value="">Vincular a…</option>` + GROUPS.filter(g => g[0] !== "valor").map(([g, l]) => `<optgroup label="${l}">${compsOf(g).filter(c => c.notion).map(c => `<option value="${esc(c.key)}">${esc(c.name)}</option>`).join("")}</optgroup>`).join("");
    const row = t => {
      const keys = C.comps.filter(c => t.comps.includes(c.id)).map(c => c.key);
      const late = !t.done && t.eta && t.eta < todayISO;
      return `<div class="task${t.done ? " done" : ""}${C.busy.has(t.id) ? " busy" : ""}" style="grid-template-columns:26px minmax(0,1fr) auto"><button class="tchk" data-devtask="${t.id}" aria-label="${t.done ? "Reabrir" : "Concluir"} ${esc(t.name)}">${CHECK}</button><span class="tn" style="white-space:normal"><a href="${esc(t.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(t.name)}</a>${keys.length ? `<span class="c-tags" style="margin-top:3px">${keys.map(compChip).join("")}</span>` : t.done ? "" : `<select class="g-link" data-link-task="${t.id}" aria-label="Vincular a uma competência" style="margin-top:4px;font-size:12.5px;padding:3px 6px">${opts}</select>`}</span><span class="td${late ? " late" : ""}">${t.eta ? ddmm(t.eta) : ""}</span></div>`;
    };
    $("c-dev").innerHTML = (open.length ? open.map(row).join("") : `<p class="empty">${C.loadedAt ? "Nenhuma ação aberta ligada a competências ou à meta." : "As tarefas do Notion aparecem aqui."}</p>`)
      + (doneT.length ? `<p class="c-label" style="margin-top:14px">Concluídas recentes</p>${doneT.map(row).join("")}` : "");
    const noplan = ratedComps().filter(c => (evidenceOf(c.key) ?? 0) < 3 && openActionsCount(c) === 0);
    $("c-noplan").innerHTML = noplan.length ? noplan.slice(0, 10).map(c => `<div class="c-pr"><span class="pt"><b>${esc(c.name)}</b><small>${GROUP_L[c.grupo]} · evidência ${evidenceOf(c.key) === null ? "nenhuma" : evidenceOf(c.key) === 0 ? "NE" : evidenceOf(c.key)}</small></span><button class="btn ghost" data-act-new="${esc(c.key)}">Criar ação</button></div>`).join("") + (noplan.length > 10 ? `<p class="c-note">E mais ${noplan.length - 10}.</p>` : "")
      : `<p class="empty">Todas as competências têm evidência 3 ou uma ação aberta.</p>`;
    $("c-skillmon").innerHTML = C.skills.length ? C.skills.map(s => `<div class="c-item"><div class="it"><b>${esc(s.name)}</b><a class="c-link" href="${esc(s.url)}" target="_blank" rel="noopener">Abrir no Notion</a></div><select data-skill-st="${s.id}" aria-label="Status de ${esc(s.name)}">${SKILL_ST.map(([k, l]) => `<option value="${k}"${k === s.status ? " selected" : ""}>${l}</option>`).join("")}</select></div>`).join("") : `<p class="empty">Nenhuma habilidade técnica lida do Notion.</p>`;
    const ORD = { "Em andamento": 0, "Não começou": 1, "Pronto": 2 };
    const courses = C.courses.slice().sort((a, b) => (ORD[a.status] ?? 1) - (ORD[b.status] ?? 1) || a.name.localeCompare(b.name));
    $("c-courses").innerHTML = courses.length ? courses.map(c => {
      const keys = C.comps.filter(x => c.comps.includes(x.id)).map(x => x.key);
      return `<div class="c-item${C.busy.has(c.id) ? " busy" : ""}"><div class="it"><b>${c.link ? `<a href="${esc(c.link)}" target="_blank" rel="noopener" style="color:inherit">${esc(c.name)}</a>` : esc(c.name)}</b><span class="im">${esc([c.uni, ...c.platform, ...c.tags].filter(Boolean).join(" · "))}</span>${keys.length ? `<div class="c-tags">${keys.map(compChip).join("")}</div>` : ""}</div><select data-course-st="${c.id}" aria-label="Status de ${esc(c.name)}">${COURSE_ST.map(s => `<option${s === c.status ? " selected" : ""}>${s}</option>`).join("")}</select></div>`;
    }).join("") : `<p class="empty">Nenhum curso lido do Notion.</p>`;
  }

  function render() {
    if (!C.started) return;
    document.querySelectorAll("[data-csub]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.csub === C.sub)));
    $("cp-hunt").hidden = C.sub !== "hunt"; $("cp-cv").hidden = C.sub !== "cv"; $("cp-skills").hidden = C.sub !== "skills";
    $("c-hunt-count").textContent = C.apps.length ? String(C.apps.filter(a => a.status !== "Done").length) : "";
    if (C.sub === "hunt") renderHunt(); else if (C.sub === "cv") renderCv(); else renderSkills();
  }

  // ---------- modal ----------
  let lastFocus = null;
  function openModal(html, state) {
    lastFocus = document.activeElement;
    C.modal = state;
    $("c-modal-box").innerHTML = html;
    $("c-modal").hidden = false;
    refreshModal();
    const f = $("c-modal-box").querySelector("[autofocus], input:not([type=hidden]), textarea, select, button");
    if (f) try { f.focus({ preventScroll: true }); } catch { f.focus(); }
  }
  function closeModal() {
    if (C.modal?.ctl) try { C.modal.ctl.abort(); } catch { /* nada */ }
    C.modal = null; $("c-modal").hidden = true; $("c-modal-box").innerHTML = "";
    if (lastFocus && document.contains(lastFocus)) try { lastFocus.focus({ preventScroll: true }); } catch { /* nada */ }
  }
  const mhead = (title, sub) => `<div class="modal-head"><h3 id="c-modal-title">${esc(title)}</h3><button class="btn ghost" type="button" data-close>Fechar</button></div>${sub ? `<div class="c-sub">${sub}</div>` : ""}`;
  function refreshModal() {
    const m = C.modal;
    if (!m) return;
    if (m.type === "app") { const a = appBy(m.id); if (a) { renderAppTasks(a); renderAppAnalysis(a); } }
    else if (m.type === "comp") renderCompLive(m.id);
  }

  // ----- vaga -----
  function openApp(id) {
    const a = appBy(id);
    if (!a) return;
    const d = C.dossies[a.id] || {};
    const orgs = appOrgs(a);
    const sub = `<label class="field" style="flex-direction:row;align-items:center;gap:8px" for="cm-status">Etapa <select id="cm-status" data-app-status="${a.id}">${APP_ST.map(s => `<option value="${s.k}"${s.k === a.status ? " selected" : ""}>${s.l}</option>`).join("")}</select></label>`
      + (orgs.length ? `<span>${orgs.map(e => e.link ? `<a class="c-link" href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.name)}</a>` : esc(e.name)).join(", ")}</span>` : "")
      + (a.date ? `<span>${a.status === "Not Applied" ? "Prazo" : "Data"} ${ddmm(a.date)}/${a.date.slice(0, 4)}</span>` : "")
      + (a.platform ? `<span>${esc(a.platform)}</span>` : "")
      + (a.link ? `<a class="c-link" href="${esc(a.link)}" target="_blank" rel="noopener"><i class="ic" data-i="ext"></i>Anúncio</a>` : "")
      + `<a class="c-link" href="${esc(a.url)}" target="_blank" rel="noopener"><i class="ic" data-i="ext"></i>Notion</a>`;
    const lang = (C.cfg && C.cfg.idiomaDoc) || "o idioma do anúncio";
    openModal(mhead(a.name, sub) + `
      <div class="c-grid2">
        <div class="c-box"><h4><i class="ic" data-i="tasks"></i>Tarefas</h4><div id="cm-tasks" class="tasklist"></div>
          <form class="inline-form" id="cm-task-form" data-app="${a.id}"><label class="field" for="cm-task-name" style="flex:1;min-width:150px">Nova tarefa<input id="cm-task-name" type="text" placeholder="Ex.: revisar a carta"></label><label class="field" for="cm-task-date">Data<input id="cm-task-date" type="date"></label><button class="btn" type="submit">Adicionar</button></form>
          <p class="c-msg" id="cm-task-msg" hidden></p>
          <div class="c-actions c-ai-only"><button class="btn" data-plan-app="${a.id}"><i class="ic" data-i="spark"></i>Gerar tarefas com o Claude</button><span class="c-note">Lê a descrição abaixo ou o link do anúncio.</span></div>
          <p class="c-msg" id="cm-plan-msg" hidden></p></div>
        <div class="c-box"><h4><i class="ic" data-i="flag"></i>Andamento</h4>
          <label class="field" for="cm-res">Resultado do processo<select id="cm-res" data-app-res="${a.id}">${RESULTADOS.map(r => `<option value="${esc(r)}"${(d.resultado || "") === r ? " selected" : ""}>${r || "Ainda sem resultado"}</option>`).join("")}</select></label>
          <label class="field" for="cm-notas">Notas (contatos, recrutador, próximos passos)<textarea id="cm-notas" data-app-notas="${a.id}" rows="4">${esc(d.notas || "")}</textarea></label>
          <p class="c-note">Resultado e notas ficam no banco do painel; a etapa vai para o Notion.</p></div>
      </div>
      ${d.plano?.etapas?.length ? `<div class="c-box"><h4><i class="ic" data-i="flag"></i>Etapas do processo seletivo</h4>${d.plano.contexto ? `<p class="c-note">${esc(d.plano.contexto)}</p>` : ""}${stepsHtml(d.plano.etapas)}</div>` : ""}
      <div class="c-box"><h4><i class="ic" data-i="file"></i>Descrição da vaga</h4>
        <label class="field" for="cm-jd">Cole o texto completo do anúncio (responsabilidades, requisitos e competências)<textarea id="cm-jd" class="c-ta tall" data-app-jd="${a.id}">${esc(d.jd || "")}</textarea></label>
        <div class="c-actions"><button class="btn c-ai-only" id="cm-analyze" data-analyze="${a.id}"><i class="ic" data-i="spark"></i>Analisar aderência</button><span class="c-note">O Claude compara o anúncio com o seu currículo e o banco de histórias.</span></div>
        <p class="c-msg" id="cm-an-msg" hidden></p>
        <div id="cm-analysis"></div></div>
      <div class="c-box c-ai-only"><h4><i class="ic" data-i="spark"></i>CV e carta adaptados</h4>
        <div class="c-actions"><label class="field" for="cm-lang" style="flex-direction:row;align-items:center;gap:8px">Idioma<select id="cm-lang">${["o idioma do anúncio", "inglês", "português", "espanhol", "francês"].map(l => `<option${l === lang ? " selected" : ""}>${l}</option>`).join("")}</select></label>
          <button class="btn" data-gen="cv" data-app="${a.id}">Gerar CV</button><button class="btn" data-gen="carta" data-app="${a.id}">Gerar carta</button></div>
        <p class="c-msg" id="cm-gen-msg" hidden></p>
        <div class="seg" id="cm-doc-seg" role="group" aria-label="Documento"><button data-doc="cv" aria-pressed="true">CV</button><button data-doc="carta" aria-pressed="false">Carta</button></div>
        <textarea id="cm-doc" class="c-ta doc" data-app-doc="${a.id}" data-doc="cv" aria-label="Documento gerado">${esc(d.cv || "")}</textarea>
        <div class="c-actions"><button class="btn" data-doc-copy>Copiar</button><button class="btn" data-doc-notion="${a.id}">Salvar no Notion</button><span class="c-note">Revise antes de enviar: trechos marcados [COMPLETAR] pedem dados que o currículo não tem.</span></div></div>`, { type: "app", id: a.id });
  }
  function renderAppTasks(a) {
    const el = $("cm-tasks");
    if (!el) return;
    const list = tasksOf(a).sort((x, y) => (x.done - y.done) || String(x.due || "9999").localeCompare(String(y.due || "9999")));
    el.innerHTML = list.length ? list.map(t => `<div class="task${t.done ? " done" : ""}${C.busy.has(t.id) ? " busy" : ""}"><button class="tchk" data-jtask="${t.id}" aria-label="${t.done ? "Reabrir" : "Concluir"} ${esc(t.name)}">${CHECK}</button><span class="tn"><a href="${esc(t.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(t.name)}</a></span><span class="td ${!t.done ? dateClass(t.due) : ""}">${t.due ? ddmm(t.due) : ""}</span></div>`).join("") : `<p class="empty">Nenhuma tarefa ligada a esta vaga no Job Tasks.</p>`;
  }
  function renderAppAnalysis(a) {
    const el = $("cm-analysis");
    if (!el || el.dataset.busy) return;
    const an = C.dossies[a.id]?.analise;
    if (!an) { el.innerHTML = ""; return; }
    const sc = scoreOf(an);
    const mark = r => r.atende === "sim" ? `<span class="rs c-good">✓ Atende</span>` : r.atende === "parcial" ? `<span class="rs c-warn">~ Parcial</span>` : `<span class="rs c-bad">✗ Falta</span>`;
    const st = id => C.stories.find(s => s.id === id);
    el.innerHTML = `<div class="c-ai">
      <div class="c-score"><b>${sc === null ? "—" : sc + "%"}</b><span>aderência aos requisitos${an.nivel ? ` · nível ${esc(an.nivel)}` : ""}</span><span class="c-claude"><i class="ic" data-i="spark"></i>Claude</span></div>
      ${an.resumo ? `<p>${esc(an.resumo)}</p>` : ""}
      ${(an.requisitos || []).length ? `<h5>Requisitos</h5><div class="c-reqs">${an.requisitos.map(r => `<div class="c-req">${mark(r)}<span class="rt"><b>${esc(r.item)}</b><small>${esc([r.tipo, r.evidencia].filter(Boolean).join(" · "))}</small></span></div>`).join("")}</div>` : ""}
      ${(an.competencias || []).length ? `<h5>Competências que a vaga pede</h5><div class="c-tags">${an.competencias.filter(c => c && compBy(c.key)).map(c => `<button type="button" class="c-tag" data-comp="${esc(c.key)}" title="${esc(c.motivo || "")}">${esc(compName(c.key))} · ${evidenceOf(c.key) === null ? "sem história" : "evidência " + (evidenceOf(c.key) || "NE")}</button>`).join("")}</div>` : ""}
      ${(an.lacunas || []).length ? `<h5>Lacunas e o que fazer</h5><ul>${an.lacunas.map(l => `<li><b>${esc(l.lacuna)}</b>${l.acao ? ` — ${esc(l.acao)}` : ""}</li>`).join("")}</ul>` : ""}
      ${(an.perguntas || []).length ? `<h5>Perguntas prováveis na entrevista</h5><div class="c-qs">${an.perguntas.map((q, i) => { const s = q.historia ? st(q.historia) : null; return `<div class="c-q"><b>${esc(q.pergunta)}</b><span class="c-mini">${esc(compName(q.key))} · ${s ? `responda com a história “${esc(s.titulo)}”` : "nenhuma história do banco serve ainda"}</span><div class="c-row-actions"><button class="btn ghost c-ai-only" data-train="${esc(q.key)}" data-q="${esc(q.pergunta)}">Treinar resposta</button>${s ? `<button class="btn ghost" data-story="${esc(s.id)}">Ver história</button>` : `<button class="btn ghost" data-story-new="${esc(q.key)}">Escrever história</button>`}</div></div>`; }).join("")}</div>` : ""}
      ${(an.palavrasChave || []).length ? `<h5>Palavras-chave do anúncio</h5><div class="c-tags">${an.palavrasChave.map(k => `<span class="c-tag">${esc(k)}</span>`).join("")}</div>` : ""}
      <span class="c-mini">Analisado em ${an.data ? ddmm(an.data.slice(0, 10)) : "—"}. A nota é calculada pelo painel: requisito obrigatório vale 2, desejável vale 1; parcial conta metade.</span>
    </div>`;
  }
  async function analyzeApp(a, btn) {
    const jd = ($("cm-jd")?.value || "").trim();
    const msg = $("cm-an-msg");
    if (jd.length < 80) { showMsg(msg, "Cole o texto do anúncio (pelo menos algumas linhas) antes de analisar."); return; }
    saveDossie(a.id, { jd });
    const el = $("cm-analysis");
    await withClaude(btn, msg, async sample => {
      if (el) { el.dataset.busy = "1"; el.innerHTML = `<div class="c-ai"><span class="c-thinking">O Claude está lendo o anúncio e o seu currículo. Isso leva de 20 a 60 segundos.</span></div>`; }
      const prompt = `Você é um recrutador experiente em organizações internacionais (sistema ONU, ONGs e organismos multilaterais) e conhece a entrevista por competências (competency-based interview).
Compare a VAGA com o CURRÍCULO e o BANCO DE HISTÓRIAS do candidato.
${RULE}
Responda somente com um objeto JSON neste formato:
{"nivel": string, "resumo": string, "requisitos": [{"item": string, "tipo": "obrigatório" ou "desejável", "atende": "sim" ou "parcial" ou "não", "evidencia": string}], "competencias": [{"key": string, "motivo": string}], "lacunas": [{"lacuna": string, "acao": string}], "perguntas": [{"key": string, "pergunta": string, "historia": string ou null}], "palavrasChave": [string]}
- "nivel": o nível ou tipo de contrato da vaga (ex.: Intern, P-2, NO-A, Consultant, Analista). Use "" se o anúncio não disser.
- "resumo": 2 ou 3 frases em português sobre a aderência, citando o ponto mais forte e a maior lacuna.
- "requisitos": de 5 a 12 itens, só os que o anúncio pede (formação, anos de experiência, idiomas, conhecimentos técnicos). "evidencia" diz em uma frase curta onde o requisito aparece no currículo ou o que falta.
- "competencias": de 3 a 6, usando apenas chaves da lista COMPETÊNCIAS; "motivo" cita o trecho ou a razão no anúncio.
- "lacunas": até 5, com uma ação concreta e realista para cada uma.
- "perguntas": de 3 a 5 perguntas prováveis de entrevista por competências, em inglês, no estilo "Tell me about a time when...", uma por competência mais importante; "historia" é o id (entre colchetes no banco) da história que melhor responde, ou null.
- "palavrasChave": até 12 termos do anúncio que devem aparecer no CV quando forem verdadeiros.

COMPETÊNCIAS (chave — nome — grupo):
${compCatalog()}

PERFIL DE BUSCA DO CANDIDATO:
${buscaText()}

VAGA: ${a.name}${appOrgText(a) ? " — " + appOrgText(a) : ""}
${jd.slice(0, 20000)}

CURRÍCULO:
${cvText(14000) || "(currículo vazio)"}

BANCO DE HISTÓRIAS:
${storiesDigest(7000)}`;
      try {
        const out = await sample.json(prompt);
        if (!out || typeof out !== "object" || Array.isArray(out)) throw { code: "invalid_json" };
        const an = {
          nivel: String(out.nivel || ""), resumo: String(out.resumo || ""),
          requisitos: (Array.isArray(out.requisitos) ? out.requisitos : []).filter(r => r && r.item).map(r => ({ item: String(r.item), tipo: String(r.tipo || ""), atende: ["sim", "parcial", "não", "nao"].includes(r.atende) ? (r.atende === "nao" ? "não" : r.atende) : "não", evidencia: String(r.evidencia || "") })).slice(0, 14),
          competencias: (Array.isArray(out.competencias) ? out.competencias : []).filter(c => c && compBy(String(c.key))).map(c => ({ key: String(c.key), motivo: String(c.motivo || "") })).slice(0, 8),
          lacunas: (Array.isArray(out.lacunas) ? out.lacunas : []).filter(l => l && l.lacuna).map(l => ({ lacuna: String(l.lacuna), acao: String(l.acao || "") })).slice(0, 6),
          perguntas: (Array.isArray(out.perguntas) ? out.perguntas : []).filter(q => q && q.pergunta && compBy(String(q.key))).map(q => ({ key: String(q.key), pergunta: String(q.pergunta), historia: C.stories.some(s => s.id === q.historia) ? q.historia : null })).slice(0, 6),
          palavrasChave: (Array.isArray(out.palavrasChave) ? out.palavrasChave : []).map(String).slice(0, 14),
          data: new Date().toISOString(),
        };
        await saveDossie(a.id, { jd, analise: an });
      } finally { if (el) delete el.dataset.busy; if (C.modal?.id === a.id) renderAppAnalysis(a); }
    });
  }
  async function generateDoc(a, kind, btn) {
    const d = C.dossies[a.id] || {};
    const jd = ($("cm-jd")?.value || d.jd || "").trim();
    const msg = $("cm-gen-msg");
    if (jd.length < 80) { showMsg(msg, "Cole a descrição da vaga acima antes de gerar o documento."); return; }
    if (!cvText(100)) { showMsg(msg, "O currículo está vazio. Preencha a aba Currículo primeiro."); return; }
    const lang = $("cm-lang")?.value || "o idioma do anúncio";
    if (C.cfg?.idiomaDoc !== lang && C.dbReady) saveCfg({ idiomaDoc: lang });
    setDocTab(kind);
    const ta = $("cm-doc");
    const an = d.analise;
    const ctx = `VAGA: ${a.name}${appOrgText(a) ? " — " + appOrgText(a) : ""}
${jd.slice(0, 16000)}
${an ? `\nANÁLISE PRÉVIA: requisitos ${an.requisitos.map(r => `${r.item} (${r.atende})`).join("; ")}. Palavras-chave: ${an.palavrasChave.join(", ")}.` : ""}

CURRÍCULO:
${cvText(14000)}

BANCO DE HISTÓRIAS:
${storiesDigest(6000)}`;
    const prompt = kind === "cv"
      ? `Escreva um currículo adaptado para a vaga abaixo, em ${lang}. Formato: Markdown simples (títulos com ##, listas com -), sem tabelas.
${RULE}
Estrutura: nome e contatos numa linha; resumo profissional de 3 linhas alinhado à vaga; experiência em ordem cronológica inversa com 2 a 5 bullets por cargo (verbo de ação + o que fez + resultado), priorizando o que a vaga pede; formação; idiomas com nível; certificações; habilidades. No máximo duas páginas. Sem foto, data de nascimento, estado civil ou gênero.
Use as palavras-chave da vaga somente quando corresponderem a algo real do currículo. Responda apenas com o currículo.

${ctx}`
      : `Escreva uma carta de motivação (cover letter) para a vaga abaixo, em ${lang}, com no máximo 350 palavras, em parágrafos de texto corrido.
${RULE}
Estrutura: abertura com o cargo e a organização; dois ou três motivos de encaixe, cada um com um exemplo concreto tirado das histórias ou do currículo; motivação ligada ao mandato da organização apenas como descrito no anúncio; fechamento cordial com disponibilidade para entrevista. Assine com o nome do perfil. Responda apenas com a carta.

${ctx}`;
    await withClaude(btn, msg, async sample => {
      const ctl = new AbortController();
      if (C.modal) C.modal.ctl = ctl;
      ta.readOnly = true; ta.value = "Pensando…";
      try {
        const { text, truncated } = await sample(prompt, { signal: ctl.signal, cache: false, onText: ({ text }) => { if (ta.isConnected) ta.value = text; } });
        if (ta.isConnected) ta.value = text;
        await saveDossie(a.id, { jd, [kind]: text });
        showMsg(msg, truncated ? "O texto foi cortado no limite de tamanho. Peça de novo ou encurte o anúncio." : (kind === "cv" ? "CV gerado e salvo nesta vaga." : "Carta gerada e salva nesta vaga."), !truncated);
      } catch (e) { if (ta.isConnected) ta.value = e && e.text ? e.text : (C.dossies[a.id]?.[kind] || ""); throw e; }
      finally { ta.readOnly = false; if (C.modal) C.modal.ctl = null; }
    });
  }
  function setDocTab(kind) {
    document.querySelectorAll("#cm-doc-seg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.doc === kind)));
    const ta = $("cm-doc");
    if (!ta) return;
    const d = C.dossies[ta.dataset.appDoc] || {};
    ta.dataset.doc = kind; ta.value = d[kind] || "";
  }

  // ----- nova candidatura / radar -----
  function openNewApp(pre = {}) {
    const orgs = C.employers.map(e => e.name).sort((a, b) => a.localeCompare(b));
    openModal(mhead(pre.leadId ? "Levar vaga ao Notion" : "Nova candidatura") + `
      <form id="cm-newapp" class="c-sec" data-lead="${esc(pre.leadId || "")}">
        <div class="c-fields">
          <label class="field wide" for="na-name">Cargo e organização (nome no tracker)<input id="na-name" required value="${esc(pre.titulo || "")}" placeholder="Ex.: Programme Intern — UNICEF Brasil"></label>
          <label class="field" for="na-org">Empregador<input id="na-org" list="na-orgs" value="${esc(pre.organizacao || "")}" placeholder="Escolha ou escreva um novo"><datalist id="na-orgs">${orgs.map(o => `<option value="${esc(o)}"></option>`).join("")}</datalist></label>
          <label class="field" for="na-status">Etapa<select id="na-status">${APP_ST.map(s => `<option value="${s.k}"${s.k === (pre.status || "Not Applied") ? " selected" : ""}>${s.l}</option>`).join("")}</select></label>
          <label class="field" for="na-date">Prazo ou data<input id="na-date" type="date" value="${esc(pre.prazo || "")}"></label>
          <label class="field" for="na-platform">Plataforma<input id="na-platform" value="${esc(pre.fonte || "")}" placeholder="Inspira, Workday, LinkedIn…"></label>
          <label class="field wide" for="na-link">Link do anúncio<input id="na-link" type="url" value="${esc(pre.link || "")}" placeholder="https://"></label>
        </div>
        <p class="c-note">Um empregador novo também é criado na base Employers.</p>
        <div class="c-actions"><button class="btn primary" type="submit" id="na-submit">Criar no Notion</button><p class="c-msg" id="na-msg" hidden></p></div>
      </form>`, { type: "newapp" });
  }
  async function submitNewApp(form) {
    const msg = $("na-msg"), btn = $("na-submit");
    const name = $("na-name").value.trim(), orgName = $("na-org").value.trim(), status = $("na-status").value, date = $("na-date").value, platform = $("na-platform").value.trim(), link = $("na-link").value.trim();
    if (!name) { showMsg(msg, "Escreva o nome da vaga."); return; }
    if (link && !safeUrl(link)) { showMsg(msg, "O link precisa começar com http:// ou https://."); return; }
    if (!C.mcp) { showMsg(msg, errCopy({ code: "no_mcp" })); return; }
    btn.disabled = true; btn.textContent = "Criando…"; showMsg(msg, "");
    try {
      const emp = await ensureEmployer(orgName);
      const props = { Name: name, Status: status };
      if (date) { props["date:Date:start"] = date; props["date:Date:is_datetime"] = 0; }
      if (platform) props["Job Platform"] = platform;
      if (link) props["userDefined:URL"] = link;
      if (emp && emp.url) props.Employer = [emp.url];
      const r = await notionCreate({ data_source_id: DS.apps }, props);
      if (r.id) C.apps.push({ id: r.id, url: r.url, name, status, date: date || null, link, platform, employers: emp && emp.id ? [emp.id] : [] });
      const leadId = form.dataset.lead;
      if (leadId) {
        const l = C.leads.find(x => x.id === leadId);
        if (l) {
          const upd = Object.assign({}, l, { status: "no-notion", appUrl: r.url || "" });
          delete upd.id;
          await saveDoc("carreira/radar/leads/" + leadId, upd);
          if (r.id && l.texto) await saveDossie(r.id, { jd: l.texto });
        }
      }
      writeCache(); toast("Candidatura criada no Notion"); closeModal(); render();
      setTimeout(() => load(true), 1500);
    } catch (e) { showMsg(msg, writeErr(e)); }
    finally { if (btn.isConnected) { btn.disabled = false; btn.textContent = "Criar no Notion"; } }
  }
  function openLead(l = {}) {
    openModal(mhead(l.id ? "Editar vaga do radar" : "Vaga para o radar") + `
      <form id="cm-lead" class="c-sec" data-id="${esc(l.id || "")}">
        <div class="c-fields">
          <label class="field wide" for="ld-titulo">Cargo<input id="ld-titulo" required value="${esc(l.titulo || "")}"></label>
          <label class="field" for="ld-org">Organização<input id="ld-org" value="${esc(l.organizacao || "")}"></label>
          <label class="field" for="ld-local">Local<input id="ld-local" value="${esc(l.local || "")}"></label>
          <label class="field" for="ld-nivel">Nível<input id="ld-nivel" value="${esc(l.nivel || "")}" placeholder="Intern, P-2, NO-A…"></label>
          <label class="field" for="ld-prazo">Prazo<input id="ld-prazo" type="date" value="${esc(l.prazo || "")}"></label>
          <label class="field" for="ld-fonte">Fonte<input id="ld-fonte" value="${esc(l.fonte || "")}" placeholder="UN Careers, LinkedIn…"></label>
          <label class="field wide" for="ld-link">Link<input id="ld-link" type="url" value="${esc(l.link || "")}" placeholder="https://"></label>
          <label class="field wide" for="ld-resumo">Resumo<textarea id="ld-resumo" rows="3">${esc(l.resumo || "")}</textarea></label>
        </div>
        <div class="c-actions"><button class="btn primary" type="submit">Salvar no radar</button><p class="c-msg" id="ld-msg" hidden></p></div>
      </form>`, { type: "lead" });
  }
  async function submitLead(form) {
    const titulo = $("ld-titulo").value.trim();
    if (!titulo) { showMsg($("ld-msg"), "Escreva o cargo."); return; }
    const id = form.dataset.id || uid();
    const prev = C.leads.find(l => l.id === id) || {};
    const data = Object.assign({}, prev, { titulo, organizacao: $("ld-org").value.trim(), local: $("ld-local").value.trim(), nivel: $("ld-nivel").value.trim(), prazo: $("ld-prazo").value || null, fonte: $("ld-fonte").value.trim(), link: safeUrl($("ld-link").value), resumo: $("ld-resumo").value.trim(), status: prev.status || "novo", criado: prev.criado || new Date().toISOString() });
    delete data.id;
    if (await saveDoc("carreira/radar/leads/" + id, data)) { toast("Vaga salva no radar"); closeModal(); }
  }
  async function extractLead(btn) {
    const text = $("c-lead-text").value.trim(), msg = $("c-lead-msg");
    if (text.length < 60) { showMsg(msg, "Cole o texto do anúncio (pelo menos algumas linhas)."); return; }
    if (!needDb()) return;
    await withClaude(btn, msg, async sample => {
      const out = await sample.json(`Extraia os dados de um anúncio de vaga. Responda somente com um objeto JSON neste formato:
{"titulo": string, "organizacao": string, "local": string, "modalidade": string, "prazo": "AAAA-MM-DD" ou null, "nivel": string, "link": string, "idiomas": [string], "requisitos": [string], "resumo": string}
- Use "" ou null quando o anúncio não informar. Não deduza prazos que não estejam escritos.
- "nivel": nível ou tipo de contrato (ex.: Intern, P-2, NO-A, Consultant, Analista).
- "requisitos": até 8 itens curtos. "resumo": até 2 frases em português.
- Hoje é ${todayISO}; use para completar o ano de datas escritas sem ano.
ANÚNCIO:
${text.slice(0, 20000)}`, { modelTier: "quick" });
      if (!out || typeof out !== "object" || !out.titulo) throw { code: "invalid_json" };
      const prazo = /^\d{4}-\d{2}-\d{2}$/.test(out.prazo || "") ? out.prazo : null;
      const linkInText = (text.match(/https?:\/\/\S+/) || [""])[0].replace(/[).,;]+$/, "");
      const data = { titulo: String(out.titulo).slice(0, 200), organizacao: String(out.organizacao || ""), local: [out.local, out.modalidade].filter(Boolean).join(" · "), nivel: String(out.nivel || ""), prazo, link: safeUrl(out.link) || safeUrl(linkInText), fonte: "", resumo: String(out.resumo || ""), requisitos: (out.requisitos || []).map(String).slice(0, 10), idiomas: (out.idiomas || []).map(String), texto: text.slice(0, 30000), status: "novo", criado: new Date().toISOString() };
      if (await saveDoc("carreira/radar/leads/" + uid(), data)) { $("c-lead-text").value = ""; showMsg(msg, `“${data.titulo}” entrou no radar.`, true); }
    });
  }

  // ----- vaga por link → plano de tarefas -----
  // Leitura do link: primeiro um conector de leitura web do claude.ai (se estiver conectado);
  // sem ele, o link entra na fila carreira/fila/links e a rotina agendada do app lê a página.
  const FETCH = { server: "Parallel Search", tool: "web_fetch" };
  const normUrl = u => String(u || "").trim().replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase();
  const sameUrl = (a, b) => !!a && !!b && normUrl(a) === normUrl(b);
  async function fetchViaConnector(url) {
    const mcp = C.mcp || await window.claude?.use?.("mcp");
    if (!mcp || !safeUrl(url)) return null;
    C.mcp = mcp;
    if (C.fetchArg === undefined) {
      // o nome do argumento vem do esquema da ferramenta, lido na hora
      try {
        const d = await mcp.describeTool(FETCH.server, FETCH.tool);
        const s = d && d.inputSchema, props = (s && s.properties) || {};
        const key = Object.keys(props).find(k => /url/i.test(k)) || null;
        const extra = (Array.isArray(s?.required) ? s.required : []).filter(k => k !== key);
        C.fetchArg = key && !extra.length ? { key, list: props[key]?.type === "array" } : null;
      } catch { C.fetchArg = null; }
    }
    if (!C.fetchArg) return null;
    try {
      const r = await mcp.callTool(FETCH.server, FETCH.tool, { [C.fetchArg.key]: C.fetchArg.list ? [url] : url }, { cache: false });
      let text = (r?.content || []).filter(b => b && b.type === "text").map(b => b.text).join("\n\n").trim();
      if (!text && r?.payload) text = typeof r.payload === "string" ? r.payload : JSON.stringify(r.payload);
      return text && text.length >= 200 ? text.slice(0, 30000) : null;
    } catch { return null; }
  }
  function stepsHtml(etapas) {
    return `<ol class="c-steps">${(etapas || []).map(e => `<li><span><b>${esc(e.nome)}</b>${e.descricao ? `<small>${esc(e.descricao)}</small>` : ""}</span><span class="c-tag${e.fonte === "anúncio" ? " on" : ""}">${e.data ? ddmm(e.data) + " · " : ""}${e.fonte === "anúncio" ? "no anúncio" : "provável"}</span></li>`).join("")}</ol>`;
  }
  function planPrompt(src, app) {
    return `Você é um recrutador experiente em organizações internacionais (sistema ONU, ONGs, organismos multilaterais, governo e think tanks) e um coach de carreira. Leia o ANÚNCIO e transforme a vaga num plano de ação para o candidato.
${RULE}
Hoje é ${todayISO}.
Responda somente com um objeto JSON neste formato:
{"titulo": string, "organizacao": string, "local": string, "nivel": string, "prazo": "AAAA-MM-DD" ou null, "plataforma": string, "resumo": string, "contexto": string, "competencias": [{"key": string, "motivo": string}], "requisitos": [{"item": string, "tipo": "obrigatório" ou "desejável", "atende": "sim" ou "parcial" ou "não", "evidencia": string}], "lacunas": [{"lacuna": string, "acao": string}], "palavrasChave": [string], "etapas": [{"nome": string, "fonte": "anúncio" ou "provável", "data": "AAAA-MM-DD" ou null, "descricao": string}], "tarefas": [{"nome": string, "etapa": string, "data": "AAAA-MM-DD" ou null, "competencia": string ou null, "detalhe": string}]}
- "prazo": a data limite de candidatura escrita no anúncio; null se não houver. Não deduza.
- "nivel": nível ou tipo de contrato (Intern, P-2, NO-A, Consultant, Analista…); "" se o anúncio não disser.
- "plataforma": onde se candidatar (Inspira, Workday, LinkedIn, e-mail, formulário próprio…), conforme o anúncio ou o link.
- "resumo": 2 frases em português sobre a aderência, com o ponto mais forte e a maior lacuna.
- "contexto": 2 a 4 frases em português sobre o mandato da organização e da equipe e o que a pessoa vai fazer, só com o que o anúncio diz.
- "competencias": de 3 a 6, usando apenas chaves da lista COMPETÊNCIAS; "motivo" cita o trecho do anúncio.
- "requisitos": de 5 a 12 itens que o anúncio pede, comparados com o CURRÍCULO; "evidencia" diz onde aparece no currículo ou o que falta. "lacunas": até 5, com ação realista. "palavrasChave": até 12 termos do anúncio.
- "etapas": o processo seletivo, em ordem. "anúncio" para etapas escritas no texto; complete com etapas "provável" típicas desse tipo de organização e nível (no sistema ONU, por exemplo: triagem, teste escrito ou técnico, entrevista por competências, checagem de referências, oferta), dizendo na descrição que é uma expectativa.
- "tarefas": de 6 a 12 tarefas concretas, cada uma começando com verbo no infinitivo, em até 90 caracteres, ligadas a uma etapa pelo nome. Cubra o que se aplicar: pesquisar a organização e a equipe; adaptar o CV às palavras-chave; escrever a carta ou as respostas do formulário; preencher o perfil na plataforma (ex.: Inspira, P11/PHP); reunir documentos (diplomas, certificado de idioma, referências); preparar o teste técnico no tema da vaga; preparar histórias CAR para as competências principais (uma tarefa por competência, com "competencia" preenchida com a chave); fechar lacunas que dê para fechar antes do prazo; enviar a candidatura.
- Datas: tarefas da candidatura vão de hoje até 1 dia antes do prazo, em ordem lógica (pesquisa e CV primeiro, envio por último), nunca antes de hoje; sem prazo, distribua nas próximas 2 semanas. Tarefas de etapas posteriores (teste, entrevista) ficam com "data": null, salvo se o anúncio der a data.
- "detalhe": uma frase dizendo o que fazer e por quê, citando o anúncio.

COMPETÊNCIAS (chave — nome — grupo):
${compCatalog()}

PERFIL DE BUSCA DO CANDIDATO:
${buscaText()}
${app ? `\nA VAGA JÁ ESTÁ NO TRACKER COMO: ${app.name}${appOrgText(app) ? " — " + appOrgText(app) : ""}${app.date ? ` (data registrada ${app.date})` : ""}\n` : ""}
LINK: ${src.url || "(não informado)"}
ANÚNCIO:
${String(src.text).slice(0, 20000)}

CURRÍCULO:
${cvText(12000) || "(currículo vazio)"}`;
  }
  function normPlan(out) {
    const d = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s : null;
    const list = v => Array.isArray(v) ? v : [];
    return {
      titulo: String(out.titulo || "").slice(0, 200) || "(vaga sem título)", organizacao: String(out.organizacao || "").slice(0, 200), local: String(out.local || ""), nivel: String(out.nivel || ""),
      prazo: d(out.prazo), plataforma: String(out.plataforma || ""), resumo: String(out.resumo || ""), contexto: String(out.contexto || ""),
      competencias: list(out.competencias).filter(c => c && compBy(String(c.key))).map(c => ({ key: String(c.key), motivo: String(c.motivo || "") })).slice(0, 8),
      requisitos: list(out.requisitos).filter(r => r && r.item).map(r => ({ item: String(r.item), tipo: String(r.tipo || ""), atende: ["sim", "parcial", "não", "nao"].includes(r.atende) ? (r.atende === "nao" ? "não" : r.atende) : "não", evidencia: String(r.evidencia || "") })).slice(0, 14),
      lacunas: list(out.lacunas).filter(l => l && l.lacuna).map(l => ({ lacuna: String(l.lacuna), acao: String(l.acao || "") })).slice(0, 6),
      palavrasChave: list(out.palavrasChave).map(String).slice(0, 14),
      etapas: list(out.etapas).filter(e => e && e.nome).slice(0, 8).map(e => ({ nome: String(e.nome), fonte: /an[uú]ncio/i.test(e.fonte || "") ? "anúncio" : "provável", data: d(e.data), descricao: String(e.descricao || "") })),
      tarefas: list(out.tarefas).filter(t => t && t.nome).slice(0, 14).map(t => {
        let data = d(t.data);
        if (data && data < todayISO) data = todayISO;
        return { nome: String(t.nome).slice(0, 140), etapa: String(t.etapa || ""), data, competencia: t.competencia && compBy(String(t.competencia)) ? String(t.competencia) : null, detalhe: String(t.detalhe || "") };
      }),
    };
  }
  async function planFrom(src, btn, msg) {
    let ok = false;
    await withClaude(btn, msg, async sample => {
      if (msg) showMsg(msg, "O Claude está lendo a vaga e o seu currículo. Isso leva de 20 a 60 segundos.", true);
      const out = await sample.json(planPrompt(src, src.appId ? appBy(src.appId) : null));
      if (!out || typeof out !== "object" || Array.isArray(out)) throw { code: "invalid_json" };
      const plan = normPlan(out);
      if (!plan.tarefas.length) throw { code: "empty_completion" };
      if (msg) showMsg(msg, "");
      openPlan(plan, src); ok = true;
    });
    return ok;
  }
  function openPlan(plan, src) {
    const app = src.appId ? appBy(src.appId) : null;
    const sub = [plan.organizacao, plan.local, plan.nivel, plan.prazo ? `Prazo ${ddmm(plan.prazo)}/${plan.prazo.slice(0, 4)}` : "Sem prazo no anúncio", plan.plataforma].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")
      + (src.url ? `<a class="c-link" href="${esc(src.url)}" target="_blank" rel="noopener"><i class="ic" data-i="ext"></i>Anúncio</a>` : "");
    const sc = scoreOf(plan);
    const rows = plan.tarefas.map((t, i) => `<div class="c-ptask"><input type="checkbox" data-pt-on="${i}" checked aria-label="Incluir a tarefa ${i + 1}"><span class="pn"><input data-pt-name="${i}" value="${esc(t.nome)}" aria-label="Nome da tarefa ${i + 1}"><small>${esc([t.etapa, t.competencia ? compName(t.competencia) : "", t.detalhe].filter(Boolean).join(" · "))}</small></span><input type="date" data-pt-date="${i}" value="${esc(t.data || "")}" aria-label="Data da tarefa ${i + 1}"></div>`).join("");
    openModal(mhead(app ? "Tarefas para " + app.name : plan.titulo, sub) + `
      <div class="c-grid2">
        <div class="c-ai">
          <div class="c-score"><b>${sc === null ? "—" : sc + "%"}</b><span>aderência aos requisitos</span><span class="c-claude"><i class="ic" data-i="spark"></i>Claude</span></div>
          ${plan.resumo ? `<p>${esc(plan.resumo)}</p>` : ""}
          ${plan.contexto ? `<h5>Contexto da vaga</h5><p>${esc(plan.contexto)}</p>` : ""}
          ${plan.competencias.length ? `<h5>Competências que a vaga pede</h5><div class="c-tags">${plan.competencias.map(c => `<span class="c-tag" title="${esc(c.motivo)}">${esc(compName(c.key))} · ${evidenceOf(c.key) === null ? "sem história" : "evidência " + (evidenceOf(c.key) || "NE")}</span>`).join("")}</div>` : ""}
          ${plan.lacunas.length ? `<h5>Lacunas</h5><ul>${plan.lacunas.map(l => `<li><b>${esc(l.lacuna)}</b>${l.acao ? ` — ${esc(l.acao)}` : ""}</li>`).join("")}</ul>` : ""}
        </div>
        <div class="c-box"><h4><i class="ic" data-i="flag"></i>Etapas do processo seletivo</h4>${plan.etapas.length ? stepsHtml(plan.etapas) : `<p class="empty">O anúncio não descreve as etapas.</p>`}</div>
      </div>
      <div class="c-box"><h4><i class="ic" data-i="tasks"></i>Tarefas para o Job Tasks</h4>
        <p class="c-note">Desmarque o que não quiser e ajuste nomes e datas. Etapa, competência e o porquê vão no corpo de cada tarefa no Notion.</p>
        <div class="c-ptasks">${rows}</div></div>
      ${app ? "" : `<div class="c-box"><h4><i class="ic" data-i="briefcase"></i>Candidatura no Job Application Tracker</h4>
        <div class="c-fields">
          <label class="field wide" for="pt-name">Nome no tracker<input id="pt-name" value="${esc(plan.organizacao ? `${plan.titulo} — ${plan.organizacao}` : plan.titulo)}"></label>
          <label class="field" for="pt-org">Empregador<input id="pt-org" list="pt-orgs" value="${esc(plan.organizacao)}"><datalist id="pt-orgs">${C.employers.map(e => `<option value="${esc(e.name)}"></option>`).join("")}</datalist></label>
          <label class="field" for="pt-prazo">Prazo<input id="pt-prazo" type="date" value="${esc(plan.prazo || "")}"></label>
          <label class="field" for="pt-plat">Plataforma<input id="pt-plat" value="${esc(plan.plataforma)}"></label>
        </div><p class="c-note">Entra como Não aplicada; um empregador novo também é criado na base Employers.</p></div>`}
      <div class="c-actions"><button class="btn primary" id="cp-create">${app ? "Criar tarefas no Notion" : "Criar candidatura e tarefas no Notion"}</button><p class="c-msg" id="cp-msg" hidden></p><span class="c-note">Nada vai para o Notion antes deste clique.</span></div>`, { type: "plan", plan, src });
  }
  async function createPlan(btn) {
    const m = C.modal;
    if (!m || m.type !== "plan") return;
    const { plan, src } = m, msg = $("cp-msg");
    if (!C.mcp) { showMsg(msg, errCopy({ code: "no_mcp" })); return; }
    const picked = plan.tarefas.map((t, i) => ({ t, on: !!document.querySelector(`[data-pt-on="${i}"]`)?.checked, nome: (document.querySelector(`[data-pt-name="${i}"]`)?.value || "").trim(), data: document.querySelector(`[data-pt-date="${i}"]`)?.value || "" })).filter(x => x.on && x.nome);
    if (!picked.length) { showMsg(msg, "Marque ao menos uma tarefa."); return; }
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = "Criando…"; showMsg(msg, "");
    try {
      let app = src.appId ? appBy(src.appId) : null;
      if (!app) {
        const name = $("pt-name").value.trim() || plan.titulo, orgName = $("pt-org").value.trim(), date = $("pt-prazo").value, platform = $("pt-plat").value.trim();
        const emp = await ensureEmployer(orgName);
        const props = { Name: name, Status: "Not Applied" };
        if (date) { props["date:Date:start"] = date; props["date:Date:is_datetime"] = 0; }
        if (platform) props["Job Platform"] = platform;
        if (safeUrl(src.url)) props["userDefined:URL"] = src.url;
        if (emp && emp.url) props.Employer = [emp.url];
        const r = await notionCreate({ data_source_id: DS.apps }, props);
        if (!r.id) throw { code: "tool_error", message: "o Notion não devolveu o endereço da candidatura criada" };
        app = { id: r.id, url: r.url, name, status: "Not Applied", date: date || null, link: safeUrl(src.url), platform, employers: emp && emp.id ? [emp.id] : [] };
        C.apps.push(app);
        src.appId = app.id; // se as tarefas falharem, tentar de novo não duplica a candidatura
      }
      const pages = picked.map(({ t, nome, data }) => {
        const properties = { Name: nome, Status: "Not started", "Job Application Tracker": [app.url] };
        if (data) { properties["date:Due Date:start"] = data; properties["date:Due Date:is_datetime"] = 0; }
        const body = [];
        if (t.etapa) body.push(`**Etapa:** ${t.etapa}`);
        if (t.competencia) body.push(`**Competência:** ${compName(t.competencia)}`);
        if (t.detalhe) body.push(t.detalhe);
        body.push("_Criada pelo painel a partir do anúncio da vaga._");
        return { properties, content: body.join("\n\n") };
      });
      const urls = await notionCreateMany({ data_source_id: DS.jtasks }, pages);
      picked.forEach((x, i) => { const id = pageId(urls[i]); if (id) C.jtasks.push({ id, url: urls[i], name: x.nome, status: "Not started", done: false, due: x.data || null, apps: [app.id] }); });
      const now = new Date().toISOString();
      const analise = { nivel: plan.nivel, resumo: plan.resumo, requisitos: plan.requisitos, competencias: plan.competencias, lacunas: plan.lacunas, perguntas: C.dossies[app.id]?.analise?.perguntas || [], palavrasChave: plan.palavrasChave, data: now };
      await saveDossie(app.id, { jd: String(src.text).slice(0, 30000), analise, plano: { contexto: plan.contexto, etapas: plan.etapas, link: safeUrl(src.url), tarefas: picked.length, data: now } });
      const fila = src.filaId ? C.fila.find(f => f.id === src.filaId) : C.fila.find(f => f.status !== "feito" && sameUrl(f.url, src.url));
      if (fila) await markFila(fila.id, { status: "feito", appUrl: app.url });
      const leadId = src.leadId || fila?.leadId;
      const l = leadId ? C.leads.find(x => x.id === leadId) : null;
      if (l) { const upd = Object.assign({}, l, { status: "no-notion", appUrl: app.url }); delete upd.id; await saveDoc("carreira/radar/leads/" + l.id, upd); }
      writeCache(); closeModal(); render();
      toast(`${plural(picked.length, "tarefa criada", "tarefas criadas")} no Job Tasks`);
      setTimeout(() => load(true), 1500);
    } catch (e) { showMsg(msg, writeErr(e)); }
    finally { if (btn.isConnected) { btn.disabled = false; btn.textContent = label; } }
  }
  function markFila(id, patch) {
    const f = C.fila.find(x => x.id === id);
    const d = Object.assign({}, f || {}, patch);
    delete d.id;
    return saveDoc("carreira/fila/links/" + id, d);
  }
  async function submitIntake() {
    const raw = $("ci-url").value.trim(), url = safeUrl(raw), pasted = $("ci-text").value.trim(), msg = $("ci-msg"), btn = $("ci-go");
    if (raw && !url) { showMsg(msg, "O link precisa começar com http:// ou https://."); return; }
    if (!url && pasted.length < 200) { showMsg(msg, "Cole o link da vaga ou, se ele pedir login, o texto completo do anúncio."); return; }
    const dup = url ? C.apps.find(a => sameUrl(a.link, url)) : null;
    if (dup && pasted.length < 200) { showMsg(msg, `Esta vaga já está no tracker como “${dup.name}”. Abra-a e use Gerar tarefas com o Claude.`); return; }
    let text = pasted.length >= 200 ? pasted : null;
    if (!text) {
      btn.disabled = true; showMsg(msg, "Lendo o link…", true);
      try { text = await fetchViaConnector(url); } finally { btn.disabled = false; }
    }
    if (!text) {
      if (!needDb()) { showMsg(msg, ""); return; }
      if (C.fila.some(f => f.status !== "feito" && f.status !== "descartado" && sameUrl(f.url, url))) { showMsg(msg, "Este link já está na fila abaixo."); return; }
      if (await saveDoc("carreira/fila/links/" + uid(), { url, status: "pendente", criado: new Date().toISOString() })) {
        $("ci-url").value = "";
        showMsg(msg, "Não dá para ler o link daqui, então ele entrou na fila. A rotina do app do Claude abre a página em até 2 horas; quando aparecer como pronta, clique em Planejar tarefas. Com pressa, cole o texto do anúncio.", true);
      } else showMsg(msg, "");
      return;
    }
    const filaId = url ? C.fila.find(f => f.status !== "feito" && sameUrl(f.url, url))?.id : undefined;
    if (await planFrom({ text, url, filaId, appId: dup?.id }, btn, msg)) { $("ci-url").value = ""; $("ci-text").value = ""; }
  }
  async function planLead(l, btn) {
    const msg = $("c-lead-msg");
    let text = l.texto && l.texto.length >= 200 ? l.texto : null;
    if (!text && safeUrl(l.link)) { showMsg(msg, "Lendo o link…", true); text = await fetchViaConnector(l.link); }
    if (!text) {
      if (!safeUrl(l.link)) { showMsg(msg, "Esta vaga não tem texto nem link. Use Editar e cole o anúncio."); return; }
      if (C.fila.some(f => f.status !== "feito" && f.status !== "descartado" && sameUrl(f.url, l.link))) { showMsg(msg, "O link desta vaga já está na fila de Nova vaga por link."); return; }
      if (await saveDoc("carreira/fila/links/" + uid(), { url: l.link, status: "pendente", criado: new Date().toISOString(), leadId: l.id, titulo: l.titulo || "" })) showMsg(msg, `“${l.titulo || "Vaga"}” entrou na fila de links: quando a rotina ler a página, planeje em Nova vaga por link.`, true);
      return;
    }
    showMsg(msg, "");
    await planFrom({ text, url: safeUrl(l.link), leadId: l.id }, btn, msg);
  }
  async function planApp(a, btn) {
    const msg = $("cm-plan-msg");
    let text = ($("cm-jd")?.value || C.dossies[a.id]?.jd || "").trim();
    if (text.length < 200 && a.link) { showMsg(msg, "Lendo o link…", true); text = (await fetchViaConnector(a.link)) || ""; }
    if (text.length < 200) { showMsg(msg, a.link ? "Não consegui ler o link daqui. Cole o texto do anúncio em Descrição da vaga, abaixo, e tente de novo." : "Cole o texto do anúncio em Descrição da vaga, abaixo, e tente de novo."); return; }
    showMsg(msg, "");
    await planFrom({ text, url: a.link || "", appId: a.id }, btn, msg);
  }
  function renderIntake() {
    const el = $("ci-queue");
    if (!el) return;
    const list = C.fila.filter(f => f.status !== "feito" && f.status !== "descartado").sort((a, b) => String(b.criado || "").localeCompare(String(a.criado || "")));
    el.hidden = !list.length;
    if (!list.length) { el.innerHTML = ""; return; }
    const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
    el.innerHTML = `<p class="c-label">Fila de links · ${list.length}</p>` + list.map(f => {
      const st = f.status === "lido" ? `<small>Pronta para planejar${f.lidoEm ? " · lida " + sinceLabel(String(f.lidoEm).slice(0, 10)) : ""}</small>`
        : f.status === "erro" ? `<small class="err">${esc(f.motivo || "A rotina não conseguiu ler a página.")} Cole o texto do anúncio.</small>`
        : `<small>Aguardando a rotina do app (a cada 2 horas, das 8h às 22h)</small>`;
      return `<div class="c-qitem"><span class="qu"><b>${esc(f.titulo || host(f.url) || f.url)}</b><a class="c-link" href="${esc(safeUrl(f.url))}" target="_blank" rel="noopener"><i class="ic" data-i="ext"></i>${esc(host(f.url) || "Abrir")}</a>${st}</span><span class="c-row-actions">${f.status === "lido" ? `<button class="btn c-ai-only" data-q-plan="${esc(f.id)}"><i class="ic" data-i="spark"></i>Planejar tarefas</button>` : ""}${f.status === "erro" ? `<button class="btn" data-q-paste="${esc(f.id)}">Colar texto</button>` : ""}<button class="btn ghost" data-q-del="${esc(f.id)}">Descartar</button></span></div>`;
    }).join("");
  }
  function nextScout() {
    const d = new Date(); let add = (3 - d.getDay() + 7) % 7;
    if (add === 0 && d.getHours() >= 13) add = 7;
    d.setDate(d.getDate() + add);
    return add === 0 ? "hoje às 12h" : `qua ${ddmm(iso(d))} às 12h`;
  }
  function renderScout() {
    const el = $("c-scout");
    if (!el) return;
    const s = C.scout;
    if (!s || !s.ultima) { el.innerHTML = `<span><b>Varredura semanal</b> toda quarta às 12h: empregadores do Notion, portais e alertas do LinkedIn no Gmail.</span><span>Primeira ${nextScout()}, com o app do Claude aberto.</span>`; return; }
    el.innerHTML = `<span><b>Varredura semanal</b> · última em ${ddmm(String(s.ultima).slice(0, 10))}: ${plural(Number(s.novas) || 0, "vaga nova", "vagas novas")}, ${plural(Number(s.empregadores) || 0, "empregador conferido", "empregadores conferidos")}${s.linkedin ? `, ${plural(Number(s.linkedin), "do LinkedIn", "do LinkedIn")}` : ""}.</span><span>Próxima ${nextScout()}.</span>${s.resumo ? `<span class="c-mini">${esc(s.resumo)}</span>` : ""}`;
  }

  // ----- currículo: editores -----
  const CV_SEC = {
    exp: { list: "experiencias", title: "experiência", fields: [
      ["cargo", "Cargo", "text", true], ["org", "Organização", "text", true], ["local", "Local", "text"], ["tipo", "Tipo", TIPOS_EXP],
      ["inicio", "Início", "month", true], ["fim", "Fim", "month"], ["atual", "Ainda estou nesta posição", "check"], ["dedicacao", "Dedicação (%)", "number"],
      ["campo", "Experiência de campo", "check"], ["conta", "Contar na elegibilidade", "check"],
      ["realizacoes", "Realizações (uma por linha; comece com verbo e inclua números)", "lines"], ["competencias", "Competências demonstradas", "comps"], ["notas", "Notas", "area"]] },
    edu: { list: "educacao", title: "formação", fields: [
      ["nivel", "Nível", NIVEIS_EDU], ["curso", "Curso", "text", true], ["instituicao", "Instituição", "text", true], ["status", "Situação", STATUS_EDU],
      ["inicio", "Início", "month"], ["fim", "Conclusão ou previsão", "month"], ["tese", "Tese, dissertação ou TCC", "text"], ["notas", "Notas", "area"]] },
    lang: { list: "idiomas", title: "idioma", fields: [["idioma", "Idioma", "text", true], ["nivel", "Nível (Quadro Europeu)", ["", ...CEFR]], ["certificado", "Certificado", "text"]] },
    cert: { list: "certificacoes", title: "certificação", fields: [["nome", "Nome", "text", true], ["instituicao", "Instituição", "text"], ["data", "Data", "month"], ["link", "Link da credencial", "url"], ["competencias", "Competências relacionadas", "comps"], ["notas", "Notas", "area"]] },
    pub: { list: "publicacoes", title: "publicação", fields: [["titulo", "Título", "text", true], ["tipo", "Tipo", PUB_TIPOS], ["veiculo", "Revista, editora ou evento", "text"], ["ano", "Ano", "number"], ["link", "Link", "url"]] },
  };
  function compPicker(name, selected) {
    const sel = new Set(selected || []);
    return GROUPS.map(([g, l]) => compsOf(g).length ? `<div class="c-sec" style="gap:5px"><p class="c-label">${l}</p><div class="c-picks">${compsOf(g).map(c => `<label class="c-pick"><input type="checkbox" name="${name}" value="${esc(c.key)}"${sel.has(c.key) ? " checked" : ""}>${esc(c.name)}</label>`).join("")}</div></div>` : "").join("") || `<p class="c-note">As competências aparecem depois da leitura do Notion.</p>`;
  }
  function openCvItem(sec, id) {
    const S = CV_SEC[sec], item = id ? (C.cv[S.list] || []).find(x => x.id === id) : null;
    const v = item || (sec === "exp" ? { dedicacao: 100, conta: true, tipo: "Emprego" } : sec === "edu" ? { status: "Concluído", nivel: "Graduação" } : {});
    const field = ([k, label, type, req]) => {
      const fid = `cv-${k}`, val = v[k];
      if (Array.isArray(type)) return `<label class="field" for="${fid}">${label}<select id="${fid}" data-k="${k}">${type.map(o => `<option value="${esc(o)}"${(val || "") === o ? " selected" : ""}>${o || "—"}</option>`).join("")}</select></label>`;
      if (type === "check") return `<label class="c-check-row" for="${fid}"><input type="checkbox" id="${fid}" data-k="${k}"${val ? " checked" : ""}> ${label}</label>`;
      if (type === "lines") return `<label class="field wide" for="${fid}">${label}<textarea id="${fid}" data-k="${k}" rows="5">${esc((val || []).join("\n"))}</textarea></label>`;
      if (type === "area") return `<label class="field wide" for="${fid}">${label}<textarea id="${fid}" data-k="${k}" rows="2">${esc(val || "")}</textarea></label>`;
      if (type === "comps") return `<div class="field wide">${label}${compPicker("cv-comp", val)}</div>`;
      return `<label class="field${k === "cargo" || k === "nome" || k === "titulo" || k === "curso" ? " wide" : ""}" for="${fid}">${label}<input id="${fid}" data-k="${k}" type="${type}"${type === "number" ? ' inputmode="numeric"' : ""}${req ? " required" : ""} value="${esc(val ?? "")}"></label>`;
    };
    openModal(mhead((item ? "Editar " : "Adicionar ") + S.title) + `
      <form id="cm-cv" class="c-sec" data-sec="${sec}" data-id="${esc(id || "")}">
        <div class="c-fields">${S.fields.map(field).join("")}</div>
        <div class="c-actions"><button class="btn primary" type="submit">Salvar</button>${item ? `<button class="btn ghost" type="button" data-cv-del="${sec}" data-id="${esc(id)}">Excluir</button>` : ""}<p class="c-msg" id="cv-msg" hidden></p></div>
      </form>`, { type: "cv", id: id, sec });
  }
  async function submitCvItem(form) {
    const sec = form.dataset.sec, S = CV_SEC[sec], id = form.dataset.id || uid();
    const item = { id };
    for (const [k, , type, req] of S.fields) {
      if (type === "comps") { item[k] = [...form.querySelectorAll('input[name="cv-comp"]:checked')].map(i => i.value); continue; }
      const el = form.querySelector(`[data-k="${k}"]`);
      if (!el) continue;
      if (type === "check") item[k] = el.checked;
      else if (type === "lines") item[k] = el.value.split("\n").map(s => s.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
      else if (type === "number") item[k] = el.value === "" ? "" : Number(el.value);
      else if (type === "url") item[k] = safeUrl(el.value);
      else item[k] = el.value.trim();
      if (req && !item[k]) { showMsg($("cv-msg"), "Preencha os campos obrigatórios."); return; }
    }
    if (sec === "exp" && item.fim && item.inicio && item.fim < item.inicio && !item.atual) { showMsg($("cv-msg"), "O fim não pode ser antes do início."); return; }
    if (sec === "exp" && item.atual) item.fim = "";
    const list = (C.cv[S.list] || []).filter(x => x.id !== id);
    const old = (C.cv[S.list] || []).findIndex(x => x.id === id);
    if (old >= 0) list.splice(old, 0, item); else list.push(item);
    if (await saveCv(Object.assign({}, C.cv, { [S.list]: list }))) { toast("Currículo atualizado"); closeModal(); }
  }
  async function deleteCvItem(sec, id, btn) {
    if (btn.dataset.confirm !== "1") { btn.dataset.confirm = "1"; btn.textContent = "Confirmar exclusão"; setTimeout(() => { if (btn.isConnected) { btn.dataset.confirm = ""; btn.textContent = "Excluir"; } }, 4000); return; }
    const S = CV_SEC[sec];
    if (await saveCv(Object.assign({}, C.cv, { [S.list]: (C.cv[S.list] || []).filter(x => x.id !== id) }))) { toast("Item excluído"); closeModal(); }
  }
  function openPerfil() {
    const p = C.cv.perfil || {};
    const f = (k, l, t = "text", wide) => `<label class="field${wide ? " wide" : ""}" for="pf-${k}">${l}<input id="pf-${k}" data-k="${k}" type="${t}" value="${esc(p[k] || "")}"></label>`;
    openModal(mhead("Perfil") + `
      <form id="cm-perfil" class="c-sec">
        <div class="c-fields">${f("nome", "Nome", "text", true)}${f("titulo", "Título profissional", "text", true)}
          <label class="field wide" for="pf-resumo">Resumo (três a quatro linhas)<textarea id="pf-resumo" data-k="resumo" rows="4">${esc(p.resumo || "")}</textarea></label>
          ${f("local", "Cidade e país")}${f("email", "E-mail", "email")}${f("linkedin", "LinkedIn", "url")}${f("site", "Site ou portfólio", "url")}
          <label class="field wide" for="pf-hab">Habilidades técnicas (separe por vírgula)<input id="pf-hab" value="${esc((C.cv.habilidades || []).join(", "))}"></label>
        </div>
        <div class="c-actions"><button class="btn primary" type="submit">Salvar</button></div>
      </form>`, { type: "perfil" });
  }
  async function submitPerfil(form) {
    const perfil = {};
    form.querySelectorAll("[data-k]").forEach(el => { perfil[el.dataset.k] = el.value.trim(); });
    const habilidades = $("pf-hab").value.split(",").map(s => s.trim()).filter(Boolean);
    if (await saveCv(Object.assign({}, C.cv, { perfil, habilidades }))) { toast("Perfil salvo"); closeModal(); }
  }
  function openOutros() {
    openModal(mhead("Outros destaques") + `<form id="cm-outros" class="c-sec"><label class="field" for="ot-text">Prêmios, bolsas, representação, redes e atividades<textarea id="ot-text" class="c-ta" rows="6">${esc(C.cv.outros || "")}</textarea></label><div class="c-actions"><button class="btn primary" type="submit">Salvar</button></div></form>`, { type: "outros" });
  }
  async function importCv(btn) {
    const text = $("c-import-text").value.trim(), msg = $("c-import-msg");
    if (text.length < 40) { showMsg(msg, "Descreva um pouco mais: o que fez, onde, quando e com que resultado."); return; }
    const known = (C.cv.experiencias || []).map(e => `- ${e.cargo} | ${e.org} (${e.inicio || "?"} – ${e.atual ? "atual" : e.fim || "?"})`).join("\n") || "(nenhuma)";
    await withClaude(btn, msg, async sample => {
      const out = await sample.json(`Você é um redator de currículos para organizações internacionais. O TEXTO abaixo pode ser um currículo, um perfil do LinkedIn ou uma descrição livre, em linguagem informal, de experiências, projetos, cursos e habilidades. Converta-o para o formato do currículo.
${RULE}
Responda somente com JSON neste formato:
{"perfil": {"nome": string, "titulo": string, "resumo": string, "local": string, "email": string, "linkedin": string, "site": string}, "experiencias": [{"cargo": string, "org": string, "local": string, "tipo": "Emprego" | "Estágio" | "Voluntariado" | "Consultoria" | "Pesquisa" | "Bolsa", "inicio": "AAAA-MM", "fim": "AAAA-MM" ou "", "atual": boolean, "dedicacao": number, "realizacoes": [string], "competencias": [string]}], "educacao": [{"nivel": "Ensino médio" | "Técnico" | "Graduação" | "Especialização" | "Mestrado" | "Doutorado" | "Pós-doutorado", "curso": string, "instituicao": string, "inicio": "AAAA-MM" ou "", "fim": "AAAA-MM" ou "", "status": "Concluído" | "Em curso" | "Interrompido", "tese": string}], "idiomas": [{"idioma": string, "nivel": "Nativo" | "C2" | "C1" | "B2" | "B1" | "A2" | "A1" | "", "certificado": string}], "certificacoes": [{"nome": string, "instituicao": string, "data": "AAAA-MM" ou "", "link": string}], "habilidades": [string], "publicacoes": [{"titulo": string, "veiculo": string, "ano": string, "link": string, "tipo": string}]}
- Inclua só as seções que o TEXTO alimenta; deixe as outras vazias. No perfil, preencha só o que o texto disser.
- Projetos entram em "experiencias": cargo = o seu papel no projeto, org = a organização (ou o nome do projeto, se não houver), tipo coerente (Pesquisa, Voluntariado, Consultoria…).
- Se o texto falar de uma experiência que já está no currículo (lista JÁ NO CURRÍCULO), repita exatamente o mesmo cargo e a mesma org, para as realizações novas serem somadas a ela.
- "realizacoes": frases de currículo em português, começando com verbo de ação no passado ou no presente (cargo atual), com o que fez e o resultado, uma ideia por item, até 25 palavras. Use números só quando estiverem no texto.
- "competencias": de 1 a 4 chaves da lista COMPETÊNCIAS que a experiência demonstra.
- Cursos e certificados vão em "certificacoes"; ferramentas, métodos e temas vão em "habilidades" (termos curtos).
- Use "" quando o dado não existir. "dedicacao": 100 para tempo integral, 50 para meio período; 100 se não informado. Hoje é ${todayISO}: datas relativas ("desde março") viram AAAA-MM. Datas só com ano: mês 01. Não converta níveis de idioma que não estejam explícitos.

COMPETÊNCIAS (chave — nome — grupo):
${compCatalog()}

JÁ NO CURRÍCULO (cargo | org):
${known}

TEXTO:
${text.slice(0, 40000)}`);
      if (!out || typeof out !== "object") throw { code: "invalid_json" };
      const pick = (o, keys) => Object.fromEntries(keys.map(k => [k, o && o[k] != null ? o[k] : ""]));
      const parsed = {
        perfil: pick(out.perfil || {}, ["nome", "titulo", "resumo", "local", "email", "linkedin", "site"]),
        experiencias: (out.experiencias || []).filter(e => e && (e.cargo || e.org)).map(e => Object.assign(pick(e, ["cargo", "org", "local", "tipo", "inicio", "fim"]), { id: uid(), atual: !!e.atual, dedicacao: Number(e.dedicacao) || 100, realizacoes: (e.realizacoes || []).map(String).filter(Boolean), competencias: (Array.isArray(e.competencias) ? e.competencias : []).map(String).filter(k => compBy(k)).slice(0, 6), conta: true, campo: false })),
        educacao: (out.educacao || []).filter(e => e && (e.curso || e.instituicao)).map(e => Object.assign(pick(e, ["nivel", "curso", "instituicao", "inicio", "fim", "status", "tese"]), { id: uid() })),
        idiomas: (out.idiomas || []).filter(l => l && l.idioma).map(l => Object.assign(pick(l, ["idioma", "nivel", "certificado"]), { id: uid() })),
        certificacoes: (out.certificacoes || []).filter(c => c && c.nome).map(c => Object.assign(pick(c, ["nome", "instituicao", "data", "link"]), { id: uid(), link: safeUrl(c.link), competencias: [] })),
        habilidades: (out.habilidades || []).map(String).filter(Boolean),
        publicacoes: (out.publicacoes || []).filter(p => p && p.titulo).map(p => Object.assign(pick(p, ["titulo", "veiculo", "ano", "link", "tipo"]), { id: uid(), link: safeUrl(p.link) })),
      };
      C.importDraft = parsed;
      const n = k => (parsed[k] || []).length;
      $("c-import-out").innerHTML = `<div class="c-ai"><h5>O Claude encontrou</h5><p>${[parsed.perfil.nome ? "perfil de " + esc(parsed.perfil.nome) : "", plural(n("experiencias"), "experiência", "experiências"), plural(n("educacao"), "formação", "formações"), plural(n("idiomas"), "idioma", "idiomas"), plural(n("certificacoes"), "certificação", "certificações"), plural(n("publicacoes"), "publicação", "publicações"), plural(n("habilidades"), "habilidade", "habilidades")].filter(Boolean).join(", ")}.</p>
        ${parsed.experiencias.slice(0, 8).map(e => { const had = (C.cv.experiencias || []).some(x => normName(x.cargo + x.org) === normName(e.cargo + e.org)); return `<div class="c-q"><b>${esc(e.cargo)} · ${esc(e.org)} <span class="c-mini">(${esc(ymLabel(e.inicio) || "?")} – ${e.atual ? "atual" : esc(ymLabel(e.fim) || "?")})${had ? " · já existe: as realizações novas serão somadas" : " · nova"}</span></b>${e.realizacoes.length ? `<ul>${e.realizacoes.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}${e.competencias.length ? `<div class="c-tags">${e.competencias.map(k => `<span class="c-tag">${esc(compName(k))}</span>`).join("")}</div>` : ""}</div>`; }).join("")}
        ${parsed.certificacoes.length ? `<h5>Cursos e certificações</h5><ul>${parsed.certificacoes.map(c => `<li>${esc(c.nome)}${c.instituicao ? " — " + esc(c.instituicao) : ""}${c.data ? ` (${esc(ymLabel(c.data))})` : ""}</li>`).join("")}</ul>` : ""}
        ${parsed.habilidades.length ? `<h5>Habilidades</h5><div class="c-tags">${parsed.habilidades.map(h => `<span class="c-tag">${esc(h)}</span>`).join("")}</div>` : ""}
        <p>Mesclar acrescenta ao currículo o que é novo e soma realizações e competências às experiências que já existem. Substituir apaga o currículo atual e deixa só isto.</p>
        <div class="c-actions"><button class="btn primary" data-import="merge">Mesclar</button><button class="btn" data-import="replace">Substituir</button><button class="btn ghost" data-import="discard">Descartar</button></div></div>`;
    });
  }
  async function applyImport(mode) {
    const d = C.importDraft;
    if (!d) return;
    if (mode === "discard") { C.importDraft = null; $("c-import-out").innerHTML = ""; return; }
    let next;
    if (mode === "replace") next = Object.assign(emptyCv(), d, { outros: C.cv.outros || "" });
    else {
      const cur = C.cv, key = { experiencias: e => normName(e.cargo + e.org), educacao: e => normName(e.curso + e.instituicao), idiomas: l => normName(l.idioma), certificacoes: c => normName(c.nome), publicacoes: p => normName(p.titulo) };
      next = Object.assign({}, cur, { perfil: Object.assign({}, d.perfil, Object.fromEntries(Object.entries(cur.perfil || {}).filter(([, v]) => v))), habilidades: [...new Set([...(cur.habilidades || []), ...d.habilidades])] });
      for (const [k, f] of Object.entries(key)) { const have = new Set((cur[k] || []).map(f)); next[k] = [...(cur[k] || []), ...(d[k] || []).filter(x => !have.has(f(x)))]; }
      // experiência que já existe: soma realizações e competências novas em vez de ignorar
      next.experiencias = next.experiencias.map(e => {
        const m = (d.experiencias || []).find(x => normName(x.cargo + x.org) === normName(e.cargo + e.org));
        if (!m || m.id === e.id) return e;
        const seen = new Set((e.realizacoes || []).map(normName));
        return Object.assign({}, e, { realizacoes: [...(e.realizacoes || []), ...m.realizacoes.filter(r => !seen.has(normName(r)))], competencias: [...new Set([...(e.competencias || []), ...m.competencias])] });
      });
    }
    if (await saveCv(next)) { C.importDraft = null; $("c-import-out").innerHTML = ""; $("c-import-text").value = ""; toast(mode === "replace" ? "Currículo substituído" : "Itens novos adicionados ao currículo"); }
  }

  // ----- competência -----
  function openComp(key) {
    const c = compBy(key);
    if (!c) return;
    const f = c.fw || fwKey(key);
    const src = [f?.ohrm ? "ONU 1999" : "", f?.unhcr ? "ACNUR 2008" : ""].filter(Boolean).join(" · ");
    const sub = `<span class="c-status" style="--c:var(--car)">${GROUP_L[c.grupo] || c.grupo}</span>${src ? `<span class="c-mini">Quadros: ${src}</span>` : ""}<a class="c-link" href="${esc(c.url)}" target="_blank" rel="noopener"><i class="ic" data-i="ext"></i>Página no Notion</a>`;
    const lv = f?.unhcr?.niveis ? Object.entries(f.unhcr.niveis) : [];
    const qs = [...(f?.ohrm?.perguntas || []).map(q => Object.assign({ src: "ONU" }, q)), ...(f?.unhcr?.perguntas || []).map(q => Object.assign({ src: "ACNUR" }, q))];
    const extra = key === "political" ? (C.fw?.foraDaBase || []).find(x => x.key === "orgawareness") : null;
    openModal(mhead(c.name, sub) + `
      <div class="c-grid2">
        <div class="c-box"><h4><i class="ic" data-i="gauge"></i>Autoavaliação</h4>
          ${c.grupo === "valor" ? `<p class="c-note">Os valores não têm nota na sua base. No ACNUR, o painel espera que todo candidato os demonstre e só registra quando isso não acontece.</p>` : c.notion ? `<div class="c-rating"><input type="range" min="0" max="10" step="1" id="cm-rating" data-comp-rate="${esc(c.key)}" value="${c.rating ?? 0}" aria-label="Autoavaliação de 0 a 10"><output id="cm-rating-out">${c.rating ?? "—"}</output></div><p class="c-note">Grava o campo Rating no Notion (0 a 10).</p>` : `<p class="c-note">Esta competência não está nas bases do Notion lidas agora.</p>`}
          <div id="cm-comp-ev"></div></div>
        <div class="c-box"><h4><i class="ic" data-i="info"></i>Definição</h4>${f?.unhcr?.def ? `<p class="c-note" style="color:var(--ink-2);font-size:13.5px">${esc(f.unhcr.def)}</p><span class="c-mini">ACNUR, Best Practice Interview Guide</span>` : `<p class="c-note">O guia do ACNUR não traz definição para esta competência; veja os indicadores do guia da ONU abaixo.</p>`}</div>
      </div>
      ${lv.length ? `<div class="c-box"><h4><i class="ic" data-i="layers"></i>Níveis de proficiência (ACNUR)</h4><div class="c-levels">${lv.map(([k, t]) => `<div class="c-lv"><b>${k}</b><span>${esc(t)}</span></div>`).join("")}</div>${c.grupo === "managerial" ? `<p class="c-note">Nas competências gerenciais o ACNUR começa no nível L2.</p>` : ""}</div>` : ""}
      ${f?.ohrm ? `<div class="c-box"><h4><i class="ic" data-i="list"></i>Indicadores (ONU)</h4><div class="c-indicators"><div><p class="c-label">Positivos</p><ul>${f.ohrm.pos.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div><p class="c-label">Negativos</p><ul>${f.ohrm.neg.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div></div>` : ""}
      ${extra ? `<div class="c-box"><h4><i class="ic" data-i="info"></i>Organizational Awareness (ACNUR, fora da sua base)</h4><p class="c-note" style="color:var(--ink-2)">${esc(extra.def)}</p><div class="c-levels">${Object.entries(extra.niveis).map(([k, t]) => `<div class="c-lv"><b>${k}</b><span>${esc(t)}</span></div>`).join("")}</div></div>` : ""}
      <div class="c-grid2">
        <div class="c-box"><h4><i class="ic" data-i="book"></i>Suas histórias</h4><div id="cm-comp-stories"></div><div class="c-actions"><button class="btn" data-story-new="${esc(c.key)}"><i class="ic" data-i="plus"></i>Nova história</button></div></div>
        <div class="c-box"><h4><i class="ic" data-i="tasks"></i>Ações no Notion</h4><div id="cm-comp-actions"></div>
          <div class="c-actions"><button class="btn" data-act-new="${esc(c.key)}"><i class="ic" data-i="plus"></i>Nova ação</button><button class="btn c-ai-only" data-suggest-act="${esc(c.key)}"><i class="ic" data-i="spark"></i>Sugerir ações</button></div>
          <p class="c-msg" id="cm-sug-msg" hidden></p><div id="cm-sug-out"></div></div>
      </div>
      ${qs.length ? `<div class="c-box"><h4><i class="ic" data-i="chat"></i>Perguntas de entrevista (${qs.length})</h4><div class="c-qs">${qs.map(q => `<div class="c-q"><b>${esc(q.q)}</b>${q.probes?.length ? `<details><summary>${plural(q.probes.length, "pergunta de sondagem", "perguntas de sondagem")} · ${q.src}</summary><ul>${q.probes.map(p => `<li>${esc(p)}</li>`).join("")}</ul></details>` : `<span class="c-mini">${q.src}</span>`}<div class="c-row-actions"><button class="btn ghost c-ai-only" data-train="${esc(c.key)}" data-q="${esc(q.q)}">Treinar esta pergunta</button></div></div>`).join("")}</div></div>` : ""}`, { type: "comp", id: c.key });
  }
  function renderCompLive(key) {
    const c = compBy(key);
    if (!c) return;
    const ev = evidenceOf(key), st = storiesOf(key), act = actionsOf(c), dm = demandOf(key);
    const tr = C.treinos.filter(t => t.key === key).slice(0, 3);
    const evEl = $("cm-comp-ev");
    if (evEl) evEl.innerHTML = `<div class="c-sec" style="gap:6px"><p class="c-label">Evidência</p><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${evChip(ev)}<span class="c-mini">${ev === null ? "nenhuma história" : EV_LABEL[ev]}${dm.all ? ` · pedida em ${plural(dm.all, "vaga analisada", "vagas analisadas")}` : ""}</span></div>${tr.length ? `<p class="c-label" style="margin-top:6px">Últimos treinos</p><div class="c-attempts">${tr.map(t => `<div class="c-att"><span class="ad">${t.data ? ddmm(String(t.data).slice(0, 10)) : ""}</span><span class="aq">${esc(t.pergunta || "")}</span>${evChip(forcaNum(t.nota))}</div>`).join("")}</div>` : ""}</div>`;
    const sEl = $("cm-comp-stories");
    if (sEl) sEl.innerHTML = st.length ? `<div class="c-items">${st.map(s => `<div class="c-item"><div class="it"><b>${esc(s.titulo || "(sem título)")}</b><span class="im">${esc(clip(s.acao || s.contexto, 140))}</span></div><div class="c-row-actions">${evChip(forcaNum(s.forca?.[key]))}<button class="btn ghost" data-story="${esc(s.id)}">Abrir</button></div></div>`).join("")}</div>` : `<p class="empty">Nenhuma história demonstra esta competência ainda.</p>`;
    const aEl = $("cm-comp-actions");
    if (aEl) aEl.innerHTML = (act.tasks.length || act.courses.length) ? `<div class="tasklist">${act.tasks.map(t => `<div class="task${t.done ? " done" : ""}${C.busy.has(t.id) ? " busy" : ""}"><button class="tchk" data-devtask="${t.id}" aria-label="${t.done ? "Reabrir" : "Concluir"} ${esc(t.name)}">${CHECK}</button><span class="tn">${esc(t.name)}</span><span class="td">${t.eta ? ddmm(t.eta) : ""}</span></div>`).join("")}${act.courses.map(co => `<div class="task${co.done ? " done" : ""}"><span class="c-mini">Curso</span><span class="tn">${esc(co.name)}</span><span class="td">${esc(co.status)}</span></div>`).join("")}</div>` : `<p class="empty">Nenhuma tarefa ou curso do Notion ligado a esta competência.</p>`;
  }
  let rateTimer = null;
  function onRate(input) {
    const key = input.dataset.compRate, v = Number(input.value);
    const out = $("cm-rating-out"); if (out) out.textContent = String(v);
    clearTimeout(rateTimer);
    rateTimer = setTimeout(async () => {
      const c = compBy(key);
      if (!c || !c.notion) return;
      const was = c.rating;
      c.rating = v; render();
      try { await notionUpdate(c.id, { Rating: v }); toast(`Autoavaliação de ${c.name}: ${v}`); patchCompRow(c); writeCache(); }
      catch (e) { c.rating = was; render(); toast(writeErr(e)); }
    }, 700);
  }
  function patchCompRow(c) { for (const g of ["core", "managerial", "cross"]) for (const r of (C.compRows?.[g] || [])) if (r.id === c.id) r.rating = c.rating; }
  async function suggestActions(key, btn) {
    const c = compBy(key), msg = $("cm-sug-msg"), out = $("cm-sug-out");
    const act = actionsOf(c);
    await withClaude(btn, msg, async sample => {
      const list = await sample.json(`Sugira de 3 a 5 ações concretas para desenvolver a competência abaixo e gerar evidência para uma entrevista por competências, para alguém que busca o primeiro emprego em relações internacionais e organizações humanitárias. Leve em conta o currículo e as ações já planejadas.
Responda somente com um array JSON: [{"titulo": string (até 70 caracteres, começando com verbo), "tipo": "curso" | "projeto" | "voluntariado" | "prática" | "leitura" | "networking", "porque": string (1 frase), "evidencia": string (que história isso permitirá contar), "prazoDias": number}]
Não cite cursos, programas, eventos ou organizações específicos sem ter certeza de que existem; prefira descrever o tipo de atividade.

COMPETÊNCIA:
${compBrief(key)}

AÇÕES JÁ PLANEJADAS: ${[...act.tasks.map(t => t.name), ...act.courses.map(x => x.name)].join("; ") || "nenhuma"}

CURRÍCULO:
${cvText(8000) || "(vazio)"}`, { modelTier: "default" });
      const items = (Array.isArray(list) ? list : []).filter(x => x && x.titulo).slice(0, 6);
      if (!items.length) throw { code: "invalid_json" };
      C.sugAct = items;
      out.innerHTML = `<div class="c-ai"><h5>Sugestões do Claude</h5>${items.map((x, i) => `<div class="c-pr"><span class="pt"><b>${esc(x.titulo)}</b><small>${esc([x.tipo, x.porque, x.evidencia ? "Evidência: " + x.evidencia : ""].filter(Boolean).join(" · "))}</small></span><button class="btn ghost" data-act-new="${esc(key)}" data-sug="${i}">Criar no Notion</button></div>`).join("")}</div>`;
    });
  }

  // ----- ação de desenvolvimento -----
  function openAction(key, pre = {}) {
    const opts = GROUPS.map(([g, l]) => compsOf(g).length ? `<optgroup label="${l}">${compsOf(g).map(c => `<option value="${esc(c.key)}"${c.key === key ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</optgroup>` : "").join("");
    const eta = pre.prazoDias ? shift(todayISO, Math.max(1, Math.min(365, Math.round(Number(pre.prazoDias) || 14)))) : shift(todayISO, 14);
    openModal(mhead("Nova ação de desenvolvimento") + `
      <form id="cm-action" class="c-sec">
        <div class="c-fields">
          <label class="field wide" for="ac-name">O que fazer<input id="ac-name" required value="${esc(pre.titulo || "")}" placeholder="Ex.: Conduzir a reunião de planejamento do grupo de pesquisa"></label>
          <label class="field" for="ac-comp">Competência<select id="ac-comp">${opts}</select></label>
          <label class="field" for="ac-eta">Data prevista<input id="ac-eta" type="date" value="${eta}"></label>
        </div>
        <p class="c-note">A tarefa entra no Personal Improvement Tasks, ligada à meta Land First IR Job e à competência. Valores não têm relação na base; nesse caso o nome do valor vai no título.</p>
        <div class="c-actions"><button class="btn primary" type="submit" id="ac-submit">Criar no Notion</button><p class="c-msg" id="ac-msg" hidden></p></div>
      </form>`, { type: "action" });
  }
  async function submitAction() {
    const msg = $("ac-msg"), btn = $("ac-submit");
    let name = $("ac-name").value.trim();
    const key = $("ac-comp").value, eta = $("ac-eta").value, c = compBy(key);
    if (!name) { showMsg(msg, "Descreva a ação."); return; }
    if (!C.mcp) { showMsg(msg, errCopy({ code: "no_mcp" })); return; }
    const props = { Status: "Planned", Goals: [notionUrl(GOAL_ID)] };
    if (c && c.notion && REL[c.grupo]) props[REL[c.grupo]] = [c.url];
    else if (c) name = `${c.name} · ${name}`;
    props.Name = name;
    if (eta) { props["date:ETA:start"] = eta; props["date:ETA:is_datetime"] = 0; }
    btn.disabled = true; btn.textContent = "Criando…";
    try {
      const r = await notionCreate({ data_source_id: DS.devtasks }, props);
      if (r.id) {
        const rs = { core: [], managerial: [], cross: [] };
        if (c && c.notion && rs[c.grupo]) rs[c.grupo] = [c.id];
        C.devtasks.push({ id: r.id, url: r.url, name, status: "Planned", done: false, eta: eta || null, goal: GOAL_ID, rel: rs, comps: [...rs.core, ...rs.managerial, ...rs.cross] });
      }
      toast("Ação criada no Notion"); closeModal(); render();
      setTimeout(() => load(true), 1500);
    } catch (e) { showMsg(msg, writeErr(e)); }
    finally { if (btn.isConnected) { btn.disabled = false; btn.textContent = "Criar no Notion"; } }
  }

  // ----- histórias -----
  function openStory(id, pre = {}) {
    const s = id ? C.stories.find(x => x.id === id) : null;
    const v = s || Object.assign({ competencias: pre.key ? [pre.key] : [], forca: {} }, pre.draft || {});
    const exps = sortExp(C.cv.experiencias);
    openModal(mhead(s ? "Editar história" : "Nova história") + `
      <form id="cm-story" class="c-sec" data-id="${esc(id || "")}">
        <div class="c-fields">
          <label class="field wide" for="sty-title">Título (para você reconhecer a história)<input id="sty-title" required value="${esc(v.titulo || "")}" placeholder="Ex.: Mediação entre parceiros no projeto X"></label>
          <label class="field wide" for="sty-exp">Experiência do currículo<select id="sty-exp"><option value="">Nenhuma</option>${exps.map(e => `<option value="${esc(e.id)}"${v.experiencia === e.id ? " selected" : ""}>${esc(e.cargo || "")} · ${esc(e.org || "")}</option>`).join("")}</select></label>
        </div>
        <div class="c-cars">
          <label class="field" for="sty-c">Contexto · situação e tarefa<textarea id="sty-c" placeholder="Onde, quando, qual era o desafio e qual era o seu papel.">${esc(v.contexto || "")}</textarea></label>
          <label class="field" for="sty-a">Ação · o que você fez<textarea id="sty-a" placeholder="Os passos que você tomou e por quê. Use eu, não só nós.">${esc(v.acao || "")}</textarea></label>
          <label class="field" for="sty-r">Resultado · e o que aprendeu<textarea id="sty-r" placeholder="O que mudou, com números se houver, e o que você levou para depois.">${esc(v.resultado || "")}</textarea></label>
        </div>
        <div class="field">Competências demonstradas${compPicker("sty-comp", v.competencias)}</div>
        <div class="c-box" id="sty-rate"></div>
        <div class="c-actions"><button class="btn primary" type="submit">Salvar</button><button class="btn c-ai-only" type="button" id="sty-review"><i class="ic" data-i="spark"></i>Revisar com o Claude</button>${s ? `<button class="btn ghost" type="button" data-story-del="${esc(s.id)}">Excluir</button>` : ""}<p class="c-msg" id="sty-msg" hidden></p></div>
        <div id="sty-review-out"></div>
      </form>`, { type: "story", id: id || null, forca: Object.assign({}, v.forca || {}), ind: JSON.parse(JSON.stringify(v.indicadores || {})) });
    renderStoryRate();
  }
  function storyKeys() { return [...document.querySelectorAll('#cm-story input[name="sty-comp"]:checked')].map(i => i.value); }
  function renderStoryRate() {
    const box = $("sty-rate");
    if (!box || !C.modal) return;
    const keys = storyKeys(), m = C.modal;
    if (!keys.length) { box.innerHTML = `<h4><i class="ic" data-i="gauge"></i>Força da evidência</h4><p class="c-note">Marque as competências que a história demonstra para dar uma nota a cada uma (escala NE–5 do ACNUR).</p>`; return; }
    const sc = C.fw?.escalas?.unhcr || [];
    box.innerHTML = `<h4><i class="ic" data-i="gauge"></i>Força da evidência</h4><p class="c-note">Uma nota por competência, como faz o painel. Passe o mouse nas opções para ver a descrição.</p>`
      + keys.map(k => {
        const f = compBy(k)?.fw || fwKey(k), cur = m.forca[k] ?? "", ind = m.ind[k] || [];
        return `<div class="c-sec" style="gap:6px"><div class="c-forca"><span>${esc(compName(k))}</span><select data-forca="${esc(k)}" aria-label="Nota de ${esc(compName(k))}"><option value="">Sem nota</option>${(sc.length ? sc : [{ n: "NE" }, { n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }]).map(o => `<option value="${o.n}" title="${esc(o.desc || "")}"${String(cur) === String(o.n) ? " selected" : ""}>${o.n}${o.rotulo ? " · " + esc(o.rotulo) : ""}</option>`).join("")}</select></div>
          ${f?.ohrm?.pos?.length ? `<details${ind.length ? " open" : ""}><summary class="c-mini">Indicadores positivos observados (${ind.length}/${f.ohrm.pos.length})</summary><div class="c-ind" style="margin-top:6px">${f.ohrm.pos.map((p, i) => `<label><input type="checkbox" data-ind="${esc(k)}" value="${i}"${ind.includes(i) ? " checked" : ""}><span>${esc(p)}</span></label>`).join("")}</div></details>` : ""}</div>`;
      }).join("");
  }
  async function submitStory(form) {
    const titulo = $("sty-title").value.trim(), msg = $("sty-msg");
    if (!titulo) { showMsg(msg, "Dê um título à história."); return; }
    const keys = storyKeys();
    if (!keys.length) { showMsg(msg, "Marque ao menos uma competência."); return; }
    const m = C.modal, id = form.dataset.id || uid();
    const forca = {}, indicadores = {};
    for (const k of keys) { if (m.forca[k] !== undefined && m.forca[k] !== "") forca[k] = m.forca[k] === "NE" ? "NE" : Number(m.forca[k]); if ((m.ind[k] || []).length) indicadores[k] = m.ind[k]; }
    const prev = C.stories.find(s => s.id === id) || {};
    const data = { titulo, experiencia: $("sty-exp").value || "", contexto: $("sty-c").value.trim(), acao: $("sty-a").value.trim(), resultado: $("sty-r").value.trim(), competencias: keys, forca, indicadores, criado: prev.criado || new Date().toISOString(), atualizado: new Date().toISOString() };
    if (await saveDoc("carreira/banco/historias/" + id, data)) { toast("História salva"); closeModal(); }
  }
  async function deleteStory(id, btn) {
    if (btn.dataset.confirm !== "1") { btn.dataset.confirm = "1"; btn.textContent = "Confirmar exclusão"; setTimeout(() => { if (btn.isConnected) { btn.dataset.confirm = ""; btn.textContent = "Excluir"; } }, 4000); return; }
    if (await delDoc("carreira/banco/historias/" + id)) { toast("História excluída"); closeModal(); }
  }
  async function reviewStory(btn) {
    const keys = storyKeys(), msg = $("sty-msg"), out = $("sty-review-out");
    const story = { titulo: $("sty-title").value.trim(), contexto: $("sty-c").value.trim(), acao: $("sty-a").value.trim(), resultado: $("sty-r").value.trim() };
    if (!keys.length || (story.contexto + story.acao + story.resultado).length < 80) { showMsg(msg, "Escreva a história e marque as competências antes de pedir a revisão."); return; }
    await withClaude(btn, msg, async sample => {
      const res = await sample.json(`Avalie esta história de entrevista por competências usando a escala do ACNUR (NE, 1 Marginal, 2 Poor, 3 Acceptable, 4 Good, 5 Outstanding) para cada competência marcada, comparando com a definição e os indicadores fornecidos.
${RULE} Isso vale também para a versão melhorada: mesmos fatos, sem acrescentar nada.
Responda somente com JSON: {"avaliacoes": [{"key": string, "nota": "NE" ou 1 a 5, "observados": [string], "faltam": [string]}], "problemas": [string], "versao": {"contexto": string, "acao": string, "resultado": string}}
- "problemas": o que um painel cobraria, como falta de resultado, uso de "nós" sem deixar claro o seu papel, exemplo genérico ou hipotético, falta de aprendizado.
- "versao": a história reescrita em português, na primeira pessoa, mais objetiva e na estrutura contexto, ação, resultado.

COMPETÊNCIAS MARCADAS:
${keys.map(k => `[${k}] ${compBrief(k)}`).join("\n\n")}

HISTÓRIA: ${story.titulo}
Contexto: ${story.contexto}
Ação: ${story.acao}
Resultado: ${story.resultado}`);
      if (!res || typeof res !== "object") throw { code: "invalid_json" };
      C.reviewDraft = res;
      const av = (res.avaliacoes || []).filter(a => a && keys.includes(a.key));
      out.innerHTML = `<div class="c-ai"><h5>Revisão do Claude</h5>${av.map(a => `<div class="c-forca"><span><b>${esc(compName(a.key))}</b>${(a.faltam || []).length ? `<small class="c-mini" style="display:block">Falta: ${esc(a.faltam.join("; "))}</small>` : ""}</span>${evChip(forcaNum(a.nota))}</div>`).join("")}
        ${(res.problemas || []).length ? `<h5>O que o painel cobraria</h5><ul>${res.problemas.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
        ${res.versao ? `<h5>Versão revisada</h5><p><b>Contexto.</b> ${esc(res.versao.contexto || "")}</p><p><b>Ação.</b> ${esc(res.versao.acao || "")}</p><p><b>Resultado.</b> ${esc(res.versao.resultado || "")}</p>` : ""}
        <div class="c-actions"><button class="btn" type="button" data-review-apply="notas">Usar as notas</button>${res.versao ? `<button class="btn" type="button" data-review-apply="texto">Usar a versão revisada</button>` : ""}<span class="c-note">Nada é salvo até você clicar em Salvar.</span></div></div>`;
    });
  }
  function applyReview(what) {
    const r = C.reviewDraft, m = C.modal;
    if (!r || !m) return;
    if (what === "notas") { for (const a of r.avaliacoes || []) if (a && a.key) m.forca[a.key] = a.nota === "NE" ? "NE" : (forcaNum(a.nota) ?? ""); renderStoryRate(); toast("Notas aplicadas; clique em Salvar para gravar"); }
    else if (r.versao) { $("sty-c").value = r.versao.contexto || $("sty-c").value; $("sty-a").value = r.versao.acao || $("sty-a").value; $("sty-r").value = r.versao.resultado || $("sty-r").value; toast("Texto revisado aplicado; confira e salve"); }
  }
  async function suggestStories(btn) {
    const out = $("c-st-suggest-out");
    if (!cvText(100)) { out.innerHTML = `<p class="c-msg">Preencha o currículo antes de pedir sugestões.</p>`; return; }
    const missing = ratedComps().filter(c => !storiesOf(c.key).length).map(c => c.key);
    await withClaude(btn, null, async sample => {
      out.innerHTML = `<div class="c-ai"><span class="c-thinking">O Claude está lendo o currículo.</span></div>`;
      try {
        const list = await sample.json(`A partir do currículo abaixo, proponha até 6 histórias para entrevista por competências, em português, na estrutura contexto, ação, resultado. Escolha experiências que demonstrem competências diferentes, priorizando estas, que ainda não têm história: ${missing.join(", ") || "todas já têm"}.
${RULE}
Responda somente com um array JSON: [{"titulo": string, "competencias": [chaves da lista], "contexto": string, "acao": string, "resultado": string, "perguntasParaVoce": [string]}]
- "perguntasParaVoce": o que o candidato precisa responder para completar a história (números, prazos, o próprio papel).
COMPETÊNCIAS (chave — nome — grupo):
${compCatalog()}

TÍTULOS JÁ NO BANCO: ${C.stories.map(s => s.titulo).join("; ") || "nenhum"}

CURRÍCULO:
${cvText(14000)}`);
        const items = (Array.isArray(list) ? list : []).filter(x => x && x.titulo).slice(0, 6).map(x => Object.assign({}, x, { competencias: (x.competencias || []).filter(k => compBy(k)) }));
        if (!items.length) throw { code: "invalid_json" };
        C.sugStories = items;
        out.innerHTML = `<div class="c-ai"><h5>Rascunhos sugeridos a partir do currículo</h5>${items.map((x, i) => `<div class="c-pr"><span class="pt"><b>${esc(x.titulo)}</b><small>${esc(x.competencias.map(compName).join(", "))}${(x.perguntasParaVoce || []).length ? " · complete: " + esc(x.perguntasParaVoce.join(" ")) : ""}</small></span><button class="btn ghost" data-sug-story="${i}">Abrir rascunho</button></div>`).join("")}<span class="c-note">Os rascunhos só entram no banco quando você os salvar.</span></div>`;
      } catch (e) { const m = sampleErr(e); out.innerHTML = m ? `<p class="c-msg">${esc(m)}</p>` : ""; }
    });
  }

  // ----- treino de entrevista -----
  function questionsOf(key) { const f = compBy(key)?.fw || fwKey(key); return [...(f?.ohrm?.perguntas || []), ...(f?.unhcr?.perguntas || [])]; }
  function openTrain(key, q) {
    const keys = ratedComps().concat(compsOf("valor"));
    if (!key) {
      const pr = priorities()[0];
      key = pr ? pr.c.key : (keys[0] && keys[0].key);
    }
    if (!key) { toast("As competências ainda não foram carregadas."); return; }
    const qs = questionsOf(key);
    const question = q || (qs.length ? qs[Math.floor(Math.random() * qs.length)].q : "Tell me about a time when you demonstrated this competency.");
    const probes = (qs.find(x => x.q === question) || {}).probes || [];
    openModal(mhead("Treino de entrevista") + `
      <form id="cm-train" class="c-sec">
        <div class="c-fields"><label class="field" for="tr-comp">Competência<select id="tr-comp">${GROUPS.map(([g, l]) => compsOf(g).length ? `<optgroup label="${l}">${compsOf(g).map(c => `<option value="${esc(c.key)}"${c.key === key ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</optgroup>` : "").join("")}</select></label></div>
        <div class="c-box"><p class="c-label">Pergunta</p><b id="tr-q" style="font:600 16px/1.4 var(--display)">${esc(question)}</b>${probes.length ? `<details><summary class="c-mini">Sondagens que o painel pode fazer</summary><ul class="c-mini">${probes.map(p => `<li>${esc(p)}</li>`).join("")}</ul></details>` : ""}<div class="c-actions"><button class="btn ghost" type="button" id="tr-other">Outra pergunta</button></div></div>
        <label class="field" for="tr-answer">Sua resposta (escreva como falaria: contexto, ação, resultado)<textarea id="tr-answer" class="c-ta tall" placeholder="Pode responder em inglês ou em português."></textarea></label>
        <div class="c-actions"><button class="btn primary" type="submit" id="tr-go"><i class="ic" data-i="spark"></i>Avaliar resposta</button><p class="c-msg" id="tr-msg" hidden></p></div>
        <div id="tr-out"></div>
      </form>`, { type: "train", key, q: question });
  }
  async function evalTrain(btn) {
    const m = C.modal, answer = $("tr-answer").value.trim(), msg = $("tr-msg"), out = $("tr-out");
    if (answer.length < 60) { showMsg(msg, "Escreva uma resposta mais completa antes de pedir a avaliação."); return; }
    await withClaude(btn, msg, async sample => {
      const r = await sample.json(`Você é membro de um painel de entrevista por competências do sistema ONU. Avalie a resposta do candidato à pergunta abaixo, para a competência indicada, usando a escala do ACNUR: NE (sem evidência), 1 Marginal, 2 Poor, 3 Acceptable, 4 Good, 5 Outstanding.
Compare com a definição e os indicadores. Resposta hipotética ("eu faria...") ou genérica, sem um exemplo concreto do passado, vale no máximo 1.
Responda somente com JSON: {"nota": "NE" ou 1 a 5, "observados": [string], "ausentes": [string], "negativos": [string], "feedback": string, "sondagem": string}
- "feedback": de 3 a 5 frases em português, diretas, dizendo o que manter e o que mudar.
- "sondagem": uma pergunta de follow-up, em inglês, que o painel faria a seguir.

COMPETÊNCIA:
${compBrief(m.key)}

PERGUNTA: ${m.q}
RESPOSTA DO CANDIDATO:
${answer.slice(0, 12000)}`, { cache: false });
      if (!r || typeof r !== "object") throw { code: "invalid_json" };
      const nota = r.nota === "NE" ? "NE" : forcaNum(r.nota);
      out.innerHTML = `<div class="c-ai"><div class="c-score"><b>${nota === "NE" || nota === 0 ? "NE" : nota ?? "—"}</b><span>${esc(EV_LABEL[nota === "NE" ? 0 : nota] || "")} · escala do ACNUR</span><span class="c-claude"><i class="ic" data-i="spark"></i>Claude</span></div>
        ${r.feedback ? `<p>${esc(r.feedback)}</p>` : ""}
        ${(r.observados || []).length ? `<h5>Indicadores observados</h5><ul>${r.observados.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        ${(r.ausentes || []).length ? `<h5>O que faltou</h5><ul>${r.ausentes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        ${(r.negativos || []).length ? `<h5>Sinais negativos</h5><ul>${r.negativos.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        ${r.sondagem ? `<h5>Próxima pergunta do painel</h5><p><b>${esc(r.sondagem)}</b></p>` : ""}
        <div class="c-actions"><button class="btn" type="button" data-train-story>Transformar em história</button></div></div>`;
      C.lastTrain = { key: m.key, pergunta: m.q, resposta: answer, nota: nota === null ? "" : nota };
      if (C.dbReady) { try { await dbq("carreira/treino", () => C.db.collection("carreira/treino/tentativas").add(plain({ key: m.key, pergunta: m.q, resposta: answer.slice(0, 8000), nota: nota === null ? "" : nota, feedback: String(r.feedback || ""), data: new Date().toISOString() }))); } catch (e) { toast(dbErr(e)); } }
    });
  }

  // ---------- eventos ----------
  async function toggleJTask(t) {
    if (C.busy.has(t.id)) return;
    const was = { done: t.done, status: t.status };
    t.done = !t.done; t.status = t.done ? "Done" : "Not started";
    C.busy.add(t.id); render(); refreshModal();
    try { await notionUpdate(t.id, { Status: t.status }); toast(t.done ? "Tarefa concluída no Notion" : "Tarefa reaberta no Notion"); writeCache(); }
    catch (e) { Object.assign(t, was); toast(writeErr(e)); }
    finally { C.busy.delete(t.id); render(); refreshModal(); }
  }
  async function toggleDev(t) {
    if (C.busy.has(t.id)) return;
    const was = { done: t.done, status: t.status };
    t.done = !t.done; t.status = t.done ? "Done" : "Not started";
    C.busy.add(t.id); render(); refreshModal();
    try { await notionUpdate(t.id, { Status: t.status }); toast(t.done ? "Ação concluída no Notion" : "Ação reaberta no Notion"); writeCache(); }
    catch (e) { Object.assign(t, was); toast(writeErr(e)); }
    finally { C.busy.delete(t.id); render(); refreshModal(); }
  }
  async function setAppStatus(a, status, sel) {
    const was = a.status;
    if (status === was) return;
    a.status = status; render();
    if (sel) sel.disabled = true;
    try { await notionUpdate(a.id, { Status: status }); toast(`Etapa atualizada: ${ST_BY[status]?.l || status}`); writeCache(); }
    catch (e) { a.status = was; if (sel) sel.value = was; toast(writeErr(e)); render(); }
    finally { if (sel && sel.isConnected) sel.disabled = false; }
  }
  async function linkTask(t, key, sel) {
    const c = compBy(key);
    if (!c || !c.notion || !REL[c.grupo]) return;
    const cur = (t.rel[c.grupo] || []).map(notionUrl);
    sel.disabled = true;
    try {
      await notionUpdate(t.id, { [REL[c.grupo]]: [...new Set([...cur, c.url])] });
      t.rel[c.grupo] = [...new Set([...(t.rel[c.grupo] || []), c.id])]; t.comps = [...t.rel.core, ...t.rel.managerial, ...t.rel.cross];
      toast(`Tarefa ligada a ${c.name}`); writeCache(); render();
    } catch (e) { toast(writeErr(e)); sel.value = ""; sel.disabled = false; }
  }
  async function setCourseStatus(co, status, sel) {
    const was = co.status;
    co.status = status; co.done = status === "Pronto"; sel.disabled = true;
    try { await notionUpdate(co.id, { Status: status }); toast(`Curso: ${status}`); writeCache(); }
    catch (e) { co.status = was; co.done = was === "Pronto"; sel.value = was; toast(writeErr(e)); }
    finally { if (sel.isConnected) sel.disabled = false; render(); }
  }
  async function setSkillStatus(s, status, sel) {
    const was = s.status;
    s.status = status; sel.disabled = true;
    try { await notionUpdate(s.id, { Status: status }); toast("Status atualizado no Notion"); writeCache(); }
    catch (e) { s.status = was; sel.value = was; toast(writeErr(e)); }
    finally { if (sel.isConnected) sel.disabled = false; }
  }
  async function saveDocToNotion(a, btn) {
    const ta = $("cm-doc"), kind = ta?.dataset.doc || "cv", text = (ta?.value || "").trim();
    if (text.length < 40) { toast("Gere ou escreva o documento antes de salvar."); return; }
    if (!C.mcp) { toast(errCopy({ code: "no_mcp" })); return; }
    btn.disabled = true;
    try {
      const title = `${kind === "cv" ? "CV adaptado" : "Carta de motivação"} · ${ddmm(todayISO)}/${todayISO.slice(0, 4)}`;
      const r = await notionCreate({ page_id: a.id }, { title }, text);
      await saveDossie(a.id, { [kind]: text, [kind + "Notion"]: r.url || "" });
      toast("Documento salvo como subpágina da vaga no Notion");
    } catch (e) { toast(writeErr(e)); }
    finally { if (btn.isConnected) btn.disabled = false; }
  }

  const root = $("view-carreira");
  root.addEventListener("click", e => {
    if (!C.started) return;
    const t = e.target;
    if (t === $("c-modal")) { closeModal(); return; }
    const q = s => t.closest(s);
    let el;
    if (q("[data-close]")) { closeModal(); return; }
    if ((el = q("[data-csub]"))) { C.sub = el.dataset.csub; render(); return; }
    if ((el = q("[data-jtask]"))) { const tk = C.jtasks.find(x => x.id === el.dataset.jtask); if (tk) toggleJTask(tk); return; }
    if ((el = q("[data-devtask]"))) { const tk = C.devtasks.find(x => x.id === el.dataset.devtask); if (tk) toggleDev(tk); return; }
    if ((el = q("[data-plan-app]"))) { const a = appBy(el.dataset.planApp); if (a) planApp(a, el); return; }
    if ((el = q("#cp-create"))) { createPlan(el); return; }
    if ((el = q("[data-q-plan]"))) { const f = C.fila.find(x => x.id === el.dataset.qPlan); if (f && f.texto) planFrom({ text: f.texto, url: f.url, filaId: f.id, leadId: f.leadId || undefined, appId: C.apps.find(a => sameUrl(a.link, f.url))?.id }, el, $("ci-msg")); return; }
    if ((el = q("[data-q-paste]"))) { const f = C.fila.find(x => x.id === el.dataset.qPaste); if (f) { $("ci-url").value = f.url || ""; const dt = document.querySelector(".c-intake-more"); if (dt) dt.open = true; $("ci-text").focus(); } return; }
    if ((el = q("[data-q-del]"))) { markFila(el.dataset.qDel, { status: "descartado" }).then(ok => ok && toast("Link descartado da fila")); return; }
    if ((el = q("[data-lead-plan]"))) { const l = C.leads.find(x => x.id === el.dataset.leadPlan); if (l) planLead(l, el); return; }
    if ((el = q("[data-app]")) && !q("form") && el.tagName !== "SELECT" && !el.dataset.gen) { openApp(el.dataset.app); return; }
    if ((el = q("#c-app-filter button"))) { C.appFilter = el.dataset.f; document.querySelectorAll("#c-app-filter button").forEach(b => b.setAttribute("aria-pressed", String(b === el))); renderBoard(); return; }
    if ((el = q("#c-src-filter button"))) { C.srcFilter = el.dataset.f; document.querySelectorAll("#c-src-filter button").forEach(b => b.setAttribute("aria-pressed", String(b === el))); renderSources(); return; }
    if (q("[data-src-all]")) { C.srcAll = !C.srcAll; renderSources(); return; }
    if ((el = q("[data-src-seen]"))) { saveCfg({ fontes: Object.assign({}, C.cfg?.fontes || {}, { [el.dataset.srcSeen]: todayISO }) }).then(ok => { if (ok) renderSources(); }); return; }
    if (q("#c-new-app")) { openNewApp(); return; }
    if (q("#c-lead-ai")) { extractLead(q("#c-lead-ai")); return; }
    if (q("#c-lead-manual")) { if (needDb()) openLead({ resumo: "" }); return; }
    if ((el = q("[data-lead-promote]"))) { const l = C.leads.find(x => x.id === el.dataset.leadPromote); if (l) openNewApp(Object.assign({}, l, { leadId: l.id })); return; }
    if ((el = q("[data-lead-edit]"))) { const l = C.leads.find(x => x.id === el.dataset.leadEdit); if (l) openLead(l); return; }
    if ((el = q("[data-lead-archive]"))) { const l = C.leads.find(x => x.id === el.dataset.leadArchive); if (l) { const d = Object.assign({}, l, { status: "arquivado" }); delete d.id; saveDoc("carreira/radar/leads/" + l.id, d).then(ok => ok && toast("Vaga arquivada")); } return; }
    if ((el = q("[data-analyze]"))) { const a = appBy(el.dataset.analyze); if (a) analyzeApp(a, el); return; }
    if ((el = q("[data-gen]"))) { const a = appBy(el.dataset.app); if (a) generateDoc(a, el.dataset.gen, el); return; }
    if ((el = q("#cm-doc-seg button"))) { setDocTab(el.dataset.doc); return; }
    if (q("[data-doc-copy]")) { const ta = $("cm-doc"); const v = ta ? ta.value : ""; navigator.clipboard?.writeText(v).then(() => toast("Copiado"), () => { ta.focus(); ta.select(); toast("Selecionei o texto: copie com Ctrl+C"); }); return; }
    if ((el = q("[data-doc-notion]"))) { const a = appBy(el.dataset.docNotion); if (a) saveDocToNotion(a, el); return; }
    if (q("[data-cv-perfil]")) { if (needDb()) openPerfil(); return; }
    if (q("[data-cv-outros]")) { if (needDb()) openOutros(); return; }
    if ((el = q("[data-cv-add]"))) { if (needDb()) openCvItem(el.dataset.cvAdd, null); return; }
    if ((el = q("[data-cv-edit]"))) { openCvItem(el.dataset.cvEdit, el.dataset.id); return; }
    if ((el = q("[data-cv-del]"))) { deleteCvItem(el.dataset.cvDel, el.dataset.id, el); return; }
    if (q("#c-cv-copy")) { const v = $("c-cv-md").textContent; navigator.clipboard?.writeText(v).then(() => toast("Currículo copiado"), () => toast("Não consegui copiar; selecione o texto manualmente")); return; }
    if (q("#c-import-go")) { importCv(q("#c-import-go")); return; }
    if ((el = q("[data-import]"))) { applyImport(el.dataset.import); return; }
    if ((el = q("#c-sk-seg button"))) { C.skv = el.dataset.v; renderSkills(); return; }
    if ((el = q("[data-story-new]"))) { if (needDb()) openStory(null, { key: el.dataset.storyNew }); return; }
    if ((el = q("[data-story-del]"))) { deleteStory(el.dataset.storyDel, el); return; }
    if ((el = q("[data-story]"))) { openStory(el.dataset.story); return; }
    if ((el = q("[data-sug-story]"))) { const s = (C.sugStories || [])[+el.dataset.sugStory]; if (s && needDb()) openStory(null, { draft: { titulo: s.titulo, contexto: s.contexto, acao: s.acao, resultado: s.resultado, competencias: s.competencias } }); return; }
    if (q("#c-st-new")) { if (needDb()) openStory(null, {}); return; }
    if (q("#c-st-suggest")) { suggestStories(q("#c-st-suggest")); return; }
    if (q("#sty-review")) { reviewStory(q("#sty-review")); return; }
    if ((el = q("[data-review-apply]"))) { applyReview(el.dataset.reviewApply); return; }
    if ((el = q("[data-suggest-act]"))) { suggestActions(el.dataset.suggestAct, el); return; }
    if ((el = q("[data-act-new]"))) { const s = el.dataset.sug !== undefined ? (C.sugAct || [])[+el.dataset.sug] : null; openAction(el.dataset.actNew, s || {}); return; }
    if (q("#c-act-new")) { openAction(priorities()[0]?.c.key || "", {}); return; }
    if ((el = q("[data-train]"))) { openTrain(el.dataset.train, el.dataset.q); return; }
    if (q("#c-train-go")) { openTrain(null, null); return; }
    if (q("#tr-other")) { const k = C.modal?.key; const qs = questionsOf(k).filter(x => x.q !== C.modal?.q); if (qs.length) openTrain(k, qs[Math.floor(Math.random() * qs.length)].q); return; }
    if (q("[data-train-story]")) { const lt = C.lastTrain; if (lt && needDb()) openStory(null, { draft: { titulo: lt.pergunta.slice(0, 80), acao: lt.resposta, competencias: [lt.key], forca: lt.nota !== "" ? { [lt.key]: lt.nota } : {} } }); return; }
    if ((el = q("[data-comp]"))) { openComp(el.dataset.comp); return; }
    if (q("#c-refresh")) { load(true); return; }
  });
  root.addEventListener("change", e => {
    const t = e.target;
    if (t.matches("[data-app-status]")) { const a = appBy(t.dataset.appStatus); if (a) setAppStatus(a, t.value, t); return; }
    if (t.matches("[data-app-res]")) { saveDossie(t.dataset.appRes, { resultado: t.value }).then(ok => ok && toast("Resultado anotado")); return; }
    if (t.matches("[data-link-task]")) { const tk = C.devtasks.find(x => x.id === t.dataset.linkTask); if (tk && t.value) linkTask(tk, t.value, t); return; }
    if (t.matches("[data-course-st]")) { const co = C.courses.find(x => x.id === t.dataset.courseSt); if (co) setCourseStatus(co, t.value, t); return; }
    if (t.matches("[data-skill-st]")) { const s = C.skills.find(x => x.id === t.dataset.skillSt); if (s) setSkillStatus(s, t.value, t); return; }
    if (t.matches("[data-forca]")) { if (C.modal) C.modal.forca[t.dataset.forca] = t.value; return; }
    if (t.matches("[data-ind]")) { const m = C.modal; if (!m) return; const k = t.dataset.ind, i = +t.value; const set = new Set(m.ind[k] || []); if (t.checked) set.add(i); else set.delete(i); m.ind[k] = [...set].sort((a, b) => a - b); return; }
    if (t.matches('input[name="sty-comp"]')) { renderStoryRate(); return; }
    if (t.id === "c-st-filter") { C.stFilter = t.value; renderStories(); return; }
    if (t.id === "tr-comp") { openTrain(t.value, null); return; }
    if (t.matches("[data-comp-rate]")) { onRate(t); return; }
    if (t.closest("#c-busca")) { renderLinks(); }
  });
  root.addEventListener("input", e => {
    const t = e.target;
    if (t.matches("[data-comp-rate]")) { const o = $("cm-rating-out"); if (o) o.textContent = t.value; return; }
    if (t.closest("#c-busca")) renderLinks();
  });
  root.addEventListener("focusout", e => {
    const t = e.target;
    if (t.matches("[data-app-jd]")) { const id = t.dataset.appJd, v = t.value.trim(); if (v !== (C.dossies[id]?.jd || "")) saveDossie(id, { jd: v }); return; }
    if (t.matches("[data-app-notas]")) { const id = t.dataset.appNotas, v = t.value.trim(); if (v !== (C.dossies[id]?.notas || "")) saveDossie(id, { notas: v }).then(ok => ok && toast("Notas salvas")); return; }
    if (t.matches("[data-app-doc]")) { const id = t.dataset.appDoc, k = t.dataset.doc, v = t.value; if (!t.readOnly && v !== (C.dossies[id]?.[k] || "")) saveDossie(id, { [k]: v }); }
  });
  root.addEventListener("submit", e => {
    const f = e.target;
    e.preventDefault();
    if (f.id === "c-busca") { saveCfg({ busca: readBusca() }).then(ok => { if (ok) { showMsg($("cb-msg"), "Perfil salvo.", true); setTimeout(() => showMsg($("cb-msg"), ""), 2500); } }); return; }
    if (f.id === "cm-task-form") {
      const a = appBy(f.dataset.app), name = $("cm-task-name").value.trim(), date = $("cm-task-date").value, msg = $("cm-task-msg");
      if (!a || !name) { showMsg(msg, "Escreva a tarefa."); return; }
      if (!C.mcp) { showMsg(msg, errCopy({ code: "no_mcp" })); return; }
      const props = { Name: name, Status: "Not started", "Job Application Tracker": [a.url] };
      if (date) { props["date:Due Date:start"] = date; props["date:Due Date:is_datetime"] = 0; }
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      notionCreate({ data_source_id: DS.jtasks }, props).then(r => {
        if (r.id) C.jtasks.push({ id: r.id, url: r.url, name, status: "Not started", done: false, due: date || null, apps: [a.id] });
        $("cm-task-name").value = ""; $("cm-task-date").value = ""; showMsg(msg, "");
        toast("Tarefa criada no Job Tasks"); writeCache(); render(); refreshModal();
      }).catch(err => showMsg(msg, writeErr(err))).finally(() => { btn.disabled = false; });
      return;
    }
    if (f.id === "c-intake") { submitIntake(); return; }
    if (f.id === "cm-newapp") { submitNewApp(f); return; }
    if (f.id === "cm-lead") { submitLead(f); return; }
    if (f.id === "cm-cv") { submitCvItem(f); return; }
    if (f.id === "cm-perfil") { submitPerfil(f); return; }
    if (f.id === "cm-outros") { saveCv(Object.assign({}, C.cv, { outros: $("ot-text").value.trim() })).then(ok => { if (ok) { toast("Destaques salvos"); closeModal(); } }); return; }
    if (f.id === "cm-story") { submitStory(f); return; }
    if (f.id === "cm-action") { submitAction(); return; }
    if (f.id === "cm-train") { evalTrain($("tr-go")); return; }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && C.modal) { e.preventDefault(); closeModal(); } });

  function start() {
    if (C.started) { render(); return; }
    C.started = true;
    readCache();
    if (C.loadedAt) setStatus("Última leitura salva", "");
    render();
    loadFramework();
    initDb();
    getSample();
    load(false);
  }
  window.addEventListener("painel:carreira", start);
})();
