import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TIPOS_PERMITIDOS = [
  "gestor_master",
  "diretoria",
  "secretaria",
  "suporte_ti",
  "encarregado",
  "funcionario",
  "dono",
  "admin",
];

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

    const {
      data: { user: caller },
      error: authError,
    } = await admin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ erro: "Token inválido." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerRow, error: callerErr } = await admin
      .from("usuarios")
      .select("tipo")
      .eq("id", caller.id)
      .maybeSingle();
    if (callerErr || !callerRow) {
      return new Response(
        JSON.stringify({ erro: "Perfil do usuário não encontrado." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!["diretoria", "gestor_master"].includes(callerRow.tipo)) {
      return new Response(JSON.stringify({ erro: "Acesso negado." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const login = String(body.login ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    const senha = String(body.senha ?? "");
    const nome = String(body.nome ?? "").trim();
    const tipo = String(body.tipo ?? "").trim();
    const escritorio_id = body.escritorio_id || null;
    const escritorio = body.escritorio || null;
    const subclasses = Array.isArray(body.subclasses) ? body.subclasses : [];

    if (!login || !senha || !nome || !tipo) {
      return new Response(
        JSON.stringify({ erro: "Login, senha, nome e tipo são obrigatórios." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ erro: "A senha deve ter pelo menos 6 caracteres." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!TIPOS_PERMITIDOS.includes(tipo)) {
      return new Response(JSON.stringify({ erro: "Tipo de usuário inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = `${login}@sistema.com`;

    const { data: authData, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome },
      });

    if (createError || !authData.user) {
      const msg =
        createError?.message?.includes("already")
          ? "Já existe um usuário com este login."
          : createError?.message || "Erro ao criar conta.";
      return new Response(JSON.stringify({ erro: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: usuario, error: insertError } = await admin
      .from("usuarios")
      .insert({
        id: authData.user.id,
        nome,
        tipo,
        escritorio_id,
        escritorio,
        subclasses,
      })
      .select(
        "id, nome, tipo, escritorio_id, escritorio, subclasses, assinatura_url",
      )
      .single();

    if (insertError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({
          erro: insertError.message || "Erro ao registrar perfil.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ usuario, login }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar usuário.";
    return new Response(JSON.stringify({ erro: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
