import { supabase } from "../services/supabase";
import {
  MAX_LINHAS_DESCRICAO,
  limitarLinhasDescricao,
  precisaAjusteSugestaoIA,
  removerFinalIncompleto,
  textoExcedeLinhasDescricao,
} from "./orcamentoPropostaUtils";

const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL?.trim() || "gemini-2.5-flash";

function limparTextoGemini(raw) {
  return String(raw ?? "")
    .replace(/^```(?:html|HTML)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function montarPromptGemini(texto, maxLinhas, contexto = "proposta") {
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

function montarPromptAjuste(texto, maxLinhas, contexto = "proposta") {
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

async function chamarGeminiDiretoPrompt(prompt, { maxOutputTokens = 2048 } = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens,
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
  return limparTextoGemini(raw);
}

async function finalizarSugestaoIA(textoBruto, maxLinhas, gerarPrompt, contexto) {
  let texto = limparTextoGemini(textoBruto);

  if (contexto === "relatorio_obra") {
    return texto;
  }

  if (precisaAjusteSugestaoIA(texto, maxLinhas)) {
    const ajustado = await gerarPrompt(
      montarPromptAjuste(texto, maxLinhas, contexto),
    );
    if (ajustado) texto = limparTextoGemini(ajustado);
  }

  texto = removerFinalIncompleto(texto);

  if (textoExcedeLinhasDescricao(texto, maxLinhas)) {
    const resumido = await gerarPrompt(
      montarPromptAjuste(texto, maxLinhas, contexto),
    );
    if (resumido) texto = removerFinalIncompleto(limparTextoGemini(resumido));
  }

  return texto;
}

async function chamarGeminiDireto(texto, maxLinhas, contexto) {
  const tokens = contexto === "relatorio_obra" ? 8192 : 2048;
  const gerar = (prompt) =>
    chamarGeminiDiretoPrompt(prompt, { maxOutputTokens: tokens });
  const bruto = await gerar(montarPromptGemini(texto, maxLinhas, contexto));
  if (!bruto) return null;
  return finalizarSugestaoIA(bruto, maxLinhas, gerar, contexto);
}

async function chamarGeminiEdgeFunction(texto, maxLinhas, contexto) {
  const { data, error } = await supabase.functions.invoke(
    "melhorar-texto-proposta",
    { body: { texto, maxLinhas, contexto } },
  );

  if (error) throw error;
  if (data?.erro) throw new Error(data.erro);

  const sugerido =
    contexto === "relatorio_obra"
      ? limparTextoGemini(data?.sugerido ?? "")
      : removerFinalIncompleto(data?.sugerido ?? "");

  return {
    sugerido,
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
 * Melhora texto com IA generativa (Gemini).
 * Ordem: Edge Function Supabase → Gemini direto → limpeza local.
 */
export async function melhorarTextoPortugues(
  texto,
  { contexto = "proposta", maxLinhas = MAX_LINHAS_DESCRICAO } = {},
) {
  const original = String(texto ?? "").trim();
  if (!original) {
    return { sugerido: "", origem: "nenhuma" };
  }

  const max = maxLinhas;

  try {
    const viaEdge = await chamarGeminiEdgeFunction(original, max, contexto);
    if (viaEdge.sugerido) return viaEdge;
  } catch (edgeErr) {
    console.warn("[melhorarTexto] Edge Function:", edgeErr);

    try {
      const direto = await chamarGeminiDireto(original, max, contexto);
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

  const local =
    contexto === "relatorio_obra" ? original : limpezaBasicaLocal(original);
  return {
    sugerido:
      contexto === "relatorio_obra" ? local : limitarLinhasDescricao(local),
    origem: "local",
    aviso:
      "IA indisponível. Configure Gemini (veja instruções) ou edite manualmente. Aplicamos apenas ajustes básicos.",
  };
}
