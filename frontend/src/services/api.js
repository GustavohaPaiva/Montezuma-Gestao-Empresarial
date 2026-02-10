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

  // --- ALTERADO: Deleta Material e remove do Extrato ---
  deleteMaterial: async (id) => {
    // 1. Busca os dados do material antes de excluir para ter a descrição
    const { data: material } = await supabase
      .from("relatorio_materiais")
      .select("*")
      .eq("id", id)
      .single();

    // 2. Deleta da tabela de materiais
    const { error } = await supabase
      .from("relatorio_materiais")
      .delete()
      .eq("id", id);
    if (error) throw error;

    // 3. Se existia o material, deleta o correspondente no extrato
    if (material) {
      await supabase.from("relatorio_extrato").delete().match({
        obra_id: material.obra_id,
        descricao: material.material,
        tipo: "Material",
      });
    }
  },

  // --- ALTERADO: Deleta Mão de Obra e remove do Extrato ---
  deleteMaoDeObra: async (id) => {
    // 1. Busca os dados antes de excluir
    const { data: mdo } = await supabase
      .from("relatorio_mao_de_obra")
      .select("*")
      .eq("id", id)
      .single();

    // 2. Deleta da tabela de mão de obra
    const { error } = await supabase
      .from("relatorio_mao_de_obra")
      .delete()
      .eq("id", id);
    if (error) throw error;

    // 3. Se existia, recria a descrição usada no extrato e deleta
    if (mdo) {
      const descricaoExtrato = `${mdo.tipo} - ${mdo.profissional}`;

      await supabase.from("relatorio_extrato").delete().match({
        obra_id: mdo.obra_id,
        descricao: descricaoExtrato,
        tipo: "Mão de Obra",
      });
    }
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

  updateMaterialValor: async (id, novoValor) => {
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ valor: novoValor })
      .eq("id", id)
      .select("*");

    if (error) throw error;
    const materialAtualizado = data[0];

    if (materialAtualizado) {
      // Verifica se já existe no extrato
      const { data: extratoData } = await supabase
        .from("relatorio_extrato")
        .select("id")
        .match({
          obra_id: materialAtualizado.obra_id,
          descricao: materialAtualizado.material,
          tipo: "Material",
        });

      if (extratoData && extratoData.length > 0) {
        // Já existe: Atualiza
        await supabase
          .from("relatorio_extrato")
          .update({ valor: novoValor })
          .eq("id", extratoData[0].id);
      } else if (parseFloat(novoValor) > 0) {
        // NÃO existe e valor > 0: CRIA AGORA
        await supabase.from("relatorio_extrato").insert([
          {
            obra_id: materialAtualizado.obra_id,
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
    const statusInicial = "Aguardando pagamento";

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
          status_financeiro: statusInicial,
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
