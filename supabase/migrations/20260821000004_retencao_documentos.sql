-- Política de retenção: manual por padrão; quando houver prazo definido,
-- a exclusão permanente fica bloqueada até a data de retenção.

alter table documento
  add column retention_until timestamptz,
  add column retention_policy text not null default 'manual';

alter table documento
  add constraint documento_retention_policy_check
  check (retention_policy in ('manual', 'fixed_date'));

alter table documento
  add constraint documento_retention_date_check
  check (
    (retention_policy = 'manual' and retention_until is null)
    or (retention_policy = 'fixed_date' and retention_until is not null)
  );

create index documento_retention_until_idx
  on documento (retention_until)
  where retention_until is not null;
