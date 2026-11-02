// Claude para as abas (análise de vagas, currículo, histórias, texto livre de treino/refeição).
// O app manda { prompt, tier, json }; a chave ANTHROPIC_API_KEY fica só aqui no servidor.
// Usa a biblioteca oficial da Anthropic (empacotada em lib/, sem etapa de build no Cloudflare).
import Anthropic from "../../lib/anthropic-sdk-0.135.0.js";

// "default": análises que pedem julgamento (vaga × currículo, avaliação de histórias) → Claude Opus 5.5
// "quick": extrações simples (anúncio → campos, texto do treino → séries) → Claude Haiku 5.5, mais rápido e barato
const MODELS = { default: "claude-opus-5-5", quick: "claude-haiku-5-5" };
const MAX_PROMPT = 400_000; // caracteres (~100 mil tokens): o painel corta textos longos antes disso

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return json(503, { error: "sampling_disabled", message: "ANTHROPIC_API_KEY não está configurada no Cloudflare." });
  let body; try { body = await request.json(); } catch { return json(400, { error: "bad_request", message: "Corpo inválido." }); }
  const prompt = String(body.prompt || "");
  if (!prompt.trim()) return json(400, { error: "bad_request", message: "Pedido vazio." });
  if (prompt.length > MAX_PROMPT) return json(413, { error: "prompt_too_large", message: "Texto grande demais para o Claude." });
  const tier = body.tier === "quick" ? "quick" : "default";
  const wantJson = body.json !== false;

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });
  const system = "Você é o assistente do painel pessoal do usuário. Responda em português do Brasil, salvo quando o pedido disser outra língua."
    + (wantJson ? " Responda somente com o JSON pedido, sem texto antes ou depois e sem cercas de código." : "");
  const params = {
    model: MODELS[tier],
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: prompt }],
    output_config: { effort: tier === "quick" ? "low" : "medium" },
  };

  let msg;
  try {
    // No Opus 5.5, se um filtro de segurança recusar, a própria API refaz o pedido no modelo de reserva recomendado.
    msg = tier === "default"
      ? await client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
      : await client.messages.create(params);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json(429, { error: "rate_limited", message: "Muitas chamadas ao Claude agora." });
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return json(503, { error: "sampling_disabled", message: "A chave da Anthropic foi recusada. Confira ANTHROPIC_API_KEY." });
    if (e instanceof Anthropic.BadRequestError) return json(400, { error: /too long|too many tokens|context/i.test(e.message) ? "prompt_too_large" : "bad_request", message: e.message });
    if (e instanceof Anthropic.APIError) return json(502, { error: e.status === 529 ? "overloaded" : "upstream_error", message: `Claude respondeu ${e.status ?? "erro"}.` });
    return json(502, { error: "upstream_error", message: String(e && e.message || e) });
  }

  if (msg.stop_reason === "refusal") return json(422, { error: "refused", message: "O Claude recusou este pedido.", category: msg.stop_details?.category ?? null });
  const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
  if (!text) return json(502, { error: "empty_completion", message: "O Claude não produziu resposta." });
  if (msg.stop_reason === "max_tokens") return json(502, { error: "empty_completion", message: "A resposta do Claude foi cortada no limite de tamanho." });
  return json(200, { text, model: msg.model, usage: { input: msg.usage?.input_tokens, output: msg.usage?.output_tokens } });
}
