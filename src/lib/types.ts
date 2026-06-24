export type UserRole = "admin" | "gestor";

export type DemandaStatus =
  | "recebida"
  | "em_andamento"
  | "aguardando"
  | "concluida"
  | "cancelada";

export type DemandaPrioridade = "baixa" | "media" | "alta" | "urgente";

export interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  status: DemandaStatus;
  prioridade: DemandaPrioridade;
  solicitante_id: string;
  responsavel_id: string | null;
  prazo: string | null;
  created_at: string;
  updated_at: string;
  // Relações carregadas via join
  solicitante?: Pick<Profile, "id" | "nome" | "email"> | null;
  responsavel?: Pick<Profile, "id" | "nome" | "email"> | null;
}

export interface Anexo {
  id: string;
  demanda_id: string;
  nome: string;
  path: string;
  mime: string | null;
  tamanho: number | null;
  autor_id: string;
  created_at: string;
}

export interface Comentario {
  id: string;
  demanda_id: string;
  autor_id: string;
  mensagem: string;
  created_at: string;
  autor?: Pick<Profile, "id" | "nome"> | null;
}

// ---- Rótulos e cores para a interface ----
export const STATUS_LABEL: Record<DemandaStatus, string> = {
  recebida: "Recebida",
  em_andamento: "Em andamento",
  aguardando: "Aguardando",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const STATUS_ORDER: DemandaStatus[] = [
  "recebida",
  "em_andamento",
  "aguardando",
  "concluida",
  "cancelada",
];

export const STATUS_COLOR: Record<DemandaStatus, string> = {
  recebida: "bg-slate-100 text-slate-700 border-slate-300",
  em_andamento: "bg-blue-100 text-blue-700 border-blue-300",
  aguardando: "bg-amber-100 text-amber-700 border-amber-300",
  concluida: "bg-green-100 text-green-700 border-green-300",
  cancelada: "bg-red-100 text-red-700 border-red-300",
};

export const PRIORIDADE_LABEL: Record<DemandaPrioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORIDADE_COLOR: Record<DemandaPrioridade, string> = {
  baixa: "bg-slate-100 text-slate-600",
  media: "bg-sky-100 text-sky-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};
