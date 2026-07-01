import { ID_MONTEZUMA, ID_VOGELKOP } from "../../constants/escritorios";

export function getOrdensServicoBasePath(variant) {
  return variant === "vogelkop"
    ? "/escritorio/vogelkop/ordens-servico"
    : "/ordens-servico";
}

export function resolveEscritorioIdOrdemServico(variant, userEscritorioId) {
  if (variant === "vogelkop") return ID_VOGELKOP;
  if (variant === "montezuma") return ID_MONTEZUMA;
  return userEscritorioId || ID_MONTEZUMA;
}

export function temaOrdemServico(variant) {
  return variant === "vogelkop" ? "theme-vogelkop" : "";
}

export function formatarDataListaOS(raw) {
  if (!raw) return "—";
  const d = new Date(`${String(raw).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formPayloadFromForm(form, { escritorioId, criadorId }) {
  return {
    escritorio_id: escritorioId,
    criador_id: criadorId,
    responsavel_id: form.responsavel_id || null,
    data_emissao: form.data_emissao || new Date().toISOString().slice(0, 10),
    cliente_id: form.cliente_id || null,
    responsavel_tecnico: form.responsavel_tecnico?.trim() || null,
    cliente_nome: form.cliente_nome?.trim() || null,
    cliente_telefone: form.cliente_telefone?.trim() || null,
    cliente_email: form.cliente_email?.trim() || null,
    endereco_projeto: form.endereco_projeto?.trim() || null,
    objeto_servico: form.objeto_servico?.trim() || null,
    escopo: Array.isArray(form.escopo) ? form.escopo : [],
    escopo_outro: form.escopo_outro?.trim() || null,
    descricao_servicos: form.descricao_servicos?.trim() || null,
    data_inicio: form.data_inicio || null,
    data_entrega_prevista: form.data_entrega_prevista || null,
    observacoes_prazos: form.observacoes_prazos?.trim() || null,
    valor_total: form.valor_total,
    formas_pagamento: Array.isArray(form.formas_pagamento)
      ? form.formas_pagamento
      : [],
    forma_pagamento_outro: form.forma_pagamento_outro?.trim() || null,
    observacoes_gerais: form.observacoes_gerais?.trim() || null,
  };
}

export function osParaForm(os) {
  if (!os) return null;
  return {
    responsavel_id: os.responsavel_id || "",
    responsavel_tecnico: os.responsavel_tecnico || "",
    cliente_id: os.cliente_id || "",
    cliente_nome: os.cliente_nome || "",
    cliente_telefone: os.cliente_telefone || "",
    cliente_email: os.cliente_email || "",
    endereco_projeto: os.endereco_projeto || "",
    objeto_servico: os.objeto_servico || "",
    escopo: Array.isArray(os.escopo) ? os.escopo : [],
    escopo_outro: os.escopo_outro || "",
    descricao_servicos: os.descricao_servicos || "",
    data_inicio: os.data_inicio?.slice?.(0, 10) || os.data_inicio || "",
    data_entrega_prevista:
      os.data_entrega_prevista?.slice?.(0, 10) || os.data_entrega_prevista || "",
    observacoes_prazos: os.observacoes_prazos || "",
    valor_total: os.valor_total ?? "",
    formas_pagamento: Array.isArray(os.formas_pagamento)
      ? os.formas_pagamento
      : [],
    forma_pagamento_outro: os.forma_pagamento_outro || "",
    observacoes_gerais: os.observacoes_gerais || "",
    data_emissao: os.data_emissao?.slice?.(0, 10) || os.data_emissao || "",
  };
}
