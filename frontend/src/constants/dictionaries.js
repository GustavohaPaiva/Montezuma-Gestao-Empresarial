export const homeDictionary = {
  greeting: {
    bomDia: "Bom dia",
    boaTarde: "Boa tarde",
    boaNoite: "Boa noite",
  },
  perfis: {
    gestor_master: "Gestor Master",
    diretoria: "Diretoria",
    secretaria: "Secretaria",
    suporte_ti: "Suporte TI",
    encarregado: "Encarregado",
  },
  modulos: {
    processos: "Processos",
    obras: "Obras",
    financeiro: "Financeiro",
    fornecedores: "Fornecedores",
    prestadores: "Prestadores",
    suprimentosServicos: "Suprimentos e Serviços",
    pedidos: "Pedidos",
    projecoes: "Projeções",
    relatoriosSemanais: "Relatórios Semanais",
    ordensServico: "Ordens de Serviço",
    usuariosSistema: "Usuários do sistema",
    categorias: {
      administrativo: "Administrativo",
      operacional: "Operacional",
      financeiro: "Financeiro",
      cadastro: "Cadastro",
      compras: "Compras",
      analise: "Análise",
    },
    descricoes: {
      processos:
        "Gerencie clientes, documentos e licitações com histórico completo e acompanhamento de status.",
      obras:
        "Selecione uma obra para acessar detalhes operacionais, cronogramas e etapas.",
      relatoriosSemanais:
        "Lance e consulte o relatório geral da semana — obra, financeiro e compras.",
      financeiro:
        "Registre entradas e saídas, acompanhe pendências e mantenha a saúde financeira da operação.",
      fornecedores:
        "Cadastre fornecedores, consulte histórico de compras e centralize dados de parceiros.",
      prestadores:
        "Organize equipes terceirizadas, serviços contratados e vínculos com obras e processos.",
      suprimentosServicos:
        "Centralize fornecedores de materiais e prestadores de serviço em um único ponto de acesso.",
      pedidos:
        "Crie e acompanhe pedidos de compra, aprovações e entregas com rastreabilidade total.",
      projecoes:
        "Analise cenários financeiros, projeções de receita e indicadores estratégicos do negócio.",
      ordensServico:
        "Emita solicitações internas e gere PDFs de ordem de serviço para clientes.",
      usuariosSistema:
        "Cadastre usuários internos, permissões de OS e assinaturas digitais para documentos.",
    },
    destaques: {
      processos: ["Clientes", "Documentos", "Licitações"],
      obras: ["Cronogramas", "Etapas", "Detalhes"],
      relatoriosSemanais: ["Semanal", "Geral", "Consolidado"],
      financeiro: ["Entradas", "Saídas", "Pendências"],
      fornecedores: ["Cadastro", "Histórico", "Parceiros"],
      prestadores: ["Equipes", "Serviços", "Vínculos"],
      suprimentosServicos: ["Fornecedores", "Prestadores", "Cadastro"],
      pedidos: ["Compras", "Aprovações", "Entregas"],
      projecoes: ["Cenários", "Indicadores", "Relatórios"],
      ordensServico: ["Solicitações", "PDF", "Pendências"],
      usuariosSistema: ["Cadastro", "Permissões", "Assinaturas"],
    },
    card: {
      acessar: "Acessar módulo",
      stats: {
        processos: "em andamento",
        obrasAtivas: "ativas",
        pendencias: "pendências",
        tarefas: "tarefas urgentes",
      },
    },
  },
  modalFoto: {
    title: "Foto de Perfil",
    chooseImage: "Escolher Imagem",
    changeImage: "Trocar Imagem",
    cancel: "Cancelar",
    savePhoto: "Salvar Foto",
    pickImageError: "Por favor, escolha uma imagem primeiro!",
    missingUserIdError: "Erro: ID do utilizador logado não encontrado.",
    uploadError: "Falha ao salvar a foto. Verifique a consola.",
  },
  hero: {
    brandName: "Montezuma",
    brandTagline: "Gestão Empresarial",
    portalLabel: "Portal interno",
    title: "O que deseja acessar hoje?",
    subtitle:
      "Gestão integrada de obras, processos e finanças — tudo em um só lugar.",
  },
  escritorioAcesso: {
    label: "Meu escritório",
    cta: "Ir ao escritório",
  },
  session: {
    title: "Sua sessão",
    modulesAvailable: "módulos disponíveis",
    profileHint: "Use os módulos abaixo para navegar",
  },
  weeklyAgenda: {
    sectionLabel: "Rotina semanal",
    sectionTitle: "O que fazer esta semana",
    todayBadge: "Hoje",
  },
  salaReunioes: {
    sectionLabel: "Sala única",
    sectionTitle: "Sala de reuniões",
    reservarCta: "Reservar",
    hojeLabel: "Hoje",
    proximasLabel: "Próximas",
    verMais: "Ver mais",
    verMenos: "Ver menos",
    nenhumaHoje: "Nenhuma reunião hoje.",
    nenhumaProxima: "Nenhuma reserva nos próximos dias.",
    loading: "Carregando reservas…",
    modal: {
      createTitle: "Reservar sala",
      editTitle: "Editar reserva",
      tituloLabel: "Assunto",
      tituloPlaceholder: "Ex.: alinhamento comercial",
      clienteLabel: "Cliente (opcional)",
      clientePlaceholder: "Selecione ou digite o cliente",
      clienteVazio: "Nenhum cliente encontrado",
      clienteUsar: 'Usar "{nome}"',
      dataLabel: "Data",
      inicioLabel: "Início",
      fimLabel: "Fim",
      obsLabel: "Observações (opcional)",
      obsPlaceholder: "Pauta, participantes…",
      fechar: "Fechar",
      reservar: "Reservar",
      salvar: "Salvar",
      salvando: "Salvando…",
      cancelarReserva: "Cancelar reserva",
      cancelando: "Cancelando…",
      confirmTitle: "Cancelar reserva",
      confirmCancelar: "Tem certeza que deseja cancelar esta reserva da sala?",
      confirmAction: "Confirmar",
      tituloObrigatorio: "Informe o assunto da reunião.",
      horarioObrigatorio: "Informe data e horários.",
      fimAposInicio: "O horário de fim deve ser após o início.",
      duracaoMinima: "A reunião deve ter no mínimo 30 minutos.",
      erroSalvar: "Não foi possível salvar a reserva.",
      erroCancelar: "Não foi possível cancelar a reserva.",
    },
  },
  dashboard: {
    sectionTitle: "Resumo rápido",
    updatedLabel: "Atualizado agora",
    modulesSection: "Módulos",
    kpis: {
      obrasAtivas: "Obras ativas",
      processos: "Processos em andamento",
      pendencias: "Pendências financeiras",
      tarefas: "Tarefas urgentes",
    },
    kpiStatusLabels: {
      Prefeitura: "Prefeitura",
      Caixa: "Caixa",
      Cartorio: "Cartório",
      Obra: "Obra",
    },
  },
  footer: "Montezuma · Sistema de Gestão Empresarial",
  moduleHub: {
    acessosLabel: "Navegação",
    acessosTitulo: "O que deseja acessar?",
  },
  suprimentosServicosHub: {
    eyebrow: "Cadastro",
    subtitulo:
      "Gerencie parceiros de materiais e equipes de serviço em um só lugar.",
    fornecedoresDescricao: "Cadastro e histórico de fornecedores de materiais.",
    prestadoresDescricao:
      "Equipes terceirizadas e serviços vinculados às obras.",
    metricFornecedores: "Fornecedores",
    metricPrestadores: "Prestadores",
  },
};

export const obrasDictionary = {
  errors: {
    create: "Erro ao criar obra.",
    update: "Erro ao atualizar a obra.",
    remove: "Erro ao remover obra.",
  },
  confirm: {
    remove: "Tem certeza que deseja remover esta obra?",
  },
  metrics: {
    total: "Total de Obras",
    waiting: "Aguardando",
    progress: "Em Andamento",
    done: "Concluídas",
  },
  empty: "Nenhuma obra encontrada.",
};
