import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const gerarPDF = (
  titulo,
  colunas,
  dados,
  nomeObra,
  valorTotal = null,
) => {
  try {
    const doc = new jsPDF();

    // --- Cabeçalho do Documento ---
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Montezuma Gestão de Obras", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Obra: ${nomeObra || "Não informada"}`, 14, 30);
    doc.text(`Tipo de Relatório: ${titulo}`, 14, 37);
    doc.text(`Emissão: ${new Date().toLocaleDateString()}`, 14, 44);

    const corpoTabela = (dados || []).map((item) => Object.values(item));

    // 1. Removemos o 'foot' de dentro da configuração da tabela
    autoTable(doc, {
      startY: 50,
      head: [colunas],
      body: corpoTabela,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [70, 76, 84], halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        [colunas.length - 1]: { halign: "right" },
      },
      // Importante: garante que a tabela não desenhe rodapé automático
      showFoot: "never",
    });

    // 2. Desenhamos a linha de Total MANUALMENTE após o fim da tabela
    if (valorTotal) {
      // Pega a posição Y onde a tabela terminou
      const finalY = doc.lastAutoTable.finalY;

      // Gera uma nova "tabela" de uma linha só para o total
      autoTable(doc, {
        startY: finalY, // Começa exatamente onde a outra terminou
        body: [
          // Cria uma linha onde a primeira célula tem o texto e a última o valor
          colunas.map((_, i) => {
            if (i === 0) return "VALOR TOTAL";
            if (i === colunas.length - 1) return valorTotal;
            return ""; // Células do meio vazias
          }),
        ],
        // Estilo visual idêntico ao que seria o footer
        styles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          [colunas.length - 1]: { halign: "right" }, // Alinha o valor à direita
        },
        // Remove cabeçalho dessa "tabela de total"
        head: [],
        showHead: "never",
      });
    }

    const fileName = `${titulo.replace(/\s+/g, "_")}_${nomeObra.replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("ERRO AO GERAR PDF:", error);
    alert("Falha ao gerar o arquivo.");
  }
};
