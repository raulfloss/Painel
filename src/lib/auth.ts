import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Retorna o perfil do usuário autenticado (servidor).
 * Redireciona para /login se não houver sessão.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Perfil ainda não criado (caso raro): desloga para evitar estado inconsistente.
    await supabase.auth.signOut();
    redirect("/login");
  }

  return profile as Profile;
}
