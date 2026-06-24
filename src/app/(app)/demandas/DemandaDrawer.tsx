"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Demanda,
  DemandaStatus,
  Comentario,
  Profile,
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_COLOR,
  PRIORIDADE_LABEL,
  PRIORIDADE_COLOR,
} from "@/lib/types";
import { X, Trash2, Send } from "lucide-react";
import {
  atualizarStatus,
  atualizarDemanda,
  comentar,
  excluirDemanda,
} from "./actions";

export default function DemandaDrawer({
  demanda,
  profile,
  gestores,
  onClose,
}: {
  demanda: Demanda;
  profile: Profile;
  gestores: Pick<Profile, "id" | "nome">[];
  onClose: () => void;
}) {
  const isAdmin = profile.role === "admin";
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novo, setNovo] = useState("");
  const [pending, startTransition] = useTransition();

  // Carrega comentários e escuta novos em tempo real.
  useEffect(() => {
    const supabase = createClient();
    let ativo = true;

    async function carregar() {
      const { data } = await supabase
        .from("demanda_comentarios")
        .select("*, autor:profiles!autor_id (id, nome)")
        .eq("demanda_id", demanda.id)
        .order("created_at", { ascending: true });
      if (ativo) setComentarios((data ?? []) as Comentario[]);
    }
    carregar();

    const canal = supabase
      .channel(`coment-${demanda.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "demanda_comentarios", filter: `demanda_id=eq.${demanda.id}` },
        () => carregar()
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(canal);
    };
  }, [demanda.id]);

  function mudarStatus(s: DemandaStatus) {
    startTransition(async () => {
      await atualizarStatus(demanda.id, s);
    });
  }

  function enviarComentario() {
    const texto = novo.trim();
    if (!texto) return;
    setNovo("");
    startTransition(async () => {
      await comentar(demanda.id, texto);
    });
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b p-5">
          <div className="pr-4">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDADE_COLOR[demanda.prioridade]}`}>
              {PRIORIDADE_LABEL[demanda.prioridade]}
            </span>
            <h2 className="mt-2 text-lg font-bold leading-snug">{demanda.titulo}</h2>
            <p className="mt-1 text-xs text-slate-500">
              Solicitado por {demanda.solicitante?.nome ?? "—"} em{" "}
              {new Date(demanda.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {demanda.descricao && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Descrição</p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{demanda.descricao}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Status</p>
            {isAdmin ? (
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    disabled={pending}
                    onClick={() => mudarStatus(s)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                      demanda.status === s
                        ? STATUS_COLOR[s] + " ring-2 ring-offset-1 ring-brand-400"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            ) : (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLOR[demanda.status]}`}>
                {STATUS_LABEL[demanda.status]}
              </span>
            )}
          </div>

          {/* Responsável e prazo (admin) */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Responsável</p>
                <select
                  defaultValue={demanda.responsavel_id ?? ""}
                  disabled={pending}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    startTransition(async () => {
                      await atualizarDemanda(demanda.id, { responsavel_id: value });
                    });
                  }}
                  className="w-full rounded-lg border px-2 py-1.5 text-sm"
                >
                  <option value="">Sem responsável</option>
                  {gestores.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Prazo</p>
                <input
                  type="date"
                  defaultValue={demanda.prazo ?? ""}
                  disabled={pending}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    startTransition(async () => {
                      await atualizarDemanda(demanda.id, { prazo: value });
                    });
                  }}
                  className="w-full rounded-lg border px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          )}

          {/* Comentários / progresso */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
              Atualizações ({comentarios.length})
            </p>
            <div className="space-y-3">
              {comentarios.map((c) => (
                <div key={c.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{c.autor?.nome ?? "—"}</span>
                    <span>{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{c.mensagem}</p>
                </div>
              ))}
              {comentarios.length === 0 && (
                <p className="text-sm text-slate-400">Nenhuma atualização ainda.</p>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé: novo comentário + excluir */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={novo}
              onChange={(e) => setNovo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviarComentario();
              }}
              rows={2}
              placeholder="Escreva uma atualização... (Ctrl+Enter envia)"
              className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <button
              onClick={enviarComentario}
              disabled={pending || !novo.trim()}
              className="rounded-lg bg-brand-600 p-2.5 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                if (confirm("Excluir esta demanda? Esta ação não pode ser desfeita.")) {
                  startTransition(async () => {
                    await excluirDemanda(demanda.id);
                    onClose();
                  });
                }
              }}
              className="mt-3 flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <Trash2 size={14} /> Excluir demanda
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
