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
import { api } from "../services/api";

function textoCampo(valor) {
  const t = String(valor ?? "").trim();
  return t || "";
}

function clienteDaObra(obra) {
  const c = obra?.clientes;
  if (Array.isArray(c)) return c[0] || {};
  return c && typeof c === "object" ? c : {};
}

function temEnderecoPreenchido(cliente) {
  const c = cliente || {};
  return Boolean(
    textoCampo(c.rua_obra) ||
      textoCampo(c.numero_obra) ||
      textoCampo(c.bairro_obra) ||
      textoCampo(c.rua) ||
      textoCampo(c.numero_casa) ||
      textoCampo(c.bairro),
  );
}

export function obraTemDadosEnderecoCliente(obra) {
  return temEnderecoPreenchido(clienteDaObra(obra));
}

function montarEnderecoProcesso(cliente) {
  const c = cliente || {};
  const temObra =
    textoCampo(c.rua_obra) ||
    textoCampo(c.numero_obra) ||
    textoCampo(c.bairro_obra);

  const rua = temObra ? textoCampo(c.rua_obra) : textoCampo(c.rua);
  const numero = temObra
    ? textoCampo(c.numero_obra)
    : textoCampo(c.numero_casa);
  const bairro = temObra ? textoCampo(c.bairro_obra) : textoCampo(c.bairro);
  const complemento = textoCampo(c.complemento);
  const cidade = textoCampo(c.cidade);
  const estado = textoCampo(c.estado);
  const cep = textoCampo(c.cep);

  const partes = [];
  if (rua) partes.push(numero ? `${rua}, ${numero}` : rua);
  else if (numero) partes.push(numero);
  if (complemento) partes.push(complemento);
  if (bairro) partes.push(bairro);
  if (cidade && estado) partes.push(`${cidade}/${estado}`);
  else if (cidade) partes.push(cidade);
  else if (estado) partes.push(estado);
  if (cep) partes.push(`CEP ${cep}`);

  return partes.join(" · ");
}

async function garantirObraComEndereco(obra, obraId) {
  let obraAtual = obra || {};
  let cliente = clienteDaObra(obraAtual);
  const id = obraAtual.id || obraId;

  if (id) {
    try {
      const dados = await api.getObraComCliente(id);
      if (dados) {
        obraAtual = { ...obraAtual, ...dados };
        cliente = { ...cliente, ...clienteDaObra(dados) };
      }
    } catch (err) {
      console.error("[gerarPdfOrdemCompra] obra/cliente:", err);
    }
  }

  const clienteId = obraAtual.cliente_id || cliente.id;
  if (clienteId) {
    try {
      const row = await api.getClienteById(clienteId);
      if (row) cliente = { ...cliente, ...row };
    } catch (err) {
      console.error("[gerarPdfOrdemCompra] cliente:", err);
    }
  }

  return { ...obraAtual, clientes: cliente };
}

function dadosEmitenteCliente(obra) {
  const c = clienteDaObra(obra);
  const contato = [c.telefone, c.email].filter(Boolean).join(" · ");
  return {
    razao: c.nome || obra?.cliente || "Cliente",
    documento: c.cpf || c.cnpj || c.documento || "",
    endereco: montarEnderecoProcesso(c) || obra?.local || "",
    contato,
  };
}

function resolverEmitente(grupo, obra) {
  return grupo.emitente === EMITENTE_ORDEM_CLIENTE
    ? dadosEmitenteCliente(obra)
    : { ...DADOS_EMITENTE_MONTEZUMA };
}

function montarObraPdf(obra) {
  const c = clienteDaObra(obra);
  const cliente = c.nome || obra?.cliente || "—";
  const local = obra?.local || "—";
  const endereco = montarEnderecoProcesso(c);
  return { cliente, local, endereco: endereco || "" };
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
  const obraComEndereco = await garantirObraComEndereco(obra, pedido?.obra_id);
  const emitente = resolverEmitente(grupo, obraComEndereco);
  const obraPdf = montarObraPdf(obraComEndereco);
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
