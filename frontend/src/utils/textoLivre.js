import { sanitizeResumoObraHtml } from "./sanitizeHtml";
import { resumoObraTemConteudo } from "../pages/relatorios-diretoria/relatoriosDiretoriaUtils";

function escaparHtmlTexto(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Detecta se o valor já contém marcação HTML de formatação. */
export function pareceHtmlTextoLivre(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value ?? ""));
}

/** Converte **negrito** e __negrito__ em <strong> (texto já escapado). */
export function aplicarNegritoMarkdown(texto) {
  return String(texto ?? "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>");
}

/** Texto plano → parágrafos HTML com negrito markdown. */
export function textoPlanoParaHtml(texto) {
  const bruto = String(texto ?? "").replace(/\r\n?/g, "\n").trim();
  if (!bruto) return "";

  const paragrafos = bruto.split(/\n{2,}/).filter((p) => p.trim());
  if (!paragrafos.length) return "";

  return paragrafos
    .map((paragrafo) => {
      const linhas = paragrafo.split("\n").map((linha) => linha.trim());
      const corpo = aplicarNegritoMarkdown(escaparHtmlTexto(linhas.join("\n")))
        .replace(/\n/g, "<br>");
      return `<p>${corpo}</p>`;
    })
    .join("");
}

/**
 * Normaliza valor legado (texto ou HTML) para HTML sanitizado do editor/visualização.
 */
export function textoLivreParaHtml(value) {
  const bruto = String(value ?? "").trim();
  if (!bruto) return "";

  const html = pareceHtmlTextoLivre(bruto)
    ? bruto
    : textoPlanoParaHtml(bruto);

  return sanitizeResumoObraHtml(html);
}

/** Sanitiza HTML do editor e retorna string vazia se não houver conteúdo visível. */
export function serializarTextoLivre(html) {
  const safe = sanitizeResumoObraHtml(String(html ?? ""));
  return resumoObraTemConteudo(safe) ? safe.trim() : "";
}

export { resumoObraTemConteudo as textoLivreTemConteudo };
