"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Paperclip, X, FileText } from "lucide-react";
import { criarDemanda } from "../actions";
import { uploadAnexos, formatarTamanho, TAMANHO_MAX } from "@/lib/anexos";
import { PRIORIDADE_LABEL } from "@/lib/types";

export default function NovaDemandaPage() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function adicionarArquivos(lista: FileList | null) {
    if (!lista) return;
    const novos = Array.from(lista);
    const grande = novos.find((f) => f.size > TAMANHO_MAX);
    if (grande) {
      setErro(`"${grande.name}" passa de 15 MB. Escolha um arquivo menor.`);
      return;
    }
    setErro(null);
    setArquivos((atual) => [...atual, ...novos]);
  }

  function removerArquivo(i: number) {
    setArquivos((atual) => atual.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await criarDemanda(formData);
      if (res.error || !res.id) {
        setErro(res.error || "Não foi possível criar a demanda.");
        setEnviando(false);
        return;
      }
      // Envia os anexos (se houver) para a demanda recém-criada.
      if (arquivos.length) {
        await uploadAnexos(res.id, arquivos);
      }
      router.push("/demandas");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar anexos.");
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/demandas" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Nova demanda</h1>
      <p className="mb-6 text-sm text-slate-500">
        Descreva o que precisa e anexe documentos ou fotos, se quiser.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
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

        {/* Anexos */}
        <div>
          <label className="mb-1 block text-sm font-medium">Anexos (opcional)</label>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-4 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600"
          >
            <Paperclip size={18} />
            Clique para anexar documentos, fotos, PDFs...
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              adicionarArquivos(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="mt-1 text-xs text-slate-400">Até 15 MB por arquivo.</p>

          {arquivos.length > 0 && (
            <ul className="mt-3 space-y-2">
              {arquivos.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText size={16} className="shrink-0 text-slate-400" />
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 text-xs text-slate-400">{formatarTamanho(f.size)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removerArquivo(i)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

        <div className="flex items-center justify-end gap-3">
          <Link href="/demandas" className="rounded-lg border px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Enviar demanda"}
          </button>
        </div>
      </form>
    </div>
  );
}
