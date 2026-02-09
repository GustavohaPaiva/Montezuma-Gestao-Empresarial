import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../components/TabelaSimples";
import ButtonDefault from "../components/ButtonDefault";
import { gerarPDF } from "../services/pdfService";
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../services/api";
import ModalMateriais from "../components/ModalMateriais";
import ModalMaoDeObra from "../components/ModalMaoDeObra";

// Formatação de data para padrão brasileiro (DD/MM/AAAA)
const formatarDataBR = (dataString) => {
  if (!dataString) return "-";
  const [ano, mes, dia] = dataString.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
};

// Formatação de valores numéricos para moeda BRL
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

  // Estados de controle dos modais
  const [modalMateriaisOpen, setModalMateriaisOpen] = useState(false);
  const [modalMaoDeObraOpen, setModalMaoDeObraOpen] = useState(false);

  // Estado do Filtro do Extrato
  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");

  // Estados para edição
  const [editandoId, setEditandoId] = useState(null);
  const [valorEditado, setValorEditado] = useState("");
  const [editandoMaterialId, setEditandoMaterialId] = useState(null);
  const [valorMaterialEditado, setValorMaterialEditado] = useState("");
  const [editandoMaoDeObra, setEditandoMaoDeObra] = useState({
    id: null,
    campo: null,
  });
  const [valorMaoDeObraEditado, setValorMaoDeObraEditado] = useState("");

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

  // --- HANDLERS DE EXCLUSÃO ---
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

  // --- HANDLERS MATERIAIS ---
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
        // REMOVIDO: setModalMateriaisOpen(false); -> O modal fica aberto
        await api.addMaterial({
          obra_id: id,
          material: dados.material,
          valor: parseFloat(dados.valor) || 0,
          quantidade: `${dados.quantidade} ${dados.unidade || "Un."}`,
          data_solicitacao: dataAtual,
          status_financeiro: "Aguardando pagamento",
        });
        await fetchDados(); // Atualiza a lista atrás do modal
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
  const handleSaveMaoDeObra = useCallback(
    async (dados) => {
      const dataAtual = new Date().toISOString().split("T")[0];
      const valorInput = parseFloat(dados.valor) || 0;
      try {
        // REMOVIDO: setModalMaoDeObraOpen(false); -> O modal fica aberto
        await api.addMaoDeObra({
          obra_id: id,
          tipo: dados.tipo,
          profissional: dados.profissional,
          data_solicitacao: dataAtual,
          valor_cobrado: valorInput,
          valor_orcado: valorInput,
          valor_pago: 0,
        });
        await fetchDados(); // Atualiza a lista atrás do modal
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

  // --- CHECKBOX DO EXTRATO ---
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

  // --- GERAÇÃO DO PDF EXTRATO ---
  const handleGerarPDFExtrato = () => {
    if (!obra || !obra.relatorioExtrato) return;

    const itensSelecionados = obra.relatorioExtrato.filter(
      (item) => item.validacao === 1,
    );

    if (itensSelecionados.length === 0) {
      alert("Nenhum item selecionado para o extrato.");
      return;
    }

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
    );
  };

  // --- MAPEAMENTOS ---
  const dadosMateriais = useMemo(() => {
    if (!obra || !obra.materiais) return [];
    const materiaisOrdenados = [...obra.materiais].sort((a, b) => {
      const isEntregueA = a.status === "Entregue";
      const isEntregueB = b.status === "Entregue";
      if (isEntregueA && !isEntregueB) return 1;
      if (!isEntregueA && isEntregueB) return -1;
      return 0;
    });

    return materiaisOrdenados.map((m) => {
      const isEditing = editandoMaterialId === m.id;

      // Cálculo Valor Unitário
      const qtdNumerica = parseFloat(m.quantidade) || 0;
      const valorUnitario = qtdNumerica > 0 ? m.valor / qtdNumerica : 0;

      return [
        <div className="uppercase">{m.material}</div>,
        m.quantidade,
        `R$ ${formatarMoeda(valorUnitario)}`,
        // COLUNA VALOR TOTAL (Editável)
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
        // STATUS ENTREGA
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

        formatarDataBR(m.data_solicitacao),
        // BOTÃO DE DELETAR
        <div className="flex justify-center group" key={`del-mat-${m.id}`}>
          <button
            onClick={() => handleDeleteMaterial(m.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full cursor-pointer border-none bg-transparent"
            title="Excluir Material"
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
  ]);

  const dadosMaoDeObra = useMemo(() => {
    if (!obra || !obra.maoDeObra) return [];
    const maoDeObraOrdenada = [...obra.maoDeObra].sort(
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
                height="15"
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
                height="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,
        <span
          className={`${saldo < 0 ? "text-[red]" : "text-[green]"} font-bold`}
        >
          R$ {formatarMoeda(saldo)}
        </span>,
        formatarDataBR(m.data_solicitacao),
        <div className="flex justify-center group" key={`del-mdo-${m.id}`}>
          <button
            onClick={() => handleDeleteMaoDeObra(m.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full cursor-pointer border-none bg-transparent"
            title="Excluir Mão de Obra"
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
  ]);

  // --- RESTAURANDO A LÓGICA DO EXTRATO QUE ESTAVA FALTANDO ---
  const dadosRelatorioExtrato = useMemo(() => {
    if (!obra || !obra.relatorioExtrato) return [];
    const itensFiltrados = obra.relatorioExtrato.filter((item) => {
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
        item.descricao,
        item.tipo,
        item.quantidade,
        <div className="flex items-center justify-center gap-2" key={item.id}>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <span>R$</span>
              <input
                type=""
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
  ]);

  const headerExtrato = useMemo(() => {
    let itensParaVerificar = obra?.relatorioExtrato || [];
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
      "Data",
    ];
  }, [obra, handleCheckAllExtrato, filtroExtrato]);

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
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <h1>Relatório de Materiais</h1>
            <TabelaSimples
              colunas={[
                "Material",
                "Quantidade",
                "Valor Un.",
                "Valor",
                "Status",
                "Data",
                "",
              ]}
              dados={dadosMateriais}
            />
            <ButtonDefault
              onClick={() =>
                gerarPDF(
                  "Relatório Semanal",
                  ["Material", "Quantidade", "Status", "Data"],
                  dadosMateriais,
                  obra.local,
                )
              }
              className="w-full max-w-[450px]"
            >
              Relatório Materiais
            </ButtonDefault>
          </div>
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <h1>Relatório de Mão de Obra</h1>
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
          </div>
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div className="w-full flex justify-between items-center relative">
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <h1>Extrato</h1>
              </div>
              <div className="ml-auto">
                <select
                  value={filtroExtrato}
                  onChange={(e) => setFiltroExtrato(e.target.value)}
                  className="p-[6px] border border-[#DBDADE] rounded-[8px] text-[#464C54] focus:outline-none text-[14px] cursor-pointer bg-white"
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
            <ButtonDefault
              onClick={handleGerarPDFExtrato}
              className="w-full max-w-[450px]"
            >
              Gerar pedido
            </ButtonDefault>
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
