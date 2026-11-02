// Ponte do conector do Notion do claude.ai → API oficial do Notion (via /api/notion).
// As abas vieram do artifact e chamam mcp.callTool("Notion", ferramenta, entrada). Aqui cada
// ferramenta vira chamadas à API, e a resposta volta no mesmo formato "achatado" do conector:
//   propriedades por nome; datas como "date:<Prop>:start"; caixas como "__YES__"/"__NO__".
import { api, ApiError } from "/data.js";

const norm = id => String(id || "").replace(/^collection:\/\//, "").trim();
const dashed = id => { const h = norm(id).replace(/-/g, ""); return /^[0-9a-f]{32}$/i.test(h) ? `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` : norm(id); };

// views do Notion usadas pelas abas → fonte de dados + o mesmo filtro e ordenação da view
// (a API pública não consulta uma view; os filtros abaixo foram copiados de cada view no Notion).
// Chave: id da view (parâmetro ?v= do link).
const VIEWS = {
  // Finanças
  "3e6b0f63216781168060000c8a352b20": { ds: "e11b0f63-2167-82a3-836e-873a42b99943", sorts: [{ property: "Date", direction: "descending" }] }, // 2026 · Painel (não editar)
  "3ecb0f63216780178f46000c0c704a42": { ds: "3ecb0f63-2167-8076-9d99-000b7669f58a" },  // 2025
  "3ecb0f632167806c81ca000cca15f0a7": { ds: "3ecb0f63-2167-8087-afab-000b953e235c" },  // 2024
  "3ecb0f6321678024a6c4000cf12c2664": { ds: "3ecb0f63-2167-805b-be25-000be942c5d2" },  // 2023
  // Self Improvement
  "3ecb0f632167811a8975000cb9d08571": { ds: "3ecb0f63-2167-80a6-a3a1-000bb5a4b3cf", sorts: [{ property: "Date", direction: "descending" }] }, // Hábitos · Painel (não editar)
  "130b0f63216781a0bc48000ca19ab18c": { ds: "130b0f63-2167-8188-8e26-000b32075145" },  // Goals · Timeline
  "130b0f6321678177be8f000c08385fdc": { ds: "130b0f63-2167-8109-a7a8-000b63cf7957", sorts: [{ property: "ETA", direction: "ascending" }] }, // Tasks · Calendar
  "1bcb0f63216781258823000cbfbe682e": { ds: "1bcb0f63-2167-813d-a574-000bdfd166f9", filter: { property: "Archive", checkbox: { equals: false } } }, // Books · Active
  "1b9b0f6321678010a561000c70275d73": { ds: "1b9b0f63-2167-801f-b5ec-000b992d92ed" },  // Personal Tasks
};
const viewOf = url => { const m = String(url || "").match(/[?&]v=([0-9a-f]{32})/i); return m && VIEWS[m[1].toLowerCase()]; };

const text = a => (a || []).map(t => t.plain_text).join("");
function flatten(page) {
  const out = { url: page.url, id: page.id };
  for (const [name, p] of Object.entries(page.properties || {})) {
    switch (p.type) {
      case "title": case "rich_text": out[name] = text(p[p.type]); break;
      case "number": out[name] = p.number; break;
      case "select": case "status": out[name] = p[p.type] ? p[p.type].name : null; break;
      case "multi_select": out[name] = JSON.stringify(p.multi_select.map(o => o.name)); break;
      case "checkbox": out[name] = p.checkbox ? "__YES__" : "__NO__"; break;
      case "date": if (p.date) { out[`date:${name}:start`] = p.date.start; out[`date:${name}:end`] = p.date.end; out[`date:${name}:is_datetime`] = p.date.start && p.date.start.length > 10 ? 1 : 0; } break;
      case "url": case "email": case "phone_number": out[name] = p[p.type]; break;
      case "relation": out[name] = JSON.stringify((p.relation || []).map(r => `https://www.notion.so/${r.id.replace(/-/g, "")}`)); break;
      case "formula": { const f = p.formula || {}; out[name] = f.type === "date" ? (f.date && f.date.start) : f.type === "boolean" ? (f.boolean ? "__YES__" : "__NO__") : f[f.type]; break; }
      case "rollup": { const r = p.rollup || {}; out[name] = r.type === "number" ? r.number : r.type === "array" ? JSON.stringify(r.array) : r[r.type]; break; }
      case "created_time": case "last_edited_time": out[name] = p[p.type]; break;
      case "unique_id": out[name] = p.unique_id ? `${p.unique_id.prefix ? p.unique_id.prefix + "-" : ""}${p.unique_id.number}` : null; break;
      default: break;
    }
  }
  return out;
}

// a API devolve no máximo 25 itens de uma relação dentro da página; o resto vem pelo endpoint da propriedade
async function fullRelations(pages) {
  for (const pg of pages) for (const p of Object.values(pg.properties || {})) {
    if (p.type !== "relation" || !p.has_more) continue;
    const all = []; let cursor = null;
    do {
      const r = await api(`notion/pages/${pg.id}/properties/${/%[0-9A-F]{2}/i.test(p.id) ? p.id : encodeURIComponent(p.id)}${cursor ? `?start_cursor=${encodeURIComponent(cursor)}` : ""}`);
      for (const it of r.results || []) if (it.relation) all.push({ id: it.relation.id });
      cursor = r.has_more ? r.next_cursor : null;
    } while (cursor);
    p.relation = all; p.has_more = false;
  }
}

const schemas = new Map();
async function schema(ds) {
  const id = dashed(ds);
  if (!schemas.has(id)) schemas.set(id, api(`notion/data_sources/${id}`).catch(e => { schemas.delete(id); throw e; }));
  return schemas.get(id);
}

// propriedades "achatadas" (formato do conector) → formato da API, conforme o tipo de cada propriedade
function unflatten(flat, props) {
  const out = {};
  for (const [k, v] of Object.entries(flat || {})) {
    const dm = k.match(/^date:(.+):(start|end|is_datetime)$/);
    if (dm) {
      if (dm[2] === "is_datetime") continue;
      const d = out[dm[1]] = out[dm[1]] || { date: {} };
      d.date[dm[2]] = v || null;
      continue;
    }
    const p = props[k]; if (!p) continue;
    switch (p.type) {
      case "title": case "rich_text": out[k] = { [p.type]: [{ text: { content: String(v ?? "") } }] }; break;
      case "number": out[k] = { number: v === "" || v == null ? null : Number(v) }; break;
      case "select": out[k] = { select: v ? { name: String(v) } : null }; break;
      case "status": out[k] = { status: v ? { name: String(v) } : null }; break;
      case "multi_select": { let a = v; if (typeof v === "string") { try { a = JSON.parse(v); } catch { a = v.split(",").map(s => s.trim()).filter(Boolean); } } out[k] = { multi_select: [].concat(a || []).map(name => ({ name })) }; break; }
      case "checkbox": out[k] = { checkbox: v === true || v === "__YES__" }; break;
      case "url": case "email": case "phone_number": out[k] = { [p.type]: v || null }; break;
      case "relation": { let a = v; if (typeof v === "string") { try { a = JSON.parse(v); } catch { a = [v]; } } out[k] = { relation: [].concat(a || []).map(u => ({ id: dashed(String(u).match(/[0-9a-f]{32}/i)?.[0] || u) })) }; break; }
      default: break;
    }
  }
  return out;
}

// erros no formato do conector (as abas tratam por e.code)
function toMcpError(e) {
  if (e instanceof ApiError) {
    const code = e.status === 401 || e.status === 403 && e.code !== "not_allowed" ? "needs_reauth"
      : e.status === 404 ? "consent_required"
      : e.status === 429 ? "rate_limited"
      : e.status >= 500 && e.code === "not_configured" ? "server_not_connected"
      : e.status >= 500 ? "server_unavailable" : "tool_error";
    return { code, message: e.message, retryable: e.status === 429 || e.status >= 502, retryAfterMs: 1500 };
  }
  return { code: "server_unavailable", message: String(e && e.message || e), retryable: true, retryAfterMs: 1500 };
}

const TOOLS = {
  // consulta: { data: { mode: "view", view_url, page_size, start_cursor } } ou { data_source_url / data_source_id, ... }
  async "notion-query-data-sources"(input) {
    const d = input.data || input;
    const v = d.view_url ? viewOf(d.view_url) : null;
    const ds = v ? v.ds : dashed(d.data_source_id || d.data_source_url || (d.data_source_urls || [])[0]);
    if (!ds) throw { code: "tool_error", message: "view do Notion sem fonte de dados conhecida no app" };
    const body = { page_size: Math.min(100, d.page_size || 100) };
    if (d.start_cursor) body.start_cursor = d.start_cursor;
    if (v && v.sorts) body.sorts = v.sorts;
    if (v && v.filter) body.filter = v.filter;
    const r = await api(`notion/data_sources/${ds}/query`, { method: "POST", body });
    await fullRelations(r.results);
    return { payload: { results: r.results.map(flatten), has_more: r.has_more, next_cursor: r.next_cursor } };
  },
  // esquema de uma base, no mesmo envelope de texto do conector (<data-source-state>{…}</data-source-state>)
  async "notion-fetch"(input) {
    const ds = await schema(input.id);
    const sch = {};
    for (const [name, p] of Object.entries(ds.properties || {})) {
      const o = p[p.type] && p[p.type].options;
      sch[name] = Object.assign({ type: p.type }, o ? { options: o.map(x => ({ name: x.name, color: x.color })) } : {});
    }
    const txt = `<data-source-state>${JSON.stringify({ name: text(ds.title), schema: sch })}</data-source-state>`;
    return { payload: txt, content: [{ type: "text", text: txt }] };
  },
  // criar páginas: { parent: { data_source_id }, pages: [{ properties: {…achatadas…} }] }
  async "notion-create-pages"(input) {
    const ds = dashed(input.parent && (input.parent.data_source_id || input.parent.database_id));
    const sc = await schema(ds);
    const pages = [];
    for (const pg of input.pages || []) {
      const r = await api("notion/pages", { method: "POST", body: { parent: { type: "data_source_id", data_source_id: ds }, properties: unflatten(pg.properties, sc.properties || {}) } });
      pages.push({ id: r.id, url: r.url });
    }
    return { payload: { pages } };
  },
  // atualizar propriedades: { page_id, command: "update_properties", properties: {…achatadas…} }
  async "notion-update-page"(input) {
    const d = input.data || input;
    const id = dashed(String(d.page_id || "").match(/[0-9a-f]{32}|[0-9a-f-]{36}/i)?.[0] || d.page_id);
    const page = await api(`notion/pages/${id}`);
    const parent = page.parent && (page.parent.data_source_id || page.parent.database_id);
    const sc = parent ? await schema(parent) : { properties: page.properties };
    const r = await api(`notion/pages/${id}`, { method: "PATCH", body: { properties: unflatten(d.properties, sc.properties || page.properties) } });
    return { payload: { id: r.id, url: r.url } };
  },
};

export const mcp = {
  async callTool(server, tool, input /*, opts */) {
    const fn = TOOLS[tool];
    if (!fn) throw { code: "tool_error", message: `${tool} ainda não existe no app` };
    try { return await fn(input || {}); }
    catch (e) { throw e && e.code && !(e instanceof ApiError) ? e : toMcpError(e); }
  },
  async invalidate() { /* sem cache no app: cada leitura vai ao Notion */ },
};
