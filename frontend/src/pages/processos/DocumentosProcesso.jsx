import { useNavigate, useParams } from "react-router-dom";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import { gerarDocumentosPrefeituraPdf } from "../../utils/documentosPrefeituraPdf";

/**
 * Rota dedicada para visualizar o pacote de documentos da prefeitura
 * (mantida para links diretos / favoritos).
 */
export default function DocumentosProcesso() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <PdfPreviewModal
      isOpen
      onClose={() => navigate(`/processo/${id}`, { replace: true })}
      titulo="Documentos para a Prefeitura"
      gerador={() => gerarDocumentosPrefeituraPdf(id)}
      nomeFallback="documentos_prefeitura.pdf"
    />
  );
}
