// Camada de dados do painel fora do claude.ai.
// Ela imita o formato que o painel usa dentro do artifact, para a migração das abas mexer pouco no código:
//   artifact                                  →  app
//   (await claude.use("db")).doc(p).get()     →  db.doc(p).get()            (Supabase, tabela docs)
//   db.collection(p).get() / onSnapshot(fn)   →  db.collection(p).get() / onSnapshot(fn)
//   mcp.callTool("Notion", "notion-query…")   →  notion.query(dataSourceId, body)   (servidor → API do Notion)

let sb = null;          // cliente Supabase (login + banco)
let session = null;

export async function init() {
  const cfg = await fetch("/api/config").then(r => r.json()).catch(() => ({}));
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error("O servidor ainda não tem SUPABASE_URL e SUPABASE_ANON_KEY configurados.");
  sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  session = (await sb.auth.getSession()).data.session;
  sb.auth.onAuthStateChange((_e, s) => { session = s; });
  return sb;
}
export const auth = {
  get user() { return session && session.user; },
  onChange(fn) { return sb.auth.onAuthStateChange((_e, s) => { session = s; fn(s); }); },
  // código por e-mail: funciona dentro do app instalado no iPhone (o link mágico abriria o Safari, fora do app)
  sendCode: email => sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin } }),
  verifyCode: (email, token) => sb.auth.verifyOtp({ email, token, type: "email" }),
  signOut: () => sb.auth.signOut(),
};

// ---------- servidor (/api) ----------
export class ApiError extends Error { constructor(status, body) { super((body && body.message) || `Erro ${status}`); this.status = status; this.code = body && (body.error || body.code); this.body = body; } }
export async function api(path, { method = "GET", body } = {}) {
  if (!session) throw new ApiError(401, { error: "unauthenticated", message: "Faça login." });
  const r = await fetch(`/api/${path}`, {
    method, headers: { authorization: `Bearer ${session.access_token}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch { j = { message: txt }; }
  if (!r.ok) throw new ApiError(r.status, j);
  return j;
}

// ---------- Notion (API oficial, versão 2025-09-03) ----------
export const notion = {
  // consulta uma base; percorre as páginas até maxPages
  async query(dataSourceId, body = {}, maxPages = 1) {
    const out = []; let cursor;
    for (let i = 0; i < maxPages; i++) {
      const r = await api(`notion/data_sources/${dataSourceId}/query`, { method: "POST", body: Object.assign({ page_size: 100 }, body, cursor ? { start_cursor: cursor } : {}) });
      out.push(...r.results);
      if (!r.has_more) break; cursor = r.next_cursor;
    }
    return out;
  },
  page: id => api(`notion/pages/${id}`),
  createPage: (dataSourceId, properties, extra = {}) => api("notion/pages", { method: "POST", body: Object.assign({ parent: { type: "data_source_id", data_source_id: dataSourceId }, properties }, extra) }),
  updatePage: (id, body) => api(`notion/pages/${id}`, { method: "PATCH", body }),
  trash: id => api(`notion/pages/${id}`, { method: "PATCH", body: { in_trash: true } }),
};
// valores das propriedades no formato da API → texto/número/data simples
export const prop = {
  text: p => !p ? "" : (p.title || p.rich_text || []).map(t => t.plain_text).join(""),
  num: p => p && typeof p.number === "number" ? p.number : null,
  date: p => p && p.date ? p.date : null,
  select: p => p && (p.status || p.select) ? (p.status || p.select).name : "",
  check: p => !!(p && p.checkbox),
  rel: p => p && p.relation ? p.relation.map(x => x.id.replace(/-/g, "")) : [],
};

// ---------- banco de documentos (Supabase, tabela docs) ----------
const clean = v => JSON.parse(JSON.stringify(v ?? {}));
function docRef(path) {
  return {
    path,
    async get() {
      const { data, error } = await sb.from("docs").select("data, updated_at").eq("path", path).maybeSingle();
      if (error) throw error;
      return { exists: !!data, id: path.split("/").pop(), data: () => (data ? data.data : undefined), updatedAt: data && data.updated_at };
    },
    async set(value) {
      const { error } = await sb.from("docs").upsert({ path, data: clean(value) }, { onConflict: "user_id,path" });
      if (error) throw error;
    },
    async update(patch) { // mescla no primeiro nível, como no artifact
      const cur = await this.get();
      await this.set(Object.assign({}, cur.exists ? cur.data() : {}, clean(patch)));
    },
    async delete() { const { error } = await sb.from("docs").delete().eq("path", path); if (error) throw error; },
  };
}
function collectionRef(path) {
  return {
    path,
    doc: id => docRef(`${path}/${id}`),
    async get() {
      const { data, error } = await sb.from("docs").select("path, data, updated_at").eq("collection", path).limit(5000);
      if (error) throw error;
      const docs = data.map(r => ({ id: r.path.split("/").pop(), data: () => r.data, updatedAt: r.updated_at }));
      return { docs, size: docs.length, empty: !docs.length };
    },
    // mudanças em tempo real (outro aparelho gravou): relê a coleção e avisa
    onSnapshot(fn, onErr) {
      let alive = true;
      const load = () => this.get().then(s => alive && fn(s)).catch(e => onErr && onErr(e));
      load();
      const ch = sb.channel(`docs:${path}:${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: `collection=eq.${path}` }, load)
        .subscribe();
      return () => { alive = false; sb.removeChannel(ch); };
    },
  };
}
export const db = { doc: docRef, collection: collectionRef };
