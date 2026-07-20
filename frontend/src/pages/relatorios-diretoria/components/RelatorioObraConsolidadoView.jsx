import { sanitizeResumoObraHtml } from "../../../utils/sanitizeHtml";
import { resumoObraTemConteudo } from "../relatoriosDiretoriaUtils";
import { relatorioProsaClass } from "../relatoriosDiretoriaUi";

/**
 * Visualização somente leitura do resumo geral (HTML sanitizado).
 */
export default function RelatorioObraConsolidadoView({
  resumoHtml,
  className = "",
}) {
  const safe = sanitizeResumoObraHtml(resumoHtml);
  if (!resumoObraTemConteudo(safe)) return null;

  return (
    <div
      className={`${relatorioProsaClass} prose-resumo-obra ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
