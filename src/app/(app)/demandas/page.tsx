import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Demanda, Profile } from "@/lib/types";
import DemandasBoard from "./DemandasBoard";

export const dynamic = "force-dynamic";

export default async function DemandasPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS já garante que o gestor só recebe as próprias demandas.
  const { data: demandas } = await supabase
    .from("demandas")
    .select(
      `*,
       solicitante:profiles!solicitante_id (id, nome, email),
       responsavel:profiles!responsavel_id (id, nome, email)`
    )
    .order("created_at", { ascending: false });

  // Lista de gestores (para o admin atribuir responsável).
  let gestores: Pick<Profile, "id" | "nome">[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase.from("profiles").select("id, nome").order("nome");
    gestores = data ?? [];
  }

  return (
    <DemandasBoard
      initialDemandas={(demandas ?? []) as Demanda[]}
      profile={profile}
      gestores={gestores}
    />
  );
}
