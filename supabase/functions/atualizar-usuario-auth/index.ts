import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  extrairLoginDoEmail,
  obterAlvoPerfil,
  obterCallerPerfil,
  podeEditarUsuario,
} from "../_shared/usuarioAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GESTORES_SISTEMA = ["diretoria", "gestor_master"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ erro: "Configuração do servidor incompleta." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ erro: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(supabaseUrl, serviceKey);

    const callerResult = await obterCallerPerfil(admin, token);
    if ("erro" in callerResult) {
      return new Response(JSON.stringify({ erro: callerResult.erro }), {
        status: callerResult.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const acao = String(body.acao ?? "").trim();
    const userId = String(body.userId ?? "").trim();

    if (acao === "listar_fotos") {
      if (!GESTORES_SISTEMA.includes(callerRow.tipo)) {
        return new Response(JSON.stringify({ erro: "Acesso negado." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: files, error: listError } = await admin.storage
        .from("fotos_clientes")
        .list("admins", { limit: 1000, sortBy: { column: "updated_at", order: "desc" } });

      if (listError) {
        return new Response(
          JSON.stringify({ erro: listError.message || "Erro ao listar fotos." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const fotos: Record<string, string> = {};
      const regex = /^admin_([0-9a-f-]{36})_/i;

      for (const file of files ?? []) {
        if (!file?.name || file.name === ".emptyFolderPlaceholder") continue;
        const match = file.name.match(regex);
        if (!match) continue;
        const uid = match[1];
        if (fotos[uid]) continue;
        const { data: publicUrlData } = admin.storage
          .from("fotos_clientes")
          .getPublicUrl(`admins/${file.name}`);
        fotos[uid] = publicUrlData.publicUrl;
      }

      return new Response(JSON.stringify({ fotos }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ erro: "userId é obrigatório." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const alvoResult = await obterAlvoPerfil(admin, userId);
    if ("erro" in alvoResult) {
      return new Response(JSON.stringify({ erro: alvoResult.erro }), {
        status: alvoResult.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { caller, callerRow } = callerResult;
    const { alvo } = alvoResult;

    const podeVer =
      caller.id === userId || GESTORES_SISTEMA.includes(callerRow.tipo);
    if (!podeVer) {
      return new Response(JSON.stringify({ erro: "Acesso negado." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (acao === "consultar") {
      const { data: authUser, error: getUserError } =
        await admin.auth.admin.getUserById(userId);
      if (getUserError || !authUser?.user) {
        return new Response(
          JSON.stringify({ erro: "Conta de autenticação não encontrada." }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const email = authUser.user.email ?? "";
      const login = extrairLoginDoEmail(email);
      const foto =
        (authUser.user.user_metadata?.foto as string | undefined) ?? null;

      return new Response(
        JSON.stringify({ login, email, foto }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (acao === "atualizar_credenciais") {
      if (
        !podeEditarUsuario(
          caller.id,
          callerRow.tipo,
          alvo.id,
          alvo.tipo,
        )
      ) {
        return new Response(JSON.stringify({ erro: "Acesso negado." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const senha = body.senha != null ? String(body.senha) : "";
      const loginNovo = body.login != null
        ? String(body.login).trim().toLowerCase().replace(/\s+/g, "")
        : "";

      if (!senha && !loginNovo) {
        return new Response(
          JSON.stringify({ erro: "Informe nova senha e/ou novo login." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (senha && senha.length < 6) {
        return new Response(
          JSON.stringify({ erro: "A senha deve ter pelo menos 6 caracteres." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (
        loginNovo &&
        !GESTORES_SISTEMA.includes(callerRow.tipo)
      ) {
        return new Response(
          JSON.stringify({ erro: "Apenas gestores podem alterar o login." }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const updatePayload: { password?: string; email?: string } = {};
      if (senha) updatePayload.password = senha;
      if (loginNovo) updatePayload.email = `${loginNovo}@sistema.com`;

      const { data: authUser, error: getUserError } =
        await admin.auth.admin.getUserById(userId);
      if (getUserError || !authUser?.user) {
        return new Response(
          JSON.stringify({ erro: "Conta de autenticação não encontrada." }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { error: updateError } = await admin.auth.admin.updateUserById(
        userId,
        updatePayload,
      );

      if (updateError) {
        const msg = updateError.message?.includes("already")
          ? "Já existe um usuário com este login."
          : updateError.message || "Erro ao atualizar credenciais.";
        return new Response(JSON.stringify({ erro: msg }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const emailFinal = loginNovo
        ? `${loginNovo}@sistema.com`
        : authUser.user.email ?? "";
      const loginFinal = extrairLoginDoEmail(emailFinal);

      return new Response(
        JSON.stringify({ login: loginFinal, email: emailFinal }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ erro: "Ação inválida." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao processar solicitação.";
    return new Response(JSON.stringify({ erro: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
