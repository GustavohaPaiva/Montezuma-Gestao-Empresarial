import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const gerarPDF = (titulo, colunas, dados, nomeObra) => {
  try {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Montezuma Gestão de Obras", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Obra: ${nomeObra || "Não informada"}`, 14, 30);
    doc.text(`Tipo de Relatório: ${titulo}`, 14, 37);
    doc.text(`Emissão: ${new Date().toLocaleDateString()}`, 14, 44);

    const corpoTabela = (dados || []).map((item) => Object.values(item));

    autoTable(doc, {
      startY: 50,
      head: [colunas],
      body: corpoTabela,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [70, 76, 84], halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const fileName = `${titulo.replace(/\s+/g, "_")}_${nomeObra.replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("ERRO AO GERAR PDF:", error);
    alert(
      "Falha ao gerar o arquivo. Verifique se os dados da tabela estão corretos.",
    );
  }
};
