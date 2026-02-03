import { supabase } from "./supabase";

export const api = {
  getObras: async () => {
    const { data, error } = await supabase
      .from("obras")
      .select("*")
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
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  getObraById: async (id) => {
    const { data, error } = await supabase
      .from("obras")
      .select(
        `
        *,
        materiais:relatorio_materiais(*),
        maoDeObra:relatorio_mao_de_obra(*),
        relatorioCliente:relatorio_cliente(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    // Ordena o relatório do cliente por data (opcional, mas bom para organização)
    const relatorioOrdenado = (data.relatorioCliente || []).sort(
      (a, b) => new Date(b.data) - new Date(a.data),
    );

    return {
      ...data,
      materiais: data.materiais || [],
      maoDeObra: data.maoDeObra || [],
      relatorioCliente: relatorioOrdenado,
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

  // --- NOVA FUNÇÃO DE EDITAR VALOR ---
  updateValorRelatorioCliente: async (id, novoValor) => {
    const { data, error } = await supabase
      .from("relatorio_cliente")
      .update({ valor: novoValor })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  },
  // -----------------------------------

  addMaterial: async (dados) => {
    // 1. Salva na tabela de materiais
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .insert([
        {
          obra_id: dados.obra_id,
          material: dados.material,
          quantidade: dados.quantidade,
          data_solicitacao: dados.data_solicitacao,
        },
      ])
      .select();
    if (error) throw error;

    // 2. Alimenta tabela cliente e VERIFICA ERRO
    const { error: errorCliente } = await supabase
      .from("relatorio_cliente")
      .insert([
        {
          obra_id: dados.obra_id,
          descricao: dados.material,
          tipo: "Material",
          quantidade: dados.quantidade,
          data: dados.data_solicitacao,
          valor: 0,
        },
      ]);

    if (errorCliente) {
      console.error("Erro insert cliente:", errorCliente);
      throw errorCliente;
    }
    return data[0];
  },

  addMaoDeObra: async (dados) => {
    // 1. Salva na tabela mão de obra
    const { data, error } = await supabase
      .from("relatorio_mao_de_obra")
      .insert([
        {
          obra_id: dados.obra_id,
          tipo: dados.tipo,
          profissional: dados.profissional,
          valor: dados.valor,
          data_solicitacao: dados.data_solicitacao,
        },
      ])
      .select();
    if (error) throw error;

    // 2. Alimenta tabela cliente e VERIFICA ERRO
    const { error: errorCliente } = await supabase
      .from("relatorio_cliente")
      .insert([
        {
          obra_id: dados.obra_id,
          descricao: `${dados.tipo} - ${dados.profissional}`,
          tipo: "Mão de Obra",
          quantidade: "1",
          data: dados.data_solicitacao,
          valor: dados.valor,
        },
      ]);

    if (errorCliente) {
      console.error("Erro insert cliente:", errorCliente);
      throw errorCliente;
    }
    return data[0];
  },
};
