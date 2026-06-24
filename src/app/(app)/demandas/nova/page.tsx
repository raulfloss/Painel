"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { criarDemanda, type FormState } from "../actions";
import { PRIORIDADE_LABEL } from "@/lib/types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Enviando..." : "Enviar demanda"}
    </button>
  );
}

export default function NovaDemandaPage() {
  const [state, formAction] = useFormState<FormState, FormData>(criarDemanda, undefined);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/demandas" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Nova demanda</h1>
      <p className="mb-6 text-sm text-slate-500">
        Descreva o que precisa. O responsável será notificado por e-mail.
      </p>

      <form action={formAction} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Título *</label>
          <input
            name="titulo"
            type="text"
            required
            minLength={3}
            placeholder="Ex.: Criar relatório mensal de faturamento"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descrição</label>
          <textarea
            name="descricao"
            rows={5}
            placeholder="Detalhe o que precisa ser feito, contexto, links, etc."
            className="w-full resize-y rounded-lg border px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Prioridade</label>
            <select
              name="prioridade"
              defaultValue="media"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-500"
            >
              {Object.entries(PRIORIDADE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Prazo desejado</label>
            <input
              name="prazo"
              type="date"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link href="/demandas" className="rounded-lg border px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
            Cancelar
          </Link>
          <Submit />
        </div>
      </form>
    </div>
  );
}
