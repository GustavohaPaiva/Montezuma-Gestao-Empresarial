import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "span",
];

const ALLOWED_ATTR = ["style"];

/**
 * Sanitiza HTML do resumo de obra (allowlist de tags de formatação).
 */
export function sanitizeResumoObraHtml(html) {
  return DOMPurify.sanitize(String(html ?? ""), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
