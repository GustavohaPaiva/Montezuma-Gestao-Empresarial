import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../components/TabelaSimples";
import ButtonDefault from "../components/ButtonDefault";
import { gerarPDF } from "../services/pdfService";
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../services/api";
import ModalMateriais from "../components/ModalMateriais";
import ModalMaoDeObra from "../components/ModalMaoDeObra";

// --- Formatações ---
const formatarDataBR = (dataString) => {
  if (!dataString) return "-";
  const [ano, mes, dia] = dataString.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
};

const formatarMoeda = (valor) => {
  const valorNumerico = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorNumerico);
};

export default function ObrasDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obra, setObra] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Modais
  const [modalMateriaisOpen, setModalMateriaisOpen] = useState(false);
  const [modalMaoDeObraOpen, setModalMaoDeObraOpen] = useState(false);

  // Filtros Globais
  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");

  // --- NOVOS ESTADOS DE BUSCA ---
  const [buscaMateriais, setBuscaMateriais] = useState("");
  const [buscaMaoDeObra, setBuscaMaoDeObra] = useState("");
  const [buscaExtrato, setBuscaExtrato] = useState("");

  // Estados de Edição (Extrato e Materiais)
  const [editandoId, setEditandoId] = useState(null);
  const [valorEditado, setValorEditado] = useState("");

  const [editandoMaterialId, setEditandoMaterialId] = useState(null);
  const [valorMaterialEditado, setValorMaterialEditado] = useState("");

  // Estados de Edição (Mão de Obra)
  const [editandoMaoDeObra, setEditandoMaoDeObra] = useState({
    id: null,
    campo: null,
  });
  const [valorMaoDeObraEditado, setValorMaoDeObraEditado] = useState("");

  // --- Buscas ---
  const fetchDados = useCallback(async () => {
    if (!id) return;
    try {
      const dados = await api.getObraById(id);
      if (dados) {
        setObra(dados);
      }
    } catch (err) {
      console.error("ERRO NO FETCH:", err);
    }
  }, [id]);

  useEffect(() => {
    const carregar = async () => {
      await fetchDados();
    };
    carregar();
  }, [fetchDados]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- HANDLERS MATERIAIS ---

  const handleDeleteMaterial = useCallback(
    async (materialId) => {
      if (window.confirm("Tem certeza que deseja excluir este material?")) {
        try {
          await api.deleteMaterial(materialId);
          await fetchDados();
        } catch (err) {
          console.error("Erro ao excluir material:", err);
          alert("Erro ao excluir item.");
        }
      }
    },
    [fetchDados],
  );

  const handleStatusChange = useCallback(
    async (materialId, novoStatus) => {
      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          materiais: prev.materiais.map((m) =>
            m.id === materialId ? { ...m, status: novoStatus } : m,
          ),
        };
      });
      try {
        await api.updateMaterialStatus(materialId, novoStatus);
      } catch (err) {
        console.error("Erro status:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const handleSaveMaterial = useCallback(
    async (dados) => {
      const dataAtual = new Date().toISOString().split("T")[0];
      try {
        await api.addMaterial({
          obra_id: id,
          material: dados.material,
          fornecedor: dados.fornecedor,
          valor: 0,
          quantidade: `${dados.quantidade} ${dados.unidade || "Un."}`,
          data_solicitacao: dataAtual,
          status_financeiro: "Aguardando pagamento",
        });
        await fetchDados();
      } catch (err) {
        console.error("Erro material:", err);
        alert("Erro ao salvar material.");
      }
    },
    [id, fetchDados],
  );

  const salvarValorMaterial = useCallback(
    async (materialId) => {
      const valorFloat = parseFloat(valorMaterialEditado) || 0;

      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          materiais: prev.materiais.map((m) =>
            m.id === materialId ? { ...m, valor: valorFloat } : m,
          ),
        };
      });

      setEditandoMaterialId(null);

      try {
        await api.updateMaterialValor(materialId, valorFloat);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar valor material:", err);
        fetchDados();
      }
    },
    [valorMaterialEditado, fetchDados],
  );

  // --- HANDLERS MÃO DE OBRA ---

  const handleDeleteMaoDeObra = useCallback(
    async (mdoId) => {
      if (window.confirm("Tem certeza que deseja excluir este registro?")) {
        try {
          await api.deleteMaoDeObra(mdoId);
          await fetchDados();
        } catch (err) {
          console.error("Erro ao excluir mão de obra:", err);
          alert("Erro ao excluir item.");
        }
      }
    },
    [fetchDados],
  );

  const handleSaveMaoDeObra = useCallback(
    async (dados) => {
      const dataAtual = new Date().toISOString().split("T")[0];
      const valorInput = parseFloat(dados.valor) || 0;
      try {
        await api.addMaoDeObra({
          obra_id: id,
          tipo: dados.tipo,
          profissional: dados.profissional,
          data_solicitacao: dataAtual,
          valor_cobrado: valorInput,
          valor_orcado: valorInput,
          valor_pago: 0,
        });
        await fetchDados();
      } catch (err) {
        console.error("Erro mao de obra:", err);
        alert("Erro ao salvar mão de obra.");
      }
    },
    [id, fetchDados],
  );

  const handleValidarMaoDeObra = useCallback(
    async (item) => {
      if (item.validacao === 1) return;

      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          maoDeObra: prev.maoDeObra.map((m) =>
            m.id === item.id ? { ...m, validacao: 1 } : m,
          ),
        };
      });

      try {
        await api.validarMaoDeObra(item.id, item);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao validar:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const iniciarEdicaoMaoDeObra = useCallback((item, campo) => {
    setEditandoMaoDeObra({ id: item.id, campo: campo });
    const valorAtual =
      campo === "orcado" ? item.valor_orcado || 0 : item.valor_pago || 0;
    setValorMaoDeObraEditado(valorAtual);
  }, []);

  const salvarEdicaoMaoDeObra = useCallback(
    async (item) => {
      const novoValor = parseFloat(valorMaoDeObraEditado) || 0;
      const campoEditado = editandoMaoDeObra.campo;

      const valorOrcadoFinal =
        campoEditado === "orcado" ? novoValor : item.valor_orcado || 0;
      const valorPagoFinal =
        campoEditado === "pago" ? novoValor : item.valor_pago || 0;

      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          maoDeObra: prev.maoDeObra.map((m) =>
            m.id === item.id
              ? {
                  ...m,
                  valor_orcado: valorOrcadoFinal,
                  valor_pago: valorPagoFinal,
                  saldo: valorOrcadoFinal - valorPagoFinal,
                }
              : m,
          ),
        };
      });

      setEditandoMaoDeObra({ id: null, campo: null });
      setValorMaoDeObraEditado("");

      try {
        await api.updateMaoDeObraFinanceiro(item.id, {
          valor_orcado: valorOrcadoFinal,
          valor_pago: valorPagoFinal,
        });
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar mão de obra:", err);
        fetchDados();
      }
    },
    [editandoMaoDeObra, valorMaoDeObraEditado, fetchDados],
  );

  // --- HANDLERS EXTRATO ---

  const handleStatusFinanceiroChange = useCallback(
    async (extratoId, novoStatus) => {
      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          relatorioExtrato: prev.relatorioExtrato.map((item) =>
            item.id === extratoId
              ? { ...item, status_financeiro: novoStatus }
              : item,
          ),
        };
      });

      try {
        await api.updateExtratoStatusFinanceiro(extratoId, novoStatus);
      } catch (err) {
        console.error("Erro status financeiro:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const iniciarEdicao = useCallback((item) => {
    setEditandoId(item.id);
    setValorEditado(item.valor);
  }, []);

  const cancelarEdicao = useCallback(() => {
    setEditandoId(null);
    setValorEditado("");
  }, []);

  const salvarValor = useCallback(
    async (itemId) => {
      const valorFloat = parseFloat(valorEditado) || 0;
      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          relatorioExtrato: prev.relatorioExtrato.map((item) =>
            item.id === itemId ? { ...item, valor: valorFloat } : item,
          ),
        };
      });
      setEditandoId(null);
      try {
        await api.updateValorRelatorioExtrato(itemId, valorFloat);
      } catch (err) {
        console.error("Erro ao atualizar valor:", err);
        fetchDados();
      }
    },
    [valorEditado, fetchDados],
  );

  const handleCheckExtrato = useCallback(
    async (item) => {
      const novoStatus = item.validacao === 1 ? 0 : 1;
      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          relatorioExtrato: prev.relatorioExtrato.map((i) =>
            i.id === item.id ? { ...i, validacao: novoStatus } : i,
          ),
        };
      });
      try {
        await api.updateExtratoValidacao(item.id, novoStatus);
      } catch (err) {
        console.error("Erro ao atualizar validação extrato:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const handleCheckAllExtrato = useCallback(
    async (isChecked) => {
      const novoStatus = isChecked ? 1 : 0;
      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          relatorioExtrato: prev.relatorioExtrato.map((i) => ({
            ...i,
            validacao: novoStatus,
          })),
        };
      });
      try {
        await api.updateExtratoValidacaoAll(id, novoStatus);
      } catch (err) {
        console.error("Erro ao atualizar todos:", err);
        fetchDados();
      }
    },
    [id, fetchDados],
  );

  const handleGerarPDFExtrato = () => {
    if (!obra || !obra.relatorioExtrato) return;

    const itensSelecionados = obra.relatorioExtrato.filter(
      (item) => item.validacao === 1,
    );

    if (itensSelecionados.length === 0) {
      alert("Nenhum item selecionado para o extrato.");
      return;
    }

    const somaTotal = itensSelecionados.reduce((acc, item) => {
      return acc + (parseFloat(item.valor) || 0);
    }, 0);

    const totalFormatado = `R$ ${formatarMoeda(somaTotal)}`;

    const dadosParaPDF = itensSelecionados.map((item) => [
      item.descricao,
      item.tipo,
      item.quantidade,
      formatarDataBR(item.data),
      `R$ ${formatarMoeda(item.valor)}`,
    ]);

    gerarPDF(
      "Extrato",
      ["Descrição", "Tipo", "Qtd", "Data", "Valor"],
      dadosParaPDF,
      obra.local,
      totalFormatado,
    );
  };

  // --- DADOS TABELA MATERIAIS (COM FILTRO) ---
  const dadosMateriais = useMemo(() => {
    if (!obra || !obra.materiais) return [];

    let listaMateriais = [...obra.materiais];

    // Filtro por nome do material
    if (buscaMateriais) {
      listaMateriais = listaMateriais.filter((m) =>
        m.material?.toLowerCase().includes(buscaMateriais.toLowerCase()),
      );
    }

    const materiaisOrdenados = listaMateriais.sort((a, b) => {
      const isEntregueA = a.status === "Entregue";
      const isEntregueB = b.status === "Entregue";
      if (isEntregueA && !isEntregueB) return 1;
      if (!isEntregueA && isEntregueB) return -1;
      return 0;
    });

    return materiaisOrdenados.map((m) => {
      const isEditing = editandoMaterialId === m.id;
      const qtdNumerica = parseFloat(m.quantidade) || 0;
      const valorUnitario = qtdNumerica > 0 ? m.valor / qtdNumerica : 0;

      return [
        <div className="uppercase">{m.material}</div>,
        m.quantidade,
        `R$ ${formatarMoeda(valorUnitario)}`,
        // Coluna Valor (Editável)
        <div className="flex items-center justify-center gap-2" key={m.id}>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <span>R$</span>
              <input
                type="number"
                step="0.01"
                value={valorMaterialEditado}
                onChange={(e) => setValorMaterialEditado(e.target.value)}
                className="w-[60px] p-[4px] border border-[#DBDADE] ml-[10px] rounded-[8px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => salvarValorMaterial(m.id)}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={() => setEditandoMaterialId(null)}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
                  alt="cancelar"
                />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => {
                setEditandoMaterialId(m.id);
                setValorMaterialEditado(m.valor || 0);
              }}
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
        // Coluna Status
        <select
          key={`status-${m.id}`}
          value={m.status || "Solicitado"}
          onChange={(e) => handleStatusChange(m.id, e.target.value)}
          className={`w-fit text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none border-none cursor-pointer appearance-none ${
            m.status === "Entregue"
              ? "bg-[#E8F5E9] text-[#2E7D32]"
              : "bg-[#FFF3E0] text-[#E65100]"
          }`}
        >
          <option value="Solicitado">Solicitado</option>
          <option value="Em cotação">Em cotação</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Aguardando entrega">Aguardando entrega</option>
          <option value="Entregue">Entregue</option>
        </select>,
        <div className="uppercase text-[13px]">{m.fornecedor || "-"}</div>,
        formatarDataBR(m.data_solicitacao),
        // Deletar
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
    editandoMaterialId,
    valorMaterialEditado,
    handleStatusChange,
    salvarValorMaterial,
    handleDeleteMaterial,
    buscaMateriais, // Dependência adicionada
  ]);

  // --- DADOS TABELA MÃO DE OBRA (COM FILTRO) ---
  const dadosMaoDeObra = useMemo(() => {
    if (!obra || !obra.maoDeObra) return [];

    let listaMaoDeObra = [...obra.maoDeObra];

    // Filtro por Tipo (Serviço) ou Profissional (Prestador)
    if (buscaMaoDeObra) {
      const term = buscaMaoDeObra.toLowerCase();
      listaMaoDeObra = listaMaoDeObra.filter(
        (m) =>
          m.tipo?.toLowerCase().includes(term) ||
          m.profissional?.toLowerCase().includes(term),
      );
    }

    const maoDeObraOrdenada = listaMaoDeObra.sort(
      (a, b) => (a.validacao || 0) - (b.validacao || 0),
    );

    return maoDeObraOrdenada.map((m) => {
      const saldo = (m.valor_orcado || 0) - (m.valor_pago || 0);
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
        <div className="uppercase">{m.profissional}</div>,
        `R$ ${formatarMoeda(m.valor_cobrado || 0)}`,
        // Valor Orçado
        <div
          className="flex items-center justify-center gap-2"
          key={`orcado-${m.id}`}
        >
          {isEditingOrcado ? (
            <div className="flex items-center gap-1">
              <span>R$</span>
              <input
                type="number"
                step="0.01"
                value={valorMaoDeObraEditado}
                onChange={(e) => setValorMaoDeObraEditado(e.target.value)}
                className="w-[70px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => salvarEdicaoMaoDeObra(m)}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="ok"
                />
              </button>
              <button
                onClick={() => setEditandoMaoDeObra({ id: null, campo: null })}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
                  alt="cancel"
                />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => iniciarEdicaoMaoDeObra(m, "orcado")}
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
        // Valor Pago
        <div
          className="flex items-center justify-center gap-2"
          key={`pago-${m.id}`}
        >
          {isEditingPago ? (
            <div className="flex items-center gap-1">
              <span>R$</span>
              <input
                type="number"
                step="0.01"
                value={valorMaoDeObraEditado}
                onChange={(e) => setValorMaoDeObraEditado(e.target.value)}
                className="w-[70px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => salvarEdicaoMaoDeObra(m)}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="ok"
                />
              </button>
              <button
                onClick={() => setEditandoMaoDeObra({ id: null, campo: null })}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
                  alt="cancel"
                />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => iniciarEdicaoMaoDeObra(m, "pago")}
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
          className={`${
            saldo < 0
              ? "text-[red]"
              : saldo === 0
                ? "text-[orange]"
                : "text-[green]"
          } font-bold`}
        >
          R$ {formatarMoeda(saldo)}
        </span>,
        formatarDataBR(m.data_solicitacao),
        // Deletar
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
    valorMaoDeObraEditado,
    handleValidarMaoDeObra,
    iniciarEdicaoMaoDeObra,
    salvarEdicaoMaoDeObra,
    handleDeleteMaoDeObra,
    buscaMaoDeObra, // Dependência adicionada
  ]);

  // --- DADOS EXTRATO (COM FILTRO) ---
  const dadosRelatorioExtrato = useMemo(() => {
    if (!obra || !obra.relatorioExtrato) return [];

    // Filtro de Texto (Descricao)
    let listaFiltradaTexto = obra.relatorioExtrato;
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

    return itensFiltrados.map((item) => {
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
        item.quantidade,
        // Valor Extrato (Editável)
        <div className="flex items-center justify-center gap-2" key={item.id}>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <span>R$</span>
              <input
                type="number"
                step="0.01"
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                className="w-[50px] p-[4px] border border-[#DBDADE] ml-[10px] rounded-[8px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => salvarValor(item.id)}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={cancelarEdicao}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
                  alt="cancelar"
                />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => iniciarEdicao(item)}
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
        // Status Financeiro
        <select
          key={`status-fin-${item.id}`}
          value={item.status_financeiro || "Aguardando pagamento"}
          onChange={(e) =>
            handleStatusFinanceiroChange(item.id, e.target.value)
          }
          className={`w-fit text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none border-none cursor-pointer appearance-none ${
            item.status_financeiro === "Pago"
              ? "bg-[#E8F5E9] text-[#2E7D32]"
              : "bg-[#FFF3E0] text-[#E65100]"
          }`}
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
    valorEditado,
    iniciarEdicao,
    salvarValor,
    cancelarEdicao,
    handleCheckExtrato,
    filtroExtrato,
    handleStatusFinanceiroChange,
    buscaExtrato, // Dependência adicionada
  ]);

  // --- CÁLCULOS TOTAIS ---
  const totais = useMemo(() => {
    if (!obra) return { materiais: 0, maoDeObra: 0, totalExtrato: 0 };

    const somaMateriais = (obra.materiais || []).reduce(
      (acc, m) => acc + (parseFloat(m.valor) || 0),
      0,
    );

    const somaMaoDeObra = (obra.maoDeObra || []).reduce(
      (acc, m) => acc + (parseFloat(m.valor_orcado) || 0),
      0,
    );

    // --- CORREÇÃO: Soma apenas os itens que estão no array relatorioExtrato ---
    const somaExtrato = (obra.relatorioExtrato || []).reduce(
      (acc, item) => acc + (parseFloat(item.valor) || 0),
      0,
    );

    return {
      materiais: somaMateriais,
      maoDeObra: somaMaoDeObra,
      totalExtrato: somaExtrato,
    };
  }, [obra]);

  const headerExtrato = useMemo(() => {
    let itensParaVerificar = obra?.relatorioExtrato || [];
    // Aplica o filtro de busca no header também para consistência do check-all, se desejar
    if (buscaExtrato) {
      itensParaVerificar = itensParaVerificar.filter((item) =>
        item.descricao?.toLowerCase().includes(buscaExtrato.toLowerCase()),
      );
    }

    if (filtroExtrato === "Materiais") {
      itensParaVerificar = itensParaVerificar.filter(
        (i) => i.tipo === "Material",
      );
    } else if (filtroExtrato === "Mão de Obra") {
      itensParaVerificar = itensParaVerificar.filter(
        (i) => i.tipo === "Mão de Obra",
      );
    }
    const todosSelecionados =
      itensParaVerificar.length > 0 &&
      itensParaVerificar.every((i) => i.validacao === 1);

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
      "Tipo",
      "Qtd",
      "Valor",
      "Status Fin.",
      "Data",
    ];
  }, [obra, handleCheckAllExtrato, filtroExtrato, buscaExtrato]);

  if (!obra)
    return (
      <div className="flex justify-center mt-20 font-bold text-[#71717A]">
        Carregando Obra...
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0] pb-[40px]">
      <header className="h-[82px] border-b border-[#DBDADE] flex justify-center sticky top-0 z-10 w-full bg-white position-fi">
        <div className="w-[90%] flex items-center justify-between">
          <div className="flex items-center gap-[16px]">
            <button
              onClick={() => navigate(-1)}
              className="border-none bg-transparent cursor-pointer flex items-center"
            >
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/ios/50/back--v1.png"
                alt="voltar"
              />
            </button>
            <h1 className="text-[20px] font-bold uppercase tracking-[2px] text-[#464C54]">
              {obra.local} - {obra.cliente}
            </h1>
          </div>
          {!isMobile && (
            <div className="flex gap-[16px]">
              <ButtonDefault onClick={() => setModalMateriaisOpen(true)}>
                + Materiais
              </ButtonDefault>
              <ButtonDefault onClick={() => setModalMaoDeObraOpen(true)}>
                + Mão de Obra
              </ButtonDefault>
            </div>
          )}
        </div>
      </header>
      <main className="w-[90%] mt-[24px]">
        {isMobile && (
          <div className="flex flex-col gap-[12px] mb-[24px]">
            <ButtonDefault onClick={() => setModalMateriaisOpen(true)}>
              + Materiais
            </ButtonDefault>
            <ButtonDefault onClick={() => setModalMaoDeObraOpen(true)}>
              + Mão de Obra
            </ButtonDefault>
          </div>
        )}
        <div>
          {/* TABELA DE MATERIAIS */}
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div
              className={`w-full flex ${isMobile ? "flex-col gap-4" : "flex-row justify-between items-center"}`}
            >
              <h1>Relatório de Materiais</h1>
              <input
                type="text"
                placeholder="Buscar material..."
                value={buscaMateriais}
                onChange={(e) => setBuscaMateriais(e.target.value)}
                className={`h-[40px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54] px-[8px] ${isMobile ? "w-full" : "w-[250px]"}`}
              />
            </div>

            <TabelaSimples
              colunas={[
                "Material",
                "Quantidade",
                "Valor Un.",
                "Valor",
                "Status",
                "Fornecedor",
                "Data",
                "",
              ]}
              dados={dadosMateriais}
            />

            <div
              className={`flex ${
                isMobile ? "flex-col h-auto gap-4" : "flex-row h-[42px]"
              } justify-between px-[5%] gap-[20px] text-center w-full box-border items-center`}
            >
              <ButtonDefault
                onClick={() => {
                  // 1. Filtra e Ordena os dados originais (para bater com o que está na tela)
                  let listaParaPDF = [...obra.materiais];

                  if (buscaMateriais) {
                    listaParaPDF = listaParaPDF.filter((m) =>
                      m.material
                        ?.toLowerCase()
                        .includes(buscaMateriais.toLowerCase()),
                    );
                  }

                  listaParaPDF.sort((a, b) => {
                    const isEntregueA = a.status === "Entregue";
                    const isEntregueB = b.status === "Entregue";
                    if (isEntregueA && !isEntregueB) return 1;
                    if (!isEntregueA && isEntregueB) return -1;
                    return 0;
                  });

                  // 2. Calcula o Total
                  const totalMat = listaParaPDF.reduce(
                    (acc, m) => acc + (parseFloat(m.valor) || 0),
                    0,
                  );
                  const totalFormatado = `R$ ${formatarMoeda(totalMat)}`;

                  // 3. Cria um array APENAS com TEXTO (Sem JSX) e SEM o Status
                  const dadosPDF = listaParaPDF.map((m) => {
                    const qtdNumerica = parseFloat(m.quantidade) || 0;
                    const valorUnitario =
                      qtdNumerica > 0 ? m.valor / qtdNumerica : 0;

                    // Retorna um objeto ou array simples com as colunas na ordem exata
                    return [
                      m.material?.toUpperCase() || "-", // Material
                      m.quantidade || "0", // Quantidade
                      `R$ ${formatarMoeda(valorUnitario)}`, // Valor Un.
                      `R$ ${formatarMoeda(m.valor || 0)}`, // Valor Total
                      m.fornecedor?.toUpperCase() || "-", // Fornecedor
                      formatarDataBR(m.data_solicitacao), // Data
                    ];
                  });

                  // 4. Gera o PDF com as colunas corretas (Sem Status)
                  gerarPDF(
                    "Relatório de Materiais",
                    [
                      "Material",
                      "Qtd",
                      "Valor Un.",
                      "Valor Total",
                      "Fornecedor",
                      "Data",
                    ],
                    dadosPDF,
                    obra.local,
                    totalFormatado,
                  );
                }}
                className="w-[90%] max-w-[450px]"
              >
                Relatório Materiais
              </ButtonDefault>
              <div className="w-[90%] h-[40px] max-w-[450px] border border-[#C4C4C9] rounded-[6px] text-[18px] items-center flex justify-center gap-[4px] p-2">
                Total gasto: <span> R$ {formatarMoeda(totais.materiais)}</span>
              </div>
            </div>
          </div>

          {/* TABELA DE MÃO DE OBRA */}
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div
              className={`w-full flex ${isMobile ? "flex-col gap-4" : "flex-row justify-between items-center"}`}
            >
              <h1>Relatório de Mão de Obra</h1>
              <input
                type="text"
                placeholder="Buscar serviço ou prestador..."
                value={buscaMaoDeObra}
                onChange={(e) => setBuscaMaoDeObra(e.target.value)}
                className={`h-[40px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54] px-[8px] ${isMobile ? "w-full" : "w-[250px]"}`}
              />
            </div>

            <TabelaSimples
              colunas={[
                "Validação",
                "Serviço",
                "Prestador",
                "Valor Cobrado",
                "Valor Orçado",
                "Valor Pago",
                "Saldo",
                "Data",
                "",
              ]}
              dados={dadosMaoDeObra}
            />

            <div
              className={`flex ${
                isMobile ? "flex-col h-auto gap-4" : "flex-row h-[42px]"
              } justify-between px-[5%] gap-[20px] text-center w-full box-border items-center`}
            >
              <ButtonDefault
                onClick={() =>
                  gerarPDF(
                    "Relatório Mão de Obra",
                    [
                      "Serviço",
                      "Profissional",
                      "V. Cobrado",
                      "V. Orçado",
                      "V. Pago",
                      "Saldo",
                    ],
                    dadosMaoDeObra,
                    obra.local,
                  )
                }
                className="w-full max-w-[450px]"
              >
                Relatório Mão de Obras
              </ButtonDefault>

              <div className="w-full h-[40px] max-w-[450px] border border-[#C4C4C9] rounded-[6px] text-[18px] items-center flex justify-center gap-[4px] p-2">
                Total gasto: <span> R$ {formatarMoeda(totais.maoDeObra)}</span>
              </div>
            </div>
          </div>

          {/* TABELA EXTRATO */}
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div
              className={`w-full flex ${isMobile ? "flex-col gap-4" : "flex-row justify-between items-center"}`}
            >
              <h1>Extrato</h1>
              <div
                className={`flex ${isMobile ? "flex-col gap-[8px] w-full" : "flex-row gap-[8px] items-center"}`}
              >
                <input
                  type="text"
                  placeholder="Buscar no extrato..."
                  value={buscaExtrato}
                  onChange={(e) => setBuscaExtrato(e.target.value)}
                  className={`h-[40px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54] px-[8px] ${isMobile ? "w-full" : "w-[250px]"}`}
                />
                <select
                  value={filtroExtrato}
                  onChange={(e) => setFiltroExtrato(e.target.value)}
                  className={`p-[6px] border border-[#DBDADE] rounded-[8px] h-[40px] text-[#464C54] focus:outline-none text-[14px] cursor-pointer bg-white ${isMobile ? "w-full" : ""}`}
                >
                  <option value="Tudo">Tudo</option>
                  <option value="Materiais">Materiais</option>
                  <option value="Mão de Obra">Mão de Obra</option>
                </select>
              </div>
            </div>

            <TabelaSimples
              colunas={headerExtrato}
              dados={dadosRelatorioExtrato}
            />
            <div
              className={`flex ${
                isMobile ? "flex-col h-auto gap-4" : "flex-row h-[42px]"
              } justify-between px-[5%] gap-[20px] text-center w-full box-border items-center`}
            >
              <ButtonDefault
                onClick={handleGerarPDFExtrato}
                className="w-full max-w-[450px]"
              >
                Gerar pedido
              </ButtonDefault>
              {/* --- CORREÇÃO AQUI: Exibindo totais.totalExtrato --- */}
              <div className="w-full h-[40px] max-w-[450px] border border-[#C4C4C9] rounded-[6px] text-[18px] items-center flex justify-center gap-[4px] p-2">
                Total gasto:{" "}
                <span> R$ {formatarMoeda(totais.totalExtrato)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <ModalMateriais
        isOpen={modalMateriaisOpen}
        onClose={() => setModalMateriaisOpen(false)}
        nomeObra={obra.local}
        onSave={handleSaveMaterial}
      />
      <ModalMaoDeObra
        isOpen={modalMaoDeObraOpen}
        onClose={() => setModalMaoDeObraOpen(false)}
        nomeObra={obra.local}
        onSave={handleSaveMaoDeObra}
      />
    </div>
  );
}
