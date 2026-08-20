"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
};

export async function createDocumento(input: CreateDocumentoInput) {
  const supabase = await createClient();

  const { error } = await supabase.from("documento").insert({
    id: input.id,
    workspace_id: input.workspaceId,
    categoria: input.categoria,
    titulo: input.titulo,
    cliente: input.cliente || null,
    processo: input.processo || null,
    area: input.area || null,
    tags: input.tags,
    storage_provider: "supabase",
    storage_path: input.storagePath,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/");
}
