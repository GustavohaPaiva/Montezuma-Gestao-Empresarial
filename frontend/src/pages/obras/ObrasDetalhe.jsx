import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import { gerarPDF } from "../../services/pdfService";
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../services/api";
import ModalMateriais from "../../components/modals/ModalMateriais";
import ModalMaoDeObra from "../../components/modals/ModalMaoDeObra";
import ModalEtapas from "../../components/modals/ModalEtapas";
import Etapas from "../../components/gerais/ObraEtapas";
import ListaEtapas from "../../components/obras/ListaEtapas";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// --- Constantes ---
const ORDEM_STATUS = {
  Solicitado: 1,
  "Em cotação": 2,
  Aprovado: 3,
  "Aguardando entrega": 4,
  Entregue: 5,
};

// --- Formatações e Funções Auxiliares ---
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

const getCorStatusMaterial = (status) => {
  switch (status) {
    case "Solicitado":
      return "bg-[#FFF3E0] text-[#E65100]";
    case "Em cotação":
      return "bg-[#F3E5F5] text-[#7B1FA2]";
    case "Aprovado":
      return "bg-[#E0F2F1] text-[#00695C]";
    case "Aguardando entrega":
      return "bg-[#E3F2FD] text-[#1565C0]";
    case "Entregue":
      return "bg-[#E8F5E9] text-[#2E7D32]";
    default:
      return "bg-[#E3F2FD] text-[#1565C0]";
  }
};

const desempatePorId = (a, b) => {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
};

// --- COMPONENTES PARA EDIÇÃO IN-LINE ---
const CellInputNumber = ({ valorInicial, onSave, onCancel }) => {
  const [val, setVal] = useState(valorInicial);
  return (
    <div className="flex items-center gap-1">
      <span>R$</span>
      <input
        type="number"
        step="0.01"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-[70px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none"
        autoFocus
      />
      <button
        onClick={() => onSave(val)}
        className="cursor-pointer border-none bg-transparent flex-shrink-0"
      >
        <img
          width="15"
          src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
          alt="salvar"
        />
      </button>
      <button
        onClick={onCancel}
        className="cursor-pointer border-none bg-transparent flex-shrink-0"
      >
        <img
          width="15"
          src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
          alt="cancelar"
        />
      </button>
    </div>
  );
};

const CellInputText = ({ valorInicial, onSave, onCancel }) => {
  const [val, setVal] = useState(valorInicial);
  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-[120px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-[13px] uppercase"
        autoFocus
      />
      <button
        onClick={() => onSave(val)}
        className="cursor-pointer border-none bg-transparent flex-shrink-0"
      >
        <img
          width="15"
          src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
          alt="salvar"
        />
      </button>
      <button
        onClick={onCancel}
        className="cursor-pointer border-none bg-transparent flex-shrink-0"
      >
        <img
          width="15"
          src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
          alt="cancelar"
        />
      </button>
    </div>
  );
};

const CellSelectFornecedor = ({ valorInicialId, onSave, onCancel }) => {
  const [val, setVal] = useState(valorInicialId || "");
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const dados = await api.getFornecedoresSimples();
        setLista(dados || []);
      } catch (error) {
        console.error("Erro ao buscar fornecedores", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFornecedores();
  }, []);

  return (
    <div className="flex items-center gap-1">
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-[120px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-[13px] uppercase disabled:opacity-50"
        disabled={loading}
        autoFocus
      >
        <option value="">{loading ? "Carregando..." : "Selecione..."}</option>
        {lista.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nome}
          </option>
        ))}
      </select>
      <button
        onClick={() => onSave(val)}
        disabled={loading || !val}
        className="cursor-pointer border-none bg-transparent flex-shrink-0 disabled:opacity-50"
      >
        <img
          width="15"
          src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
          alt="salvar"
        />
      </button>
      <button
        onClick={onCancel}
        className="cursor-pointer border-none bg-transparent flex-shrink-0"
      >
        <img
          width="15"
          src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
          alt="cancelar"
        />
      </button>
    </div>
  );
};

const CellSelectPrestador = ({
  valorInicial,
  valorInicialId,
  valorInicialClasseId,
  onSave,
  onCancel,
}) => {
  const [classes, setClasses] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [classeId, setClasseId] = useState(
    valorInicialClasseId ? String(valorInicialClasseId) : "",
  );
  const [prestadorId, setPrestadorId] = useState(
    valorInicialId ? String(valorInicialId) : "",
  );
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingPrestadores, setLoadingPrestadores] = useState(false);

  useEffect(() => {
    const carregarClasses = async () => {
      try {
        setLoadingClasses(true);
        const dados = await api.getClassesPrestadores();
        setClasses(dados || []);
      } catch (error) {
        console.error("Erro ao carregar classes:", error);
      } finally {
        setLoadingClasses(false);
      }
    };
    carregarClasses();
  }, []);

  useEffect(() => {
    const carregarPrestadores = async () => {
      if (!classeId) {
        setPrestadores([]);
        setPrestadorId("");
        return;
      }
      try {
        setLoadingPrestadores(true);
        const dados = await api.getPrestadoresByClasse(classeId);
        setPrestadores(dados || []);
      } catch (error) {
        console.error("Erro ao carregar prestadores:", error);
        setPrestadores([]);
      } finally {
        setLoadingPrestadores(false);
      }
    };
    carregarPrestadores();
  }, [classeId]);

  const nomePrestadorSelecionado =
    prestadores.find((p) => String(p.id) === String(prestadorId))?.nome || "";

  return (
    <div className="flex flex-col gap-1 items-center">
      <div className="flex items-center gap-1">
        <select
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          className="w-[120px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-[13px] uppercase"
          autoFocus
        >
          <option value="">{loadingClasses ? "Carregando..." : "Classe..."}</option>
          {classes.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nome}
            </option>
          ))}
        </select>
        <select
          value={prestadorId}
          onChange={(e) => setPrestadorId(e.target.value)}
          disabled={!classeId || loadingPrestadores}
          className="w-[140px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-[13px] uppercase disabled:opacity-50"
        >
          <option value="">
            {!classeId
              ? "Prestador..."
              : loadingPrestadores
                ? "Carregando..."
                : "Selecione..."}
          </option>
          {prestadores.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nome}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            onSave({
              profissional: nomePrestadorSelecionado,
              prestador_id: prestadorId ? Number(prestadorId) : null,
              classe_id: classeId ? Number(classeId) : null,
            })
          }
          disabled={!prestadorId}
          className="cursor-pointer border-none bg-transparent flex-shrink-0"
        >
          <img
            width="15"
            src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
            alt="salvar"
          />
        </button>
        <button
          onClick={onCancel}
          className="cursor-pointer border-none bg-transparent flex-shrink-0"
        >
          <img
            width="15"
            src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
            alt="cancelar"
          />
        </button>
      </div>
      {!prestadorId && valorInicial && (
        <span className="text-[11px] text-[#71717A]">Atual: {valorInicial}</span>
      )}
    </div>
  );
};

const ModalRelatorioPrestador = ({
  isOpen,
  onClose,
  onGenerate,
  prestadoresDisponiveis,
}) => {
  const [selecionado, setSelecionado] = useState("");
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 flex w-full h-full items-center justify-center p-[10px] inset-0 bg-black/50">
      <div className="bg-[#ffffff] w-[400px] max-w-[95%] rounded-[16px] shadow-2xl flex flex-col overflow-hidden border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] flex justify-between items-center">
          <h2 className="text-[18px] font-bold text-[#464C54] uppercase">
            Relatório por Prestador
          </h2>
          <button
            onClick={onClose}
            className="border-none bg-transparent cursor-pointer"
          >
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="fechar"
            />
          </button>
        </div>
        <div className="p-[20px] flex flex-col gap-[15px]">
          <label className="text-[12px] font-bold text-[#71717A] uppercase">
            Selecione o Prestador
          </label>
          <select
            value={selecionado}
            onChange={(e) => setSelecionado(e.target.value)}
            className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none"
          >
            <option value="">Selecione...</option>
            {prestadoresDisponiveis.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
          <ButtonDefault
            onClick={() => {
              onGenerate(selecionado);
              setSelecionado("");
            }}
            disabled={!selecionado}
            className="w-full bg-[#464C54] text-black h-[50px] text-[16px] font-bold mt-[10px] disabled:opacity-50"
          >
            Gerar PDF
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
};

export default function ObrasDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obra, setObra] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);

  const [modalEtapasisOpen, setModalEtapasisOpen] = useState(false);
  const [modalMateriaisOpen, setModalMateriaisOpen] = useState(false);
  const [modalMaoDeObraOpen, setModalMaoDeObraOpen] = useState(false);
  const [modalRelatorioPrestadorOpen, setModalRelatorioPrestadorOpen] =
    useState(false);

  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");

  const [buscaMateriais, setBuscaMateriais] = useState("");
  const [buscaMaoDeObra, setBuscaMaoDeObra] = useState("");
  const [buscaExtrato, setBuscaExtrato] = useState("");

  const [sortConfig, setSortConfig] = useState({ campo: null, direcao: "asc" });
  const [sortConfigMdo, setSortConfigMdo] = useState({
    campo: null,
    direcao: "asc",
  });

  const [editandoId, setEditandoId] = useState(null);
  const [editandoMaterial, setEditandoMaterial] = useState({
    id: null,
    campo: null,
  });
  const [editandoMaoDeObra, setEditandoMaoDeObra] = useState({
    id: null,
    campo: null,
  });

  const totais = useMemo(() => {
    if (!obra)
      return {
        materiais: 0,
        maoDeObra: 0,
        totalExtrato: 0,
      };
    return {
      materiais: (obra.materiais || []).reduce(
        (acc, m) => acc + (parseFloat(m.valor) || 0),
        0,
      ),
      maoDeObra: (obra.maoDeObra || []).reduce(
        (acc, m) => acc + (parseFloat(m.valor_orcado) || 0),
        0,
      ),
      totalExtrato: (obra.relatorioExtrato || []).reduce(
        (acc, item) => acc + (parseFloat(item.valor) || 0),
        0,
      ),
    };
  }, [obra]);

  const dataGrafico = useMemo(() => {
    const paletaCores = ["#860000", "#EE5B11", "#F67D15", "#FBA51B", "#FDC626"];
    const totalGeral = totais.materiais + totais.maoDeObra;
    const dados = [
      {
        name: "Materiais",
        value: totais.materiais,
        qtd: obra?.materiais?.length || 0,
      },
      {
        name: "Mão de Obra",
        value: totais.maoDeObra,
        qtd: obra?.maoDeObra?.length || 0,
      },
    ];
    dados.sort((a, b) => b.value - a.value);
    return dados.map((d, index) => {
      const percentual =
        totalGeral > 0 ? ((d.value / totalGeral) * 100).toFixed(0) : 0;
      return {
        ...d,
        percentual,
        color: paletaCores[index] || paletaCores[paletaCores.length - 1],
      };
    });
  }, [totais, obra]);

  const toggleCategoria = (nome) => {
    setCategoriaAtiva((prev) => (prev === nome ? null : nome));
  };

  const fetchDados = useCallback(async () => {
    if (!id) return;
    try {
      const dados = await api.getObraById(id);
      if (dados) setObra(dados);
    } catch (err) {
      console.error("ERRO NO FETCH:", err);
    }
  }, [id]);

  useEffect(() => {
    const carregarDados = async () => {
      await fetchDados();
    };

    carregarDados();
  }, [fetchDados]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const prestadoresUnicos = useMemo(() => {
    if (!obra || !obra.maoDeObra) return [];
    const prestadores = obra.maoDeObra
      .map((m) => m.profissional)
      .filter(Boolean);
    return Array.from(new Set(prestadores)).sort();
  }, [obra]);

  // Checagem se o projeto é de reforma (para injetar "Demolição")
  const isReforma =
    obra?.clientes?.tipo?.toLowerCase() === "reforma" ||
    obra?.cliente?.tipo?.toLowerCase() === "reforma";

  // --- HANDLERS MATERIAIS ---
  const handleSortMateriais = (campo) => {
    setSortConfig((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const handleDeleteMaterial = useCallback(
    async (materialId) => {
      if (window.confirm("Tem certeza que deseja excluir este material?")) {
        try {
          await api.deleteMaterial(materialId);
          await fetchDados();
        } catch (err) {
          console.error("Erro ao excluir material:", err);
          alert("Erro ao excluir.");
        }
      }
    },
    [fetchDados],
  );

  const handleStatusChange = useCallback(
    async (materialId, novoStatus) => {
      setObra((prev) => ({
        ...prev,
        materiais: prev.materiais.map((m) =>
          m.id === materialId ? { ...m, status: novoStatus } : m,
        ),
      }));
      try {
        await api.updateMaterialStatus(materialId, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro status material:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const handleSaveEtapas = async (etapasFormatadas) => {
    try {
      await api.updateEtapasObra(obra.id, etapasFormatadas);
      setObra((prev) => ({ ...prev, etapas_selecionadas: etapasFormatadas }));
      setModalEtapasisOpen(false);
    } catch (error) {
      console.error("Erro ao guardar etapas:", error);
      alert("Erro ao guardar as etapas na base de dados.");
    }
  };

  const handleSaveMaterial = useCallback(
    async (dados) => {
      const dataAtual = new Date().toISOString().split("T")[0];
      try {
        await api.addMaterial({
          obra_id: id,
          material: dados.material,
          fornecedor_id: dados.fornecedor_id, // Enviando o UUID pelo modal
          valor: 0,
          quantidade: `${dados.quantidade} ${dados.unidade || "Un."}`,
          data_solicitacao: dataAtual,
          status_financeiro: "Aguardando pagamento",
        });
        await fetchDados();
        setModalMateriaisOpen(false);
      } catch (err) {
        console.error("Erro ao salvar material:", err);
        alert("Erro ao salvar material.");
      }
    },
    [id, fetchDados],
  );

  const salvarValorMaterial = useCallback(
    async (materialId, novoValor) => {
      const valorFloat = parseFloat(novoValor) || 0;
      setObra((prev) => ({
        ...prev,
        materiais: prev.materiais.map((m) =>
          m.id === materialId ? { ...m, valor: valorFloat } : m,
        ),
      }));
      setEditandoMaterial({ id: null, campo: null });
      try {
        await api.updateMaterialValor(materialId, valorFloat);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar valor material:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const salvarFornecedorMaterial = useCallback(
    async (materialId, novoFornecedorId) => {
      setEditandoMaterial({ id: null, campo: null });
      try {
        await api.updateMaterialFornecedor(materialId, novoFornecedorId);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar fornecedor:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  // --- HANDLERS MÃO DE OBRA ---
  const handleSortMdo = (campo) => {
    setSortConfigMdo((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

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
          prestador_id: dados.prestador_id,
          classe_id: dados.classe_id,
          data_solicitacao: dataAtual,
          valor_cobrado: valorInput,
          valor_orcado: valorInput,
          valor_pago: 0,
        });
        await fetchDados();
        setModalMaoDeObraOpen(false);
      } catch (err) {
        console.error("Erro ao salvar mão de obra:", err);
        alert("Erro ao salvar mão de obra.");
      }
    },
    [id, fetchDados],
  );

  const handleValidarMaoDeObra = useCallback(
    async (item) => {
      if (item.validacao === 1) return;
      setObra((prev) => ({
        ...prev,
        maoDeObra: prev.maoDeObra.map((m) =>
          m.id === item.id ? { ...m, validacao: 1 } : m,
        ),
      }));
      try {
        await api.validarMaoDeObra(item.id, item);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao validar mão de obra:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const salvarEdicaoMaoDeObra = useCallback(
    async (item, novoValorStr) => {
      const novoValor = parseFloat(novoValorStr) || 0;
      const campoEditado = editandoMaoDeObra.campo;
      const valorOrcadoFinal =
        campoEditado === "orcado" ? novoValor : item.valor_orcado || 0;
      const valorPagoFinal =
        campoEditado === "pago" ? novoValor : item.valor_pago || 0;
      const valorCobradoFinal =
        campoEditado === "cobrado" ? novoValor : item.valor_cobrado || 0;

      setObra((prev) => ({
        ...prev,
        maoDeObra: prev.maoDeObra.map((m) =>
          m.id === item.id
            ? {
                ...m,
                valor_orcado: valorOrcadoFinal,
                valor_pago: valorPagoFinal,
                valor_cobrado: valorCobradoFinal,
                saldo: valorOrcadoFinal - valorPagoFinal,
              }
            : m,
        ),
      }));
      setEditandoMaoDeObra({ id: null, campo: null });

      try {
        await api.updateMaoDeObraFinanceiro(item.id, {
          valor_orcado: valorOrcadoFinal,
          valor_pago: valorPagoFinal,
          valor_cobrado: valorCobradoFinal,
        });
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar financeiro da mão de obra:", err);
        fetchDados();
      }
    },
    [editandoMaoDeObra, fetchDados],
  );

  const salvarEdicaoMaoDeObraProfissional = useCallback(
    async (mdoId, novoDadoPrestador) => {
      setObra((prev) => ({
        ...prev,
        maoDeObra: prev.maoDeObra.map((m) =>
          m.id === mdoId
            ? {
                ...m,
                profissional: novoDadoPrestador.profissional,
                prestador_id: novoDadoPrestador.prestador_id,
                classe_id: novoDadoPrestador.classe_id,
              }
            : m,
        ),
      }));
      setEditandoMaoDeObra({ id: null, campo: null });
      try {
        await api.updateMaoDeObraPrestador(mdoId, novoDadoPrestador);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar prestador:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const handleGerarRelatorioPorPrestador = (prestador) => {
    if (!obra || !obra.maoDeObra) return;
    const filtrados = obra.maoDeObra.filter(
      (m) => m.profissional?.toLowerCase() === prestador.toLowerCase(),
    );

    if (filtrados.length === 0) {
      alert("Nenhum registro encontrado para este prestador.");
      return;
    }

    const totalCobrado = filtrados.reduce(
      (acc, m) => acc + (parseFloat(m.valor_cobrado) || 0),
      0,
    );
    const totalPago = filtrados.reduce(
      (acc, m) => acc + (parseFloat(m.valor_pago) || 0),
      0,
    );
    const totalSaldo = filtrados.reduce(
      (acc, m) =>
        acc +
        ((parseFloat(m.valor_orcado) || 0) - (parseFloat(m.valor_pago) || 0)),
      0,
    );

    const dadosPDF = filtrados.map((m) => [
      m.tipo?.toUpperCase(),
      m.profissional?.toUpperCase(),
      `R$ ${formatarMoeda(m.valor_cobrado || 0)}`,
      `R$ ${formatarMoeda(m.valor_pago || 0)}`,
      `R$ ${formatarMoeda((m.valor_orcado || 0) - (m.valor_pago || 0))}`,
      formatarDataBR(m.data_solicitacao),
    ]);

    const infoRodape = `Total Cobrado: R$ ${formatarMoeda(totalCobrado)} | Total Pago: R$ ${formatarMoeda(totalPago)} | Saldo Geral: R$ ${formatarMoeda(totalSaldo)}`;

    gerarPDF(
      `Relatório - ${prestador.toUpperCase()}`,
      ["Serviço", "Prestador", "V. Cobrado", "V. Pago", "Saldo", "Data"],
      dadosPDF,
      obra.local,
      infoRodape,
    );
    setModalRelatorioPrestadorOpen(false);
  };

  // --- HANDLERS EXTRATO ---
  const handleStatusFinanceiroChange = useCallback(
    async (extratoId, novoStatus) => {
      setObra((prev) => ({
        ...prev,
        relatorioExtrato: prev.relatorioExtrato.map((i) =>
          i.id === extratoId ? { ...i, status_financeiro: novoStatus } : i,
        ),
      }));
      try {
        await api.updateExtratoStatusFinanceiro(extratoId, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao mudar status financeiro do extrato:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const salvarValorExtrato = useCallback(
    async (itemId, novoValorStr) => {
      const valorFloat = parseFloat(novoValorStr) || 0;
      setObra((prev) => ({
        ...prev,
        relatorioExtrato: prev.relatorioExtrato.map((i) =>
          i.id === itemId ? { ...i, valor: valorFloat } : i,
        ),
      }));
      setEditandoId(null);
      try {
        await api.updateValorRelatorioExtrato(itemId, valorFloat);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar valor no extrato:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const handleCheckExtrato = useCallback(
    async (item) => {
      const novoStatus = item.validacao === 1 ? 0 : 1;
      setObra((prev) => ({
        ...prev,
        relatorioExtrato: prev.relatorioExtrato.map((i) =>
          i.id === item.id ? { ...i, validacao: novoStatus } : i,
        ),
      }));
      try {
        await api.updateExtratoValidacao(item.id, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao validar extrato:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const handleCheckAllExtrato = useCallback(
    async (isChecked) => {
      const novoStatus = isChecked ? 1 : 0;
      setObra((prev) => ({
        ...prev,
        relatorioExtrato: prev.relatorioExtrato.map((i) => ({
          ...i,
          validacao: novoStatus,
        })),
      }));
      try {
        await api.updateExtratoValidacaoAll(id, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao validar todos no extrato:", err);
        fetchDados();
      }
    },
    [id, fetchDados],
  );

  const handleGerarPDFExtrato = () => {
    if (!obra || !obra.relatorioExtrato) return;
    const itens = obra.relatorioExtrato.filter((i) => i.validacao === 1);
    if (itens.length === 0)
      return alert("Nenhum item selecionado para o extrato.");
    const soma = itens.reduce((acc, i) => acc + (parseFloat(i.valor) || 0), 0);
    const formatado = `R$ ${formatarMoeda(soma)}`;
    const pdfData = itens.map((i) => [
      i.descricao,
      i.tipo,
      i.quantidade,
      formatarDataBR(i.data),
      `R$ ${formatarMoeda(i.valor)}`,
    ]);
    gerarPDF(
      "Extrato",
      ["Descrição", "Tipo", "Qtd", "Data", "Valor"],
      pdfData,
      obra.local,
      formatado,
    );
  };

  // --- DADOS TABELA MATERIAIS ---
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
  ]);

  // --- DADOS TABELA MÃO DE OBRA ---
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
  ]);

  // --- DADOS EXTRATO ---
  const dadosRelatorioExtrato = useMemo(() => {
    if (!obra || !obra.relatorioExtrato) return [];
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

    itensFiltrados.sort((a, b) => {
      const statusA = a.status_financeiro || "Aguardando pagamento";
      const statusB = b.status_financeiro || "Aguardando pagamento";
      if (statusA !== statusB) {
        if (statusA === "Aguardando pagamento") return -1;
        if (statusB === "Aguardando pagamento") return 1;
      }
      const dataA = new Date(a.data).getTime();
      const dataB = new Date(b.data).getTime();
      if (dataB !== dataA) return dataB - dataA;
      return desempatePorId(a, b);
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
  ]);

  // --- CÁLCULOS TOTAIS ---

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
      <header className="h-[auto] min-h-[82px] border-b border-[#DBDADE] flex justify-center top-0 z-10 w-full bg-[#EEEDF0] py-4">
        <div className="w-[90%] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-[16px] w-full md:w-auto">
            <button
              onClick={() => navigate(-1)}
              className="border-none bg-transparent cursor-pointer flex items-center shrink-0"
            >
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/ios/50/back--v1.png"
                alt="voltar"
              />
            </button>
            <div className="flex flex-col">
              <h1 className="text-[18px] md:text-[20px] font-bold uppercase tracking-[1px] md:tracking-[2px] text-[#464C54] leading-tight">
                {obra.local} - {obra.clientes?.nome || obra.cliente}{" "}
                {isReforma && "(Reforma)"}
              </h1>
              {obra.clientes?.rua_obra || obra.clientes?.rua ? (
                <span className="text-[11px] md:text-[12px] text-[#71717A] uppercase font-medium mt-1">
                  {obra.clientes.rua_obra}
                  {obra.clientes.numero_obra &&
                    `, ${obra.clientes.numero_obra}`}
                </span>
              ) : null}
            </div>
          </div>
          {!isMobile && (
            <div className="flex gap-[16px]">
              <ButtonDefault
                className="w-[135px]"
                onClick={() => setModalEtapasisOpen(true)}
              >
                + Etapas
              </ButtonDefault>
              <ButtonDefault
                className="w-[135px]"
                onClick={() => setModalMateriaisOpen(true)}
              >
                + Materiais
              </ButtonDefault>
              <ButtonDefault
                className="w-[150px]"
                onClick={() => setModalMaoDeObraOpen(true)}
              >
                + Mão de Obra
              </ButtonDefault>
            </div>
          )}
        </div>
      </header>
      <main className="w-[90%] mt-[24px]">
        {isMobile && (
          <div className="flex flex-col gap-[12px] mb-[24px]">
            <ButtonDefault onClick={() => setModalEtapasisOpen(true)}>
              + Etapas
            </ButtonDefault>
            <ButtonDefault onClick={() => setModalMateriaisOpen(true)}>
              + Materiais
            </ButtonDefault>
            <ButtonDefault onClick={() => setModalMaoDeObraOpen(true)}>
              + Mão de Obra
            </ButtonDefault>
          </div>
        )}
        <div>
          {/* CONTROLE FINANCEIRO (LAYOUT DINÂMICO GRÁFICO / RESUMO) */}
          <div
            id="#financeiro"
            className="w-full bg-white h-auto rounded-[12px] mb-[24px] p-[24px] shadow-sm relative overflow-hidden"
          >
            <h2 className="text-[24px] font-bold text-[#464C54] mb-[20px]">
              Resumo Financeiro
            </h2>
            <div
              className={`flex flex-col md:flex-row gap-[20px] transition-all duration-700 ease-in-out ${categoriaAtiva ? "md:h-[320px]" : "md:h-[280px] items-center justify-center"}`}
            >
              {/* Lado Esquerdo */}
              <div
                className={`flex flex-col transition-all duration-700 ease-in-out h-full ${categoriaAtiva ? "w-full md:w-[60%] justify-between" : "w-full md:w-[50%] justify-center items-center"}`}
              >
                <div
                  className={`w-full transition-all duration-700 ease-in-out overflow-hidden ${categoriaAtiva ? "max-h-[250px] opacity-100 mb-4" : "max-h-0 opacity-0"}`}
                >
                  {categoriaAtiva &&
                    (() => {
                      const ativo = dataGrafico.find(
                        (d) => d.name === categoriaAtiva,
                      );
                      return (
                        <div className="bg-[#f6f6f6] border border-[#f1f1f1] rounded-[8px] p-5 shadow-sm h-auto">
                          <h3 className="text-xl font-bold text-[#464C54] mb-2 uppercase">
                            Visão: {ativo.name}
                          </h3>
                          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-3">
                            <span
                              className="text-4xl font-bold"
                              style={{ color: ativo.color }}
                            >
                              R$ {formatarMoeda(ativo.value)}
                            </span>
                            <span className="text-sm font-medium text-[#919191] mb-1">
                              ({ativo.percentual}% do custo total da obra)
                            </span>
                          </div>
                          <p className="text-sm text-[#71717A] leading-relaxed">
                            Este painel consolida todos os gastos referentes a{" "}
                            <strong>{ativo.name.toLowerCase()}</strong>. Até o
                            momento, foram registrados{" "}
                            <strong className="text-black">{ativo.qtd}</strong>{" "}
                            lançamentos.
                          </p>
                        </div>
                      );
                    })()}
                </div>

                <div
                  className={`transition-all duration-700 ease-in-out ${categoriaAtiva ? "w-[140px] h-[140px] self-start" : "w-full h-[250px] md:h-full flex justify-center"}`}
                >
                  {totais.materiais > 0 || totais.maoDeObra > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataGrafico}
                          cx="50%"
                          cy="50%"
                          outerRadius={categoriaAtiva ? 65 : 120}
                          dataKey="value"
                          stroke="none"
                          onClick={(e, index) =>
                            toggleCategoria(dataGrafico[index].name)
                          }
                          className="cursor-pointer outline-none"
                        >
                          {dataGrafico.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              style={{
                                filter: `drop-shadow(0px 0px ${categoriaAtiva ? "4px" : "8px"} ${entry.color}99)`,
                                opacity:
                                  categoriaAtiva &&
                                  categoriaAtiva !== entry.name
                                    ? 0.3
                                    : 1,
                                transition: "opacity 0.4s ease",
                              }}
                            />
                          ))}
                        </Pie>
                        {!categoriaAtiva && (
                          <Tooltip
                            formatter={(value) => `R$ ${formatarMoeda(value)}`}
                          />
                        )}
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-[#919191] italic">
                      Sem dados suficientes para gerar o gráfico.
                    </div>
                  )}
                </div>
              </div>

              {/* Lado Direito */}
              <div
                className={`flex flex-col justify-center transition-all duration-700 ease-in-out w-full md:w-[40%]`}
              >
                <div className="flex flex-col w-full bg-[#fcfcfc] border border-[#f1f1f1] rounded-[8px] shadow-sm z-10 relative">
                  {dataGrafico.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => toggleCategoria(item.name)}
                      className={`flex justify-between items-center py-3 border-b border-[#f1f1f1] last:border-b-0 cursor-pointer transition-all duration-300 rounded-md px-2 ${categoriaAtiva === item.name ? "bg-[#EEEDF0] scale-[1.02] shadow-sm" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: item.color,
                            boxShadow: `0 0 10px ${item.color}`,
                            opacity:
                              categoriaAtiva && categoriaAtiva !== item.name
                                ? 0.4
                                : 1,
                          }}
                        ></div>
                        <span
                          className={`font-medium text-sm transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-[#a1a1a1]" : "text-[#464C54]"}`}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-semibold text-sm transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-[#a1a1a1]" : "text-[#464C54]"}`}
                        >
                          R$ {formatarMoeda(item.value)}
                        </span>
                        <span
                          className={`text-xs font-medium w-[35px] text-right transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-[#d1d1d1]" : "text-[#919191]"}`}
                        >
                          {item.percentual}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="bg-[#EEEDF0] border border-[#DBDADE] rounded-[8px] p-[8px] flex justify-between items-center shadow-sm mt-4 w-full cursor-pointer hover:bg-[#e4e3e6] transition-colors"
                  onClick={() => setCategoriaAtiva(null)}
                >
                  <span className="font-bold text-black uppercase text-sm">
                    Custo Total Lançado
                  </span>
                  <span className="font-bold text-[#2E7D32] text-lg">
                    R$ {formatarMoeda(totais.materiais + totais.maoDeObra)}
                  </span>
                </div>

                <div
                  className={`text-center mt-3 transition-all duration-500 ${categoriaAtiva ? "opacity-100 max-h-[30px]" : "opacity-0 max-h-0"}`}
                >
                  <button
                    onClick={() => setCategoriaAtiva(null)}
                    className="text-xs text-[#DC3B0B] underline font-medium cursor-pointer"
                  >
                    Restaurar gráfico completo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Etapas */}
          <div>
            <Etapas
              etapas={obra?.etapas_selecionadas || []}
              isReforma={isReforma}
            />
          </div>

          {/* TABELA DE MATERIAIS */}
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div
              className={`w-full flex ${isMobile ? "flex-col gap-4" : "flex-row justify-between items-center"}`}
            >
              <h1 className="text-[35px] font-bold">Relatório de Materiais</h1>
              <input
                type="text"
                placeholder="Buscar por material ou fornecedor..."
                value={buscaMateriais}
                onChange={(e) => setBuscaMateriais(e.target.value)}
                className={`h-[40px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54] px-[8px] ${isMobile ? "w-full" : "w-[300px]"}`}
              />
            </div>
            <TabelaSimples
              colunas={[
                "Material",
                "Quantidade",
                "Valor Un.",
                "Valor",
                <span
                  className="cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSortMateriais("status")}
                >
                  Status ↕
                </span>,
                <span
                  className="cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSortMateriais("fornecedor")}
                >
                  Fornecedor ↕
                </span>,
                <span
                  className="cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSortMateriais("data")}
                >
                  Data ↕
                </span>,
                "",
              ]}
              dados={dadosMateriais}
            />
            <div
              className={`flex ${isMobile ? "flex-col h-auto gap-4" : "flex-row h-[42px]"} justify-between px-[5%] gap-[20px] text-center w-full box-border items-center`}
            >
              <ButtonDefault
                onClick={() => {}}
                className="w-[90%] max-w-[450px]"
              >
                Relatório Materiais
              </ButtonDefault>
              <div className="w-[90%] h-[40px] max-w-[450px] border border-[#C4C4C9] rounded-[6px] text-[18px] items-center flex justify-center gap-[4px] p-2">
                Total Lançado:{" "}
                <span> R$ {formatarMoeda(totais.materiais)}</span>
              </div>
            </div>
          </div>

          {/* TABELA DE MÃO DE OBRA */}
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div
              className={`w-full flex ${isMobile ? "flex-col gap-4" : "flex-row justify-between items-center"}`}
            >
              <h1 className="text-[35px] font-bold">
                Relatório de Mão de Obra
              </h1>
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
                <span
                  className="cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSortMdo("profissional")}
                >
                  Prestador ↕
                </span>,
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
              className={`flex ${isMobile ? "flex-col h-auto gap-4" : "flex-row h-auto flex-wrap"} justify-between px-[5%] gap-[20px] text-center w-full box-border items-center`}
            >
              <div className="flex gap-2 w-full max-w-[450px] justify-center">
                <ButtonDefault
                  onClick={() => {
                    let listaParaPDF = [...obra.maoDeObra];

                    if (buscaMaoDeObra) {
                      const term = buscaMaoDeObra.toLowerCase();
                      listaParaPDF = listaParaPDF.filter(
                        (m) =>
                          m.tipo?.toLowerCase().includes(term) ||
                          m.profissional?.toLowerCase().includes(term),
                      );
                    }

                    const dadosPDF = listaParaPDF.map((m) => {
                      const cobrado = parseFloat(m.valor_cobrado) || 0;
                      const orcado = parseFloat(m.valor_orcado) || 0;
                      const pago = parseFloat(m.valor_pago) || 0;
                      const saldo = orcado - pago;

                      return [
                        m.tipo?.toUpperCase() || "-",
                        m.profissional?.toUpperCase() || "-",
                        `R$ ${formatarMoeda(cobrado)}`,
                        `R$ ${formatarMoeda(orcado)}`,
                        `R$ ${formatarMoeda(pago)}`,
                        `R$ ${formatarMoeda(saldo)}`,
                      ];
                    });

                    const totalCobrado = listaParaPDF.reduce(
                      (acc, m) => acc + (parseFloat(m.valor_cobrado) || 0),
                      0,
                    );
                    const totalPago = listaParaPDF.reduce(
                      (acc, m) => acc + (parseFloat(m.valor_pago) || 0),
                      0,
                    );
                    const totalSaldo = listaParaPDF.reduce(
                      (acc, m) =>
                        acc +
                        ((parseFloat(m.valor_orcado) || 0) -
                          (parseFloat(m.valor_pago) || 0)),
                      0,
                    );
                    const infoRodape = `Total Cobrado: R$ ${formatarMoeda(totalCobrado)} | Total Pago: R$ ${formatarMoeda(totalPago)} | Saldo: R$ ${formatarMoeda(totalSaldo)}`;

                    gerarPDF(
                      "Relatório Mão de Obra Geral",
                      [
                        "Serviço",
                        "Profissional",
                        "V. Cobrado",
                        "V. Orçado",
                        "V. Pago",
                        "Saldo",
                      ],
                      dadosPDF,
                      obra.local,
                      infoRodape,
                    );
                  }}
                  className="w-full"
                >
                  Relatório Geral
                </ButtonDefault>
                <ButtonDefault
                  onClick={() => setModalRelatorioPrestadorOpen(true)}
                  className="w-full"
                >
                  Por Prestador
                </ButtonDefault>
              </div>
              <div className="w-full h-[40px] max-w-[450px] border border-[#C4C4C9] rounded-[6px] text-[18px] items-center flex justify-center gap-[4px] p-2">
                Total Lançado:{" "}
                <span> R$ {formatarMoeda(totais.maoDeObra)}</span>
              </div>
            </div>
          </div>

          {/* TABELA EXTRATO */}
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div
              className={`w-full flex ${isMobile ? "flex-col gap-4" : "flex-row justify-between items-center"}`}
            >
              <h1 className="text-[35px] font-bold">Extrato</h1>
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
              className={`flex ${isMobile ? "flex-col h-auto gap-4" : "flex-row h-[42px]"} justify-between px-[5%] gap-[20px] text-center w-full box-border items-center`}
            >
              <ButtonDefault
                onClick={handleGerarPDFExtrato}
                className="w-full max-w-[450px]"
              >
                Gerar pedido
              </ButtonDefault>
              <div className="w-full h-[40px] max-w-[450px] border border-[#C4C4C9] rounded-[6px] text-[18px] items-center flex justify-center gap-[4px] p-2">
                Total no Extrato:{" "}
                <span> R$ {formatarMoeda(totais.totalExtrato)}</span>
              </div>
            </div>
          </div>

          {/* Lista de Etapas */}
          <ListaEtapas
            etapas={obra.etapas_selecionadas}
            isReforma={isReforma}
            onUpdateEtapas={async (novasEtapas) => {
              try {
                await api.updateEtapasObra(obra.id, novasEtapas);
                setObra((prev) => ({
                  ...prev,
                  etapas_selecionadas: novasEtapas,
                }));
              } catch (error) {
                console.error(error);
                alert("Erro ao atualizar a etapa");
              }
            }}
          />
        </div>
      </main>

      <ModalEtapas
        isOpen={modalEtapasisOpen}
        onClose={() => setModalEtapasisOpen(false)}
        nomeObra={obra.local}
        onSave={handleSaveEtapas}
        etapasSalvas={obra.etapas_selecionadas || []}
      />
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
      <ModalRelatorioPrestador
        isOpen={modalRelatorioPrestadorOpen}
        onClose={() => setModalRelatorioPrestadorOpen(false)}
        onGenerate={handleGerarRelatorioPorPrestador}
        prestadoresDisponiveis={prestadoresUnicos}
      />
    </div>
  );
}
