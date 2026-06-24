"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CORES = ["#94a3b8", "#3b82f6", "#f59e0b", "#22c55e", "#ef4444"];

export function StatusBarChart({ data }: { data: { nome: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="nome" fontSize={12} tickLine={false} />
        <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PrioridadePieChart({ data }: { data: { nome: string; total: number }[] }) {
  const cores = ["#94a3b8", "#0ea5e9", "#f97316", "#ef4444"];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="nome" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={cores[i % cores.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GestorBarChart({ data }: { data: { nome: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="nome" width={120} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="total" fill="#2563eb" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
