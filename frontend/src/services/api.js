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

  // --- CORREÇÃO: Deleta o material e busca o vínculo no extrato pelo ID ---
  deleteMaterial: async (id) => {
    // 1. Apaga da tabela de materiais
    const { error } = await supabase
      .from("relatorio_materiais")
      .delete()
      .eq("id", id);
    if (error) throw error;

    // 2. Apaga da tabela de extrato onde a coluna 'material_id' for igual ao ID
    // Isso garante que apague EXATAMENTE este item, mesmo que tenham outros com mesmo nome
    const { error: errorExtrato } = await supabase
      .from("relatorio_extrato")
      .delete()
      .eq("material_id", id);

    if (errorExtrato) console.error("Erro ao limpar extrato:", errorExtrato);
  },

  // --- CORREÇÃO: Deleta mão de obra e vínculo no extrato ---
  deleteMaoDeObra: async (id) => {
    const { error } = await supabase
      .from("relatorio_mao_de_obra")
      .delete()
      .eq("id", id);
    if (error) throw error;

    // Apaga do extrato onde 'mao_de_obra_id' for igual
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

  // --- LÓGICA PRINCIPAL DE DUPLICATAS ---
  updateMaterialValor: async (id, novoValor) => {
    // 1. Atualiza na tabela de materiais
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ valor: novoValor })
      .eq("id", id)
      .select("*");

    if (error) throw error;
    const materialAtualizado = data[0];

    if (materialAtualizado) {
      // 2. Verifica se JÁ EXISTE no extrato vinculado pelo ID (não pelo nome)
      const { data: extratoData } = await supabase
        .from("relatorio_extrato")
        .select("*")
        .eq("material_id", id) // Busca pelo ID
        .maybeSingle();

      if (extratoData) {
        // Se achou pelo ID, atualiza essa linha específica
        await supabase
          .from("relatorio_extrato")
          .update({
            valor: novoValor,
            descricao: materialAtualizado.material,
          })
          .eq("id", extratoData.id);
      } else if (parseFloat(novoValor) > 0) {
        // Se não achou e tem valor, cria gravando o material_id
        await supabase.from("relatorio_extrato").insert([
          {
            obra_id: materialAtualizado.obra_id,
            material_id: materialAtualizado.id, // GRAVA O ID AQUI
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

  // --- CORREÇÃO: Validação de Mão de Obra usando ID ---
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
          mao_de_obra_id: id, // GRAVA O ID AQUI TAMBÉM
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
