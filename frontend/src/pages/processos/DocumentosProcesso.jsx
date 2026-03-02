import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";

import { pdf, Document } from "@react-pdf/renderer";
import RequerimentoGeralLayout from "../../documents/RequerimentoGeralLayout";
import TermoCienciaLayout from "../../documents/TermoCienciaLayout";
import DeclaracaoCUBLayout from "../../documents/DeclaracaoCUBLayout";
import DeclaracaoHabiteseLayout from "../../documents/DeclaracaoHabiteseLayout";
import DeclaracaoMovimentacaoSoloLayout from "../../documents/DeclaracaoMovimentacaoSoloLayout";
import GerenciamentoResiduosLayout from "../../documents/GerenciamentoResiduosLayout";

const DocumentosProcesso = () => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const carregarEGerarPDF = async () => {
      try {
        const dadosCliente = await api.getClienteById(id);

        const blob = await pdf(
          <Document>
            <RequerimentoGeralLayout cliente={dadosCliente} />
            <TermoCienciaLayout cliente={dadosCliente} />
            <DeclaracaoHabiteseLayout cliente={dadosCliente} />
            <DeclaracaoMovimentacaoSoloLayout cliente={dadosCliente} />
            <GerenciamentoResiduosLayout cliente={dadosCliente} />
            <DeclaracaoCUBLayout cliente={dadosCliente} />
          </Document>,
        ).toBlob();

        // Gera a URL limpa para o Iframe ler
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error("Erro ao carregar dados ou gerar PDF:", error);
        setErro(true);
      }
    };

    if (id) {
      carregarEGerarPDF();
    }
  }, [id]);

  // TELA 1: Se der pau
  if (erro) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <p className="text-xl font-bold text-red-500 mb-2">
          Erro ao renderizar o documento.
        </p>
        <p className="text-gray-600">
          Verifique se você <b>apagou as tags &lt;Document&gt;</b> de dentro dos
          6 arquivos de layout!
        </p>
      </div>
    );
  }

  // TELA 2: Carregando (Pode demorar uns segundos por serem 6 páginas)
  if (!pdfUrl) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <p className="text-xl font-bold text-gray-500">
          Processando as páginas do PDF... Aguarde.
        </p>
      </div>
    );
  }

  // TELA 3: Sucesso! O Iframe gigante exibindo o PDF completo
  return (
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#525659" }}>
      <iframe
        src={pdfUrl}
        width="100%"
        height="100%"
        style={{ border: "none" }}
        title="Visualizador de Documentos do Processo"
      />
    </div>
  );
};

export default DocumentosProcesso;
