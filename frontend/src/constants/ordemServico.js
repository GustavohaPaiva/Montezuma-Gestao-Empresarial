import { ID_VOGELKOP } from "./escritorios";

export const OS_SUBCLASSES = {
  gestor: "gestor_os",
  emissorGestor: "emissor_os_gestor",
  emissorEncarregado: "emissor_os_encarregado",
};

export const OS_STATUS = {
  pendente: "pendente",
  concluida: "concluida",
};

export const OS_STATUS_LABEL = {
  pendente: "Pendente",
  concluida: "Concluída",
};

export const OS_ESCOPO_OPCOES = [
  { id: "levantamento", label: "Levantamento Arquitetônico" },
  { id: "estudo_preliminar", label: "Estudo Preliminar" },
  { id: "anteprojeto", label: "Anteprojeto" },
  { id: "projeto_executivo", label: "Projeto Executivo" },
  { id: "projeto_interiores", label: "Projeto de Interiores" },
  { id: "modelagem_3d", label: "Modelagem 3D" },
  { id: "imagens_renderizadas", label: "Imagens Renderizadas" },
  { id: "compatibilizacao", label: "Compatibilização de Projetos" },
  { id: "acompanhamento_obra", label: "Acompanhamento de Obra" },
  { id: "consultoria_tecnica", label: "Consultoria Técnica" },
];

export const OS_FORMAS_PAGAMENTO = [
  { id: "pix", label: "PIX" },
  { id: "transferencia", label: "Transferência Bancária" },
  { id: "cartao", label: "Cartão" },
  { id: "boleto", label: "Boleto" },
];

export const OS_OBJETO_PADRAO =
  "Prestação de serviços de arquitetura referente ao projeto localizado no endereço acima, conforme escopo descrito nesta Ordem de Serviço.";

export const OS_RESPONSABILIDADES_CLIENTE = [
  "Fornecer informações e documentos necessários para o desenvolvimento dos serviços.",
  "Aprovar etapas dentro dos prazos estabelecidos.",
  "Comunicar alterações ou solicitações adicionais por escrito.",
];

export const OS_OBSERVACOES_GERAIS_PADRAO = [
  "Alterações não previstas no escopo poderão gerar custos adicionais.",
  "Os prazos poderão ser ajustados em caso de atrasos nas aprovações ou fornecimento de informações pelo cliente.",
  "Esta Ordem de Serviço complementa as condições comerciais acordadas entre as partes.",
];

export function prefixoPdfOrdemServico(escritorioId) {
  return escritorioId === ID_VOGELKOP ? "VogelKop" : "Montezuma";
}

export function emptyOrdemServicoForm() {
  return {
    responsavel_id: "",
    responsavel_tecnico: "",
    cliente_id: "",
    cliente_nome: "",
    cliente_telefone: "",
    cliente_email: "",
    endereco_projeto: "",
    objeto_servico: OS_OBJETO_PADRAO,
    escopo: [],
    escopo_outro: "",
    descricao_servicos: "",
    data_inicio: "",
    data_entrega_prevista: "",
    observacoes_prazos: "",
    valor_total: "",
    formas_pagamento: [],
    forma_pagamento_outro: "",
    observacoes_gerais: OS_OBSERVACOES_GERAIS_PADRAO.join("\n"),
    data_emissao: new Date().toISOString().slice(0, 10),
  };
}
