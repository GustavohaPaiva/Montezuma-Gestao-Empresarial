import React, { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import TermoCienciaLayout from "../../documents/DeclaracaoCUBLayout"; // Verifique se o caminho está correto

const TestePDFViewer = () => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    // Essa função gera o PDF em background e cria um link local temporário
    const gerarPDF = async () => {
      try {
        const blob = await pdf(<TermoCienciaLayout />).toBlob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
      }
    };

    gerarPDF();
  }, []);

  if (!pdfUrl) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <p className="text-xl font-bold text-gray-500">Renderizando PDF...</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#525659" }}>
      {/* Colocamos o PDF gerado dentro de um iframe nativo */}
      <iframe
        src={pdfUrl}
        width="100%"
        height="100%"
        style={{ border: "none" }}
        title="Visualizador de PDF"
      />
    </div>
  );
};

export default TestePDFViewer;
