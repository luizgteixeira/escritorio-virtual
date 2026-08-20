-- Escritório Virtual — schema inicial
-- Modelo: workspace -> documento (com categoria fixa) -> versao
-- Ver ADR-001 no cofre Obsidian pra contexto completo das decisões.

create extension if not exists "pgcrypto";

-- As 6 categorias validadas com a cliente (README.md)
create type categoria as enum (
  'peticoes',
  'modelos_contrato',
  'decisoes_judiciais',
  'oficios',
  'documentos_clientes',
  'geoespacial_grandes'
);

-- Dois provedores de storage: Supabase Storage (documentos) e Cloudflare R2 (geoespacial/grandes)
create type storage_provider as enum ('supabase', 'r2');

create table workspace (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

create table documento (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace (id) on delete cascade,
  categoria categoria not null,
  titulo text not null,
  cliente text,
  processo text,
  area text,
  tags text[] not null default '{}',
  -- só relevante para categoria = 'oficios': marca o modelo padrão da categoria
  is_modelo_padrao boolean not null default false,
  storage_provider storage_provider not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Histórico de versões — usado pelos modelos que evoluem (ex: Ofício)
create table documento_versao (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references documento (id) on delete cascade,
  numero integer not null,
  storage_provider storage_provider not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (documento_id, numero)
);

create index documento_workspace_id_idx on documento (workspace_id);
create index documento_categoria_idx on documento (workspace_id, categoria);
create index documento_versao_documento_id_idx on documento_versao (documento_id);

-- Só um "modelo padrão" por categoria de ofícios, por workspace
create unique index documento_oficio_modelo_padrao_uidx
  on documento (workspace_id)
  where categoria = 'oficios' and is_modelo_padrao;

alter table workspace enable row level security;
alter table documento enable row level security;
alter table documento_versao enable row level security;

-- RLS: isolado por workspace_id desde o dia 1 (mesmo com um único usuário hoje),
-- pra permitir abrir pra outros escritórios depois sem reescrever nada (ADR-001).

create policy "workspace: owner has full access"
  on workspace for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "documento: access via own workspace"
  on documento for all
  using (
    exists (
      select 1 from workspace
      where workspace.id = documento.workspace_id
        and workspace.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workspace
      where workspace.id = documento.workspace_id
        and workspace.owner_id = auth.uid()
    )
  );

create policy "documento_versao: access via own workspace"
  on documento_versao for all
  using (
    exists (
      select 1 from documento
      join workspace on workspace.id = documento.workspace_id
      where documento.id = documento_versao.documento_id
        and workspace.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from documento
      join workspace on workspace.id = documento.workspace_id
      where documento.id = documento_versao.documento_id
        and workspace.owner_id = auth.uid()
    )
  );
