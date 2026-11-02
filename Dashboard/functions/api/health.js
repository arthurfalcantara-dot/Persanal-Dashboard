// Diagnóstico: quem está logado e quais integrações estão configuradas (sem expor valores).
export function onRequestGet({ env, data }) {
  return new Response(JSON.stringify({
    user: data.user.email,
    notion: !!env.NOTION_TOKEN,
    anthropic: !!env.ANTHROPIC_API_KEY,
    google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    time: new Date().toISOString(),
  }), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
