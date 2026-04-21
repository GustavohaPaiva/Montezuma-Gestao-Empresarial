import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const gerarPDF = async (
  titulo,
  colunas,
  dados,
  nomeObra,
  valorTotal = null,
  opts = {},
) => {
  try {
    const doc = new jsPDF();

    const tituloUpper = titulo.toUpperCase();
    const nomeObraUpper = (nomeObra || "NÃO INFORMADA").toUpperCase();
    const colunasUpper = colunas.map((col) => col.toUpperCase());

    const corpoTabela = (dados || []).map((item) =>
      Object.values(item).map((val) =>
        typeof val === "string" ? val.toUpperCase() : val,
      ),
    );

    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("MONTEZUMA GESTÃO DE OBRAS", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`OBRA: ${nomeObraUpper}`, 14, 30);
    doc.text(`TIPO DE RELATÓRIO: ${tituloUpper}`, 14, 37);
    doc.text(`EMISSÃO: ${new Date().toLocaleDateString()}`, 14, 44);

    autoTable(doc, {
      startY: 50,
      head: [colunasUpper],
      body: corpoTabela,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [70, 76, 84],
        halign: "center",
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        [colunas.length - 1]: { halign: "right" },
      },
      showFoot: "never",
    });

    if (valorTotal) {
      const finalY = doc.lastAutoTable.finalY;
      autoTable(doc, {
        startY: finalY,
        body: [
          colunas.map((_, i) => {
            if (i === 0) return "VALOR TOTAL";
            if (i === colunas.length - 1) return valorTotal;
            return "";
          }),
        ],
        styles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "right",
        },
        columnStyles: {
          [colunas.length - 1]: { halign: "right" },
        },
        head: [],
        showHead: "never",
      });
    }

    if (opts?.retornarBlob) {
      return {
        blob: doc.output("blob"),
        nomePadrao: `${tituloUpper.replace(/\s+/g, "_")}_${nomeObraUpper.replace(/\s+/g, "_")}.pdf`,
      };
    }

    const nomePadrao = `${tituloUpper.replace(/\s+/g, "_")}_${nomeObraUpper.replace(/\s+/g, "_")}.pdf`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: nomePadrao,
          types: [
            {
              description: "Arquivo PDF",
              accept: { "application/pdf": [".pdf"] },
            },
          ],
        });

        const blob = doc.output("blob");

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Erro ao salvar arquivo:", err);
        }
      }
    } else {
      doc.save(nomePadrao);
    }
  } catch (error) {
    console.error("ERRO CRÍTICO AO GERAR PDF:", error);
    alert("Erro ao criar o documento PDF.");
  }
};
