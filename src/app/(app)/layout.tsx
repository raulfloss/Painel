import Link from "next/link";
import { LayoutDashboard, ListTodo, PlusCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-brand-700">
              <LayoutDashboard size={22} />
              <span className="hidden sm:inline">Painel de Demandas</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/demandas"
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
              >
                <ListTodo size={16} /> Demandas
              </Link>
              <Link
                href="/demandas/nova"
                className="flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 font-medium text-brand-700 hover:bg-brand-100"
              >
                <PlusCircle size={16} /> Nova
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{profile.nome}</p>
              <p className="text-xs text-slate-500">{isAdmin ? "Administrador" : "Gestor"}</p>
            </div>
            <form action={logout}>
              <button className="rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
