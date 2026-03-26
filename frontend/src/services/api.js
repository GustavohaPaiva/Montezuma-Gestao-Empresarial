import { supabase } from "./supabase";

export const api = {
  // --- MÓDULO FINANCEIRO ---

  getFinanceiro: async (tabela, escritorioId, mes, ano) => {
    const primeiroDia = `${ano}-${mes}-01`;
    const ultimoDia = new Date(ano, parseInt(mes), 0).getDate();
    const dataFim = `${ano}-${mes}-${ultimoDia}`;

    let query = supabase.from(tabela).select("*");

    if (escritorioId === "Montezuma") {
      query = query.eq("montezuma", true);
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
    const isMontezuma = dadosBase.escritorio_id === "Montezuma";

    const prepararDado = (valor, dataParcela, index, total) => ({
      descricao: dadosBase.descricao,
      forma: isParcelado
        ? `Parcelado (${index}/${total})`
        : dadosBase.formaPagamento,
      valor: valor,
      data: dataParcela,
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
    const {
      alterar_todas_parcelas,
      diferenca_proxima_parcela,
      ratear_diferenca_todas,
      ...dadosLimpos
    } = dados;

    if (
      alterar_todas_parcelas ||
      diferenca_proxima_parcela !== undefined ||
      ratear_diferenca_todas !== undefined
    ) {
      const { data: itemAtual } = await supabase
        .from(tabela)
        .select("grupo_id, data")
        .eq("id", id)
        .single();

      if (itemAtual?.grupo_id) {
        if (alterar_todas_parcelas && dadosLimpos.valor !== undefined) {
          await supabase
            .from(tabela)
            .update({ valor: dadosLimpos.valor })
            .eq("grupo_id", itemAtual.grupo_id)
            .gt("data", itemAtual.data);
        } else if (diferenca_proxima_parcela !== undefined) {
          const { data: proximaParcela } = await supabase
            .from(tabela)
            .select("id, valor")
            .eq("grupo_id", itemAtual.grupo_id)
            .gt("data", itemAtual.data)
            .order("data", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (proximaParcela) {
            const novoValorProxima =
              parseFloat(proximaParcela.valor) +
              parseFloat(diferenca_proxima_parcela);
            await supabase
              .from(tabela)
              .update({ valor: novoValorProxima })
              .eq("id", proximaParcela.id);
          }
        } else if (ratear_diferenca_todas !== undefined) {
          const { data: parcelasRestantes } = await supabase
            .from(tabela)
            .select("id, valor")
            .eq("grupo_id", itemAtual.grupo_id)
            .gt("data", itemAtual.data);

          if (parcelasRestantes && parcelasRestantes.length > 0) {
            const diffPorParcela =
              parseFloat(ratear_diferenca_todas) / parcelasRestantes.length;
            for (const parcela of parcelasRestantes) {
              const novoValorParcela =
                parseFloat(parcela.valor) + diffPorParcela;
              await supabase
                .from(tabela)
                .update({ valor: novoValorParcela })
                .eq("id", parcela.id);
            }
          }
        }
      }
    }

    const { data, error } = await supabase
      .from(tabela)
      .update(dadosLimpos)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteFinanceiro: async (tabela, id, excluirTodas = false) => {
    if (excluirTodas) {
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
        return;
      }
    }

    // Cai aqui se for item único ou se o usuário selecionou "Apenas Esta"
    const { error } = await supabase.from(tabela).delete().eq("id", id);
    if (error) throw error;
  },

  // --- MÓDULO ORÇAMENTOS ---

  getOrcamentos: async (escritorioId) => {
    let query = supabase
      .from("orcamentos")
      .select("*")
      .order("data", { ascending: false });
    if (escritorioId) query = query.eq("escritorio_id", escritorioId);
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

  // --- MÓDULO CLIENTES E LOGIN CLIENTE ---

  loginClientePorNomeEBairro: async (nomeCliente, bairroObra) => {
    const { data, error } = await supabase.rpc("buscar_dados_cliente", {
      p_nome: nomeCliente,
      p_bairro: bairroObra,
    });
    if (error) {
      console.error("Erro na busca do cliente via RPC:", error);
      throw error;
    }
    return data && data.length > 0 ? data[0] : null;
  },

  getClientes: async (escritorioId) => {
    let query = supabase
      .from("clientes")
      .select("*")
      .order("data", { ascending: false });
    if (escritorioId) query = query.eq("escritorio_id", escritorioId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getClienteById: async (idOuNome) => {
    if (!isNaN(idOuNome) && idOuNome !== null && idOuNome !== "") {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "obter_cliente_por_id",
        { p_id: parseInt(idOuNome) },
      );
      if (!rpcError && rpcData && rpcData.length > 0) return rpcData[0];
    }
    let query = supabase.from("clientes").select("*");
    if (!isNaN(idOuNome) && idOuNome !== null && idOuNome !== "")
      query = query.eq("id", idOuNome);
    else query = query.eq("nome", idOuNome);

    const { data, error } = await query.maybeSingle();
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

  uploadFotoCliente: async (clienteId, file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${clienteId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("fotos_clientes")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("fotos_clientes")
        .getPublicUrl(fileName);
      const fotoUrl = data.publicUrl;
      const { error: updateError } = await supabase
        .from("clientes")
        .update({ foto: fotoUrl })
        .eq("id", clienteId);
      if (updateError) throw updateError;
      return { fotoUrl };
    } catch (error) {
      console.error("Erro completo na função de upload:", error);
      throw error;
    }
  },

  // --- MÓDULO OBRAS ---

  getObras: async () => {
    let query = supabase
      .from("obras")
      // ATENÇÃO AQUI: Adicionado o join fornecedores(nome) para os materiais
      .select(
        "*, materiais:relatorio_materiais(*, fornecedores(nome)), maoDeObra:relatorio_mao_de_obra(*), extrato:relatorio_extrato(*), clientes!cliente_id(nome)",
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
          cliente_id: novaObra.cliente_id,
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

  updateEtapasObra: async (idObra, etapasFormatadas) => {
    const { data, error } = await supabase
      .from("obras")
      .update({ etapas_selecionadas: etapasFormatadas })
      .eq("id", idObra);
    if (error) throw error;
    return data;
  },

  // --- MÓDULO RELATÓRIOS E MATERIAIS ---

  deleteMaterial: async (id) => {
    const { error } = await supabase
      .from("relatorio_materiais")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await supabase.from("relatorio_extrato").delete().eq("material_id", id);
  },

  deleteMaoDeObra: async (id) => {
    const { error } = await supabase
      .from("relatorio_mao_de_obra")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await supabase.from("relatorio_extrato").delete().eq("mao_de_obra_id", id);
  },

  getObraById: async (id) => {
    const { data, error } = await supabase
      .from("obras")
      // ATENÇÃO AQUI: Adicionado o join fornecedores(nome) nos materiais
      .select(
        `*, materiais:relatorio_materiais(*, fornecedores(nome)), maoDeObra:relatorio_mao_de_obra(*), relatorioExtrato:relatorio_extrato(*), clientes!cliente_id(*)`,
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new Error("Obra não encontrada ou sem permissão de acesso.");
    const relatorioOrdenado = (data.relatorioExtrato || []).sort(
      (a, b) => new Date(b.data) - new Date(a.data),
    );
    return {
      ...data,
      materiais: data.materiais || [],
      maoDeObra: data.maoDeObra || [],
      relatorioExtrato: relatorioOrdenado,
      processos: data.clientes || [],
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

  updateMaterialFornecedor: async (id, novoFornecedorId) => {
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ fornecedor_id: novoFornecedorId })
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
          .update({ valor: novoValor, descricao: materialAtualizado.material })
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

  uploadFotoUsuario: async (userId, file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `admin_${userId}_${Math.random()}.${fileExt}`;
      const filePath = `admins/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("fotos_clientes")
        .upload(filePath, file);
      if (uploadError) throw new Error("Falha ao subir imagem para o Storage");

      const { data: publicUrlData } = supabase.storage
        .from("fotos_clientes")
        .getPublicUrl(filePath);
      const fotoUrl = publicUrlData.publicUrl;
      const { error: updateError } = await supabase.auth.updateUser({
        data: { foto: fotoUrl },
      });
      if (updateError)
        throw new Error("Falha ao vincular a foto ao perfil do Admin");

      return { fotoUrl };
    } catch (error) {
      console.error("Erro completo no uploadFotoUsuario:", error);
      throw error;
    }
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
          fornecedor_id: dados.fornecedor_id,
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

  getFornecedoresSimples: async () => {
    const { data, error } = await supabase
      .from("fornecedores")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome", { ascending: true });
    if (error) throw error;
    return data;
  },

  getFornecedores: async () => {
    const { data, error } = await supabase
      .from("fornecedores")
      .select(
        `
        *,
        relatorio_materiais (
          valor,
          status_financeiro
        )
      `,
      )
      .order("nome", { ascending: true });
    if (error) throw error;
    return data;
  },

  getFornecedorById: async (id) => {
    const { data, error } = await supabase
      .from("fornecedores")
      .select(
        `
        *,
        relatorio_materiais (
          id, material, valor, status_financeiro, status, data_solicitacao, obra_id,
          obras ( cliente, local )
        )
      `,
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  createFornecedor: async (novoFornecedor) => {
    const { data, error } = await supabase
      .from("fornecedores")
      .insert([novoFornecedor])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateFornecedor: async (id, dadosAtualizados) => {
    const { data, error } = await supabase
      .from("fornecedores")
      .update(dadosAtualizados)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  uploadFotoFornecedor: async (fornecedorId, file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `fornecedor_${fornecedorId}_${Math.random()}.${fileExt}`;
      const filePath = `fornecedores/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos_clientes")
        .upload(filePath, file);
      if (uploadError) throw new Error("Falha ao subir imagem para o Storage");

      const { data: publicUrlData } = supabase.storage
        .from("fotos_clientes")
        .getPublicUrl(filePath);
      const fotoUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("fornecedores")
        .update({ foto: fotoUrl })
        .eq("id", fornecedorId);
      if (updateError) throw updateError;

      return { fotoUrl };
    } catch (error) {
      console.error("Erro completo no uploadFotoFornecedor:", error);
      throw error;
    }
  },
};
