"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailTemplate } from "@/lib/email";
import {
  STATUS_LABEL,
  PRIORIDADE_LABEL,
  type DemandaStatus,
  type DemandaPrioridade,
} from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const EMAIL_ADMIN = process.env.EMAIL_ADMIN;

const STATUSES: DemandaStatus[] = [
  "recebida",
  "em_andamento",
  "aguardando",
  "concluida",
  "cancelada",
];
const PRIORIDADES: DemandaPrioridade[] = ["baixa", "media", "alta", "urgente"];

export type FormState = { error?: string } | undefined;

/** Cria uma nova demanda e notifica o administrador por e-mail. */
export async function criarDemanda(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const prioridade = String(formData.get("prioridade") || "media") as DemandaPrioridade;
  const prazoRaw = String(formData.get("prazo") || "").trim();

  if (titulo.length < 3) return { error: "O título precisa ter ao menos 3 caracteres." };
  if (!PRIORIDADES.includes(prioridade)) return { error: "Prioridade inválida." };

  const { data: demanda, error } = await supabase
    .from("demandas")
    .insert({
      titulo,
      descricao,
      prioridade,
      prazo: prazoRaw || null,
      solicitante_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível salvar a demanda. Tente novamente." };

  // Notifica o administrador (não bloqueia em caso de falha de e-mail).
  if (EMAIL_ADMIN) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", user.id)
      .single();

    await sendEmail({
      to: EMAIL_ADMIN,
      subject: `Nova demanda: ${titulo}`,
      html: emailTemplate({
        titulo: "Nova demanda recebida",
        linhas: [
          `<b>${titulo}</b>`,
          `Solicitante: ${perfil?.nome || "—"}`,
          `Prioridade: ${PRIORIDADE_LABEL[prioridade]}`,
          prazoRaw ? `Prazo: ${formatarData(prazoRaw)}` : "Sem prazo definido",
          descricao ? `<br/>${descricao}` : "",
        ],
        ctaUrl: `${APP_URL}/demandas`,
        ctaLabel: "Ver no painel",
      }),
    });
  }

  revalidatePath("/demandas");
  revalidatePath("/dashboard");
  redirect("/demandas");
}

/** Atualiza o status de uma demanda (admin) e avisa o solicitante por e-mail. */
export async function atualizarStatus(demandaId: string, novoStatus: DemandaStatus) {
  if (!STATUSES.includes(novoStatus)) return { error: "Status inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: demanda, error } = await supabase
    .from("demandas")
    .update({ status: novoStatus })
    .eq("id", demandaId)
    .select("id, titulo, solicitante_id")
    .single();

  if (error || !demanda) return { error: "Não foi possível atualizar (verifique permissões)." };

  // Busca o e-mail do solicitante via cliente admin (ignora RLS, só no servidor).
  try {
    const admin = createAdminClient();
    const { data: solicitante } = await admin
      .from("profiles")
      .select("email, nome")
      .eq("id", demanda.solicitante_id)
      .single();

    if (solicitante?.email) {
      await sendEmail({
        to: solicitante.email,
        subject: `Demanda atualizada: ${demanda.titulo}`,
        html: emailTemplate({
          titulo: "Sua demanda mudou de status",
          linhas: [
            `<b>${demanda.titulo}</b>`,
            `Novo status: <b>${STATUS_LABEL[novoStatus]}</b>`,
          ],
          ctaUrl: `${APP_URL}/demandas`,
          ctaLabel: "Acompanhar",
        }),
      });
    }
  } catch (e) {
    console.error("[atualizarStatus] e-mail:", e);
  }

  revalidatePath("/demandas");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Define/remove o responsável e o prazo (admin). */
export async function atualizarDemanda(
  demandaId: string,
  patch: { responsavel_id?: string | null; prazo?: string | null }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("demandas").update(patch).eq("id", demandaId);
  if (error) return { error: "Não foi possível atualizar." };
  revalidatePath("/demandas");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Adiciona um comentário/atualização de progresso. */
export async function comentar(demandaId: string, mensagem: string) {
  const texto = mensagem.trim();
  if (!texto) return { error: "Mensagem vazia." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("demanda_comentarios")
    .insert({ demanda_id: demandaId, autor_id: user.id, mensagem: texto });

  if (error) return { error: "Não foi possível comentar." };
  revalidatePath("/demandas");
  return { ok: true };
}

/** Exclui uma demanda (admin). */
export async function excluirDemanda(demandaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("demandas").delete().eq("id", demandaId);
  if (error) return { error: "Não foi possível excluir (apenas administradores)." };
  revalidatePath("/demandas");
  revalidatePath("/dashboard");
  return { ok: true };
}

function formatarData(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
