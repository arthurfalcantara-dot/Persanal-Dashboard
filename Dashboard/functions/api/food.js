// Alimentos do Open Food Facts (base aberta, ODbL): busca por nome e por código de barras.
// Passa pelo servidor para mandar o User-Agent que o Open Food Facts pede e normalizar os nutrientes.
const UA = "PainelDaVida/1.0 (app pessoal; https://persanal-dashboard.pages.dev)";
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const r1 = v => (v == null || v === "" || !isFinite(+v) ? null : Math.round(+v * 10) / 10);

function norm(p) {
  if (!p) return null;
  const n = p.nutriments || {}, ml = /ml|l\b/i.test(p.quantity || "") && !/g\b/i.test(p.quantity || "");
  const g = k => r1(n[`${k}_100g`]);
  const kcal = g("energy-kcal") ?? (n["energy_100g"] ? r1(n["energy_100g"] / 4.184) : null);
  const nome = p.product_name_pt || p.product_name || p.generic_name_pt || p.generic_name || "";
  if (!nome) return null;
  const porcoes = [];
  if (p.serving_quantity && +p.serving_quantity > 0) porcoes.push({ nome: p.serving_size || `${p.serving_quantity} ${ml ? "ml" : "g"}`, g: +p.serving_quantity });
  return {
    nome: nome.trim(), marca: (p.brands || "").split(",")[0].trim(), codigo: p.code || p._id || "", base: ml ? "ml" : "g", porcoes, fonte: "off",
    n: { kcal, prot: g("proteins"), carb: g("carbohydrates"), gord: g("fat"), sat: g("saturated-fat"), trans: g("trans-fat"), poli: g("polyunsaturated-fat"), mono: g("monounsaturated-fat"),
      col: n["cholesterol_100g"] != null ? r1(n["cholesterol_100g"] * 1000) : null, acucar: g("sugars"), fibra: g("fiber"), sodio: n["sodium_100g"] != null ? r1(n["sodium_100g"] * 1000) : null },
  };
}
const FIELDS = "code,product_name,product_name_pt,generic_name,generic_name_pt,brands,nutriments,serving_size,serving_quantity,quantity";

export async function onRequestGet({ request }) {
  const u = new URL(request.url), code = (u.searchParams.get("barcode") || "").replace(/\D/g, ""), q = (u.searchParams.get("q") || "").trim();
  try {
    if (code) {
      if (code.length < 6 || code.length > 14) return json(400, { error: "bad_request", message: "Código de barras inválido." });
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`, { headers: { "user-agent": UA } });
      if (r.status === 404) return json(200, { food: null });
      if (!r.ok) return json(502, { error: "off_error", message: `Open Food Facts respondeu ${r.status}.` });
      const j = await r.json();
      return json(200, { food: j.status === 1 ? norm(j.product) : null });
    }
    if (q.length < 2) return json(400, { error: "bad_request", message: "Escreva ao menos 2 letras." });
    const p = new URLSearchParams({ search_terms: q, search_simple: "1", action: "process", json: "1", page_size: "25", fields: FIELDS, sort_by: "unique_scans_n" });
    const r = await fetch(`https://br.openfoodfacts.org/cgi/search.pl?${p}`, { headers: { "user-agent": UA } });
    if (r.status === 503 || r.status === 429) return json(429, { error: "rate_limited", message: "O Open Food Facts limita buscas por minuto. Espere um pouco." });
    if (!r.ok) return json(502, { error: "off_error", message: `Open Food Facts respondeu ${r.status}.` });
    const j = await r.json();
    return json(200, { foods: (j.products || []).map(norm).filter(f => f && f.n.kcal != null) });
  } catch (e) { return json(502, { error: "off_error", message: "O Open Food Facts não respondeu." }); }
}
