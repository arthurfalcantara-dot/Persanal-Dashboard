-- Painel da Vida — banco no Supabase (rode no SQL Editor do projeto, uma vez).
-- Uma tabela de documentos por caminho, no mesmo formato do banco do artifact
-- ("saude/config", "saude/coach", "saude/nutricao/dias/2026-11-02"…), para a migração ser direta.
-- Cada linha pertence a um usuário; as regras (RLS) garantem que cada um só lê e escreve o que é seu.

create table if not exists public.docs (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  path       text        not null,                 -- caminho completo do documento, ex.: saude/nutricao/dias/2026-11-02
  collection text        generated always as (regexp_replace(path, '/[^/]+$', '')) stored, -- ex.: saude/nutricao/dias
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);

create index if not exists docs_collection_idx on public.docs (user_id, collection);

alter table public.docs enable row level security;

drop policy if exists "docs: dono lê"     on public.docs;
drop policy if exists "docs: dono cria"   on public.docs;
drop policy if exists "docs: dono altera" on public.docs;
drop policy if exists "docs: dono apaga"  on public.docs;

create policy "docs: dono lê"     on public.docs for select using (user_id = auth.uid());
create policy "docs: dono cria"   on public.docs for insert with check (user_id = auth.uid());
create policy "docs: dono altera" on public.docs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "docs: dono apaga"  on public.docs for delete using (user_id = auth.uid());

-- updated_at automático
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before update on public.docs for each row execute function public.touch_updated_at();
