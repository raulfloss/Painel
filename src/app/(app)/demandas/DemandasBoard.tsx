"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Demanda,
  DemandaStatus,
  Profile,
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_COLOR,
  PRIORIDADE_LABEL,
  PRIORIDADE_COLOR,
} from "@/lib/types";
import { LayoutGrid, List, Search, Clock, AlertTriangle } from "lucide-react";
import DemandaDrawer from "./DemandaDrawer";

type View = "kanban" | "lista";

export default function DemandasBoard({
  initialDemandas,
  profile,
  gestores,
}: {
  initialDemandas: Demanda[];
  profile: Profile;
  gestores: Pick<Profile, "id" | "nome">[];
}) {
  const router = useRouter();
  const isAdmin = profile.role === "admin";

  const [view, setView] = useState<View>("kanban");
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState<DemandaStatus | "todos">("todos");
  const [fPrioridade, setFPrioridade] = useState<string>("todas");
  const [aberta, setAberta] = useState<Demanda | null>(null);

  // ---- Tempo real: ao detectar mudança no banco, re-busca os dados do servidor.
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel("demandas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "demandas" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [router]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return initialDemandas.filter((d) => {
      if (fStatus !== "todos" && d.status !== fStatus) return false;
      if (fPrioridade !== "todas" && d.prioridade !== fPrioridade) return false;
      if (termo && !`${d.titulo} ${d.descricao}`.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [initialDemandas, busca, fStatus, fPrioridade]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Demandas</h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? "Todas as demandas da equipe" : "Demandas que você enviou"} •{" "}
            {filtradas.length} de {initialDemandas.length}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
              view === "kanban" ? "bg-brand-600 text-white" : "text-slate-600"
            }`}
          >
            <LayoutGrid size={16} /> Kanban
          </button>
          <button
            onClick={() => setView("lista")}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
              view === "lista" ? "bg-brand-600 text-white" : "text-slate-600"
            }`}
          >
            <List size={16} /> Lista
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou descrição..."
            className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value as DemandaStatus | "todos")}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="todos">Todos os status</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={fPrioridade}
          onChange={(e) => setFPrioridade(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="todas">Todas prioridades</option>
          {Object.entries(PRIORIDADE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white py-16 text-center text-slate-500">
          Nenhuma demanda encontrada.
        </div>
      ) : view === "kanban" ? (
        <KanbanView demandas={filtradas} onOpen={setAberta} />
      ) : (
        <ListaView demandas={filtradas} onOpen={setAberta} />
      )}

      {aberta && (
        <DemandaDrawer
          demanda={aberta}
          profile={profile}
          gestores={gestores}
          onClose={() => setAberta(null)}
        />
      )}
    </div>
  );
}

function KanbanView({
  demandas,
  onOpen,
}: {
  demandas: Demanda[];
  onOpen: (d: Demanda) => void;
}) {
  return (
    <div className="kanban-scroll grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-2 xl:grid-cols-5">
      {STATUS_ORDER.map((status) => {
        const itens = demandas.filter((d) => d.status === status);
        return (
          <div key={status} className="flex min-w-[240px] flex-col rounded-xl bg-slate-100/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[status]}`}>
                {STATUS_LABEL[status]}
              </span>
              <span className="text-xs font-medium text-slate-500">{itens.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {itens.map((d) => (
                <Card key={d.id} demanda={d} onOpen={onOpen} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListaView({
  demandas,
  onOpen,
}: {
  demandas: Demanda[];
  onOpen: (d: Demanda) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Demanda</th>
            <th className="px-4 py-3 font-medium">Solicitante</th>
            <th className="px-4 py-3 font-medium">Prioridade</th>
            <th className="px-4 py-3 font-medium">Prazo</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {demandas.map((d) => (
            <tr
              key={d.id}
              onClick={() => onOpen(d)}
              className="cursor-pointer border-t hover:bg-slate-50"
            >
              <td className="px-4 py-3 font-medium">{d.titulo}</td>
              <td className="px-4 py-3 text-slate-600">{d.solicitante?.nome ?? "—"}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDADE_COLOR[d.prioridade]}`}>
                  {PRIORIDADE_LABEL[d.prioridade]}
                </span>
              </td>
              <td className="px-4 py-3">
                <PrazoBadge prazo={d.prazo} status={d.status} />
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[d.status]}`}>
                  {STATUS_LABEL[d.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Card({ demanda, onOpen }: { demanda: Demanda; onOpen: (d: Demanda) => void }) {
  return (
    <button
      onClick={() => onOpen(demanda)}
      className="w-full rounded-lg border bg-white p-3 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug">{demanda.titulo}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORIDADE_COLOR[demanda.prioridade]}`}>
          {PRIORIDADE_LABEL[demanda.prioridade]}
        </span>
      </div>
      {demanda.descricao && (
        <p className="mb-2 line-clamp-2 text-xs text-slate-500">{demanda.descricao}</p>
      )}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{demanda.solicitante?.nome ?? "—"}</span>
        <PrazoBadge prazo={demanda.prazo} status={demanda.status} />
      </div>
    </button>
  );
}

export function PrazoBadge({ prazo, status }: { prazo: string | null; status: DemandaStatus }) {
  if (!prazo) return <span className="text-slate-400">—</span>;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(prazo + "T00:00:00");
  const atrasada = data < hoje && status !== "concluida" && status !== "cancelada";
  const fmt = `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;

  return (
    <span className={`inline-flex items-center gap-1 ${atrasada ? "font-semibold text-red-600" : "text-slate-500"}`}>
      {atrasada ? <AlertTriangle size={13} /> : <Clock size={13} />}
      {fmt}
    </span>
  );
}
