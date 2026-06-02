// ⚠️ GAMBIARRA TEMPORÁRIA — TELA DE TESTE DA PROPOSTA VK
// Para remover: apague este arquivo e a rota "/teste-proposta-vk" no App.jsx
// (procure pelos marcadores "GAMBIARRA TESTE PROPOSTA VK").
import { PDFViewer } from "@react-pdf/renderer";
import OrcamentoVogelKopPDF from "../../documents/OrcamentoVogelKopPDF";

// Dados de exemplo para preencher o documento de proposta.
const ORCAMENTO_MOCK = {
  id: "teste-vk",
  nome: "Residência Teste — Pré-visualização",
  numero_proposta: 1,
  data: new Date().toISOString(),
  created_at: new Date().toISOString(),
  proposta_dados: {
    descricao:
      "Projeto de teste para validar o layout do documento de proposta VogelKop. " +
      "Este texto é apenas um exemplo de objeto da proposta.",
    tecnico: ["Plantas baixas", "Cortes", "Fachadas"],
    complementares: ["Projeto elétrico", "Projeto hidrossanitário"],
    renderizacoes: ["Fachada principal", "Sala de estar", "Cozinha"],
    tramites: ["Aprovação na prefeitura"],
    valores: {
      pacote_tecnico: 12000,
      complementares: 5000,
      renderizados: 3500,
      tramites: 1500,
    },
  },
};

export default function TesteProvaVK() {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0 }}>
      <PDFViewer
        style={{ width: "100%", height: "100%", border: "none" }}
        showToolbar
      >
        <OrcamentoVogelKopPDF orcamento={ORCAMENTO_MOCK} />
      </PDFViewer>
    </div>
  );
}
