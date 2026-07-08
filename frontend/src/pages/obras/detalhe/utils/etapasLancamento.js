/** Etapas da obra com status "em andamento". */
export function getEtapasEmAndamento(obra) {
  return (obra?.etapas_selecionadas || []).filter(
    (e) => e?.status === "em andamento",
  );
}

/** Nomes das etapas selecionadas da obra (opções do seletor). */
export function getEtapasOpcoes(obra) {
  return (obra?.etapas_selecionadas || [])
    .map((e) => e?.nome)
    .filter(Boolean);
}

/** Pré-seleciona quando há exatamente uma etapa em andamento. */
export function getEtapaPadrao(obra) {
  const emAndamento = getEtapasEmAndamento(obra);
  if (emAndamento.length === 1) return emAndamento[0].nome;
  return null;
}

/** Obrigatório quando há mais de uma etapa em andamento. */
export function isEtapaObrigatoria(obra) {
  return getEtapasEmAndamento(obra).length > 1;
}

/** Valida etapa antes de salvar; retorna mensagem de erro ou null. */
export function validarEtapaLancamento(obra, etapaNome) {
  const nome = String(etapaNome || "").trim();
  if (isEtapaObrigatoria(obra) && !nome) {
    return "Selecione a etapa — há mais de uma etapa em andamento nesta obra.";
  }
  if (nome) {
    const opcoes = getEtapasOpcoes(obra);
    if (opcoes.length && !opcoes.includes(nome)) {
      return "Etapa inválida para esta obra.";
    }
  }
  return null;
}

/** Opções formatadas para BaseSelect. */
export function etapasParaSelectOptions(obra, { incluirVazio = true } = {}) {
  const opcoes = getEtapasOpcoes(obra).map((nome) => ({
    value: nome,
    label: nome,
  }));
  if (!incluirVazio) return opcoes;
  return [{ value: "", label: "— Sem etapa —" }, ...opcoes];
}
