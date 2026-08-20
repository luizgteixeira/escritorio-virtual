-- Busca full-text sobre documento (título, cliente, processo, área, tags)
--
-- GENERATED ALWAYS AS ... STORED não aceita to_tsvector('portuguese', ...)
-- (a conversão do nome da config pra regconfig depende do catálogo, então o
-- Postgres não considera a expressão imutável — nem embrulhando numa função
-- própria declarada IMMUTABLE, colunas geradas continuam rejeitando). Solução
-- tradicional: manter a coluna via trigger, que não tem essa exigência.

create or replace function documento_busca_trigger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.busca := to_tsvector(
    'portuguese',
    coalesce(new.titulo, '') || ' ' ||
    coalesce(new.cliente, '') || ' ' ||
    coalesce(new.processo, '') || ' ' ||
    coalesce(new.area, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end;
$$;

alter table documento add column busca tsvector;

create trigger documento_busca_trigger
  before insert or update
  on documento
  for each row
  execute function documento_busca_trigger();

create index documento_busca_idx on documento using gin (busca);

drop function if exists documento_busca_tsvector(text);
