import { useMemo } from "react";
import { ORDEM_STATUS } from "../constants";
import {
  desempatePorId,
  formatarDataBR,
  formatarMoeda,
  getCorStatusMaterial,
} from "../utils/formatters";
import CellInputNumber from "../components/CellInputNumber";
import CellSelectFornecedor from "../components/CellSelectFornecedor";
import CellSelectPrestador from "../components/CellSelectPrestador";

export function useObrasDetalheTableData({
  obra,
  buscaMateriais,
  sortConfig,
  editandoMaterial,
  setEditandoMaterial,
  handleStatusChange,
  salvarValorMaterial,
  salvarFornecedorMaterial,
  handleDeleteMaterial,
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
      const qtdNumerica = parseFloat(m.quantidade) || 0;
      const valorUnitario = qtdNumerica > 0 ? m.valor / qtdNumerica : 0;

      const nomeFornecedorExibicao =
        m.fornecedores?.nome || m.fornecedor || "-";

      return [
        <div className="uppercase">{m.material}</div>,
        m.quantidade,
        `R$ ${formatarMoeda(valorUnitario)}`,
        <div
          className="flex items-center justify-center gap-2"
          key={`val-${m.id}`}
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
              <span className="font-bold">
                R$ {formatarMoeda(m.valor || 0)}
              </span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,
        <select
          key={`status-${m.id}`}
          value={m.status || "Solicitado"}
          onChange={(e) => handleStatusChange(m.id, e.target.value)}
          className={`w-fit text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none border-none cursor-pointer appearance-none ${getCorStatusMaterial(m.status || "Solicitado")}`}
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
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[4px]"
              />
            </div>
          )}
        </div>,
        formatarDataBR(m.data_solicitacao),
        <div className="flex justify-center group" key={`del-mat-${m.id}`}>
          <button
            onClick={() => handleDeleteMaterial(m.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full cursor-pointer border-none bg-transparent"
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
    handleDeleteMaterial,
    buscaMateriais,
    sortConfig,
    setEditandoMaterial,
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
        let valA, valB;
        if (sortConfigMdo.campo === "profissional") {
          valA = (a.profissional || "").toLowerCase();
          valB = (b.profissional || "").toLowerCase();
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
        <div className="uppercase">{m.tipo}</div>,
        <div
          className="flex items-center justify-center gap-2"
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
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() =>
                setEditandoMaoDeObra({ id: m.id, campo: "profissional" })
              }
            >
              <span className="uppercase text-[13px]">
                {m.profissional || "-"}
              </span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2"
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
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() =>
                setEditandoMaoDeObra({ id: m.id, campo: "cobrado" })
              }
            >
              <span>R$ {formatarMoeda(m.valor_cobrado || 0)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2"
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
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() =>
                setEditandoMaoDeObra({ id: m.id, campo: "orcado" })
              }
            >
              <span>R$ {formatarMoeda(m.valor_orcado || 0)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2"
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
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => setEditandoMaoDeObra({ id: m.id, campo: "pago" })}
            >
              <span>R$ {formatarMoeda(m.valor_pago || 0)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,
        <span
          className={`${saldo < 0 ? "text-[red]" : saldo === 0 ? "text-[orange]" : "text-[green]"} font-bold`}
        >
          R$ {formatarMoeda(saldo)}
        </span>,
        formatarDataBR(m.data_solicitacao),
        <div className="flex justify-center group" key={`del-mdo-${m.id}`}>
          <button
            onClick={() => handleDeleteMaoDeObra(m.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full cursor-pointer border-none bg-transparent"
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

  const dadosRelatorioExtrato = useMemo(() => {
    if (!obra || !obra.relatorioExtrato) return [];
    let listaFiltradaTexto = [...obra.relatorioExtrato];
    if (buscaExtrato) {
      listaFiltradaTexto = listaFiltradaTexto.filter((item) =>
        item.descricao?.toLowerCase().includes(buscaExtrato.toLowerCase()),
      );
    }

    const itensFiltrados = listaFiltradaTexto.filter((item) => {
      if (filtroExtrato === "Tudo") return true;
      if (filtroExtrato === "Materiais") return item.tipo === "Material";
      if (filtroExtrato === "Mão de Obra") return item.tipo === "Mão de Obra";
      return true;
    });

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

    const itensComFornecedorPrestador = itensFiltrados.map((item) => {
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
        valorA = ordemStatus[a.status_financeiro || "Aguardando pagamento"] ?? 99;
        valorB = ordemStatus[b.status_financeiro || "Aguardando pagamento"] ?? 99;
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

    return itensComFornecedorPrestador.map((item) => {
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
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
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
          className={`w-fit text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none border-none cursor-pointer appearance-none ${item.status_financeiro === "Pago" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}
        >
          <option value="Aguardando pagamento">Aguardando pagamento</option>
          <option value="Pago">Pago</option>
        </select>,
        formatarDataBR(item.data),
      ];
    });
  }, [
    obra,
    editandoId,
    salvarValorExtrato,
    handleCheckExtrato,
    filtroExtrato,
    handleStatusFinanceiroChange,
    buscaExtrato,
    sortField,
    sortDirection,
    setEditandoId,
  ]);

  const headerExtrato = useMemo(() => {
    let itensParaVerificar = obra?.relatorioExtrato || [];
    if (buscaExtrato)
      itensParaVerificar = itensParaVerificar.filter((i) =>
        i.descricao?.toLowerCase().includes(buscaExtrato.toLowerCase()),
      );
    if (filtroExtrato === "Materiais")
      itensParaVerificar = itensParaVerificar.filter(
        (i) => i.tipo === "Material",
      );
    else if (filtroExtrato === "Mão de Obra")
      itensParaVerificar = itensParaVerificar.filter(
        (i) => i.tipo === "Mão de Obra",
      );
    const todosSelecionados =
      itensParaVerificar.length > 0 &&
      itensParaVerificar.every((i) => i.validacao === 1);

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
        className="cursor-pointer hover:text-blue-600 select-none"
        onClick={() => handleSortExtrato("tipo")}
      >
        Tipo {getSortIcon("tipo")}
      </span>,
      <span
        className="cursor-pointer hover:text-blue-600 select-none"
        onClick={() => handleSortExtrato("fornecedor_prestador")}
      >
        Fornecedor / Prestador {getSortIcon("fornecedor_prestador")}
      </span>,
      "Qtd",
      "Valor",
      <span
        className="cursor-pointer hover:text-blue-600 select-none"
        onClick={() => handleSortExtrato("status_financeiro")}
      >
        Status Fin. {getSortIcon("status_financeiro")}
      </span>,
      "Data",
    ];
  }, [
    obra,
    handleCheckAllExtrato,
    filtroExtrato,
    buscaExtrato,
    handleSortExtrato,
    sortField,
    sortDirection,
  ]);

  return {
    dadosMateriais,
    dadosMaoDeObra,
    dadosRelatorioExtrato,
    headerExtrato,
  };
}
