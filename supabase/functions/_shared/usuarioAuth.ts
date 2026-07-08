import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const GESTORES_SISTEMA = ["diretoria", "gestor_master"];

export async function obterCallerPerfil(
  admin: SupabaseClient,
  token: string,
) {
  const {
    data: { user: caller },
    error: authError,
  } = await admin.auth.getUser(token);
  if (authError || !caller) {
    return { erro: "Token inválido.", status: 401 as const };
  }

  const { data: callerRow, error: callerErr } = await admin
    .from("usuarios")
    .select("id, tipo")
    .eq("id", caller.id)
    .maybeSingle();

  if (callerErr || !callerRow) {
    return { erro: "Perfil do usuário não encontrado.", status: 403 as const };
  }

  return { caller, callerRow };
}

export async function obterAlvoPerfil(
  admin: SupabaseClient,
  userId: string,
) {
  const { data: alvo, error } = await admin
    .from("usuarios")
    .select("id, tipo")
    .eq("id", userId)
    .maybeSingle();

  if (error || !alvo) {
    return { erro: "Usuário alvo não encontrado.", status: 404 as const };
  }

  return { alvo };
}

export function podeEditarUsuario(
  callerId: string,
  callerTipo: string,
  alvoId: string,
  alvoTipo: string,
): boolean {
  if (callerId === alvoId) return true;
  if (!GESTORES_SISTEMA.includes(callerTipo)) return false;
  if (GESTORES_SISTEMA.includes(alvoTipo)) return false;
  return true;
}

export function extrairLoginDoEmail(email: string | undefined): string | null {
  if (!email) return null;
  const lower = email.trim().toLowerCase();
  const suffix = "@sistema.com";
  if (!lower.endsWith(suffix)) return null;
  const login = lower.slice(0, -suffix.length);
  return login || null;
}
