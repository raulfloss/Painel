-- =====================================================================
--  PAINEL DE DEMANDAS — Schema do banco de dados (PostgreSQL / Supabase)
--  Execute este arquivo no Supabase em: SQL Editor > New query > Run
-- =====================================================================

-- ---------- Tipos (enums) ----------
do $$ begin
  create type public.user_role as enum ('admin', 'gestor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.demanda_status as enum
    ('recebida', 'em_andamento', 'aguardando', 'concluida', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.demanda_prioridade as enum ('baixa', 'media', 'alta', 'urgente');
exception when duplicate_object then null; end $$;

-- ---------- Tabela de perfis (1:1 com auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text not null default '',
  email       text not null default '',
  role        public.user_role not null default 'gestor',
  created_at  timestamptz not null default now()
);

-- ---------- Tabela de demandas ----------
create table if not exists public.demandas (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  descricao      text not null default '',
  status         public.demanda_status     not null default 'recebida',
  prioridade     public.demanda_prioridade not null default 'media',
  solicitante_id uuid not null references public.profiles (id) on delete cascade,
  responsavel_id uuid references public.profiles (id) on delete set null,
  prazo          date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_demandas_status      on public.demandas (status);
create index if not exists idx_demandas_solicitante on public.demandas (solicitante_id);
create index if not exists idx_demandas_created      on public.demandas (created_at desc);

-- ---------- Comentários / histórico de progresso ----------
create table if not exists public.demanda_comentarios (
  id         uuid primary key default gen_random_uuid(),
  demanda_id uuid not null references public.demandas (id) on delete cascade,
  autor_id   uuid not null references public.profiles (id) on delete cascade,
  mensagem   text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_comentarios_demanda on public.demanda_comentarios (demanda_id, created_at);

-- =====================================================================
--  FUNÇÕES E TRIGGERS
-- =====================================================================

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_demandas_updated_at on public.demandas;
create trigger trg_demandas_updated_at
  before update on public.demandas
  for each row execute function public.set_updated_at();

-- Cria automaticamente um perfil quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Função auxiliar: o usuário atual é admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =====================================================================
--  SEGURANÇA EM NÍVEL DE LINHA (Row Level Security)
-- =====================================================================
alter table public.profiles            enable row level security;
alter table public.demandas            enable row level security;
alter table public.demanda_comentarios enable row level security;

-- ----- profiles -----
-- Qualquer usuário autenticado pode ler nomes (para exibir quem solicitou).
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

-- Cada um edita o próprio perfil.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid());

-- ----- demandas -----
-- Admin vê todas; gestor vê as que solicitou.
drop policy if exists "demandas_select" on public.demandas;
create policy "demandas_select" on public.demandas
  for select to authenticated
  using (public.is_admin() or solicitante_id = auth.uid());

-- Qualquer autenticado cria demanda em seu próprio nome.
drop policy if exists "demandas_insert" on public.demandas;
create policy "demandas_insert" on public.demandas
  for insert to authenticated
  with check (solicitante_id = auth.uid());

-- Admin atualiza qualquer demanda; gestor atualiza as próprias.
drop policy if exists "demandas_update" on public.demandas;
create policy "demandas_update" on public.demandas
  for update to authenticated
  using (public.is_admin() or solicitante_id = auth.uid());

-- Admin pode excluir.
drop policy if exists "demandas_delete" on public.demandas;
create policy "demandas_delete" on public.demandas
  for delete to authenticated
  using (public.is_admin());

-- ----- comentários -----
drop policy if exists "comentarios_select" on public.demanda_comentarios;
create policy "comentarios_select" on public.demanda_comentarios
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.demandas d
      where d.id = demanda_id and d.solicitante_id = auth.uid()
    )
  );

drop policy if exists "comentarios_insert" on public.demanda_comentarios;
create policy "comentarios_insert" on public.demanda_comentarios
  for insert to authenticated
  with check (
    autor_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.demandas d
        where d.id = demanda_id and d.solicitante_id = auth.uid()
      )
    )
  );

-- =====================================================================
--  TEMPO REAL (Realtime)
-- =====================================================================
-- Habilita atualização em tempo real para as tabelas usadas no painel.
do $$ begin
  alter publication supabase_realtime add table public.demandas;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.demanda_comentarios;
exception when duplicate_object then null; end $$;

-- =====================================================================
--  PROMOVER VOCÊ A ADMINISTRADOR
--  Depois de criar sua conta no painel, rode a linha abaixo trocando o e-mail:
--
--    update public.profiles set role = 'admin' where email = 'adv.anadutra@gmail.com';
-- =====================================================================
