"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | undefined;

/** Entrar com e-mail e senha. */
export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Informe e-mail e senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "E-mail ou senha inválidos." };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Criar conta (cadastro de novo gestor). */
export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!nome || !email || !password) return { error: "Preencha todos os campos." };
  if (password.length < 6) return { error: "A senha deve ter ao menos 6 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("registered")) {
      return { error: "Este e-mail já está cadastrado." };
    }
    return { error: "Não foi possível concluir o cadastro. Tente novamente." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Sair. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
