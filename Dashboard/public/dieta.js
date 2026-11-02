// Alimentação (dentro da Saúde), nos fluxos do FoodNoms: diário por refeição, metas em anéis, registro com porção,
// biblioteca de alimentos, código de barras (Open Food Facts) e descrição por texto (Claude).
// Grava no MESMO documento do dia que a Saúde já lê (saude/nutricao/dias/<data>), então Hoje/Semana/Progresso
// e o balanço calórico passam a usar o que é registrado aqui.
import { db, api } from "/data.js";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, k) => { const x = new Date(d); x.setDate(x.getDate() + k); return x; };
const num = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(n) ? n : null; };
const f1 = v => (v == null ? "—" : (Math.round(v * 10) / 10).toLocaleString("pt-BR"));
const f0 = v => (v == null ? "—" : Math.round(v).toLocaleString("pt-BR"));
const P = () => window.painelSaude;
const DAYS = () => (P() ? P().state().days : {}) || {};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const MEALS = [["Café da manhã", "07:30"], ["Lanche", "10:30"], ["Almoço", "13:00"], ["Pré-treino", "16:30"], ["Pós-treino", "19:00"], ["Jantar", "20:30"], ["Ceia", "22:30"]];
const MEAL_ALIAS = { "Lanche da tarde": "Lanche", "Lanche da manhã": "Lanche", "Snack": "Lanche", "Breakfast": "Café da manhã", "Lunch": "Almoço", "Dinner": "Jantar" };
const NUT = [["kcal", "Calorias", "kcal"], ["gord", "Gordura total", "g"], ["sat", "Saturada", "g", 1], ["trans", "Trans", "g", 1], ["poli", "Poli-insaturada", "g", 1], ["mono", "Monoinsaturada", "g", 1],
  ["col", "Colesterol", "mg"], ["carb", "Carboidratos", "g"], ["acucar", "Açúcares", "g", 1], ["fibra", "Fibra", "g"], ["prot", "Proteína", "g"], ["sodio", "Sódio", "mg"]];
const MAC = [["prot", "Proteína", "P", "var(--m-prot)"], ["gord", "Gordura", "G", "var(--m-gord)"], ["carb", "Carboidratos", "C", "var(--m-carb)"], ["kcal", "Calorias", "K", "var(--m-kcal)"]];

const D = { day: iso(new Date()), view: "diario", foods: [], open: new Set(), started: false, entry: null, libQ: "", taco: [] };
const fold = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
// TACO (Tabela Brasileira de Composição de Alimentos, NEPA/Unicamp): 591 alimentos, valores por 100 g
let tacoP; const loadTaco = () => tacoP || (tacoP = fetch("/taco.json").then(r => r.json()).then(l => { D.taco = l.map(f => Object.assign(f, { fonte: "taco", marca: "", porcoes: [], _k: fold(f.nome) })); }).catch(() => {}));
function tacoFind(q, max = 25) {
  const ws = fold(q).split(/[\s,]+/).filter(w => w.length > 1); if (!ws.length) return [];
  return D.taco.filter(f => ws.every(w => f._k.includes(w))).sort((a, b) => a._k.indexOf(ws[0]) - b._k.indexOf(ws[0]) || a.nome.length - b.nome.length).slice(0, max);
}

// ---------------- alimentos ----------------
const per = (food, gramas) => { const o = {}; for (const [k] of NUT) { const v = food.n && food.n[k]; o[k] = v == null ? null : Math.round(v * gramas / 100 * 10) / 10; } return o; };
function gramsOf(food, qtd, unid) {
  if (unid === "g" || unid === "ml") return qtd;
  const p = (food.porcoes || []).find(p => p.nome === unid); return p ? p.g * qtd : qtd;
}
function recents() {
  // itens registrados nos últimos 45 dias, sem repetir (o mais recente primeiro)
  const out = new Map(), lim = iso(addDays(new Date(), -45));
  for (const d of Object.keys(DAYS()).sort().reverse()) {
    if (d < lim) break;
    for (const r of DAYS()[d].refeicoes || []) for (const it of r.itens || []) { const k = (it.alimentoId || it.nome).toLowerCase(); if (!out.has(k)) out.set(k, it); }
  }
  return [...out.values()];
}
const foodById = id => D.foods.find(f => f.id === id);
function foodFromItem(it) {
  // item antigo (colado do FoodNoms) vira um alimento com kcal por 100 g, a partir da porção registrada
  const f = it.alimentoId && foodById(it.alimentoId); if (f) return f;
  const m = String(it.porcao || "").match(/([\d.,]+)\s*(g|ml)\b/i), g = m ? num(m[1]) : null;
  return { id: null, nome: it.nome, marca: it.marca || "", base: m ? m[2].toLowerCase() : "g", porcoes: [], fonte: "historico",
    n: { kcal: g ? Math.round(it.kcal / g * 1000) / 10 : null, prot: it.prot != null && g ? it.prot / g * 100 : null, carb: it.carb != null && g ? it.carb / g * 100 : null, gord: it.gord != null && g ? it.gord / g * 100 : null }, _g: g };
}

// ---------------- dia ----------------
function mealsOf(day) {
  const doc = DAYS()[day] || {}, by = new Map(MEALS.map(([n, h]) => [n, { nome: n, hora: h, itens: [], vazia: true }]));
  for (const r of doc.refeicoes || []) {
    const nome = MEAL_ALIAS[r.nome] || r.nome;
    const m = by.get(nome) || (by.set(nome, { nome, hora: r.hora || "12:00", itens: [] }), by.get(nome));
    Object.assign(m, r, { nome, vazia: false });
  }
  return [...by.values()].sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
}
function mealTotals(m) {
  // refeição antiga (colada do FoodNoms): macros só existem no total da refeição
  if (!m._legado && (m.itens || []).length && !m.itens.some(it => it.prot != null) && m.prot != null)
    return { kcal: +m.kcal || 0, prot: +m.prot || 0, carb: +m.carb || 0, gord: +m.gord || 0, fibra: +m.fibra || 0, sodio: +m.sodio || 0 };
  const t = { kcal: 0, prot: 0, carb: 0, gord: 0, fibra: 0, sodio: 0 };
  for (const it of m.itens || []) for (const k in t) t[k] += +it[k] || 0;
  const lg = m._legado || {}; for (const k in lg) t[k] = (t[k] || 0) + (+lg[k] || 0);
  for (const k in t) t[k] = Math.round(t[k] * 10) / 10;
  return t;
}
async function saveDay(day, meals) {
  const old = DAYS()[day] || {}, refeicoes = meals.filter(m => (m.itens || []).length || (m._legado && Object.keys(m._legado).length)).map(m => {
    const t = mealTotals(m); const r = { nome: m.nome, hora: m.hora, itens: m.itens, kcal: t.kcal, prot: t.prot, carb: t.carb, gord: t.gord };
    if (m._legado) r._legado = m._legado; return r;
  });
  const tot = { kcal: 0, prot: 0, carb: 0, gord: 0, fibra: 0, sodio: 0 };
  for (const r of refeicoes) { const t = mealTotals(r); for (const k in tot) tot[k] += t[k] || 0; }
  for (const k in tot) tot[k] = Math.round(tot[k] * 10) / 10;
  const doc = Object.assign({}, old, { data: day, refeicoes, itens: refeicoes.reduce((a, r) => a + r.itens.length, 0), origem: old.origem && old.origem !== "app" ? old.origem + "+app" : "app" }, tot);
  if (!refeicoes.length) { await db.doc(`saude/nutricao/dias/${day}`).delete(); return; }
  await db.doc(`saude/nutricao/dias/${day}`).set(doc);
}
// refeição antiga (macros só no total): na primeira edição, guarda a parte dos macros que não está nos itens
function legacyFix(m) {
  if (m._legado || !(m.itens || []).length || m.itens.some(it => it.prot != null)) return;
  const sumK = (m.itens || []).reduce((a, it) => a + (+it.kcal || 0), 0);
  m._legado = { prot: +m.prot || 0, carb: +m.carb || 0, gord: +m.gord || 0, kcal: Math.round(((+m.kcal || 0) - sumK) * 10) / 10 };
}

// ---------------- tela ----------------
function render() {
  const root = $("dieta-root"); if (!root) return;
  if (D.view === "biblioteca") { root.innerHTML = libHtml(); return; }
  const day = D.day, d = parseDay(day), t = P() && P().dayTarget(day), meals = mealsOf(day), tot = { kcal: 0, prot: 0, carb: 0, gord: 0 };
  for (const m of meals) { const x = mealTotals(m); for (const k in tot) tot[k] += x[k] || 0; }
  const wk = addDays(d, -d.getDay());
  root.innerHTML = `
    <div class="ft-head"><div><h2>Diário</h2><small>${day === iso(new Date()) ? "Hoje, " : ""}${d.toLocaleDateString("pt-BR", { weekday: day === iso(new Date()) ? undefined : "long", day: "numeric", month: "short" })}</small></div>
      <div class="ft-acts glass"><button data-act="today" aria-label="Hoje">Hoje</button><button data-act="lib" aria-label="Biblioteca">Biblioteca</button></div></div>
    <div class="ft-week" id="ft-week">${Array.from({ length: 7 }, (_, i) => { const x = addDays(wk, i), k = iso(x), has = (DAYS()[k] || {}).kcal; return `<button data-act="day" data-d="${k}" class="${k === day ? "sel" : ""}${k === iso(new Date()) ? " today" : ""}${has ? " has" : ""}"><span>${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][i]}</span><b>${x.getDate()}</b></button>`; }).join("")}</div>
    <div class="ft-h"><h3>Metas</h3><button class="linkbtn" data-act="goals">Editar</button></div>
    <div class="ft-goals">${MAC.map(([k, l, , c]) => { const goal = t ? t[k] : null, v = tot[k], diff = goal ? v - goal : null, pct = goal ? Math.min(1, v / goal) : 0, over = diff != null && diff > 0;
      return `<div class="ft-goal"><div><b>${l}</b><small>${goal ? `${f0(Math.abs(diff))} ${over ? "acima" : "abaixo"}${Math.abs(diff) <= goal * .05 ? " ✓" : ""}` : "sem meta"}</small></div>${ring(pct, c, over)}</div>`; }).join("")}</div>
    ${meals.map(m => mealHtml(m)).join("")}
    <button class="ft-fab" data-act="add" aria-label="Adicionar alimento">+</button>`;
}
function ring(p, c, over) {
  const r = 17, C = 2 * Math.PI * r;
  return `<svg class="ft-ring" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${r}" style="stroke:color-mix(in srgb, ${c} 18%, transparent)"/><circle cx="22" cy="22" r="${r}" style="stroke:${c};stroke-dasharray:${(C * p).toFixed(1)} ${C.toFixed(1)}${over ? ";filter:saturate(1.3)" : ""}" transform="rotate(-90 22 22)"/></svg>`;
}
function chips(o) {
  return `<span class="ft-chips"><span class="k">${f0(o.kcal)}</span>${o.carb != null ? `<span class="c">C ${f1(o.carb)}</span>` : ""}${o.gord != null ? `<span class="g">G ${f1(o.gord)}</span>` : ""}${o.prot != null ? `<span class="p">P ${f1(o.prot)}</span>` : ""}${o.fibra ? `<span class="f">${f1(o.fibra)}</span>` : ""}</span>`;
}
function mealHtml(m) {
  const items = m.itens || [], t = mealTotals(m), open = D.open.has(m.nome) || !items.length;
  return `<section class="ft-meal">
    <button class="ft-meal-h" data-act="toggle" data-m="${esc(m.nome)}">${items.length ? `<small>${esc(m.hora || "")}</small>` : ""}<b>${esc(m.nome)}</b>${items.length ? `<i class="chev${open ? " open" : ""}">›</i>` : ""}</button>
    <div class="ft-card">
      ${items.length && !open ? `<button class="ft-sum" data-act="toggle" data-m="${esc(m.nome)}"><b>${items.length} ${items.length > 1 ? "itens" : "item"}</b><span>${esc(items.map(i => i.nome).join(", "))}</span>${chips(t)}</button>`
        : items.map((it, j) => `<button class="ft-item" data-act="entry" data-m="${esc(m.nome)}" data-j="${j}"><b>${esc(it.nome)}</b><small>${it.marca ? esc(it.marca) + " · " : ""}${esc(it.porcao || "")}${it.precisao === "estimado" ? " · estimado" : ""}</small>${chips(it)}</button>`).join("")}
      ${open || !items.length ? `<div class="ft-addrow"><button data-act="add" data-m="${esc(m.nome)}">Adicionar alimento</button><button class="dots" data-act="meal-menu" data-m="${esc(m.nome)}" aria-label="Mais">⋯</button></div>` : ""}
    </div>
    ${items.length && open ? `<div class="ft-mtot">${chips(t)}</div>` : ""}
  </section>`;
}

// ---------------- folhas ----------------
function sheet(html) { const m = $("ft-sheet"); m.hidden = false; m.innerHTML = `<div class="ft-sheet-box">${html}</div>`; document.documentElement.classList.add("tr-noscroll"); }
function closeSheet() { stopScan(); const m = $("ft-sheet"); m.hidden = true; m.innerHTML = ""; D.entry = null; document.documentElement.classList.remove("tr-noscroll"); }
const head = (title, ok) => `<div class="ft-sh-h"><button class="gbtn round" data-act="close" aria-label="Fechar">✕</button><h3>${title}</h3>${ok ? `<button class="ft-ok" data-act="${ok}" aria-label="Confirmar">✓</button>` : "<span></span>"}</div>`;

// adicionar: busca, recentes, biblioteca, Open Food Facts, código de barras, rápido, IA
function openAdd(meal) {
  D.addMeal = meal || nextMeal();
  sheet(`${head(`Adicionar · ${esc(D.addMeal)}`)}
    <input class="tr-search" id="ft-q" type="search" placeholder="Buscar alimento" autocomplete="off">
    <div class="ft-tools"><button class="gbtn" data-act="scan">Escanear código</button><button class="gbtn" data-act="new-food">Novo alimento</button><button class="gbtn" data-act="quick">Adição rápida</button><button class="gbtn" data-act="ai">Descrever (IA)</button></div>
    <div id="ft-res"></div>`);
  addList(); loadTaco().then(() => addList()); setTimeout(() => $("ft-q") && $("ft-q").focus(), 120);
}
function nextMeal() { const h = new Date(); const hm = `${pad(h.getHours())}:${pad(h.getMinutes())}`; let best = MEALS[0][0]; for (const [n, t] of MEALS) if (t <= hm) best = n; return best; }
function addList(off) {
  const box = $("ft-res"); if (!box) return;
  const q = (($("ft-q") || {}).value || "").toLowerCase().trim();
  const rec = recents().filter(it => !q || it.nome.toLowerCase().includes(q)).slice(0, q ? 20 : 12);
  const mine = D.foods.filter(f => !q || f.nome.toLowerCase().includes(q) || (f.marca || "").toLowerCase().includes(q)).sort((a, b) => (b.usadoEm || "").localeCompare(a.usadoEm || "")).slice(0, 30);
  const tc = q.length >= 2 ? tacoFind(q) : []; D.tacoList = tc;
  box.innerHTML = `${rec.length ? `<h4 class="tr-sub">Recentes</h4><ul class="ios-list ft-list">${rec.map((it, k) => `<li data-act="pick-recent" data-k="${k}"><span><b>${esc(it.nome)}</b><small class="hint">${it.marca ? esc(it.marca) + " · " : ""}${esc(it.porcao || "")} · ${f0(it.kcal)} kcal</small></span><span class="plus">+</span></li>`).join("")}</ul>` : ""}
    ${mine.length ? `<h4 class="tr-sub">Biblioteca</h4><ul class="ios-list ft-list">${mine.map(f => `<li data-act="pick-food" data-id="${esc(f.id)}"><span><b>${esc(f.nome)}</b><small class="hint">${f.marca ? esc(f.marca) + " · " : ""}${f.n && f.n.kcal != null ? f0(f.n.kcal) + " kcal/100" + (f.base || "g") : "sem kcal"}${f.fonte === "historico" ? " · do histórico" : ""}</small></span><span class="plus">+</span></li>`).join("")}</ul>` : ""}
    ${tc.length ? `<h4 class="tr-sub">TACO · alimentos genéricos</h4><ul class="ios-list ft-list">${tc.map((f, k) => `<li data-act="pick-taco" data-k="${k}"><span><b>${esc(f.nome)}</b><small class="hint">${f0(f.n.kcal)} kcal · P ${f1(f.n.prot)} · C ${f1(f.n.carb)} · G ${f1(f.n.gord)} /100 g</small></span><span class="plus">+</span></li>`).join("")}</ul>` : ""}
    ${q.length >= 2 ? `<button class="gbtn big" data-act="off-search">Buscar “${esc(q)}” no Open Food Facts</button>` : ""}
    ${off ? off : ""}
    ${!rec.length && !mine.length && q.length < 2 ? `<p class="empty">Busque pelo nome, escaneie o código de barras ou cadastre um alimento.</p>` : ""}`;
  D.recentList = rec;
}
async function offSearch() {
  const q = $("ft-q").value.trim(); addList(`<p class="hint">Buscando no Open Food Facts…</p>`);
  try {
    const r = await api(`food?q=${encodeURIComponent(q)}`); D.offList = r.foods;
    addList(r.foods.length ? `<h4 class="tr-sub">Open Food Facts</h4><ul class="ios-list ft-list">${r.foods.map((f, k) => `<li data-act="pick-off" data-k="${k}"><span><b>${esc(f.nome)}</b><small class="hint">${f.marca ? esc(f.marca) + " · " : ""}${f0(f.n.kcal)} kcal/100${f.base}</small></span><span class="plus">+</span></li>`).join("")}</ul><p class="hint ft-attr">Dados: Open Food Facts (ODbL).</p>` : `<p class="empty">Nada no Open Food Facts. Cadastre o alimento ou use Descrever (IA).</p>`);
  } catch (e) { addList(`<p class="msg err">${esc(e.message)}</p>`); }
}

// registro (Editar registro / novo registro)
function openEntry(food, opts) {
  // opts: { meal, day, item (existente), j }
  const it = opts.item, base = food.base || "g";
  const defU = it ? (it.unid || base) : ((food.porcoes || [])[0] ? food.porcoes[0].nome : base);
  const defQ = it ? (it.qtd ?? food._g ?? num(String(it.porcao).match(/[\d.,]+/)?.[0]) ?? 100) : ((food.porcoes || [])[0] ? 1 : 100);
  D.entry = { food, marca: it ? (it.marca || "") : (food.marca || ""), meal: opts.meal, day: opts.day || D.day, j: opts.j, item: it, qtd: defQ, unid: defU, hora: it?.hora || (mealsOf(D.day).find(m => m.nome === opts.meal) || {}).hora || "12:00", precisao: it?.precisao || "exato" };
  renderEntry();
}
function entryValues() {
  const E = D.entry, g = gramsOf(E.food, E.qtd || 0, E.unid);
  if (E.food.n && E.food.n.kcal != null) return Object.assign(per(E.food, g), { _g: g });
  // item antigo sem base por 100 g: usa os números registrados
  const it = E.item || {}; return { kcal: it.kcal, prot: it.prot ?? null, carb: it.carb ?? null, gord: it.gord ?? null, _g: g };
}
function renderEntry() {
  const E = D.entry, f = E.food, v = entryValues(), t = P() && P().dayTarget(E.day), base = f.base || "g";
  const units = [base, ...(f.porcoes || []).map(p => p.nome)];
  sheet(`${head(E.item ? "Editar registro" : "Novo registro", "entry-save")}
    <div class="ft-summary"><b>${esc(f.nome)}</b><small>${f.marca ? esc(f.marca) + " · " : ""}${f1(E.qtd)} ${esc(E.unid)}</small>${chips(v)}</div>
    <div class="group-ios"><label class="row"><span>Marca</span><input id="fe-b" value="${esc(E.marca ?? f.marca ?? "")}" placeholder="opcional" style="text-align:right;flex:1;min-width:0;background:transparent"></label></div>
    <div class="group-ios">
      <label class="row"><span>Data</span><span class="dt"><input type="date" id="fe-d" value="${E.day}"><input type="time" id="fe-h" value="${E.hora}"></span></label>
      <label class="row"><span>Refeição</span><select id="fe-m">${MEALS.map(([n]) => `<option ${n === E.meal ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    </div>
    <div class="group-ios">
      <label class="row"><span>Porção</span><span class="dt"><input id="fe-q" inputmode="decimal" value="${E.qtd}" style="width:84px;text-align:center"><select id="fe-u">${units.map(u => `<option ${u === E.unid ? "selected" : ""}>${esc(u)}</option>`).join("")}</select></span></label>
      <label class="row"><span>Precisão</span><select id="fe-p"><option value="exato" ${E.precisao === "exato" ? "selected" : ""}>Exata</option><option value="estimado" ${E.precisao === "estimado" ? "selected" : ""}>Estimada</option></select></label>
    </div>
    ${t ? `<h4 class="tr-sub">Impacto nas metas</h4><div class="group-ios ft-impact">${MAC.map(([k, l, s, c]) => `<div class="row"><span><i style="--c:${c}">${s}</i>${l}</span><span>+${f0(v[k] || 0)}${k === "kcal" ? " kcal" : " g"} (${t[k] ? Math.round((v[k] || 0) / t[k] * 100) : 0}%)</span></div>`).join("")}</div>` : ""}
    <h4 class="tr-sub">Informação nutricional · por porção</h4>
    <div class="group-ios ft-facts">${NUT.map(([k, l, u, sub]) => `<div class="row${sub ? " sub" : ""}"><span>${l}</span><span>${v[k] == null ? "—" : f1(v[k]) + " " + u}</span></div>`).join("")}</div>
    ${f.fonte === "off" ? `<p class="hint ft-attr">Fonte: Open Food Facts (ODbL)${f.codigo ? " · " + esc(f.codigo) : ""}.</p>` : f.fonte === "taco" ? `<p class="hint ft-attr">Fonte: TACO, 4ª edição (NEPA/Unicamp). Valores por 100 g do alimento como descrito.</p>` : ""}
    <div class="ft-bottom">${E.item ? `<button class="gbtn danger" data-act="entry-del">Apagar</button>` : ""}${f.id ? `<button class="gbtn" data-act="food-edit" data-id="${esc(f.id)}">Editar alimento</button>` : `<button class="gbtn" data-act="food-save-from-entry">Salvar na biblioteca</button>`}</div>`);
}
async function saveEntry() {
  const E = D.entry; E.qtd = num($("fe-q").value) || 0; E.unid = $("fe-u").value; E.day = $("fe-d").value || E.day; E.hora = $("fe-h").value || E.hora; E.precisao = $("fe-p").value;
  const meal = $("fe-m").value, v = entryValues(), f = E.food; E.marca = $("fe-b").value.trim();
  if (!(v.kcal >= 0)) { alert("Este alimento não tem calorias cadastradas. Edite o alimento antes."); return; }
  const item = { id: (E.item && E.item.id) || uid(), nome: f.nome, marca: E.marca, alimentoId: f.id || null, qtd: E.qtd, unid: E.unid, gramas: Math.round(v._g * 10) / 10,
    porcao: E.unid === "g" || E.unid === "ml" ? `${f1(E.qtd)}${E.unid}` : `${f1(E.qtd)} × ${E.unid}`, hora: E.hora, precisao: E.precisao };
  for (const [k] of NUT) if (v[k] != null) item[k] = v[k];
  // remove do lugar antigo (se mudou dia ou refeição) e grava no novo
  if (E.item) {
    const ms = mealsOf(E.origDay || D.day); const om = ms.find(m => m.nome === E.meal); legacyFix(om); om.itens.splice(E.j, 1);
    if ((E.origDay || D.day) !== E.day || E.meal !== meal) await saveDay(E.origDay || D.day, ms);
    if ((E.origDay || D.day) === E.day && E.meal === meal) { om.itens.splice(E.j, 0, item); await saveDay(E.day, ms); return done(f); }
  }
  const ms = mealsOf(E.day), m = ms.find(x => x.nome === meal); legacyFix(m); m.itens = (m.itens || []).concat(item); m.hora = m.itens.length === 1 ? E.hora : m.hora;
  await saveDay(E.day, ms); done(f);
  async function done(food) {
    if (food.id) { try { await db.doc(`saude/alimentos/${food.id}`).update(Object.assign({ usadoEm: new Date().toISOString() }, E.marca && !food.marca ? { marca: E.marca } : {})); } catch {} }
    closeSheet(); D.open.add(meal); D.day = E.day; toast("Registrado");
  }
}
async function delEntry() {
  const E = D.entry, ms = mealsOf(D.day), m = ms.find(x => x.nome === E.meal); legacyFix(m); m.itens.splice(E.j, 1);
  await saveDay(D.day, ms); closeSheet(); toast("Removido");
}

// novo alimento / editar alimento
function openFood(f, after) {
  D.foodEdit = { f: f || { nome: "", marca: "", codigo: "", base: "g", porcoes: [], n: {} }, after };
  const x = D.foodEdit.f, p = (x.porcoes || [])[0] || { nome: "", g: "" };
  sheet(`${head(f && f.id ? "Editar alimento" : "Novo alimento", "food-save")}
    <div class="group-ios"><input id="fd-n" placeholder="Nome" value="${esc(x.nome)}"><input id="fd-m" placeholder="Marca" value="${esc(x.marca || "")}">
      <label class="row"><span>Código de barras</span><span class="dt"><input id="fd-c" inputmode="numeric" value="${esc(x.codigo || "")}" placeholder="Nenhum" style="width:150px"><button class="gbtn small" data-act="scan-into">Escanear</button></span></label></div>
    <h4 class="tr-sub">Porção</h4>
    <div class="group-ios"><label class="row"><span>Base</span><select id="fd-b"><option value="g" ${x.base !== "ml" ? "selected" : ""}>por 100 g</option><option value="ml" ${x.base === "ml" ? "selected" : ""}>por 100 ml</option></select></label>
      <label class="row"><span>Porção comum</span><span class="dt"><input id="fd-pn" placeholder="ex.: 1 fatia" value="${esc(p.nome)}" style="width:120px"><input id="fd-pg" inputmode="decimal" placeholder="g" value="${esc(p.g)}" style="width:70px"></span></label></div>
    <h4 class="tr-sub">Informação nutricional · por 100 ${x.base === "ml" ? "ml" : "g"}</h4>
    <div class="group-ios ft-facts">${NUT.map(([k, l, u, sub]) => `<label class="row${sub ? " sub" : ""}"><span>${l} (${u})</span><input data-n="${k}" inputmode="decimal" value="${x.n && x.n[k] != null ? f1(x.n[k]).replace(".", "") : ""}" placeholder="—"></label>`).join("")}</div>
    ${f && f.id ? `<div class="ft-bottom"><button class="gbtn danger" data-act="food-del" data-id="${esc(f.id)}">Apagar da biblioteca</button></div>` : ""}`);
}
async function saveFood() {
  const F = D.foodEdit, x = F.f, n = {};
  document.querySelectorAll("#ft-sheet [data-n]").forEach(i => { const v = num(i.value); if (v != null) n[i.dataset.n] = v; });
  const nome = $("fd-n").value.trim(); if (!nome) { alert("Dê um nome ao alimento."); return; }
  if (n.kcal == null && (n.prot != null || n.carb != null || n.gord != null)) n.kcal = Math.round(((n.prot || 0) * 4 + (n.carb || 0) * 4 + (n.gord || 0) * 9) * 10) / 10;
  const pn = $("fd-pn").value.trim(), pg = num($("fd-pg").value);
  const doc = { nome, marca: $("fd-m").value.trim(), codigo: $("fd-c").value.replace(/\D/g, ""), base: $("fd-b").value, porcoes: pn && pg ? [{ nome: pn, g: pg }] : [], n, fonte: x.fonte === "off" ? "off" : x.fonte === "historico" ? "manual" : (x.fonte || "manual"), atualizadoEm: new Date().toISOString() };
  const id = x.id || "a" + uid();
  await db.doc(`saude/alimentos/${id}`).set(Object.assign({}, x.id ? {} : { criadoEm: new Date().toISOString() }, doc));
  const saved = Object.assign({ id }, doc);
  if (F.after) { openEntry(saved, F.after); } else { closeSheet(); toast("Alimento salvo"); }
}

// adição rápida (só kcal e macros)
function openQuick(meal) {
  sheet(`${head("Adição rápida", "quick-save")}
    <div class="group-ios"><input id="fq-n" placeholder="Descrição (ex.: Café com leite)"><input id="fq-b" placeholder="Marca (opcional)"></div>
    <div class="group-ios ft-facts">${[["kcal", "Calorias (kcal)"], ["prot", "Proteína (g)"], ["carb", "Carboidratos (g)"], ["gord", "Gordura (g)"]].map(([k, l]) => `<label class="row"><span>${l}</span><input data-q="${k}" inputmode="decimal" placeholder="—"></label>`).join("")}</div>`);
  D.quickMeal = meal;
}
async function saveQuick() {
  const v = {}; document.querySelectorAll("#ft-sheet [data-q]").forEach(i => { const x = num(i.value); if (x != null) v[i.dataset.q] = x; });
  if (v.kcal == null) { if (v.prot != null || v.carb != null || v.gord != null) v.kcal = (v.prot || 0) * 4 + (v.carb || 0) * 4 + (v.gord || 0) * 9; else { alert("Informe as calorias."); return; } }
  const ms = mealsOf(D.day), m = ms.find(x => x.nome === D.quickMeal); legacyFix(m);
  m.itens = (m.itens || []).concat(Object.assign({ id: uid(), nome: $("fq-n").value.trim() || "Adição rápida", marca: $("fq-b").value.trim(), porcao: "1 porção", precisao: "estimado", hora: m.hora }, v));
  await saveDay(D.day, ms); closeSheet(); D.open.add(D.quickMeal); toast("Registrado");
}

// descrever com IA (Claude): texto → itens com gramas e macros estimados
function openAI(meal) {
  D.aiMeal = meal;
  sheet(`${head("Descrever refeição")}
    <p class="hint">Escreva o que comeu, com quantidades quando souber. O Claude estima os valores; você confere antes de salvar.</p>
    <div class="group-ios"><textarea id="fa-t" rows="4" placeholder="ex.: 200 g de arroz branco, 135 g de peito de frango grelhado, salada de alface e tomate com 1 colher de azeite"></textarea></div>
    <button class="btn primary big" data-act="ai-run">Analisar</button><div id="fa-out"></div>`);
}
async function runAI() {
  const txt = $("fa-t").value.trim(), out = $("fa-out"); if (!txt) return;
  if (!window.claude || !(await window.claude.use("sample"))) { out.innerHTML = `<p class="msg err">O Claude não está ligado ao app (falta ANTHROPIC_API_KEY).</p>`; return; }
  out.innerHTML = `<p class="hint">Analisando…</p>`;
  try {
    const sample = await window.claude.use("sample");
    const lib = D.foods.filter(f => f.n && f.n.kcal != null).slice(0, 80).map(f => `${f.nome}${f.marca ? " (" + f.marca + ")" : ""}: ${f.n.kcal} kcal, P ${f.n.prot ?? "?"}, C ${f.n.carb ?? "?"}, G ${f.n.gord ?? "?"} por 100 ${f.base || "g"}`).join("\n");
    const j = await sample.json(`Estime a composição nutricional da refeição descrita. Use valores típicos de tabelas brasileiras (como a TACO) para alimentos genéricos; quando um item corresponder a um alimento da BIBLIOTECA do usuário, use os valores dela. Quando a quantidade não for dita, assuma uma porção usual e marque "estimado": true.
Quando o usuário citar uma marca, preencha "marca".
Responda só com JSON: {"itens":[{"nome": string em português, "marca": string ou "", "gramas": número, "kcal": número, "prot": número, "carb": número, "gord": número, "fibra": número, "estimado": boolean}]}
BIBLIOTECA:
${lib || "(vazia)"}
TACO (por 100 g; prefira estes valores para alimentos genéricos):
${[...new Set(txt.split(/[\s,;.]+/).filter(w => w.length >= 4))].flatMap(w => tacoFind(w, 6)).slice(0, 40).map(f => `${f.nome}: ${f.n.kcal} kcal, P ${f.n.prot ?? "?"}, C ${f.n.carb ?? "?"}, G ${f.n.gord ?? "?"}, fibra ${f.n.fibra ?? "?"}`).join("\n") || "(nenhum)"}
REFEIÇÃO:
${txt}`, { modelTier: "default" });
    D.aiItems = (j.itens || []).filter(i => i && i.nome && isFinite(+i.kcal));
    out.innerHTML = D.aiItems.length ? `<ul class="ios-list ft-list">${D.aiItems.map(i => `<li><span><b>${esc(i.nome)}</b><small class="hint">${f0(i.gramas)} g${i.estimado ? " · quantidade estimada" : ""}</small>${chips(i)}</span></li>`).join("")}</ul>
      <button class="btn primary big" data-act="ai-save">Adicionar a ${esc(D.aiMeal)}</button>` : `<p class="empty">Não consegui identificar alimentos no texto.</p>`;
  } catch (e) { out.innerHTML = `<p class="msg err">${esc(e.message || e.code || "Falhou")}</p>`; }
}
async function saveAI() {
  const ms = mealsOf(D.day), m = ms.find(x => x.nome === D.aiMeal); legacyFix(m);
  m.itens = (m.itens || []).concat(D.aiItems.map(i => ({ id: uid(), nome: i.nome, marca: i.marca || "", qtd: +i.gramas || null, unid: "g", gramas: +i.gramas || null, porcao: i.gramas ? `${f0(i.gramas)}g` : "1 porção", precisao: "estimado", hora: m.hora,
    kcal: +i.kcal || 0, prot: +i.prot || 0, carb: +i.carb || 0, gord: +i.gord || 0, fibra: +i.fibra || 0 })));
  await saveDay(D.day, ms); closeSheet(); D.open.add(D.aiMeal); toast("Refeição registrada");
}

// ---------------- código de barras ----------------
let scanStream = null, scanReader = null, scanLoop = 0;
async function scan(onCode) {
  const box = document.createElement("div"); box.className = "ft-scan"; box.id = "ft-scan";
  box.innerHTML = `<video id="ft-video" playsinline muted></video><div class="ft-frame"></div><p>Aponte para o código de barras</p><button class="gbtn" data-act="scan-cancel">Cancelar</button>`;
  document.body.appendChild(box);
  const video = $("ft-video"), finish = code => { stopScan(); if (code) { try { navigator.vibrate && navigator.vibrate(60); } catch {} onCode(code); } };
  try {
    if ("BarcodeDetector" in window) {
      const det = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      video.srcObject = scanStream; await video.play();
      const step = async () => { if (!scanStream) return; try { const r = await det.detect(video); if (r.length) return finish(r[0].rawValue); } catch {} scanLoop = requestAnimationFrame(step); };
      step();
    } else {
      await loadZXing();
      const hints = new Map(); hints.set(window.ZXing.DecodeHintType.POSSIBLE_FORMATS, [window.ZXing.BarcodeFormat.EAN_13, window.ZXing.BarcodeFormat.EAN_8, window.ZXing.BarcodeFormat.UPC_A, window.ZXing.BarcodeFormat.UPC_E, window.ZXing.BarcodeFormat.CODE_128]);
      scanReader = new window.ZXing.BrowserMultiFormatReader(hints);
      await scanReader.decodeFromConstraints({ video: { facingMode: "environment" }, audio: false }, video, (res) => { if (res) finish(res.getText()); });
    }
  } catch (e) { stopScan(); alert("Não consegui abrir a câmera: " + (e.message || e) + ". Permita o acesso à câmera para o app."); }
}
function stopScan() {
  cancelAnimationFrame(scanLoop);
  try { scanReader && scanReader.reset(); } catch {} scanReader = null;
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
  const b = $("ft-scan"); if (b) b.remove();
}
let zx; function loadZXing() { return zx || (zx = new Promise((ok, bad) => { const s = document.createElement("script"); s.src = "/vendor/zxing-0.21.3.min.js"; s.onload = ok; s.onerror = bad; document.head.appendChild(s); })); }
async function byBarcode(code, meal) {
  const mine = D.foods.find(f => f.codigo === code);
  if (mine) return openEntry(mine, { meal });
  toast("Buscando o código no Open Food Facts…");
  try {
    const r = await api(`food?barcode=${code}`);
    if (r.food) { r.food.id = null; return openEntry(r.food, { meal, fromOff: true }); }
    openFood({ nome: "", marca: "", codigo: code, base: "g", porcoes: [], n: {} }, { meal });
    toast("Código não encontrado. Cadastre o alimento.");
  } catch (e) { alert(e.message); }
}

// ---------------- biblioteca ----------------
function libHtml() {
  const q = D.libQ.toLowerCase(), list = D.foods.filter(f => !q || f.nome.toLowerCase().includes(q) || (f.marca || "").toLowerCase().includes(q)).sort((a, b) => a.nome.localeCompare(b.nome));
  return `<div class="ft-head"><div><h2>Biblioteca</h2><small>${D.foods.length} alimentos</small></div><div class="ft-acts glass"><button data-act="diary">Diário</button><button data-act="new-food">Novo</button></div></div>
    <input class="tr-search" id="ft-libq" type="search" placeholder="Buscar na biblioteca" value="${esc(D.libQ)}">
    <section class="card"><ul class="ios-list ft-list">${list.slice(0, 200).map(f => `<li data-act="food-edit" data-id="${esc(f.id)}"><span><b>${esc(f.nome)}</b><small class="hint">${f.marca ? esc(f.marca) + " · " : ""}${f.n && f.n.kcal != null ? f0(f.n.kcal) + " kcal" : "sem kcal"} · P ${f1(f.n && f.n.prot)} · C ${f1(f.n && f.n.carb)} · G ${f1(f.n && f.n.gord)} /100${f.base || "g"}${f.fonte === "historico" ? " · completar macros" : ""}</small></span><span class="hint">›</span></li>`).join("") || `<li><span class="hint">Nenhum alimento.</span></li>`}</ul></section>`;
}
// primeira vez: a biblioteca nasce com os alimentos do seu histórico (kcal por 100 g; macros a completar)
async function seedFromHistory() {
  const seen = new Map();
  for (const d of Object.keys(DAYS()).sort().reverse()) for (const r of DAYS()[d].refeicoes || []) for (const it of r.itens || []) {
    const k = it.nome.trim().toLowerCase(); if (seen.has(k)) continue;
    const f = foodFromItem(it); if (f.n.kcal == null) continue;
    seen.set(k, { nome: it.nome.trim(), marca: it.marca || "", codigo: "", base: f.base, porcoes: [], n: { kcal: f.n.kcal }, fonte: "historico", usadoEm: d + "T12:00:00", criadoEm: new Date().toISOString() });
  }
  const entries = [...seen.values()].map(f => [`saude/alimentos/h${uid()}`, f]);
  if (entries.length) await db.bulkSet(entries);
  await db.doc("saude/alimentos_meta").set({ semeadoEm: new Date().toISOString(), n: entries.length });
}

let toastT; function toast(t) { const el = $("toast"); if (!el) return; el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600); }

// ---------------- eventos ----------------
async function onClick(e) {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act;
  switch (a) {
    case "day": D.day = b.dataset.d; render(); break;
    case "today": D.day = iso(new Date()); render(); break;
    case "lib": D.view = "biblioteca"; render(); break;
    case "diary": D.view = "diario"; render(); break;
    case "goals": location.hash = "saude"; document.querySelector('#saude-mode [data-mode="painel"]')?.click(); document.querySelector('[data-hsub="plano"]')?.click(); break;
    case "toggle": { const m = b.dataset.m; D.open.has(m) ? D.open.delete(m) : D.open.add(m); render(); break; }
    case "add": openAdd(b.dataset.m); break;
    case "meal-menu": { const m = b.dataset.m, y = iso(addDays(parseDay(D.day), -1)), src = mealsOf(y).find(x => x.nome === m);
      if (!src || !src.itens.length) { toast(`Nada em ${m} ontem para copiar.`); break; }
      if (confirm(`Copiar ${src.itens.length} item(ns) de ${m} de ontem para ${m}?`)) { const ms = mealsOf(D.day), t = ms.find(x => x.nome === m); legacyFix(t); t.itens = (t.itens || []).concat(src.itens.map(i => Object.assign({}, i, { id: uid() }))); await saveDay(D.day, ms); D.open.add(m); toast("Refeição copiada"); }
      break; }
    case "entry": { const ms = mealsOf(D.day), m = ms.find(x => x.nome === b.dataset.m), it = m.itens[+b.dataset.j]; openEntry(foodFromItem(it), { meal: m.nome, item: it, j: +b.dataset.j }); D.entry.origDay = D.day; break; }
    case "close": closeSheet(); break;
    case "off-search": offSearch(); break;
    case "pick-recent": { const it = D.recentList[+b.dataset.k]; const f = foodFromItem(it); openEntry(f, { meal: D.addMeal }); if (!f.id && it.qtd) { D.entry.qtd = it.qtd; D.entry.unid = it.unid || D.entry.unid; renderEntry(); } break; }
    case "pick-food": openEntry(foodById(b.dataset.id), { meal: D.addMeal }); break;
    case "pick-off": openEntry(D.offList[+b.dataset.k], { meal: D.addMeal }); break;
    case "pick-taco": openEntry(Object.assign({}, D.tacoList[+b.dataset.k], { id: null }), { meal: D.addMeal }); break;
    case "entry-save": saveEntry(); break;
    case "entry-del": if (confirm("Apagar este registro?")) delEntry(); break;
    case "food-edit": { const f = foodById(b.dataset.id); openFood(f, D.entry ? { meal: D.entry.meal, item: D.entry.item, j: D.entry.j } : null); break; }
    case "food-save-from-entry": openFood(Object.assign({}, D.entry.food, { id: null }), { meal: D.entry.meal, item: D.entry.item, j: D.entry.j }); break;
    case "food-save": saveFood(); break;
    case "food-del": if (confirm("Apagar este alimento da biblioteca? Os registros antigos continuam.")) { await db.doc(`saude/alimentos/${b.dataset.id}`).delete(); closeSheet(); } break;
    case "new-food": openFood(null, D.addMeal && !$("ft-sheet").hidden ? { meal: D.addMeal } : null); break;
    case "quick": openQuick(D.addMeal); break;
    case "quick-save": saveQuick(); break;
    case "ai": openAI(D.addMeal); break;
    case "ai-run": runAI(); break;
    case "ai-save": saveAI(); break;
    case "scan": { const meal = D.addMeal; scan(code => byBarcode(code, meal)); break; }
    case "scan-into": scan(code => { $("fd-c").value = code; }); break;
    case "scan-cancel": stopScan(); break;
  }
}
function onInput(e) {
  if (e.target.id === "ft-q") { clearTimeout(D.qT); D.qT = setTimeout(() => addList(), 120); }
  if (e.target.id === "ft-libq") { D.libQ = e.target.value; const pos = e.target.selectionStart; render(); const n = $("ft-libq"); n.focus(); n.setSelectionRange(pos, pos); }
  if (["fe-q", "fe-u"].includes(e.target.id) && D.entry) { D.entry.qtd = num($("fe-q").value) || 0; D.entry.unid = $("fe-u").value; const keep = e.target.id; D.entry.marca = $("fe-b").value; D.entry.day = $("fe-d").value; D.entry.hora = $("fe-h").value; D.entry.precisao = $("fe-p").value; D.entry.meal = $("fe-m").value; renderEntry(); const el = $(keep); if (el && keep === "fe-q") { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
}
function swipeWeek() {
  const el = $("dieta-root"); let x0 = null, y0 = 0;
  el.addEventListener("touchstart", e => { if (!e.target.closest("#ft-week")) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { D.day = iso(addDays(parseDay(D.day), dx < 0 ? 7 : -7)); render(); } }, { passive: true });
}

export function start() {
  loadTaco();
  if (!D.started) {
    D.started = true;
    document.addEventListener("click", e => { if (e.target.closest("#dieta-root, #ft-sheet, #ft-scan")) onClick(e); });
    document.addEventListener("input", e => { if (e.target.closest("#dieta-root, #ft-sheet")) onInput(e); });
    document.addEventListener("change", e => { if (e.target.closest("#ft-sheet") && ["fe-u", "fe-m"].includes(e.target.id)) onInput(e); });
    swipeWeek();
    db.collection("saude/alimentos").onSnapshot(q => { D.foods = q.docs.map(d => Object.assign({ id: d.id }, d.data())); if (!$("dieta-root").hidden) render(); });
    P() && P().onChange(() => { if (!$("dieta-root").hidden && $("ft-sheet").hidden) render(); });
    // semeia a biblioteca com o histórico só depois que os dias da Saúde chegaram
    const trySeed = () => { if (D.seeding || !Object.keys(DAYS()).length) return; D.seeding = true; db.doc("saude/alimentos_meta").get().then(m => { if (!m.exists) return seedFromHistory(); }).catch(() => {}); };
    trySeed(); P() && P().onChange(trySeed);
  }
  render();
}
window.painelDieta = { start, goto: d => { D.day = d; render(); }, add: (d, meal) => { if (d) D.day = d; render(); openAdd(meal); }, refresh: async () => { await db.reloadAll(); render(); } };
