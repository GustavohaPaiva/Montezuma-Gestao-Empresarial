import { supabase } from "./supabase";

export const api = {
  // --- MÓDULO FINANCEIRO ---

  getFinanceiro: async (tabela, escritorioId, mes, ano) => {
    const primeiroDia = `${ano}-${mes}-01`;
    const ultimoDia = new Date(ano, parseInt(mes), 0).getDate();
    const dataFim = `${ano}-${mes}-${ultimoDia}`;

    let query = supabase.from(tabela).select("*");

    // LÓGICA DE FILTRO NOVA:
    if (escritorioId === "Montezuma") {
      query = query.eq("montezuma", true); // Filtra pela nova coluna
    } else {
      query = query.eq("escritorio_id", escritorioId);
    }

    const { data, error } = await query
      .gte("data", primeiroDia)
      .lte("data", dataFim)
      .order("data", { ascending: true });

    if (error) throw error;
    return data;
  },

  createFinanceiro: async (tabela, dadosBase) => {
    let registros = [];
    const isParcelado = dadosBase.formaPagamento === "Parcelado";
    const grupoId = isParcelado ? `grp_${Date.now()}` : null;

    // Define se é Montezuma ou Escritório Pessoal
    const isMontezuma = dadosBase.escritorio_id === "Montezuma";

    const prepararDado = (valor, dataParcela, index, total) => ({
      descricao: dadosBase.descricao,
      forma: isParcelado
        ? `Parcelado (${index}/${total})`
        : dadosBase.formaPagamento,
      valor: valor,
      data: dataParcela,
      // Se for Montezuma, preenche a coluna nova. Se não, preenche o UUID.
      montezuma: isMontezuma ? true : false,
      escritorio_id: isMontezuma ? null : dadosBase.escritorio_id,
      grupo_id: grupoId,
      validacao: 0,
    });

    if (isParcelado) {
      const parcelas = parseInt(dadosBase.parcelas.replace("X", ""));
      const valorParcela = parseFloat(dadosBase.valor) / parcelas;
      for (let i = 1; i <= parcelas; i++) {
        let d = new Date(dadosBase.data + "T12:00:00");
        d.setMonth(d.getMonth() + (i - 1));
        registros.push(
          prepararDado(
            valorParcela,
            d.toISOString().split("T")[0],
            i,
            parcelas,
          ),
        );
      }
    } else {
      registros.push(prepararDado(parseFloat(dadosBase.valor), dadosBase.data));
    }

    const { data, error } = await supabase
      .from(tabela)
      .insert(registros)
      .select();
    if (error) throw error;
    return data;
  },

  updateFinanceiro: async (tabela, id, dados) => {
    const { data, error } = await supabase
      .from(tabela)
      .update(dados)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteFinanceiro: async (tabela, id) => {
    const { data: item } = await supabase
      .from(tabela)
      .select("grupo_id")
      .eq("id", id)
      .single();

    if (item?.grupo_id) {
      const { error } = await supabase
        .from(tabela)
        .delete()
        .eq("grupo_id", item.grupo_id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(tabela).delete().eq("id", id);
      if (error) throw error;
    }
  },

  // --- MÓDULO ORÇAMENTOS ---

  getOrcamentos: async (escritorioId) => {
    let query = supabase
      .from("orcamentos")
      .select("*")
      .order("data", { ascending: false });

    if (escritorioId) {
      query = query.eq("escritorio_id", escritorioId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  createOrcamento: async (novoOrcamento) => {
    const { data, error } = await supabase
      .from("orcamentos")
      .insert([
        {
          nome: novoOrcamento.nome,
          valor: novoOrcamento.valor,
          data: novoOrcamento.data,
          status: novoOrcamento.status || "Pendente",
          escritorio_id: novoOrcamento.escritorio_id,
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateOrcamento: async (id, dados) => {
    const { data, error } = await supabase
      .from("orcamentos")
      .update(dados)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteOrcamento: async (id) => {
    const { error } = await supabase.from("orcamentos").delete().eq("id", id);
    if (error) throw error;
  },

  // --- MÓDULO CLIENTES ---

  getClientes: async (escritorioId) => {
    let query = supabase
      .from("clientes")
      .select("*")
      .order("data", { ascending: false });

    if (escritorioId) {
      query = query.eq("escritorio_id", escritorioId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  createCliente: async (novoCliente) => {
    const { data, error } = await supabase
      .from("clientes")
      .insert([
        {
          nome: novoCliente.nome,
          tipo: novoCliente.tipo,
          status: novoCliente.status || "Produção",
          pagamento: novoCliente.pagamento,
          valor_pago: novoCliente.valor_pago,
          escritorio_id: novoCliente.escritorio_id,
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateCliente: async (id, dados) => {
    const { data, error } = await supabase
      .from("clientes")
      .update(dados)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteCliente: async (id) => {
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) throw error;
  },

  // --- MÓDULO OBRAS ---

  getObras: async () => {
    let query = supabase
      .from("obras")
      // Adicionamos o extrato na busca!
      .select(
        "*, materiais:relatorio_materiais(*), maoDeObra:relatorio_mao_de_obra(*), extrato:relatorio_extrato(*)",
      )
      .eq("active", true)
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  createObra: async (novaObra) => {
    const { data, error } = await supabase
      .from("obras")
      .insert([
        {
          cliente: novaObra.cliente,
          local: novaObra.local,
          status: "Aguardando iniciação",
          active: true,
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateObra: async (id, dados) => {
    const { data, error } = await supabase
      .from("obras")
      .update(dados)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteObra: async (id) => {
    const { error } = await supabase
      .from("obras")
      .update({ active: false })
      .eq("id", id);
    if (error) throw error;
  },

  // --- MÓDULO RELATÓRIOS E MATERIAIS ---

  deleteMaterial: async (id) => {
    const { error } = await supabase
      .from("relatorio_materiais")
      .delete()
      .eq("id", id);
    if (error) throw error;

    const { error: errorExtrato } = await supabase
      .from("relatorio_extrato")
      .delete()
      .eq("material_id", id);

    if (errorExtrato) console.error("Erro ao limpar extrato:", errorExtrato);
  },

  deleteMaoDeObra: async (id) => {
    const { error } = await supabase
      .from("relatorio_mao_de_obra")
      .delete()
      .eq("id", id);
    if (error) throw error;

    const { error: errorExtrato } = await supabase
      .from("relatorio_extrato")
      .delete()
      .eq("mao_de_obra_id", id);

    if (errorExtrato)
      console.error("Erro ao limpar extrato MDO:", errorExtrato);
  },

  getObraById: async (id) => {
    const { data, error } = await supabase
      .from("obras")
      .select(
        `*, materiais:relatorio_materiais(*), maoDeObra:relatorio_mao_de_obra(*), relatorioExtrato:relatorio_extrato(*)`,
      )
      .eq("id", id)
      .single();
    if (error) throw error;

    const relatorioOrdenado = (data.relatorioExtrato || []).sort(
      (a, b) => new Date(b.data) - new Date(a.data),
    );
    return {
      ...data,
      materiais: data.materiais || [],
      maoDeObra: data.maoDeObra || [],
      relatorioExtrato: relatorioOrdenado,
    };
  },

  updateMaterialStatus: async (id, novoStatus) => {
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ status: novoStatus })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateMaterialFornecedor: async (id, novoFornecedor) => {
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ fornecedor: novoFornecedor })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateMaterialValor: async (id, novoValor) => {
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ valor: novoValor })
      .eq("id", id)
      .select("*");

    if (error) throw error;
    const materialAtualizado = data[0];

    if (materialAtualizado) {
      const { data: extratoData } = await supabase
        .from("relatorio_extrato")
        .select("*")
        .eq("material_id", id)
        .maybeSingle();

      if (extratoData) {
        await supabase
          .from("relatorio_extrato")
          .update({
            valor: novoValor,
            descricao: materialAtualizado.material,
          })
          .eq("id", extratoData.id);
      } else if (parseFloat(novoValor) > 0) {
        await supabase.from("relatorio_extrato").insert([
          {
            obra_id: materialAtualizado.obra_id,
            material_id: materialAtualizado.id,
            descricao: materialAtualizado.material,
            tipo: "Material",
            quantidade: materialAtualizado.quantidade,
            data:
              materialAtualizado.data_solicitacao || new Date().toISOString(),
            valor: novoValor,
            validacao: 0,
            status_financeiro:
              materialAtualizado.status_financeiro || "Aguardando pagamento",
          },
        ]);
      }
    }
    return materialAtualizado;
  },

  updateValorRelatorioExtrato: async (id, novoValor) => {
    const { data, error } = await supabase
      .from("relatorio_extrato")
      .update({ valor: novoValor })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateExtratoStatusFinanceiro: async (id, novoStatus) => {
    const { data, error } = await supabase
      .from("relatorio_extrato")
      .update({ status_financeiro: novoStatus })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateExtratoValidacao: async (id, status) => {
    const { error } = await supabase
      .from("relatorio_extrato")
      .update({ validacao: status })
      .eq("id", id);
    if (error) throw error;
  },

  updateExtratoValidacaoAll: async (obraId, status) => {
    const { error } = await supabase
      .from("relatorio_extrato")
      .update({ validacao: status })
      .eq("obra_id", obraId);
    if (error) throw error;
  },

  addMaterial: async (dados) => {
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .insert([
        {
          obra_id: dados.obra_id,
          material: dados.material,
          quantidade: dados.quantidade,
          valor: dados.valor,
          fornecedor: dados.fornecedor,
          data_solicitacao: dados.data_solicitacao,
          status_financeiro: "Aguardando pagamento",
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  addMaoDeObra: async (dados) => {
    const saldoInicial = (dados.valor_orcado || 0) - (dados.valor_pago || 0);
    const { data, error } = await supabase
      .from("relatorio_mao_de_obra")
      .insert([
        {
          obra_id: dados.obra_id,
          tipo: dados.tipo,
          profissional: dados.profissional,
          data_solicitacao: dados.data_solicitacao,
          valor_cobrado: dados.valor_cobrado,
          valor_orcado: dados.valor_orcado,
          valor_pago: dados.valor_pago,
          saldo: saldoInicial,
          validacao: 0,
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateMaoDeObraFinanceiro: async (id, dadosFinanceiros) => {
    const novoSaldo =
      (dadosFinanceiros.valor_orcado || 0) - (dadosFinanceiros.valor_pago || 0);
    const { data, error } = await supabase
      .from("relatorio_mao_de_obra")
      .update({
        valor_orcado: dadosFinanceiros.valor_orcado,
        valor_pago: dadosFinanceiros.valor_pago,
        saldo: novoSaldo,
      })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  validarMaoDeObra: async (id, dadosOriginais) => {
    const { error } = await supabase
      .from("relatorio_mao_de_obra")
      .update({ validacao: 1 })
      .eq("id", id);
    if (error) throw error;

    const valorParaExtrato =
      dadosOriginais.valor_pago > 0
        ? dadosOriginais.valor_pago
        : dadosOriginais.valor_cobrado;

    const { error: errorExtrato } = await supabase
      .from("relatorio_extrato")
      .insert([
        {
          obra_id: dadosOriginais.obra_id,
          mao_de_obra_id: id,
          descricao: `${dadosOriginais.tipo} - ${dadosOriginais.profissional}`,
          tipo: "Mão de Obra",
          quantidade: "1",
          data: dadosOriginais.data_solicitacao || new Date(),
          valor: valorParaExtrato,
          validacao: 0,
          status_financeiro: "Aguardando pagamento",
        },
      ]);
    if (errorExtrato) throw errorExtrato;
    return true;
  },
};
