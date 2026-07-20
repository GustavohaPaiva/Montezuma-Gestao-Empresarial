import { SEM_FORNECEDOR_ID } from "./materiaisPorFornecedor";
import { SEM_PRESTADOR_ID } from "./maoDeObraPorPrestador";

export function filtrarMateriaisLista(
  lista,
  { busca = "", fornecedorId = "", etapaNome = "" } = {},
) {
  let result = [...(lista || [])];
  if (fornecedorId === SEM_FORNECEDOR_ID) {
    result = result.filter((m) => !m.fornecedor_id);
  } else if (fornecedorId) {
    result = result.filter(
      (m) => String(m.fornecedor_id) === String(fornecedorId),
    );
  }
  if (etapaNome) {
    result = result.filter((m) => (m.etapa_nome || "") === etapaNome);
  }
  if (busca) {
    const termo = busca.toLowerCase();
    result = result.filter(
      (m) =>
        m.material?.toLowerCase().includes(termo) ||
        m.fornecedores?.nome?.toLowerCase().includes(termo) ||
        m.fornecedor?.toLowerCase().includes(termo) ||
        m.etapa_nome?.toLowerCase().includes(termo),
    );
  }
  return result;
}

export function filtrarMaoDeObraLista(
  lista,
  { busca = "", prestadorId = "", etapaNome = "" } = {},
) {
  let result = [...(lista || [])];
  if (prestadorId === SEM_PRESTADOR_ID) {
    result = result.filter((m) => !m.prestador_id);
  } else if (prestadorId) {
    result = result.filter(
      (m) => String(m.prestador_id) === String(prestadorId),
    );
  }
  if (etapaNome) {
    result = result.filter((m) => (m.etapa_nome || "") === etapaNome);
  }
  if (busca) {
    const term = busca.toLowerCase();
    result = result.filter(
      (m) =>
        m.tipo?.toLowerCase().includes(term) ||
        m.profissional?.toLowerCase().includes(term) ||
        m.prestadores?.nome?.toLowerCase().includes(term) ||
        m.etapa_nome?.toLowerCase().includes(term),
    );
  }
  return result;
}

export function filtrarLocacoesLista(
  lista,
  { busca = "", etapaNome = "" } = {},
) {
  let result = [...(lista || [])];
  if (etapaNome) {
    result = result.filter((l) => (l.etapa_nome || "") === etapaNome);
  }
  if (busca) {
    const termo = busca.toLowerCase();
    result = result.filter(
      (l) =>
        l.equipamento?.toLowerCase().includes(termo) ||
        l.solicitante?.toLowerCase().includes(termo) ||
        l.tipo_periodo?.toLowerCase().includes(termo) ||
        l.etapa_nome?.toLowerCase().includes(termo),
    );
  }
  return result;
}
