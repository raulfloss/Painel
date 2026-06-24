-- =====================================================================
--  ANEXOS — Armazenamento de arquivos das demandas (Supabase Storage)
--  Execute no Supabase em: SQL Editor > New query > Run
--  (rode DEPOIS do schema.sql)
-- =====================================================================

-- ---------- Bucket privado para os arquivos ----------
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false)
on conflict (id) do nothing;

-- ---------- Tabela com os metadados de cada anexo ----------
create table if not exists public.demanda_anexos (
  id          uuid primary key default gen_random_uuid(),
  demanda_id  uuid not null references public.demandas (id) on delete cascade,
  nome        text not null,                 -- nome original do arquivo
  path        text not null,                 -- caminho dentro do bucket
  mime        text,                          -- tipo (image/png, application/pdf...)
  tamanho     bigint,                        -- em bytes
  autor_id    uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists idx_anexos_demanda on public.demanda_anexos (demanda_id, created_at);

alter table public.demanda_anexos enable row level security;

-- Admin vê todos; gestor vê os anexos das próprias demandas.
drop policy if exists "anexos_select" on public.demanda_anexos;
create policy "anexos_select" on public.demanda_anexos
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.demandas d where d.id = demanda_id and d.solicitante_id = auth.uid())
  );

drop policy if exists "anexos_insert" on public.demanda_anexos;
create policy "anexos_insert" on public.demanda_anexos
  for insert to authenticated with check (
    autor_id = auth.uid()
    and (
      public.is_admin()
      or exists (select 1 from public.demandas d where d.id = demanda_id and d.solicitante_id = auth.uid())
    )
  );

drop policy if exists "anexos_delete" on public.demanda_anexos;
create policy "anexos_delete" on public.demanda_anexos
  for delete to authenticated using (
    public.is_admin()
    or exists (select 1 from public.demandas d where d.id = demanda_id and d.solicitante_id = auth.uid())
  );

-- =====================================================================
--  REGRAS DE ACESSO AOS ARQUIVOS (storage.objects)
--  Convenção de caminho: "<demanda_id>/<arquivo>"
--  Só quem é dono da demanda (ou admin) pode enviar/ler/excluir.
-- =====================================================================
drop policy if exists "anexos_obj_select" on storage.objects;
create policy "anexos_obj_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'anexos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.demandas d
        where d.id = ((storage.foldername(name))[1])::uuid and d.solicitante_id = auth.uid()
      )
    )
  );

drop policy if exists "anexos_obj_insert" on storage.objects;
create policy "anexos_obj_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'anexos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.demandas d
        where d.id = ((storage.foldername(name))[1])::uuid and d.solicitante_id = auth.uid()
      )
    )
  );

drop policy if exists "anexos_obj_delete" on storage.objects;
create policy "anexos_obj_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'anexos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.demandas d
        where d.id = ((storage.foldername(name))[1])::uuid and d.solicitante_id = auth.uid()
      )
    )
  );
