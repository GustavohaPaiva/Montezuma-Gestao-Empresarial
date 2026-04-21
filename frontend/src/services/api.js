import { supabase } from "./supabase";

function normalizeCnpjNif(val) {
  if (val === undefined || val === null) return null;
  const digits = String(val).replace(/\D/g, "");
  return digits.length ? digits : null;
}

function omitUndefined(obj) {
  if (!obj || typeof obj !== "object") return {};
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    if (out[k] === undefined) delete out[k];
  });
  return out;
}

function sanitizeClientePayload(dados) {
  if (!dados || typeof dados !== "object") return {};
  const rest = { ...dados };
  delete rest.classe_id;
  delete rest.prestador_id;
  delete rest.escritorio_id;
  delete rest.id;
  delete rest.created_at;
  return omitUndefined(rest);
}

const STATUS_TAREFA_VALIDOS = new Set([
  "Pendente",
  "Aguardando Validação",
  "Concluída",
]);

function normalizarStatusTarefa(raw) {
  const s = String(raw || "").trim();
  if (s === "Em Andamento") return "Pendente";
  if (STATUS_TAREFA_VALIDOS.has(s)) return s;
  return "Pendente";
}

export const api = {
  getFinanceiro: async (tabela, escritorioId, mes, ano) => {
    if (!escritorioId) return [];

    const primeiroDia = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const ultimoDia = new Date(ano, parseInt(String(mes), 10), 0).getDate();
    const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;

    let query = supabase
      .from(tabela)
      .select("*")
      .eq("escritorio_id", escritorioId);

    const { data, error } = await query
      .gte("data", primeiroDia)
      .lte("data", dataFim)
      .order("data", { ascending: true });

    if (error) throw error;
    return data;
  },

  createFinanceiro: async (tabela, dadosBase) => {
    if (!dadosBase?.escritorio_id) {
      throw new Error("escritorio_id obrigatório em createFinanceiro");
    }
    let registros = [];
    const isParcelado = dadosBase.formaPagamento === "Parcelado";
    const grupoId = isParcelado ? `grp_${Date.now()}` : null;

    const prepararDado = (valor, dataParcela, index, total) => {
      const payload = {
        descricao: dadosBase.descricao,
        forma: isParcelado
          ? `Parcelado (${index}/${total})`
          : dadosBase.formaPagamento,
        valor: valor,
        data: dataParcela,
        escritorio_id: dadosBase.escritorio_id,
        grupo_id: grupoId,
        validacao: 0,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      return payload;
    };

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

  updateFinanceiro: async (tabela, id, dados, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em updateFinanceiro");
    }

    const {
      alterar_todas_parcelas,
      diferenca_proxima_parcela,
      ratear_diferenca_todas,
      ...dadosLimpos
    } = dados;

    if (dadosLimpos.formaPagamento) {
      dadosLimpos.forma = dadosLimpos.formaPagamento;
      delete dadosLimpos.formaPagamento;
    }
    delete dadosLimpos.classe_id;
    delete dadosLimpos.prestador_id;
    delete dadosLimpos.parcelas;
    delete dadosLimpos.escritorio_id;

    Object.keys(dadosLimpos).forEach((k) => {
      if (dadosLimpos[k] === undefined) delete dadosLimpos[k];
    });

    if (
      alterar_todas_parcelas ||
      diferenca_proxima_parcela !== undefined ||
      ratear_diferenca_todas !== undefined
    ) {
      const { data: itemAtual } = await supabase
        .from(tabela)
        .select("grupo_id, data")
        .eq("id", id)
        .eq("escritorio_id", escritorioId)
        .single();

      if (itemAtual?.grupo_id) {
        if (alterar_todas_parcelas && dadosLimpos.valor !== undefined) {
          await supabase
            .from(tabela)
            .update({ valor: dadosLimpos.valor })
            .eq("grupo_id", itemAtual.grupo_id)
            .eq("escritorio_id", escritorioId)
            .gt("data", itemAtual.data);
        } else if (diferenca_proxima_parcela !== undefined) {
          const { data: proximaParcela } = await supabase
            .from(tabela)
            .select("id, valor")
            .eq("grupo_id", itemAtual.grupo_id)
            .eq("escritorio_id", escritorioId)
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
              .eq("id", proximaParcela.id)
              .eq("escritorio_id", escritorioId);
          }
        } else if (ratear_diferenca_todas !== undefined) {
          const { data: parcelasRestantes } = await supabase
            .from(tabela)
            .select("id, valor")
            .eq("grupo_id", itemAtual.grupo_id)
            .eq("escritorio_id", escritorioId)
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
                .eq("id", parcela.id)
                .eq("escritorio_id", escritorioId);
            }
          }
        }
      }
    }

    const { data, error } = await supabase
      .from(tabela)
      .update(dadosLimpos)
      .eq("id", id)
      .eq("escritorio_id", escritorioId)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteFinanceiro: async (tabela, id, excluirTodas = false, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em deleteFinanceiro");
    }
    if (excluirTodas) {
      const { data: item } = await supabase
        .from(tabela)
        .select("grupo_id")
        .eq("id", id)
        .eq("escritorio_id", escritorioId)
        .single();
      if (item?.grupo_id) {
        const { error } = await supabase
          .from(tabela)
          .delete()
          .eq("grupo_id", item.grupo_id)
          .eq("escritorio_id", escritorioId);
        if (error) throw error;
        return;
      }
    }

    const { error } = await supabase
      .from(tabela)
      .delete()
      .eq("id", id)
      .eq("escritorio_id", escritorioId);
    if (error) throw error;
  },

  getOrcamentos: async (escritorioId) => {
    if (!escritorioId) return [];
    const { data, error } = await supabase
      .from("orcamentos")
      .select("*")
      .eq("escritorio_id", escritorioId)
      .order("data", { ascending: false });
    if (error) throw error;
    return data;
  },

  createOrcamento: async (novoOrcamento) => {
    const row = omitUndefined({
      nome: novoOrcamento.nome,
      valor: novoOrcamento.valor,
      data: novoOrcamento.data,
      status: novoOrcamento.status || "Pendente",
      escritorio_id: novoOrcamento.escritorio_id,
    });
    if (!row.escritorio_id) {
      throw new Error("escritorio_id obrigatório em createOrcamento");
    }
    const { data, error } = await supabase
      .from("orcamentos")
      .insert([row])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateOrcamento: async (id, dados, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em updateOrcamento");
    }
    const { escritorio_id: _e, ...rest } = dados;
    const limpo = omitUndefined(rest);
    delete limpo.classe_id;
    delete limpo.prestador_id;
    const { data, error } = await supabase
      .from("orcamentos")
      .update(limpo)
      .eq("id", id)
      .eq("escritorio_id", escritorioId)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteOrcamento: async (id, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em deleteOrcamento");
    }
    const { error } = await supabase
      .from("orcamentos")
      .delete()
      .eq("id", id)
      .eq("escritorio_id", escritorioId);
    if (error) throw error;
  },

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
    if (!escritorioId) return [];
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("escritorio_id", escritorioId)
      .order("data", { ascending: false });
    if (error) throw error;
    return data;
  },

  getClientesPorEscritorios: async (escritorioIds) => {
    if (!escritorioIds?.length) return [];
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .in("escritorio_id", escritorioIds)
      .order("data", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getClienteById: async (idOuNome, options) => {
    const allowedEscritorioIds = options?.allowedEscritorioIds;

    const aplicarFiltroTenant = (row) => {
      if (!row) return null;
      if (
        allowedEscritorioIds?.length > 0 &&
        !allowedEscritorioIds.includes(row.escritorio_id)
      ) {
        return null;
      }
      return row;
    };

    if (!isNaN(idOuNome) && idOuNome !== null && idOuNome !== "") {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "obter_cliente_por_id",
        { p_id: parseInt(idOuNome) },
      );
      if (!rpcError && rpcData && rpcData.length > 0) {
        return aplicarFiltroTenant(rpcData[0]);
      }
    }
    let query = supabase.from("clientes").select("*");
    if (!isNaN(idOuNome) && idOuNome !== null && idOuNome !== "")
      query = query.eq("id", idOuNome);
    else query = query.eq("nome", idOuNome);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return aplicarFiltroTenant(data);
  },

  createCliente: async (novoCliente) => {
    const row = omitUndefined({
      nome: novoCliente.nome,
      tipo: novoCliente.tipo,
      status: novoCliente.status || "Produção",
      pagamento: novoCliente.pagamento,
      valor_pago: novoCliente.valor_pago,
      escritorio_id: novoCliente.escritorio_id,
    });
    if (!row.escritorio_id) {
      throw new Error("escritorio_id obrigatório em createCliente");
    }
    const { data, error } = await supabase
      .from("clientes")
      .insert([row])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateCliente: async (id, dados, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em updateCliente");
    }
    const limpo = sanitizeClientePayload(dados);
    const { data, error } = await supabase
      .from("clientes")
      .update(limpo)
      .eq("id", id)
      .eq("escritorio_id", escritorioId)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteCliente: async (id, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em deleteCliente");
    }
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id)
      .eq("escritorio_id", escritorioId);
    if (error) throw error;
  },

  uploadFotoCliente: async (clienteId, file, escritorioId) => {
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
      let updateQuery = supabase
        .from("clientes")
        .update({ foto: fotoUrl })
        .eq("id", clienteId);
      if (escritorioId) {
        updateQuery = updateQuery.eq("escritorio_id", escritorioId);
      }
      const { error: updateError } = await updateQuery;
      if (updateError) throw updateError;
      return { fotoUrl };
    } catch (error) {
      console.error("Erro completo na função de upload:", error);
      throw error;
    }
  },

  getTarefasGlobaisMontezuma: async () => {
    const selectBase = `
        *,
        criador:usuarios!tarefas_criador_id_fkey(nome, escritorio),
        tarefa_responsaveis(
          usuario_id,
          usuarios(id, nome, foto)
        )
      `;
    const selectComFkHint = `
        *,
        criador:usuarios!tarefas_criador_id_fkey(nome, escritorio),
        tarefa_responsaveis(
          usuario_id,
          usuarios!usuario_id(id, nome, foto)
        )
      `;
    const selectSemFoto = `
        *,
        criador:usuarios!tarefas_criador_id_fkey(nome, escritorio),
        tarefa_responsaveis(
          usuario_id,
          usuarios(id, nome)
        )
      `;
    const selectSemFotoFk = `
        *,
        criador:usuarios!tarefas_criador_id_fkey(nome, escritorio),
        tarefa_responsaveis(
          usuario_id,
          usuarios!usuario_id(id, nome)
        )
      `;
    let { data, error } = await supabase.from("tarefas").select(selectBase);
    if (error) {
      let r = await supabase.from("tarefas").select(selectComFkHint);
      if (r.error) r = await supabase.from("tarefas").select(selectSemFoto);
      if (r.error) r = await supabase.from("tarefas").select(selectSemFotoFk);
      if (r.error) throw r.error;
      data = r.data;
    }
    return Array.isArray(data) ? data : [];
  },

  /**
   * Apenas tarefas em que o utilizador é responsável (linha em tarefa_responsaveis).
   * Usado no filtro "Minhas tarefas" — não inclui criador sem vínculo de responsável.
   */
  getTarefasGlobaisMontezumaMinhasResponsavel: async (usuarioId) => {
    if (!usuarioId) return [];
    const uid = String(usuarioId);

    const selectInnerBase = `
        *,
        criador:usuarios!tarefas_criador_id_fkey(nome, escritorio),
        tarefa_responsaveis!inner(
          usuario_id,
          usuarios(id, nome, foto)
        )
      `;
    const selectInnerFkHint = `
        *,
        criador:usuarios!tarefas_criador_id_fkey(nome, escritorio),
        tarefa_responsaveis!inner(
          usuario_id,
          usuarios!usuario_id(id, nome, foto)
        )
      `;
    const selectInnerSemFoto = `
        *,
        criador:usuarios!tarefas_criador_id_fkey(nome, escritorio),
        tarefa_responsaveis!inner(
          usuario_id,
          usuarios(id, nome)
        )
      `;
    const selectInnerSemFotoFk = `
        *,
        criador:usuarios!tarefas_criador_id_fkey(nome, escritorio),
        tarefa_responsaveis!inner(
          usuario_id,
          usuarios!usuario_id(id, nome)
        )
      `;

    const filtroResp = (q) =>
      q.eq("tarefa_responsaveis.usuario_id", uid);

    let { data, error } = await filtroResp(
      supabase.from("tarefas").select(selectInnerBase),
    );
    if (error) {
      let r = await filtroResp(
        supabase.from("tarefas").select(selectInnerFkHint),
      );
      if (r.error) {
        r = await filtroResp(
          supabase.from("tarefas").select(selectInnerSemFoto),
        );
      }
      if (r.error) {
        r = await filtroResp(
          supabase.from("tarefas").select(selectInnerSemFotoFk),
        );
      }
      if (r.error) throw r.error;
      data = r.data;
    }

    const rows = Array.isArray(data) ? data : [];
    const porId = new Map();
    for (const row of rows) {
      if (row?.id != null && !porId.has(String(row.id))) {
        porId.set(String(row.id), row);
      }
    }
    return [...porId.values()];
  },

  getTarefasEscritorio: async (escritorioId) => {
    if (!escritorioId) return [];
    const { data, error } = await supabase
      .from("tarefas")
      .select("*, responsaveis:tarefa_responsaveis(usuario_id)")
      .eq("escritorio_id", escritorioId)
      .order("data_conclusao", { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  getUsuariosTarefaEscritorio: async (escritorioId) => {
    if (!escritorioId) return [];
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, tipo, escritorio_id")
      .eq("escritorio_id", escritorioId)
      .order("nome", { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  createTarefaEscritorio: async (payload) => {
    if (!payload?.escritorio_id) {
      throw new Error("escritorio_id obrigatório em createTarefaEscritorio");
    }
    const responsaveis = Array.isArray(payload.responsaveis)
      ? payload.responsaveis.map(String).filter(Boolean)
      : [];
    const row = omitUndefined({
      titulo: payload.titulo,
      descricao: payload.descricao ?? null,
      data_conclusao: payload.data_conclusao,
      prioridade: payload.prioridade || "Média",
      status: normalizarStatusTarefa(payload.status),
      criador_id: payload.criador_id,
      gestor_id: payload.gestor_id ?? null,
      escritorio_id: payload.escritorio_id,
      subtarefas: payload.subtarefas,
    });
    if (!Array.isArray(row.subtarefas) || row.subtarefas.length === 0) {
      delete row.subtarefas;
    }

    const { data, error } = await supabase
      .from("tarefas")
      .insert(row)
      .select("id, escritorio_id")
      .single();
    if (error) throw error;
    if (!data?.id) throw new Error("ID da tarefa não retornado.");

    if (responsaveis.length > 0) {
      const { error: errResp } = await supabase
        .from("tarefa_responsaveis")
        .insert(
          responsaveis.map((uid) => ({
            tarefa_id: data.id,
            usuario_id: uid,
          })),
        );
      if (errResp) throw errResp;
    }

    return data;
  },

  updateTarefaEscritorio: async (id, dados, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em updateTarefaEscritorio");
    }
    const responsaveis = Array.isArray(dados?.responsaveis)
      ? dados.responsaveis.map(String).filter(Boolean)
      : null;

    const limpo = { ...dados };
    delete limpo.id;
    delete limpo.escritorio_id;
    delete limpo.criador_id;
    delete limpo.responsaveis;
    if ("status" in limpo) {
      limpo.status = normalizarStatusTarefa(limpo.status);
    }
    const cleaned = omitUndefined(limpo);

    const { data, error } = await supabase
      .from("tarefas")
      .update(cleaned)
      .eq("id", id)
      .eq("escritorio_id", escritorioId)
      .select("id")
      .single();
    if (error) throw error;

    if (responsaveis) {
      const { error: errDel } = await supabase
        .from("tarefa_responsaveis")
        .delete()
        .eq("tarefa_id", id);
      if (errDel) throw errDel;

      if (responsaveis.length > 0) {
        const { error: errIns } = await supabase
          .from("tarefa_responsaveis")
          .insert(
            responsaveis.map((uid) => ({
              tarefa_id: id,
              usuario_id: uid,
            })),
          );
        if (errIns) throw errIns;
      }
    }

    return data;
  },

  deleteTarefaEscritorio: async (id, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em deleteTarefaEscritorio");
    }
    const { data: row, error: errSel } = await supabase
      .from("tarefas")
      .select("id")
      .eq("id", id)
      .eq("escritorio_id", escritorioId)
      .maybeSingle();
    if (errSel) throw errSel;
    if (!row) throw new Error("Tarefa não encontrada ou acesso negado.");

    const { error: errResp } = await supabase
      .from("tarefa_responsaveis")
      .delete()
      .eq("tarefa_id", id);
    if (errResp) throw errResp;

    const { error: errT } = await supabase
      .from("tarefas")
      .delete()
      .eq("id", id)
      .eq("escritorio_id", escritorioId);
    if (errT) throw errT;
  },

  getTarefaProgresso: async (tarefaId) => {
    if (!tarefaId) return [];
    const { data, error } = await supabase
      .from("tarefa_progresso")
      .select("*, usuarios(nome)")
      .eq("tarefa_id", tarefaId)
      .order("criado_em", { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  addTarefaProgresso: async (tarefaId, usuarioId, mensagem) => {
    const texto = String(mensagem ?? "").trim();
    if (!tarefaId || !usuarioId || !texto) {
      throw new Error(
        "mensagem e identificação obrigatórios para registrar progresso.",
      );
    }
    const { data, error } = await supabase.from("tarefa_progresso").insert({
      tarefa_id: tarefaId,
      usuario_id: usuarioId,
      mensagem: texto,
    });
    if (error) throw error;
    return data;
  },

  getObras: async () => {
    let query = supabase
      .from("obras")
      .select(
        "*, materiais:relatorio_materiais(*, fornecedores(nome)), maoDeObra:relatorio_mao_de_obra(*), extrato:relatorio_extrato(*), clientes!cliente_id(nome, tipo)",
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

    let etapas = data.etapas_selecionadas || [];

    if (data.clientes?.tipo?.toLowerCase() === "reforma" && etapas.length > 0) {
      const temDemolicao = etapas.some((e) => e.nome === "Demolição");
      if (!temDemolicao) {
        etapas = [
          { nome: "Demolição", progresso: 0, status: "pendente" },
          ...etapas,
        ];
        supabase
          .from("obras")
          .update({ etapas_selecionadas: etapas })
          .eq("id", id)
          .then();
      }
    }

    return {
      ...data,
      etapas_selecionadas: etapas,
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

    const extratoAtualizado = data[0];

    if (extratoAtualizado && extratoAtualizado.material_id) {
      const { error: errorMat } = await supabase
        .from("relatorio_materiais")
        .update({ status_financeiro: novoStatus })
        .eq("id", extratoAtualizado.material_id);
      if (errorMat) {
        console.error(
          "Erro ao sincronizar status com relatorio_materiais:",
          errorMat,
        );
      }
    }

    return extratoAtualizado;
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
          prestador_id: dados.prestador_id ?? null,
          classe_id: dados.classe_id ?? null,
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

  updateMaoDeObraPrestador: async (id, dadosPrestador) => {
    const payload = {
      profissional: dadosPrestador.profissional,
      prestador_id: dadosPrestador.prestador_id ?? null,
      classe_id: dadosPrestador.classe_id ?? null,
    };
    const { data, error } = await supabase
      .from("relatorio_mao_de_obra")
      .update(payload)
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
    const dadosLimpos = Object.fromEntries(
      Object.entries(novoFornecedor ?? {}).filter(([k]) => k !== "id"),
    );
    const cnpj = normalizeCnpjNif(dadosLimpos.cnpj);
    if (cnpj) {
      const { data: existentes, error: errLista } = await supabase
        .from("fornecedores")
        .select("cnpj");
      if (errLista) throw errLista;
      const duplicado = (existentes ?? []).some(
        (row) => normalizeCnpjNif(row.cnpj) === cnpj,
      );
      if (duplicado) {
        const e = new Error(
          'duplicate key value violates unique constraint "fornecedores_cnpj_key"',
        );
        e.code = "23505";
        throw e;
      }
    }
    const row = { id: globalThis.crypto.randomUUID(), ...dadosLimpos, cnpj };
    const { data, error } = await supabase
      .from("fornecedores")
      .insert([row])
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

  getClassesPrestadores: async () => {
    const { data, error } = await supabase
      .from("classes_prestadores")
      .select("*")
      .order("nome", { ascending: true });
    if (error) throw error;
    return data;
  },

  getClassePrestadorById: async (id) => {
    const { data, error } = await supabase
      .from("classes_prestadores")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  createClassePrestador: async (novaClasse) => {
    const { data, error } = await supabase
      .from("classes_prestadores")
      .insert([{ nome: novaClasse.nome }])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateClassePrestador: async (id, dadosAtualizados) => {
    const { data, error } = await supabase
      .from("classes_prestadores")
      .update(dadosAtualizados)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteClassePrestador: async (id) => {
    const { error: linkError } = await supabase
      .from("prestadores_classes")
      .delete()
      .eq("classe_id", id);
    if (linkError) throw linkError;

    const { error } = await supabase
      .from("classes_prestadores")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  getPrestadoresSimples: async () => {
    const { data, error } = await supabase
      .from("prestadores")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome", { ascending: true });
    if (error) throw error;
    return data;
  },

  getPrestadoresByClasse: async (classeId) => {
    if (!classeId) return [];
    const { data, error } = await supabase
      .from("prestadores")
      .select("id, nome, cnpj_cpf, ativo, prestadores_classes!inner(classe_id)")
      .eq("ativo", true)
      .eq("prestadores_classes.classe_id", classeId)
      .order("nome", { ascending: true });
    if (error) throw error;
    return data;
  },

  getPrestadores: async () => {
    const { data, error } = await supabase
      .from("prestadores")
      .select(
        `
        *,
        prestadores_classes(
          classe_id,
          classes_prestadores(id, nome)
        )
      `,
      )
      .order("nome", { ascending: true });
    if (error) throw error;

    let lancamentosMdo = [];
    try {
      const { data: dataMdo, error: errMdo } = await supabase
        .from("relatorio_mao_de_obra")
        .select(
          "prestador_id, valor_orcado, valor_cobrado, valor_pago, validacao",
        )
        .not("prestador_id", "is", null);
      if (errMdo) throw errMdo;
      lancamentosMdo = dataMdo || [];
    } catch (errorMdo) {
      if (
        errorMdo?.code !== "42703" &&
        !String(errorMdo?.message || "").includes("prestador_id")
      ) {
        throw errorMdo;
      }
    }

    const mapaResumo = new Map();
    lancamentosMdo.forEach((item) => {
      const chave = Number(item.prestador_id);
      if (!mapaResumo.has(chave)) {
        mapaResumo.set(chave, {
          contratado: 0,
          pago: 0,
          pendente: 0,
          quantidade: 0,
        });
      }
      const atual = mapaResumo.get(chave);
      const valorOrcado = parseFloat(item.valor_orcado) || 0;
      const valorPago = parseFloat(item.valor_pago) || 0;
      atual.contratado += valorOrcado;
      atual.pago += valorPago;
      atual.pendente += valorOrcado - valorPago;
      atual.quantidade += 1;
    });

    return (data || []).map((prestador) => ({
      ...prestador,
      resumo_mdo: mapaResumo.get(Number(prestador.id)) || {
        contratado: 0,
        pago: 0,
        pendente: 0,
        quantidade: 0,
      },
    }));
  },

  getPrestadorById: async (id) => {
    const { data, error } = await supabase
      .from("prestadores")
      .select(
        `
        *,
        prestadores_classes(
          classe_id,
          classes_prestadores(id, nome)
        )
      `,
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  createPrestador: async (novoPrestador) => {
    const { id: _ignoreId, classe_ids = [], ...dadosPrestador } = novoPrestador;
    const { data, error } = await supabase
      .from("prestadores")
      .insert([dadosPrestador])
      .select();
    if (error) throw error;

    const prestadorCriado = data[0];
    if (classe_ids.length > 0) {
      await api.setClassesDoPrestador(prestadorCriado.id, classe_ids);
    }

    return api.getPrestadorById(prestadorCriado.id);
  },

  updatePrestador: async (id, dadosAtualizados) => {
    const { classe_ids, ...dadosPrestador } = dadosAtualizados;

    if (Object.keys(dadosPrestador).length > 0) {
      const { error } = await supabase
        .from("prestadores")
        .update(dadosPrestador)
        .eq("id", id);
      if (error) throw error;
    }

    if (Array.isArray(classe_ids)) {
      await api.setClassesDoPrestador(id, classe_ids);
    }

    return api.getPrestadorById(id);
  },

  deletePrestador: async (id) => {
    const { error } = await supabase
      .from("prestadores")
      .update({ ativo: false })
      .eq("id", id);
    if (error) throw error;
  },

  setClassesDoPrestador: async (prestadorId, classeIds) => {
    const idsUnicos = [
      ...new Set((classeIds || []).map((id) => Number(id))),
    ].filter((id) => !Number.isNaN(id));

    const { error: deleteError } = await supabase
      .from("prestadores_classes")
      .delete()
      .eq("prestador_id", prestadorId);
    if (deleteError) throw deleteError;

    if (idsUnicos.length === 0) return [];

    const payload = idsUnicos.map((classeId) => ({
      prestador_id: Number(prestadorId),
      classe_id: classeId,
    }));

    const { data, error } = await supabase
      .from("prestadores_classes")
      .insert(payload)
      .select();
    if (error) throw error;
    return data;
  },

  addClasseAoPrestador: async (prestadorId, classeId) => {
    const payload = {
      prestador_id: Number(prestadorId),
      classe_id: Number(classeId),
    };
    const { data, error } = await supabase
      .from("prestadores_classes")
      .upsert([payload], { onConflict: "prestador_id,classe_id" })
      .select();
    if (error) throw error;
    return data[0];
  },

  removeClasseDoPrestador: async (prestadorId, classeId) => {
    const { error } = await supabase
      .from("prestadores_classes")
      .delete()
      .eq("prestador_id", prestadorId)
      .eq("classe_id", classeId);
    if (error) throw error;
  },

  uploadFotoPrestador: async (prestadorId, file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `prestador_${prestadorId}_${Math.random()}.${fileExt}`;
      const filePath = `prestadores/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos_clientes")
        .upload(filePath, file);
      if (uploadError) throw new Error("Falha ao subir imagem para o Storage");

      const { data: publicUrlData } = supabase.storage
        .from("fotos_clientes")
        .getPublicUrl(filePath);
      const fotoUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("prestadores")
        .update({ foto: fotoUrl })
        .eq("id", prestadorId);
      if (updateError) throw updateError;

      return { fotoUrl };
    } catch (error) {
      console.error("Erro completo no uploadFotoPrestador:", error);
      throw error;
    }
  },

  getLancamentosFinanceirosPrestador: async (prestadorId) => {
    const { data, error } = await supabase
      .from("relatorio_mao_de_obra")
      .select(
        `
        id,
        tipo,
        profissional,
        valor_orcado,
        valor_pago,
        saldo,
        data_solicitacao,
        validacao,
        classe_id
      `,
      )
      .eq("prestador_id", prestadorId)
      .order("data_solicitacao", { ascending: false });
    if (error) {
      if (
        error.code === "42703" ||
        String(error.message).includes("prestador_id")
      ) {
        return [];
      }
      throw error;
    }

    const classeIds = [
      ...new Set((data || []).map((i) => i.classe_id).filter(Boolean)),
    ];
    if (classeIds.length === 0) return data || [];

    const { data: classesData, error: classeError } = await supabase
      .from("classes_prestadores")
      .select("id, nome")
      .in("id", classeIds);
    if (classeError) throw classeError;

    const mapaClasses = new Map((classesData || []).map((c) => [c.id, c.nome]));
    return (data || []).map((item) => {
      const valorOrcado =
        parseFloat(item.valor_orcado) || parseFloat(item.valor_cobrado) || 0;
      const valorPago = parseFloat(item.valor_pago) || 0;
      const valorExibicao = valorOrcado > 0 ? valorOrcado : valorPago;
      return {
        ...item,
        descricao: `${item.tipo || "Serviço"} - ${item.profissional || "Prestador"}`,
        valor: valorExibicao,
        data: item.data_solicitacao,
        classe_nome: item.classe_id
          ? mapaClasses.get(item.classe_id) || "Sem classe"
          : "Sem classe",
      };
    });
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

  getAgenda: async (escritorioId, inicioIso, fimIso) => {
    if (!escritorioId) return [];
    let query = supabase
      .from("agenda")
      .select(
        "id, escritorio_id, titulo, tipo, data_hora, descricao, cliente_id, status, grupo_recorrencia_id, cliente:clientes(id, nome)",
      )
      .eq("escritorio_id", escritorioId)
      .order("data_hora", { ascending: true });
    if (inicioIso) query = query.gte("data_hora", inicioIso);
    if (fimIso) query = query.lte("data_hora", fimIso);
    const { data, error } = await query;
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  createCompromisso: async (payload) => {
    if (!payload?.escritorio_id) {
      throw new Error("escritorio_id obrigatório em createCompromisso");
    }
    if (!payload?.titulo || !payload?.data_hora) {
      throw new Error("titulo e data_hora obrigatórios em createCompromisso");
    }
    const row = omitUndefined({
      escritorio_id: payload.escritorio_id,
      titulo: String(payload.titulo).trim(),
      tipo: payload.tipo || "Outro",
      data_hora: payload.data_hora,
      descricao: payload.descricao?.trim() || null,
      cliente_id: payload.cliente_id ?? null,
      status: payload.status || "Agendado",
      grupo_recorrencia_id: payload.grupo_recorrencia_id ?? null,
    });
    const { data, error } = await supabase
      .from("agenda")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  createCompromissosLote: async (payloads) => {
    const rows = Array.isArray(payloads)
      ? payloads
          .filter((p) => p?.escritorio_id && p?.titulo && p?.data_hora)
          .map((p) =>
            omitUndefined({
              escritorio_id: p.escritorio_id,
              titulo: String(p.titulo).trim(),
              tipo: p.tipo || "Outro",
              data_hora: p.data_hora,
              descricao: p.descricao?.trim() || null,
              cliente_id: p.cliente_id ?? null,
              status: p.status || "Agendado",
              grupo_recorrencia_id: p.grupo_recorrencia_id ?? null,
            }),
          )
      : [];
    if (!rows.length) {
      throw new Error("Nenhum compromisso válido para inserção em lote.");
    }
    const { data, error } = await supabase.from("agenda").insert(rows).select();
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  updateCompromisso: async (id, dados, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em updateCompromisso");
    }
    const limpo = { ...dados };
    delete limpo.id;
    delete limpo.escritorio_id;
    delete limpo.cliente;
    const cleaned = omitUndefined(limpo);
    const { data, error } = await supabase
      .from("agenda")
      .update(cleaned)
      .eq("id", id)
      .eq("escritorio_id", escritorioId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteCompromisso: async (id, escritorioId) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em deleteCompromisso");
    }
    const { error } = await supabase
      .from("agenda")
      .delete()
      .eq("id", id)
      .eq("escritorio_id", escritorioId);
    if (error) throw error;
  },

  updateCompromissosFuturos: async (
    grupoRecorrenciaId,
    dataHoraOrigemIso,
    dados,
    escritorioId,
  ) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em updateCompromissosFuturos");
    }
    if (!grupoRecorrenciaId || !dataHoraOrigemIso) {
      throw new Error("grupo_recorrencia_id e data_hora são obrigatórios");
    }
    const limpo = { ...dados };
    delete limpo.id;
    delete limpo.escritorio_id;
    delete limpo.cliente;
    const cleaned = omitUndefined(limpo);
    const { data, error } = await supabase
      .from("agenda")
      .update(cleaned)
      .eq("escritorio_id", escritorioId)
      .eq("grupo_recorrencia_id", grupoRecorrenciaId)
      .gte("data_hora", dataHoraOrigemIso)
      .select();
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  deleteCompromissosFuturos: async (
    grupoRecorrenciaId,
    dataHoraOrigemIso,
    escritorioId,
  ) => {
    if (!escritorioId) {
      throw new Error("escritorio_id obrigatório em deleteCompromissosFuturos");
    }
    if (!grupoRecorrenciaId || !dataHoraOrigemIso) {
      throw new Error("grupo_recorrencia_id e data_hora são obrigatórios");
    }
    const { error } = await supabase
      .from("agenda")
      .delete()
      .eq("escritorio_id", escritorioId)
      .eq("grupo_recorrencia_id", grupoRecorrenciaId)
      .gte("data_hora", dataHoraOrigemIso);
    if (error) throw error;
  },

  getClientesSimplesEscritorio: async (escritorioId) => {
    if (!escritorioId) return [];
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nome")
      .eq("escritorio_id", escritorioId)
      .order("nome", { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },
};
