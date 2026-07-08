import {
  OS_ESCOPO_OPCOES,
  OS_FORMAS_PAGAMENTO,
  OS_OBJETO_PADRAO,
} from "../../constants/ordemServico";
import { ID_MONTEZUMA, ID_VOGELKOP, ID_YBYOCA } from "../../constants/escritorios";

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

/** Escritórios cujo cadastro de clientes alimenta o select da OS. */
export function escritorioIdsClientesOrdemServico(variant) {
  if (variant === "vogelkop") return [ID_VOGELKOP];
  return [ID_VOGELKOP, ID_YBYOCA];
}

export function ordenarClientesPorNome(clientes) {
  if (!Array.isArray(clientes)) return [];
  return [...clientes].sort((a, b) =>
    String(a?.nome ?? "").localeCompare(String(b?.nome ?? ""), "pt-BR", {
      sensitivity: "base",
    }),
  );
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

/** Normaliza coluna jsonb ou legado string em array de strings. */
export function parseOutrosArray(raw) {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s ?? "").trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return [raw.trim()];
  }
  return [];
}

export function campoPreenchido(valor) {
  if (valor == null) return false;
  if (Array.isArray(valor)) return valor.length > 0;
  if (typeof valor === "number") return !Number.isNaN(valor);
  return String(valor).trim() !== "";
}

export function enderecoObraFromCliente(cliente) {
  if (!cliente) return { rua: "", numero: "", bairro: "" };

  const temObra =
    cliente.rua_obra || cliente.numero_obra || cliente.bairro_obra;
  if (temObra) {
    return {
      rua: cliente.rua_obra || "",
      numero: cliente.numero_obra || "",
      bairro: cliente.bairro_obra || "",
    };
  }

  return {
    rua: cliente.rua || "",
    numero: cliente.numero_casa || "",
    bairro: cliente.bairro || "",
  };
}

export function montarEnderecoProjeto(rua, numero, bairro) {
  const r = String(rua ?? "").trim();
  const n = String(numero ?? "").trim();
  const b = String(bairro ?? "").trim();
  if (!r && !n && !b) return null;

  const partes = [];
  if (r) partes.push(n ? `${r}, ${n}` : r);
  else if (n) partes.push(n);
  if (b) partes.push(b);
  return partes.join(" - ");
}

export function enderecoProjetoFromOs(os) {
  if (!os) return "";
  const montado = montarEnderecoProjeto(
    os.endereco_rua,
    os.endereco_numero,
    os.endereco_bairro,
  );
  if (montado) return montado;
  return String(os.endereco_projeto ?? "").trim();
}

export function aplicarDadosClienteNaForm(cliente, prev) {
  if (!cliente) {
    return {
      ...prev,
      cliente_id: "",
      cliente_nome: "",
    };
  }

  const endereco = enderecoObraFromCliente(cliente);

  return {
    ...prev,
    cliente_id: String(cliente.id),
    cliente_nome: cliente.nome || prev.cliente_nome,
    cliente_telefone: cliente.telefone || prev.cliente_telefone,
    cliente_email: cliente.email || prev.cliente_email,
    endereco_rua: endereco.rua || prev.endereco_rua,
    endereco_numero: endereco.numero || prev.endereco_numero,
    endereco_bairro: endereco.bairro || prev.endereco_bairro,
  };
}

export function osEstaIncompleta(os) {
  if (!os) return true;
  const escopo = Array.isArray(os.escopo) ? os.escopo : [];
  const outrosEscopo = parseOutrosArray(os.escopo_outro);
  const semDescricao = !String(os.descricao_servicos ?? "").trim();
  const semEscopo = escopo.length === 0 && outrosEscopo.length === 0;
  const semValor = os.valor_total == null || os.valor_total === "";
  return semDescricao && semEscopo && semValor;
}

export function resolverNomeResponsavelTecnico(form, destinatarios = []) {
  if (!form.responsavel_id) return null;
  const u = destinatarios.find(
    (d) => String(d.id) === String(form.responsavel_id),
  );
  return u?.nome?.trim() || form.responsavel_tecnico?.trim() || null;
}

function enderecoPayloadFromForm(form) {
  const rua = form.endereco_rua?.trim() || null;
  const numero = form.endereco_numero?.trim() || null;
  const bairro = form.endereco_bairro?.trim() || null;
  return {
    endereco_rua: rua,
    endereco_numero: numero,
    endereco_bairro: bairro,
    endereco_projeto: montarEnderecoProjeto(rua, numero, bairro),
  };
}

export function formPayloadFromForm(
  form,
  { escritorioId, criadorId, destinatarios = [] } = {},
) {
  const escopoOutros = Array.isArray(form.escopo_outros)
    ? form.escopo_outros.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const formasOutros = Array.isArray(form.formas_pagamento_outros)
    ? form.formas_pagamento_outros.map((s) => String(s).trim()).filter(Boolean)
    : [];

  return {
    escritorio_id: escritorioId,
    criador_id: criadorId,
    responsavel_id: form.responsavel_id || null,
    responsavel_tecnico: resolverNomeResponsavelTecnico(form, destinatarios),
    data_emissao: form.data_emissao || new Date().toISOString().slice(0, 10),
    cliente_id: form.cliente_id || null,
    cliente_nome: form.cliente_nome?.trim() || null,
    cliente_telefone: form.cliente_telefone?.trim() || null,
    cliente_email: form.cliente_email?.trim() || null,
    ...enderecoPayloadFromForm(form),
    objeto_servico: form.objeto_servico?.trim() || null,
    escopo: Array.isArray(form.escopo) ? form.escopo : [],
    escopo_outro: escopoOutros,
    descricao_servicos: form.descricao_servicos?.trim() || null,
    data_inicio: form.data_inicio || null,
    data_entrega_prevista: form.data_entrega_prevista || null,
    observacoes_prazos: form.observacoes_prazos?.trim() || null,
    valor_total: form.valor_total,
    formas_pagamento: Array.isArray(form.formas_pagamento)
      ? form.formas_pagamento
      : [],
    forma_pagamento_outro: formasOutros,
    responsabilidades_cliente: form.responsabilidades_cliente?.trim() || null,
    observacoes_gerais: form.observacoes_gerais?.trim() || null,
  };
}

export function snapshotFormOrdemServico(
  form,
  { escritorioId, criadorId, destinatarios = [] } = {},
) {
  const payload = formPayloadFromForm(form, {
    escritorioId,
    criadorId,
    destinatarios,
  });
  delete payload.escritorio_id;
  delete payload.criador_id;
  return JSON.stringify(payload);
}

export function formPayloadMinimoModal(
  form,
  { escritorioId, criadorId, destinatarios = [] } = {},
) {
  const endereco = enderecoPayloadFromForm(form);
  return {
    escritorio_id: escritorioId,
    criador_id: criadorId,
    responsavel_id: form.responsavel_id || null,
    responsavel_tecnico: resolverNomeResponsavelTecnico(form, destinatarios),
    data_emissao: form.data_emissao || new Date().toISOString().slice(0, 10),
    cliente_id: form.cliente_id || null,
    cliente_nome: form.cliente_nome?.trim() || null,
    cliente_telefone: form.cliente_telefone?.trim() || null,
    cliente_email: form.cliente_email?.trim() || null,
    ...endereco,
    objeto_servico: OS_OBJETO_PADRAO,
    status: "pendente",
  };
}

export function osParaForm(os) {
  if (!os) return null;

  const rua = os.endereco_rua || "";
  const numero = os.endereco_numero || "";
  const bairro = os.endereco_bairro || "";
  const legado = !rua && !numero && !bairro && os.endereco_projeto;

  return {
    responsavel_id: os.responsavel_id || "",
    responsavel_tecnico: os.responsavel_tecnico || "",
    cliente_id: os.cliente_id || "",
    cliente_nome: os.cliente_nome || "",
    cliente_telefone: os.cliente_telefone || "",
    cliente_email: os.cliente_email || "",
    endereco_rua: rua || (legado ? os.endereco_projeto : ""),
    endereco_numero: numero,
    endereco_bairro: bairro,
    objeto_servico: os.objeto_servico || "",
    escopo: Array.isArray(os.escopo) ? os.escopo : [],
    escopo_outros: parseOutrosArray(os.escopo_outro),
    descricao_servicos: os.descricao_servicos || "",
    data_inicio: os.data_inicio?.slice?.(0, 10) || os.data_inicio || "",
    data_entrega_prevista:
      os.data_entrega_prevista?.slice?.(0, 10) ||
      os.data_entrega_prevista ||
      "",
    observacoes_prazos: os.observacoes_prazos || "",
    valor_total: os.valor_total ?? "",
    formas_pagamento: Array.isArray(os.formas_pagamento)
      ? os.formas_pagamento
      : [],
    formas_pagamento_outros: parseOutrosArray(os.forma_pagamento_outro),
    responsabilidades_cliente: os.responsabilidades_cliente || "",
    observacoes_gerais: os.observacoes_gerais || "",
    data_emissao: os.data_emissao?.slice?.(0, 10) || os.data_emissao || "",
  };
}

function textoObjetoPreenchido(os) {
  const texto = String(os?.objeto_servico ?? "").trim();
  if (!texto) return false;
  if (texto === OS_OBJETO_PADRAO) return false;
  return true;
}

function valorTotalPreenchido(os) {
  if (os?.valor_total == null || os?.valor_total === "") return false;
  const n = Number(os.valor_total);
  return !Number.isNaN(n);
}

/** Seções do PDF com numeração dinâmica (somente preenchidas). */
export function buildSecoesPdfOs(os) {
  if (!os) return [];

  const escopoSet = new Set(Array.isArray(os.escopo) ? os.escopo : []);
  const pagamentoSet = new Set(
    Array.isArray(os.formas_pagamento) ? os.formas_pagamento : [],
  );
  const escopoOutros = parseOutrosArray(os.escopo_outro);
  const formasOutros = parseOutrosArray(os.forma_pagamento_outro);

  const secoes = [];

  if (textoObjetoPreenchido(os)) {
    secoes.push({
      id: "objeto",
      titulo: "Objeto do Serviço",
      tipo: "texto",
      conteudo: os.objeto_servico.trim(),
    });
  }

  const escopoMarcado = OS_ESCOPO_OPCOES.filter((op) => escopoSet.has(op.id));
  if (escopoMarcado.length > 0 || escopoOutros.length > 0) {
    secoes.push({
      id: "escopo",
      titulo: "Escopo Contratado",
      tipo: "checkboxes",
      opcoes: escopoMarcado.map((op) => op.label),
      outros: escopoOutros,
    });
  }

  if (campoPreenchido(os.descricao_servicos)) {
    secoes.push({
      id: "descricao",
      titulo: "Descrição dos Serviços",
      tipo: "texto",
      conteudo: os.descricao_servicos.trim(),
    });
  }

  const temPrazos =
    campoPreenchido(os.data_inicio) ||
    campoPreenchido(os.data_entrega_prevista) ||
    campoPreenchido(os.observacoes_prazos);
  if (temPrazos) {
    secoes.push({
      id: "prazos",
      titulo: "Prazos",
      tipo: "prazos",
      data_inicio: os.data_inicio,
      data_entrega_prevista: os.data_entrega_prevista,
      observacoes: os.observacoes_prazos?.trim() || "",
    });
  }

  const temValor =
    valorTotalPreenchido(os) ||
    pagamentoSet.size > 0 ||
    formasOutros.length > 0;
  if (temValor) {
    const pagamentoMarcado = OS_FORMAS_PAGAMENTO.filter((fp) =>
      pagamentoSet.has(fp.id),
    );
    secoes.push({
      id: "valor",
      titulo: "Valor dos Serviços",
      tipo: "valor",
      valor_total: valorTotalPreenchido(os) ? os.valor_total : null,
      opcoes: pagamentoMarcado.map((fp) => fp.label),
      outros: formasOutros,
    });
  }

  if (campoPreenchido(os.responsabilidades_cliente)) {
    secoes.push({
      id: "responsabilidades",
      titulo: "Responsabilidades do Cliente",
      tipo: "texto",
      conteudo: os.responsabilidades_cliente.trim(),
    });
  }

  if (campoPreenchido(os.observacoes_gerais)) {
    secoes.push({
      id: "observacoes",
      titulo: "Observações Gerais",
      tipo: "texto",
      conteudo: os.observacoes_gerais.trim(),
    });
  }

  return secoes;
}
