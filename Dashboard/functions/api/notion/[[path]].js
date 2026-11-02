// Ponte para a API oficial do Notion: /api/notion/<caminho> → https://api.notion.com/v1/<caminho>
// Só os caminhos e métodos que o painel usa passam (lista abaixo). O token fica em NOTION_TOKEN.

const NOTION_VERSION = "2025-09-03";
const ID = "[0-9a-fA-F-]{32,36}";
const ALLOW = [
  ["POST", new RegExp(`^data_sources/${ID}/query$`)],   // consultar uma base (Workouts, Sets…)
  ["GET", new RegExp(`^data_sources/${ID}$`)],           // esquema de uma base
  ["GET", new RegExp(`^databases/${ID}$`)],              // base → suas fontes de dados
  ["GET", new RegExp(`^pages/${ID}$`)],                  // uma página
  ["PATCH", new RegExp(`^pages/${ID}$`)],                // atualizar propriedades / mandar para a lixeira
  ["POST", /^pages$/],                                   // criar página
  ["GET", new RegExp(`^blocks/${ID}/children$`)],        // conteúdo de uma página
  ["PATCH", new RegExp(`^blocks/${ID}/children$`)],      // acrescentar conteúdo
];

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function onRequest({ request, env, params }) {
  if (!env.NOTION_TOKEN) return json(500, { error: "not_configured", message: "NOTION_TOKEN não está configurado." });
  const path = [].concat(params.path || []).join("/");
  const method = request.method.toUpperCase();
  if (!ALLOW.some(([m, rx]) => m === method && rx.test(path))) return json(403, { error: "not_allowed", message: `${method} ${path} não está liberado na ponte do Notion.` });

  const url = new URL(request.url);
  const init = {
    method,
    headers: { authorization: `Bearer ${env.NOTION_TOKEN}`, "notion-version": NOTION_VERSION, "content-type": "application/json" },
  };
  if (method !== "GET") init.body = await request.text();

  // a API do Notion aceita ~3 pedidos/s: em 429, espera o que ela pedir e tenta mais uma vez
  let r = await fetch(`https://api.notion.com/v1/${path}${url.search}`, init);
  if (r.status === 429) {
    const wait = Math.min(5, Number(r.headers.get("retry-after")) || 1);
    await new Promise(res => setTimeout(res, wait * 1000));
    r = await fetch(`https://api.notion.com/v1/${path}${url.search}`, init);
  }
  return new Response(r.body, { status: r.status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
