import { relatorioProsaClass } from "../relatoriosDiretoriaUi";
import { HtmlTextoLivre } from "../../../components/gerais/EditorTextoLivre";

/**
 * Visualização somente leitura do resumo geral (HTML sanitizado).
 */
export default function RelatorioObraConsolidadoView({
  resumoHtml,
  className = "",
}) {
  return (
    <HtmlTextoLivre
      html={resumoHtml}
      className={`${relatorioProsaClass} ${className}`}
    />
  );
}
