-- Bucket "documentos" (Supabase Storage) + RLS por workspace
-- Convenção de path: {workspace_id}/{documento_id}/{filename}

insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 52428800) -- 50MB, privado
on conflict (id) do nothing;

create policy "documentos: select via own workspace"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from workspace
      where workspace.id::text = (storage.foldername(name))[1]
        and workspace.owner_id = auth.uid()
    )
  );

create policy "documentos: insert via own workspace"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from workspace
      where workspace.id::text = (storage.foldername(name))[1]
        and workspace.owner_id = auth.uid()
    )
  );

create policy "documentos: update via own workspace"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from workspace
      where workspace.id::text = (storage.foldername(name))[1]
        and workspace.owner_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from workspace
      where workspace.id::text = (storage.foldername(name))[1]
        and workspace.owner_id = auth.uid()
    )
  );

create policy "documentos: delete via own workspace"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from workspace
      where workspace.id::text = (storage.foldername(name))[1]
        and workspace.owner_id = auth.uid()
    )
  );
