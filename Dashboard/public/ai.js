// Ponte do recurso "sample" do claude.ai → Claude pela API da Anthropic (servidor do app, /api/claude).
// As abas chamam sample.json(prompt, { modelTier, signal }) e sample.text(...), como no artifact.
import { api, ApiError } from "/data.js";

// erros no formato que as abas já tratam (sampleErr / AI_ERR)
function toSampleError(e) {
  if (e && e.name === "AbortError") return { code: "cancelled" };
  if (e instanceof ApiError) return { code: e.code || (e.status === 429 ? "rate_limited" : "upstream_error"), message: e.message };
  return { code: "upstream_error", message: String(e && e.message || e) };
}
// tira cercas de código e acha o JSON mesmo que venha com alguma frase em volta
function parseJson(text) {
  const t = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try { return JSON.parse(t); } catch {}
  const starts = [t.indexOf("{"), t.indexOf("[")].filter(i => i >= 0);
  if (starts.length) {
    const i = Math.min(...starts), close = t[i] === "{" ? "}" : "]";
    for (let j = t.lastIndexOf(close); j > i; j = t.lastIndexOf(close, j - 1)) {
      try { return JSON.parse(t.slice(i, j + 1)); } catch {}
    }
  }
  throw { code: "invalid_json", message: "O Claude respondeu fora do formato esperado." };
}

async function ask(prompt, opts, json) {
  try {
    const r = await api("claude", { method: "POST", body: { prompt: String(prompt), tier: opts && opts.modelTier === "quick" ? "quick" : "default", json }, signal: opts && opts.signal });
    return r.text;
  } catch (e) { throw toSampleError(e); }
}

export const sample = {
  async json(prompt, opts = {}) { return parseJson(await ask(prompt, opts, true)); },
  async text(prompt, opts = {}) { return ask(prompt, opts, false); },
};
