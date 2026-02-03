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
    const { data: obra, error: erroObra } = await supabase
      .from("obras")
      .select("*")
      .eq("id", id)
      .single();
    if (erroObra) throw erroObra;

    const { data: materiais } = await supabase
      .from("relatorio_materiais")
      .select("*")
      .eq("obra_id", id);
    const { data: maoDeObra } = await supabase
      .from("relatorio_mao_de_obra")
      .select("*")
      .eq("obra_id", id);
    const { data: relatorioCliente } = await supabase
      .from("relatorio_cliente")
      .select("*")
      .eq("obra_id", id);

    return {
      ...obra,
      materiais: materiais || [],
      maoDeObra: maoDeObra || [],
      relatorioCliente: relatorioCliente || [],
    };
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
    // Salva na tabela de mão de obra
    const { data, error } = await supabase
      .from("relatorio_mao_de_obra")
      .insert([
        {
          obra_id: dados.obra_id,
          tipo: dados.tipo,
          valor: dados.valor,
          data_solicitacao: dados.data_solicitacao,
        },
      ])
      .select();
    if (error) throw error;

    // Alimenta a tabela de relatório para cliente
    await supabase.from("relatorio_cliente").insert([
      {
        obra_id: dados.obra_id,
        descricao: `${dados.servico}`,
        tipo: "Mão de Obra",
        quantidade: 1,
        data: dados.data_servico,
        valor: dados.valor_estimado,
      },
    ]);
    return data[0];
  },
};
