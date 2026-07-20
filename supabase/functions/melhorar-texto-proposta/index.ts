import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-2.5-flash";

function montarPrompt(
  texto: string,
  maxLinhas: number,
  contexto: string = "proposta",
) {
  if (contexto === "relatorio_obra") {
    return `Você é corretor ortográfico de relatórios semanais de obras de construção civil no Brasil.

O texto abaixo está em HTML. Corrija APENAS ortografia, gramática e pontuação do conteúdo textual.
NÃO resuma, NÃO reescreva o sentido, NÃO reorganize parágrafos e NÃO remova informações.

Formatação HTML:
- Preserve todas as tags existentes (p, strong, b, em, ul, ol, li, h2, h3, br, etc.).
- Você PODE usar negrito, listas ou títulos se isso melhorar a clareza, sem apagar formatação já presente.
- Não envolva a resposta em markdown, code fences ou aspas.
- Retorne APENAS o HTML corrigido.

Texto original (HTML):
"""
${texto}
"""`;
  }

  if (contexto === "relatorio_financeiro") {
    return `Você é redator de relatórios financeiros semanais para a diretoria de uma empresa de construção civil no Brasil.

Reescreva o texto abaixo em português brasileiro claro, objetivo e profissional.
Corrija gramática, ortografia e pontuação. Melhore a fluidez sem mudar o sentido nem inventar informações.
Use tom adequado a observações de acompanhamento financeiro (direto, preciso e informativo).

Regras obrigatórias:
- Máximo ${maxLinhas} linhas (quebras de linha só entre frases completas).
- Cada linha deve ser uma frase completa terminada em . ! ou ?
- A última linha DEVE fechar o texto com pontuação final — nunca pare no meio de palavra ou frase.
- Se o conteúdo for longo, resuma reescrevendo de forma mais concisa; não truncar nem cortar.

Não use markdown, títulos, bullets, aspas envolvendo o texto inteiro nem explicações.
Retorne APENAS o texto final reescrito.

Texto original:
"""
${texto}
"""`;
  }

  if (contexto === "ordem_servico") {
    return `Você é redator de ordens de serviço de um escritório de arquitetura no Brasil.

Reescreva o texto abaixo em português brasileiro formal, claro e profissional.
Corrija gramática, ortografia e pontuação. Melhore a fluidez sem mudar o sentido nem inventar informações.
Use tom adequado a contrato comercial / ordem de serviço (objetivo, preciso e cordial).

Regras obrigatórias:
- Máximo ${maxLinhas} linhas (quebras de linha só entre frases completas).
- Cada linha deve ser uma frase completa terminada em . ! ou ?
- A última linha DEVE fechar o texto com pontuação final — nunca pare no meio de palavra ou frase.
- Se o conteúdo for longo, resuma reescrevendo de forma mais concisa; não truncar nem cortar.

Não use markdown, títulos, bullets, aspas envolvendo o texto inteiro nem explicações.
Retorne APENAS o texto final reescrito.

Texto original:
"""
${texto}
"""`;
  }

  return `Você é redator de propostas comerciais de um escritório de arquitetura no Brasil.

Reescreva o texto abaixo em português brasileiro formal, claro e profissional.
Corrija gramática, ortografia e pontuação. Melhore a fluidez sem mudar o sentido nem inventar informações.
Use tom adequado a proposta comercial (objetivo e cordial).

Regras obrigatórias:
- Máximo ${maxLinhas} linhas (quebras de linha só entre frases completas).
- Cada linha deve ser uma frase completa terminada em . ! ou ?
- A última linha DEVE fechar o texto com pontuação final — nunca pare no meio de palavra ou frase.
- Se o conteúdo for longo, resuma reescrevendo de forma mais concisa; não truncar nem cortar.

Não use markdown, títulos, bullets, aspas envolvendo o texto inteiro nem explicações.
Retorne APENAS o texto final reescrito.

Texto original:
"""
${texto}
"""`;
}

function montarPromptAjuste(
  texto: string,
  maxLinhas: number,
  contexto: string = "proposta",
) {
  const papel =
    contexto === "relatorio_financeiro"
      ? "observações de relatórios financeiros para a diretoria"
      : contexto === "ordem_servico"
        ? "ordens de serviço de arquitetura"
        : "propostas comerciais de arquitetura";

  return `Você é redator de ${papel} no Brasil.

Ajuste o texto abaixo para caber em no máximo ${maxLinhas} linhas.
Mantenha tom formal e todas as informações essenciais.
Cada linha = frase completa (. ! ?). A última linha deve encerrar o texto com ponto final.
Nunca interrompa palavras ou frases no meio — se precisar encurtar, resuma com outras palavras.

Retorne APENAS o texto ajustado.

Texto:
"""
${texto}
"""`;
}

function linhaTerminaFrase(linha: string) {
  const t = String(linha ?? "").trim();
  if (!t) return true;
  return /[.!?…]["')\]]*$/.test(t);
}

function contarLinhas(texto: string) {
  const t = String(texto ?? "").replace(/\r\n/g, "\n").trim();
  if (!t) return 0;
  return t.split("\n").length;
}

function textoTerminaCompleto(texto: string) {
  const linhas = String(texto ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!linhas.length) return true;
  return linhaTerminaFrase(linhas[linhas.length - 1]);
}

function removerFinalIncompleto(texto: string) {
  const linhas = String(texto ?? "").replace(/\r\n/g, "\n").split("\n");
  while (linhas.length > 0 && !linhaTerminaFrase(linhas[linhas.length - 1])) {
    linhas.pop();
  }
  return linhas.join("\n").trim();
}

function precisaAjuste(texto: string, maxLinhas: number) {
  const t = String(texto ?? "").trim();
  if (!t) return false;
  return contarLinhas(t) > maxLinhas || !textoTerminaCompleto(t);
}

function limparTextoGemini(raw: string) {
  return String(raw ?? "")
    .replace(/^```(?:html|HTML)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

async function gerarComGemini(
  apiKey: string,
  prompt: string,
  maxOutputTokens = 2048,
) {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.2,
      maxOutputTokens,
    },
  });
  const raw = response?.text;
  if (!raw?.trim()) throw new Error("Gemini não retornou texto.");
  return limparTextoGemini(raw);
}

async function finalizarSugestao(
  apiKey: string,
  textoBruto: string,
  maxLinhas: number,
  contexto: string = "proposta",
) {
  let texto = limparTextoGemini(textoBruto);

  if (contexto === "relatorio_obra") {
    return texto;
  }

  if (precisaAjuste(texto, maxLinhas)) {
    texto = await gerarComGemini(
      apiKey,
      montarPromptAjuste(texto, maxLinhas, contexto),
    );
  }

  texto = removerFinalIncompleto(texto);

  if (contarLinhas(texto) > maxLinhas) {
    texto = removerFinalIncompleto(
      await gerarComGemini(
        apiKey,
        montarPromptAjuste(texto, maxLinhas, contexto),
      ),
    );
  }

  return texto;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { texto, maxLinhas = 10, contexto = "proposta" } = await req.json();
    const original = String(texto ?? "").trim();
    if (!original) {
      return new Response(JSON.stringify({ erro: "Texto vazio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          erro: "GEMINI_API_KEY não configurada no Supabase (Secrets da Edge Function).",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const max = Math.min(Math.max(Number(maxLinhas) || 10, 1), 20);
    const tokens = String(contexto) === "relatorio_obra" ? 8192 : 2048;
    const bruto = await gerarComGemini(
      apiKey,
      montarPrompt(original, max, String(contexto)),
      tokens,
    );
    const sugerido = await finalizarSugestao(
      apiKey,
      bruto,
      max,
      String(contexto),
    );

    return new Response(
      JSON.stringify({
        sugerido,
        origem: "gemini",
        modelo: GEMINI_MODEL,
        aviso:
          String(contexto) === "relatorio_obra"
            ? "Correção ortográfica gerada por IA (Google Gemini). Revise antes de aplicar."
            : "Sugestão gerada por IA (Google Gemini). Revise antes de aplicar.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao processar texto.";
    return new Response(JSON.stringify({ erro: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
