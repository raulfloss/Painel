import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Demanda,
  STATUS_LABEL,
  STATUS_ORDER,
  PRIORIDADE_LABEL,
  DemandaPrioridade,
} from "@/lib/types";
import { Inbox, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { StatusBarChart, PrioridadePieChart, GestorBarChart } from "./DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();

  const { data } = await supabase
    .from("demandas")
    .select(`*, solicitante:profiles!solicitante_id (id, nome)`)
    .order("created_at", { ascending: false });

  const demandas = (data ?? []) as Demanda[];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // ---- Indicadores ----
  // "Total" conta apenas as demandas ativas: concluídas e canceladas saem da conta.
  const total = demandas.filter(
    (d) => d.status !== "concluida" && d.status !== "cancelada"
  ).length;
  const emAndamento = demandas.filter((d) => d.status === "em_andamento").length;
  const concluidas = demandas.filter((d) => d.status === "concluida").length;
  const atrasadas = demandas.filter(
    (d) =>
      d.prazo &&
      new Date(d.prazo + "T00:00:00") < hoje &&
      d.status !== "concluida" &&
      d.status !== "cancelada"
  ).length;

  // ---- Dados dos gráficos ----
  const porStatus = STATUS_ORDER.map((s) => ({
    nome: STATUS_LABEL[s],
    total: demandas.filter((d) => d.status === s).length,
  }));

  const porPrioridade = (Object.keys(PRIORIDADE_LABEL) as DemandaPrioridade[])
    .map((p) => ({ nome: PRIORIDADE_LABEL[p], total: demandas.filter((d) => d.prioridade === p).length }))
    .filter((x) => x.total > 0);

  const porGestorMap = new Map<string, number>();
  for (const d of demandas) {
    const nome = d.solicitante?.nome ?? "—";
    porGestorMap.set(nome, (porGestorMap.get(nome) ?? 0) + 1);
  }
  const porGestor = [...porGestorMap.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);

  const recentes = demandas.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Olá, {profile.nome.split(" ")[0]} 👋</h1>
        <p className="text-sm text-slate-500">
          {isAdmin ? "Visão geral de todas as demandas." : "Visão geral das suas demandas."}
        </p>
      </div>

      {/* Cards de indicadores */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador titulo="Em aberto" valor={total} icon={<Inbox size={20} />} cor="text-slate-600 bg-slate-100" />
        <Indicador titulo="Em andamento" valor={emAndamento} icon={<Loader2 size={20} />} cor="text-blue-600 bg-blue-100" />
        <Indicador titulo="Concluídas" valor={concluidas} icon={<CheckCircle2 size={20} />} cor="text-green-600 bg-green-100" />
        <Indicador titulo="Atrasadas" valor={atrasadas} icon={<AlertTriangle size={20} />} cor="text-red-600 bg-red-100" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Painel titulo="Demandas por status">
          <StatusBarChart data={porStatus} />
        </Painel>
        <Painel titulo="Demandas por prioridade">
          {porPrioridade.length ? (
            <PrioridadePieChart data={porPrioridade} />
          ) : (
            <Vazio />
          )}
        </Painel>
      </div>

      {isAdmin && porGestor.length > 0 && (
        <Painel titulo="Demandas por solicitante">
          <GestorBarChart data={porGestor} />
        </Painel>
      )}

      {/* Recentes */}
      <Painel titulo="Demandas recentes">
        {recentes.length === 0 ? (
          <Vazio />
        ) : (
          <ul className="divide-y">
            {recentes.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{d.titulo}</p>
                  <p className="text-xs text-slate-500">{d.solicitante?.nome ?? "—"}</p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(d.created_at).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/demandas" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
          Ver todas →
        </Link>
      </Painel>
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  icon,
  cor,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  cor: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${cor}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-sm text-slate-500">{titulo}</p>
    </div>
  );
}

function Painel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">{titulo}</h2>
      {children}
    </div>
  );
}

function Vazio() {
  return <p className="py-10 text-center text-sm text-slate-400">Sem dados ainda.</p>;
}
