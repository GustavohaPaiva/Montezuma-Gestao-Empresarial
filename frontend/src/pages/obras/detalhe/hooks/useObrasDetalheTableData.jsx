import { useMemo } from "react";
import { ORDEM_STATUS } from "../constants";
import {
  calcularDataDevolucao,
  desempatePorId,
  formatarDataBR,
  formatarMoeda,
} from "../utils/formatters";
import CellInputNumber from "../components/CellInputNumber";
import CellInputDate from "../components/CellInputDate";
import CellSelectFornecedor from "../components/CellSelectFornecedor";
import StatusSelectBadge from "../../../../components/gerais/StatusSelectBadge";
import { STATUS_MATERIAL_OPCOES } from "../../../../components/gerais/statusSelectOptions";
import CellSelectPrestador from "../components/CellSelectPrestador";
import CellSelectSolicitante from "../components/CellSelectSolicitante";
import {
  filtrarMaoDeObraLista,
  filtrarMateriaisLista,
} from "../utils/relatorioFiltrosUtils";
import {
  getExtratoIdsEmLotesAbertos,
  getMapaLotesPorExtrato,
  isExtratoPago,
  labelsExtratoFinanceiro,
} from "../utils/lotesPagamentoUtils";

/** Lista do extrato após busca textual e filtro de tipo (mesma regra da tabela). */
export function filtrarExtratoLista(
  relatorioExtrato,
  buscaExtrato,
  filtroExtrato,
  somenteValidados = false,
) {
  if (!relatorioExtrato?.length) return [];
  let lista = [...relatorioExtrato];
  if (somenteValidados) {
    lista = lista.filter((item) => item.validacao === 1);
  }
  if (buscaExtrato) {
    const termo = buscaExtrato.toLowerCase();
    lista = lista.filter((item) =>
      item.descricao?.toLowerCase().includes(termo),
    );
  }
  if (filtroExtrato === "Materiais")
    lista = lista.filter((i) => i.tipo === "Material");
  else if (filtroExtrato === "Mão de Obra")
    lista = lista.filter((i) => i.tipo === "Mão de Obra");
  else if (filtroExtrato === "Locações")
    lista = lista.filter((i) => i.tipo === "Locação");
  return lista;
}

export function useObrasDetalheTableData({
  obra,
  buscaMateriais,
  filtroFornecedorId,
  sortConfig,
  editandoMaterial,
  setEditandoMaterial,
  handleStatusChange,
  salvarValorMaterial,
  salvarFornecedorMaterial,
  salvarFornecedorLocacao,
  salvarDataVencimentoMaterial,
  salvarDataSolicitacaoMaterial,
  handleDeleteMaterial,
  buscaLocacoes,
  editandoLocacao,
  setEditandoLocacao,
  handleStatusChangeLocacao,
  salvarValorLocacao,
  salvarSolicitanteLocacao,
  salvarDataColetaLocacao,
  handleDeleteLocacao,
  handleValidarLocacao,
  buscaMaoDeObra,
  filtroPrestadorId,
  sortConfigMdo,
  editandoMaoDeObra,
  setEditandoMaoDeObra,
  handleValidarMaoDeObra,
  salvarEdicaoMaoDeObra,
  salvarEdicaoMaoDeObraProfissional,
  handleDeleteMaoDeObra,
  buscaExtrato,
  filtroExtrato,
  sortField,
  sortDirection,
  editandoId,
  setEditandoId,
  salvarValorExtrato,
  handleCheckExtrato,
  handleStatusFinanceiroChange,
  handleCheckAllExtrato,
  handleSortExtrato,
  somenteValidados = false,
  extratoSomenteLeitura = false,
}) {
  const listaMateriaisFiltrada = useMemo(() => {
    if (!obra?.materiais) return [];
    return filtrarMateriaisLista(obra.materiais, {
      busca: buscaMateriais,
      fornecedorId: filtroFornecedorId,
    });
  }, [obra?.materiais, buscaMateriais, filtroFornecedorId]);

  const totaisMateriaisFiltrados = useMemo(
    () =>
      listaMateriaisFiltrada.reduce(
        (acc, m) => acc + (parseFloat(m.valor) || 0),
        0,
      ),
    [listaMateriaisFiltrada],
  );

  const dadosMateriais = useMemo(() => {
    if (!obra || !obra.materiais) return [];
    let listaMateriais = [...listaMateriaisFiltrada];

    if (sortConfig.campo) {
      listaMateriais.sort((a, b) => {
        let valA, valB;
        if (sortConfig.campo === "fornecedor") {
          valA = (a.fornecedores?.nome || a.fornecedor || "").toLowerCase();
          valB = (b.fornecedores?.nome || b.fornecedor || "").toLowerCase();
        } else if (sortConfig.campo === "data") {
          valA = new Date(a.data_solicitacao).getTime();
          valB = new Date(b.data_solicitacao).getTime();
        } else if (sortConfig.campo === "status") {
          valA = ORDEM_STATUS[a.status] || 0;
          valB = ORDEM_STATUS[b.status] || 0;
        }
        if (valA < valB) return sortConfig.direcao === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direcao === "asc" ? 1 : -1;
        return desempatePorId(a, b);
      });
    } else {
      listaMateriais.sort((a, b) => {
        const isA = a.status === "Entregue";
        const isB = b.status === "Entregue";
        if (isA && !isB) return 1;
        if (!isA && isB) return -1;
        return desempatePorId(a, b);
      });
    }

    return listaMateriais.map((m) => {
      const isEditingValor =
        editandoMaterial.id === m.id && editandoMaterial.campo === "valor";
      const isEditingFornecedor =
        editandoMaterial.id === m.id && editandoMaterial.campo === "fornecedor";
      const isEditingVencimento =
        editandoMaterial.id === m.id && editandoMaterial.campo === "vencimento";
      const isEditingDataSolicitacao =
        editandoMaterial.id === m.id &&
        editandoMaterial.campo === "data_solicitacao";
      const qtdNumerica = parseFloat(m.quantidade) || 0;
      const valorUnitario = qtdNumerica > 0 ? m.valor / qtdNumerica : 0;

      const nomeFornecedorExibicao =
        m.fornecedores?.nome || m.fornecedor || "-";

      const isPagoMat = (m.status_financeiro || "").toLowerCase() === "pago";
      const valorTotalClassMat = isPagoMat
        ? "text-emerald-700"
        : "text-text-primary";

      return [
        <div className="uppercase">{m.material}</div>,
        m.quantidade,
        `R$ ${formatarMoeda(valorUnitario)}`,
        <div
          className="flex items-center justify-center gap-2"
          key={`val-${m.id}`}
          title={isPagoMat ? "Material pago" : "Material aguardando pagamento"}
        >
          {isEditingValor ? (
            <CellInputNumber
              valorInicial={m.valor || 0}
              onSave={(val) => salvarValorMaterial(m.id, val)}
              onCancel={() => setEditandoMaterial({ id: null, campo: null })}
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => setEditandoMaterial({ id: m.id, campo: "valor" })}
            >
              <span className={`font-bold tabular-nums ${valorTotalClassMat}`}>
                R$ {formatarMoeda(m.valor || 0)}
              </span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[8px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,
        <StatusSelectBadge
          key={`status-${m.id}`}
          variant="material"
          value={m.status || "Solicitado"}
          onChange={(novo) => handleStatusChange(m.id, novo)}
          options={STATUS_MATERIAL_OPCOES}
        />,
        <div
          className="flex items-center justify-center gap-2"
          key={`forn-${m.id}`}
        >
          {isEditingFornecedor ? (
            <CellSelectFornecedor
              valorInicialId={m.fornecedor_id}
              onSave={(novoId) => salvarFornecedorMaterial(m.id, novoId)}
              onCancel={() => setEditandoMaterial({ id: null, campo: null })}
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer justify-center"
              onClick={() =>
                setEditandoMaterial({ id: m.id, campo: "fornecedor" })
              }
            >
              <div className="uppercase text-[13px]">
                {nomeFornecedorExibicao}
              </div>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[4px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2"
          key={`sol-${m.id}`}
        >
          {isEditingDataSolicitacao ? (
            <CellInputDate
              valorInicial={m.data_solicitacao}
              onSave={(val) => salvarDataSolicitacaoMaterial(m.id, val)}
              onCancel={() => setEditandoMaterial({ id: null, campo: null })}
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer justify-center"
              onClick={() =>
                setEditandoMaterial({ id: m.id, campo: "data_solicitacao" })
              }
            >
              <div>{formatarDataBR(m.data_solicitacao)}</div>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[4px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2"
          key={`venc-${m.id}`}
        >
          {isEditingVencimento ? (
            <CellInputDate
              valorInicial={m.data_vencimento}
              onSave={(val) => salvarDataVencimentoMaterial(m.id, val)}
              onCancel={() => setEditandoMaterial({ id: null, campo: null })}
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer justify-center"
              onClick={() =>
                setEditandoMaterial({ id: m.id, campo: "vencimento" })
              }
            >
              <div>{formatarDataBR(m.data_vencimento)}</div>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[4px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,
        <div
          className="flex justify-center px-1 py-0.5"
          key={`del-mat-${m.id}`}
        >
          <button
            onClick={() => handleDeleteMaterial(m.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-300/50 bg-rose-500/12 text-rose-700 shadow-sm hover:bg-rose-500/20 cursor-pointer transition-colors"
          >
            <img
              width="18"
              height="18"
              src="https://img.icons8.com/material-outlined/24/FA5252/trash.png"
              alt="delete"
            />
          </button>
        </div>,
      ];
    });
  }, [
    obra,
    editandoMaterial,
    handleStatusChange,
    salvarValorMaterial,
    salvarFornecedorMaterial,
    salvarDataVencimentoMaterial,
    salvarDataSolicitacaoMaterial,
    handleDeleteMaterial,
    listaMateriaisFiltrada,
    sortConfig,
    setEditandoMaterial,
  ]);

  const dadosLocacoes = useMemo(() => {
    if (!obra?.locacoes?.length) return [];
    let lista = [...obra.locacoes];

    if (buscaLocacoes) {
      const termo = buscaLocacoes.toLowerCase();
      lista = lista.filter(
        (l) =>
          l.equipamento?.toLowerCase().includes(termo) ||
          l.solicitante?.toLowerCase().includes(termo) ||
          l.tipo_periodo?.toLowerCase().includes(termo),
      );
    }

    lista.sort((a, b) => {
      const valA = a.validacao || 0;
      const valB = b.validacao || 0;
      if (valA !== valB) return valA - valB;
      return desempatePorId(a, b);
    });

    return lista.map((l) => {
      let tipoPeriodo = "—";
      if (l.periodo === 1) {
        if (l.tipo_periodo === "Mensal") {
          tipoPeriodo = "Mês";
        } else if (l.tipo_periodo === "Semanal") {
          tipoPeriodo = "Semana";
        } else if (l.tipo_periodo === "Diário") {
          tipoPeriodo = "Dia";
        } else if (l.tipo_periodo === "Anual") {
          tipoPeriodo = "Ano";
        }
      } else {
        if (l.tipo_periodo === "Mensal") {
          tipoPeriodo = "Meses";
        } else if (l.tipo_periodo === "Semanal") {
          tipoPeriodo = "Semanas";
        } else if (l.tipo_periodo === "Diário") {
          tipoPeriodo = "Dias";
        } else if (l.tipo_periodo === "Anual") {
          tipoPeriodo = "Anos";
        }
      }

      const isEditingFornecedorLocacao =
        editandoLocacao.id === l.id && editandoLocacao.campo === "fornecedor";
      const quantidadeLabel = `${l.quantidade} un.`;
      const isEditingValor =
        editandoLocacao.id === l.id && editandoLocacao.campo === "valor";
      const isEditingDataColeta =
        editandoLocacao.id === l.id && editandoLocacao.campo === "data_coleta";
      const isEditingSolicitante =
        editandoLocacao.id === l.id && editandoLocacao.campo === "solicitante";
      const periodoLabel = `${l.periodo} ${tipoPeriodo || "—"}`;
      const dataDevolucaoCalc =
        calcularDataDevolucao(l.data_coleta, l.periodo, l.tipo_periodo) ||
        l.data_vencimento;
      const isValidadoLoc = l.validacao === 1;
      const isPagoLoc = (l.status_financeiro || "").toLowerCase() === "pago";
      const valorTotalClassLoc = isPagoLoc
        ? "font-bold text-emerald-700"
        : "text-text-primary";

      return [
        // Validação (checkbox para enviar ao extrato — mesma lógica de MdO)
        <label
          className="flex items-center justify-center"
          key={`cb-loc-${l.id}`}
          title={
            isValidadoLoc
              ? "Locação já enviada ao extrato"
              : "Enviar para o extrato"
          }
        >
          <input
            type="checkbox"
            checked={isValidadoLoc}
            disabled={isValidadoLoc}
            onChange={() => handleValidarLocacao(l)}
            className="h-[15px] w-[15px] text-[#abe4a0] transition duration-150 ease-in-out cursor-pointer disabled:opacity-50"
          />
        </label>,

        // Nome do equipamento
        <div key={`eq-${l.id}`}>{l.equipamento}</div>,

        // Quantidade
        quantidadeLabel,

        // Período Formatado em periodo e tipo periodo
        periodoLabel,

        // Solicitante (editável)
        <div
          className="flex items-center justify-center gap-2"
          key={`sol-loc-${l.id}`}
        >
          {isEditingSolicitante ? (
            <CellSelectSolicitante
              valorInicial={l.solicitante}
              nomeCliente={obra?.clientes}
              onSave={(novo) => salvarSolicitanteLocacao(l.id, novo)}
              onCancel={() => setEditandoLocacao({ id: null, campo: null })}
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer justify-center"
              onClick={() =>
                setEditandoLocacao({ id: l.id, campo: "solicitante" })
              }
            >
              <div className="uppercase">{l.solicitante || "—"}</div>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[4px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,

        // Fornecedor
        <div
          className="flex items-center justify-center gap-2"
          key={`forn-${l.id}`}
        >
          {isEditingFornecedorLocacao ? (
            <CellSelectFornecedor
              valorInicialId={l.fornecedor_id}
              onSave={(novoId) => salvarFornecedorLocacao(l.id, novoId)}
              onCancel={() => setEditandoLocacao({ id: null, campo: null })}
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer justify-center"
              onClick={() =>
                setEditandoLocacao({ id: l.id, campo: "fornecedor" })
              }
            >
              <div className="uppercase text-[13px]">{l.fornecedor || "—"}</div>
            </div>
          )}
        </div>,

        // Valor Unitario
        `R$ ${formatarMoeda(l.valor / l.quantidade || 0)}`,

        // Valor Total (cor indica status financeiro: verde = pago)
        <div
          className="flex items-center justify-center gap-2"
          title={isPagoLoc ? "Locação paga" : "Locação aguardando pagamento"}
        >
          {isEditingValor ? (
            <CellInputNumber
              valorInicial={l.valor || 0}
              onSave={(val) => salvarValorLocacao(l.id, val)}
              onCancel={() => setEditandoLocacao({ id: null, campo: null })}
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => setEditandoLocacao({ id: l.id, campo: "valor" })}
            >
              <span className={`tabular-nums ${valorTotalClassLoc}`}>
                R$ {formatarMoeda(l.valor || 0)}
              </span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[8px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,

        // Status
        <StatusSelectBadge
          key={`status-loc-${l.id}`}
          variant="material"
          value={l.status || "Solicitado"}
          onChange={(novo) => handleStatusChangeLocacao(l.id, novo)}
          options={STATUS_MATERIAL_OPCOES}
        />,

        // Data de coleta
        <div
          className="flex items-center justify-center gap-2"
          key={`cole-loc-${l.id}`}
        >
          {isEditingDataColeta ? (
            <CellInputDate
              valorInicial={l.data_coleta}
              onSave={(val) => salvarDataColetaLocacao(l.id, val)}
              onCancel={() => setEditandoLocacao({ id: null, campo: null })}
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer justify-center"
              onClick={() =>
                setEditandoLocacao({ id: l.id, campo: "data_coleta" })
              }
            >
              <div>{formatarDataBR(l.data_coleta)}</div>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[4px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,

        // Data de devolução (calculada a partir de data_coleta + período)
        <div
          className="flex items-center justify-center gap-2"
          key={`venc-loc-${l.id}`}
          title="Calculada automaticamente a partir da data de coleta e do período"
        >
          <div className="text-text-primary">
            {formatarDataBR(dataDevolucaoCalc)}
          </div>
        </div>,
        <div
          className="flex justify-center px-1 py-0.5"
          key={`del-loc-${l.id}`}
        >
          <button
            type="button"
            onClick={() => handleDeleteLocacao(l.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-300/50 bg-rose-500/12 text-rose-700 shadow-sm hover:bg-rose-500/20 cursor-pointer transition-colors"
          >
            <img
              width="18"
              height="18"
              src="https://img.icons8.com/material-outlined/24/FA5252/trash.png"
              alt="delete"
            />
          </button>
        </div>,
      ];
    });
  }, [
    obra,
    buscaLocacoes,
    editandoLocacao,
    handleStatusChangeLocacao,
    salvarValorLocacao,
    salvarSolicitanteLocacao,
    salvarDataColetaLocacao,
    handleDeleteLocacao,
    handleValidarLocacao,
    setEditandoLocacao,
    salvarFornecedorLocacao,
  ]);

  const listaMaoDeObraFiltrada = useMemo(() => {
    if (!obra?.maoDeObra) return [];
    return filtrarMaoDeObraLista(obra.maoDeObra, {
      busca: buscaMaoDeObra,
      prestadorId: filtroPrestadorId,
    });
  }, [obra?.maoDeObra, buscaMaoDeObra, filtroPrestadorId]);

  const totaisMaoDeObraFiltrados = useMemo(
    () => ({
      orcado: listaMaoDeObraFiltrada.reduce(
        (acc, m) => acc + (parseFloat(m.valor_orcado) || 0),
        0,
      ),
      cobrado: listaMaoDeObraFiltrada.reduce(
        (acc, m) => acc + (parseFloat(m.valor_cobrado) || 0),
        0,
      ),
    }),
    [listaMaoDeObraFiltrada],
  );

  const dadosMaoDeObra = useMemo(() => {
    if (!obra || !obra.maoDeObra) return [];
    let listaMaoDeObra = [...listaMaoDeObraFiltrada];

    if (sortConfigMdo.campo) {
      listaMaoDeObra.sort((a, b) => {
        let valA = "";
        let valB = "";
        if (sortConfigMdo.campo === "profissional") {
          valA = (a.profissional || "").toLowerCase();
          valB = (b.profissional || "").toLowerCase();
        } else if (sortConfigMdo.campo === "tipo") {
          valA = (a.tipo || "").toLowerCase();
          valB = (b.tipo || "").toLowerCase();
        }
        if (valA < valB) return sortConfigMdo.direcao === "asc" ? -1 : 1;
        if (valA > valB) return sortConfigMdo.direcao === "asc" ? 1 : -1;
        return desempatePorId(a, b);
      });
    } else {
      listaMaoDeObra.sort((a, b) => {
        const valA = a.validacao || 0;
        const valB = b.validacao || 0;
        if (valA !== valB) return valA - valB;
        return desempatePorId(a, b);
      });
    }

    return listaMaoDeObra.map((m) => {
      const saldo = (m.valor_orcado || 0) - (m.valor_pago || 0);
      const isEditingProfissional =
        editandoMaoDeObra.id === m.id &&
        editandoMaoDeObra.campo === "profissional";
      const isEditingCobrado =
        editandoMaoDeObra.id === m.id && editandoMaoDeObra.campo === "cobrado";
      const isEditingOrcado =
        editandoMaoDeObra.id === m.id && editandoMaoDeObra.campo === "orcado";
      const isEditingPago =
        editandoMaoDeObra.id === m.id && editandoMaoDeObra.campo === "pago";
      const isValidado = m.validacao === 1;

      return [
        <label className="flex items-center justify-center" key={`cb-${m.id}`}>
          <input
            type="checkbox"
            checked={isValidado}
            disabled={isValidado}
            onChange={() => handleValidarMaoDeObra(m)}
            className="h-[15px] w-[15px] text-[#abe4a0] transition duration-150 ease-in-out cursor-pointer disabled:opacity-50"
          />
        </label>,
        <div className="whitespace-nowrap uppercase">{m.tipo}</div>,
        <div
          className="flex items-center justify-center gap-2 whitespace-nowrap"
          key={`prof-${m.id}`}
        >
          {isEditingProfissional ? (
            <CellSelectPrestador
              valorInicial={m.profissional || ""}
              valorInicialId={m.prestador_id}
              valorInicialClasseId={m.classe_id}
              onSave={(val) => salvarEdicaoMaoDeObraProfissional(m.id, val)}
              onCancel={() => setEditandoMaoDeObra({ id: null, campo: null })}
            />
          ) : (
            <div
              className="group flex cursor-pointer items-center gap-2"
              onClick={() =>
                setEditandoMaoDeObra({ id: m.id, campo: "profissional" })
              }
            >
              <span className="text-[13px] uppercase">
                {m.profissional || "-"}
              </span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[8px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2 whitespace-nowrap"
          key={`cobrado-${m.id}`}
        >
          {isEditingCobrado ? (
            <CellInputNumber
              valorInicial={m.valor_cobrado || 0}
              onSave={(val) => salvarEdicaoMaoDeObra(m, val)}
              onCancel={() => setEditandoMaoDeObra({ id: null, campo: null })}
            />
          ) : (
            <div
              className="group flex cursor-pointer items-center gap-2"
              onClick={() =>
                setEditandoMaoDeObra({ id: m.id, campo: "cobrado" })
              }
            >
              <span>R$ {formatarMoeda(m.valor_cobrado || 0)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[8px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2 whitespace-nowrap"
          key={`orcado-${m.id}`}
        >
          {isEditingOrcado ? (
            <CellInputNumber
              valorInicial={m.valor_orcado || 0}
              onSave={(val) => salvarEdicaoMaoDeObra(m, val)}
              onCancel={() => setEditandoMaoDeObra({ id: null, campo: null })}
            />
          ) : (
            <div
              className="group flex cursor-pointer items-center gap-2"
              onClick={() =>
                setEditandoMaoDeObra({ id: m.id, campo: "orcado" })
              }
            >
              <span>R$ {formatarMoeda(m.valor_orcado || 0)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[8px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2 whitespace-nowrap"
          key={`pago-${m.id}`}
        >
          {isEditingPago ? (
            <CellInputNumber
              valorInicial={m.valor_pago || 0}
              onSave={(val) => salvarEdicaoMaoDeObra(m, val)}
              onCancel={() => setEditandoMaoDeObra({ id: null, campo: null })}
            />
          ) : (
            <div
              className="group flex cursor-pointer items-center gap-2"
              onClick={() => setEditandoMaoDeObra({ id: m.id, campo: "pago" })}
            >
              <span>R$ {formatarMoeda(m.valor_pago || 0)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="ml-[8px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              />
            </div>
          )}
        </div>,
        <span
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold tabular-nums shadow-sm ring-1 transition-colors ${
            saldo < 0
              ? "bg-rose-500/15 text-rose-900 ring-rose-400/35"
              : saldo === 0
                ? "bg-amber-500/15 text-amber-950 ring-amber-400/35"
                : "bg-emerald-500/15 text-emerald-900 ring-emerald-500/35"
          }`}
        >
          R$ {formatarMoeda(saldo)}
        </span>,
        <span className="whitespace-nowrap">
          {formatarDataBR(m.data_solicitacao)}
        </span>,
        <div className="flex justify-center" key={`del-mdo-${m.id}`}>
          <button
            onClick={() => handleDeleteMaoDeObra(m.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300/50 bg-rose-500/12 text-rose-700 hover:bg-rose-500/20 cursor-pointer transition-colors"
          >
            <img
              width="18"
              height="18"
              src="https://img.icons8.com/material-outlined/24/FA5252/trash.png"
              alt="delete"
            />
          </button>
        </div>,
      ];
    });
  }, [
    obra,
    editandoMaoDeObra,
    handleValidarMaoDeObra,
    salvarEdicaoMaoDeObra,
    salvarEdicaoMaoDeObraProfissional,
    handleDeleteMaoDeObra,
    listaMaoDeObraFiltrada,
    sortConfigMdo,
    setEditandoMaoDeObra,
  ]);

  const listaExtratoFiltrada = useMemo(
    () =>
      filtrarExtratoLista(
        obra?.relatorioExtrato,
        buscaExtrato,
        filtroExtrato,
        somenteValidados,
      ),
    [obra?.relatorioExtrato, buscaExtrato, filtroExtrato, somenteValidados],
  );

  const listaExtratoProcessada = useMemo(() => {
    if (!obra || !listaExtratoFiltrada.length) return [];

    const mapaFornecedorPorMaterialId = Object.fromEntries(
      (obra.materiais || []).map((material) => [
        String(material.id),
        material.fornecedores?.nome || material.fornecedor || "-",
      ]),
    );

    const mapaPrestadorPorMdoId = Object.fromEntries(
      (obra.maoDeObra || []).map((mdo) => [
        String(mdo.id),
        mdo.profissional || "-",
      ]),
    );

    const itensComFornecedorPrestador = listaExtratoFiltrada.map((item) => {
      let fornecedorPrestador =
        item.fornecedor_prestador || item.fornecedor || item.prestador || "";

      if (!fornecedorPrestador && item.tipo === "Material") {
        fornecedorPrestador =
          mapaFornecedorPorMaterialId[String(item.material_id)];
      }

      if (!fornecedorPrestador && item.tipo === "Mão de Obra") {
        fornecedorPrestador =
          mapaPrestadorPorMdoId[String(item.mao_de_obra_id)];
      }

      return {
        ...item,
        fornecedor_prestador: fornecedorPrestador || "-",
      };
    });

    itensComFornecedorPrestador.sort((a, b) => {
      let valorA = "";
      let valorB = "";

      if (sortField === "status_financeiro") {
        const ordemStatus = {
          "Aguardando pagamento": 0,
          Pago: 1,
        };
        valorA =
          ordemStatus[a.status_financeiro || "Aguardando pagamento"] ?? 99;
        valorB =
          ordemStatus[b.status_financeiro || "Aguardando pagamento"] ?? 99;
      } else if (sortField === "tipo") {
        valorA = (a.tipo || "").toLowerCase();
        valorB = (b.tipo || "").toLowerCase();
      } else if (sortField === "fornecedor_prestador") {
        valorA = (a.fornecedor_prestador || "").toLowerCase();
        valorB = (b.fornecedor_prestador || "").toLowerCase();
      } else {
        valorA = new Date(a.data).getTime();
        valorB = new Date(b.data).getTime();
      }

      if (valorA < valorB) return sortDirection === "asc" ? -1 : 1;
      if (valorA > valorB) return sortDirection === "asc" ? 1 : -1;

      const dataA = new Date(a.data).getTime();
      const dataB = new Date(b.data).getTime();
      if (dataA !== dataB) return dataB - dataA;

      return desempatePorId(a, b);
    });

    return itensComFornecedorPrestador;
  }, [obra, listaExtratoFiltrada, sortField, sortDirection]);

  const totaisExtratoSelecionados = useMemo(() => {
    let materiais = 0;
    let maoDeObra = 0;
    let todos = 0;
    for (const item of listaExtratoProcessada) {
      if (item.validacao !== 1) continue;
      const v = Number(item.valor) || 0;
      todos += v;
      if (item.tipo === "Material") materiais += v;
      else if (item.tipo === "Mão de Obra") maoDeObra += v;
    }
    return { materiais, maoDeObra, todos };
  }, [listaExtratoProcessada]);

  const extratoIdsEmLotesAbertos = useMemo(
    () => getExtratoIdsEmLotesAbertos(obra?.lotesPagamento),
    [obra?.lotesPagamento],
  );

  const mapaLotesPorExtrato = useMemo(
    () => getMapaLotesPorExtrato(obra?.lotesPagamento),
    [obra?.lotesPagamento],
  );

  const dadosRelatorioExtrato = useMemo(() => {
    if (!listaExtratoProcessada.length) return [];

    return listaExtratoProcessada.map((item) => {
      const isEditing = editandoId === item.id;
      const isSelected = item.validacao === 1;
      const statusFinanceiro = item.status_financeiro || "Aguardando pagamento";
      const pago = isExtratoPago(statusFinanceiro);
      const emLoteAberto = extratoIdsEmLotesAbertos.has(item.id);
      const podeIncluirLote = !pago && !emLoteAberto;
      const infoLote = mapaLotesPorExtrato.get(item.id);

      const linha = [];

      if (!extratoSomenteLeitura) {
        linha.push(
          <label
            className="flex items-center justify-center"
            key={`cb-ext-${item.id}`}
            title={
              pago
                ? "Item já pago"
                : emLoteAberto
                  ? labelsExtratoFinanceiro.itemEmExtratoAberto
                  : labelsExtratoFinanceiro.incluirNoExtratoPagamento
            }
          >
            <input
              type="checkbox"
              checked={isSelected}
              disabled={!podeIncluirLote}
              onChange={() => handleCheckExtrato(item)}
              className="h-[18px] w-[18px] cursor-pointer accent-check-accent disabled:cursor-not-allowed disabled:opacity-40"
            />
          </label>,
        );
      }

      linha.push(
        <div className="uppercase" key={`desc-ext-${item.id}`}>
          <div>{item.descricao}</div>
          {infoLote ? (
            <span className="mt-0.5 block text-[10px] font-semibold normal-case text-indigo-700">
              {labelsExtratoFinanceiro.numero(infoLote.numero)}
            </span>
          ) : null}
        </div>,
        <div className="uppercase">{item.tipo}</div>,
        <div className="uppercase">{item.fornecedor_prestador}</div>,
        <div className="tabular-nums" key={`qtd-ext-${item.id}`}>
          {item.quantidade != null && item.quantidade !== ""
            ? String(item.quantidade)
            : "—"}
        </div>,
      );

      if (extratoSomenteLeitura) {
        linha.push(
          <div className="tabular-nums" key={`val-ext-${item.id}`}>
            R$ {formatarMoeda(item.valor)}
          </div>,
          <span
            key={`status-fin-${item.id}`}
            className={`inline-flex w-fit max-w-[13rem] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              pago
                ? "bg-emerald-500/18 text-emerald-900 ring-emerald-500/35"
                : "bg-amber-500/18 text-amber-950 ring-amber-400/35"
            }`}
          >
            {statusFinanceiro}
          </span>,
        );
      } else {
        linha.push(
          <div
            className="flex items-center justify-center gap-2"
            key={`val-ext-${item.id}`}
          >
            {isEditing ? (
              <CellInputNumber
                valorInicial={item.valor || 0}
                onSave={(val) => salvarValorExtrato(item.id, val)}
                onCancel={() => setEditandoId(null)}
              />
            ) : (
              <div
                className="flex items-center gap-2 group cursor-pointer"
                onClick={() => setEditandoId(item.id)}
              >
                <span>R$ {formatarMoeda(item.valor)}</span>
                <img
                  width="15"
                  src="https://img.icons8.com/ios/50/edit--v1.png"
                  alt="edit"
                  className="ml-[8px] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                />
              </div>
            )}
          </div>,
          <label
            className="flex items-center justify-center"
            key={`pago-ext-${item.id}`}
            title={pago ? "Marcar como pendente" : "Marcar como pago"}
          >
            <input
              type="checkbox"
              checked={pago}
              onChange={() =>
                handleStatusFinanceiroChange(
                  item.id,
                  pago ? "Aguardando pagamento" : "Pago",
                )
              }
              className="h-[18px] w-[18px] cursor-pointer accent-check-accent"
            />
          </label>,
        );
      }

      linha.push(formatarDataBR(item.data));

      return linha;
    });
  }, [
    listaExtratoProcessada,
    editandoId,
    salvarValorExtrato,
    handleCheckExtrato,
    handleStatusFinanceiroChange,
    setEditandoId,
    extratoSomenteLeitura,
    extratoIdsEmLotesAbertos,
    mapaLotesPorExtrato,
  ]);

  const headerExtrato = useMemo(() => {
    const todosSelecionados =
      listaExtratoFiltrada.length > 0 &&
      listaExtratoFiltrada.every((i) => i.validacao === 1);

    const getSortIcon = (campo) => {
      if (sortField !== campo) return "↕";
      return sortDirection === "asc" ? "↑" : "↓";
    };

    return [
      ...(extratoSomenteLeitura
        ? []
        : [
            <div
              className="flex flex-col items-center gap-1 text-[10px] font-semibold uppercase leading-tight text-text-muted"
              key="header-cb"
            >
              <span>{labelsExtratoFinanceiro.incluirNoExtrato}</span>
              <input
                type="checkbox"
                checked={todosSelecionados}
                onChange={(e) => handleCheckAllExtrato(e.target.checked)}
                className="h-[18px] w-[18px] cursor-pointer accent-check-accent"
              />
            </div>,
          ]),
      "Descrição",
      <span
        className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
        onClick={() => handleSortExtrato("tipo")}
      >
        Tipo {getSortIcon("tipo")}
      </span>,
      <span
        className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
        onClick={() => handleSortExtrato("fornecedor_prestador")}
      >
        Fornecedor / Prestador {getSortIcon("fornecedor_prestador")}
      </span>,
      "Qtd",
      "Valor",
      extratoSomenteLeitura ? (
        <span
          className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
          onClick={() => handleSortExtrato("status_financeiro")}
        >
          Status Fin. {getSortIcon("status_financeiro")}
        </span>
      ) : (
        "Pago"
      ),
      "Data",
    ];
  }, [
    listaExtratoFiltrada,
    handleCheckAllExtrato,
    handleSortExtrato,
    sortField,
    sortDirection,
    extratoSomenteLeitura,
  ]);

  return {
    dadosMateriais,
    dadosLocacoes,
    dadosMaoDeObra,
    dadosRelatorioExtrato,
    headerExtrato,
    totaisExtratoSelecionados,
    totaisMateriaisFiltrados,
    totaisMaoDeObraFiltrados,
  };
}
