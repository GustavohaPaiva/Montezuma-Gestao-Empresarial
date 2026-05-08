import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import { ID_VOGELKOP, ID_YBYOCA } from "../../constants/escritorios";

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
        const dadosCliente = await api.getClienteById(id, {
          allowedEscritorioIds: [ID_VOGELKOP, ID_YBYOCA],
        });
        if (!dadosCliente) throw new Error("Cliente não encontrado");

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

  if (erro) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#F4F4F5] to-[#E4E4E7] p-6 text-center">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-lg shadow-red-900/5">
          <p className="mb-2 text-lg font-semibold text-red-600">
            Erro ao renderizar o documento.
          </p>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#FAFAFA] to-[#EEEDF0] px-4">
        <div className="rounded-2xl border border-gray-200 bg-white/90 px-10 py-8 shadow-sm backdrop-blur-sm">
          <p className="text-base font-semibold tracking-tight text-gray-700">
            Processando as páginas do PDF…
          </p>
          <p className="mt-2 text-sm text-gray-500">Aguarde um instante.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#3F4448]">
      <iframe
        src={pdfUrl}
        width="100%"
        height="100%"
        className="border-0"
        title="Visualizador de Documentos do Processo"
      />
    </div>
  );
};

export default DocumentosProcesso;
