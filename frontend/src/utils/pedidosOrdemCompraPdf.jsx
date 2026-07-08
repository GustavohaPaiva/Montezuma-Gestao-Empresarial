import { pdf } from "@react-pdf/renderer";
import OrdemCompraPDF from "../documents/OrdemCompraPDF";
import { formatarDataBR } from "../pages/obras/detalhe/utils/formatters";
import {
  formatarQuantidadePedido,
  normalizarNomeMaterial,
  numeroPedidoObra,
} from "./pedidosUtils";
import {
  DADOS_EMITENTE_MONTEZUMA,
  EMITENTE_ORDEM_CLIENTE,
  labelEmitenteGrupo,
} from "../constants/pedidos";

function dadosEmitenteCliente(obra) {
  const c = obra?.clientes || {};
  const contato = [c.telefone, c.email].filter(Boolean).join(" · ");
  return {
    razao: c.nome || obra?.cliente || "Cliente",
    documento: c.cpf || c.cnpj || c.documento || "",
    endereco: c.endereco || obra?.local || "",
    contato,
  };
}

function resolverEmitente(grupo, obra) {
  return grupo.emitente === EMITENTE_ORDEM_CLIENTE
    ? dadosEmitenteCliente(obra)
    : { ...DADOS_EMITENTE_MONTEZUMA };
}

function montarObraPdf(obra) {
  const c = obra?.clientes || {};
  const cliente = c.nome || obra?.cliente || "—";
  const local = obra?.local || "—";
  const endereco =
    c.endereco ||
    [c.rua, c.numero_casa, c.bairro, c.cidade].filter(Boolean).join(", ") ||
    null;
  return { cliente, local, endereco: endereco || undefined };
}

function montarItensPdf(itens) {
  return (itens || []).map((i) => ({
    material: i.material
      ? normalizarNomeMaterial(i.material)
      : "—",
    quantidade: formatarQuantidadePedido(i.quantidade),
    unidade: i.unidade || "Un.",
    entrega: formatarDataBR(i.data_entrega),
  }));
}

/**
 * @param {{
 *   grupo: object,
 *   pedido: object,
 *   obra?: object,
 *   retornarBlob?: boolean,
 * }} params
 */
export async function gerarPdfOrdemCompra({
  grupo,
  pedido,
  obra,
  retornarBlob = false,
}) {
  const emitente = resolverEmitente(grupo, obra);
  const obraPdf = montarObraPdf(obra);
  const itens = montarItensPdf(grupo.itens);
  const dataEmissao = new Date().toISOString();

  const nPedido = numeroPedidoObra(pedido) ?? pedido.id;
  const nomePadrao = `ORDEM_COMPRA_${grupo.numero}_PEDIDO_${nPedido}.pdf`;

  const doc = (
    <OrdemCompraPDF
      numeroOrdem={grupo.numero}
      numeroPedido={numeroPedidoObra(pedido) ?? pedido.id}
      dataEmissao={dataEmissao}
      statusOrdem={grupo.status}
      statusPedido={pedido.status}
      emitente={emitente}
      obra={obraPdf}
      pedido={{
        solicitante: pedido.solicitante_nome,
        created_at: pedido.created_at,
      }}
      itens={itens}
    />
  );

  const blob = await pdf(doc).toBlob();

  if (retornarBlob) {
    return { blob, nomePadrao };
  }

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
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[gerarPdfOrdemCompra] salvar:", err);
        throw err;
      }
    }
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomePadrao;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return { blob, nomePadrao };
}

export { labelEmitenteGrupo };
