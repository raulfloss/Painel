"use client";

import { createClient } from "@/lib/supabase/client";
import type { Anexo } from "@/lib/types";

export const BUCKET = "anexos";
export const TAMANHO_MAX = 15 * 1024 * 1024; // 15 MB por arquivo

/** Remove acentos/espaços do nome para um caminho seguro no Storage. */
function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.\-]+/g, "_");
}

/**
 * Envia os arquivos para o Storage e registra os metadados.
 * Lança erro com mensagem amigável em caso de falha.
 */
export async function uploadAnexos(demandaId: string, files: File[]) {
  if (!files.length) return;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente.");

  for (const file of files) {
    if (file.size > TAMANHO_MAX) {
      throw new Error(`"${file.name}" passa de 15 MB. Envie um arquivo menor.`);
    }
    const path = `${demandaId}/${Date.now()}_${nomeSeguro(file.name)}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (upErr) throw new Error(`Falha ao enviar "${file.name}": ${upErr.message}`);

    const { error: dbErr } = await supabase.from("demanda_anexos").insert({
      demanda_id: demandaId,
      nome: file.name,
      path,
      mime: file.type || null,
      tamanho: file.size,
      autor_id: user.id,
    });
    if (dbErr) {
      // Desfaz o upload para não deixar arquivo órfão.
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(`Falha ao registrar "${file.name}": ${dbErr.message}`);
    }
  }
}

/** Lista os anexos de uma demanda. */
export async function listarAnexos(demandaId: string): Promise<Anexo[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("demanda_anexos")
    .select("*")
    .eq("demanda_id", demandaId)
    .order("created_at", { ascending: true });
  return (data ?? []) as Anexo[];
}

/** Gera um link temporário (1h) para baixar/visualizar um arquivo privado. */
export async function urlAssinada(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** Exclui um anexo (arquivo + registro). */
export async function excluirAnexo(anexo: Anexo) {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([anexo.path]);
  await supabase.from("demanda_anexos").delete().eq("id", anexo.id);
}

/** Formata bytes em texto legível. */
export function formatarTamanho(bytes: number | null) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
