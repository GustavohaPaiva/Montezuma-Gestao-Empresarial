import { supabase } from "../services/supabase";
import { MAX_LINHAS_DESCRICAO, limitarLinhasDescricao } from "./orcamentoPropostaUtils";

const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL?.trim() || "gemini-2.0-flash";

function montarPromptGemini(texto, maxLinhas) {
  return `Você é redator de propostas comerciais de um escritório de arquitetura no Brasil.

Reescreva o texto abaixo em português brasileiro formal, claro e profissional.
Corrija gramática, ortografia e pontuação. Melhore a fluidez sem mudar o sentido nem inventar informações.
Use tom adequado a proposta comercial (objectivo e cordial).
O resultado deve ter no máximo ${maxLinhas} linhas (use quebras de linha naturais se ajudarem a legibilidade).
Não use markdown, títulos, bullets, aspas envolvendo o texto inteiro nem explicações.
Retorne APENAS o texto final reescrito.

Texto original:
"""
${texto}
"""`;
}

async function chamarGeminiDireto(texto, maxLinhas) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: montarPromptGemini(texto, maxLinhas) }] }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw?.trim()) throw new Error("Gemini não retornou texto.");

  return limitarLinhasDescricao(
    String(raw).replace(/^["'`]+|["'`]+$/g, "").trim(),
  );
}

async function chamarGeminiEdgeFunction(texto, maxLinhas) {
  const { data, error } = await supabase.functions.invoke(
    "melhorar-texto-proposta",
    { body: { texto, maxLinhas } },
  );

  if (error) throw error;
  if (data?.erro) throw new Error(data.erro);

  return {
    sugerido: limitarLinhasDescricao(data?.sugerido ?? ""),
    origem: data?.origem || "gemini",
    modelo: data?.modelo || GEMINI_MODEL,
    aviso:
      data?.aviso ||
      "Sugestão gerada por IA (Google Gemini). Revise antes de aplicar.",
  };
}

function limpezaBasicaLocal(texto) {
  let t = String(texto ?? "").trim();
  if (!t) return t;
  t = t.replace(/\s+/g, " ");
  t = t.replace(/\s+([,.;:!?])/g, "$1");
  t = t.replace(/([.!?])([^\s\n])/g, "$1 $2");
  if (t.length > 0) t = t.charAt(0).toUpperCase() + t.slice(1);
  return t;
}

/**
 * Melhora texto com IA generativa (Gemini — tier gratuito).
 * Ordem: Edge Function Supabase → Gemini direto (VITE_GEMINI_API_KEY) → limpeza local.
 *
 * @param {string} texto
 * @returns {Promise<{ sugerido: string, origem: string, modelo?: string, aviso?: string }>}
 */
export async function melhorarTextoPortugues(texto) {
  const original = String(texto ?? "").trim();
  if (!original) {
    return { sugerido: "", origem: "nenhuma" };
  }

  const maxLinhas = MAX_LINHAS_DESCRICAO;

  try {
    const viaEdge = await chamarGeminiEdgeFunction(original, maxLinhas);
    if (viaEdge.sugerido) return viaEdge;
  } catch (edgeErr) {
    console.warn("[melhorarTexto] Edge Function:", edgeErr);

    try {
      const direto = await chamarGeminiDireto(original, maxLinhas);
      if (direto) {
        return {
          sugerido: direto,
          origem: "gemini",
          modelo: GEMINI_MODEL,
          aviso:
            "Sugestão via Gemini (chave local). Revise antes de aplicar.",
        };
      }
    } catch (geminiErr) {
      console.warn("[melhorarTexto] Gemini direto:", geminiErr);
    }
  }

  const local = limpezaBasicaLocal(original);
  return {
    sugerido: limitarLinhasDescricao(local),
    origem: "local",
    aviso:
      "IA indisponível. Configure Gemini (veja instruções) ou edite manualmente. Aplicamos apenas ajustes básicos.",
  };
}
