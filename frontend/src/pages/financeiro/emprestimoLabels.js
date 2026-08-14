import { ESCRITORIO_NOME_POR_ID } from "../../constants/escritorios";
import { labelObraResumo } from "../obras/detalhe/utils/obraCaixa";

export function labelParteEmprestimo(tipo, escritorio, obra, escritorioId) {
  if (tipo === "escritorio") {
    return (
      escritorio?.nome ||
      ESCRITORIO_NOME_POR_ID[escritorioId] ||
      "Escritório"
    );
  }
  return labelObraResumo(obra);
}

export function enriquecerEmprestimo(emp) {
  const origemLabel = labelParteEmprestimo(
    emp.origem_tipo,
    emp.origem_escritorio,
    emp.origem_obra,
    emp.origem_escritorio_id,
  );
  const destinoLabel = labelParteEmprestimo(
    emp.destino_tipo,
    emp.destino_escritorio,
    emp.destino_obra,
    emp.destino_escritorio_id,
  );
  return { ...emp, origemLabel, destinoLabel };
}

export function visaoParaEscritorio(emp, escritorioId) {
  const e = enriquecerEmprestimo(emp);
  const emprestou =
    e.origem_tipo === "escritorio" && e.origem_escritorio_id === escritorioId;
  return {
    ...e,
    emprestou,
    contraLabel: emprestou ? e.destinoLabel : e.origemLabel,
    contraKind: emprestou ? e.destino_tipo : e.origem_tipo,
  };
}

export function visaoParaObra(emp, obraId) {
  const e = enriquecerEmprestimo(emp);
  const emprestou =
    e.origem_tipo === "obra" && Number(e.origem_obra_id) === Number(obraId);
  return {
    ...e,
    emprestou,
    contraLabel: emprestou ? e.destinoLabel : e.origemLabel,
    contraKind: emprestou ? e.destino_tipo : e.origem_tipo,
  };
}
