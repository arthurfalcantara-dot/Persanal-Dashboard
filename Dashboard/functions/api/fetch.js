// Lê uma página da web (anúncio de vaga) e devolve só o texto, para a aba Carreira analisar.
// Substitui o conector de leitura web que o painel usava no claude.ai. Exige login (middleware).
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

// só endereços públicos por http(s): nada de rede interna
function allowed(u) {
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const [a, b] = h.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return false;
  }
  if (h.startsWith("[")) return false; // IPv6 literal
  return true;
}

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function htmlToText(html) {
  return html
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article|\/header|\/footer)\b[^>]*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(1).replace(/^x/i, ""), /^#x/i.test(e) ? 16 : 10) || 32) : (ENT[e.toLowerCase()] ?? m))
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function onRequestPost({ request }) {
  let url; try { url = new URL(String((await request.json()).url || "")); } catch { return json(400, { error: "bad_request", message: "Link inválido." }); }
  if (!allowed(url)) return json(400, { error: "bad_request", message: "Só links públicos (http/https)." });
  let r;
  try {
    r = await fetch(url.toString(), {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; PainelDaVida/1.0; leitura de anúncio de vaga)", accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5", "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" },
      signal: AbortSignal.timeout(15000),
    });
  } catch { return json(502, { error: "fetch_failed", message: "A página não respondeu." }); }
  if (!r.ok) return json(502, { error: "fetch_failed", message: `A página respondeu ${r.status}.` });
  const type = r.headers.get("content-type") || "";
  if (!/text\/|html|xml|json/i.test(type)) return json(415, { error: "unsupported", message: "O link não é uma página de texto (PDF ou arquivo)." });
  const raw = (await r.text()).slice(0, 3_000_000);
  const title = (raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
  const text = /html|xml/i.test(type) ? htmlToText(raw) : raw;
  return json(200, { url: r.url, title: htmlToText(title).slice(0, 300), text: text.slice(0, 60000) });
}
