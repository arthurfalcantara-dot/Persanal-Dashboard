// Toda rota /api/* passa por aqui: exige o token de sessão do Supabase e confere o e-mail permitido.
// O token vem do login no app (Authorization: Bearer <access_token>). As chaves (Notion, Anthropic…)
// ficam só nas variáveis de ambiente do Cloudflare e nunca chegam ao navegador.

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

// cache curto do usuário por token, para não consultar o Supabase a cada chamada
const seen = new Map();

export async function onRequest(ctx) {
  const { request, env, next, data } = ctx;
  const url = new URL(request.url);
  if (url.pathname === "/api/config") return next(); // configuração pública do login (URL e chave anônima do Supabase)

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return json(401, { error: "unauthenticated", message: "Faça login." });
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return json(500, { error: "not_configured", message: "SUPABASE_URL e SUPABASE_ANON_KEY não estão configurados." });

  let user = seen.get(token);
  if (!user || user.exp < Date.now()) {
    const r = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { authorization: `Bearer ${token}`, apikey: env.SUPABASE_ANON_KEY } });
    if (!r.ok) return json(401, { error: "unauthenticated", message: "Sessão inválida ou expirada. Entre de novo." });
    const u = await r.json();
    user = { id: u.id, email: (u.email || "").toLowerCase(), exp: Date.now() + 60_000 };
    seen.set(token, user);
    if (seen.size > 50) seen.delete(seen.keys().next().value);
  }

  // só os e-mails permitidos (separados por vírgula) usam o painel
  const allowed = String(env.ALLOWED_EMAILS || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  if (!allowed.length) return json(500, { error: "not_configured", message: "ALLOWED_EMAILS não está configurado." });
  if (!allowed.includes(user.email)) return json(403, { error: "forbidden", message: "Este e-mail não tem acesso ao painel." });

  data.user = user;
  data.token = token;
  return next();
}
