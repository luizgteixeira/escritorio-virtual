import type { SupabaseClient } from "@supabase/supabase-js";

export type Workspace = {
  id: string;
  owner_id: string;
  nome: string;
  created_at: string;
};

export async function getOrCreateWorkspace(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string,
): Promise<Workspace> {
  const { data: existing } = await supabase
    .from("workspace")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (existing) {
    return existing as Workspace;
  }

  const { data: created, error } = await supabase
    .from("workspace")
    .insert({ owner_id: userId, nome: userEmail ?? "Meu Escritório" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return created as Workspace;
}
