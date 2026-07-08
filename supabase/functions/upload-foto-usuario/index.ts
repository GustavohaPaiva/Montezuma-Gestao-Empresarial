import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  obterAlvoPerfil,
  obterCallerPerfil,
  podeEditarUsuario,
} from "../_shared/usuarioAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const formData = await req.formData();
    const userId = String(formData.get("userId") ?? "").trim();
    const file = formData.get("file");

    if (!userId || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ erro: "userId e arquivo são obrigatórios." }),
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

    const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `admin_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `admins/${fileName}`;

    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from("fotos_clientes")
      .upload(filePath, fileBuffer, {
        contentType: file.type || `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({
          erro: uploadError.message || "Falha ao enviar imagem.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: publicUrlData } = admin.storage
      .from("fotos_clientes")
      .getPublicUrl(filePath);
    const fotoUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

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

    const metadata = authUser.user.user_metadata ?? {};
    const { error: updateError } = await admin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: { ...metadata, foto: fotoUrl },
      },
    );

    if (updateError) {
      return new Response(
        JSON.stringify({
          erro: updateError.message || "Falha ao vincular foto ao perfil.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ fotoUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao enviar foto.";
    return new Response(JSON.stringify({ erro: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
