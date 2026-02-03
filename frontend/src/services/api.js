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

    return {
      ...data,
      materiais: data.materiais || [],
      maoDeObra: data.maoDeObra || [],
      relatorioCliente: data.relatorioCliente || [],
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

  addMaterial: async (dados) => {
    // Salva na tabela de materiais
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

    // Alimenta a tabela de relatório para cliente
    await supabase.from("relatorio_cliente").insert([
      {
        obra_id: dados.obra_id,
        descricao: dados.material,
        tipo: "Material",
        quantidade: dados.quantidade,
        data: dados.data_solicitacao,
        valor: 0,
      },
    ]);
    return data[0];
  },

  addMaoDeObra: async (dados) => {
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

    await supabase.from("relatorio_cliente").insert([
      {
        obra_id: dados.obra_id,
        descricao: `${dados.tipo} - ${dados.profissional}`,
        tipo: "Mão de Obra",
        quantidade: 1,
        data: dados.data_solicitacao,
        valor: dados.valor,
      },
    ]);
    return data[0];
  },
};
