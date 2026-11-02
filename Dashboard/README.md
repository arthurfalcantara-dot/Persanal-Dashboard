# Painel da Vida — app (PWA)

O mesmo painel no iPhone e no PC, fora do claude.ai.
Esta é a **etapa 1 (esqueleto)**: login, servidor, ponte para o Notion, banco e app instalável.
As abas do painel entram nas próximas etapas.

## Como funciona

```
iPhone (Safari → Tela de Início) ─┐
                                  ├─► Cloudflare Pages ── /public       (o app: HTML, CSS, JS)
PC (Chrome/Edge → Instalar app) ──┘                  └─ /functions/api (servidor: guarda as chaves)
                                                          ├─► API do Notion   (Workouts, Sets, Runs…)
                                                          ├─► API da Anthropic (Coach — próxima etapa)
                                                          └─► Google Calendar  (próxima etapa)
O app também fala direto com o Supabase: login por código no e-mail e banco de documentos (tabela docs).
```

- **Por que um servidor?** As chaves do Notion e da Anthropic não podem ficar no app (qualquer um leria), e a API do Notion não aceita chamadas diretas do navegador.
- **Segurança:** toda rota `/api` exige login, e só os e-mails de `ALLOWED_EMAILS` passam. No banco, cada linha pertence a um usuário (RLS).
- **Banco de documentos:** a tabela `docs` guarda documentos por caminho (`saude/config`, `saude/coach`…), no mesmo formato do banco do artifact. O arquivo `public/data.js` imita a interface do artifact (`db.doc(p).get()`, `db.collection(p).onSnapshot()`), para a migração das abas mexer pouco no código.

## Configuração (uma vez, ~30 min)

### 1. GitHub
O código já está no repositório `arthurfalcantara-dot/persanal-dashboard`, na pasta `Dashboard/`.
- O arquivo `.dev.vars` nunca vai para o GitHub: ele está no `.gitignore`.

### 2. Supabase (login + banco)
1. Crie uma conta em supabase.com e um projeto. Região: São Paulo (`sa-east-1`).
2. Abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Em **Authentication → Sign In / Providers → Email**:
   - deixe o e-mail ativado;
   - desative "Allow new users to sign up" depois do seu primeiro login.
4. Em **Authentication → Email Templates → Magic Link**:
   - troque o texto para incluir o código, por exemplo `Seu código: {{ .Token }}`.
   - O app usa código de 6 dígitos, e não o link: no iPhone, o link abriria o Safari fora do app instalado.
5. Em **Authentication → URL Configuration**, ponha o endereço do app em **Site URL** (depois do passo 4).
6. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
7. Para atualizar outros aparelhos em tempo real: **Database → Replication**, ligue a tabela `docs` em `supabase_realtime`.

### 3. Notion (integração)
1. Em notion.so/my-integrations, crie uma integração **interna** chamada "Painel". Copie o token (`ntn_…`).
2. No Notion, abra a página **Workout Tracker** → `•••` → **Conexões** → adicione "Painel".
   - Faça o mesmo nas outras páginas que o painel usa (finanças, tarefas, carreira…), conforme formos migrando.

### 4. Cloudflare Pages (hospedagem + servidor)
1. Crie uma conta em cloudflare.com. Vá em **Workers & Pages → Create → Pages → Connect to Git** e escolha o repositório.
2. Configuração de build:
   - Framework: **None**;
   - Build command: vazio;
   - **Root directory (advanced): `Dashboard`**;
   - Output directory: `public`.
   - Production branch: a branch em que o código está (ex.: `main`, depois do merge).
3. Em **Settings → Variables and Secrets**, adicione:
   - `SUPABASE_URL` e `SUPABASE_ANON_KEY`, os do passo 2;
   - `ALLOWED_EMAILS`: o seu e-mail;
   - `NOTION_TOKEN`, como **Secret**.
4. Faça o deploy. O endereço fica algo como `painel-da-vida.pages.dev`. Volte ao passo 2.5 e cadastre-o.

## Instalar
- **iPhone:** abra o endereço no Safari → Compartilhar → **Adicionar à Tela de Início**.
- **PC:** abra no Chrome ou no Edge → ícone de instalar na barra de endereço (ou menu → **Instalar app**).

Na tela **Início**, as quatro verificações devem ficar verdes:
- login;
- servidor;
- Notion, com os seus treinos recentes;
- banco ("Gravado e lido de volta").

## Rodar no seu PC (opcional)
```
npm install -g wrangler
copy .dev.vars.example .dev.vars   (e preencha)
wrangler pages dev public
```
Abre em http://localhost:8788.

## Estrutura
```
public/            app (servido como está, sem build)
  index.html       casca do app, login e tela de Início
  styles.css       mesmos tokens visuais do painel; barra lateral no PC, barra inferior no celular
  data.js          camada de dados (login, /api, Notion, banco de documentos)
  app.js           telas
  sw.js            service worker (abre rápido e permite instalar)
  manifest.webmanifest, icons/
  vendor/          cliente do Supabase 2.117.3 (cópia local, licença MIT)
functions/api/     servidor (Cloudflare Pages Functions)
  _middleware.js   exige login e e-mail permitido
  config.js        dados públicos do login
  health.js        diagnóstico
  notion/[[path]].js  ponte para a API do Notion (lista fechada de caminhos)
supabase/schema.sql  tabela docs + regras de acesso
```

## Próximas etapas
1. Migrar a aba **Saúde & corpo**:
   - leitura de Workouts/Sets/Runs pela API oficial;
   - plano, nutrição e Coach no banco;
   - Coach via API da Anthropic, com `ANTHROPIC_API_KEY`.
2. Copiar os dados do banco do artifact para a tabela `docs`, uma vez.
3. Migrar as demais abas e o Google Calendar (OAuth).
