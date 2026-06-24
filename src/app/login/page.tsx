"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { login, signup, type AuthState } from "./actions";
import { LayoutDashboard } from "lucide-react";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Aguarde..." : label}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "cadastro">("login");
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useFormState<AuthState, FormData>(action, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <LayoutDashboard size={26} />
          </div>
          <h1 className="text-xl font-bold">Painel de Demandas</h1>
          <p className="text-sm text-slate-500">
            {mode === "login" ? "Entre para acessar suas demandas" : "Crie sua conta de gestor"}
          </p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          {mode === "cadastro" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Nome completo</label>
              <input
                name="nome"
                type="text"
                required
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-500"
                placeholder="Seu nome"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">E-mail</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-500"
              placeholder="voce@empresa.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-500"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <SubmitButton label={mode === "login" ? "Entrar" : "Cadastrar"} />
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "cadastro" : "login")}
            className="font-semibold text-brand-600 hover:underline"
          >
            {mode === "login" ? "Cadastre-se" : "Entrar"}
          </button>
        </p>
      </div>
    </main>
  );
}
