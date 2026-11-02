// Configuração pública do app: o que o navegador precisa para mostrar o login.
// A chave anônima do Supabase é pública por desenho (as regras de acesso do banco é que protegem os dados).
export function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    supabaseUrl: env.SUPABASE_URL || null,
    supabaseAnonKey: env.SUPABASE_ANON_KEY || null,
  }), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
