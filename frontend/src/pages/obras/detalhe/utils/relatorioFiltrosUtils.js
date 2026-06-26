export function filtrarMateriaisLista(
  lista,
  { busca = "", fornecedorId = "" } = {},
) {
  let result = [...(lista || [])];
  if (fornecedorId) {
    result = result.filter(
      (m) => String(m.fornecedor_id) === String(fornecedorId),
    );
  }
  if (busca) {
    const termo = busca.toLowerCase();
    result = result.filter(
      (m) =>
        m.material?.toLowerCase().includes(termo) ||
        m.fornecedores?.nome?.toLowerCase().includes(termo) ||
        m.fornecedor?.toLowerCase().includes(termo),
    );
  }
  return result;
}

export function filtrarMaoDeObraLista(
  lista,
  { busca = "", prestadorId = "" } = {},
) {
  let result = [...(lista || [])];
  if (prestadorId) {
    result = result.filter(
      (m) => String(m.prestador_id) === String(prestadorId),
    );
  }
  if (busca) {
    const term = busca.toLowerCase();
    result = result.filter(
      (m) =>
        m.tipo?.toLowerCase().includes(term) ||
        m.profissional?.toLowerCase().includes(term),
    );
  }
  return result;
}
