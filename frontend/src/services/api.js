import { supabase } from "./supabase";
import { ID_MONTEZUMA, ID_VOGELKOP, ID_YBYOCA } from "../constants/escritorios";
import { STATUS as TAREFA_STATUS } from "../pages/tarefas/tarefasHelpers";
import {
  enriquecerNumerosPedidos,
  normalizarNomeMaterial,
  normalizarMateriaisLista,
  validarItemPedido,
} from "../utils/pedidosUtils";
import {
  calcularValoresPorTipo,
  normalizarItensProjecao,
} from "../utils/projecaoUtils";
import {
  semanasDoMes,
  chaveSemanaLancamento,
} from "../pages/relatorios-diretoria/relatoriosDiretoriaUtils";
import {
  calcularTotalValoresProposta,
  normalizarPropostaDados,
} from "../utils/orcamentoPropostaUtils";

function projecaoPayloadComValoresDerivados(payload) {
  const itens = normalizarItensProjecao(
    payload?.itens != null ? payload.itens : [],
  );
  const valores = calcularValoresPorTipo(itens);
  return { itens, ...valores };
}

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

function isExtratoFinanceiroPago(statusFinanceiro) {
  return (statusFinanceiro || "").toLowerCase().trim() === "pago";
}

function calcularStatusLotePorExtratos(extratos) {
  if (!extratos?.length) return "pendente";
  const pagos = extratos.filter((e) =>
    isExtratoFinanceiroPago(e.status_financeiro),
  ).length;
  if (pagos === 0) return "pendente";
  if (pagos === extratos.length) return "pago";
  return "parcial";
}

function normalizeObraIdForHistorico(obraId) {
  if (obraId == null || obraId === "") return null;
  if (typeof obraId === "number" && Number.isFinite(obraId)) return obraId;
  const s = String(obraId).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return s;
}

const PEDIDO_SELECT_ITENS =
  "obra_pedido_itens(id, material, quantidade, unidade, data_entrega, created_at, fornecedor_id, data_pagamento, valor)";

const PEDIDO_SELECT_BASE = `id, obra_id, numero, status, solicitante_id, solicitante_nome, created_at, updated_at, ${PEDIDO_SELECT_ITENS}`;

const PEDIDO_SELECT_SIMPLES =
  "id, obra_id, numero, status, solicitante_id, solicitante_nome, created_at, updated_at";

async function proximoNumeroPedidoObra(obraId) {
  const oid = normalizeObraIdForHistorico(obraId);
  if (oid == null) return 1;
  const { data, error } = await supabase
    .from("obra_pedidos")
    .select("numero")
    .eq("obra_id", oid)
    .order("numero", { ascending: false })
    .limit(1);
  if (error) {
    if (/numero|column/i.test(error.message || "")) return null;
    throw error;
  }
  return (data?.[0]?.numero ?? 0) + 1;
}

function itemPedidoComMaterialMaiusculo(item) {
  if (!item || item.material == null) return item;
  return { ...item, material: normalizarNomeMaterial(item.material) };
}

function normalizarPedido(row) {
  if (!row) return row;
  const itensRaw = row.itens ?? row.obra_pedido_itens ?? [];
  const itens = (Array.isArray(itensRaw) ? itensRaw : []).map(
    itemPedidoComMaterialMaiusculo,
  );
  const { obra_pedido_itens: _omit, ...rest } = row;
  return {
    ...rest,
    itens,
  };
}

function mensagemErroPedido(error) {
  const msg = error?.message || "";
  const code = error?.code || "";
  if (code === "23502" && /material|quantidade|data_entrega/i.test(msg)) {
    return "A tabela obra_pedidos ainda tem colunas antigas (material/quantidade). Execute supabase/migrations/20260515140000_obra_pedidos_fix.sql no SQL Editor.";
  }
  if (
    code === "42P01" ||
    /obra_pedido_itens/i.test(msg) ||
    /relationship/i.test(msg) ||
    /schema cache/i.test(msg)
  ) {
    return "Estrutura de pedidos incompleta no Supabase. Execute as migrações em supabase/migrations/ (incluindo 20260515140000_obra_pedidos_fix.sql).";
  }
  return msg || "Não foi possível concluir a operação de pedidos.";
}

async function anexarItensAosPedidos(pedidos) {
  if (!pedidos?.length) return pedidos;
  const ids = pedidos.map((p) => p.id).filter((id) => id != null);
  if (!ids.length) return pedidos;

  const { data: itens, error } = await supabase
    .from("obra_pedido_itens")
    .select(
      "id, pedido_id, material, quantidade, unidade, data_entrega, created_at, grupo_compra_id, material_relatorio_id, fornecedor_id, data_pagamento, valor, etapa_nome",
    )
    .in("pedido_id", ids);
  if (error) throw new Error(mensagemErroPedido(error));

  const porPedido = {};
  for (const item of itens || []) {
    const pid = item.pedido_id;
    if (!porPedido[pid]) porPedido[pid] = [];
    porPedido[pid].push(itemPedidoComMaterialMaiusculo(item));
  }
  return pedidos.map((p) => ({ ...p, itens: porPedido[p.id] || [] }));
}

async function enriquecerPedidosComObra(pedidos) {
  if (!pedidos?.length) return pedidos;
  const obraIds = [
    ...new Set(pedidos.map((p) => p.obra_id).filter((id) => id != null)),
  ];
  if (!obraIds.length) return pedidos;

  const { data: obras, error } = await supabase
    .from("obras")
    .select(
      "id, local, cliente, etapas_selecionadas, clientes!cliente_id(nome)",
    )
    .in("id", obraIds);
  if (error) {
    console.warn("[pedidos] enriquecer obras:", error);
    return pedidos;
  }

  const mapa = Object.fromEntries((obras || []).map((o) => [String(o.id), o]));
  return pedidos.map((p) => ({
    ...p,
    obras: mapa[String(p.obra_id)] ?? null,
  }));
}

async function buscarPedidosComItens(buildQuery) {
  let { data, error } = await buildQuery(PEDIDO_SELECT_BASE);
  if (error) {
    const fallback = await buildQuery(PEDIDO_SELECT_SIMPLES);
    if (fallback.error) throw new Error(mensagemErroPedido(fallback.error));
    const base = enriquecerNumerosPedidos(
      (fallback.data || []).map(normalizarPedido),
    );
    return enriquecerNumerosPedidos(await anexarItensAosPedidos(base));
  }
  return enriquecerNumerosPedidos((data || []).map(normalizarPedido));
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

  getOrcamentoById: async (id, escritorioId) => {
    if (!id || !escritorioId) return null;
    const { data, error } = await supabase
      .from("orcamentos")
      .select("*")
      .eq("id", id)
      .eq("escritorio_id", escritorioId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  ensureNumeroPropostaOrcamento: async (id, escritorioId) => {
    if (!id || !escritorioId) {
      throw new Error("id e escritorio_id obrigatórios");
    }
    const atual = await api.getOrcamentoById(id, escritorioId);
    if (!atual) throw new Error("Orçamento não encontrado.");
    if (atual.numero_proposta) return atual;

    const ref = atual.data || atual.created_at || new Date().toISOString();
    const ano = new Date(ref).getFullYear();
    const inicioAno = `${ano}-01-01T00:00:00.000Z`;
    const fimAno = `${ano}-12-31T23:59:59.999Z`;

    const { data: ultimo, error: errUltimo } = await supabase
      .from("orcamentos")
      .select("numero_proposta")
      .eq("escritorio_id", escritorioId)
      .gte("data", inicioAno)
      .lte("data", fimAno)
      .not("numero_proposta", "is", null)
      .order("numero_proposta", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (errUltimo) throw errUltimo;

    const proximo = (ultimo?.numero_proposta || 0) + 1;
    return api.updateOrcamento(id, { numero_proposta: proximo }, escritorioId);
  },

  updatePropostaOrcamento: async (id, propostaDados, escritorioId) => {
    if (!id || !escritorioId) {
      throw new Error(
        "id e escritorio_id obrigatórios em updatePropostaOrcamento",
      );
    }
    const norm = normalizarPropostaDados(propostaDados);
    const total = calcularTotalValoresProposta(norm.valores);
    return api.updateOrcamento(
      id,
      { proposta_dados: norm, valor: total },
      escritorioId,
    );
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

    const filtroResp = (q) => q.eq("tarefa_responsaveis.usuario_id", uid);

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
    // Sem embed responsavel:usuarios (exige FK em obras.responsavel_id). O nome resolve-se no UI com listUsuariosDiretoria.
    let query = supabase
      .from("obras")
      .select(
        "*, materiais:relatorio_materiais(*, fornecedores(nome)), maoDeObra:relatorio_mao_de_obra(*), locacoes:relatorio_locacoes(*), extrato:relatorio_extrato(*), clientes!cliente_id(nome, tipo)",
      )
      .eq("active", true)
      .order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((obra) => ({
      ...obra,
      materiais: normalizarMateriaisLista(obra.materiais),
    }));
  },

  listUsuariosDiretoria: async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, tipo")
      .eq("tipo", "diretoria")
      .order("nome", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  createObra: async (novaObra) => {
    const modalidade =
      novaObra.modalidade === "gestao" ? "gestao" : "empreitada";
    const payload = omitUndefined({
      cliente: novaObra.cliente,
      local: novaObra.local,
      status: "Aguardando iniciação",
      active: true,
      cliente_id: novaObra.cliente_id,
      responsavel_id: novaObra.responsavel_id || null,
      modalidade,
      data: novaObra.data || null,
    });
    const { data, error } = await supabase
      .from("obras")
      .insert([payload])
      .select();
    if (error) throw error;
    return data[0];
  },

  /** Retorna a obra ativa mais recente vinculada ao cliente, ou null. */
  getObraAtivaPorClienteId: async (clienteId) => {
    if (clienteId == null || clienteId === "") return null;
    const { data, error } = await supabase
      .from("obras")
      .select("id, cliente, local, status, cliente_id, active")
      .eq("cliente_id", clienteId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Garante uma obra ativa para o cliente: reutiliza existente ou cria nova.
   * @returns {{ obra: object, created: boolean }}
   */
  ensureObraForCliente: async (dados) => {
    const clienteId = dados?.cliente_id;
    const existente = await api.getObraAtivaPorClienteId(clienteId);
    if (existente) return { obra: existente, created: false };

    const obra = await api.createObra(dados);
    return { obra, created: true };
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

  addLocacao: async (dados) => {
    const obraId = dados?.obra_id;
    const equipamento = normalizarNomeMaterial(dados?.equipamento);
    const quantidade = Number(dados?.quantidade);
    const tipoPeriodo = String(dados?.tipo_periodo || "").trim();
    const periodo = Number(dados?.periodo);
    const solicitante = String(dados?.solicitante || "").trim();
    const tiposValidos = new Set(["Diário", "Semanal", "Mensal", "Anual"]);

    if (obraId == null || obraId === "") {
      throw new Error("Obra inválida para lançar locação.");
    }
    if (!equipamento) {
      throw new Error("Informe o equipamento.");
    }
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      throw new Error("Quantidade inválida.");
    }
    if (!tiposValidos.has(tipoPeriodo)) {
      throw new Error("Tipo de período inválido.");
    }
    if (!Number.isFinite(periodo) || periodo <= 0) {
      throw new Error("Período inválido.");
    }
    if (!solicitante) {
      throw new Error("Selecione o solicitante.");
    }

    const dataColeta =
      dados.data_coleta || new Date().toISOString().split("T")[0];

    const periodoInt = Math.trunc(periodo);
    const baseColeta = new Date(`${dataColeta}T12:00:00`);
    if (tipoPeriodo === "Diário") {
      baseColeta.setDate(baseColeta.getDate() + periodoInt);
    } else if (tipoPeriodo === "Semanal") {
      baseColeta.setDate(baseColeta.getDate() + periodoInt * 7);
    } else if (tipoPeriodo === "Mensal") {
      baseColeta.setMonth(baseColeta.getMonth() + periodoInt);
    } else if (tipoPeriodo === "Anual") {
      baseColeta.setFullYear(baseColeta.getFullYear() + periodoInt);
    }
    const yyyy = baseColeta.getFullYear();
    const mm = String(baseColeta.getMonth() + 1).padStart(2, "0");
    const dd = String(baseColeta.getDate()).padStart(2, "0");
    const dataVencimentoCalc = `${yyyy}-${mm}-${dd}`;

    const { data, error } = await supabase
      .from("relatorio_locacoes")
      .insert([
        {
          obra_id: obraId,
          equipamento,
          quantidade,
          tipo_periodo: tipoPeriodo,
          periodo: periodoInt,
          solicitante,
          data_coleta: dataColeta,
          data_vencimento: dataVencimentoCalc,
          valor: Number(dados.valor) || 0,
          status: "Solicitado",
          status_financeiro: "Aguardando pagamento",
          etapa_nome: dados.etapa_nome || null,
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateLocacaoStatus: async (id, novoStatus) => {
    const { data, error } = await supabase
      .from("relatorio_locacoes")
      .update({ status: novoStatus })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateLocacaoValor: async (id, novoValor) => {
    const { data, error } = await supabase
      .from("relatorio_locacoes")
      .update({ valor: novoValor })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateLocacaoSolicitante: async (id, novoSolicitante) => {
    const solicitante = String(novoSolicitante ?? "").trim();
    if (!solicitante) {
      throw new Error("Solicitante inválido.");
    }
    const { data, error } = await supabase
      .from("relatorio_locacoes")
      .update({ solicitante })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateLocacaoFornecedor: async (id, novoFornecedorId) => {
    const fid = novoFornecedorId || null;
    let fornecedorNome = null;
    if (fid) {
      const { data: fornecedor } = await supabase
        .from("fornecedores")
        .select("nome")
        .eq("id", fid)
        .maybeSingle();
      fornecedorNome = fornecedor?.nome || null;
    }
    const { data, error } = await supabase
      .from("relatorio_locacoes")
      .update({
        fornecedor_id: fid,
        fornecedor: fornecedorNome,
      })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateLocacaoDataVencimento: async (id, dataVencimento) => {
    const { data, error } = await supabase
      .from("relatorio_locacoes")
      .update({ data_vencimento: dataVencimento ?? null })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateLocacaoDataColeta: async (id, dataColeta, dataVencimentoCalculada) => {
    const payload = { data_coleta: dataColeta ?? null };
    if (typeof dataVencimentoCalculada !== "undefined") {
      payload.data_vencimento = dataVencimentoCalculada;
    }
    const { data, error } = await supabase
      .from("relatorio_locacoes")
      .update(payload)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteLocacao: async (id) => {
    await supabase.from("relatorio_extrato").delete().eq("locacao_id", id);
    const { error } = await supabase
      .from("relatorio_locacoes")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  validarLocacao: async (id, dadosOriginais) => {
    const { error } = await supabase
      .from("relatorio_locacoes")
      .update({ validacao: 1 })
      .eq("id", id);
    if (error) throw error;

    const valorParaExtrato = Number(dadosOriginais?.valor) || 0;
    const descricao = [
      dadosOriginais?.equipamento,
      dadosOriginais?.fornecedor ? `(${dadosOriginais.fornecedor})` : null,
    ]
      .filter(Boolean)
      .join(" ");

    const { error: errorExtrato } = await supabase
      .from("relatorio_extrato")
      .insert([
        {
          obra_id: dadosOriginais.obra_id,
          locacao_id: id,
          descricao: descricao || "Locação",
          tipo: "Locação",
          quantidade: String(dadosOriginais?.quantidade ?? "1"),
          data:
            dadosOriginais?.data_coleta ||
            dadosOriginais?.data_solicitacao ||
            new Date().toISOString(),
          valor: valorParaExtrato,
          validacao: 0,
          status_financeiro:
            dadosOriginais?.status_financeiro || "Aguardando pagamento",
          etapa_nome: dadosOriginais?.etapa_nome || null,
        },
      ]);
    if (errorExtrato) throw errorExtrato;
    return true;
  },

  getObraById: async (id) => {
    const { data, error } = await supabase
      .from("obras")
      .select(
        `*, materiais:relatorio_materiais(*, fornecedores(nome)), maoDeObra:relatorio_mao_de_obra(*), locacoes:relatorio_locacoes(*), relatorioExtrato:relatorio_extrato(*), clientes!cliente_id(*)`,
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new Error("Obra não encontrada ou sem permissão de acesso.");

    let responsavelRow = null;
    if (data.responsavel_id) {
      const { data: u, error: errU } = await supabase
        .from("usuarios")
        .select("id, nome, tipo")
        .eq("id", data.responsavel_id)
        .maybeSingle();
      if (!errU && u) responsavelRow = u;
    }

    const relatorioOrdenado = (data.relatorioExtrato || []).sort(
      (a, b) => new Date(b.data) - new Date(a.data),
    );

    const { data: lotesPagamento, error: errorLotes } = await supabase
      .from("obra_lotes_pagamento")
      .select("*, itens:obra_lote_itens(*)")
      .eq("obra_id", id)
      .order("numero", { ascending: false });
    if (errorLotes) {
      console.error("Erro ao buscar lotes de pagamento:", errorLotes);
    }

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
      ...(responsavelRow ? { responsavel: responsavelRow } : {}),
      etapas_selecionadas: etapas,
      materiais: normalizarMateriaisLista(data.materiais || []),
      maoDeObra: data.maoDeObra || [],
      locacoes: (data.locacoes || []).map((l) =>
        l?.equipamento != null
          ? { ...l, equipamento: normalizarNomeMaterial(l.equipamento) }
          : l,
      ),
      relatorioExtrato: relatorioOrdenado,
      lotesPagamento: lotesPagamento || [],
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
            etapa_nome: materialAtualizado.etapa_nome || null,
          },
        ]);
      }
    }
    return materialAtualizado;
  },

  updateMaterialEtapa: async (id, etapaNome) => {
    const etapa = etapaNome ? String(etapaNome).trim() : null;
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ etapa_nome: etapa })
      .eq("id", id)
      .select();
    if (error) throw error;
    await supabase
      .from("relatorio_extrato")
      .update({ etapa_nome: etapa })
      .eq("material_id", id);
    return data[0];
  },

  updateMateriaisEtapaInIds: async (ids, etapaNome) => {
    const lista = (Array.isArray(ids) ? ids : []).filter((id) => id != null);
    if (!lista.length) return [];
    const etapa = etapaNome ? String(etapaNome).trim() : null;
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ etapa_nome: etapa })
      .in("id", lista)
      .select();
    if (error) throw error;
    await supabase
      .from("relatorio_extrato")
      .update({ etapa_nome: etapa })
      .in("material_id", lista);
    return data || [];
  },

  updateMaoDeObraEtapa: async (id, etapaNome) => {
    const etapa = etapaNome ? String(etapaNome).trim() : null;
    const { data, error } = await supabase
      .from("relatorio_mao_de_obra")
      .update({ etapa_nome: etapa })
      .eq("id", id)
      .select();
    if (error) throw error;
    await supabase
      .from("relatorio_extrato")
      .update({ etapa_nome: etapa })
      .eq("mao_de_obra_id", id);
    return data[0];
  },

  updateMaoDeObraEtapaInIds: async (ids, etapaNome) => {
    const lista = (Array.isArray(ids) ? ids : []).filter((id) => id != null);
    if (!lista.length) return [];
    const etapa = etapaNome ? String(etapaNome).trim() : null;
    const { data, error } = await supabase
      .from("relatorio_mao_de_obra")
      .update({ etapa_nome: etapa })
      .in("id", lista)
      .select();
    if (error) throw error;
    await supabase
      .from("relatorio_extrato")
      .update({ etapa_nome: etapa })
      .in("mao_de_obra_id", lista);
    return data || [];
  },

  updateLocacaoEtapa: async (id, etapaNome) => {
    const etapa = etapaNome ? String(etapaNome).trim() : null;
    const { data, error } = await supabase
      .from("relatorio_locacoes")
      .update({ etapa_nome: etapa })
      .eq("id", id)
      .select();
    if (error) throw error;
    await supabase
      .from("relatorio_extrato")
      .update({ etapa_nome: etapa })
      .eq("locacao_id", id);
    return data[0];
  },

  updateLocacoesEtapaInIds: async (ids, etapaNome) => {
    const lista = (Array.isArray(ids) ? ids : []).filter((id) => id != null);
    if (!lista.length) return [];
    const etapa = etapaNome ? String(etapaNome).trim() : null;
    const { data, error } = await supabase
      .from("relatorio_locacoes")
      .update({ etapa_nome: etapa })
      .in("id", lista)
      .select();
    if (error) throw error;
    await supabase
      .from("relatorio_extrato")
      .update({ etapa_nome: etapa })
      .in("locacao_id", lista);
    return data || [];
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
    const statusPago = (novoStatus || "").toLowerCase().trim() === "pago";
    const updatePayload = { status_financeiro: novoStatus };
    if (statusPago) {
      updatePayload.validacao = 0;
    }
    const { data, error } = await supabase
      .from("relatorio_extrato")
      .update(updatePayload)
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

  updateExtratoValidacaoInIds: async (ids, status) => {
    if (!ids?.length) return;
    const { error } = await supabase
      .from("relatorio_extrato")
      .update({ validacao: status })
      .in("id", ids);
    if (error) throw error;
  },

  updateExtratoStatusFinanceiroInIds: async (ids, novoStatus) => {
    if (!ids?.length) return [];
    const statusPago = (novoStatus || "").toLowerCase().trim() === "pago";
    const updatePayload = { status_financeiro: novoStatus };
    if (statusPago) {
      updatePayload.validacao = 0;
    }
    const { data, error } = await supabase
      .from("relatorio_extrato")
      .update(updatePayload)
      .in("id", ids)
      .select();
    if (error) throw error;

    const materialIds = (data || [])
      .map((e) => e.material_id)
      .filter(Boolean);
    if (materialIds.length) {
      const { error: errorMat } = await supabase
        .from("relatorio_materiais")
        .update({ status_financeiro: novoStatus })
        .in("id", materialIds);
      if (errorMat) {
        console.error(
          "Erro ao sincronizar status em lote com relatorio_materiais:",
          errorMat,
        );
      }
    }

    return data || [];
  },

  getLotesPagamento: async (obraId) => {
    const { data, error } = await supabase
      .from("obra_lotes_pagamento")
      .select("*, itens:obra_lote_itens(*)")
      .eq("obra_id", obraId)
      .order("numero", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getLotesResumo: async (obraId) => {
    const lotes = await api.getLotesPagamento(obraId);
    const abertos = lotes.filter(
      (l) => l.status === "pendente" || l.status === "parcial",
    );
    const total = abertos.reduce(
      (acc, l) => acc + (parseFloat(l.total) || 0),
      0,
    );
    return { quantidade: abertos.length, total, lotes: abertos };
  },

  getLotesResumoMultiplasObras: async (obraIds) => {
    if (!obraIds?.length) return {};
    const { data, error } = await supabase
      .from("obra_lotes_pagamento")
      .select("id, obra_id, numero, total, status, data_criacao")
      .in("obra_id", obraIds)
      .in("status", ["pendente", "parcial"])
      .order("numero", { ascending: false });
    if (error) throw error;

    const porObra = {};
    (data || []).forEach((lote) => {
      const key = lote.obra_id;
      if (!porObra[key]) {
        porObra[key] = { quantidade: 0, total: 0, lotes: [] };
      }
      porObra[key].quantidade += 1;
      porObra[key].total += parseFloat(lote.total) || 0;
      porObra[key].lotes.push(lote);
    });
    return porObra;
  },

  recalcularStatusLote: async (loteId) => {
    return api.sincronizarLote(loteId);
  },

  sincronizarLote: async (loteId) => {
    const { data: lote, error: errLote } = await supabase
      .from("obra_lotes_pagamento")
      .select("*, itens:obra_lote_itens(*)")
      .eq("id", loteId)
      .single();
    if (errLote) throw errLote;

    if (!lote.itens?.length) {
      const { error: errDel } = await supabase
        .from("obra_lotes_pagamento")
        .delete()
        .eq("id", loteId);
      if (errDel) throw errDel;
      return null;
    }

    const total = lote.itens.reduce(
      (acc, item) => acc + (parseFloat(item.valor) || 0),
      0,
    );
    const extratoIds = lote.itens.map((i) => i.extrato_id);
    const { data: extratos, error: errExt } = await supabase
      .from("relatorio_extrato")
      .select("id, status_financeiro")
      .in("id", extratoIds);
    if (errExt) throw errExt;

    const status = calcularStatusLotePorExtratos(extratos);
    const { data: updated, error: errUp } = await supabase
      .from("obra_lotes_pagamento")
      .update({
        total,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loteId)
      .select("*, itens:obra_lote_itens(*)")
      .single();
    if (errUp) throw errUp;
    return updated;
  },

  removerItemDoLote: async (loteItemId) => {
    const { data: item, error: errItem } = await supabase
      .from("obra_lote_itens")
      .select("id, lote_id, lote:obra_lotes_pagamento(id, status, numero)")
      .eq("id", loteItemId)
      .single();
    if (errItem) throw errItem;

    if (item.lote?.status === "pago") {
      throw new Error(
        "Reabra o lote antes de remover itens de um lote já pago.",
      );
    }

    const loteId = item.lote_id;
    const { error: errDel } = await supabase
      .from("obra_lote_itens")
      .delete()
      .eq("id", loteItemId);
    if (errDel) throw errDel;

    return api.sincronizarLote(loteId);
  },

  createLotePagamento: async (obraId, extratoIds) => {
    if (!obraId || !extratoIds?.length) {
      throw new Error("Selecione ao menos um item para o lote.");
    }

    const idsUnicos = [...new Set(extratoIds)];

    const { data: extratos, error: errExt } = await supabase
      .from("relatorio_extrato")
      .select("id, obra_id, valor, status_financeiro")
      .in("id", idsUnicos)
      .eq("obra_id", obraId);
    if (errExt) throw errExt;
    if (!extratos?.length) {
      throw new Error("Itens do extrato não encontrados.");
    }
    if (extratos.length !== idsUnicos.length) {
      throw new Error("Alguns itens selecionados não pertencem a esta obra.");
    }

    for (const e of extratos) {
      if (isExtratoFinanceiroPago(e.status_financeiro)) {
        throw new Error("Não é possível incluir itens já pagos no lote.");
      }
    }

    const { data: itensEmLote, error: errConf } = await supabase
      .from("obra_lote_itens")
      .select("extrato_id, lote:obra_lotes_pagamento!inner(id, status)")
      .in("extrato_id", idsUnicos);
    if (errConf) throw errConf;

    const conflito = (itensEmLote || []).find((row) =>
      ["pendente", "parcial"].includes(row.lote?.status),
    );
    if (conflito) {
      throw new Error("Um ou mais itens já estão em outro lote aberto.");
    }

    const { data: ultimos, error: errNum } = await supabase
      .from("obra_lotes_pagamento")
      .select("numero")
      .eq("obra_id", obraId)
      .order("numero", { ascending: false })
      .limit(1);
    if (errNum) throw errNum;

    const numero = (ultimos?.[0]?.numero || 0) + 1;
    const total = extratos.reduce(
      (acc, e) => acc + (parseFloat(e.valor) || 0),
      0,
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: lote, error: errLote } = await supabase
      .from("obra_lotes_pagamento")
      .insert({
        obra_id: obraId,
        numero,
        total,
        status: "pendente",
        criado_por: user?.id || null,
      })
      .select()
      .single();
    if (errLote) throw errLote;

    const itensPayload = extratos.map((e) => ({
      lote_id: lote.id,
      extrato_id: e.id,
      valor: parseFloat(e.valor) || 0,
    }));

    const { data: itens, error: errItens } = await supabase
      .from("obra_lote_itens")
      .insert(itensPayload)
      .select();
    if (errItens) throw errItens;

    return { ...lote, itens: itens || [] };
  },

  marcarLoteComoPago: async (loteId) => {
    const { data: lote, error: errLote } = await supabase
      .from("obra_lotes_pagamento")
      .select("*, itens:obra_lote_itens(extrato_id)")
      .eq("id", loteId)
      .single();
    if (errLote) throw errLote;

    const extratoIds = (lote.itens || []).map((i) => i.extrato_id);
    if (!extratoIds.length) {
      throw new Error("Lote sem itens.");
    }

    await api.updateExtratoStatusFinanceiroInIds(extratoIds, "Pago");

    const { data: updated, error } = await supabase
      .from("obra_lotes_pagamento")
      .update({ status: "pago", updated_at: new Date().toISOString() })
      .eq("id", loteId)
      .select("*, itens:obra_lote_itens(*)")
      .single();
    if (error) throw error;
    return updated;
  },

  reabrirLote: async (loteId) => {
    const { data: lote, error: errLote } = await supabase
      .from("obra_lotes_pagamento")
      .select("*, itens:obra_lote_itens(extrato_id)")
      .eq("id", loteId)
      .single();
    if (errLote) throw errLote;

    const extratoIds = (lote.itens || []).map((i) => i.extrato_id);
    if (extratoIds.length) {
      await api.updateExtratoStatusFinanceiroInIds(
        extratoIds,
        "Aguardando pagamento",
      );
    }

    return api.sincronizarLote(loteId);
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
          material: normalizarNomeMaterial(dados.material),
          quantidade: dados.quantidade,
          valor: dados.valor,
          fornecedor_id: dados.fornecedor_id,
          data_solicitacao: dados.data_solicitacao,
          data_vencimento: dados.data_vencimento ?? null,
          status_financeiro: "Aguardando pagamento",
          etapa_nome: dados.etapa_nome || null,
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateMaterialDataVencimento: async (id, dataVencimento) => {
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ data_vencimento: dataVencimento ?? null })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  updateMaterialDataSolicitacao: async (id, dataSolicitacao) => {
    if (!dataSolicitacao) {
      throw new Error("Data de lançamento inválida.");
    }
    const { data, error } = await supabase
      .from("relatorio_materiais")
      .update({ data_solicitacao: dataSolicitacao })
      .eq("id", id)
      .select();
    if (error) throw error;
    const materialAtualizado = data[0];

    if (materialAtualizado) {
      await supabase
        .from("relatorio_extrato")
        .update({ data: dataSolicitacao })
        .eq("material_id", id);
    }
    return materialAtualizado;
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
          etapa_nome: dados.etapa_nome || null,
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateMaoDeObraFinanceiro: async (id, dadosFinanceiros) => {
    const orc = parseFloat(dadosFinanceiros.valor_orcado) || 0;
    const pago = parseFloat(dadosFinanceiros.valor_pago) || 0;
    const cobrado = parseFloat(dadosFinanceiros.valor_cobrado) || 0;
    const novoSaldo = orc - pago;
    const { data, error } = await supabase
      .from("relatorio_mao_de_obra")
      .update({
        valor_orcado: orc,
        valor_pago: pago,
        valor_cobrado: cobrado,
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
          etapa_nome: dadosOriginais.etapa_nome || null,
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

  getDiarioObras: async (obraId, limite, offset = 0) => {
    if (!obraId) return { rows: [], hasMore: false };
    const n = Math.max(1, Math.min(Number(limite) || 6, 100));
    const { data, error } = await supabase
      .from("diario_obras")
      .select("*")
      .eq("obra_id", obraId)
      .order("created_at", { ascending: false })
      .range(offset, offset + n);
    if (error) throw error;
    const raw = Array.isArray(data) ? data : [];
    if (raw.length > n) {
      return { rows: raw.slice(0, n), hasMore: true };
    }
    return { rows: raw, hasMore: false };
  },

  /**
   * Histórico da obra. Login do cliente não usa Supabase Auth (sessão anon),
   * então não usamos RPC com auth.uid(); leitura depende de RLS (incl. policy para anon).
   * Segundo argumento (ex.: `{ isClienteView }`) é ignorado — mantido só por compatibilidade.
   */
  getObraHistorico: async (obraId) => {
    const oid = normalizeObraIdForHistorico(obraId);
    if (oid == null) return [];

    const { data, error } = await supabase
      .from("cliente_historico")
      .select(
        "id, obra_id, author_id, author_nome, mensagem, created_at, updated_at",
      )
      .eq("obra_id", oid)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  addObraHistorico: async ({ obra_id, author_id, author_nome, mensagem }) => {
    const texto = String(mensagem || "").trim();
    const oid = normalizeObraIdForHistorico(obra_id);
    if (oid == null || !author_id || !author_nome || !texto) {
      throw new Error("Dados obrigatórios para adicionar histórico da obra.");
    }
    const { data, error } = await supabase
      .from("cliente_historico")
      .insert({
        obra_id: oid,
        author_id,
        author_nome: String(author_nome).trim(),
        mensagem: texto,
      })
      .select(
        "id, obra_id, author_id, author_nome, mensagem, created_at, updated_at",
      )
      .single();
    if (error) throw error;
    return data;
  },

  updateClienteHistorico: async (id, mensagem) => {
    const texto = String(mensagem || "").trim();
    if (!id || !texto) {
      throw new Error("id e mensagem são obrigatórios para editar histórico.");
    }
    const { data, error } = await supabase
      .from("cliente_historico")
      .update({ mensagem: texto })
      .eq("id", id)
      .select(
        "id, obra_id, author_id, author_nome, mensagem, created_at, updated_at",
      )
      .single();
    if (error) throw error;
    return data;
  },

  deleteClienteHistorico: async (id) => {
    if (!id) throw new Error("id obrigatório para excluir histórico.");
    const { error } = await supabase
      .from("cliente_historico")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  addDiarioObra: async (dados) => {
    const { data, error } = await supabase
      .from("diario_obras")
      .insert(dados)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateDiarioObra: async (id, mensagem) => {
    const { data, error } = await supabase
      .from("diario_obras")
      .update({ mensagem })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteDiarioObra: async (id) => {
    const { error } = await supabase.from("diario_obras").delete().eq("id", id);
    if (error) throw error;
  },

  getObraPedidos: async (obraId) => {
    const oid = normalizeObraIdForHistorico(obraId);
    if (oid == null) return [];
    return buscarPedidosComItens((select) =>
      supabase
        .from("obra_pedidos")
        .select(select)
        .eq("obra_id", oid)
        .order("numero", { ascending: true })
        .order("created_at", { ascending: true }),
    );
  },

  getAllObraPedidos: async () => {
    const pedidos = await buscarPedidosComItens((select) =>
      supabase
        .from("obra_pedidos")
        .select(select)
        .order("numero", { ascending: true })
        .order("created_at", { ascending: true }),
    );
    return enriquecerPedidosComObra(pedidos);
  },

  getObraPedidoById: async (pedidoId) => {
    if (pedidoId == null || pedidoId === "") return null;

    const finalizarPedido = async (pedido) => {
      if (!pedido) return null;
      const [comObra] = await enriquecerPedidosComObra([pedido]);
      return api._enriquecerNumeroPedidoUnico(comObra);
    };

    let { data, error } = await supabase
      .from("obra_pedidos")
      .select(PEDIDO_SELECT_BASE)
      .eq("id", pedidoId)
      .maybeSingle();
    if (error) {
      const fb = await supabase
        .from("obra_pedidos")
        .select(PEDIDO_SELECT_SIMPLES)
        .eq("id", pedidoId)
        .maybeSingle();
      if (fb.error) throw new Error(mensagemErroPedido(fb.error));
      if (!fb.data) return null;
      const [comItens] = await anexarItensAosPedidos([
        normalizarPedido(fb.data),
      ]);
      return finalizarPedido(comItens);
    }
    if (!data) return null;
    return finalizarPedido(normalizarPedido(data));
  },

  _enriquecerNumeroPedidoUnico: async (pedido) => {
    if (!pedido?.obra_id) return pedido;
    const oid = normalizeObraIdForHistorico(pedido.obra_id);
    const { data, error } = await supabase
      .from("obra_pedidos")
      .select("id, obra_id, numero, created_at")
      .eq("obra_id", oid);
    if (error) {
      const [fallback] = enriquecerNumerosPedidos([pedido]);
      return fallback;
    }
    const mesclado = (data || []).map((row) =>
      row.id === pedido.id ? { ...row, ...pedido } : row,
    );
    const enriquecidos = enriquecerNumerosPedidos(mesclado);
    return (
      enriquecidos.find((p) => String(p.id) === String(pedido.id)) || pedido
    );
  },

  addObraPedido: async ({
    obra_id,
    solicitante_id,
    solicitante_nome,
    itens,
  }) => {
    const oid = normalizeObraIdForHistorico(obra_id);
    const lista = Array.isArray(itens) ? itens : [];
    if (oid == null || lista.length === 0) {
      throw new Error(
        "Adicione pelo menos um material antes de lançar o pedido.",
      );
    }
    for (const item of lista) {
      if (!validarItemPedido(item)) {
        throw new Error(
          "Cada material precisa de nome, quantidade, unidade e data de entrega.",
        );
      }
    }
    const numero = await proximoNumeroPedidoObra(oid);
    const payloadPedido = {
      obra_id: oid,
      status: "Pendente",
      solicitante_id: solicitante_id || null,
      solicitante_nome: solicitante_nome
        ? String(solicitante_nome).trim()
        : null,
    };
    if (numero != null) payloadPedido.numero = numero;

    let { data: pedido, error: errPedido } = await supabase
      .from("obra_pedidos")
      .insert(payloadPedido)
      .select("id")
      .single();
    if (
      errPedido &&
      numero != null &&
      /numero|column/i.test(errPedido.message || "")
    ) {
      ({ data: pedido, error: errPedido } = await supabase
        .from("obra_pedidos")
        .insert({
          obra_id: oid,
          status: "Pendente",
          solicitante_id: solicitante_id || null,
          solicitante_nome: solicitante_nome
            ? String(solicitante_nome).trim()
            : null,
        })
        .select("id")
        .single());
    }
    if (errPedido) {
      throw new Error(mensagemErroPedido(errPedido));
    }

    const rows = lista.map((item) => {
      const v = validarItemPedido(item);
      return {
        pedido_id: pedido.id,
        material: v.material,
        quantidade: v.quantidade,
        unidade: v.unidade,
        data_entrega: v.data_entrega,
      };
    });
    const { error: errItens } = await supabase
      .from("obra_pedido_itens")
      .insert(rows);
    if (errItens) {
      await supabase.from("obra_pedidos").delete().eq("id", pedido.id);
      throw new Error(mensagemErroPedido(errItens));
    }
    return api.getObraPedidoById(pedido.id);
  },

  updateObraPedido: async (pedidoId, { itens }) => {
    const atual = await api.getObraPedidoById(pedidoId);
    if (!atual) throw new Error("Pedido não encontrado.");
    const statusNorm = String(atual.status || "")
      .trim()
      .toLowerCase();
    if (statusNorm !== "pendente") {
      throw new Error(
        "Este pedido não pode ser editado porque o status já foi alterado.",
      );
    }
    const lista = Array.isArray(itens) ? itens : [];
    if (lista.length === 0) {
      throw new Error("O pedido precisa de pelo menos um material.");
    }
    for (const item of lista) {
      if (!validarItemPedido(item)) {
        throw new Error(
          "Cada material precisa de nome, quantidade, unidade e data de entrega.",
        );
      }
    }
    const { error: errDel } = await supabase
      .from("obra_pedido_itens")
      .delete()
      .eq("pedido_id", pedidoId);
    if (errDel) throw errDel;

    const rows = lista.map((item) => {
      const v = validarItemPedido(item);
      return {
        pedido_id: pedidoId,
        material: v.material,
        quantidade: v.quantidade,
        unidade: v.unidade,
        data_entrega: v.data_entrega,
      };
    });
    const { error: errIns } = await supabase
      .from("obra_pedido_itens")
      .insert(rows);
    if (errIns) throw errIns;

    const { error: errUpd } = await supabase
      .from("obra_pedidos")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", pedidoId);
    if (errUpd) throw errUpd;

    return api.getObraPedidoById(pedidoId);
  },

  updateObraPedidoItemGestao: async (itemId, campos = {}) => {
    if (itemId == null) throw new Error("Item inválido.");
    const payload = {};
    if (campos.material !== undefined) {
      payload.material = normalizarNomeMaterial(campos.material);
    }
    if (campos.quantidade !== undefined) {
      const q = Number(campos.quantidade);
      if (!Number.isFinite(q) || q <= 0) {
        throw new Error("Quantidade inválida.");
      }
      payload.quantidade = q;
    }
    if (campos.unidade !== undefined) {
      payload.unidade = String(campos.unidade || "Un.").trim();
    }
    if (campos.data_entrega !== undefined) {
      payload.data_entrega = campos.data_entrega || null;
    }
    if (campos.fornecedor_id !== undefined) {
      payload.fornecedor_id = campos.fornecedor_id || null;
    }
    if (campos.etapa_nome !== undefined) {
      payload.etapa_nome = campos.etapa_nome
        ? String(campos.etapa_nome).trim()
        : null;
    }
    if (campos.data_pagamento !== undefined) {
      payload.data_pagamento = campos.data_pagamento || null;
    }
    if (campos.valor !== undefined) {
      if (campos.valor === "" || campos.valor == null) {
        payload.valor = null;
      } else {
        const v = Number(campos.valor);
        payload.valor = Number.isFinite(v) ? v : null;
      }
    }
    if (!Object.keys(payload).length) return true;

    const { data, error } = await supabase
      .from("obra_pedido_itens")
      .update(payload)
      .eq("id", itemId)
      .select("id, material_relatorio_id")
      .maybeSingle();
    if (error) throw new Error(mensagemErroPedido(error));

    if (
      campos.etapa_nome !== undefined &&
      data?.material_relatorio_id != null
    ) {
      await api.updateMaterialEtapa(data.material_relatorio_id, payload.etapa_nome);
    }
    return true;
  },

  updateObraPedidoItensGestaoInIds: async (itemIds, campos = {}) => {
    const lista = (Array.isArray(itemIds) ? itemIds : []).filter(
      (id) => id != null,
    );
    if (!lista.length) return [];

    const payload = {};
    if (campos.fornecedor_id !== undefined) {
      payload.fornecedor_id = campos.fornecedor_id || null;
    }
    if (campos.etapa_nome !== undefined) {
      payload.etapa_nome = campos.etapa_nome
        ? String(campos.etapa_nome).trim()
        : null;
    }
    if (!Object.keys(payload).length) return [];

    const { data, error } = await supabase
      .from("obra_pedido_itens")
      .update(payload)
      .in("id", lista)
      .select("id, material_relatorio_id");
    if (error) throw new Error(mensagemErroPedido(error));

    if (campos.etapa_nome !== undefined) {
      const matIds = (data || [])
        .map((item) => item.material_relatorio_id)
        .filter((id) => id != null);
      if (matIds.length) {
        await api.updateMateriaisEtapaInIds(matIds, payload.etapa_nome);
      }
    }
    return data || [];
  },

  removerItemDaOrdemCompra: async (itemId) => {
    if (itemId == null) throw new Error("Item inválido.");

    const { data: item, error: errItem } = await supabase
      .from("obra_pedido_itens")
      .select("id, pedido_id, grupo_compra_id")
      .eq("id", itemId)
      .maybeSingle();
    if (errItem) throw new Error(mensagemErroPedido(errItem));
    if (!item) throw new Error("Material não encontrado.");
    if (item.grupo_compra_id == null) {
      throw new Error("Este material não está numa ordem de compra.");
    }

    const grupoId = item.grupo_compra_id;

    const { error: errUp } = await supabase
      .from("obra_pedido_itens")
      .update({ grupo_compra_id: null })
      .eq("id", itemId);
    if (errUp) throw new Error(mensagemErroPedido(errUp));

    const { data: restantes, error: errCount } = await supabase
      .from("obra_pedido_itens")
      .select("id")
      .eq("grupo_compra_id", grupoId);
    if (errCount) throw new Error(mensagemErroPedido(errCount));

    if (!(restantes || []).length) {
      await supabase
        .from("obra_pedido_grupos_compra")
        .delete()
        .eq("id", grupoId);
    }

    return api.getPedidoGruposCompra(item.pedido_id);
  },

  updateObraPedidoStatus: async (pedidoId, status) => {
    const novo = String(status || "").trim();
    if (!pedidoId || !novo) {
      throw new Error("Pedido e status são obrigatórios.");
    }
    const { error } = await supabase
      .from("obra_pedidos")
      .update({ status: novo, updated_at: new Date().toISOString() })
      .eq("id", pedidoId);
    if (error) {
      throw new Error(mensagemErroPedido(error));
    }
    return api.getObraPedidoById(pedidoId);
  },

  getPedidoGruposCompra: async (pedidoId) => {
    if (pedidoId == null) return [];
    const { data: grupos, error: errG } = await supabase
      .from("obra_pedido_grupos_compra")
      .select("*")
      .eq("pedido_id", pedidoId)
      .order("numero", { ascending: true });
    if (errG) {
      if (errG.code === "42P01") return [];
      throw new Error(mensagemErroPedido(errG));
    }

    const { data: itens, error: errI } = await supabase
      .from("obra_pedido_itens")
      .select(
        "id, pedido_id, material, quantidade, unidade, data_entrega, grupo_compra_id, material_relatorio_id, fornecedor_id, data_pagamento, valor, etapa_nome",
      )
      .eq("pedido_id", pedidoId);
    if (errI) throw new Error(mensagemErroPedido(errI));

    const porGrupo = {};
    const semGrupo = [];
    for (const item of itens || []) {
      const norm = itemPedidoComMaterialMaiusculo(item);
      if (item.grupo_compra_id != null) {
        const gid = item.grupo_compra_id;
        if (!porGrupo[gid]) porGrupo[gid] = [];
        porGrupo[gid].push(norm);
      } else {
        semGrupo.push(norm);
      }
    }

    return {
      grupos: (grupos || []).map((g) => ({
        ...g,
        itens: porGrupo[g.id] || [],
      })),
      itensSemGrupo: semGrupo,
    };
  },

  _aplicarFornecedorItensGrupo: async (grupoId, fornecedorId) => {
    const fid = fornecedorId || null;
    const { error } = await supabase
      .from("obra_pedido_itens")
      .update({ fornecedor_id: fid })
      .eq("grupo_compra_id", grupoId);
    if (error) throw new Error(mensagemErroPedido(error));
  },

  _aplicarEtapaItensGrupo: async (grupoId, etapaNome) => {
    const etapa = etapaNome ? String(etapaNome).trim() : null;
    const { data, error } = await supabase
      .from("obra_pedido_itens")
      .update({ etapa_nome: etapa })
      .eq("grupo_compra_id", grupoId)
      .select("id, material_relatorio_id");
    if (error) throw new Error(mensagemErroPedido(error));

    const matIds = (data || [])
      .map((item) => item.material_relatorio_id)
      .filter((id) => id != null);
    if (matIds.length) {
      await api.updateMateriaisEtapaInIds(matIds, etapa);
    }
  },

  updateGrupoCompraFornecedor: async (grupoId, fornecedorId) => {
    if (!grupoId) throw new Error("Grupo inválido.");
    await api._aplicarFornecedorItensGrupo(grupoId, fornecedorId || null);
    const { data: grupo } = await supabase
      .from("obra_pedido_grupos_compra")
      .select("pedido_id")
      .eq("id", grupoId)
      .maybeSingle();
    return api.getPedidoGruposCompra(grupo?.pedido_id);
  },

  updateGrupoCompraEtapa: async (grupoId, etapaNome) => {
    if (!grupoId) throw new Error("Grupo inválido.");
    await api._aplicarEtapaItensGrupo(grupoId, etapaNome || null);
    const { data: grupo } = await supabase
      .from("obra_pedido_grupos_compra")
      .select("pedido_id")
      .eq("id", grupoId)
      .maybeSingle();
    return api.getPedidoGruposCompra(grupo?.pedido_id);
  },

  criarOrdensCompra: async ({
    pedidoId,
    emitente,
    itemIds,
    fornecedorId,
    etapaNome,
    separarPorItem = false,
  }) => {
    const pedido = await api.getObraPedidoById(pedidoId);
    if (!pedido) throw new Error("Pedido não encontrado.");

    const ids = (Array.isArray(itemIds) ? itemIds : [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    if (!ids.length) {
      throw new Error("Selecione pelo menos um material.");
    }

    const emit = String(emitente || "montezuma").trim();
    if (!["cliente", "montezuma"].includes(emit)) {
      throw new Error("Emitente inválido.");
    }

    const { data: itensDb, error: errItens } = await supabase
      .from("obra_pedido_itens")
      .select("id, pedido_id, grupo_compra_id, material")
      .eq("pedido_id", pedidoId)
      .in("id", ids);
    if (errItens) throw new Error(mensagemErroPedido(errItens));

    if ((itensDb || []).length !== ids.length) {
      throw new Error("Alguns materiais não pertencem a este pedido.");
    }
    const jaEmGrupo = (itensDb || []).filter((i) => i.grupo_compra_id != null);
    if (jaEmGrupo.length) {
      throw new Error(
        "Um ou mais materiais já pertencem a outra ordem de compra.",
      );
    }

    const { data: existentes } = await supabase
      .from("obra_pedido_grupos_compra")
      .select("numero")
      .eq("pedido_id", pedidoId)
      .order("numero", { ascending: false })
      .limit(1);
    let proximoNumero = (existentes?.[0]?.numero ?? 0) + 1;

    const criados = [];

    const criarGrupoComItens = async (listaIds) => {
      const { data: grupo, error: errG } = await supabase
        .from("obra_pedido_grupos_compra")
        .insert({
          pedido_id: pedidoId,
          numero: proximoNumero,
          emitente: emit,
          status: "Pendente",
        })
        .select()
        .single();
      if (errG) throw new Error(mensagemErroPedido(errG));
      proximoNumero += 1;

      const { error: errUp } = await supabase
        .from("obra_pedido_itens")
        .update({
          grupo_compra_id: grupo.id,
          ...(etapaNome ? { etapa_nome: String(etapaNome).trim() } : {}),
        })
        .in("id", listaIds)
        .eq("pedido_id", pedidoId)
        .is("grupo_compra_id", null);
      if (errUp) throw new Error(mensagemErroPedido(errUp));

      if (fornecedorId) {
        await api._aplicarFornecedorItensGrupo(grupo.id, fornecedorId);
      }

      criados.push(grupo);
    };

    if (separarPorItem) {
      for (const itemId of ids) {
        await criarGrupoComItens([itemId]);
      }
    } else {
      await criarGrupoComItens(ids);
    }

    const completo = await api.getPedidoGruposCompra(pedidoId);
    const idsCriados = new Set(criados.map((g) => g.id));
    return {
      ...completo,
      gruposCriados: (completo.grupos || []).filter((g) =>
        idsCriados.has(g.id),
      ),
    };
  },

  updateGrupoCompraStatus: async (grupoId, status) => {
    const novo = String(status || "").trim();
    if (!grupoId || !novo) throw new Error("Grupo e status são obrigatórios.");

    const { data: grupo, error } = await supabase
      .from("obra_pedido_grupos_compra")
      .update({ status: novo, updated_at: new Date().toISOString() })
      .eq("id", grupoId)
      .select()
      .single();
    if (error) throw new Error(mensagemErroPedido(error));

    if (novo === "Comprado") {
      await api._sincronizarGrupoCompraComMateriais(grupoId);
    }

    const pedidoId = grupo.pedido_id;
    return api.getPedidoGruposCompra(pedidoId);
  },

  _sincronizarGrupoCompraComMateriais: async (grupoId) => {
    const { data: grupoRow, error: errG } = await supabase
      .from("obra_pedido_grupos_compra")
      .select("pedido_id")
      .eq("id", grupoId)
      .maybeSingle();
    if (errG) throw new Error(mensagemErroPedido(errG));
    if (!grupoRow?.pedido_id) return;

    const { data: pedidoRow, error: errP } = await supabase
      .from("obra_pedidos")
      .select("obra_id")
      .eq("id", grupoRow.pedido_id)
      .maybeSingle();
    if (errP) throw new Error(mensagemErroPedido(errP));

    const obraId = pedidoRow?.obra_id;
    if (obraId == null) return;

    const { data: itens, error: errI } = await supabase
      .from("obra_pedido_itens")
      .select(
        "id, material, quantidade, unidade, data_entrega, material_relatorio_id, fornecedor_id, valor, etapa_nome",
      )
      .eq("grupo_compra_id", grupoId);
    if (errI) throw new Error(mensagemErroPedido(errI));

    const dataAtual = new Date().toISOString().split("T")[0];
    const pendentes = (itens || []).filter(
      (item) => item.material_relatorio_id == null,
    );

    await Promise.all(
      pendentes.map(async (item) => {
        const valorNum =
          item.valor != null && item.valor !== "" ? Number(item.valor) : 0;

        const payload = {
          obra_id: obraId,
          material: normalizarNomeMaterial(item.material),
          quantidade: `${item.quantidade} ${item.unidade || "Un."}`,
          valor: Number.isFinite(valorNum) ? valorNum : 0,
          fornecedor_id: item.fornecedor_id || null,
          data_solicitacao: dataAtual,
          data_vencimento: item.data_entrega || null,
          status_financeiro: "Aguardando pagamento",
          status: "Aguardando entrega",
          etapa_nome: item.etapa_nome || null,
        };

        let { data: mat, error: errM } = await supabase
          .from("relatorio_materiais")
          .insert(payload)
          .select("id")
          .single();

        if (errM && /fornecedor/i.test(errM.message || "")) {
          ({ data: mat, error: errM } = await supabase
            .from("relatorio_materiais")
            .insert({ ...payload, fornecedor_id: null })
            .select("id")
            .single());
        }
        if (errM) {
          console.error("[grupo compra] sync material:", errM);
          return;
        }

        if (mat?.id) {
          await supabase
            .from("obra_pedido_itens")
            .update({ material_relatorio_id: mat.id })
            .eq("id", item.id);
        }
      }),
    );
  },

  getCronogramaEventos: async (obraId, de, ate) => {
    if (!obraId) return [];
    const s = String(obraId).trim();
    const oid = /^\d+$/.test(s) ? Number(s) : s;
    let q = supabase.from("cronograma_eventos").select("*").eq("obra_id", oid);
    if (de && ate) {
      // Sobrepõe [de, ate]: evento de um dia em [de,ate] OU intervalo [início,fim] a cruzar a janela
      q = q.or(
        `and(data_fim.is.null,data_evento.gte.${de},data_evento.lte.${ate}),and(data_fim.not.is.null,data_evento.lte.${ate},data_fim.gte.${de})`,
      );
    } else {
      if (de) q = q.gte("data_evento", de);
      if (ate) q = q.lte("data_evento", ate);
    }
    q = q.order("data_evento", { ascending: true });
    const { data, error } = await q;
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  addCronogramaEvento: async (dados) => {
    const { data, error } = await supabase
      .from("cronograma_eventos")
      .insert(dados)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteCronogramaEvento: async (id) => {
    const { error } = await supabase
      .from("cronograma_eventos")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  // ─── Projeções comerciais (Montezuma) ───────────────────────────────────────
  getProjecoes: async () => {
    const { data, error } = await supabase
      .from("projecoes")
      .select("*")
      .order("data_proposta", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getProjecaoById: async (id) => {
    if (!id) return null;
    const { data, error } = await supabase
      .from("projecoes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  createProjecao: async (payload) => {
    const derivados = projecaoPayloadComValoresDerivados(payload);
    const row = omitUndefined({
      nome: payload.nome?.trim(),
      cliente_nome: payload.cliente_nome?.trim() || null,
      contato: payload.contato?.trim() || null,
      endereco_obra: payload.endereco_obra?.trim() || null,
      descricao: payload.descricao?.trim() || null,
      status: payload.status || "Rascunho",
      data_proposta:
        payload.data_proposta || new Date().toISOString().slice(0, 10),
      valor_documentacao: derivados.valor_documentacao,
      valor_projeto: derivados.valor_projeto,
      valor_obra: derivados.valor_obra,
      itens: derivados.itens,
      observacoes: payload.observacoes?.trim() || null,
    });
    if (!row.nome) throw new Error("Nome da projeção é obrigatório.");
    const { data, error } = await supabase
      .from("projecoes")
      .insert([row])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateProjecao: async (id, dados) => {
    if (!id) throw new Error("ID da projeção é obrigatório.");
    const derivados =
      dados.itens != null ? projecaoPayloadComValoresDerivados(dados) : null;
    const limpo = omitUndefined({
      nome: dados.nome?.trim(),
      cliente_nome: dados.cliente_nome?.trim(),
      contato: dados.contato?.trim(),
      endereco_obra: dados.endereco_obra?.trim(),
      descricao: dados.descricao?.trim(),
      status: dados.status,
      data_proposta: dados.data_proposta,
      valor_documentacao: derivados?.valor_documentacao,
      valor_projeto: derivados?.valor_projeto,
      valor_obra: derivados?.valor_obra,
      itens: derivados?.itens,
      observacoes: dados.observacoes?.trim(),
    });
    const { data, error } = await supabase
      .from("projecoes")
      .update(limpo)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteProjecao: async (id) => {
    if (!id) throw new Error("ID da projeção é obrigatório.");
    const { error } = await supabase.from("projecoes").delete().eq("id", id);
    if (error) throw error;
  },

  getHomeDashboardCounts: async () => {
    const daqui2 = new Date();
    daqui2.setDate(daqui2.getDate() + 2);
    const daqui2Str = daqui2.toISOString().slice(0, 10);

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;
    const mesStr = String(mesAtual).padStart(2, "0");
    const primeiroDiaMes = `${anoAtual}-${mesStr}-01`;
    const ultimoDiaMes = new Date(anoAtual, mesAtual, 0).getDate();
    const fimMes = `${anoAtual}-${mesStr}-${String(ultimoDiaMes).padStart(2, "0")}`;

    const [
      obrasRows,
      processosRows,
      pendenciasEntradas,
      pendenciasSaida,
      tarefas,
    ] = await Promise.all([
      supabase
        .from("obras")
        .select("status")
        .eq("active", true)
        .eq("status", "Em andamento"),
      supabase
        .from("clientes")
        .select("status")
        .in("escritorio_id", [ID_VOGELKOP, ID_YBYOCA])
        .in("status", ["Prefeitura", "Caixa", "Cartorio", "Obra"]),
      supabase
        .from("entradas")
        .select("id", { count: "exact", head: true })
        .eq("escritorio_id", ID_MONTEZUMA)
        .eq("validacao", 0)
        .gte("data", primeiroDiaMes)
        .lte("data", fimMes),
      supabase
        .from("saida")
        .select("id", { count: "exact", head: true })
        .eq("escritorio_id", ID_MONTEZUMA)
        .eq("validacao", 0)
        .gte("data", primeiroDiaMes)
        .lte("data", fimMes),
      supabase
        .from("tarefas")
        .select("id", { count: "exact", head: true })
        .neq("status", TAREFA_STATUS.concluida)
        .or(`prioridade.eq.Alta,data_conclusao.lte.${daqui2Str}`),
    ]);

    if (obrasRows.error) throw obrasRows.error;
    if (processosRows.error) throw processosRows.error;
    if (pendenciasEntradas.error) throw pendenciasEntradas.error;
    if (pendenciasSaida.error) throw pendenciasSaida.error;
    if (tarefas.error) throw tarefas.error;

    const obrasLista = obrasRows.data ?? [];
    const processosLista = processosRows.data ?? [];
    const pendenciasEntradasCount = pendenciasEntradas.count ?? 0;
    const pendenciasSaidaCount = pendenciasSaida.count ?? 0;

    const processosPorStatus = processosLista.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      },
      { Prefeitura: 0, Caixa: 0, Cartorio: 0, Obra: 0 },
    );

    return {
      obrasAtivas: obrasLista.length,
      obrasEmAndamento: obrasLista.filter((o) => o.status === "Em andamento")
        .length,
      obrasAguardando: obrasLista.filter(
        (o) => o.status === "Aguardando iniciação",
      ).length,
      processos: processosLista.length,
      processosPrefeitura: processosPorStatus.Prefeitura,
      processosCaixa: processosPorStatus.Caixa,
      processosCartorio: processosPorStatus.Cartorio,
      processosObra: processosPorStatus.Obra,
      pendencias: pendenciasEntradasCount + pendenciasSaidaCount,
      pendenciasEntradas: pendenciasEntradasCount,
      pendenciasSaida: pendenciasSaidaCount,
      mesReferencia: hoje.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      }),
      tarefas: tarefas.count ?? 0,
    };
  },

  // ─── Relatórios Diretoria (semanais por obra) ───────────────────────────────
  getObrasParaRelatorios: async () => {
    const { data, error } = await supabase
      .from("obras")
      .select("id, cliente, local, status, clientes!cliente_id(nome)")
      .eq("active", true)
      .order("cliente", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  getObraResumoParaRelatorio: async (obraId) => {
    if (!obraId) return null;
    const { data, error } = await supabase
      .from("obras")
      .select("id, cliente, local, status, clientes!cliente_id(nome, tipo)")
      .eq("id", obraId)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new Error("Obra não encontrada ou sem permissão de acesso.");
    return data;
  },

  getObraFinanceiroParaRelatorio: async (obraId) => {
    if (!obraId) return null;
    const { data, error } = await supabase
      .from("obras")
      .select(
        `id, cliente, local, status, clientes!cliente_id(nome, tipo),
        materiais:relatorio_materiais(id, material, quantidade, valor, data_solicitacao, data_vencimento, status_financeiro, etapa_nome, fornecedores(nome)),
        maoDeObra:relatorio_mao_de_obra(id, tipo, profissional, valor_cobrado, valor_orcado, valor_pago, saldo, data_solicitacao, validacao, etapa_nome),
        locacoes:relatorio_locacoes(id, equipamento, valor, data_coleta, data_vencimento, validacao, status_financeiro, etapa_nome),
        relatorioExtrato:relatorio_extrato(id, descricao, tipo, valor, data, status_financeiro, material_id, mao_de_obra_id, locacao_id, etapa_nome)`,
      )
      .eq("id", obraId)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new Error("Obra não encontrada ou sem permissão de acesso.");
    return {
      ...data,
      materiais: normalizarMateriaisLista(data.materiais),
    };
  },

  getRelatoriosDiretoriaPorObra: async (obraId, { ano, mes }) => {
    if (!obraId) return [];
    const semanaInicios =
      ano != null && mes != null
        ? semanasDoMes(ano, mes).map((s) => s.inicio)
        : [];

    const queries = [];

    if (semanaInicios.length > 0) {
      queries.push(
        supabase
          .from("relatorios_diretoria")
          .select("*")
          .eq("obra_id", obraId)
          .in("semana_inicio", semanaInicios),
      );
    }

    if (ano != null && mes != null) {
      queries.push(
        supabase
          .from("relatorios_diretoria")
          .select("*")
          .eq("obra_id", obraId)
          .eq("ano", ano)
          .eq("mes", mes)
          .is("semana_inicio", null),
      );
    }

    if (!queries.length) {
      const { data, error } = await supabase
        .from("relatorios_diretoria")
        .select("*")
        .eq("obra_id", obraId)
        .order("semana_inicio", { ascending: true })
        .order("modalidade", { ascending: true });
      if (error) throw error;
      return data || [];
    }

    const results = await Promise.all(queries);
    for (const { error } of results) {
      if (error) throw error;
    }

    const merged = results.flatMap((r) => r.data || []);
    const byId = new Map();
    merged.forEach((row) => {
      if (row?.id) byId.set(row.id, row);
    });

    return Array.from(byId.values()).sort((a, b) => {
      const sa = a.semana_inicio || "";
      const sb = b.semana_inicio || "";
      if (sa !== sb) return sa.localeCompare(sb);
      return String(a.modalidade).localeCompare(String(b.modalidade));
    });
  },

  getRelatoriosDiretoriaSemana: async (obraId, semanaInicio) => {
    if (!obraId || !semanaInicio) return [];
    const inicio = String(semanaInicio).slice(0, 10);

    const { data: modern, error: errModern } = await supabase
      .from("relatorios_diretoria")
      .select("*")
      .eq("obra_id", obraId)
      .eq("semana_inicio", inicio);

    if (errModern) throw errModern;
    if (modern?.length) return modern;

    const { data: legacy, error: errLegacy } = await supabase
      .from("relatorios_diretoria")
      .select("*")
      .eq("obra_id", obraId)
      .is("semana_inicio", null);

    if (errLegacy) throw errLegacy;

    return (legacy || []).filter(
      (row) => chaveSemanaLancamento(row) === inicio,
    );
  },

  getContagemRelatoriosDiretoriaMes: async (ano, mes) => {
    const semanaInicios = semanasDoMes(ano, mes).map((s) => s.inicio);
    const queries = [];

    if (semanaInicios.length > 0) {
      queries.push(
        supabase
          .from("relatorios_diretoria")
          .select("obra_id")
          .in("semana_inicio", semanaInicios),
      );
    }

    queries.push(
      supabase
        .from("relatorios_diretoria")
        .select("obra_id")
        .eq("ano", ano)
        .eq("mes", mes)
        .is("semana_inicio", null),
    );

    const results = await Promise.all(queries);
    for (const { error } of results) {
      if (error) throw error;
    }

    const contagem = {};
    results.forEach(({ data }) => {
      (data || []).forEach((row) => {
        const id = row.obra_id;
        contagem[id] = (contagem[id] || 0) + 1;
      });
    });
    return contagem;
  },

  upsertRelatorioDiretoria: async (payload) => {
    const {
      obra_id,
      modalidade,
      ano,
      mes,
      semana_ref,
      semana_inicio,
      conteudo,
      criado_por,
    } = payload || {};
    if (!obra_id) throw new Error("Obra é obrigatória.");
    if (!modalidade) throw new Error("Modalidade é obrigatória.");

    const inicio =
      semana_inicio != null ? String(semana_inicio).slice(0, 10) : null;

    if (!inicio && (ano == null || mes == null || semana_ref == null)) {
      throw new Error("Período e semana são obrigatórios.");
    }

    let userId = criado_por;
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id ?? null;
    }

    let anoSalvar = ano;
    let mesSalvar = mes;
    let semanaRefSalvar = semana_ref;

    if (inicio) {
      const d = new Date(`${inicio}T12:00:00`);
      if (!Number.isNaN(d.getTime())) {
        anoSalvar = d.getFullYear();
        mesSalvar = d.getMonth() + 1;
        const idx = semanasDoMes(anoSalvar, mesSalvar).findIndex(
          (s) => s.inicio === inicio,
        );
        semanaRefSalvar = idx >= 0 ? idx + 1 : (semana_ref ?? 1);
      }
    }

    const row = {
      obra_id,
      modalidade,
      ano: Number(anoSalvar),
      mes: Number(mesSalvar),
      semana_ref: Number(semanaRefSalvar ?? 1),
      semana_inicio: inicio,
      conteudo: conteudo && typeof conteudo === "object" ? conteudo : {},
      updated_at: new Date().toISOString(),
    };
    if (userId) row.criado_por = userId;

    // PostgREST upsert exige UNIQUE CONSTRAINT; índices parciais (migration
    // semana_inicio) não são aceitos em onConflict — busca + update/insert.
    let query = supabase
      .from("relatorios_diretoria")
      .select("id")
      .eq("obra_id", obra_id)
      .eq("modalidade", modalidade);

    if (inicio) {
      query = query.eq("semana_inicio", inicio);
    } else {
      query = query
        .eq("ano", row.ano)
        .eq("mes", row.mes)
        .eq("semana_ref", row.semana_ref)
        .is("semana_inicio", null);
    }

    const { data: existente, error: errBusca } = await query.maybeSingle();
    if (errBusca) throw errBusca;

    if (existente?.id) {
      const { criado_por: _c, obra_id: _o, modalidade: _m, ...patch } = row;
      const { data, error } = await supabase
        .from("relatorios_diretoria")
        .update(patch)
        .eq("id", existente.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from("relatorios_diretoria")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteRelatorioDiretoria: async (id) => {
    if (!id) throw new Error("ID do relatório é obrigatório.");
    const { error } = await supabase
      .from("relatorios_diretoria")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  proximoNumeroOS: async (escritorioId) => {
    if (!escritorioId) throw new Error("escritorio_id obrigatório.");
    const { data, error } = await supabase
      .from("ordens_servico")
      .select("numero")
      .eq("escritorio_id", escritorioId)
      .order("numero", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data?.numero ?? 0) + 1;
  },

  listOrdensServico: async ({ escritorioId } = {}) => {
    let query = supabase
      .from("ordens_servico")
      .select(
        `
        *,
        criador:usuarios!ordens_servico_criador_id_fkey(id, nome),
        responsavel:usuarios!ordens_servico_responsavel_id_fkey(id, nome),
        concluido_por:usuarios!ordens_servico_concluido_por_id_fkey(id, nome)
      `,
      )
      .order("data_emissao", { ascending: false })
      .order("numero", { ascending: false });

    if (escritorioId) {
      query = query.eq("escritorio_id", escritorioId);
    }

    const { data, error } = await query;
    if (error) {
      const { data: fallback, error: err2 } = await supabase
        .from("ordens_servico")
        .select("*")
        .order("data_emissao", { ascending: false })
        .order("numero", { ascending: false });
      if (escritorioId && !err2) {
        return (fallback || []).filter(
          (r) => String(r.escritorio_id) === String(escritorioId),
        );
      }
      if (err2) throw error;
      return Array.isArray(fallback) ? fallback : [];
    }
    return Array.isArray(data) ? data : [];
  },

  getOrdemServicoById: async (id) => {
    if (!id) return null;
    const { data, error } = await supabase
      .from("ordens_servico")
      .select(
        `
        *,
        criador:usuarios!ordens_servico_criador_id_fkey(id, nome),
        responsavel:usuarios!ordens_servico_responsavel_id_fkey(id, nome),
        concluido_por:usuarios!ordens_servico_concluido_por_id_fkey(id, nome)
      `,
      )
      .eq("id", id)
      .maybeSingle();
    if (error) {
      const { data: fallback, error: err2 } = await supabase
        .from("ordens_servico")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (err2) throw error;
      return fallback;
    }
    return data;
  },

  createOrdemServico: async (payload) => {
    if (!payload?.escritorio_id) {
      throw new Error("escritorio_id obrigatório.");
    }
    if (!payload?.criador_id) {
      throw new Error("criador_id obrigatório.");
    }

    const numero =
      payload.numero ??
      (await (async () => {
        const { data, error } = await supabase
          .from("ordens_servico")
          .select("numero")
          .eq("escritorio_id", payload.escritorio_id)
          .order("numero", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return (data?.numero ?? 0) + 1;
      })());

    const row = omitUndefined({
      numero,
      escritorio_id: payload.escritorio_id,
      criador_id: payload.criador_id,
      responsavel_id: payload.responsavel_id || null,
      status: payload.status || "pendente",
      data_emissao: payload.data_emissao || new Date().toISOString().slice(0, 10),
      cliente_id: payload.cliente_id || null,
      responsavel_tecnico: payload.responsavel_tecnico || null,
      cliente_nome: payload.cliente_nome || null,
      cliente_telefone: payload.cliente_telefone || null,
      cliente_email: payload.cliente_email || null,
      endereco_projeto: payload.endereco_projeto || null,
      objeto_servico: payload.objeto_servico || null,
      escopo: Array.isArray(payload.escopo) ? payload.escopo : [],
      escopo_outro: payload.escopo_outro || null,
      descricao_servicos: payload.descricao_servicos || null,
      data_inicio: payload.data_inicio || null,
      data_entrega_prevista: payload.data_entrega_prevista || null,
      observacoes_prazos: payload.observacoes_prazos || null,
      valor_total:
        payload.valor_total != null && payload.valor_total !== ""
          ? Number(payload.valor_total)
          : null,
      formas_pagamento: Array.isArray(payload.formas_pagamento)
        ? payload.formas_pagamento
        : [],
      forma_pagamento_outro: payload.forma_pagamento_outro || null,
      observacoes_gerais: payload.observacoes_gerais || null,
      updated_at: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from("ordens_servico")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  updateOrdemServico: async (id, payload) => {
    if (!id) throw new Error("ID da OS é obrigatório.");
    const limpo = { ...payload };
    delete limpo.id;
    delete limpo.numero;
    delete limpo.criador_id;
    delete limpo.escritorio_id;
    if (limpo.valor_total != null && limpo.valor_total !== "") {
      limpo.valor_total = Number(limpo.valor_total);
    }
    limpo.updated_at = new Date().toISOString();
    const cleaned = omitUndefined(limpo);

    const { data, error } = await supabase
      .from("ordens_servico")
      .update(cleaned)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  concluirOrdemServico: async (id, usuarioId) => {
    if (!id) throw new Error("ID da OS é obrigatório.");
    const { data, error } = await supabase
      .from("ordens_servico")
      .update({
        status: "concluida",
        data_conclusao: new Date().toISOString(),
        concluido_por_id: usuarioId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  listUsuariosDestinatariosOS: async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, tipo, escritorio_id, subclasses")
      .order("nome", { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },
};
