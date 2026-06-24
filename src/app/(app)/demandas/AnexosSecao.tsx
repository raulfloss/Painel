"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, FileText, Download, Trash2, Loader2 } from "lucide-react";
import type { Anexo } from "@/lib/types";
import {
  listarAnexos,
  uploadAnexos,
  urlAssinada,
  excluirAnexo,
  formatarTamanho,
  TAMANHO_MAX,
} from "@/lib/anexos";

export default function AnexosSecao({ demandaId }: { demandaId: string }) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function recarregar() {
    setAnexos(await listarAnexos(demandaId));
    setCarregando(false);
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandaId]);

  async function enviar(files: FileList | null) {
    if (!files || !files.length) return;
    const grande = Array.from(files).find((f) => f.size > TAMANHO_MAX);
    if (grande) {
      setErro(`"${grande.name}" passa de 15 MB.`);
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await uploadAnexos(demandaId, Array.from(files));
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  async function baixar(anexo: Anexo) {
    const url = await urlAssinada(anexo.path);
    if (url) window.open(url, "_blank");
  }

  async function remover(anexo: Anexo) {
    if (!confirm(`Excluir "${anexo.nome}"?`)) return;
    await excluirAnexo(anexo);
    await recarregar();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-slate-400">
          Anexos ({anexos.length})
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
        >
          {enviando ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
          Anexar
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            enviar(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {erro && <p className="mb-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : anexos.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum anexo.</p>
      ) : (
        <ul className="space-y-2">
          {anexos.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <button
                onClick={() => baixar(a)}
                className="flex min-w-0 items-center gap-2 text-left text-sm text-slate-700 hover:text-brand-600"
              >
                <FileText size={16} className="shrink-0 text-slate-400" />
                <span className="truncate">{a.nome}</span>
                <span className="shrink-0 text-xs text-slate-400">{formatarTamanho(a.tamanho)}</span>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => baixar(a)}
                  title="Baixar"
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <Download size={15} />
                </button>
                <button
                  onClick={() => remover(a)}
                  title="Excluir"
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
