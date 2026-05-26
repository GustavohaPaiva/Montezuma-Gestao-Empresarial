import { useMemo } from "react";
import { ORDEM_STATUS } from "../constants";
import {
  calcularDataDevolucao,
  desempatePorId,
  formatarDataBR,
  formatarMoeda,
  getCorStatusMaterial,
} from "../utils/formatters";
import CellInputNumber from "../components/CellInputNumber";
import CellInputDate from "../components/CellInputDate";
import CellSelectFornecedor from "../components/CellSelectFornecedor";
import CellSelectPrestador from "../components/CellSelectPrestador";
import CellSelectSolicitante from "../components/CellSelectSolicitante";

/** Lista do extrato após busca textual e filtro de tipo (mesma regra da tabela). */
export function filtrarExtratoLista(
  relatorioExtrato,
  buscaExtrato,
  filtroExtrato,
) {
  if (!relatorioExtrato?.length) return [];
  let lista = [...relatorioExtrato];
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
}) {
  const dadosMateriais = useMemo(() => {
    if (!obra || !obra.materiais) return [];
    let listaMateriais = [...obra.materiais];

    if (buscaMateriais) {
      const termo = buscaMateriais.toLowerCase();
      listaMateriais = listaMateriais.filter(
        (m) =>
          m.material?.toLowerCase().includes(termo) ||
          m.fornecedores?.nome?.toLowerCase().includes(termo) ||
          m.fornecedor?.toLowerCase().includes(termo),
      );
    }

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

      const isPagoMat =
        (m.status_financeiro || "").toLowerCase() === "pago";
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
        <select
          key={`status-${m.id}`}
          value={m.status || "Solicitado"}
          onChange={(e) => handleStatusChange(m.id, e.target.value)}
          className={`w-full max-w-[13rem] cursor-pointer appearance-none rounded-full border-0 px-3 py-1.5 text-center text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary/30 sm:h-9 sm:w-fit ${getCorStatusMaterial(m.status || "Solicitado")}`}
        >
          <option value="Solicitado">Solicitado</option>
          <option value="Em cotação">Em cotação</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Aguardando entrega">Aguardando entrega</option>
          <option value="Entregue">Entregue</option>
        </select>,
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
    buscaMateriais,
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
      const isPagoLoc =
        (l.status_financeiro || "").toLowerCase() === "pago";
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
          title={
            isPagoLoc ? "Locação paga" : "Locação aguardando pagamento"
          }
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
        <select
          key={`status-loc-${l.id}`}
          value={l.status || "Solicitado"}
          onChange={(e) => handleStatusChangeLocacao(l.id, e.target.value)}
          className={`w-full max-w-[13rem] cursor-pointer appearance-none rounded-full border-0 px-3 py-1.5 text-center text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary/30 sm:h-9 sm:w-fit ${getCorStatusMaterial(l.status || "Solicitado")}`}
        >
          <option value="Solicitado">Solicitado</option>
          <option value="Em cotação">Em cotação</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Aguardando entrega">Aguardando entrega</option>
          <option value="Entregue">Entregue</option>
        </select>,

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

  const dadosMaoDeObra = useMemo(() => {
    if (!obra || !obra.maoDeObra) return [];
    let listaMaoDeObra = [...obra.maoDeObra];

    if (buscaMaoDeObra) {
      const term = buscaMaoDeObra.toLowerCase();
      listaMaoDeObra = listaMaoDeObra.filter(
        (m) =>
          m.tipo?.toLowerCase().includes(term) ||
          m.profissional?.toLowerCase().includes(term),
      );
    }

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
    buscaMaoDeObra,
    sortConfigMdo,
    setEditandoMaoDeObra,
  ]);

  const listaExtratoFiltrada = useMemo(
    () =>
      filtrarExtratoLista(obra?.relatorioExtrato, buscaExtrato, filtroExtrato),
    [obra?.relatorioExtrato, buscaExtrato, filtroExtrato],
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

  const dadosRelatorioExtrato = useMemo(() => {
    if (!listaExtratoProcessada.length) return [];

    return listaExtratoProcessada.map((item) => {
      const isEditing = editandoId === item.id;
      const isSelected = item.validacao === 1;

      return [
        <label
          className="flex items-center justify-center"
          key={`cb-ext-${item.id}`}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleCheckExtrato(item)}
            className="h-[18px] w-[18px] text-[#abe4a0] transition duration-150 ease-in-out cursor-pointer"
          />
        </label>,
        <div className="uppercase">{item.descricao}</div>,
        <div className="uppercase">{item.tipo}</div>,
        <div className="uppercase">{item.fornecedor_prestador}</div>,
        item.quantidade,
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
        <select
          key={`status-fin-${item.id}`}
          value={item.status_financeiro || "Aguardando pagamento"}
          onChange={(e) =>
            handleStatusFinanceiroChange(item.id, e.target.value)
          }
          className={`w-full max-w-[11rem] cursor-pointer appearance-none rounded-full border-0 px-2 py-1 text-center text-xs font-semibold shadow-sm ring-1 transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary/30 sm:h-8 sm:max-w-[13rem] sm:w-fit sm:px-3 sm:text-sm ${
            item.status_financeiro === "Pago"
              ? "bg-emerald-500/18 text-emerald-900 ring-emerald-500/35"
              : "bg-amber-500/18 text-amber-950 ring-amber-400/35"
          }`}
        >
          <option value="Aguardando pagamento">Aguardando pagamento</option>
          <option value="Pago">Pago</option>
        </select>,
        formatarDataBR(item.data),
      ];
    });
  }, [
    listaExtratoProcessada,
    editandoId,
    salvarValorExtrato,
    handleCheckExtrato,
    handleStatusFinanceiroChange,
    setEditandoId,
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
      <label className="flex items-center justify-center" key="header-cb">
        <input
          type="checkbox"
          checked={todosSelecionados}
          onChange={(e) => handleCheckAllExtrato(e.target.checked)}
          className="h-[18px] w-[18px] text-[#abe4a0] transition duration-150 ease-in-out cursor-pointer"
        />
      </label>,
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
      <span
        className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
        onClick={() => handleSortExtrato("status_financeiro")}
      >
        Status Fin. {getSortIcon("status_financeiro")}
      </span>,
      "Data",
    ];
  }, [
    listaExtratoFiltrada,
    handleCheckAllExtrato,
    handleSortExtrato,
    sortField,
    sortDirection,
  ]);

  return {
    dadosMateriais,
    dadosLocacoes,
    dadosMaoDeObra,
    dadosRelatorioExtrato,
    headerExtrato,
    totaisExtratoSelecionados,
  };
}
