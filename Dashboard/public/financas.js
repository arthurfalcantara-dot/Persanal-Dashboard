/* ===================== Finanças (portado do painel do claude.ai) ===================== */
(() => {
  const NOTION = "Notion";
  const T_QUERY = "notion-query-data-sources";
  const T_FETCH = "notion-fetch";
  const T_CREATE = "notion-create-pages";
  const DS_ID = "e11b0f63-2167-82a3-836e-873a42b99943";
  const VIEW_URL = "https://www.notion.so/9e0b0f632167829ab437017a91bf14aa?v=3e6b0f63216781168060000c8a352b20";
  const CACHE_KEY = "painel-financas-rows-v1";
  const COLOR_KEY = "painel-financas-colors-v1";
  const DB_DOC = "painel/financas";
  const MONTHS = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

  // Hierarquia categoria › subcategoria (2026)
  const TAX26 = {
    "Renda": ["Bolsa Mestrado","Salário Pós Tributação","Aulas de Inglês","Retirado da Poupança","Ajuda Familiar","Rendimentos"],
    "Alimentação": ["Carne e Ovo","Suplementos","Compras de Mercado","Restaurante","Delivery","Supérfluos"],
    "Despesas_Casa": ["Aluguel","Condomínio","Energia","IPTU","Internet","Gás","Reformas","Móveis / Eletrodomésticos / Utensílios","Produtos de Limpeza","Imprevistos (Casa)"],
    "Academia_Esportes": ["Mensalidade Academia","Mensalidade Esportes","Acompanhamento Profissional","Nutricionista","Outros (Esportes)","Outros (Academia)"],
    "Transporte": ["Uber","Ônibus","Metrô","Ônibus (Viagem)","Avião","Outros (Transporte)"],
    "Tecnologia": ["Telefonia","Eletrônicos PC","Eletrônicos Celular","Outros (Eletrônicos)","Mensalidade (Eletrônicos)","Streamings"],
    "Lazer": ["Alimentação (Lazer)","Bebida (Lazer)","Transporte (Lazer)","Hospedagem (Lazer)","Cinema","Outros (Lazer)"],
    "Rolê_Festas": ["Bebida (Rolê)","Ingressos (Rolê)","Hospedagem (Rolê)","Alimentação (Rolê)","Transporte (Rolê)","Dates","Outros (Rolê)"],
    "Vestuário": ["Roupa de Sair","Roupa de Academia","Sapatos e Tênis","Acessórios","Outros (Vestuário)"],
    "Educação": ["Mensalidade Estudo","Escritório/Papelaria","Livro/Material","Eventos","Outros (Educação)"],
    "Higiene_Saúde": ["Remédios","Cabeleireiro","Produtos Higiene","Produtos Estética","Médico/Dentista","Outros (Higiene e Saúde)"],
    "Outros": ["Presentes","Imprevistos","Impressões","Ajuda","Comprados a Prazo"],
    "Carro": ["Combustível","Estacionamento","Imposto","Multa","Manutenção/Conserto"],
    "Impostos": ["Previdência Bradesco","Imposto de Renda"]
  };
  const CAT_LABEL = { "Despesas_Casa": "Casa", "Academia_Esportes": "Academia & esportes", "Rolê_Festas": "Rolê & festas", "Higiene_Saúde": "Higiene & saúde" };
  // Cores usadas até o esquema do Notion responder (espelham o Notion em set/2026)
  const FALLBACK_COLOR = { "Renda":"green","Alimentação":"orange","Despesas_Casa":"brown","Academia_Esportes":"red","Transporte":"blue","Tecnologia":"gray","Lazer":"yellow","Rolê_Festas":"pink","Vestuário":"purple","Educação":"default","Higiene_Saúde":"green","Outros":"default","Carro":"gray","Impostos":"red","Academia":"red","Rolê":"pink","Eletrônicos":"gray","Roupa":"purple","Higiene":"green","Contas":"brown" };
  const NOTION_COLORS = ["default","gray","brown","orange","yellow","green","blue","purple","pink","red"];
  // Anos anteriores: cada um tem a própria base no Notion e a própria hierarquia (como nas abas da planilha)
  const HIST = {
    2025: { view: "https://www.notion.so/3ecb0f6321678039b2c7ff3560567400?v=3ecb0f63216780178f46000c0c704a42", ds: "3ecb0f63-2167-8076-9d99-000b7669f58a", tax: {"Renda": ["Bolsa Mestrado", "Salário Pós Tributação", "Aulas de Inglês", "Retirado da Poupança", "Ajuda Familiar", "Rendimentos"], "Alimentação": ["Carne e Ovo", "Suplementos", "Compras de Mercado", "Restaurante", "Delivery", "Supérfluos"], "Despesas_Casa": ["Aluguel", "Condomínio", "Energia", "IPTU", "Internet", "Gás", "Reformas", "Móveis / Eletrodomésticos / Utensílios", "Produtos de Limpeza", "Imprevistos (Casa)"], "Academia_Esportes": ["Mensalidade Academia", "Mensalidade Esportes", "Acompanhamento Profissional", "Nutricionista", "Outros (Esportes)", "Outros (Academia)"], "Transporte": ["Uber", "Ônibus", "Metrô", "Ônibus (Viagem)", "Avião", "Outros (Transporte)"], "Tecnologia": ["Telefonia", "Eletrônicos PC", "Eletrônicos Celular", "Outros (Eletrônicos)", "Mensalidade (Eletrônicos)", "Streamings"], "Lazer": ["Alimentação (Lazer)", "Bebida (Lazer)", "Transporte (Lazer)", "Hospedagem (Lazer)", "Cinema", "Outros (Lazer)"], "Rolê_Festas": ["Bebida (Rolê)", "Ingressos (Rolê)", "Hospedagem (Rolê)", "Alimentação (Rolê)", "Transporte (Rolê)", "Dates", "Outros (Rolê)"], "Vestuário": ["Roupa de Sair", "Roupa de Academia", "Sapatos e Tênis", "Acessórios", "Outros (Vestuário)"], "Educação": ["Mensalidade Estudo", "Escritório/Papelaria", "Livro/Material", "Eventos", "Outros (Educação)"], "Higiene_Saúde": ["Remédios", "Cabeleireiro", "Produtos Higiene", "Produtos Estética", "Médico/Dentista", "Outros (Higiene e Saúde)"], "Outros": ["Presentes", "Imprevistos", "Impressões", "Ajuda", "Comprados a Prazo"], "Carro": ["Combustível", "Estacionamento", "Imposto", "Multa", "Manutenção/Conserto"], "Impostos": ["Previdência Bradesco", "Imposto de Renda"]} },
    2024: { view: "https://www.notion.so/3ecb0f6321678089855cf57c60603b3b?v=3ecb0f632167806c81ca000cca15f0a7", ds: "3ecb0f63-2167-8087-afab-000b953e235c", tax: {"Renda": ["Bolsa IC", "Salário Pós Tributação", "Aluguel", "Retirado da Poupança", "Ajuda Familiar", "Rendimentos"], "Alimentação": ["Supermercado (Dieta)", "Avulsos", "Restaurante", "Delivery", "Marmitas"], "Academia": ["Mensalidade Academia", "Suplementos", "Nutricionista", "Outros (Academia)"], "Carro": ["Combustível", "Estacionamento", "Imposto", "Multa", "Manutenção/Conserto"], "Transporte": ["Uber", "Ônibus", "Metrô", "Viagem Ônibus"], "Rolê": ["Bebida", "Ingresso Festa", "Hospedagem/Transporte", "Outros (Rolê)"], "Eletrônicos": ["Telefonia", "Eletrônicos PC", "Eletrônicos Celular", "Outros (Eletrônicos)"], "Roupa": ["Roupa Sair", "Roupa Academia", "Sapatos", "Outros (Roupa)"], "Educação": ["Mensalidade Estudo", "Escritório/Papelaria", "Livro/Material", "Eventos", "Outros (Educação)"], "Higiene": ["Remédios", "Cabeleireiro", "Produtos Higiene", "Produtos Estética", "Médico/Dentista", "Outros (Higiene e Saúde)"], "Lazer": ["Cinema", "Streaming", "Outros (Lazer)"], "Outros": ["Presentes", "Imprevistos", "Ajuda", "Comprados a Prazo"], "Contas": ["Previdência Bradesco", "Água", "Energia", "IPTU", "Internet", "Gás", "Despesas de Casa"]} },
    2023: { view: "https://www.notion.so/3ecb0f6321678000b425e8231b52992a?v=3ecb0f6321678024a6c4000cf12c2664", ds: "3ecb0f63-2167-805b-be25-000be942c5d2", tax: {"Renda": ["Bolsa IC", "Salário Pós Tributação", "Aluguel", "Retirado da Poupança", "Ajuda Familiar", "Rendimentos"], "Alimentação": ["Supermercado (Dieta)", "Avulsos", "Restaurante", "Delivery", "Marmitas"], "Academia": ["Mensalidade Academia", "Suplementos", "Nutricionista", "Outros (Academia)"], "Carro": ["Combustível", "Estacionamento", "Imposto", "Multa", "Manutenção/Conserto"], "Rolê": ["Bebida", "Ingresso Festa", "Hospedagem/Transporte", "Outros (Rolê)"], "Eletrônicos": ["Telefonia", "Eletrônicos PC", "Eletrônicos Celular", "Outros (Eletrônicos)"], "Roupa": ["Roupa Sair", "Roupa Academia", "Sapatos", "Outros (Roupa)"], "Educação": ["Mensalidade Estudo", "Escritório/Papelaria", "Livro/Material", "Eventos", "Outros (Educação)"], "Higiene": ["Remédios", "Cabeleireiro", "Produtos Higiene", "Produtos Estética", "Médico/Dentista", "Outros (Higiene e Saúde)"], "Lazer": ["Cinema", "Streaming", "Outros (Lazer)"], "Outros": ["Presentes", "Imprevistos", "Ajuda", "Comprados a Prazo"], "Impostos": ["Previdência Bradesco"]} },
  };
  const HIST_KEY = y => "painel-financas-hist-v1-" + y;
  let TAX = TAX26, PARENT = {}, EXP_CATS = [];
  function setTax(t) {
    TAX = t; PARENT = {};
    for (const [c, subs] of Object.entries(TAX)) for (const s of subs) PARENT[s] = c;
    EXP_CATS = Object.keys(TAX).filter(c => c !== "Renda");
  }
  setTax(TAX26);
  const catName = c => CAT_LABEL[c] || c;

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const fmt = v => brl.format(v), fmt0 = v => brl0.format(v);
  const bare0 = v => brl0.format(v).replace("R$", "").trim();
  const short = v => Math.abs(v) >= 1000 ? (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : Math.round(v).toString();
  const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const parseMoney = s => { const t = String(s || "").trim().replace(/[R$\s]/g, ""); if (!t) return NaN; const n = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t; return Number(n); };
  const sum = a => a.reduce((x, y) => x + y, 0);
  const $ = id => document.getElementById(id);

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const state = {
    rows: [], year: today.getFullYear(), month: today.getMonth(), loadedAt: null, sub: "resumo",
    openCats: new Set(), openMatrix: new Set(), config: null, db: null, mcp: null,
    colors: { cat: {}, sub: {} }, main: [], hist: {},
    ann: { mode: "exp", drill: null, hidden: new Set() },
    led: { period: "month", kind: "all", cat: "", sub: "", q: "", limit: 80 },
    entryKind: "exp",
  };

  // ---------- cores (do Notion) ----------
  const curColors = () => HIST[state.year] ? (state.hist[state.year]?.colors || { cat: {}, sub: {} }) : state.colors;
  function colorName(cat) {
    const C = curColors();
    let c = C.cat[cat];
    if (!c || c === "default") {
      const tally = {};
      for (const s of TAX[cat] || []) { const sc = C.sub[s]; if (sc && sc !== "default") tally[sc] = (tally[sc] || 0) + 1; }
      const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      c = best ? best[0] : (c || FALLBACK_COLOR[cat] || "default");
    }
    return NOTION_COLORS.includes(c) ? c : "default";
  }
  // Cores próprias do painel por categoria (o Notion só tem 10 cores e a API não deixa recolorir opções existentes)
  const CAT_KEY = { "Renda":"renda", "Alimentação":"alim", "Despesas_Casa":"casa", "Contas":"casa", "Academia_Esportes":"acad", "Academia":"acad",
    "Rolê_Festas":"role", "Rolê":"role", "Lazer":"lazer", "Higiene_Saúde":"hig", "Higiene":"hig", "Transporte":"transp", "Carro":"carro",
    "Tecnologia":"tec", "Eletrônicos":"tec", "Vestuário":"vest", "Roupa":"vest", "Educação":"edu", "Impostos":"imp", "Outros":"outros" };
  const ICON = {
    renda: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    alim: '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>',
    casa: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    acad: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    role: '<path d="M8 22h8M12 12v10M3 3h18l-9 9z"/><path d="M7.5 7.5h9"/>',
    lazer: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v2M14 11v2M14 16v2"/>',
    hig: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/><path d="M12 9v6M9 12h6"/>',
    transp: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 18v3M16 18v3M8 14.5h.01M16 14.5h.01"/>',
    carro: '<path d="M5 17H3v-5l2.5-5h13l2.5 5v5h-2"/><path d="M3 12h18M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    tec: '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    vest: '<path d="M20.4 6.6 16 3a4 4 0 0 1-8 0L3.6 6.6 6 10l2-1v12h8V9l2 1z"/>',
    edu: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    imp: '<path d="M5 2v20l2.5-1.5L10 22l2-1.5 2 1.5 2.5-1.5L19 22V2l-2.5 1.5L14 2l-2 1.5L10 2 7.5 3.5z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    outros: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  };
  // marcador de categoria: ícone na cor da categoria; subcategorias e itens sem ícone usam o quadradinho
  const catMark = (cat, color) => CAT_KEY[cat] ? `<span class="ci" style="--c:${color || catColor(cat)}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICON[CAT_KEY[cat]]}</svg></span>` : `<i class="sw" style="--c:${color}"></i>`;
  const catColor = cat => CAT_KEY[cat] ? `var(--k-${CAT_KEY[cat]})` : `var(--n-${colorName(cat)})`;
  const shade = (color, i, n) => { const p = n <= 1 ? 100 : Math.round(100 - i * (55 / (n - 1))); return p >= 100 ? color : `color-mix(in oklab, ${color} ${p}%, var(--surface))`; };
  // Tom fixo por subcategoria (posição na hierarquia), igual em gráficos, tabela e extrato
  const subColor = (cat, sub) => { const order = TAX[cat] || []; const i = order.indexOf(sub); return i < 0 ? "var(--muted)" : shade(catColor(cat), i, order.length); };

  function parseSchemaText(p) {
    const txt = typeof p === "string" ? p : (p && typeof p.text === "string" ? p.text : JSON.stringify(p || ""));
    const m = txt.match(/<data-source-state>\s*([\s\S]*?)\s*<\/data-source-state>/);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch { return null; }
  }
  async function loadColors(mcp) {
    try {
      const res = await mcp.callTool(NOTION, T_FETCH, { id: "collection://" + DS_ID }, { cache: { staleTime: 300000, gcTime: 86400000 } });
      const st = parseSchemaText(res.payload ?? res.content?.[0]?.text);
      const schema = st && st.schema;
      if (!schema) return;
      const cat = {}, sub = {};
      for (const o of schema.Category?.options || []) cat[o.name] = o.color;
      for (const o of schema.Subcategory?.options || []) sub[o.name] = o.color;
      state.colors = { cat, sub };
      try { localStorage.setItem(COLOR_KEY, JSON.stringify(state.colors)); } catch {}
      render();
    } catch { /* mantém as cores de reserva */ }
  }

  // ---------- storage (conveniência por navegador) ----------
  function readCache() { try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); return c && Array.isArray(c.rows) ? c : null; } catch { return null; } }
  function writeCache() { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ rows: state.main, loadedAt: state.loadedAt })); } catch {} }

  // ---------- Notion: leitura ----------
  function normalize(r, origemPadrao) {
    const d = r["date:Date:start"];
    if (!d || r["Ignorar no painel"] === "__YES__") return null;
    return { name: r.Name || "(sem nome)", d: d.slice(0, 10), a: Number(r.Amount) || 0, cat: r.Category || null, sub: r.Subcategory || null, url: r.url || null, origem: r.Origem || origemPadrao || "Shortcut", pay: r["Payment Method"] || "" };
  }
  function errorCopy(e) {
    switch (e && e.code) {
      case "needs_reauth": return "O Notion recusou o token do app. Confira NOTION_TOKEN no Cloudflare.";
      case "server_not_connected": return "O servidor do app não tem NOTION_TOKEN configurado.";
      case "selection_required": return "Você tem mais de uma conexão do Notion. Escolha qual este painel deve usar quando o claude.ai perguntar.";
      case "not_in_manifest": case "consent_required": return "A integração Painel não tem acesso a esta base do Notion. No Notion, abra a base de finanças → ••• → Conexões → adicione Painel.";
      case "blocked_by_policy": case "approval_required": return "A política da sua organização bloqueou o acesso deste painel ao Notion.";
      case "server_unavailable": return "O Notion não respondeu agora. Tente Atualizar em alguns segundos.";
      case "tool_error": return "O Notion recusou a operação: " + (e.message || "sem detalhe") + ".";
      default: return "Não consegui falar com o Notion (" + ((e && e.code) || "erro") + "). Tente Atualizar.";
    }
  }
  async function readWithRetry(mcp, tool, input, opts) {
    try { return await mcp.callTool(NOTION, tool, input, opts); }
    catch (e) {
      if (e && e.retryable) { await new Promise(r => setTimeout(r, (e.retryAfterMs || 1200) + Math.random() * 600)); return await mcp.callTool(NOTION, tool, input, opts); }
      throw e;
    }
  }

  // ---------- meses revisados: cópia fixa no db do painel ----------
  // Lançamentos até config.revisadoAte não mudam mais: ficam em financas_snap (um doc por mês)
  // e o Notion só é lido do mês seguinte em diante.
  const SNAP = "financas_snap";
  const ddmmyy = s => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
  let dbReady; const dbWait = new Promise(r => { dbReady = r; });
  const revisadoAte = () => (state.config && typeof state.config.revisadoAte === "string") ? state.config.revisadoAte : null;
  const pack = r => [r.name, r.d, r.a, r.cat, r.sub, r.url, r.origem, r.pay];
  const unpack = a => ({ name: a[0], d: a[1], a: a[2], cat: a[3], sub: a[4], url: a[5], origem: a[6], pay: a[7] });
  async function snapRead(src) {
    const db = await dbWait; if (!db) return null;
    try {
      const q = await db.collection(SNAP).where("src", "==", src).limit(200).get();
      let meta = null; const rows = [];
      for (const d of q.docs) { const x = d.data(); if (x.meta) meta = x; else if (Array.isArray(x.rows)) for (const a of x.rows) rows.push(unpack(a)); }
      return meta ? { meta, rows } : null;
    } catch { return null; }
  }
  async function snapWrite(src, rows, meta) {
    const db = await dbWait; if (!db) return;
    const months = {};
    for (const r of rows) (months[r.d.slice(0, 7)] ||= []).push(pack(r));
    try {
      const old = await db.collection(SNAP).where("src", "==", src).limit(200).get();
      for (const d of old.docs) if (!d.data().meta && !months[d.data().mes]) await db.doc(`${SNAP}/${d.id}`).delete();
      for (const [mes, rs] of Object.entries(months)) await db.doc(`${SNAP}/${src}-${mes}`).set({ src, mes, rows: rs });
      await db.doc(`${SNAP}/${src}-meta`).set(Object.assign({ src, meta: true, count: rows.length, savedAt: Date.now() }, meta));
    } catch { /* sem permissão de escrita: segue lendo do Notion */ }
  }
  async function readView(mcp, view, stopAt, onPage) {
    const out = []; let cursor = null, page = 0;
    do {
      const input = { data: { mode: "view", view_url: view, page_size: 100 } };
      if (cursor) input.data.start_cursor = cursor;
      const res = await readWithRetry(mcp, T_QUERY, input, { cache: { staleTime: 30000 } });
      let p = res.payload;
      if (typeof p === "string") { try { p = JSON.parse(p); } catch { p = null; } }
      if (!p || !Array.isArray(p.results)) throw { code: "tool_error", message: "resposta em formato inesperado; confira se a view “Painel (não editar)” ainda existe" };
      let reached = false;
      for (const r of p.results) { const n = normalize(r, onPage.origem); if (!n) continue; if (stopAt && n.d <= stopAt) { reached = true; continue; } out.push(n); }
      cursor = p.has_more && !reached ? p.next_cursor : null; page++;
      onPage(out.length);
    } while (cursor && page < 60);
    return out;
  }

  let loading = false;
  async function load(force, full) {
    if (loading) return;
    loading = true; $("refresh").disabled = true;
    setStatus("Lendo o Notion…", "");
    try {
      const mcp = state.mcp || await window.claude?.use?.("mcp");
      if (!mcp) {
        setStatus(state.rows.length ? "Última leitura salva" : "Sem conexão com o Notion", "warn");
        showBanner("Entre no app para ler e gravar no Notion." + (state.rows.length ? " Mostrando a última leitura salva neste aparelho." : ""));
        return;
      }
      state.mcp = mcp;
      if (force) { try { await mcp.invalidate(NOTION, T_QUERY); } catch {} }
      await dbWait; await configWait;
      const cut = revisadoAte();
      const snap = cut && !full ? await snapRead("main") : null;
      const useSnap = snap && snap.meta.ate === cut;
      const tick = n => setStatus(`Lendo o Notion… ${n} lançamentos${useSnap ? " novos" : ""}`, "");
      const fresh = await readView(mcp, VIEW_URL, useSnap ? cut : null, tick);
      let out, recentes = fresh.length;
      if (useSnap) out = snap.rows.concat(fresh);
      else {
        out = fresh;
        recentes = cut ? fresh.filter(r => r.d > cut).length : fresh.length;
        if (cut) snapWrite("main", fresh.filter(r => r.d <= cut), { ate: cut });
      }
      state.main = out; if (!HIST[state.year]) state.rows = out;
      state.loadedAt = Date.now(); writeCache(); hideBanner();
      const hora = new Date(state.loadedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      if (!HIST[state.year]) setStatus(cut ? `Notion · ${recentes} lançamentos após ${ddmmyy(cut)} · revisados salvos · ${hora}` : `Notion · ${out.length} lançamentos · ${hora}`, "live");
      render();
      loadColors(mcp);
    } catch (e) {
      const deny = ["needs_reauth", "server_not_connected", "not_in_manifest", "blocked_by_policy", "approval_required", "consent_required"].includes(e && e.code);
      if (deny) { state.rows = []; state.main = []; state.hist = {}; try { localStorage.removeItem(CACHE_KEY); for (const y in HIST) localStorage.removeItem(HIST_KEY(y)); } catch {} render(); }
      setStatus(deny ? "Notion desconectado" : (state.rows.length ? "Mostrando a última leitura" : "Falha ao ler o Notion"), "err");
      showBanner(errorCopy(e));
    } finally { loading = false; $("refresh").disabled = false; }
  }
  // anos anteriores (base própria por ano, lida só quando o ano é aberto)
  const histLoading = {};
  async function loadHist(y, force) {
    const H = HIST[y]; if (!H || histLoading[y]) return;
    histLoading[y] = true;
    if (!force) {
      const s = await snapRead("h" + y);
      if (s) {
        state.hist[y] = { rows: s.rows, loadedAt: Date.now(), colors: s.meta.colors || state.hist[y]?.colors || { cat: {}, sub: {} } };
        try { localStorage.setItem(HIST_KEY(y), JSON.stringify(state.hist[y])); } catch {}
        histLoading[y] = false;
        if (+state.year === +y) setStatus(`${y} · ${s.rows.length} lançamentos revisados`, "live");
        render(); return;
      }
    }
    if (+state.year === +y) setStatus(`Lendo ${y} no Notion…`, "");
    try {
      const mcp = state.mcp || await window.claude?.use?.("mcp");
      if (!mcp) { if (+state.year === +y) { setStatus(state.hist[y] ? "Última leitura salva" : "Sem conexão com o Notion", "warn"); showBanner("Entre no app para ler os anos anteriores no Notion."); } return; }
      state.mcp = mcp;
      if (force) { try { await mcp.invalidate(NOTION, T_QUERY); } catch {} }
      const tick = n => { if (+state.year === +y) setStatus(`Lendo ${y}… ${n} lançamentos`, ""); };
      tick.origem = "Planilha";
      const out = await readView(mcp, H.view, null, tick);
      const prev = state.hist[y] || {};
      state.hist[y] = { rows: out, loadedAt: Date.now(), colors: prev.colors || { cat: {}, sub: {} } };
      snapWrite("h" + y, out, {});
      try { localStorage.setItem(HIST_KEY(y), JSON.stringify(state.hist[y])); } catch {}
      histLoading[y] = false;
      hideBanner(); render();
      try {
        const res = await mcp.callTool(NOTION, T_FETCH, { id: "collection://" + H.ds }, { cache: { staleTime: 3600000, gcTime: 86400000 } });
        const st = parseSchemaText(res.payload ?? res.content?.[0]?.text), schema = st && st.schema;
        if (schema) {
          const cat = {}, sub = {};
          for (const o of schema.Category?.options || []) cat[o.name] = o.color;
          for (const o of schema.Subcategory?.options || []) sub[o.name] = o.color;
          state.hist[y].colors = { cat, sub };
          try { localStorage.setItem(HIST_KEY(y), JSON.stringify(state.hist[y])); } catch {}
          try { const db = await dbWait; if (db) await db.doc(`${SNAP}/h${y}-meta`).update({ colors: { cat, sub } }); } catch {}
          render();
        }
      } catch {}
    } catch (e) {
      if (+state.year === +y) { setStatus(state.hist[y] ? "Mostrando a última leitura" : `Falha ao ler ${y}`, "err"); showBanner(errorCopy(e)); }
    } finally { histLoading[y] = false; }
  }
  function applyYear() {
    const H = HIST[state.year];
    setTax(H ? H.tax : TAX26);
    if (H) {
      if (!state.hist[state.year]) { try { const c = JSON.parse(localStorage.getItem(HIST_KEY(state.year)) || "null"); if (c && Array.isArray(c.rows)) state.hist[state.year] = c; } catch {} }
      const cur = state.hist[state.year];
      state.rows = cur ? cur.rows : [];
      if (cur && !histLoading[state.year]) setStatus(`${state.year} · ${cur.rows.length} lançamentos revisados`, "live");
      if (!cur) loadHist(state.year);
    } else {
      state.rows = state.main;
      if (state.loadedAt && !loading) setStatus(`Notion · ${state.main.length} lançamentos · ${new Date(state.loadedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, "live");
    }
    const entryCard = $("entry").closest("section");
    if (entryCard) { if (entryCard.hidden && !H) { entryCard.hidden = false; syncEntry(); } else entryCard.hidden = !!H; }
  }

  // conectado: só a bolinha verde e o horário da leitura (o texto completo fica na dica ao passar o mouse)
  function setStatus(text, kind) { const s = $("status"), hm = kind === "live" && (text.match(/\b\d{1,2}:\d{2}\b/) || [])[0]; s.textContent = hm || text; s.title = text; s.className = "pill" + (kind ? " " + kind : "") + (hm ? " compact" : ""); }
  function showBanner(t) { const b = $("banner"); b.innerHTML = "<strong>Atenção</strong><span>" + esc(t) + "</span>"; b.hidden = false; }
  function hideBanner() { $("banner").hidden = true; }
  let toastTimer;
  function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3200); }

  // ---------- db: metas e saldo inicial ----------
  let configReady; const configWait = new Promise(r => { configReady = r; });
  async function initDb() {
    const db = await window.claude?.use?.("db");
    dbReady(db || null);
    if (!db) { configReady(); $("goals-hint").textContent = "Entre no app para salvar metas."; renderGoals(); return; }
    state.db = db; $("add-goal").hidden = false; $("edit-start").hidden = false; $("edit-budget").hidden = false;
    db.doc(DB_DOC).onSnapshot(snap => { state.config = snap.exists ? snap.data() : { saldoInicial: {}, metas: [] }; configReady(); render(); },
      () => { configReady(); state.db = null; $("add-goal").hidden = true; $("edit-start").hidden = true; $("edit-budget").hidden = true; renderGoals(); });
  }
  async function saveConfig(patch) {
    if (!state.db) return;
    const next = Object.assign({ saldoInicial: {}, metas: [] }, JSON.parse(JSON.stringify(state.config || {})), patch);
    try { await state.db.doc(DB_DOC).set(next); toast("Salvo"); }
    catch (e) { showBanner(e && e.code === "invalid_argument" ? "Você pode ver as metas, mas não editar: peça acesso de Colaborador ao dono do painel." : "Não consegui salvar agora. Tente de novo em instantes."); }
  }

  // ---------- agregação ----------
  function yearsAvailable() { const ys = new Set(state.main.map(r => +r.d.slice(0, 4))); ys.add(today.getFullYear()); for (const y in HIST) ys.add(+y); return [...ys].sort((a, b) => b - a); }
  function aggregate(year) {
    const inc = Array(12).fill(0), exp = Array(12).fill(0), cat = {}, issues = [];
    for (const r of state.rows) {
      if (+r.d.slice(0, 4) !== year) continue;
      const m = +r.d.slice(5, 7) - 1, c = r.cat || "Sem categoria";
      if (c === "Renda") inc[m] += r.a; else exp[m] += r.a;
      const node = cat[c] || (cat[c] = { m: Array(12).fill(0), subs: {} });
      node.m[m] += r.a;
      const ok = r.sub && PARENT[r.sub] === r.cat;
      const sk = ok ? r.sub : "Sem subcategoria";
      (node.subs[sk] || (node.subs[sk] = Array(12).fill(0)))[m] += r.a;
      if (!ok) issues.push(r);
    }
    return { inc, exp, cat, issues };
  }
  const subOrder = (cat, node) => Object.keys(node.subs).sort((a, b) => sum(node.subs[b]) - sum(node.subs[a]));
  const isFuture = (y, m) => y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth());
  // Saldo inicial: o valor salvo para o ano ou, se não houver, o fluxo de caixa final do ano anterior
  function rowsOfYear(y) {
    if (HIST[y]) {
      let c = state.hist[y];
      if (!c) { try { const x = JSON.parse(localStorage.getItem(HIST_KEY(y)) || "null"); if (x && Array.isArray(x.rows)) c = state.hist[y] = x; } catch {} }
      if (!c) { loadHist(y); return null; }
      return c.rows;
    }
    return state.main.filter(r => +r.d.slice(0, 4) === y);
  }
  const explicitStart = y => { const v = state.config?.saldoInicial?.[String(y)]; return v === undefined || v === null || v === "" ? null : Number(v); };
  function startInfo(y, depth = 0) {
    const e = explicitStart(y);
    if (e !== null && isFinite(e)) return { v: e, from: null };
    const prev = y - 1;
    if (depth > 6 || !(HIST[prev] || state.main.some(r => +r.d.slice(0, 4) === prev))) return { v: 0, from: null };
    const rows = rowsOfYear(prev);
    if (!rows) return { v: 0, from: prev, pending: true };
    const p = startInfo(prev, depth + 1);
    let net = 0; for (const r of rows) net += r.cat === "Renda" ? r.a : -r.a;
    return { v: Math.round((p.v + net) * 100) / 100, from: prev, pending: p.pending };
  }
  const startBalance = () => startInfo(state.year).v;
  const startNote = () => { const s = startInfo(state.year); return s.pending ? ` (calculando a partir de ${s.from}…)` : s.from ? ` (fim de ${s.from})` : ""; };
  function niceMax(v) { if (v <= 0) return 1000; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }

  // ---------- render ----------
  function render() {
    const years = yearsAvailable();
    if (!years.includes(state.year)) state.year = years[0];
    applyYear();
    $("year").innerHTML = years.map(y => `<option value="${y}"${y === state.year ? " selected" : ""}>${y}</option>`).join("");
    $("title").textContent = "Finanças " + state.year;
    $("months").innerHTML = MONTHS.map((n, i) => `<button class="month${isFuture(state.year, i) ? " future" : ""}" data-m="${i}" aria-pressed="${i === state.month}">${n}</button>`).join("");
    // no celular a fila de meses desliza: mantém o mês escolhido à vista
    { const mb = $("months"), sel = mb.querySelector('[aria-pressed="true"]'); if (sel && mb.scrollWidth > mb.clientWidth) mb.scrollLeft = sel.offsetLeft - mb.offsetLeft - (mb.clientWidth - sel.offsetWidth) / 2; }
    const A = aggregate(state.year);
    if (state.sub === "resumo") {
      renderKpis(A); renderBars(A); renderFlow(A);
      renderCatCard(A, "exp"); renderCatCard(A, "inc"); renderIncExtra(A);
      renderAnnual(A); renderMatrix(A); renderGoals(); renderIssues(A);
    } else {
      renderLedger();
    }
    $("extrato-count").textContent = state.rows.length ? `· ${state.rows.filter(r => +r.d.slice(0, 4) === state.year).length}` : "";
  }

  function deltaHtml(cur, prev, higherIsGood) {
    if (!prev) return "";
    const pct = (cur - prev) / Math.abs(prev) * 100;
    if (!isFinite(pct)) return "";
    const good = (pct >= 0) === higherIsGood;
    return `<span class="delta ${good ? "good" : "bad"}">${pct >= 0 ? "↑" : "↓"} ${Math.abs(pct).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%</span><span>vs ${MONTHS[state.month - 1]}</span>`;
  }
  function renderKpis(A) {
    const m = state.month, inc = A.inc[m], exp = A.exp[m], net = inc - exp;
    let bal = startBalance(); for (let i = 0; i <= m; i++) bal += A.inc[i] - A.exp[i];
    const fut = isFuture(state.year, m) ? " · previsto" : "", sk = state.rows.length ? "" : " skeleton";
    $("kpis").innerHTML = `
      <div class="kpi"><span class="label"><i class="ic" data-i="in" style="--c:var(--inc)"></i>Receita · ${MONTHS[m]}${fut}</span><span class="value${sk}" style="color:var(--inc)">${fmt(inc)}</span><span class="sub">${m > 0 ? deltaHtml(inc, A.inc[m - 1], true) : ""}</span></div>
      <div class="kpi"><span class="label"><i class="ic" data-i="out" style="--c:var(--exp)"></i>Despesa · ${MONTHS[m]}${fut}</span><span class="value${sk}" style="color:var(--exp)">${fmt(exp)}</span><span class="sub">${m > 0 ? deltaHtml(exp, A.exp[m - 1], false) : ""}</span></div>
      <div class="kpi"><span class="label"><i class="ic" data-i="balance"></i>Saldo do mês</span><span class="value${sk}" style="color:${net < 0 ? "var(--bad)" : "var(--good)"}">${fmt(net)}</span><span class="sub">No ano até ${MONTHS[m]}: ${fmt0(sum(A.inc.slice(0, m + 1)) - sum(A.exp.slice(0, m + 1)))}</span></div>
      <div class="kpi"><span class="label"><i class="ic" data-i="wallet"></i><span class="t-f">Fluxo de caixa ao fim de ${MONTHS[m]}</span><span class="t-s">Caixa fim ${MONTHS[m]}</span></span><span class="value${sk}">${fmt(bal)}</span><span class="sub">${startBalance() ? `<span class="t-f">Saldo inicial ${fmt0(startBalance())}${startNote()}</span><span class="t-s">Início ${fmt0(startBalance())}</span>` : "Defina o saldo inicial do ano"}</span></div>`;
  }

  function placeTip(tip, svg, W, xv, yv) {
    const r = svg.getBoundingClientRect(), sx = r.width / W;
    tip.hidden = false;
    const half = tip.offsetWidth / 2 + 4;
    tip.style.left = Math.min(Math.max(xv * sx, half), r.width - half) + "px";
    tip.style.top = Math.max(yv * sx, tip.offsetHeight + 12) + "px";
  }

  // números do ano abaixo do gráfico de barras (até o mês atual; meses futuros só entram se já tiverem lançamentos)
  function renderYearStats(A) {
    const y = state.year, last = y < today.getFullYear() ? 11 : y > today.getFullYear() ? -1 : today.getMonth();
    const box = $("bars-stats");
    if (last < 0 || !(sum(A.inc) || sum(A.exp))) { box.innerHTML = ""; return; }
    const idx = [...Array(last + 1).keys()];
    const inc = sum(idx.map(i => A.inc[i])), exp = sum(idx.map(i => A.exp[i])), net = inc - exp;
    const nets = idx.map(i => ({ i, v: A.inc[i] - A.exp[i] })).filter(o => A.inc[o.i] || A.exp[o.i]);
    const best = nets.slice().sort((a, b) => b.v - a.v)[0], worst = nets.slice().sort((a, b) => a.v - b.v)[0];
    const neg = nets.filter(o => o.v < 0).length;
    const per = last === 0 ? "JAN" : `JAN–${MONTHS[last]}`;
    const tile = (ic, l, v, s, col) => `<div class="ystat"><span class="l"><i class="ic" data-i="${ic}"></i>${l}</span><span class="v"${col ? ` style="color:${col}"` : ""}>${v}</span><span class="s">${s}</span></div>`;
    box.innerHTML = tile("in", `Receita ${per}`, fmt0(inc), `média ${fmt0(inc / (last + 1))}/mês`, "var(--inc)")
      + tile("out", `Despesa ${per}`, fmt0(exp), `média ${fmt0(exp / (last + 1))}/mês`, "var(--exp)")
      + tile("balance", `Saldo ${per}`, fmt0(net), inc > 0 ? (net >= 0 ? `${Math.round(net / inc * 100)}% da receita guardada` : `gastou ${Math.round(-net / inc * 100)}% a mais que recebeu`) : "", net < 0 ? "var(--bad)" : "var(--good)")
      + (best ? tile("trend", "Melhor e pior mês", `${MONTHS[best.i]} ${fmt0(best.v)}`, `pior: ${MONTHS[worst.i]} ${fmt0(worst.v)} · ${neg} ${neg === 1 ? "mês" : "meses"} no vermelho`) : "");
  }
  function renderBars(A) {
    renderYearStats(A);
    const W = 640, H = 250, L = 46, R = 8, T = 12, B = 28;
    const max = 7000; // escala fixa: teto de R$ 7.000; barras acima disso são cortadas no topo
    const iw = (W - L - R) / 12, bw = Math.min(16, iw * 0.3);
    const y = v => T + (H - T - B) * (1 - Math.min(v, max) / max);
    let g = "";
    for (let k = 0; k <= 7; k++) { const v = 1000 * k, yy = y(v); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${L - 8}" y="${yy + 4}" text-anchor="end">${short(v)}</text>`; }
    let bars = "";
    for (let i = 0; i < 12; i++) {
      const cx = L + iw * i + iw / 2, fut = isFuture(state.year, i), sel = i === state.month;
      if (sel) bars += `<rect x="${L + iw * i + 2}" y="${T - 6}" width="${iw - 4}" height="${H - T - B + 6}" rx="8" style="fill:var(--surface-2)"/>`;
      [[A.inc[i], "var(--inc)", cx - bw - 1], [A.exp[i], "var(--exp)", cx + 1]].forEach(([v, c, x]) => {
        if (v <= 0) return;
        const yy = y(v), h = Math.max(1, H - B - yy), rr = Math.min(4, h);
        const d = `M${x},${H - B} V${yy + rr} q0,-${rr} ${rr},-${rr} h${bw - 2 * rr} q${rr},0 ${rr},${rr} V${H - B}`;
        bars += fut ? `<path d="${d}" style="fill:${c};fill-opacity:.16;stroke:${c}" stroke-width="1.2" stroke-dasharray="3 2"/>` : `<path d="${d}" style="fill:${c}"/>`;
        if (v > max) bars += `<path d="M${x - 1},${T + 7} l${bw / 2 + 1},-4 l${bw / 2 + 1},4" fill="none" stroke="var(--surface)" stroke-width="2"/>`;
      });
      bars += `<text x="${cx}" y="${H - 8}" text-anchor="middle" class="${sel ? "sel-label" : ""}">${MONTHS[i]}</text>`;
      bars += `<rect class="hit" data-m="${i}" x="${L + iw * i}" y="0" width="${iw}" height="${H}" style="fill:transparent;cursor:pointer"/>`;
    }
    $("bars").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Receita e despesa por mês em ${state.year}">${g}<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="var(--line-strong)"/>${bars}</svg><div class="tip" hidden></div>`;
    const svg = $("bars").querySelector("svg"), tip = $("bars").querySelector(".tip");
    svg.querySelectorAll(".hit").forEach(h => {
      const i = +h.dataset.m;
      h.addEventListener("mouseenter", () => {
        tip.innerHTML = `<b>${MONTHS[i]} ${state.year}${isFuture(state.year, i) ? " · previsto" : ""}</b><div class="row"><span><i style="--c:var(--inc)"></i>Receita</span><span>${fmt(A.inc[i])}</span></div><div class="row"><span><i style="--c:var(--exp)"></i>Despesa</span><span>${fmt(A.exp[i])}</span></div><div class="row tot"><span>Saldo</span><span>${fmt(A.inc[i] - A.exp[i])}</span></div>`;
        placeTip(tip, svg, W, L + iw * i + iw / 2, y(Math.max(A.inc[i], A.exp[i])));
      });
      h.addEventListener("mouseleave", () => { tip.hidden = true; });
      h.addEventListener("click", () => { state.month = i; render(); });
    });
  }

  // base da projeção (quantos meses fechados entram na média): preferência deste navegador
  let projN = 4; try { const v = +localStorage.getItem("painel-proj-n"); if (v >= 1 && v <= 12) projN = v; } catch {}
  let flowA = null;
  $("proj-n").addEventListener("input", e => { projN = +e.target.value; try { localStorage.setItem("painel-proj-n", String(projN)); } catch {} if (flowA) renderFlow(flowA); });
  function renderFlow(A) {
    flowA = A;
    const W = 460, H = 250, L = 52, R = 14, T = 16, B = 28;
    const pts = []; let bal = startBalance();
    for (let i = 0; i < 12; i++) { bal += A.inc[i] - A.exp[i]; pts.push(bal); }
    const lo = Math.min(0, ...pts, startBalance()), hi = Math.max(...pts, startBalance(), 1);
    const min = lo < 0 ? -niceMax(-lo) : 0, max = niceMax(hi);
    const x = i => L + (W - L - R) * (i / 11), y = v => T + (H - T - B) * (1 - (v - min) / (max - min));
    let g = "";
    for (let k = 0; k <= 4; k++) { const v = min + (max - min) * k / 4, yy = y(v); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${L - 8}" y="${yy + 4}" text-anchor="end">${short(v)}</text>`; }
    const lastPast = state.year < today.getFullYear() ? 11 : state.year > today.getFullYear() ? -1 : today.getMonth();
    const past = pts.slice(0, lastPast + 1), fut = pts.slice(Math.max(lastPast, 0));
    const line = (arr, off) => arr.map((v, k) => `${k ? "L" : "M"}${x(k + off).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    let paths = "";
    if (past.length) paths += `<path d="${line(past, 0)} L${x(past.length - 1)},${y(min)} L${x(0)},${y(min)} Z" style="fill:var(--ink);fill-opacity:.06"/><path d="${line(past, 0)}" style="fill:none;stroke:var(--ink)" stroke-width="2" stroke-linejoin="round"/>`;
    if (fut.length > 1) paths += `<path d="${line(fut, Math.max(lastPast, 0))}" style="fill:none;stroke:var(--ink-2)" stroke-width="1.8" stroke-dasharray="4 4"/>`;
    const sm = state.month;
    paths += `<line x1="${x(sm)}" x2="${x(sm)}" y1="${T}" y2="${H - B}" stroke="var(--line-strong)" stroke-dasharray="2 3"/><circle cx="${x(sm)}" cy="${y(pts[sm])}" r="5" style="fill:${pts[sm] < 0 ? "var(--bad)" : "var(--ink)"};stroke:var(--surface)" stroke-width="2"/>`;
    // projeção: média do saldo mensal dos últimos meses fechados (até 3), a partir do fim do último mês fechado
    const proj = (() => {
      if (state.year !== today.getFullYear() || !startBalance()) return null;
      const lc = today.getMonth() - 1; if (lc < 0) return null;
      const n = Math.min(projN, lc + 1); let s = 0;
      for (let i = lc - n + 1; i <= lc; i++) s += A.inc[i] - A.exp[i];
      const avg = s / n, base = pts[lc];
      return { lc, n, avg, base, k: base <= 0 ? 0 : avg >= 0 ? null : Math.ceil(base / -avg) };
    })();
    const ctl = $("proj-ctl"); ctl.hidden = !proj;
    if (proj) { const inp = $("proj-n"); inp.max = String(proj.lc + 1); inp.value = String(Math.min(projN, proj.lc + 1)); $("proj-n-v").textContent = `${proj.n} ${proj.n === 1 ? "mês" : "meses"} (${proj.n === 1 ? MONTHS[proj.lc] : MONTHS[proj.lc - proj.n + 1] + "–" + MONTHS[proj.lc]})`; }
    const projLabel = k => { const idx = proj.lc + k, yy = state.year + Math.floor(idx / 12); return `${MONTHS[idx % 12].toLowerCase()}/${yy}`; };
    if (proj && proj.k) {
      const e = proj.lc + proj.base / -proj.avg;
      if (e <= 11) {
        paths += `<path d="M${x(proj.lc).toFixed(1)},${y(proj.base).toFixed(1)} L${x(e).toFixed(1)},${y(0).toFixed(1)}" style="fill:none;stroke:var(--bad)" stroke-width="1.6" stroke-dasharray="2 4" stroke-linecap="round"/><circle cx="${x(e).toFixed(1)}" cy="${y(0).toFixed(1)}" r="4" style="fill:var(--surface);stroke:var(--bad)" stroke-width="2"/><text x="${Math.min(x(e), W - R - 40).toFixed(1)}" y="${(y(0) - 10).toFixed(1)}" text-anchor="middle" style="fill:var(--bad);font-weight:600">R$ 0 · ${projLabel(proj.k)}</text>`;
      } else {
        const ve = proj.base + proj.avg * (11 - proj.lc);
        paths += `<path d="M${x(proj.lc).toFixed(1)},${y(proj.base).toFixed(1)} L${x(11).toFixed(1)},${y(ve).toFixed(1)}" style="fill:none;stroke:var(--bad)" stroke-width="1.6" stroke-dasharray="2 4" stroke-linecap="round"/><text x="${(W - R).toFixed(1)}" y="${(y(ve) - 10).toFixed(1)}" text-anchor="end" style="fill:var(--bad);font-weight:600">R$ 0 em ${projLabel(proj.k)} →</text>`;
      }
    }
    let labels = "";
    for (let i = 0; i < 12; i++) if (i % 2 === 0 || i === sm) labels += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="${i === sm ? "sel-label" : ""}">${MONTHS[i]}</text>`;
    const zero = min < 0 ? `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--bad)" stroke-opacity=".5"/>` : "";
    $("flow").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Fluxo de caixa acumulado">${g}${zero}${paths}${labels}<rect class="hit" x="${L}" y="0" width="${W - L - R}" height="${H}" style="fill:transparent;cursor:pointer"/></svg><div class="tip" hidden></div>`;
    $("flow-hint").textContent = startBalance() ? `Começa em ${fmt0(startBalance())}${startInfo(state.year).from ? ", o fluxo de caixa final de " + startInfo(state.year).from + "," : ""} e soma receitas menos despesas de cada mês.` : "Receitas menos despesas acumuladas. Defina o saldo inicial do ano para ver o saldo real.";
    if (proj) {
      const per = proj.n === 1 ? "do último mês fechado" : `dos últimos ${proj.n} meses fechados`;
      $("proj-text").textContent = proj.k === 0 ? "O saldo já ficou negativo."
        : proj.k ? `Projeção (linha vermelha): no ritmo ${per}, ${fmt0(proj.avg)} por mês, o saldo chega a R$ 0 em ${projLabel(proj.k)}.`
        : `Projeção: no ritmo ${per}, o saldo cresce em média ${fmt0(proj.avg)} por mês e não chega a zero.`;
    }
    $("proj-text").hidden = !proj;
    const svg = $("flow").querySelector("svg"), tip = $("flow").querySelector(".tip"), hit = svg.querySelector(".hit");
    const at = ev => { const r = svg.getBoundingClientRect(); const px = (ev.clientX - r.left) / r.width * W; return Math.max(0, Math.min(11, Math.round((px - L) / (W - L - R) * 11))); };
    hit.addEventListener("mousemove", ev => { const i = at(ev); tip.innerHTML = `<b>Fim de ${MONTHS[i]}${isFuture(state.year, i) ? " · previsto" : ""}</b><div class="row"><span>Saldo</span><span>${fmt(pts[i])}</span></div>`; placeTip(tip, svg, W, x(i), y(pts[i])); });
    hit.addEventListener("mouseleave", () => { tip.hidden = true; });
    hit.addEventListener("click", ev => { state.month = at(ev); render(); });
  }

  // ---------- extras do card de receitas: sobra do mês, receita no ano, maiores gastos, formas de pagamento ----------
  const PAY_COLOR = { "Credit Card": "var(--n-gray)", "Debit Card": "var(--n-red)", "Pix": "#64b4a9", "Cash": "var(--n-brown)" };
  function renderIncExtra(A) {
    const box = $("inc-extra"), m = state.month, Y = state.year, ym = ymKey(Y, m);
    const inc = A.inc[m], exp = A.exp[m];
    if (!inc && !exp) { box.innerHTML = ""; return; }
    let h = "";
    // 1. quanto sobrou da receita
    const lastPast = Y < today.getFullYear() ? 11 : Y > today.getFullYear() ? -1 : today.getMonth();
    const upto = Math.min(m, lastPast);
    const yi = sum(A.inc.slice(0, upto + 1)), ye = sum(A.exp.slice(0, upto + 1));
    const yr = yi > 0 ? (yi - ye) / yi : null;
    if (inc > 0) {
      const sob = inc - exp, ep = Math.min(1, exp / inc);
      h += `<div class="xsec"><div class="xh"><i class="ic" data-i="balance"></i>Quanto sobrou da receita${yr != null ? `<span class="aside">média do ano até ${MONTHS[upto]}: ${Math.round(yr * 100)}%</span>` : ""}</div>
        <div class="split" role="img" aria-label="Despesas ${Math.round(exp / inc * 100)}% da receita"><i style="width:${(ep * 100).toFixed(1)}%;background:var(--exp)"></i>${sob > 0 ? `<i style="flex:1;background:var(--inc)"></i>` : ""}</div>
        <div class="xrow"><span>Despesas: <b>${Math.round(exp / inc * 100)}%</b> da receita</span><span style="color:${sob < 0 ? "var(--bad)" : "var(--ink-2)"}">${sob >= 0 ? `Sobra: <b style="color:var(--inc)">${fmt0(sob)}</b> (${Math.round(sob / inc * 100)}%)` : `Gastou <b style="color:var(--bad)">${fmt0(-sob)}</b> a mais que recebeu`}</span></div></div>`;
    } else if (exp > 0) {
      h += `<div class="xsec"><div class="xh"><i class="ic" data-i="balance"></i>Quanto sobrou da receita</div><div class="xrow"><span>Sem receita registrada em ${MONTHS[m]}; despesas de <b>${fmt0(exp)}</b>.</span></div></div>`;
    }
    // 2. receita mês a mês no ano (barras pequenas, média tracejada)
    const W = 360, H = 92, T = 8, B = 16, L = 4, R = 4;
    const months = A.inc.map((v, i) => ({ v, i })).filter(o => o.i <= Math.max(lastPast, m));
    const avg = months.length ? sum(months.filter(o => o.i <= lastPast).map(o => o.v)) / Math.max(1, months.filter(o => o.i <= lastPast).length) : 0;
    const mx = Math.max(1, ...A.inc, avg), bw = (W - L - R) / 12;
    let bars = "";
    for (let i = 0; i < 12; i++) {
      const v = A.inc[i], bh = (H - T - B) * v / mx, x = L + i * bw + 3;
      bars += `<rect x="${x.toFixed(1)}" y="${(H - B - bh).toFixed(1)}" width="${(bw - 6).toFixed(1)}" height="${Math.max(v ? 1.5 : 0, bh).toFixed(1)}" rx="2" style="fill:var(--inc);fill-opacity:${i === m ? 1 : isFuture(Y, i) ? .25 : .45}"><title>${MONTHS[i]}: ${fmt(v)}</title></rect>`;
      if (i % 2 === 0 || i === m) bars += `<text x="${(x + (bw - 6) / 2).toFixed(1)}" y="${H - 3}" text-anchor="middle" style="${i === m ? "fill:var(--ink);font-weight:600" : ""}">${MONTHS[i]}</text>`;
    }
    if (avg > 0) { const ay = H - B - (H - T - B) * avg / mx; bars += `<line x1="${L}" x2="${W - R}" y1="${ay.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="var(--ink-2)" stroke-dasharray="3 3"/>`; }
    h += `<div class="xsec"><div class="xh"><i class="ic" data-i="bars"></i>Receita mês a mês em ${Y}${avg > 0 ? `<span class="aside">média ${fmt0(avg)}/mês (tracejado)</span>` : ""}</div><div class="minibars"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Receita por mês em ${Y}">${bars}</svg></div></div>`;
    // 3. maiores gastos do mês
    const rowsM = state.rows.filter(r => r.d.slice(0, 7) === ym && r.cat && r.cat !== "Renda").sort((a, b) => b.a - a.a);
    if (rowsM.length) {
      const top = rowsM.slice(0, 5), share = exp > 0 ? sum(top.map(r => r.a)) / exp : 0;
      h += `<div class="xsec"><div class="xh"><i class="ic" data-i="list"></i>Maiores gastos de ${MONTHS[m]}<span class="aside">${Math.round(share * 100)}% das despesas do mês</span></div><div class="top5">`
        + top.map(r => `<div class="t">${catMark(r.cat, catColor(r.cat))}<span class="n">${esc(r.name)}<small>${r.d.slice(8, 10)}/${r.d.slice(5, 7)} · ${esc(r.sub || catName(r.cat))}</small></span><b>${fmt(r.a)}</b></div>`).join("") + `</div></div>`;
      // 4. formas de pagamento das despesas
      const byPay = {};
      for (const r of rowsM) { const k = r.pay || "?"; byPay[k] = (byPay[k] || 0) + r.a; }
      const tot = sum(Object.values(byPay)), ents = Object.entries(byPay).sort((a, b) => b[1] - a[1]);
      if (tot > 0 && !(ents.length === 1 && ents[0][0] === "?")) {
        const col = k => PAY_COLOR[k] || "var(--line-strong)", nm = k => k === "?" ? "Sem forma" : (PAY[k] || k);
        h += `<div class="xsec"><div class="xh"><i class="ic" data-i="wallet"></i>Como as despesas foram pagas</div><div class="split">${ents.map(([k, v]) => `<i style="width:${(v / tot * 100).toFixed(1)}%;background:${col(k)}" title="${esc(nm(k))}: ${fmt(v)}"></i>`).join("")}</div>`
          + `<div class="paylg">${ents.map(([k, v]) => `<span><i style="--c:${col(k)}"></i>${esc(nm(k))} <b>${fmt0(v)}</b> (${Math.round(v / tot * 100)}%)</span>`).join("")}</div></div>`;
      }
    }
    box.innerHTML = h;
  }

  // ---------- orçamento por categoria ----------
  // config.orcamento = { "AAAA-MM": { categoria: valor } }; um mês sem orçamento próprio herda o último definido antes dele
  const ymKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
  function budgetFor(y, m) {
    const all = state.config?.orcamento || {}, k = ymKey(y, m);
    const keys = Object.keys(all).filter(x => x <= k).sort();
    if (!keys.length) return { b: {}, s: {}, from: null };
    const from = keys[keys.length - 1];
    return { b: all[from] || {}, s: (state.config?.orcamentoSub || {})[from] || {}, from: from === k ? null : from };
  }
  function paceOf(y, m) {
    if (y < today.getFullYear() || (y === today.getFullYear() && m < today.getMonth())) return 1;
    if (y === today.getFullYear() && m === today.getMonth()) return today.getDate() / new Date(y, m + 1, 0).getDate();
    return 0;
  }
  function budgetRow(it, b, pace, sub, open, own) {
    const r = it.v / b, over = it.v > b + 0.005, ahead = !over && pace > 0 && pace < 1 && r > pace + 0.1;
    const left = b - it.v;
    const full = over ? `${fmt0(-left)} acima do orçamento` : `${Math.round(r * 100)}% usado, faltam ${fmt0(left)}${ahead ? "; gastando mais rápido que o ritmo do mês" : ""}`;
    const note = over ? `<span class="bud-note over" title="${full}">+${fmt0(-left)} acima</span>`
      : `<span class="bud-note${ahead ? " warn" : ""}" title="${full}">faltam ${fmt0(left)}${it.v ? ` · ${Math.round(r * 100)}%` : ""}${ahead ? " ↑" : ""}</span>`;
    const pc = pace > 0 && pace < 1 ? `<i class="bud-pace" style="left:${(pace * 100).toFixed(1)}%" title="Ritmo esperado até hoje: ${fmt0(b * pace)}"></i>` : "";
    const track = `<span><span class="bud-track${over ? " over" : ""}" style="--c:${it.color}"><i class="bud-fill" style="width:${Math.min(100, r * 100).toFixed(1)}%"></i>${sub ? "" : pc}${!sub && it.avg > 0 ? `<i class="avg-mk" style="left:${Math.min(100, it.avg / b * 100).toFixed(1)}%" title="Média mensal: ${fmt0(it.avg)}"></i>` : ""}</span>${sub ? "" : note}</span>`;
    const amt = `<span class="amt">${fmt(it.v)}${sub ? (own ? `<small>de ${fmt0(b)}</small>` : "") : `<small>de ${fmt0(b)}</small>${it.avg != null ? `<small>méd. ${fmt0(it.avg)}</small>` : ""}`}</span>`;
    if (sub) return `<div class="cat-row sub"><span class="name">${esc(it.label)}</span>${track}${amt}</div>`;
    return `<button class="cat-row" data-cat="${esc(it.key)}" aria-expanded="${open}"><span class="name"><span class="caret">▸</span>${catMark(it.cat, it.color)}${esc(it.label)}</span>${track}${amt}</button>`;
  }
  // média mensal por categoria nos meses já fechados do ano selecionado
  function avgMonths(Y) { return Y < today.getFullYear() ? 12 : Y === today.getFullYear() ? today.getMonth() : 0; }
  function catAvg(A, c) { const n = avgMonths(state.year), node = A && A.cat[c]; if (!n) return null; return node ? sum(node.m.slice(0, n)) / n : 0; }
  const avgRange = () => { const n = avgMonths(state.year); return n ? (n === 1 ? MONTHS[0] : `${MONTHS[0]}–${MONTHS[n - 1]}`) + " " + state.year : ""; };
  let catA = null;
  // liga/desliga da comparação com o orçamento: preferência deste navegador
  let budOn = true; try { budOn = localStorage.getItem("painel-bud-on") !== "0"; } catch {}
  $("bud-on").addEventListener("change", e => { budOn = e.target.checked; try { localStorage.setItem("painel-bud-on", budOn ? "1" : "0"); } catch {} if (catA) renderCatCard(catA, "exp"); });
  // soma dos orçamentos digitados, comparada com a renda do mês e com a renda média
  // com subcategorias preenchidas, o orçamento da categoria passa a ser a soma delas
  function syncCatFromSubs(c) {
    const f = $("budget-form"), ci = [...f.querySelectorAll('input[data-kind="cat"]')].find(i => i.name === c); if (!ci) return;
    let s = 0; for (const i of f.querySelectorAll('input[data-kind="sub"]')) if (i.dataset.cat === c) { const v = parseMoney(i.value); if (isFinite(v) && v > 0) s += v; }
    if (s > 0) { ci.value = String(Math.round(s * 100) / 100).replace(".", ","); ci.readOnly = true; ci.title = "Soma das subcategorias"; }
    else if (ci.readOnly) { ci.readOnly = false; ci.title = ""; }
  }
  function budTotal() {
    const box = $("bud-tot"); if (!box) return;
    for (const inp of $("budget-form").querySelectorAll("input[data-lan]")) {
      const v = parseMoney(inp.value), lan = +inp.dataset.lan, under = isFinite(v) && v > 0 && v < lan - 0.005;
      inp.classList.toggle("under", under); inp.title = under ? `Menor que o já lançado no mês (${fmt0(lan)})` : (inp.readOnly ? "Soma das subcategorias" : "");
    }
    let tot = 0; for (const inp of $("budget-form").querySelectorAll('input[data-kind="cat"]')) { const v = parseMoney(inp.value); if (isFinite(v) && v > 0) tot += v; }
    const m = state.month, incM = catA ? catA.inc[m] : 0, n = avgMonths(state.year);
    const incAvg = catA && n ? sum(catA.inc.slice(0, n)) / n : 0;
    const expAvg = catA && n ? sum(EXP_CATS.map(c => catA.cat[c] ? sum(catA.cat[c].m.slice(0, n)) : 0)) / n : 0;
    const line = (label, ref) => {
      if (!(ref > 0)) return `<span>${label}</span><span class="meter"></span><span class="pct" style="color:var(--muted)">sem renda</span>`;
      const r = tot / ref, over = r > 1;
      return `<span>${label} <b>${fmt0(ref)}</b></span><span class="meter${over ? " over" : ""}"><i style="width:${Math.min(100, r * 100).toFixed(1)}%"></i></span><span class="pct" style="color:${over ? "var(--bad)" : "var(--ink)"}">${Math.round(r * 100)}% · ${over ? `${fmt0(tot - ref)} acima` : `sobra ${fmt0(ref - tot)}`}</span>`;
    };
    const lanTot = catA ? sum(EXP_CATS.map(c => catA.cat[c]?.m[m] || 0)) : 0;
    box.innerHTML = `<div class="row"><span>Total orçado</span><b class="big">${fmt0(tot)}</b>${lanTot > 0 ? `<span>já lançado em ${MONTHS[m]}: <b style="color:var(--exp)">${fmt0(lanTot)}</b>${tot > 0 ? ` (${Math.round(lanTot / tot * 100)}% do orçado)` : ""}</span>` : ""}</div><div class="cmp">${line(`Renda de ${MONTHS[m]}`, incM)}${n ? line(`Renda média ${n === 1 ? MONTHS[0] : MONTHS[0] + "–" + MONTHS[n - 1]}`, incAvg) : ""}${n && expAvg > 0 ? (() => {
      const r = tot / expAvg, d = expAvg - tot;
      return `<span>Despesa média ${n === 1 ? MONTHS[0] : MONTHS[0] + "–" + MONTHS[n - 1]} <b>${fmt0(expAvg)}</b></span><span class="meter"><i style="width:${Math.min(100, r * 100).toFixed(1)}%;background:var(--exp)"></i></span><span class="pct" style="color:${d >= 0 ? "var(--good)" : "var(--ink)"}">${Math.round(r * 100)}% · ${d >= 0 ? `${fmt0(d)} abaixo da média` : `${fmt0(-d)} acima da média`}</span>`;
    })() : ""}</div>`;
  }
  function renderBudgetForm() {
    const f = $("budget-form"), { b, s: sb, from } = budgetFor(state.year, state.month);
    const val = v => v ? String(v).replace(".", ",") : "";
    const mm = state.month, lanC = c => catA?.cat[c]?.m[mm] || 0, lanS = (c, s) => catA?.cat[c]?.subs[s]?.[mm] || 0;
    const lanTag = v => v > 0 ? `<small class="lan" title="Já lançado em ${MONTHS[mm]} ${state.year} (inclui parcelas e gastos agendados)">lançado ${fmt0(v)}</small>` : "";
    const subAvg = (c, s) => { const n = avgMonths(state.year), arr = catA?.cat[c]?.subs[s]; return n && arr ? sum(arr.slice(0, n)) / n : 0; };
    f.innerHTML = `<div class="bud-tot" id="bud-tot"></div>` + EXP_CATS.map(c => {
      const subs = TAX[c] || [], anySub = subs.some(s => sb[s] > 0);
      return `<div class="bf-cat"><label><button type="button" class="bf-tg" data-tg="${esc(c)}" aria-expanded="${anySub}" aria-label="Subcategorias de ${esc(catName(c))}">▸</button><span class="ci-wrap">${catMark(c)}</span><span class="n"><span class="nm">${esc(catName(c))}</span>${catAvg(catA, c) > 0 || lanC(c) > 0 ? `<span class="meta">${catAvg(catA, c) > 0 ? `<small class="avg" title="Média mensal de ${avgRange()}">méd. ${fmt0(catAvg(catA, c))}</small>` : ""}${lanTag(lanC(c))}</span>` : ""}</span><input inputmode="decimal" data-kind="cat" data-lan="${lanC(c)}" name="${esc(c)}" placeholder="${lanC(c) > 0 ? "≥ " + Math.ceil(lanC(c)) : "—"}" value="${val(b[c])}"></label>`
        + `<div class="bf-subs" data-subs="${esc(c)}"${anySub ? "" : " hidden"}>${subs.map(s => `<label><span class="n"><span class="nm">${esc(s)}</span>${subAvg(c, s) > 0 || lanS(c, s) > 0 ? `<span class="meta">${subAvg(c, s) > 0 ? `<small class="avg">méd. ${fmt0(subAvg(c, s))}</small>` : ""}${lanTag(lanS(c, s))}</span>` : ""}</span><input inputmode="decimal" data-kind="sub" data-cat="${esc(c)}" data-lan="${lanS(c, s)}" name="${esc(s)}" placeholder="${lanS(c, s) > 0 ? "≥ " + Math.ceil(lanS(c, s)) : "—"}" value="${val(sb[s])}"></label>`).join("")}</div></div>`;
    }).join("")
      + `<div class="actions"><button class="btn primary" type="submit">Salvar orçamento</button><button class="btn ghost" type="button" id="budget-cancel">Cancelar</button>${avgMonths(state.year) ? `<button class="btn ghost" type="button" id="budget-avg" title="Preenche cada categoria com a média mensal de ${avgRange()}, arredondada para cima em R$ 10">Usar médias anuais</button>` : ""}`
      + `<p class="hint">Vale para ${MONTHS[state.month]} ${state.year} e os meses seguintes, até você mudar.${from ? ` Hoje herdado de ${from.slice(5)}/${from.slice(0, 4)}.` : ""} Deixe em branco a categoria sem orçamento. Abra ▸ para orçar por subcategoria; a categoria vira a soma delas. Em rosa, o que já está lançado no mês (parcelas e agendados); campo em âmbar = orçamento menor que isso.</p></div>`;
    $("budget-cancel").addEventListener("click", () => { f.hidden = true; });
    $("budget-avg")?.addEventListener("click", () => { for (const inp of f.querySelectorAll('input[data-kind="cat"]')) { if (inp.readOnly) continue; const a = catAvg(catA, inp.name); inp.value = a > 0 ? String(Math.ceil(a / 10) * 10) : ""; } budTotal(); });
    f.querySelectorAll(".bf-tg").forEach(t => t.addEventListener("click", () => { const box = f.querySelector(`[data-subs="${CSS.escape(t.dataset.tg)}"]`); box.hidden = !box.hidden; t.setAttribute("aria-expanded", String(!box.hidden)); }));
    for (const c of EXP_CATS) syncCatFromSubs(c);
    budTotal();
  }

  function renderCatCard(A, kind) {
    const m = state.month, box = $(kind + "-cats");
    if (kind === "exp") catA = A;
    $(kind + "-title").textContent = (kind === "exp" ? "Gastos" : "Receitas") + ` por categoria · ${MONTHS[m]} ${state.year}`;
    let items;
    if (kind === "exp") {
      items = Object.entries(A.cat).filter(([c]) => c !== "Renda").map(([c, n]) => ({ key: c, label: catName(c), v: n.m[m], color: catColor(c), node: n, cat: c })).filter(x => x.v > 0);
    } else {
      const incCats = Object.entries(A.cat).filter(([c]) => c === "Renda");
      if (incCats.length === 1) {
        const [c, n] = incCats[0], order = subOrder(c, n);
        items = order.map(s => ({ key: s, label: s, v: n.subs[s][m], color: subColor(c, s, order) })).filter(x => x.v > 0);
      } else items = incCats.map(([c, n]) => ({ key: c, label: catName(c), v: n.m[m], color: catColor(c), node: n, cat: c })).filter(x => x.v > 0);
    }
    const bud = kind === "exp" ? budgetFor(state.year, m).b : {}, subB = kind === "exp" ? budgetFor(state.year, m).s : {};
    const budDefined = kind === "exp" && Object.keys(bud).some(c => bud[c] > 0);
    if (kind === "exp") { $("bud-switch").hidden = !budDefined; $("bud-on").checked = budOn; }
    const hasBud = budDefined && budOn;
    if (hasBud) for (const c of Object.keys(bud)) if (bud[c] > 0 && !items.some(x => x.key === c) && TAX[c]) {
      const n = A.cat[c] || { m: Array(12).fill(0), subs: {} };
      items.push({ key: c, label: catName(c), v: n.m[m] || 0, color: catColor(c), node: n, cat: c });
    }
    if (kind === "exp") {
      for (const [c, node] of Object.entries(A.cat)) if (c !== "Renda" && !items.some(x => x.key === c) && catAvg(A, c) > 0) items.push({ key: c, label: catName(c), v: node.m[m] || 0, color: catColor(c), node, cat: c });
      for (const it of items) it.avg = catAvg(A, it.key);
    }
    items.sort((a, b) => hasBud ? ((bud[b.key] > 0) - (bud[a.key] > 0)) || (b.v / (bud[b.key] || 1)) - (a.v / (bud[a.key] || 1)) || b.v - a.v : (b.v - a.v) || ((b.avg || 0) - (a.avg || 0)));
    $(kind + "-total").textContent = "Total " + fmt(sum(items.map(x => x.v)));
    if (kind === "exp") {
      box.classList.toggle("budget", hasBud);
      $("exp-hint").textContent = hasBud ? "Cada barra vai até o orçamento da categoria. Toque para ver as subcategorias." : "Do maior para o menor. Toque numa categoria para abrir as subcategorias." + (state.db ? " Use Orçamento para definir metas do mês." : "");

    }
    if (hasBud) {
      const pace = paceOf(state.year, m), bt = sum(EXP_CATS.map(c => bud[c] > 0 ? bud[c] : 0));
      const spentB = sum(items.filter(x => bud[x.key] > 0).map(x => x.v)), out = sum(items.filter(x => !(bud[x.key] > 0)).map(x => x.v));
      const left = bt - spentB;
      let h = `<div class="bud-sum"><span><b>${fmt0(spentB)}</b> de ${fmt0(bt)} orçados</span><span style="color:${left < 0 ? "var(--bad)" : "var(--ink-2)"}">${left < 0 ? fmt0(-left) + " acima" : "faltam " + fmt0(left)}</span>${out > 0 ? `<span>${fmt0(out)} fora do orçamento</span>` : ""}</div>`
        + `<div class="bud-lg"><span><i class="k-track"></i>preenchido = gasto · barra inteira = orçamento</span>${pace > 0 && pace < 1 ? `<span><i class="k-pace"></i>ritmo de hoje: ${Math.round(pace * 100)}% do mês</span>` : ""}${avgMonths(state.year) ? `<span><i class="k-avg"></i>média mensal de ${avgRange()}</span>` : ""}<span><i class="k-over"></i>acima do orçamento</span><span>↑ gastando mais rápido que o ritmo</span></div>`;
      for (const it of items) {
        const b = bud[it.key];
        const open = state.openCats.has(it.key);
        if (b > 0) {
          h += budgetRow(it, b, pace, false, open);
          if (open) {
            const order = (TAX[it.cat] || []).filter(s => it.node.subs[s] || subB[s] > 0).concat(subOrder(it.cat, it.node).filter(s => !(TAX[it.cat] || []).includes(s)));
            for (const s of order) { const sv = it.node.subs[s]?.[m] || 0, sb = subB[s]; if (sv > 0 || sb > 0) h += budgetRow({ label: s, v: sv, color: subColor(it.cat, s, order) }, sb > 0 ? sb : b, pace, true, false, sb > 0); }
          }
        } else {
          const mx = Math.max(...items.map(x => bud[x.key] || x.v));
          h += `<button class="cat-row nobud" data-cat="${esc(it.key)}" aria-expanded="${open}"><span class="name"><span class="caret">▸</span>${catMark(it.cat || it.key, it.color)}${esc(it.label)}</span><span><span class="bw"><i class="bar" style="width:${(it.v / mx * 100).toFixed(1)}%;--c:${it.color}"></i>${it.avg > 0 ? `<i class="avg-mk" style="left:${Math.min(100, it.avg / mx * 100).toFixed(1)}%" title="Média mensal: ${fmt0(it.avg)}"></i>` : ""}</span><span class="bud-note">sem orçamento</span></span><span class="amt">${fmt(it.v)}${it.avg != null ? `<small>méd. ${fmt0(it.avg)}</small>` : ""}</span></button>`;
          if (open) { const order = subOrder(it.cat, it.node); for (const s of order) { const sv = it.node.subs[s][m]; if (sv > 0) h += `<div class="cat-row sub"><span class="name">${esc(s)}</span><span><i class="bar" style="width:${(sv / mx * 100).toFixed(1)}%;--c:${subColor(it.cat, s, order)}"></i></span><span class="amt">${fmt(sv)}</span></div>`; } }
        }
      }
      box.innerHTML = h;
      box.querySelectorAll("button.cat-row").forEach(b => b.addEventListener("click", () => { const c = b.dataset.cat; state.openCats.has(c) ? state.openCats.delete(c) : state.openCats.add(c); renderCatCard(A, kind); }));
      return;
    }
    if (!items.length) { box.innerHTML = `<p class="empty">${state.rows.length ? (kind === "exp" ? "Nenhuma despesa" : "Nenhuma receita") + " registrada em " + MONTHS[m] + "." : "Aguardando dados do Notion…"}</p>`; return; }
    const max = Math.max(items[0].v, ...items.map(x => x.avg || 0));
    let h = kind === "exp" && items.some(x => x.avg > 0) ? `<div class="bud-lg"><span><i class="k-bar"></i>gasto em ${MONTHS[m]}</span><span><i class="k-avg"></i>média mensal de ${avgRange()}</span></div>` : "";
    for (const it of items) {
      if (it.node) {
        const open = state.openCats.has(it.key);
        h += `<button class="cat-row" data-cat="${esc(it.key)}" aria-expanded="${open}"><span class="name"><span class="caret">▸</span>${catMark(it.cat || it.key, it.color)}${esc(it.label)}</span><span><span class="bw"><i class="bar" style="width:${(it.v / max * 100).toFixed(1)}%;--c:${it.color}"></i>${it.avg > 0 ? `<i class="avg-mk" style="left:${(it.avg / max * 100).toFixed(1)}%" title="Média mensal: ${fmt0(it.avg)}"></i>` : ""}</span></span><span class="amt">${fmt(it.v)}${it.avg != null ? `<small>méd. ${fmt0(it.avg)}</small>` : ""}</span></button>`;
        if (open) {
          const order = subOrder(it.cat, it.node);
          for (const s of order) { const sv = it.node.subs[s][m]; if (sv > 0) h += `<div class="cat-row sub"><span class="name">${esc(s)}</span><span><i class="bar" style="width:${(sv / max * 100).toFixed(1)}%;--c:${subColor(it.cat, s, order)}"></i></span><span class="amt">${fmt(sv)}</span></div>`; }
        }
      } else {
        h += `<div class="cat-row"><span class="name">${catMark(it.cat || it.key, it.color)}${esc(it.label)}</span><span><i class="bar" style="width:${(it.v / max * 100).toFixed(1)}%;--c:${it.color}"></i></span><span class="amt">${fmt(it.v)}</span></div>`;
      }
    }
    box.innerHTML = h;
    box.querySelectorAll("button.cat-row").forEach(b => b.addEventListener("click", () => { const c = b.dataset.cat; state.openCats.has(c) ? state.openCats.delete(c) : state.openCats.add(c); renderCatCard(A, kind); }));
  }

  // ---------- gráfico anual interativo ----------
  function annualSeries(A) {
    const s = state.ann;
    if (s.mode === "inc") {
      const n = A.cat["Renda"]; if (!n) return { series: [], level: "Receitas" };
      const order = subOrder("Renda", n);
      return { series: order.map(k => ({ key: k, label: k, vals: n.subs[k], color: subColor("Renda", k, order) })), level: "Receitas por subcategoria" };
    }
    if (s.drill && A.cat[s.drill]) {
      const n = A.cat[s.drill], order = subOrder(s.drill, n);
      return { series: order.map(k => ({ key: k, label: k, vals: n.subs[k], color: subColor(s.drill, k, order) })), level: catName(s.drill), drill: s.drill };
    }
    const cats = Object.keys(A.cat).filter(c => c !== "Renda").sort((a, b) => sum(A.cat[b].m) - sum(A.cat[a].m));
    return { series: cats.map(c => ({ key: c, label: catName(c), vals: A.cat[c].m, color: catColor(c), drillable: true })), level: "Todas as categorias" };
  }
  function renderAnnual(A) {
    const s = state.ann, { series, drill } = annualSeries(A);
    $("ann-exp").setAttribute("aria-pressed", s.mode === "exp"); $("ann-inc").setAttribute("aria-pressed", s.mode === "inc");
    $("ann-crumbs").innerHTML = s.mode === "inc" ? `<strong>Receitas</strong><span>· por subcategoria de Renda</span>`
      : drill ? `<button id="ann-back">Todas as categorias</button><span>›</span><strong style="display:inline-flex;align-items:center;gap:6px">${catMark(drill)}${esc(catName(drill))}</strong><span>· por subcategoria</span>`
      : `<strong>Despesas</strong><span>· por categoria</span>`;
    if ($("ann-back")) $("ann-back").onclick = () => { s.drill = null; s.hidden.clear(); renderAnnual(A); };
    const vis = series.filter(x => !s.hidden.has(x.key) && sum(x.vals) > 0);
    const W = 900, H = 300, L = 50, R = 8, T = 14, B = 28;
    const totals = MONTHS.map((_, i) => sum(vis.map(x => x.vals[i])));
    // escala justa: passo "redondo" de cerca de 1/4 do maior mês, e o teto é o primeiro múltiplo do passo acima dele
    const top = Math.max(...totals, 1), step = (() => { const r = top / 4, p = Math.pow(10, Math.floor(Math.log10(r))), n = r / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; })();
    const max = top * 1.06, nt = Math.floor(max / step + 1e-9);
    const iw = (W - L - R) / 12, bw = Math.min(46, iw * 0.62);
    const y = v => T + (H - T - B) * (1 - v / max);
    let g = "";
    for (let k = 0; k <= nt; k++) { const v = step * k, yy = y(v); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${L - 8}" y="${yy + 4}" text-anchor="end">${short(v)}</text>`; }
    let marks = "";
    for (let i = 0; i < 12; i++) {
      const x0 = L + iw * i + (iw - bw) / 2, fut = isFuture(state.year, i);
      let acc = 0;
      vis.forEach((ser, k) => {
        const v = ser.vals[i]; if (v <= 0) return;
        const y1 = y(acc + v), y0 = y(acc), h = Math.max(0.5, y0 - y1);
        const top = k === vis.length - 1 || !vis.slice(k + 1).some(o => o.vals[i] > 0);
        const rr = top ? Math.min(4, h) : 0;
        const d = `M${x0},${y0} V${y1 + rr} ${rr ? `q0,-${rr} ${rr},-${rr} h${bw - 2 * rr} q${rr},0 ${rr},${rr}` : `h${bw}`} V${y0} Z`;
        marks += `<path class="seg-mark" data-k="${esc(ser.key)}" d="${d}" style="fill:${ser.color};${fut ? "fill-opacity:.45;" : ""}stroke:var(--surface);${ser.drillable ? "cursor:pointer" : ""}" stroke-width="1.5"/>`;
        acc += v;
      });
      marks += `<text x="${L + iw * i + iw / 2}" y="${H - 8}" text-anchor="middle" class="${i === state.month ? "sel-label" : ""}">${MONTHS[i]}</text>`;
      marks += `<rect class="col-hit" data-m="${i}" x="${L + iw * i}" y="0" width="${iw}" height="${H - B}" style="fill:transparent"/>`;
    }
    $("annual").innerHTML = vis.length
      ? `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gastos e receitas por mês e categoria em ${state.year}">${g}<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="var(--line-strong)"/>${marks}</svg><div class="tip" hidden></div>`
      : `<p class="empty">${state.rows.length ? "Nada para mostrar com esses filtros." : "Aguardando dados do Notion…"}</p>`;
    // etiquetas
    $("ann-chips").innerHTML = series.filter(x => sum(x.vals) > 0).map(x => `<span class="chipbtn" role="button" tabindex="0" data-k="${esc(x.key)}" aria-pressed="${!s.hidden.has(x.key)}">${catMark(x.key, x.color)}${esc(x.label)} <span class="v">${fmt0(sum(x.vals))}</span>${x.drillable ? `<button class="drill" data-drill="${esc(x.key)}" aria-label="Abrir subcategorias de ${esc(x.label)}">›</button>` : ""}</span>`).join("");
    $("ann-chips").querySelectorAll(".chipbtn").forEach(ch => {
      const toggle = () => { const k = ch.dataset.k; s.hidden.has(k) ? s.hidden.delete(k) : s.hidden.add(k); renderAnnual(A); };
      ch.addEventListener("click", ev => { if (ev.target.closest(".drill")) return; toggle(); });
      ch.addEventListener("keydown", ev => { if ((ev.key === "Enter" || ev.key === " ") && !ev.target.closest(".drill")) { ev.preventDefault(); toggle(); } });
    });
    $("ann-chips").querySelectorAll(".drill").forEach(b => b.addEventListener("click", () => { s.drill = b.dataset.drill; s.hidden.clear(); renderAnnual(A); }));
    const svg = $("annual").querySelector("svg"); if (!svg) return;
    const tip = $("annual").querySelector(".tip");
    const showTip = i => {
      const rows = vis.map(x => [x, x.vals[i]]).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]);
      const top = rows.slice(0, 8), rest = rows.slice(8);
      tip.innerHTML = `<b>${MONTHS[i]} ${state.year}${isFuture(state.year, i) ? " · previsto" : ""}</b>` + top.map(([x, v]) => `<div class="row"><span>${CAT_KEY[x.key] ? catMark(x.key, x.color) : `<i style="--c:${x.color}"></i>`}${esc(x.label)}</span><span>${fmt(v)}</span></div>`).join("")
        + (rest.length ? `<div class="row"><span>+ ${rest.length} outras</span><span>${fmt(sum(rest.map(r => r[1])))}</span></div>` : "")
        + `<div class="row tot"><span>Total</span><span>${fmt(totals[i])}</span></div>`;
      placeTip(tip, svg, W, L + iw * i + iw / 2, y(totals[i]));
    };
    svg.querySelectorAll(".col-hit").forEach(h => { h.addEventListener("mouseenter", () => showTip(+h.dataset.m)); h.addEventListener("mouseleave", () => { tip.hidden = true; }); });
    svg.querySelectorAll(".seg-mark").forEach(p => {
      const i = Math.floor((parseFloat(p.getAttribute("d").slice(1)) - L) / iw);
      p.addEventListener("mouseenter", () => showTip(i));
      p.addEventListener("mouseleave", () => { tip.hidden = true; });
      if (!drill && s.mode === "exp") p.addEventListener("click", () => { s.drill = p.dataset.k; s.hidden.clear(); renderAnnual(A); });
    });
    // colunas-alvo ficam atrás das faixas; reordena para as faixas receberem o clique
    svg.querySelectorAll(".col-hit").forEach(h => svg.insertBefore(h, svg.querySelector(".seg-mark")));
  }

  function renderGoals() {
    const el = $("goals"), metas = Array.isArray(state.config?.metas) ? state.config.metas : [];
    if (!state.db) { el.innerHTML = `<p class="empty">Entre no app para criar e acompanhar metas.</p>`; return; }
    if (!state.config) { el.innerHTML = `<p class="empty">Carregando metas…</p>`; return; }
    if (!metas.length) { el.innerHTML = `<p class="empty">Nenhuma meta ainda. Use “+ Nova meta” para criar a primeira, como uma reserva de emergência ou uma viagem.</p>`; return; }
    el.innerHTML = metas.map(g => {
      const pct = g.alvo > 0 ? Math.min(100, g.atual / g.alvo * 100) : 0;
      return `<div class="goal" data-id="${esc(g.id)}">
        <div class="goal-top"><span class="goal-name">${esc(g.nome)}</span><span class="goal-meta">${fmt0(g.atual)} de ${fmt0(g.alvo)} · ${pct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%</span></div>
        <div class="track" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(g.nome)}"><i style="width:${pct.toFixed(1)}%"></i></div>
        <div class="goal-actions"><button class="btn ghost" data-act="aporte">+ Registrar aporte</button><button class="btn ghost" data-act="del">Remover</button></div>
        <form class="inline-form" data-form="aporte" hidden><label class="field w-s" for="ap-${esc(g.id)}">Valor do aporte (R$)<input id="ap-${esc(g.id)}" inputmode="decimal" required></label><button class="btn primary" type="submit">Somar</button></form>
        <div class="inline-form" data-form="del" hidden><span class="goal-meta">Remover esta meta?</span><button class="btn" data-act="del-yes">Remover</button><button class="btn ghost" data-act="del-no">Manter</button></div>
      </div>`;
    }).join("");
    el.querySelectorAll(".goal").forEach(node => {
      const id = node.dataset.id, f1 = node.querySelector('[data-form="aporte"]'), f2 = node.querySelector('[data-form="del"]');
      node.querySelector('[data-act="aporte"]').onclick = () => { f1.hidden = !f1.hidden; f2.hidden = true; if (!f1.hidden) f1.querySelector("input").focus(); };
      node.querySelector('[data-act="del"]').onclick = () => { f2.hidden = !f2.hidden; f1.hidden = true; };
      node.querySelector('[data-act="del-no"]').onclick = () => { f2.hidden = true; };
      node.querySelector('[data-act="del-yes"]').onclick = () => saveConfig({ metas: metas.filter(g => g.id !== id) });
      f1.onsubmit = ev => { ev.preventDefault(); const v = parseMoney(f1.querySelector("input").value); if (!isFinite(v) || v === 0) return; saveConfig({ metas: metas.map(g => g.id === id ? Object.assign({}, g, { atual: Math.round((g.atual + v) * 100) / 100 }) : g) }); };
    });
  }

  function renderMatrix(A) {
    const y = state.year, sm = state.month;
    // média anual = total do ano ÷ 12 (inclui o já lançado nos meses seguintes); média até o mês = JAN até o mês selecionado
    const avgY = arr => sum(arr) / 12;
    const avgTo = arr => sum(arr.slice(0, sm + 1)) / (sm + 1);
    const toLbl = sm === 0 ? "JAN" : `JAN–${MONTHS[sm]}`;
    const totalExp = sum(A.exp);
    const head = `<thead><tr><th>Categoria</th>${MONTHS.map((n, i) => `<th class="m${i === sm ? " sel" : ""}${isFuture(y, i) ? " future" : ""}" data-m="${i}">${n}</th>`).join("")}<th>ANO</th><th title="Total do ano dividido por 12 (inclui o que já está lançado nos meses seguintes)">MÉDIA ANUAL</th><th class="sel" title="Média mensal de janeiro até o mês selecionado. Clique num mês para mudar.">MÉDIA ${toLbl}</th><th>% DESP.</th></tr></thead>`;
    const cell = (v, i, max, color) => {
      const cls = (i === sm ? "sel " : "") + (isFuture(y, i) ? "future " : "") + (Math.abs(v) < .005 ? "zero" : "");
      if (Math.abs(v) < .005) return `<td class="${cls}">–</td>`;
      const a = max > 0 ? Math.round(Math.min(1, v / max) * 30) : 0;
      return `<td class="${cls}"><span class="h" style="background:color-mix(in oklab, ${color} ${a}%, transparent)">${bare0(v)}</span></td>`;
    };
    const row = (label, arr, cls, color, base) => `<tr class="${cls}">${label}${arr.map((v, i) => cell(v, i, Math.max(...arr), color)).join("")}<td>${fmt0(sum(arr))}</td><td>${fmt0(avgY(arr))}</td><td class="sel">${fmt0(avgTo(arr))}</td><td>${base ? (sum(arr) / base * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%" : ""}</td></tr>`;
    const block = (c, node, base) => {
      const open = state.openMatrix.has(c), color = catColor(c);
      let h = row(`<td><button data-mcat="${esc(c)}" aria-expanded="${open}"><span class="caret">▸</span>${catMark(c, color)}${esc(catName(c))}</button></td>`, node.m, "cat", color, base);
      if (open) { const order = subOrder(c, node); for (const s of order) h += row(`<td>${esc(s)}</td>`, node.subs[s], "subrow", subColor(c, s, order), base); }
      return h;
    };
    let body = `<tbody><tr class="section"><td colspan="17" style="color:var(--inc)">Renda</td></tr>`;
    if (A.cat["Renda"]) body += block("Renda", A.cat["Renda"], 0);
    body += row("<td>Receita total</td>", A.inc, "total", "var(--inc)", 0);
    body += `<tr class="section"><td colspan="17" style="color:var(--exp)">Despesas</td></tr>`;
    const cats = Object.keys(A.cat).filter(c => c !== "Renda").sort((a, b) => sum(A.cat[b].m) - sum(A.cat[a].m));
    for (const c of cats) body += block(c, A.cat[c], totalExp);
    body += row("<td>Despesa total</td>", A.exp, "total", "var(--exp)", totalExp);
    const net = A.inc.map((v, i) => v - A.exp[i]);
    body += `<tr class="net"><td>Saldo do mês</td>${net.map((v, i) => `<td class="${i === sm ? "sel " : ""}${isFuture(y, i) ? "future" : ""}" style="color:${v < 0 ? "var(--bad)" : "var(--good)"}">${Math.abs(v) < .005 ? "–" : bare0(v)}</td>`).join("")}<td style="color:${sum(net) < 0 ? "var(--bad)" : "var(--good)"}">${fmt0(sum(net))}</td><td>${fmt0(avgY(net))}</td><td class="sel">${fmt0(avgTo(net))}</td><td></td></tr></tbody>`;
    $("matrix").innerHTML = head + body;
    $("matrix").querySelectorAll("th.m").forEach(th => th.addEventListener("click", () => { state.month = +th.dataset.m; render(); }));
    $("matrix").querySelectorAll("[data-mcat]").forEach(b => b.addEventListener("click", () => { const c = b.dataset.mcat; state.openMatrix.has(c) ? state.openMatrix.delete(c) : state.openMatrix.add(c); renderMatrix(A); }));
    $("expand-all").textContent = state.openMatrix.size ? "Fechar todas" : "Abrir todas";
  }

  function renderIssues(A) {
    const list = A.issues.slice().sort((a, b) => b.d.localeCompare(a.d));
    $("issues-count").textContent = list.length ? `${list.length} para revisar` : "Tudo classificado";
    $("issues-count").className = "pill" + (list.length ? " warn" : " live");
    if (!list.length) { $("issues").innerHTML = `<p class="empty">${state.rows.length ? "Todos os lançamentos de " + state.year + " têm subcategoria coerente." : "Aguardando dados do Notion…"}</p>`; return; }
    $("issues").innerHTML = list.slice(0, 10).map(r => {
      const why = !r.sub ? "sem subcategoria" : (PARENT[r.sub] ? `é de ${catName(PARENT[r.sub])}` : "subcategoria desconhecida");
      const name = r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a>` : esc(r.name);
      return `<div class="issue"><span class="d">${r.d.slice(8, 10)}/${r.d.slice(5, 7)}</span><span style="min-width:0;display:flex;gap:8px;align-items:center">${name}</span><span class="chip warn">${why}</span></div>`;
    }).join("") + (list.length > 10 ? `<p class="empty">E mais ${list.length - 10}. Filtre a coluna “Hierarquia” no Notion para ver todos.</p>` : "");
  }

  // ---------- Extrato ----------
  const PAY = { "Credit Card": "Crédito", "Debit Card": "Débito", "Pix": "Pix", "Cash": "Dinheiro" };
  function fillSelect(el, opts, value) { el.innerHTML = opts.map(([v, t]) => `<option value="${esc(v)}"${v === value ? " selected" : ""}>${esc(t)}</option>`).join(""); }
  function syncLedgerFilters() {
    const L = state.led;
    const cats = L.kind === "inc" ? ["Renda"] : L.kind === "exp" ? EXP_CATS : Object.keys(TAX);
    if (L.cat && !cats.includes(L.cat)) L.cat = "";
    fillSelect($("f-cat"), [["", "Todas"]].concat(cats.map(c => [c, catName(c)])), L.cat);
    const subs = L.cat ? TAX[L.cat] : [];
    if (L.sub && !subs.includes(L.sub)) L.sub = "";
    fillSelect($("f-sub"), [["", L.cat ? "Todas" : "—"]].concat(subs.map(s => [s, s])), L.sub);
    $("f-sub").disabled = !L.cat;
  }
  function renderLedger() {
    const L = state.led; syncLedgerFilters();
    const q = L.q.trim().toLowerCase();
    const rows = state.rows.filter(r => {
      if (+r.d.slice(0, 4) !== state.year) return false;
      if (L.period === "month" && +r.d.slice(5, 7) - 1 !== state.month) return false;
      if (L.kind === "inc" && r.cat !== "Renda") return false;
      if (L.kind === "exp" && r.cat === "Renda") return false;
      if (L.cat && r.cat !== L.cat) return false;
      if (L.sub && r.sub !== L.sub) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => b.d.localeCompare(a.d) || b.a - a.a);
    const inc = sum(rows.filter(r => r.cat === "Renda").map(r => r.a)), exp = sum(rows.filter(r => r.cat !== "Renda").map(r => r.a));
    $("ledger-title").textContent = `Extrato · ${L.period === "month" ? MONTHS[state.month] + " " : ""}${state.year}`;
    $("ledger-sum").innerHTML = `<span><b>${rows.length}</b> lançamentos</span><span>Receitas <b style="color:var(--inc)">${fmt(inc)}</b></span><span>Despesas <b>${fmt(exp)}</b></span><span>Saldo <b style="color:${inc - exp < 0 ? "var(--bad)" : "var(--good)"}">${fmt(inc - exp)}</b></span>`;
    if (!rows.length) { $("ledger").innerHTML = `<tbody><tr><td class="empty">${state.rows.length ? "Nenhum lançamento com esses filtros." : "Aguardando dados do Notion…"}</td></tr></tbody>`; $("ledger-more").hidden = true; return; }
    const shown = rows.slice(0, L.limit);
    state.ledRows = [];
    let h = `<thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Subcategoria</th><th>Pagamento</th><th>Origem</th><th class="val">Valor</th><th></th></tr></thead><tbody>`;
    let lastDay = "";
    for (const r of shown) {
      if (L.period === "year" && r.d.slice(0, 7) !== lastDay.slice(0, 7)) { const mi = +r.d.slice(5, 7) - 1; h += `<tr class="day"><td colspan="8">${MONTHS[mi]} ${state.year}</td></tr>`; }
      lastDay = r.d;
      state.ledRows.push(r);
      const isInc = r.cat === "Renda", fut = r.d > todayISO;
      const ok = r.sub && PARENT[r.sub] === r.cat;
      const subTag = r.sub ? `<span class="tag" style="--c:${ok ? subColor(r.cat, r.sub, TAX[r.cat] || [r.sub]) : "var(--warn)"}">${esc(r.sub)}</span>` : `<span class="chip warn">sem subcategoria</span>`;
      h += `<tr class="${fut ? "future" : ""}${r.url ? " editable" : ""}" data-k="${state.ledRows.length - 1}"><td class="d">${r.d.slice(8, 10)}/${r.d.slice(5, 7)}${fut ? " · agendado" : ""}</td><td>${esc(r.name)}</td><td>${r.cat ? `<span class="tag${CAT_KEY[r.cat] ? " has-ci" : ""}" style="--c:${catColor(r.cat)}">${CAT_KEY[r.cat] ? catMark(r.cat) : ""}${esc(catName(r.cat))}</span>` : `<span class="chip warn">sem categoria</span>`}</td><td>${subTag}</td><td class="origin">${esc(PAY[r.pay] || r.pay || "")}</td><td class="origin">${esc(r.origem)}</td><td class="val ${isInc ? "inc" : "exp"}">${isInc ? "+ " : "− "}${fmt(r.a)}</td><td>${r.url ? `<a class="open" href="${esc(r.url)}" target="_blank" rel="noopener">Notion ↗</a>` : ""}</td></tr>`;
    }
    $("ledger").innerHTML = h + "</tbody>";
    $("ledger").onclick = e => { if (e.target.closest("a")) return; const tr = e.target.closest("tr.editable"); if (tr) editRow(state.ledRows[+tr.dataset.k]); };
    $("ledger-more").hidden = rows.length <= L.limit;
    $("ledger-more").textContent = `Mostrar mais (${rows.length - L.limit} restantes)`;
  }

  // formulário de lançamento
  function syncEntry() {
    const k = state.entryKind;
    document.querySelectorAll("#entry .kind button").forEach(b => b.setAttribute("aria-pressed", b.dataset.kind === k));
    const cats = k === "inc" ? ["Renda"] : EXP_CATS;
    const cur = $("e-cat").value;
    fillSelect($("e-cat"), cats.map(c => [c, catName(c)]), cats.includes(cur) ? cur : cats[0]);
    syncEntrySubs();
    $("e-name").placeholder = k === "inc" ? "Ex.: Bolsa Mestrado (13/24)" : "Ex.: Compras - Assaí";
  }
  function syncEntrySubs() {
    const c = $("e-cat").value, cur = $("e-sub").value, subs = TAX[c] || [];
    fillSelect($("e-sub"), [["", "Escolha…"]].concat(subs.map(s => [s, s])), subs.includes(cur) ? cur : "");
  }
  async function submitEntry(ev) {
    ev.preventDefault();
    const msg = $("e-msg"); msg.hidden = true;
    const name = $("e-name").value.trim(), date = $("e-date").value, amount = parseMoney($("e-amount").value), cat = $("e-cat").value, sub = $("e-sub").value, pay = $("e-pay").value;
    const fail = t => { msg.textContent = t; msg.hidden = false; };
    if (!date) return fail("Informe a data.");
    if (!name) return fail("Escreva uma descrição.");
    if (!isFinite(amount) || amount <= 0) return fail("Informe um valor maior que zero, como 45,90.");
    if (!sub) return fail("Escolha a subcategoria.");
    if (!state.mcp) return fail("Entre no app para gravar no Notion.");
    const btn = $("e-submit"); btn.disabled = true; btn.textContent = "Enviando…";
    const props = { "Name": name, "date:Date:start": date, "Amount": Math.round(amount * 100) / 100, "Category": cat, "Subcategory": sub, "Payment Method": pay, "Origem": "Painel", "Contabilizado": "__YES__" };
    try {
      const res = await state.mcp.callTool(NOTION, T_CREATE, { parent: { data_source_id: DS_ID }, pages: [{ properties: props }] }, { cache: false });
      let p = res.payload; if (typeof p === "string") { try { p = JSON.parse(p); } catch {} }
      const url = p && Array.isArray(p.pages) && p.pages[0] ? p.pages[0].url : null;
      state.main.push({ name, d: date, a: props.Amount, cat, sub, url, origem: "Painel", pay });
      writeCache();
      $("e-name").value = ""; $("e-amount").value = "";
      toast(`${cat === "Renda" ? "Receita" : "Despesa"} de ${fmt(props.Amount)} adicionada ao Notion`);
      render();
      setTimeout(() => load(true), 1500);
    } catch (e) {
      if (e && (e.code === "server_unavailable" || e.code === "upstream_error" || e.code === "cancelled")) fail("O Notion não confirmou a gravação. Clique em Atualizar e confira no extrato antes de tentar de novo, para não duplicar.");
      else fail(errorCopy(e));
    } finally { btn.disabled = false; btn.textContent = "Adicionar ao Notion"; }
  }

  // ---------- editar / apagar lançamento (Notion + cópia dos meses revisados) ----------
  const srcOf = () => HIST[state.year] ? "h" + state.year : "main";
  async function snapPatch(src, url, novo) {
    // a cópia dos meses revisados guarda os lançamentos em linhas compactas; tira a antiga e põe a nova no mês certo
    const db = await dbWait; if (!db) return;
    try {
      const q = await db.collection(SNAP).where("src", "==", src).limit(200).get(), docs = {};
      for (const d of q.docs) { const x = d.data(); if (!x.meta && Array.isArray(x.rows)) docs[x.mes] = { id: d.id, x, dirty: false }; }
      let found = false;
      for (const m of Object.values(docs)) { const i = m.x.rows.findIndex(a => a[5] === url); if (i >= 0) { m.x.rows.splice(i, 1); m.dirty = true; found = true; } }
      if (!found) return; // lançamento não estava na cópia (mês ainda não revisado)
      if (novo) { const mes = novo.d.slice(0, 7); const m = docs[mes] || (docs[mes] = { id: `${src}-${mes}`, x: { src, mes, rows: [] } }); m.x.rows.push(pack(novo)); m.dirty = true; }
      for (const m of Object.values(docs)) if (m.dirty) await db.doc(`${SNAP}/${m.id}`).set(m.x);
    } catch { /* sem permissão: a próxima leitura completa corrige */ }
  }
  function persistRows() { if (HIST[state.year]) { try { localStorage.setItem(HIST_KEY(state.year), JSON.stringify(state.hist[state.year])); } catch {} } else writeCache(); }
  function editRow(r) {
    const box = document.createElement("div"); box.className = "tr-sheet"; box.id = "fin-edit";
    const cats = Object.keys(TAX), isInc = r.cat === "Renda";
    const subsOf = c => (TAX[c] || []);
    box.innerHTML = `<div class="tr-sheet-box"><div class="ft-sh-h"><button class="btn ghost" data-x="cancel">Cancelar</button><h3>Editar lançamento</h3><button class="btn ghost strong" data-x="save">Salvar</button></div>
      <div class="group-ios"><input id="fx-n" value="${esc(r.name)}" placeholder="Descrição">
        <label class="row"><span>Valor (R$)</span><input id="fx-a" inputmode="decimal" value="${String(r.a).replace(".", ",")}" style="text-align:right;width:140px;background:transparent"></label>
        <label class="row"><span>Data</span><input type="date" id="fx-d" value="${r.d}"></label></div>
      <div class="group-ios"><label class="row"><span>Categoria</span><select id="fx-c">${cats.map(c => `<option value="${esc(c)}" ${c === r.cat ? "selected" : ""}>${esc(catName(c))}</option>`).join("")}${r.cat && !cats.includes(r.cat) ? `<option selected>${esc(r.cat)}</option>` : ""}</select></label>
        <label class="row"><span>Subcategoria</span><select id="fx-s"></select></label>
        ${HIST[state.year] ? "" : `<label class="row"><span>Pagamento</span><select id="fx-p"><option value="">—</option>${Object.entries(PAY).map(([k, l]) => `<option value="${k}" ${k === r.pay ? "selected" : ""}>${l}</option>`).join("")}</select></label>`}</div>
      <p class="hint">${isInc ? "Receita" : "Despesa"} · origem ${esc(r.origem || "")}. A mudança vai para o Notion${r.d <= (revisadoAte() || "") ? " e para a cópia dos meses revisados" : ""}.</p>
      <button class="gbtn big danger" data-x="del">Apagar lançamento</button><p class="msg" id="fx-msg" hidden></p></div>`;
    document.body.appendChild(box); document.documentElement.classList.add("tr-noscroll");
    const fillSubs = () => { const c = $("fx-c").value, subs = subsOf(c); $("fx-s").innerHTML = subs.map(x => `<option ${x === r.sub ? "selected" : ""}>${esc(x)}</option>`).join("") + (r.sub && !subs.includes(r.sub) && c === r.cat ? `<option selected>${esc(r.sub)}</option>` : ""); };
    fillSubs(); $("fx-c").onchange = fillSubs;
    const close = () => { box.remove(); document.documentElement.classList.remove("tr-noscroll"); };
    const say = (t, err) => { const m = $("fx-msg"); m.textContent = t; m.hidden = !t; m.className = "msg" + (err ? " err" : ""); };
    box.onclick = async e => {
      const b = e.target.closest("[data-x]"); if (!b) { if (e.target === box) close(); return; }
      const mcp = state.mcp || await window.claude?.use?.("mcp");
      if (b.dataset.x === "cancel") return close();
      if (!mcp) return say("Entre no app para editar no Notion.", true);
      if (b.dataset.x === "del") {
        if (!confirm(`Apagar “${r.name}” (${fmt(r.a)}) do Notion? Ele vai para a lixeira do Notion.`)) return;
        b.disabled = true; say("Apagando…");
        try {
          await mcp.callTool(NOTION, "notion-trash-page", { page_id: r.url });
          for (const arr of [state.main, state.rows, ...(Object.values(state.hist).map(h => h.rows))]) { const i = (arr || []).indexOf(r); if (i >= 0) arr.splice(i, 1); }
          await snapPatch(srcOf(), r.url, null); persistRows(); close(); toast("Lançamento apagado"); render();
        } catch (err) { b.disabled = false; say(errorCopy(err), true); }
        return;
      }
      const name = $("fx-n").value.trim(), a = parseMoney($("fx-a").value), d = $("fx-d").value, cat = $("fx-c").value, sub = $("fx-s").value, pay = $("fx-p") ? $("fx-p").value : r.pay;
      if (!name || !d || !isFinite(a) || a <= 0) return say("Preencha descrição, data e um valor maior que zero.", true);
      const props = { Name: name, "date:Date:start": d, "date:Date:is_datetime": 0, Amount: Math.round(a * 100) / 100, Category: cat, Subcategory: sub };
      if ($("fx-p")) props["Payment Method"] = pay || null;
      b.disabled = true; say("Salvando no Notion…");
      try {
        await mcp.callTool(NOTION, "notion-update-page", { page_id: r.url, command: "update_properties", properties: props });
        Object.assign(r, { name, d, a: props.Amount, cat, sub, pay });
        await snapPatch(srcOf(), r.url, r); persistRows(); close(); toast("Lançamento atualizado"); render();
      } catch (err) { b.disabled = false; say(errorCopy(err), true); }
    };
  }

  // ---------- eventos ----------
  function setSub(sub) {
    state.sub = sub;
    $("st-resumo").setAttribute("aria-selected", sub === "resumo"); $("st-extrato").setAttribute("aria-selected", sub === "extrato");
    $("sub-resumo").style.display = sub === "resumo" ? "flex" : "none";
    $("sub-extrato").style.display = sub === "extrato" ? "flex" : "none";
    render();
  }
  $("st-resumo").addEventListener("click", () => setSub("resumo"));
  $("st-extrato").addEventListener("click", () => setSub("extrato"));
  $("year").addEventListener("change", e => { state.year = +e.target.value; state.month = state.year === today.getFullYear() ? today.getMonth() : 11; render(); });
  $("months").addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (b) { state.month = +b.dataset.m; state.led.limit = 80; render(); } });
  $("refresh").addEventListener("click", () => { if (HIST[state.year]) loadHist(state.year, true); else load(true); });
  $("refresh-all").addEventListener("click", () => { if (HIST[state.year]) loadHist(state.year, true); else load(true, true); });
  $("expand-all").addEventListener("click", () => { const A = aggregate(state.year); if (state.openMatrix.size) state.openMatrix.clear(); else Object.keys(A.cat).forEach(c => state.openMatrix.add(c)); renderMatrix(A); });
  $("ann-exp").addEventListener("click", () => { state.ann.mode = "exp"; state.ann.hidden.clear(); renderAnnual(aggregate(state.year)); });
  $("ann-inc").addEventListener("click", () => { state.ann.mode = "inc"; state.ann.drill = null; state.ann.hidden.clear(); renderAnnual(aggregate(state.year)); });
  $("edit-start").addEventListener("click", () => { const f = $("start-form"); f.hidden = !f.hidden; $("start-input").value = startBalance() ? String(startBalance()).replace(".", ",") : ""; if (!f.hidden) $("start-input").focus(); });
  $("start-cancel").addEventListener("click", () => { $("start-form").hidden = true; });
  $("edit-budget").addEventListener("click", () => { const f = $("budget-form"); if (f.hidden) { renderBudgetForm(); f.hidden = false; f.querySelector("input")?.focus(); } else f.hidden = true; });
  $("budget-form").addEventListener("input", e => { if (e.target.dataset.kind === "sub") syncCatFromSubs(e.target.dataset.cat); budTotal(); });
  $("budget-form").addEventListener("submit", e => {
    e.preventDefault();
    const vals = {}, subVals = {};
    for (const inp of $("budget-form").querySelectorAll("input")) {
      const v = parseMoney(inp.value); if (!(isFinite(v) && v > 0)) continue;
      (inp.dataset.kind === "sub" ? subVals : vals)[inp.name] = Math.round(v * 100) / 100;
    }
    $("budget-form").hidden = true;
    const k = ymKey(state.year, state.month);
    saveConfig({ orcamento: Object.assign({}, state.config?.orcamento || {}, { [k]: vals }), orcamentoSub: Object.assign({}, state.config?.orcamentoSub || {}, { [k]: subVals }) });
  });
  $("start-form").addEventListener("submit", e => { e.preventDefault(); const v = parseMoney($("start-input").value); if (!isFinite(v)) return; $("start-form").hidden = true; saveConfig({ saldoInicial: Object.assign({}, state.config?.saldoInicial || {}, { [String(state.year)]: v }) }); });
  $("add-goal").addEventListener("click", () => { const f = $("goal-form"); f.hidden = !f.hidden; if (!f.hidden) $("g-name").focus(); });
  $("g-cancel").addEventListener("click", () => { $("goal-form").hidden = true; });
  $("goal-form").addEventListener("submit", e => {
    e.preventDefault();
    const nome = $("g-name").value.trim(), alvo = parseMoney($("g-target").value), atual = parseMoney($("g-now").value) || 0;
    if (!nome || !isFinite(alvo) || alvo <= 0) return;
    $("goal-form").reset(); $("goal-form").hidden = true;
    saveConfig({ metas: (state.config?.metas || []).concat([{ id: "m" + Date.now().toString(36), nome, alvo, atual }]) });
  });
  $("f-period").addEventListener("change", e => { state.led.period = e.target.value; state.led.limit = 80; renderLedger(); });
  $("f-kind").addEventListener("change", e => { state.led.kind = e.target.value; state.led.limit = 80; renderLedger(); });
  $("f-cat").addEventListener("change", e => { state.led.cat = e.target.value; state.led.sub = ""; state.led.limit = 80; renderLedger(); });
  $("f-sub").addEventListener("change", e => { state.led.sub = e.target.value; state.led.limit = 80; renderLedger(); });
  let qTimer; $("f-q").addEventListener("input", e => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.led.q = e.target.value; state.led.limit = 80; renderLedger(); }, 150); });
  $("ledger-more").addEventListener("click", () => { state.led.limit += 120; renderLedger(); });
  document.querySelectorAll("#entry .kind button").forEach(b => b.addEventListener("click", () => { state.entryKind = b.dataset.kind; syncEntry(); }));
  $("e-cat").addEventListener("change", syncEntrySubs);
  $("entry").addEventListener("submit", submitEntry);
  // (troca de abas e barra lateral: feitas pelo app.js)

  // ---------- início ----------
  try { const c = JSON.parse(localStorage.getItem(COLOR_KEY) || "null"); if (c && c.cat) state.colors = c; } catch {}
  const cached = readCache();
  if (cached) { state.main = state.rows = cached.rows; state.loadedAt = cached.loadedAt; setStatus("Última leitura salva · atualizando…", ""); }
  $("e-date").value = todayISO;
  syncEntry();
  render();
  initDb();
  load(false);
})();

