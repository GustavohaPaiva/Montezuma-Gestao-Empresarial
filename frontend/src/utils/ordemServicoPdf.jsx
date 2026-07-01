import { pdf } from "@react-pdf/renderer";
import OrdemServicoPDF from "../documents/OrdemServicoPDF";
import { prefixoPdfOrdemServico } from "../constants/ordemServico";

export async function gerarPdfOrdemServico({
  os,
  escritorioId,
  retornarBlob = true,
}) {
  if (!os) throw new Error("Dados da OS são obrigatórios.");

  const prefixo = prefixoPdfOrdemServico(escritorioId);
  const dataStr = (os.data_emissao || new Date().toISOString()).slice(0, 10);
  const nomePadrao = `${prefixo}_Ordem-Servico_OS-${os.numero ?? "nova"}_${dataStr}.pdf`;

  const blob = await pdf(
    <OrdemServicoPDF os={os} escritorioId={escritorioId} />,
  ).toBlob();

  if (retornarBlob) {
    return { blob, nomePadrao };
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomePadrao;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { blob, nomePadrao };
}

export function formParaOrdemServicoPdf(form, extras = {}) {
  return {
    ...form,
    numero: extras.numero ?? form.numero,
    data_emissao: form.data_emissao || new Date().toISOString().slice(0, 10),
    valor_total:
      form.valor_total != null && form.valor_total !== ""
        ? Number(form.valor_total)
        : null,
  };
}
