'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type CreateDocumentoInput = {
  id: string;
  workspaceId: string;
  categoria: string;
  titulo: string;
  cliente?: string;
  processo?: string;
  area?: string;
  tags: string[];
  storagePath: string;
  isModeloPadrao?: boolean;
  retentionUntil?: string;
};

export async function createDocumento(input: CreateDocumentoInput) {
  const supabase = await createClient();

  const { error } = await supabase.from('documento').insert({
    id: input.id,
    workspace_id: input.workspaceId,
    categoria: input.categoria,
    titulo: input.titulo,
    cliente: input.cliente || null,
    processo: input.processo || null,
    area: input.area || null,
    tags: input.tags,
    is_modelo_padrao:
      input.categoria === 'oficios' && input.isModeloPadrao === true,
    retention_until: input.retentionUntil || null,
    retention_policy: input.retentionUntil ? 'fixed_date' : 'manual',
    storage_provider: 'supabase',
    storage_path: input.storagePath,
  });

  if (error) {
    throw error;
  }

  revalidatePath('/');
}

export type CreateOficioFromModeloInput = {
  workspaceId: string;
  titulo: string;
  cliente?: string;
  processo?: string;
  area?: string;
  tags?: string[];
  retentionUntil?: string;
};

export async function createOficioFromModelo(
  input: CreateOficioFromModeloInput
) {
  const titulo = input.titulo.trim();
  if (!titulo) {
    throw new Error('Título é obrigatório.');
  }

  const supabase = await createClient();
  const { data: modelo, error: modeloError } = await supabase
    .from('documento')
    .select('storage_path')
    .eq('workspace_id', input.workspaceId)
    .eq('categoria', 'oficios')
    .eq('is_modelo_padrao', true)
    .maybeSingle();

  if (modeloError) {
    throw modeloError;
  }
  if (!modelo) {
    throw new Error('Nenhum modelo padrão de Ofícios foi cadastrado.');
  }

  const documentoId = crypto.randomUUID();
  const arquivoModelo =
    modelo.storage_path.split('/').pop() || 'oficio-padrao.md';
  const storagePath = `${input.workspaceId}/${documentoId}/${arquivoModelo}`;
  const { error: copyError } = await supabase.storage
    .from('documentos')
    .copy(modelo.storage_path, storagePath);

  if (copyError) {
    throw copyError;
  }

  const { error: documentoError } = await supabase.from('documento').insert({
    id: documentoId,
    workspace_id: input.workspaceId,
    categoria: 'oficios',
    titulo,
    cliente: input.cliente?.trim() || null,
    processo: input.processo?.trim() || null,
    area: input.area?.trim() || null,
    tags: input.tags ?? [],
    is_modelo_padrao: false,
    retention_until: input.retentionUntil || null,
    retention_policy: input.retentionUntil ? 'fixed_date' : 'manual',
    storage_provider: 'supabase',
    storage_path: storagePath,
  });

  if (documentoError) {
    await supabase.storage.from('documentos').remove([storagePath]);
    throw documentoError;
  }

  const { error: versaoError } = await supabase
    .from('documento_versao')
    .insert({
      documento_id: documentoId,
      numero: 1,
      storage_provider: 'supabase',
      storage_path: storagePath,
    });

  if (versaoError) {
    await supabase.from('documento').delete().eq('id', documentoId);
    await supabase.storage.from('documentos').remove([storagePath]);
    throw versaoError;
  }

  revalidatePath('/');
  return { documentoId };
}

export async function deleteDocumento(
  documentoId: string,
  workspaceId: string
) {
  const supabase = await createClient();
  const { data: documento, error: documentoError } = await supabase
    .from('documento')
    .select('id, storage_path, retention_until')
    .eq('id', documentoId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (documentoError) {
    throw documentoError;
  }
  if (!documento) {
    throw new Error('Documento não encontrado.');
  }
  if (
    documento.retention_until &&
    new Date(documento.retention_until).getTime() > Date.now()
  ) {
    throw new Error(
      `Este documento está retido até ${new Date(documento.retention_until).toLocaleDateString('pt-BR')}.`
    );
  }

  const { data: versoes, error: versoesError } = await supabase
    .from('documento_versao')
    .select('storage_path')
    .eq('documento_id', documento.id);

  if (versoesError) {
    throw versoesError;
  }

  const paths = Array.from(
    new Set([
      documento.storage_path,
      ...(versoes ?? []).map((versao) => versao.storage_path),
    ])
  );
  const { error: storageError } = await supabase.storage
    .from('documentos')
    .remove(paths);

  if (storageError) {
    throw storageError;
  }

  const { error: deleteError } = await supabase
    .from('documento')
    .delete()
    .eq('id', documento.id)
    .eq('workspace_id', workspaceId);

  if (deleteError) {
    throw deleteError;
  }

  revalidatePath('/');
}
