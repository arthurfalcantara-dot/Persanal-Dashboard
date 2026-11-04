// Treino (dentro da Saúde), nos fluxos do Hevy: rotinas, treino ao vivo, histórico, detalhe do treino e do exercício.
// Grava as sessões no MESMO formato que a Saúde já lê (saude/treinos/sessoes/<AAAAMMDDTHHMM>), então
// Hoje, Semana, Progresso, mapa muscular e balanço calórico passam a contar os treinos feitos aqui.
import { db } from "/data.js";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const num = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(n) ? n : null; };
const fmtN = v => (Math.round(v * 10) / 10).toLocaleString("pt-BR");
const kg = v => `${fmtN(v)} kg`;
const dur = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return h ? `${h}h ${m}min` : m ? `${m}min ${pad(ss)}s` : `${ss}s`; };
const clock = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
const e1rm = (k, r) => (k && r ? k * (1 + r / 30) : 0); // Epley
const P = () => window.painelSaude;
const S = () => (P() ? P().state() : { sess: [], cat: null });
const LIVE_KEY = "painel.treino.atual";
const TIPOS = { normal: "", warmup: "A", failure: "F", dropset: "D" };
const TIPO_NOME = { normal: "Normal", warmup: "Aquecimento", failure: "Até a falha", dropset: "Drop set" };
const REST = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];

// grupo do painel a partir do banco de exercícios (exercises-dataset)
const TG_G = { pectorals: "Peito", chest: "Peito", lats: "Costas", "upper back": "Costas", delts: "Ombros", traps: "Trapézio", biceps: "Bíceps", triceps: "Tríceps",
  quads: "Quadríceps", hamstrings: "Posterior", glutes: "Glúteos", abductors: "Glúteos", adductors: "Quadríceps", calves: "Panturrilha", abs: "Abdômen", spine: "Lombar",
  forearms: "Bíceps", "serratus anterior": "Peito", "levator scapulae": "Trapézio", "cardiovascular system": "Cardio" };
const grupoDe = x => (x.bp === "cardio" ? "Cardio" : TG_G[x.tg] || "Abdômen");
const cap = s => String(s || "").replace(/(^|[\s(-])([a-z])/g, (m, a, b) => a + b.toUpperCase());

const T = { view: "treinar", rotinas: [], live: null, rest: null, detail: null, exDetail: null, exTab: "resumo", exMetric: "peso", pickerFor: null, started: false };

// ---------------- dados ----------------
const sessions = () => (S().sess || []).filter(s => (s.exercicios || []).length);
function catalog() {
  const out = new Map();
  const cat = (S().cat && S().cat.exercicios) || {};
  for (const [nome, e] of Object.entries(cat)) out.set(nome.toLowerCase(), { nome, grupo: e.grupo, hevy: (e.aliases || [])[0] || null });
  for (const s of sessions()) for (const e of s.exercicios) if (!out.has(e.nome.toLowerCase())) out.set(e.nome.toLowerCase(), { nome: e.nome, grupo: e.grupo, hevy: e.hevy || null });
  return [...out.values()];
}
// histórico de um exercício (mais recente primeiro)
function exHist(nome) {
  const k = String(nome).toLowerCase(), out = [];
  for (const s of sessions()) { const e = s.exercicios.find(x => String(x.nome).toLowerCase() === k); if (e) out.push({ s, e }); }
  return out;
}
function records(nome) {
  let peso = 0, rm = 0, vol = 0, sess = 0, reps = 0;
  for (const { e } of exHist(nome)) {
    let sv = 0;
    for (const x of e.series) { if (x.tipo === "warmup") continue; const k = +x.kg || 0, r = +x.reps || 0; peso = Math.max(peso, k); rm = Math.max(rm, e1rm(k, r)); vol = Math.max(vol, k * r); reps = Math.max(reps, r); sv += k * r; }
    sess = Math.max(sess, sv);
  }
  return { peso, rm, vol, sess, reps };
}
function sessStats(s) {
  let series = 0, vol = 0; const g = {};
  for (const e of s.exercicios || []) for (const x of e.series || []) {
    if (e.grupo === "Cardio" || x.tipo === "warmup") continue;
    series++; vol += (+x.kg || 0) * (+x.reps || 0); g[e.grupo] = (g[e.grupo] || 0) + 1;
  }
  const min = s.duracaoMin || (s.inicio && s.fim ? Math.round((new Date(s.fim) - new Date(s.inicio)) / 60000) : null);
  return { series, vol, g, min };
}
function prsOf(s) {
  // recordes batidos nesta sessão, comparando com as sessões anteriores a ela
  let n = 0;
  for (const e of s.exercicios || []) {
    if (e.grupo === "Cardio") continue;
    let peso = 0, rm = 0;
    for (const { s: o, e: oe } of exHist(e.nome)) { if ((o.inicio || o.data) >= (s.inicio || s.data)) continue; for (const x of oe.series) { if (x.tipo === "warmup") continue; peso = Math.max(peso, +x.kg || 0); rm = Math.max(rm, e1rm(+x.kg, +x.reps)); } }
    if (!peso) continue;
    if (e.series.some(x => x.tipo !== "warmup" && ((+x.kg || 0) > peso || e1rm(+x.kg, +x.reps) > rm + .01))) n++;
  }
  return n;
}

// ---------------- tela principal ----------------
function render() {
  const root = $("treino-root"); if (!root) return;
  const live = T.live && T.live.modo === "live";
  root.innerHTML = `
    <div class="seg tr-seg" id="tr-seg">${[["treinar", "Treinar"], ["historico", "Histórico"], ["exercicios", "Exercícios"]].map(([k, l]) => `<button data-v="${k}" aria-pressed="${T.view === k}">${l}</button>`).join("")}</div>
    ${T.view === "treinar" ? homeHtml(live) : T.view === "historico" ? feedHtml() : libHtml()}`;
}
function homeHtml(live) {
  const rs = T.rotinas.slice().sort((a, b) => (b.data.usadaEm || "").localeCompare(a.data.usadaEm || "") || a.data.nome.localeCompare(b.data.nome));
  return `
    <section class="card tr-start">
      <h3 class="sec">Começar</h3>
      ${live ? `<button class="btn primary big" data-act="open-live">Voltar ao treino em andamento · ${esc(T.live.titulo)}</button>`
        : `<button class="btn primary big" data-act="start-empty"><i class="ic" data-i="plus"></i>Começar treino vazio</button>`}
    </section>
    ${planHtml(live)}
    <div class="tr-h"><h3 class="sec">Rotinas</h3><button class="gbtn small" data-act="new-routine">Nova rotina</button></div>
    ${rs.length ? rs.map(r => `<section class="card tr-rout">
        <div class="tr-rout-h"><b>${esc(r.data.nome)}</b><button class="iconbtn" data-act="routine-menu" data-id="${esc(r.id)}" aria-label="Opções">⋯</button></div>
        <p class="hint">${esc(r.data.exercicios.map(e => enName(e.nome)).join(", "))}</p>
        <button class="btn primary" data-act="start-routine" data-id="${esc(r.id)}" ${live ? "disabled" : ""}>Começar rotina</button>
      </section>`).join("") : `<section class="card"><p class="empty">Nenhuma rotina ainda. Crie uma do zero ou salve um treino do histórico como rotina.</p></section>`}
    <div class="tr-h"><h3 class="sec">Últimos treinos</h3><button class="linkbtn" data-act="go-feed">Ver todos</button></div>
    ${sessions().slice(0, 3).map(cardHtml).join("") || `<section class="card"><p class="empty">Sem treinos registrados.</p></section>`}`;
}
// ---------------- plano da semana (Plano & dados da Saúde) ----------------
const DOW3 = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const cardioNome = t => { const x = String(t || "").split(" (")[0]; return /corrida/i.test(x) ? "Corrida" : /esteira/i.test(x) ? "Esteira inclinada" : x || "Cardio"; };
function planOf(day) { const t = P() && P().dayTarget(day); return t ? t.plan || null : null; }
function doneOn(day) { const ss = (S().byDate || {})[day] || []; return { forca: ss.some(s => s.forca), cardio: ss.some(s => s.cardio && (s.cardio.min || s.cardio.km)) }; }
// força: a rotina usada há mais tempo (rodízio); sem rotinas, o treino de força do mesmo dia da semana passada
function suggestForca(today) {
  if (T.rotinas.length) return { tipo: "rotina", r: T.rotinas.slice().sort((a, b) => (a.data.usadaEm || "").localeCompare(b.data.usadaEm || ""))[0] };
  const wd = new Date(today + "T12:00").getDay();
  const s = sessions().find(x => x.forca && x.data < today && new Date(x.data + "T12:00").getDay() === wd) || sessions().find(x => x.forca && x.data < today);
  return s ? { tipo: "sessao", s } : null;
}
function planHtml(live) {
  if (!P() || !P().state().cfg) return `<section class="card tr-plan"><p class="hint">Preencha o Plano em Painel → Plano & dados para ver a sugestão de treino do dia.</p></section>`;
  const today = iso(new Date()), d0 = new Date(), mon = new Date(d0); mon.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return iso(x); });
  const strip = days.map(k => {
    const p = planOf(k) || {}, dn = doneOn(k), dw = new Date(k + "T12:00").getDay();
    const want = p.forca || +p.cardioMin > 0, ok = (!p.forca || dn.forca) && (!(+p.cardioMin > 0) || dn.cardio) && want;
    return `<div class="tr-pd${k === today ? " today" : ""}${k < today && want && !ok ? " miss" : ""}"><span>${DOW3[dw]}</span><b>${p.forca ? "F" : ""}${p.forca && +p.cardioMin ? "+" : ""}${+p.cardioMin ? "C" : ""}${!want ? "–" : ""}</b><small>${ok ? "✓" : +p.cardioMin ? p.cardioMin + "′" : ""}</small></div>`;
  }).join("");
  const p = planOf(today) || {}, dn = doneOn(today), sug = p.forca ? suggestForca(today) : null;
  let body = "";
  if (!p.forca && !(+p.cardioMin > 0)) body = `<p class="tr-sug-t">Descanso no plano de hoje.</p><p class="hint">Se quiser treinar mesmo assim, comece um treino vazio ou uma rotina.</p>`;
  else {
    if (p.forca) body += dn.forca ? `<div class="tr-sug done"><b>Força</b><span>feito hoje ✓</span></div>`
      : `<div class="tr-sug"><div><b>Força</b><span>${sug ? (sug.tipo === "rotina" ? `Rotina sugerida: ${esc(sug.r.data.nome)}` : `Repetir: ${esc(sug.s.titulo || "Treino")} de ${new Date(sug.s.data + "T12:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}`) : "Monte o treino ou crie uma rotina"}</span>
        ${sug ? `<small class="hint">${esc((sug.tipo === "rotina" ? sug.r.data.exercicios : sug.s.exercicios).filter(e => e.grupo !== "Cardio").map(e => e.nome).slice(0, 4).join(", "))}</small>` : ""}</div>
        <button class="btn primary small" data-act="start-sug" ${live ? "disabled" : ""}>Começar</button></div>`;
    if (+p.cardioMin > 0) body += dn.cardio ? `<div class="tr-sug done"><b>Cardio</b><span>feito hoje ✓</span></div>`
      : `<div class="tr-sug"><div><b>Cardio · ${p.cardioMin} min</b><span>${esc(p.cardioTipo || "")}</span></div><button class="btn small" data-act="start-cardio" ${live ? "disabled" : ""}>Começar</button></div>`;
  }
  T.sug = { forca: sug, cardio: p };
  return `<section class="card tr-plan">
    <div class="tr-h" style="margin:0"><h3 class="sec">Plano da semana</h3><button class="linkbtn" data-act="edit-plan">Editar plano</button></div>
    <div class="tr-pweek">${strip}</div>
    <h4 class="tr-sub">Sugestão para hoje</h4>${body}
  </section>`;
}

function rel(d) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const x = new Date(d.slice(0, 10) + "T12:00"); const days = Math.round((t - x) / 864e5);
  return days <= 0 ? "hoje" : days === 1 ? "ontem" : `há ${days} dias`;
}
function cardHtml(s) {
  const st = sessStats(s), prs = prsOf(s), ex = s.exercicios.filter(e => e.series.length);
  return `<section class="card tr-card" data-act="detail" data-id="${esc(s.id)}">
    <div class="tr-card-h"><b>${esc(s.titulo || "Treino")}</b><small>${rel(s.data)}${s.inicio ? " · " + new Date(s.inicio).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }) : ""}</small></div>
    <div class="tr-stats"><span><small>Tempo</small><b>${st.min ? dur(st.min * 60) : "—"}</b></span><span><small>Volume</small><b>${kg(st.vol)}</b></span>${prs ? `<span><small>Recordes</small><b class="tr-pr">${prs}</b></span>` : ""}</div>
    <ul class="tr-exlist">${ex.slice(0, 3).map(e => `<li><span class="tr-g" style="--c:var(--g-${gslug(e.grupo)}, var(--n-blue))">${esc(e.grupo.slice(0, 2))}</span>${e.series.length} série${e.series.length > 1 ? "s" : ""} ${esc(e.nome)}</li>`).join("")}</ul>
    ${ex.length > 3 ? `<p class="tr-more">Ver mais ${ex.length - 3} exercício${ex.length - 3 > 1 ? "s" : ""}</p>` : ""}
  </section>`;
}
const gslug = g => String(g || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function feedHtml() {
  const ss = sessions().slice(0, T.feedLimit || 20);
  return ss.map(cardHtml).join("") + (sessions().length > ss.length ? `<button class="gbtn big" data-act="feed-more">Mostrar mais</button>` : "");
}
function libHtml() {
  const q = (T.libQ || "").toLowerCase(), list = catalog().filter(e => e.grupo !== "Cardio" || true)
    .filter(e => !q || e.nome.toLowerCase().includes(q) || String(e.hevy || "").toLowerCase().includes(q))
    .map(e => ({ e, n: exHist(e.nome).length })).sort((a, b) => b.n - a.n || a.e.nome.localeCompare(b.e.nome));
  return `<input class="tr-search" id="tr-libq" type="search" placeholder="Buscar exercício" value="${esc(T.libQ || "")}">
    <section class="card tr-lib"><ul class="ios-list">${list.slice(0, 120).map(({ e, n }) => `<li data-act="ex" data-nome="${esc(e.nome)}"><span><b>${esc(enName(e.nome))}</b><small class="hint"> · ${esc(e.grupo)}</small></span><span class="hint">${n ? n + "×" : ""} ›</span></li>`).join("")}</ul></section>`;
}

// ---------------- detalhe do treino ----------------
function openDetail(id) {
  const s = sessions().find(x => x.id === id); if (!s) return;
  const st = sessStats(s), tot = Object.values(st.g).reduce((a, b) => a + b, 0) || 1;
  const split = Object.entries(st.g).sort((a, b) => b[1] - a[1]);
  sheet(`<div class="tr-sh-h"><button class="iconbtn" data-act="close" aria-label="Voltar">‹</button><h3>Detalhe do treino</h3><button class="iconbtn" data-act="detail-menu" data-id="${esc(s.id)}" aria-label="Opções">⋯</button></div>
    <div class="tr-dt"><small>${s.inicio ? new Date(s.inicio).toLocaleString("pt-BR", { weekday: "long", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : esc(s.data)}</small><h2>${esc(s.titulo || "Treino")}</h2>
      <div class="tr-stats"><span><small>Tempo</small><b>${st.min ? dur(st.min * 60) : "—"}</b></span><span><small>Volume</small><b>${kg(st.vol)}</b></span><span><small>Séries</small><b>${st.series}</b></span>${s.cardio ? `<span><small>Cardio</small><b>${s.cardio.min || 0} min</b></span>` : ""}</div></div>
    ${split.length ? `<h4 class="tr-sub">Divisão muscular</h4><div class="tr-split">${split.map(([g, n]) => `<div><span>${esc(g)}</span><i><b style="width:${(n / split[0][1] * 100).toFixed(0)}%"></b></i><em>${Math.round(n / tot * 100)}%</em></div>`).join("")}</div>` : ""}
    <div class="tr-h"><h4 class="tr-sub">Treino</h4><button class="linkbtn" data-act="edit-session" data-id="${esc(s.id)}">Editar treino</button></div>
    ${s.exercicios.map(e => `<div class="tr-dex"><button class="tr-exname" data-act="ex" data-nome="${esc(e.nome)}">${esc(enName(e.nome))}</button>${e.nota ? `<p class="hint">${esc(e.nota)}</p>` : ""}
      <table class="tr-sets"><thead><tr><th>Série</th><th>${e.grupo === "Cardio" ? "Tempo e distância" : "Peso e reps"}</th></tr></thead><tbody>${setRows(e)}</tbody></table></div>`).join("")}`);
}
function setRows(e) {
  let n = 0;
  return e.series.map(x => {
    const lab = x.tipo === "warmup" ? "A" : x.tipo === "failure" ? "F" : x.tipo === "dropset" ? "D" : String(++n);
    const v = e.grupo === "Cardio" ? `${x.seg ? Math.round(x.seg / 60) + " min" : ""}${x.km ? " · " + fmtN(x.km) + " km" : ""}` : `${fmtN(+x.kg || 0)} kg × ${x.reps || 0}${x.rpe ? ` <small>@ RPE ${x.rpe}</small>` : ""}`;
    return `<tr><td class="t-${x.tipo || "normal"}">${lab}</td><td>${v}</td></tr>`;
  }).join("");
}

// ---------------- página do exercício ----------------
function openEx(nome) {
  T.exDetail = nome; T.exTab = "resumo"; renderEx();
}
function renderEx() {
  const nome = T.exDetail, h = exHist(nome), rec = records(nome), lib = findLib(nome), grupo = (catalog().find(c => c.nome === nome) || {}).grupo || (lib ? grupoDe(lib) : "");
  const tab = T.exTab;
  let body = "";
  if (tab === "resumo") {
    const pts = h.slice().reverse().map(({ s, e }) => {
      const w = e.series.filter(x => x.tipo !== "warmup");
      const v = T.exMetric === "peso" ? Math.max(0, ...w.map(x => +x.kg || 0)) : T.exMetric === "rm" ? Math.max(0, ...w.map(x => e1rm(+x.kg, +x.reps))) : Math.max(0, ...w.map(x => (+x.kg || 0) * (+x.reps || 0)));
      return { d: s.data, v };
    }).filter(p => p.v > 0);
    body = `<div class="tr-exmeta"><p><b>Grupo:</b> ${esc(grupo || "—")}</p>${lib ? `<p><b>Principal:</b> ${esc(cap(lib.tg))}${lib.sm && lib.sm.length ? ` · <b>Secundários:</b> ${esc(lib.sm.map(cap).join(", "))}` : ""}</p><p class="hint">${esc(cap(lib.eq))}</p>` : ""}</div>
      ${pts.length ? `<div class="tr-big"><b>${T.exMetric === "vol" ? kg(pts[pts.length - 1].v) : kg(pts[pts.length - 1].v)}</b> <span>${new Date(pts[pts.length - 1].d + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span></div>${chart(pts)}` : `<p class="empty">Sem registros deste exercício ainda.</p>`}
      <div class="seg tr-metric">${[["peso", "Maior peso"], ["rm", "1RM estimado"], ["vol", "Melhor série (volume)"]].map(([k, l]) => `<button data-act="metric" data-m="${k}" aria-pressed="${T.exMetric === k}">${l}</button>`).join("")}</div>
      <h4 class="tr-sub">Recordes pessoais</h4>
      <ul class="ios-list"><li><span>Maior peso</span><b>${rec.peso ? kg(rec.peso) : "—"}</b></li><li><span>Melhor 1RM estimado</span><b>${rec.rm ? kg(rec.rm) : "—"}</b></li><li><span>Melhor série (volume)</span><b>${rec.vol ? kg(rec.vol) : "—"}</b></li><li><span>Melhor volume numa sessão</span><b>${rec.sess ? kg(rec.sess) : "—"}</b></li></ul>`;
  } else if (tab === "historico") {
    body = h.length ? h.map(({ s, e }) => `<div class="tr-dex"><button class="tr-exname" data-act="detail" data-id="${esc(s.id)}">${esc(s.titulo || "Treino")} · ${new Date(s.data + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}</button><table class="tr-sets"><tbody>${setRows(e)}</tbody></table></div>`).join("") : `<p class="empty">Sem histórico.</p>`;
  } else {
    body = lib && lib.st ? `<ol class="tr-how">${lib.st.map(x => `<li>${esc(x)}</li>`).join("")}</ol><p class="hint">Instruções do banco aberto de exercícios (em inglês).</p>` : `<p class="empty">Sem instruções para este exercício. ${P() && P().xdb().state !== 2 ? "Carregando o banco de exercícios…" : ""}</p>`;
  }
  if (!MEDIA) mediaLoad(() => { if (T.exDetail === nome) renderEx(); });
  const dm = tab !== "historico" ? demo(lib) : "";
  sheet(`<div class="tr-sh-h"><button class="iconbtn" data-act="close" aria-label="Voltar">‹</button><h3>${esc(enName(nome))}</h3><span></span></div>
    ${dm}<div class="seg tr-tabs">${[["resumo", "Resumo"], ["historico", "Histórico"], ["como", "Como fazer"]].map(([k, l]) => `<button data-act="extab" data-t="${k}" aria-pressed="${tab === k}">${l}</button>`).join("")}</div>${body}`, "ex");
}
// mídia dos exercícios (GIFs © Gym visual, servidos do repositório exercises-dataset; não copiados para cá)
const MEDIA_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
let MEDIA = null, mediaP = null;
function mediaLoad(cb) {
  if (!mediaP) mediaP = fetch("/exercicios-midia.json").then(r => r.ok ? r.json() : {}).catch(() => ({})).then(m => { MEDIA = m; });
  if (cb) mediaP.then(cb);
}
function mediaUrl(id, gif) {
  const f = MEDIA && id && MEDIA[id]; if (!f) return "";
  return MEDIA_BASE + (gif ? "videos/" + f : "images/" + f.replace(/\.gif$/, ".jpg"));
}
// seus exercícios (nomes em português/Hevy) → exercício do exercises-dataset, revisado à mão; o resto, por semelhança
const EX_MAP = {"abdominal declinado": "0277", "abdominal declinado com peso": "0277", "abdominal oblíquo": "0635", "abdominal sit-up com peso": "3670", "abdominal na polia": "0175", "abdominal na polia (joelhos)": "0175", "agachamento livre": "0043", "agachamento máquina": "0743", "bulgarian split squat (dumbbell)": "0410", "cadeira extensora": "0585", "cadeira flexora": "0599", "mesa flexora": "0586", "calf extensions (horizontal leg press)": "1391", "crucifixo inverso cross": "0154", "crucifixo inverso máquina": "0602", "crucifixo máquina": "0596", "crucifixo polia alta": "0227", "crucifixo polia baixa": "0179", "crucifixo sentado no cabo": "0188", "desenvolvimento máquina": "0603", "desenvolvimento com halter": "0405", "elevação frontal corda": "0162", "elevação frontal com barra": "0041", "elevação lateral sentado": "0396", "elevação lateral com halter": "0334", "elevação lateral no cross": "0192", "elevação pélvica": "1409", "elevação de joelhos nas paralelas": "0011", "elevação de pernas": "0826", "encolhimento com barra": "0095", "encolhimento com halter": "0406", "esteira inclinada": "3666", "glúteo coice máquina": "0860", "iso-lateral low row": "0581", "remada baixa articulada": "0581", "leg press": "0739", "leg press horizontal": "2611", "panturrilha sentado": "0594", "panturrilha em pé": "0605", "panturrilha em pé no smith": "0773", "panturrilha na máquina": "2289", "panturrilha no leg press": "1391", "plank": "2135", "pull down": "0237", "puxada alta invertida": "0673", "puxada alta máquina": "0579", "puxada fechada": "2616", "remada apoiada inclinada": "0327", "remada baixa": "0861", "remada curvada": "3017", "rosca 45º": "0318", "rosca direta barra w": "0447", "rosca martelo": "0313", "rosca martelo na polia": "0165", "rosca scott barra": "0070", "rosca scott máquina": "0592", "rosca no cross": "0868", "stiff": "0116", "supino inclinado com barra": "0047", "supino inclinado com halter": "0314", "supino reto máquina": "0577", "supino reto com barra": "0025", "terra romeno": "0085", "triceps corda no cross": "0200", "triceps francês": "2188", "triceps francês na polia": "0194", "triceps kickback (cable)": "0860", "triceps pulley": "0201", "triceps testa": "0060", "calf on the super squat": "1385"};
// nome no padrão do repositório (inglês); sem par no banco, o nome do Hevy; por último, o nome registrado
const dsName = n => cap(String(n || "").replace(/в°/g, "°"));
function enName(nome) {
  const l = libQuiet(nome); if (l) return dsName(l.n);
  const c = catalog().find(c => c.nome === nome); return (c && c.hevy) || nome;
}
function libQuiet(nome) {
  const x = P() && P().xdb(); if (!x || x.state !== 2) return null;
  const mid = EX_MAP[String(nome || "").toLowerCase()]; if (mid && x.byId[mid]) return x.byId[mid];
  const c = catalog().find(c => c.nome === nome), keys = [nome, c && c.hevy].filter(Boolean).map(s => s.toLowerCase());
  const hit = x.list.find(e => keys.includes(e.n.toLowerCase()));
  if (hit) return hit;
  const id = P().matchFor ? P().matchFor(c || { nome }) : null;
  return id ? x.byId[id] : null;
}
function thumb(id, nome) {
  const u = mediaUrl(id, false), ini = esc(String(nome || "?").trim().charAt(0).toUpperCase());
  return u ? `<span class="tr-thumb"><img src="${u}" alt="" loading="lazy" decoding="async" onerror="this.remove()"><i>${ini}</i></span>` : `<span class="tr-thumb"><i>${ini}</i></span>`;
}
function demo(lib) {
  const u = lib && mediaUrl(lib.id, true);
  if (!u) return "";
  return `<figure class="tr-demo"><img src="${u}" alt="Demonstração: ${esc(lib.n)}" loading="lazy" decoding="async" onerror="this.closest('figure').remove()"><figcaption>© Gym visual · <a href="https://gymvisual.com/" target="_blank" rel="noopener">gymvisual.com</a></figcaption></figure>`;
}
function findLib(nome) {
  const x = P() && P().xdb(); if (!x || x.state !== 2) { P() && P().xdbLoad(() => { if (T.exDetail) renderEx(); }); return null; }
  const c = catalog().find(c => c.nome === nome), keys = [nome, c && c.hevy].filter(Boolean).map(s => s.toLowerCase());
  return libQuiet(nome);
}
function chart(pts) {
  const W = 340, H = 150, pl = 34, pb = 20, vs = pts.map(p => p.v), mn = Math.min(...vs), mx = Math.max(...vs), span = mx - mn || 1;
  const x = i => pl + (pts.length === 1 ? (W - pl) / 2 : i / (pts.length - 1) * (W - pl - 6)), y = v => 8 + (1 - (v - mn) / span) * (H - pb - 16);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  return `<svg class="tr-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução">
    ${[mn, (mn + mx) / 2, mx].map(v => `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="0" y="${y(v) + 4}">${fmtN(v)}</text>`).join("")}
    <path d="${d}"/>${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="3"/>`).join("")}
    <text x="${pl}" y="${H - 4}">${new Date(pts[0].d + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</text><text x="${W}" y="${H - 4}" text-anchor="end">${new Date(pts[pts.length - 1].d + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</text></svg>`;
}

// ---------------- folhas (telas sobrepostas) ----------------
function sheet(html, kind = "") {
  const m = $("tr-sheet"); m.hidden = false; m.dataset.kind = kind;
  m.innerHTML = `<div class="tr-sheet-box">${html}</div>`;
  document.documentElement.classList.add("tr-noscroll");
}
function closeSheet() { const m = $("tr-sheet"); m.hidden = true; m.innerHTML = ""; T.exDetail = null; document.documentElement.classList.remove("tr-noscroll"); }

// ---------------- treino ao vivo / edição / rotina ----------------
function blankSet(prev) { return { tipo: "normal", kg: "", reps: "", rpe: "", feito: false, seg: "", km: "", ph: prev || null }; }
function exFrom(e, prevSets) {
  const last = exHist(e.nome)[0], ps = last ? last.e.series : [];
  const series = (prevSets && prevSets.length ? prevSets : ps.length ? ps : [{}, {}, {}]).map((x, i) => {
    const p = ps[i] || null;
    return Object.assign(blankSet(p ? { kg: p.kg, reps: p.reps, seg: p.seg, km: p.km } : null), { tipo: x.tipo || "normal", kg: prevSets ? (x.kg ?? "") : "", reps: prevSets ? (x.reps ?? "") : "", seg: prevSets ? (x.seg ?? "") : "", km: prevSets ? (x.km ?? "") : "" });
  });
  return { nome: e.nome, grupo: e.grupo, hevy: e.hevy || null, nota: "", descanso: e.descanso ?? 90, series };
}
// ---------- nome do treino pelo agrupamento muscular predominante ----------
// convenção das divisões de treino: Push = peito + ombros/tríceps; Pull = costas + ombros/bíceps; Upper = peito e costas;
// Lower = pernas sem um grupo dominante; Full Body = superiores e pernas; um grupo com ≥ 70% das séries (60% nas pernas) dá o nome a ele
const G_LEG = ["Quadríceps", "Posterior", "Glúteos", "Panturrilha"], G_NOME = { Posterior: "Posteriores", Bíceps: "Braços", Tríceps: "Braços" };
function nomeTreino(exs, soFeitas) {
  const c = {};
  for (const e of exs || []) {
    if (!e.grupo || e.grupo === "Cardio") continue;
    const n = (e.series || []).filter(x => x.tipo !== "warmup" && (!soFeitas || x.feito)).length; if (n) c[e.grupo] = (c[e.grupo] || 0) + n;
  }
  const core = ["Abdômen", "Lombar"], tot = Object.entries(c).filter(([g]) => !core.includes(g)).reduce((a, [, n]) => a + n, 0);
  if (!tot) return Object.keys(c).length ? "Core" : "";
  const sh = g => (c[g] || 0) / tot, sum = gs => gs.reduce((a, g) => a + sh(g), 0);
  const legs = sum(G_LEG), upper = 1 - legs;
  if (legs >= .3 && upper >= .3) return "Full Body";
  if (legs > upper) { const top = G_LEG.map(g => [g, sh(g) / legs]).sort((a, b) => b[1] - a[1])[0]; return top[1] >= .6 ? (G_NOME[top[0]] || top[0]) : "Lower"; }
  const has = g => sh(g) / upper >= .15;
  const chest = has("Peito"), back = has("Costas") || has("Trapézio"), shoulders = has("Ombros"), arms = sum(["Bíceps", "Tríceps"]) / upper;
  const top = Object.keys(c).filter(g => !core.includes(g) && !G_LEG.includes(g)).map(g => [g, sh(g) / upper]).sort((a, b) => b[1] - a[1])[0];
  if (arms >= .6) return "Braços";
  if (top && top[1] >= .7) return top[0] === "Trapézio" ? "Costas" : top[0];
  if (chest && back) return "Upper";
  if (chest) return "Push";
  if (back) return "Pull";
  if (shoulders) return arms >= .3 ? "Ombros e Braços" : "Ombros";
  return "Upper";
}
window.painelNomeTreino = s => nomeTreino(s.exercicios || [], false) || s.titulo || "Força";

function startLive(fromRoutine) {
  const now = new Date();
  const plano = fromRoutine && fromRoutine.planejado;
  T.live = { modo: "live", tituloAuto: !fromRoutine || !!plano, titulo: plano || (fromRoutine ? fromRoutine.nome : (now.getHours() < 12 ? "Treino da manhã" : now.getHours() < 18 ? "Treino da tarde" : "Treino da noite")),
    rotinaId: fromRoutine ? fromRoutine.id : null, inicio: now.getTime(), exercicios: fromRoutine ? fromRoutine.exercicios.map(e => exFrom(e, e.series)) : [] };
  saveLive(); openLive();
}
function editSession(s) {
  T.live = { modo: "edit", id: s.id, titulo: s.titulo || "Treino", inicio: new Date(s.inicio || s.data + "T12:00").getTime(), fimOrig: s.fim, duracaoMin: s.duracaoMin, descricao: s.descricao || "",
    exercicios: s.exercicios.map(e => ({ nome: e.nome, grupo: e.grupo, hevy: e.hevy || null, nota: e.nota || "", descanso: 90, series: e.series.map(x => Object.assign(blankSet(null), { tipo: x.tipo || "normal", kg: x.kg ?? "", reps: x.reps ?? "", rpe: x.rpe ?? "", seg: x.seg ? Math.round(x.seg / 60) : "", km: x.km ?? "", feito: true })) })) };
  openLive();
}
function editRoutine(r) {
  T.live = { modo: "rotina", id: r ? r.id : null, titulo: r ? r.data.nome : "Nova rotina",
    exercicios: r ? r.data.exercicios.map(e => ({ nome: e.nome, grupo: e.grupo, hevy: e.hevy || null, nota: "", descanso: e.descanso ?? 90, series: (e.series || [{}]).map(x => Object.assign(blankSet(null), { tipo: x.tipo || "normal", kg: x.kg ?? "", reps: x.reps ?? "" })) })) : [] };
  openLive();
}
function saveLive() { if (T.live && T.live.modo === "live") { try { localStorage.setItem(LIVE_KEY, JSON.stringify(T.live)); } catch {} } }
function clearLive() { try { localStorage.removeItem(LIVE_KEY); } catch {} }
function openLive() { const el = $("tr-live"); el.hidden = false; document.documentElement.classList.add("tr-noscroll"); renderLive(); mini(); }
function minimize() { $("tr-live").hidden = true; document.documentElement.classList.remove("tr-noscroll"); mini(); }

function liveStats() {
  let vol = 0, ser = 0;
  for (const e of T.live.exercicios) for (const x of e.series) if (x.feito && x.tipo !== "warmup" && e.grupo !== "Cardio") { ser++; vol += (num(x.kg) || 0) * (num(x.reps) || 0); }
  return { vol, ser };
}
function fillThumbs() {
  document.querySelectorAll("#tr-live .tr-exname[data-nome] > .tr-thumb:not(:has(img))").forEach(t => {
    const nome = t.parentElement.dataset.nome, id = (libQuiet(nome) || {}).id;
    if (mediaUrl(id, false)) t.outerHTML = thumb(id, nome);
  });
}
function renderLive() {
  const L = T.live, el = $("tr-live"); if (!L) return;
  if (!MEDIA || !(P() && P().xdb().state === 2)) { mediaLoad(() => P() && P().xdbLoad(fillThumbs)); }
  const modo = L.modo, st = liveStats();
  el.innerHTML = `<div class="tr-live-top">
      ${modo === "live" ? `<button class="iconbtn" data-act="minimize" aria-label="Minimizar">⌄</button><span class="tr-elapsed" id="tr-elapsed">${dur((Date.now() - L.inicio) / 1000)}</span>
        <button class="gbtn round" data-act="rest-open" aria-label="Descanso"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2.5h6M5 5 3.5 6.5M19 5l1.5 1.5"/></svg></button>
        <button class="btn primary" data-act="finish">Terminar</button>`
      : `<button class="btn ghost" data-act="cancel-edit">Cancelar</button><b class="tr-live-title">${modo === "rotina" ? (L.id ? "Editar rotina" : "Nova rotina") : "Editar treino"}</b><button class="btn primary" data-act="${modo === "rotina" ? "save-routine" : "save-edit"}">Salvar</button>`}
    </div>
    <div class="tr-live-body">
      ${modo === "rotina" ? `<input class="tr-title-in" id="tr-title" value="${esc(L.titulo)}" placeholder="Nome da rotina">`
        : `<div class="tr-stats live"><span><small>Duração</small><b id="tr-dur">${modo === "live" ? dur((Date.now() - L.inicio) / 1000) : (L.duracaoMin ? L.duracaoMin + " min" : "—")}</b></span><span><small>Volume</small><b>${kg(st.vol)}</b></span><span><small>Séries</small><b>${st.ser}</b></span></div>`}
      ${modo === "edit" ? `<input class="tr-title-in" id="tr-title" value="${esc(L.titulo)}">` : ""}
      ${L.exercicios.map((e, i) => exBlock(e, i, modo)).join("") || `<div class="tr-emptylive"><p><b>Comece adicionando um exercício</b></p><p class="hint">Toque em Adicionar exercício.</p></div>`}
      <button class="btn primary big" data-act="add-ex"><i class="ic" data-i="plus"></i>Adicionar exercício</button>
      ${modo === "live" ? `<div class="tr-row2"><button class="gbtn big" data-act="rename">Renomear</button><button class="gbtn big danger" data-act="discard">Descartar treino</button></div>` : ""}
      ${modo === "edit" ? `<button class="gbtn big danger" data-act="delete-session">Apagar treino</button>` : ""}
      ${modo === "rotina" && L.id ? `<button class="gbtn big danger" data-act="delete-routine">Apagar rotina</button>` : ""}
    </div>`;
}
function exBlock(e, i, modo) {
  const cardio = e.grupo === "Cardio", rec = modo === "live" ? records(e.nome) : null;
  let n = 0;
  const rows = e.series.map((x, j) => {
    const lab = x.tipo === "normal" ? String(++n) : TIPOS[x.tipo];
    const p = x.ph, prev = p ? (cardio ? `${p.seg ? Math.round(p.seg / 60) + "min" : ""}${p.km ? " " + fmtN(p.km) + "km" : ""}` : (p.kg != null && p.reps != null ? `${fmtN(+p.kg || 0)}kg × ${p.reps}` : "—")) : "—";
    const pr = rec && x.feito && x.tipo !== "warmup" && rec.peso && ((num(x.kg) || 0) > rec.peso || e1rm(num(x.kg), num(x.reps)) > rec.rm + .01);
    const phKg = p && !cardio ? p.kg ?? "" : "", phR = p && !cardio ? p.reps ?? "" : "";
    return `<div class="tr-set${x.feito && modo === "live" ? " done" : ""}" data-i="${i}" data-j="${j}">
      <button class="tr-tipo t-${x.tipo}" data-act="set-type" aria-label="Tipo da série">${lab}</button>
      <span class="tr-prev">${esc(prev)}</span>
      ${cardio ? `<input inputmode="decimal" data-f="seg" value="${esc(x.seg)}" placeholder="${p && p.seg ? Math.round(p.seg / 60) : "min"}" aria-label="Minutos"><input inputmode="decimal" data-f="km" value="${esc(x.km)}" placeholder="${p && p.km ? fmtN(p.km) : "km"}" aria-label="Quilômetros">`
        : `<input inputmode="decimal" data-f="kg" value="${esc(x.kg)}" placeholder="${esc(phKg === "" ? "" : fmtN(+phKg))}" aria-label="Peso em kg"><input inputmode="numeric" data-f="reps" value="${esc(x.reps)}" placeholder="${esc(phR)}" aria-label="Repetições">`}
      ${modo === "rotina" ? `<button class="tr-del" data-act="set-del" aria-label="Remover série">✕</button>` : `<button class="tr-rpe${x.rpe ? " on" : ""}" data-act="set-rpe" aria-label="RPE">${x.rpe ? esc(x.rpe) : `<svg viewBox="0 0 24 24"><path d="M4 16a8 8 0 0 1 16 0"/><path d="m12 16 3-4"/></svg>`}</button>`}
      ${modo === "live" ? `<button class="tr-chk${x.feito ? " on" : ""}" data-act="set-done" aria-label="Concluir série">${pr ? "★" : "✓"}</button>` : modo === "edit" ? `<button class="tr-del" data-act="set-del" aria-label="Remover série">✕</button>` : ""}
    </div>`;
  }).join("");
  return `<section class="tr-ex" data-i="${i}">
    <div class="tr-ex-h"><button class="tr-exname" data-act="ex" data-nome="${esc(e.nome)}">${thumb((libQuiet(e.nome) || {}).id, e.nome)}<span>${esc(enName(e.nome))}</span></button><button class="iconbtn" data-act="ex-menu" data-i="${i}" aria-label="Opções do exercício">⋮</button></div>
    <div class="tr-pills">${modo !== "edit" ? `<button class="tr-pill" data-act="ex-rest" data-i="${i}"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/></svg>Descanso: ${e.descanso ? (e.descanso >= 60 ? `${Math.floor(e.descanso / 60)}min${e.descanso % 60 ? " " + (e.descanso % 60) + "s" : ""}` : e.descanso + "s") : "desligado"}</button>` : ""}<button class="tr-pill" data-act="ex-note" data-i="${i}"><svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z"/><path d="M9 13h6M12 10v6"/></svg>${e.nota ? esc(e.nota.slice(0, 24)) : "Nota"}</button></div>
    <div class="tr-set tr-set-h"><span>Série</span><span>Anterior</span>${cardio ? "<span>Min</span><span>Km</span>" : "<span>Kg</span><span>Reps</span>"}<span>${modo === "rotina" ? "" : "RPE"}</span>${modo !== "rotina" ? "<span>✓</span>" : ""}</div>
    ${rows}
    <button class="gbtn tr-addset" data-act="set-add" data-i="${i}">+ Adicionar série</button>
  </section>`;
}

// variações do mesmo movimento no exercises-dataset: outra pegada (pronada, supinada, neutra, fechada, aberta),
// outro equipamento (barra, halter, cabo, máquina, smith) ou outra posição (sentado, em pé, inclinado)
const MOVES = ["leg press", "pull-up", "chin-up", "push-up", "pulldown", "pushdown", "kickback", "deadlift", "extension", "shrug", "crunch", "lunge", "squat", "bridge", "plank", "press", "curl", "row", "raise", "fly", "dip"];
function variantsOf(lib) {
  const x = P().xdb(), n = lib.n.toLowerCase(), mv = MOVES.find(m => n.includes(m)); if (!mv) return [];
  const toks = new Set(n.replace(/[()\-,.]/g, " ").split(/\s+/).filter(Boolean));
  return x.list.filter(e => e.id !== lib.id && e.tg === lib.tg && e.n.toLowerCase().includes(mv) && !/stretch|v\. ?\d|\((male|female)\)|pov\)/i.test(e.n))
    .map(e => { const t = e.n.toLowerCase().replace(/[()\-,.]/g, " ").split(/\s+/).filter(Boolean); return { e, sc: t.filter(w => toks.has(w)).length - t.length * .15 }; })
    .sort((a, b) => b.sc - a.sc).slice(0, 40).map(o => o.e);
}
function openVariants(i) {
  const L = T.live, ex = L.exercicios[i], lib = libQuiet(ex.nome);
  if (!lib) { toast("Este exercício ainda não tem par no banco de exercícios."); return; }
  const vs = variantsOf(lib);
  T.varFor = i;
  sheet(`<div class="tr-sh-h"><button class="btn ghost" data-act="close">Cancelar</button><h3>Variações</h3><span></span></div>
    <p class="hint">Mesmo movimento (${esc(dsName(lib.n))}) com outra pegada, equipamento ou posição. As séries continuam; o histórico passa a contar no novo nome.</p>
    ${vs.length ? `<ul class="ios-list tr-pick">${vs.map(e => `<li data-act="pick-var" data-id="${esc(e.id)}">${thumb(e.id, e.n)}<span><b>${esc(dsName(e.n))}</b><small class="hint">${esc(cap(e.eq))}</small></span><span class="plus">›</span></li>`).join("")}</ul>` : `<p class="empty">Sem variações no banco para este movimento.</p>`}`, "picker");
}

// cronômetro de descanso (barra flutuante)
let tick = 0, beepCtx = null;
function startRest(sec) {
  if (!sec) return;
  T.rest = { fim: Date.now() + sec * 1000, total: sec };
  try { beepCtx = beepCtx || new (window.AudioContext || window.webkitAudioContext)(); if (beepCtx.state === "suspended") beepCtx.resume(); } catch {}
  restUI();
}
function restUI() {
  let bar = $("tr-rest");
  if (!T.rest) { if (bar) bar.hidden = true; return; }
  const left = Math.max(0, (T.rest.fim - Date.now()) / 1000);
  bar.hidden = false;
  bar.innerHTML = `<div class="tr-rest-bar" style="--p:${(1 - left / T.rest.total).toFixed(3)}"></div><b>${clock(left)}</b><span class="hint">descanso</span>
    <button class="gbtn small" data-act="rest-add" data-s="-15">−15</button><button class="gbtn small" data-act="rest-add" data-s="15">+15</button><button class="btn primary small" data-act="rest-skip">Pular</button>`;
  if (left <= 0) { beep(); T.rest = null; setTimeout(restUI, 600); }
}
function beep() {
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {}
  try {
    const c = beepCtx; if (!c) return;
    [0, .25, .5].forEach(t => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.0001, c.currentTime + t); g.gain.exponentialRampToValueAtTime(.3, c.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + t + .18); o.start(c.currentTime + t); o.stop(c.currentTime + t + .2); });
  } catch {}
}
function mini() {
  const m = $("tr-mini"), on = T.live && T.live.modo === "live" && $("tr-live").hidden;
  m.hidden = !on;
  if (on) m.innerHTML = `<b>${esc(T.live.titulo)}</b><span id="tr-mini-t">${dur((Date.now() - T.live.inicio) / 1000)}</span><span class="hint">Toque para voltar</span>`;
}
function everySecond() {
  if (T.live && T.live.modo === "live") {
    const t = dur((Date.now() - T.live.inicio) / 1000);
    ["tr-elapsed", "tr-dur", "tr-mini-t"].forEach(id => { const el = $(id); if (el) el.textContent = t; });
  }
  if (T.rest) restUI();
}

// ---------------- seletor de exercícios ----------------
function openPicker(mode, i) {
  T.pickerFor = { mode, i }; T.pickQ = ""; T.pickG = "";
  sheet(`<div class="tr-sh-h"><button class="btn ghost" data-act="close">Cancelar</button><h3>${mode === "replace" ? "Substituir exercício" : "Adicionar exercício"}</h3><button class="btn ghost strong" data-act="new-ex">Criar</button></div>
    <input class="tr-search" id="tr-pq" type="search" placeholder="Buscar exercício" autocomplete="off">
    <div class="tr-chips" id="tr-pg">${["", ...(P() ? P().GROUPS : []), "Cardio"].map(g => `<button data-act="pick-g" data-g="${esc(g)}" aria-pressed="${!g}">${g || "Todos"}</button>`).join("")}</div>
    <div id="tr-plist"></div>`, "picker");
  P() && P().xdbLoad(pickList);
  mediaLoad(pickList);
  pickList();
  setTimeout(() => $("tr-pq") && $("tr-pq").focus(), 120);
}
function pickList() {
  const box = $("tr-plist"); if (!box) return;
  const q = (T.pickQ || "").toLowerCase().trim(), g = T.pickG;
  const mine = catalog().filter(e => (!g || e.grupo === g) && (!q || e.nome.toLowerCase().includes(q) || String(e.hevy || "").toLowerCase().includes(q) || enName(e.nome).toLowerCase().includes(q)))
    .map(e => ({ e, n: exHist(e.nome).length })).sort((a, b) => b.n - a.n || a.e.nome.localeCompare(b.e.nome));
  const known = new Set(catalog().flatMap(e => [e.nome.toLowerCase(), String(e.hevy || "").toLowerCase(), String((libQuiet(e.nome) || {}).n || "").toLowerCase()]).filter(Boolean));
  const x = P() && P().xdb(), lib = x && x.state === 2 ? x.list.filter(e => !known.has(e.n.toLowerCase()) && (!g || grupoDe(e) === g) && (!q || e.n.toLowerCase().includes(q))).slice(0, q ? 60 : 25) : [];
  box.innerHTML = `${mine.length ? `<h4 class="tr-sub">Seus exercícios</h4><ul class="ios-list tr-pick">${mine.slice(0, 80).map(({ e, n }) => `<li data-act="pick" data-nome="${esc(e.nome)}">${thumb((libQuiet(e.nome) || {}).id, e.nome)}<span><b>${esc(enName(e.nome))}</b><small class="hint">${esc(e.grupo)}${n ? ` · ${n} treinos` : ""}</small></span><span class="plus">+</span></li>`).join("")}</ul>` : ""}
    ${lib.length ? `<h4 class="tr-sub">Biblioteca</h4><ul class="ios-list tr-pick">${lib.map(e => `<li data-act="pick-lib" data-id="${esc(e.id)}">${thumb(e.id, e.n)}<span><b>${esc(dsName(e.n))}</b><small class="hint">${esc(grupoDe(e))} · ${esc(cap(e.eq))}</small></span><span class="plus">+</span></li>`).join("")}</ul>` : ""}
    ${!mine.length && !lib.length ? `<p class="empty">Nada encontrado. Toque em Criar para adicionar “${esc(T.pickQ || "")}”.</p>` : ""}`;
}
async function pickChosen(e) {
  const f = T.pickerFor; closeSheet();
  const L = T.live; if (!L) return;
  const ex = exFrom(e);
  if (L.modo !== "live") ex.series = ex.series.map(s => Object.assign(s, { kg: s.ph && s.ph.kg != null ? s.ph.kg : "", reps: s.ph && s.ph.reps != null ? s.ph.reps : "" }));
  if (f.mode === "replace") L.exercicios[f.i] = ex; else L.exercicios.push(ex);
  // exercício novo vira parte do catálogo da Saúde (nome em português + nome original como apelido)
  const cat = (S().cat && S().cat.exercicios) || {};
  if (!cat[e.nome]) {
    const next = JSON.parse(JSON.stringify(S().cat || {})); next.exercicios = next.exercicios || {};
    next.exercicios[e.nome] = { grupo: e.grupo, aliases: e.hevy && e.hevy !== e.nome ? [e.hevy] : [] };
    try { await db.doc("saude/catalogo").set(next); } catch {}
  }
  saveLive(); renderLive();
}

// ---------------- salvar ----------------
function toDoc(L, fimMs) {
  const d = new Date(L.inicio), data = iso(d), hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  let series = 0, vol = 0, km = 0, seg = 0, forca = false;
  const exercicios = L.exercicios.map(e => {
    const cardio = e.grupo === "Cardio";
    const ss = e.series.filter(x => L.modo !== "live" || x.feito).map(x => {
      if (cardio) { const o = { tipo: x.tipo, seg: Math.round((num(x.seg) || 0) * 60), km: num(x.km) || 0 }; km += o.km; seg += o.seg; return o; }
      const o = { tipo: x.tipo, kg: num(x.kg) || 0, reps: Math.round(num(x.reps) || 0) }; if (num(x.rpe)) o.rpe = num(x.rpe);
      if (x.tipo !== "warmup") { series++; vol += o.kg * o.reps; } forca = true; return o;
    });
    return { grupo: e.grupo, hevy: e.hevy || e.nome, nome: e.nome, nota: e.nota || "", series: ss };
  }).filter(e => e.series.length);
  const durMin = fimMs ? Math.round((fimMs - L.inicio) / 60000) : (L.duracaoMin || null);
  const doc = { titulo: L.titulo || "Treino", data, inicio: `${data}T${hora}`, fim: fimMs ? new Date(fimMs).toISOString() : (L.fimOrig || null), duracaoMin: durMin, descricao: L.descricao || "", origem: "app", link: null, exercicios, series, volumeKg: Math.round(vol), forca };
  if (km || seg) doc.cardio = { km: Math.round(km * 100) / 100, min: Math.round(seg / 60) };
  return { id: L.id || data.replace(/-/g, "") + "T" + hora.replace(":", ""), doc };
}
async function finish() {
  const L = T.live, done = L.exercicios.some(e => e.series.some(x => x.feito));
  if (!done) { alert("Conclua ao menos uma série (✓) antes de terminar, ou descarte o treino."); return; }
  const fim = Date.now();
  if (L.tituloAuto !== false) { const nm = nomeTreino(L.exercicios, true); if (nm) L.titulo = nm; } // ao finalizar: o grupo predominante
  sheet(`<div class="tr-sh-h"><button class="btn ghost" data-act="close">Voltar</button><h3>Salvar treino</h3><button class="btn ghost strong" data-act="save-finish">Salvar</button></div>
    <div class="group-ios"><input id="tf-t" value="${esc(L.titulo)}" placeholder="Título"><textarea id="tf-d" rows="3" placeholder="Como foi o treino?"></textarea></div>
    <div class="tr-stats"><span><small>Duração</small><b>${dur((fim - L.inicio) / 1000)}</b></span><span><small>Volume</small><b>${kg(liveStats().vol)}</b></span><span><small>Séries</small><b>${liveStats().ser}</b></span></div>
    <p class="hint">Séries sem ✓ não são salvas.</p>`, "finish");
  T.finishAt = fim;
}
async function saveFinish() {
  const L = T.live; L.titulo = $("tf-t").value.trim() || L.titulo; L.descricao = $("tf-d").value.trim();
  const { id, doc } = toDoc(L, T.finishAt);
  try {
    await db.doc(`saude/treinos/sessoes/${id}`).set(doc);
    if (L.rotinaId) { const r = T.rotinas.find(x => x.id === L.rotinaId); if (r) await db.doc(`saude/rotinas/${r.id}`).update({ usadaEm: new Date().toISOString() }); }
    clearLive(); T.live = null; T.rest = null; restUI(); closeSheet(); $("tr-live").hidden = true; document.documentElement.classList.remove("tr-noscroll"); mini();
    toast(`Treino salvo · ${doc.series} séries · ${kg(doc.volumeKg)}`); T.view = "historico"; render();
  } catch (e) { alert("Não consegui salvar: " + (e.message || e)); }
}
async function saveEdit() {
  const L = T.live; L.titulo = ($("tr-title") && $("tr-title").value.trim()) || L.titulo;
  const { id, doc } = toDoc(L, null);
  try { await db.doc(`saude/treinos/sessoes/${id}`).set(doc); T.live = null; $("tr-live").hidden = true; document.documentElement.classList.remove("tr-noscroll"); toast("Treino atualizado"); render(); }
  catch (e) { alert("Não consegui salvar: " + (e.message || e)); }
}
async function saveRoutine() {
  const L = T.live, nome = ($("tr-title") && $("tr-title").value.trim()) || "Rotina";
  if (!L.exercicios.length) { alert("Adicione ao menos um exercício."); return; }
  const data = { nome, exercicios: L.exercicios.map(e => ({ nome: e.nome, grupo: e.grupo, hevy: e.hevy || null, descanso: e.descanso, series: e.series.map(x => ({ tipo: x.tipo, kg: num(x.kg), reps: num(x.reps) })) })), atualizadaEm: new Date().toISOString() };
  const id = L.id || "r" + Date.now().toString(36);
  try { await db.doc(`saude/rotinas/${id}`).set(Object.assign({}, (T.rotinas.find(r => r.id === id) || {}).data || {}, data)); T.live = null; $("tr-live").hidden = true; document.documentElement.classList.remove("tr-noscroll"); toast("Rotina salva"); }
  catch (e) { alert("Não consegui salvar: " + (e.message || e)); }
}
function sessionToRoutine(s) {
  return { nome: s.titulo || "Rotina", exercicios: s.exercicios.map(e => ({ nome: e.nome, grupo: e.grupo, hevy: e.hevy || null, descanso: 90, series: e.series.map(x => ({ tipo: x.tipo || "normal", kg: x.kg ?? null, reps: x.reps ?? null })) })) };
}

let toastT; function toast(t) { const el = $("toast"); if (!el) return; el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3000); }
function menu(title, items) {
  // menu de ações no estilo iOS (folha com botões)
  return new Promise(res => {
    const m = $("tr-menu"); m.hidden = false;
    m.innerHTML = `<div class="tr-menu-box"><p class="hint">${esc(title)}</p>${items.map((it, k) => `<button class="${it.danger ? "danger" : ""}" data-k="${k}">${esc(it.l)}</button>`).join("")}<button class="cancel" data-k="-1">Cancelar</button></div>`;
    m.onclick = e => { const b = e.target.closest("[data-k]"); if (!b && e.target !== m) return; m.hidden = true; m.innerHTML = ""; res(b ? +b.dataset.k : -1); };
  });
}

// ---------------- eventos ----------------
function onClick(e) {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act, L = T.live;
  const at = () => { const row = b.closest("[data-i]"); return row ? { i: +row.dataset.i, j: row.dataset.j != null ? +row.dataset.j : null } : { i: +b.dataset.i }; };
  switch (act) {
    case "start-empty": startLive(null); break;
    case "start-sug": { const g = T.sug && T.sug.forca; if (!g) { startLive(null); break; }
      { const pl = P() && P().dayTarget(iso(new Date())), pn = pl && pl.plan && pl.plan.forca ? (pl.plan.grupo || "Treino do dia") : null; // o treino planejado leva o nome do plano
        if (g.tipo === "rotina") startLive(Object.assign({ id: g.r.id, planejado: pn }, g.r.data)); else startLive(Object.assign(sessionToRoutine(g.s), { planejado: pn })); } break; }
    case "start-cardio": { const p = T.sug.cardio, nome = cardioNome(p.cardioTipo);
      startLive({ nome: "Cardio", exercicios: [{ nome, grupo: "Cardio", hevy: nome, descanso: 0, series: [{ tipo: "normal", seg: +p.cardioMin }] }] }); break; }
    case "edit-plan": document.querySelector('#saude-mode [data-mode="painel"]')?.click(); setTimeout(() => document.querySelector('[data-hsub="plano"]')?.click(), 50); break;
    case "open-live": openLive(); break;
    case "go-feed": T.view = "historico"; render(); break;
    case "feed-more": T.feedLimit = (T.feedLimit || 20) + 20; render(); break;
    case "new-routine": editRoutine(null); break;
    case "start-routine": { const r = T.rotinas.find(x => x.id === b.dataset.id); if (r) startLive(Object.assign({ id: r.id }, r.data)); break; }
    case "routine-menu": { const r = T.rotinas.find(x => x.id === b.dataset.id); menu(r.data.nome, [{ l: "Editar rotina" }, { l: "Duplicar" }, { l: "Apagar", danger: true }]).then(async k => {
      if (k === 0) editRoutine(r);
      if (k === 1) await db.doc(`saude/rotinas/r${Date.now().toString(36)}`).set(Object.assign({}, r.data, { nome: r.data.nome + " (cópia)", usadaEm: null }));
      if (k === 2 && confirm(`Apagar a rotina “${r.data.nome}”?`)) await db.doc(`saude/rotinas/${r.id}`).delete();
    }); break; }
    case "detail": closeSheet(); openDetail(b.dataset.id); break;
    case "detail-menu": { const s = sessions().find(x => x.id === b.dataset.id); menu(s.titulo || "Treino", [{ l: "Salvar como rotina" }, { l: "Editar treino" }, { l: "Apagar treino", danger: true }]).then(async k => {
      if (k === 0) { await db.doc(`saude/rotinas/r${Date.now().toString(36)}`).set(sessionToRoutine(s)); toast("Rotina criada"); }
      if (k === 1) { closeSheet(); editSession(s); }
      if (k === 2 && confirm("Apagar este treino? Ele some também dos gráficos da Saúde.")) { await db.doc(`saude/treinos/sessoes/${s.id}`).delete(); closeSheet(); toast("Treino apagado"); }
    }); break; }
    case "edit-session": { const s = sessions().find(x => x.id === b.dataset.id); closeSheet(); editSession(s); break; }
    case "ex": openEx(b.dataset.nome); break;
    case "extab": T.exTab = b.dataset.t; renderEx(); break;
    case "metric": T.exMetric = b.dataset.m; renderEx(); break;
    case "close": closeSheet(); break;
    case "minimize": minimize(); break;
    case "finish": finish(); break;
    case "save-finish": saveFinish(); break;
    case "cancel-edit": if (confirm("Sair sem salvar?")) { T.live = null; $("tr-live").hidden = true; document.documentElement.classList.remove("tr-noscroll"); } break;
    case "save-edit": saveEdit(); break;
    case "save-routine": saveRoutine(); break;
    case "delete-session": if (confirm("Apagar este treino?")) db.doc(`saude/treinos/sessoes/${L.id}`).delete().then(() => { T.live = null; $("tr-live").hidden = true; document.documentElement.classList.remove("tr-noscroll"); toast("Treino apagado"); }); break;
    case "delete-routine": if (confirm("Apagar esta rotina?")) db.doc(`saude/rotinas/${L.id}`).delete().then(() => { T.live = null; $("tr-live").hidden = true; document.documentElement.classList.remove("tr-noscroll"); }); break;
    case "discard": if (confirm("Descartar o treino em andamento? Nada será salvo.")) { clearLive(); T.live = null; T.rest = null; restUI(); $("tr-live").hidden = true; document.documentElement.classList.remove("tr-noscroll"); mini(); render(); } break;
    case "rename": { const t = prompt("Nome do treino", L.titulo); if (t) { L.titulo = t.trim(); L.tituloAuto = false; saveLive(); renderLive(); } break; }
    case "add-ex": openPicker("add"); break;
    case "pick-g": T.pickG = b.dataset.g; document.querySelectorAll("#tr-pg button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); pickList(); break;
    case "pick": { const c = catalog().find(x => x.nome === b.dataset.nome); pickChosen(c); break; }
    case "pick-var": { const x = P().xdb().byId[b.dataset.id], ex = T.live && T.live.exercicios[T.varFor]; if (x && ex) { ex.nome = dsName(x.n); ex.hevy = x.n; closeSheet(); saveLive(); renderLive(); } break; }
    case "pick-lib": { const x = P().xdb().byId[b.dataset.id]; pickChosen({ nome: dsName(x.n), grupo: grupoDe(x), hevy: x.n }); break; }
    case "new-ex": { const nome = prompt("Nome do exercício", T.pickQ ? cap(T.pickQ) : ""); if (!nome) break;
      const gs = [...(P() ? P().GROUPS : []), "Cardio"]; const g = prompt(`Grupo muscular (${gs.join(", ")})`, T.pickG || "Peito");
      pickChosen({ nome: nome.trim(), grupo: gs.find(x => x.toLowerCase() === String(g || "").trim().toLowerCase()) || "Peito", hevy: null }); break; }
    case "ex-menu": { const i = +b.dataset.i; menu(enName(L.exercicios[i].nome), [{ l: "Substituir exercício" }, { l: "Mover para cima" }, { l: "Mover para baixo" }, { l: "Remover exercício", danger: true }, { l: "Variação (pegada, equipamento…)" }]).then(k => {
      if (k === 4) return openVariants(i);
      if (k === 0) openPicker("replace", i);
      if (k === 1 && i > 0) { [L.exercicios[i - 1], L.exercicios[i]] = [L.exercicios[i], L.exercicios[i - 1]]; }
      if (k === 2 && i < L.exercicios.length - 1) { [L.exercicios[i + 1], L.exercicios[i]] = [L.exercicios[i], L.exercicios[i + 1]]; }
      if (k === 3) L.exercicios.splice(i, 1);
      if (k > 0) { saveLive(); renderLive(); }
    }); break; }
    case "ex-rest": { const i = +b.dataset.i; menu("Descanso entre séries", REST.map(s => ({ l: s ? (s >= 60 ? `${Math.floor(s / 60)}min${s % 60 ? " " + s % 60 + "s" : ""}` : s + "s") : "Desligado" }))).then(k => { if (k >= 0) { L.exercicios[i].descanso = REST[k]; saveLive(); renderLive(); } }); break; }
    case "ex-note": { const i = +b.dataset.i, t = prompt("Nota do exercício", L.exercicios[i].nota || ""); if (t !== null) { L.exercicios[i].nota = t.trim(); saveLive(); renderLive(); } break; }
    case "set-add": { const i = +b.dataset.i, e = L.exercicios[i], last = e.series[e.series.length - 1], p = exHist(e.nome)[0];
      const ph = p && p.e.series[e.series.length] ? p.e.series[e.series.length] : null;
      e.series.push(Object.assign(blankSet(ph), last ? { tipo: last.tipo === "warmup" ? "normal" : last.tipo, kg: L.modo === "live" ? "" : last.kg, reps: L.modo === "live" ? "" : last.reps } : {})); saveLive(); renderLive(); break; }
    case "set-del": { const { i, j } = at(); L.exercicios[i].series.splice(j, 1); saveLive(); renderLive(); break; }
    case "set-type": { const { i, j } = at(); menu("Tipo da série", Object.entries(TIPO_NOME).map(([, l]) => ({ l })).concat([{ l: "Remover série", danger: true }])).then(k => {
      if (k < 0) return; if (k === 4) L.exercicios[i].series.splice(j, 1); else L.exercicios[i].series[j].tipo = Object.keys(TIPO_NOME)[k]; saveLive(); renderLive(); }); break; }
    case "set-rpe": { const { i, j } = at(); const vals = ["", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];
      menu("RPE (esforço percebido)", vals.map(v => ({ l: v ? `RPE ${v}` : "Sem RPE" }))).then(k => { if (k >= 0) { L.exercicios[i].series[j].rpe = vals[k]; saveLive(); renderLive(); } }); break; }
    case "set-done": { const { i, j } = at(), e = L.exercicios[i], x = e.series[j];
      if (!x.feito) {
        // como no Hevy: campo vazio assume o valor anterior mostrado
        if (x.ph) { for (const f of e.grupo === "Cardio" ? ["seg", "km"] : ["kg", "reps"]) if (x[f] === "" && x.ph[f] != null) x[f] = f === "seg" ? Math.round(x.ph.seg / 60) : x.ph[f]; }
        if (e.grupo !== "Cardio" && (num(x.kg) == null || !num(x.reps))) { alert("Preencha peso e repetições."); return; }
        x.feito = true; startRest(e.descanso);
      } else x.feito = false;
      saveLive(); renderLive(); break; }
    case "rest-open": menu("Cronômetro de descanso", REST.filter(Boolean).map(s => ({ l: s >= 60 ? `${Math.floor(s / 60)}min${s % 60 ? " " + s % 60 + "s" : ""}` : s + "s" }))).then(k => { if (k >= 0) startRest(REST.filter(Boolean)[k]); }); break;
    case "rest-add": if (T.rest) { T.rest.fim += +b.dataset.s * 1000; T.rest.total = Math.max(1, T.rest.total + +b.dataset.s); restUI(); } break;
    case "rest-skip": T.rest = null; restUI(); break;
  }
}
function onInput(e) {
  const t = e.target;
  if (t.id === "tr-libq") { T.libQ = t.value; const pos = t.selectionStart; render(); const n = $("tr-libq"); n.focus(); n.setSelectionRange(pos, pos); return; }
  if (t.id === "tr-pq") { T.pickQ = t.value; pickList(); return; }
  const row = t.closest(".tr-set[data-i]"); if (!row || !T.live || !t.dataset.f) return;
  T.live.exercicios[+row.dataset.i].series[+row.dataset.j][t.dataset.f] = t.value; saveLive();
  if (T.live.modo !== "rotina") { const st = liveStats(); const v = document.querySelector(".tr-stats.live span:nth-child(2) b"); if (v) v.textContent = kg(st.vol); }
}

// ---------------- início ----------------
export function start() {
  if (!T.started) {
    T.started = true;
    document.addEventListener("click", e => { if (e.target.closest("#treino-root, #tr-sheet, #tr-live, #tr-rest")) onClick(e); });
    document.addEventListener("input", e => { if (e.target.closest("#treino-root, #tr-sheet, #tr-live")) onInput(e); });
    document.addEventListener("click", e => { if (e.target.closest("#treino-root [data-v]")) { T.view = e.target.closest("[data-v]").dataset.v; render(); } });
    $("tr-mini").onclick = openLive;
    try { const l = JSON.parse(localStorage.getItem(LIVE_KEY) || "null"); if (l && l.modo === "live") T.live = l; } catch {}
    db.collection("saude/rotinas").onSnapshot(q => { T.rotinas = q.docs.map(d => ({ id: d.id, data: d.data() })); if (!$("treino-root").hidden) render(); });
    P() && P().onChange(() => { if (!$("treino-root").hidden) render(); });
    setInterval(everySecond, 1000);
    mini();
    // nomes em inglês e miniaturas vêm do banco de exercícios: carrega uma vez e redesenha
    P() && P().xdbLoad(() => { mediaLoad(() => { if (!$("treino-root").hidden) render(); if (T.live && !$("tr-live").hidden) renderLive(); }); });
  }
  render();
}
window.painelTreino = { start, begin: sug => { if (T.live) { const m = $("tr-mini"); if (m && !m.hidden) m.click(); return; } const b = document.querySelector(`#treino-root [data-act="${sug ? "start-sug" : "start-empty"}"]`) || document.querySelector('#treino-root [data-act="start-empty"]'); if (b && !b.disabled) b.click(); }, refresh: async () => { await db.reloadAll(); render(); } };
