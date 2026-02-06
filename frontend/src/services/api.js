import { supabase } from "./supabase";

export const api = {
  getObras: async () => {
    const { data, error } = await supabase
      .from("obras")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
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
          status: "Em andamento",
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

  getObraById: async (id) => {
    const { data, error } = await supabase
      .from("obras")
      .select(
        `*, materiais:relatorio_materiais(*), maoDeObra:relatorio_mao_de_obra(*), relatorioExtrato:relatorio_extrato(*)`,
      )
      .eq("id", id)
      .single();
    if (error) throw error;

    // Ordenação do Extrato pela Data de Lançamento (Decrescente: Mais novo no topo)
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

  updateMaterialValor: async (id, novoValor) => {
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ valor: novoValor })
      .eq("id", id)
      .select();

    if (error) throw error;

    const materialAtualizado = data[0];

    if (materialAtualizado) {
      const { data: extratoData, error: extratoError } = await supabase
        .from("relatorio_extrato")
        .select("id")
        .match({
          obra_id: materialAtualizado.obra_id,
          descricao: materialAtualizado.material,
          tipo: "Material",
        });

      if (extratoError) {
        console.error("Erro ao verificar extrato:", extratoError);
        return materialAtualizado;
      }

      if (extratoData && extratoData.length > 0) {
        await supabase
          .from("relatorio_extrato")
          .update({ valor: novoValor })
          .eq("id", extratoData[0].id);
      } else if (parseFloat(novoValor) > 0) {
        await supabase.from("relatorio_extrato").insert([
          {
            obra_id: materialAtualizado.obra_id,
            descricao: materialAtualizado.material,
            tipo: "Material",
            quantidade: materialAtualizado.quantidade,
            data: new Date().toISOString(),
            valor: novoValor,
            validacao: 0, // Inicia como não selecionado
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

  // --- NOVAS FUNÇÕES PARA VALIDAÇÃO DO EXTRATO ---

  // Atualiza um item individual
  updateExtratoValidacao: async (id, status) => {
    const { error } = await supabase
      .from("relatorio_extrato")
      .update({ validacao: status })
      .eq("id", id);
    if (error) throw error;
  },

  // Atualiza TODOS os itens de uma obra (Select All)
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
          data_solicitacao: dados.data_solicitacao,
        },
      ])
      .select();

    if (error) throw error;

    if (parseFloat(dados.valor) > 0) {
      const { error: errorExtrato } = await supabase
        .from("relatorio_extrato")
        .insert([
          {
            obra_id: dados.obra_id,
            descricao: dados.material,
            tipo: "Material",
            quantidade: dados.quantidade,
            data: new Date().toISOString(),
            valor: dados.valor,
            validacao: 0, // Padrão 0
          },
        ]);

      if (errorExtrato) throw errorExtrato;
    }

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
          descricao: `${dadosOriginais.tipo} - ${dadosOriginais.profissional}`,
          tipo: "Mão de Obra",
          quantidade: "1",
          data: dadosOriginais.data_solicitacao || new Date(),
          valor: valorParaExtrato,
          validacao: 0, // Padrão 0
        },
      ]);
    if (errorExtrato) throw errorExtrato;
    return true;
  },
};
