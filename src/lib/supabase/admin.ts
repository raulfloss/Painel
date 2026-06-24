import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a chave de serviço (service_role).
 * Ignora RLS — use SOMENTE no servidor, nunca exponha ao navegador.
 * Usado para buscar e-mails de destinatários ao enviar notificações.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
