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
    meuEscritorio: "Meu Escritório",
    processos: "Processos",
    obras: "Obras",
    financeiro: "Financeiro",
    fornecedores: "Fornecedores",
    prestadores: "Prestadores",
    pedidos: "Pedidos",
    projecoes: "Projeções",
    categorias: {
      escritorio: "Escritório",
      administrativo: "Administrativo",
      operacional: "Operacional",
      financeiro: "Financeiro",
      cadastro: "Cadastro",
      compras: "Compras",
      analise: "Análise",
    },
    descricoes: {
      meuEscritorio:
        "Acompanhe reuniões, visitas e compromissos dos escritórios Vogelkop e Ybyoca em tempo real.",
      processos:
        "Gerencie clientes, documentos e licitações com histórico completo e acompanhamento de status.",
      obras:
        "Controle cronogramas, etapas construtivas e pedidos vinculados a cada obra em execução.",
      financeiro:
        "Registre entradas e saídas, acompanhe pendências e mantenha a saúde financeira da operação.",
      fornecedores:
        "Cadastre fornecedores, consulte histórico de compras e centralize dados de parceiros.",
      prestadores:
        "Organize equipes terceirizadas, serviços contratados e vínculos com obras e processos.",
      pedidos:
        "Crie e acompanhe pedidos de compra, aprovações e entregas com rastreabilidade total.",
      projecoes:
        "Analise cenários financeiros, projeções de receita e indicadores estratégicos do negócio.",
    },
    destaques: {
      meuEscritorio: ["Agenda", "Reuniões", "Visitas"],
      processos: ["Clientes", "Documentos", "Licitações"],
      obras: ["Cronogramas", "Etapas", "Pedidos"],
      financeiro: ["Entradas", "Saídas", "Pendências"],
      fornecedores: ["Cadastro", "Histórico", "Parceiros"],
      prestadores: ["Equipes", "Serviços", "Vínculos"],
      pedidos: ["Compras", "Aprovações", "Entregas"],
      projecoes: ["Cenários", "Indicadores", "Relatórios"],
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
  session: {
    title: "Sessão ativa",
    modulesAvailable: "módulos disponíveis",
    fullAccess: "Perfil com acesso completo",
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
    kpiHints: {
      obrasAtivas: "{emAndamento} em andamento · {aguardando} aguardando iniciação",
      processosEmpty: "Nenhum processo em trâmite",
      pendencias: "{entradas} entradas · {saidas} saídas · {mesReferencia}",
      tarefas: "Alta prioridade ou vencimento em até 2 dias",
    },
    kpiStatusLabels: {
      Prefeitura: "Prefeitura",
      Caixa: "Caixa",
      Cartorio: "Cartório",
      Obra: "Obra",
    },
  },
  footer: "Montezuma · Sistema de Gestão Empresarial",
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
