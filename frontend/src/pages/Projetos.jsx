import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../services/api";
import TabelaSimples from "../components/TabelaSimples";
import Navbar from "../components/Navbar";
import ButtonDefault from "../components/ButtonDefault";
import ModalOrcamento from "../components/ModalOrcamento";
import ModalClientes from "../components/ModalClientes";

// --- Formatações ---
const formatarDataBR = (dataString) => {
  if (!dataString) return "-";
  // Ajuste para evitar problemas de fuso horário na visualização simples
  const data = new Date(dataString);
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const formatarMoeda = (valor) => {
  const valorNumerico = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorNumerico);
};

export default function Projetos() {
  // === CONTEXTO ESCRITÓRIO (SIMULADO) ===
  const [escritorioAtivo, setEscritorioAtivo] = useState("VK");

  // === ESTADOS ORÇAMENTO ===
  const [orcamentos, setOrcamentos] = useState([]);
  const [filtroData, setFiltroData] = useState({ inicio: "", fim: "" });
  const [buscaOrcamento, setBuscaOrcamento] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState({ id: null, campo: null });
  const [valorEdicao, setValorEdicao] = useState("");

  // === ESTADOS CLIENTES ===
  const [clientes, setClientes] = useState([]);
  const [filtroDataClientes, setFiltroDataClientes] = useState({
    inicio: "",
    fim: "",
  });
  const [buscaCliente, setBuscaCliente] = useState("");
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState({
    id: null,
    campo: null,
  });
  const [valorEdicaoCliente, setValorEdicaoCliente] = useState("");

  const [recarregar, setRecarregar] = useState(0);

  // === FETCH DADOS ===
  useEffect(() => {
    async function fetchDados() {
      try {
        const dadosOrc = await api.getOrcamentos(escritorioAtivo);
        setOrcamentos(dadosOrc || []);

        const dadosCli = await api.getClientes(escritorioAtivo);
        setClientes(dadosCli || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
    fetchDados();
  }, [recarregar, escritorioAtivo]);

  // ==========================================================================
  // LÓGICA DE ORÇAMENTOS
  // ==========================================================================

  const handleNovoOrcamento = () => {
    setModalAberto(true);
  };

  async function handleCriarOrcamento(dadosFormulario) {
    try {
      await api.createOrcamento({
        nome: dadosFormulario.nome,
        valor: dadosFormulario.valor,
        data: new Date().toISOString(),
        status: dadosFormulario.status || "Em andamento",
        escritorio_id: escritorioAtivo,
      });
      setModalAberto(false);
      setRecarregar((prev) => prev + 1);
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      alert("Erro ao criar. Verifique o console.");
    }
  }

  // --- ALTERAÇÃO AQUI: Lógica para tratar Data na Edição ---
  const iniciarEdicao = useCallback((item, campo) => {
    setEditando({ id: item.id, campo });
    let valorInicial = "";

    if (campo === "valor") {
      valorInicial = item.valor;
    } else if (campo === "nome") {
      valorInicial = item.nome;
    } else if (campo === "data") {
      // Formata para YYYY-MM-DD para o input type="date" funcionar
      const rawDate = item.data || item.created_at;
      valorInicial = rawDate ? rawDate.split("T")[0] : "";
    }

    setValorEdicao(valorInicial);
  }, []);

  const cancelarEdicao = useCallback(() => {
    setEditando({ id: null, campo: null });
    setValorEdicao("");
  }, []);

  const salvarEdicao = useCallback(
    async (item) => {
      const campo = editando.campo;
      let novoValor = valorEdicao;

      if (campo === "valor") {
        novoValor = parseFloat(valorEdicao);
        if (isNaN(novoValor)) novoValor = 0;
      }

      // --- ALTERAÇÃO AQUI: Salvar Data ---
      if (campo === "data") {
        // Garante que salve como ISO String se tiver valor
        if (valorEdicao) {
          novoValor = new Date(valorEdicao).toISOString();
        }
      }

      setOrcamentos((prev) =>
        prev.map((o) => (o.id === item.id ? { ...o, [campo]: novoValor } : o)),
      );

      setEditando({ id: null, campo: null });

      try {
        await api.updateOrcamento(item.id, { [campo]: novoValor });
        setRecarregar((prev) => prev + 1);
      } catch (err) {
        console.error(`Erro ao atualizar ${campo}:`, err);
        setRecarregar((prev) => prev + 1);
      }
    },
    [editando, valorEdicao],
  );

  const handleStatusChange = useCallback(
    async (id, novoStatus) => {
      const orcamentoAtual = orcamentos.find((o) => o.id === id);

      setOrcamentos((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: novoStatus } : o)),
      );

      try {
        await api.updateOrcamento(id, { status: novoStatus });

        if (novoStatus === "Fechado" && orcamentoAtual) {
          const valorCobrado = parseFloat(orcamentoAtual.valor) || 0;
          const valorPagoInicial = 0;

          await api.createCliente({
            nome: orcamentoAtual.nome,
            tipo: "Pendente Definição",
            status: "Produção",
            pagamento: "À combinar",
            valor_cobrado: valorCobrado,
            valor_pago: valorPagoInicial,
            saldo: valorCobrado,
            data: new Date().toISOString(),
            escritorio_id: escritorioAtivo,
          });
          setRecarregar((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Erro status:", err);
        setRecarregar((prev) => prev + 1);
      }
    },
    [orcamentos, escritorioAtivo],
  );

  const handleExcluir = useCallback(async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este orçamento?")) {
      try {
        await api.deleteOrcamento(id);
        setRecarregar((prev) => prev + 1);
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  }, []);

  const orcamentosProcessados = useMemo(() => {
    let lista = [...orcamentos];
    if (filtroData.inicio && filtroData.fim) {
      const dataInicio = new Date(filtroData.inicio).getTime();
      const dataFim = new Date(filtroData.fim).getTime();
      lista = lista.filter((item) => {
        const dataItem = new Date(item.data || item.created_at).getTime();
        return dataItem >= dataInicio && dataItem <= dataFim;
      });
    }
    if (buscaOrcamento) {
      const termo = buscaOrcamento.toLowerCase();
      lista = lista.filter(
        (item) =>
          item.nome?.toLowerCase().includes(termo) ||
          item.status?.toLowerCase().includes(termo),
      );
    }
    const pesosStatus = { "Em andamento": 1, Fechado: 2, "Não fechado": 3 };
    lista.sort((a, b) => {
      const pesoA = pesosStatus[a.status] || 99;
      const pesoB = pesosStatus[b.status] || 99;
      if (pesoA !== pesoB) return pesoA - pesoB;
      const dataA = new Date(a.data || a.created_at).getTime();
      const dataB = new Date(b.data || b.created_at).getTime();
      return dataB - dataA;
    });
    return lista;
  }, [orcamentos, filtroData, buscaOrcamento]);

  const totalOrcado = orcamentosProcessados.reduce(
    (acc, item) => acc + (parseFloat(item.valor) || 0),
    0,
  );
  const totalFechado = orcamentosProcessados
    .filter((item) => item.status === "Fechado")
    .reduce((acc, item) => acc + (parseFloat(item.valor) || 0), 0);
  const diferenca = totalOrcado - totalFechado;

  const dadosTabela = useMemo(() => {
    return orcamentosProcessados.map((o) => {
      const isEditingNome = editando.id === o.id && editando.campo === "nome";
      const isEditingValor = editando.id === o.id && editando.campo === "valor";
      const isEditingData = editando.id === o.id && editando.campo === "data";

      return [
        // 1. NOME
        <div
          className="flex items-center justify-center gap-2"
          key={`nome-${o.id}`}
        >
          {isEditingNome ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={valorEdicao}
                onChange={(e) => setValorEdicao(e.target.value)}
                className="w-[150px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-left"
                autoFocus
              />
              <button
                onClick={() => salvarEdicao(o)}
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
              onClick={() => iniciarEdicao(o, "nome")}
            >
              <span className="uppercase text-left font-semibold">
                {o.nome}
              </span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[4px]"
              />
            </div>
          )}
        </div>,

        // 2. VALOR
        <div
          className="flex items-center justify-center gap-2"
          key={`val-${o.id}`}
        >
          {isEditingValor ? (
            <div className="flex items-center gap-1">
              <span>R$</span>
              <input
                type="number"
                step="0.01"
                value={valorEdicao}
                onChange={(e) => setValorEdicao(e.target.value)}
                className="w-[80px] p-[4px] border border-[#DBDADE] ml-[5px] rounded-[8px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => salvarEdicao(o)}
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
              onClick={() => iniciarEdicao(o, "valor")}
            >
              <span className="font-bold">R$ {formatarMoeda(o.valor)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,

        // 3. DATA (AGORA EDITÁVEL)
        <div
          className="flex items-center justify-center gap-2"
          key={`data-${o.id}`}
        >
          {isEditingData ? (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={valorEdicao}
                onChange={(e) => setValorEdicao(e.target.value)}
                className="w-[130px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-[12px] md:text-[14px]"
                autoFocus
              />
              <button
                onClick={() => salvarEdicao(o)}
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
              onClick={() => iniciarEdicao(o, "data")}
            >
              <span>{formatarDataBR(o.data || o.created_at)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,

        // 4. STATUS
        <select
          key={`status-${o.id}`}
          value={o.status || "Em andamento"}
          onChange={(e) => handleStatusChange(o.id, e.target.value)}
          className={`w-fit text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none border-none cursor-pointer appearance-none ${
            o.status === "Fechado"
              ? "bg-[#E8F5E9] text-[#2E7D32]"
              : o.status === "Não fechado"
                ? "bg-[#FFEBEE] text-[#c62828]"
                : "bg-[#FFF3E0] text-[#E65100]"
          }`}
        >
          <option value="Em andamento">Em andamento</option>
          <option value="Fechado">Fechado</option>
          <option value="Não fechado">Não fechado</option>
        </select>,

        // 5. EXCLUIR
        <div className="flex justify-center group" key={`del-${o.id}`}>
          <button
            onClick={() => handleExcluir(o.id)}
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
    orcamentosProcessados,
    editando,
    valorEdicao,
    iniciarEdicao,
    cancelarEdicao,
    salvarEdicao,
    handleStatusChange,
    handleExcluir,
  ]);

  // ==========================================================================
  // LÓGICA DE CLIENTES
  // ==========================================================================

  const handleNovoCliente = () => {
    setModalClienteAberto(true);
  };

  async function handleCriarCliente(dadosFormulario) {
    try {
      await api.createCliente({
        ...dadosFormulario,
        status: "Produção",
        data: new Date().toISOString(),
        escritorio_id: escritorioAtivo,
        valor_cobrado: dadosFormulario.valor_cobrado || 0,
        valor_pago: dadosFormulario.valor_pago || 0,
      });
      setModalClienteAberto(false);
      setRecarregar((prev) => prev + 1);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      alert("Erro ao criar cliente.");
    }
  }

  const iniciarEdicaoCliente = useCallback((item, campo) => {
    setEditandoCliente({ id: item.id, campo });
    let valorInicial = "";
    if (campo === "pagamento") valorInicial = item.pagamento;
    if (campo === "tipo") valorInicial = item.tipo;
    if (campo === "valor_pago") valorInicial = item.valor_pago;
    if (campo === "valor_cobrado") valorInicial = item.valor_cobrado;
    setValorEdicaoCliente(valorInicial);
  }, []);

  const cancelarEdicaoCliente = useCallback(() => {
    setEditandoCliente({ id: null, campo: null });
    setValorEdicaoCliente("");
  }, []);

  const salvarEdicaoCliente = useCallback(
    async (item) => {
      const campo = editandoCliente.campo;
      let novoValor = valorEdicaoCliente;

      if (campo === "valor_pago" || campo === "valor_cobrado") {
        novoValor = parseFloat(valorEdicaoCliente);
        if (isNaN(novoValor)) novoValor = 0;
      }

      setClientes((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, [campo]: novoValor } : c)),
      );

      setEditandoCliente({ id: null, campo: null });

      try {
        await api.updateCliente(item.id, { [campo]: novoValor });
        setRecarregar((prev) => prev + 1);
      } catch (err) {
        console.error(`Erro ao atualizar cliente ${campo}:`, err);
        setRecarregar((prev) => prev + 1);
      }
    },
    [editandoCliente, valorEdicaoCliente],
  );

  const handleStatusClienteChange = useCallback(async (id, novoStatus) => {
    setClientes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: novoStatus } : c)),
    );
    try {
      await api.updateCliente(id, { status: novoStatus });
    } catch (err) {
      console.error("Erro status cliente:", err);
      setRecarregar((prev) => prev + 1);
    }
  }, []);

  const handleExcluirCliente = useCallback(async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await api.deleteCliente(id);
        setRecarregar((prev) => prev + 1);
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
      }
    }
  }, []);

  // Processamento Clientes
  const clientesProcessados = useMemo(() => {
    let lista = [...clientes];

    // Filtros
    if (filtroDataClientes.inicio && filtroDataClientes.fim) {
      const dataInicio = new Date(filtroDataClientes.inicio).getTime();
      const dataFim = new Date(filtroDataClientes.fim).getTime();
      lista = lista.filter((item) => {
        const dataItem = new Date(item.data || item.created_at).getTime();
        return dataItem >= dataInicio && dataItem <= dataFim;
      });
    }

    if (buscaCliente) {
      const termo = buscaCliente.toLowerCase();
      lista = lista.filter(
        (item) =>
          item.nome?.toLowerCase().includes(termo) ||
          item.status?.toLowerCase().includes(termo) ||
          item.tipo?.toLowerCase().includes(termo),
      );
    }

    // === ORDENAÇÃO POR STATUS (REQ DO USUÁRIO) ===
    const pesosStatusClientes = {
      Produção: 1,
      Prefeitura: 2,
      Caixa: 3,
      Obra: 4,
      Finalizado: 5,
    };

    lista.sort((a, b) => {
      // 1. Ordena por Status
      const pesoA = pesosStatusClientes[a.status] || 99;
      const pesoB = pesosStatusClientes[b.status] || 99;

      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }

      // 2. Se status igual, ordena por Data (mais recente primeiro)
      const dataA = new Date(a.data || a.created_at).getTime();
      const dataB = new Date(b.data || b.created_at).getTime();
      return dataB - dataA;
    });

    return lista;
  }, [clientes, filtroDataClientes, buscaCliente]);

  // Totais Clientes
  const totalPagoClientes = clientesProcessados.reduce(
    (acc, item) => acc + (parseFloat(item.valor_pago) || 0),
    0,
  );

  // Dados Tabela Clientes
  const dadosTabelaClientes = useMemo(() => {
    return clientesProcessados.map((c) => {
      const isEditingTipo =
        editandoCliente.id === c.id && editandoCliente.campo === "tipo";
      const isEditingPagamento =
        editandoCliente.id === c.id && editandoCliente.campo === "pagamento";
      const isEditingValorPago =
        editandoCliente.id === c.id && editandoCliente.campo === "valor_pago";
      const isEditingValorCobrado =
        editandoCliente.id === c.id &&
        editandoCliente.campo === "valor_cobrado";

      // Cálculos de linha
      const valorCobrado = parseFloat(c.valor_cobrado) || 0;
      const valorPago = parseFloat(c.valor_pago) || 0;
      const saldo = valorCobrado - valorPago;

      const getStatusColor = (status) => {
        switch (status) {
          case "Produção":
            return "bg-[#F3E5F5] text-[#7B1FA2]";
          case "Prefeitura":
            return "bg-[#E3F2FD] text-[#1565C0]";
          case "Caixa":
            return "bg-[#E0F2F1] text-[#00695C]";
          case "Obra":
            return "bg-[#FFF3E0] text-[#E65100]";
          case "Finalizado":
            return "bg-[#E8F5E9] text-[#2E7D32]";
          default:
            return "bg-gray-100 text-gray-600";
        }
      };

      return [
        // 1. NOME
        <span
          key={`cli-nome-${c.id}`}
          className="font-semibold uppercase text-left"
        >
          {c.nome}
        </span>,

        // 2. TIPO
        <div
          className="flex items-center justify-center gap-2"
          key={`cli-tipo-${c.id}`}
        >
          {isEditingTipo ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={valorEdicaoCliente}
                onChange={(e) => setValorEdicaoCliente(e.target.value)}
                className="w-[120px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-left"
                autoFocus
              />
              <button
                onClick={() => salvarEdicaoCliente(c)}
                className="cursor-pointer bg-transparent border-none"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={cancelarEdicaoCliente}
                className="cursor-pointer bg-transparent border-none"
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
              onClick={() => iniciarEdicaoCliente(c, "tipo")}
            >
              <span className="text-[#464C54]">{c.tipo}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>,

        // 3. STATUS
        <select
          key={`cli-status-${c.id}`}
          value={c.status || "Produção"}
          onChange={(e) => handleStatusClienteChange(c.id, e.target.value)}
          className={`w-fit text-[12px] md:text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none border-none cursor-pointer appearance-none ${getStatusColor(c.status)}`}
        >
          <option value="Produção">Produção</option>
          <option value="Prefeitura">Prefeitura</option>
          <option value="Caixa">Caixa</option>
          <option value="Obra">Obra</option>
          <option value="Finalizado">Finalizado</option>
        </select>,

        // 4. PAGAMENTO
        <div
          className="flex items-center justify-center gap-2"
          key={`cli-pagamento-${c.id}`}
        >
          {isEditingPagamento ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={valorEdicaoCliente}
                onChange={(e) => setValorEdicaoCliente(e.target.value)}
                className="w-[100px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-left"
                autoFocus
              />
              <button
                onClick={() => salvarEdicaoCliente(c)}
                className="cursor-pointer bg-transparent border-none"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={cancelarEdicaoCliente}
                className="cursor-pointer bg-transparent border-none"
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
              onClick={() => iniciarEdicaoCliente(c, "pagamento")}
            >
              <span className="text-[#464C54]">{c.pagamento}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>,

        // 5. VALOR COBRADO (Editável)
        <div
          className="flex items-center justify-center gap-2"
          key={`cli-cobrado-${c.id}`}
        >
          {isEditingValorCobrado ? (
            <div className="flex items-center gap-1">
              <span className="text-xs">R$</span>
              <input
                type="number"
                step="0.01"
                value={valorEdicaoCliente}
                onChange={(e) => setValorEdicaoCliente(e.target.value)}
                className="w-[80px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => salvarEdicaoCliente(c)}
                className="cursor-pointer bg-transparent border-none"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={cancelarEdicaoCliente}
                className="cursor-pointer bg-transparent border-none"
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
              onClick={() => iniciarEdicaoCliente(c, "valor_cobrado")}
            >
              <span className="font-bold text-[#464C54]">
                R$ {formatarMoeda(valorCobrado)}
              </span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>,

        // 6. VALOR PAGO (Editável)
        <div
          className="flex items-center justify-center gap-2"
          key={`cli-pago-${c.id}`}
        >
          {isEditingValorPago ? (
            <div className="flex items-center gap-1">
              <span className="text-xs">R$</span>
              <input
                type="number"
                step="0.01"
                value={valorEdicaoCliente}
                onChange={(e) => setValorEdicaoCliente(e.target.value)}
                className="w-[80px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => salvarEdicaoCliente(c)}
                className="cursor-pointer bg-transparent border-none"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={cancelarEdicaoCliente}
                className="cursor-pointer bg-transparent border-none"
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
              onClick={() => iniciarEdicaoCliente(c, "valor_pago")}
            >
              <span className="font-bold text-[#2E7D32]">
                R$ {formatarMoeda(valorPago)}
              </span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>,

        // 7. SALDO (Calculado)
        <div
          className="flex items-center justify-center"
          key={`cli-saldo-${c.id}`}
        >
          <span
            className={`font-bold ${saldo > 0 ? "text-[#c62828]" : "text-[#71717A]"}`}
          >
            R$ {formatarMoeda(saldo)}
          </span>
        </div>,

        // 8. DATA
        formatarDataBR(c.data || c.created_at),

        // 9. EXCLUIR
        <div className="flex justify-center group" key={`cli-del-${c.id}`}>
          <button
            onClick={() => handleExcluirCliente(c.id)}
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
    clientesProcessados,
    editandoCliente,
    valorEdicaoCliente,
    iniciarEdicaoCliente,
    cancelarEdicaoCliente,
    salvarEdicaoCliente,
    handleStatusClienteChange,
    handleExcluirCliente,
  ]);

  return (
    <div className="min-h-screen bg-[#EEEDF0] text-center pb-20">
      <ModalOrcamento
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSave={handleCriarOrcamento}
        itemParaEditar={null}
      />
      <ModalClientes
        isOpen={modalClienteAberto}
        onClose={() => setModalClienteAberto(false)}
        onSave={handleCriarCliente}
      />

      <Navbar />

      <div className="w-full px-[5%] box-border">
        {/* === SELETOR DE ESCRITÓRIO === */}
        <div className="flex justify-end mt-4 mb-2 gap-2 items-center">
          <span className="text-sm font-bold text-gray-500">
            Escritório Ativo:
          </span>
          <select
            value={escritorioAtivo}
            onChange={(e) => setEscritorioAtivo(e.target.value)}
            className="p-2 border border-gray-300 rounded-md font-bold"
          >
            <option value="VK">VK Arquitetura</option>
            <option value="YB">YB Arquitetura</option>
          </select>
        </div>

        {/* ================= SEÇÃO ORÇAMENTOS ================= */}
        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[10px] pt-[24px] pb-[24px]">
          <div className="flex flex-col xl:flex-row justify-between w-full items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-[30px] md:text-[40px] font-bold text-[#464C54]">
                Orçamentos
              </h1>
            </div>

            <div className="flex flex-col w-full justify-end px-2 xl:flex-row items-center gap-[8px]">
              <div className="w-full xl:w-[180px] ">
                <ButtonDefault
                  className="w-full text-[22px] font-semibold"
                  label="+ Novo Orçamento"
                  onClick={handleNovoOrcamento}
                >
                  + Solicitação
                </ButtonDefault>
              </div>

              <div className="w-full xl:w-[250px]">
                <input
                  type="text"
                  placeholder="Buscar orçamento..."
                  value={buscaOrcamento}
                  onChange={(e) => setBuscaOrcamento(e.target.value)}
                  className="h-[40px] w-full box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54]"
                />
              </div>

              <div className="flex w-full items-center gap-2 xl:w-[400px]">
                <input
                  type="date"
                  className="outline-none w-full text-[10px] md:text-[15px] uppercase text-[#71717A] bg-transparent border border-[1.5px] border-[#DBDADE] text-center rounded-[8px] h-[40px] px-2"
                  onChange={(e) =>
                    setFiltroData({ ...filtroData, inicio: e.target.value })
                  }
                />

                <span className="text-[#00000] text-[20px] md:text-[25px] font-semibold">
                  Até
                </span>

                <input
                  type="date"
                  className="outline-none w-full text-[10px] md:text-[15px] uppercase text-[#71717A] bg-transparent border border-[1.5px] border-[#DBDADE] text-center rounded-[8px] h-[40px] px-2"
                  onChange={(e) =>
                    setFiltroData({ ...filtroData, fim: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {orcamentos.length > 0 ? (
            <div className="w-full overflow-x-auto max-h-[700px] overflow-y-auto">
              <TabelaSimples
                colunas={["Cliente", "Valor", "Data", "Status", ""]}
                dados={dadosTabela}
              />
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Nenhum orçamento encontrado para {escritorioAtivo}.
            </div>
          )}

          <div className="grid xl:grid-cols-[repeat(auto-fit,minmax(0,362px))] gap-y-[30px] w-full xl:justify-between">
            <div className="flex justify-center items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#F8F9FA] gap-2 ">
              <span className="text-[18px] text-sm text-[#71717A] uppercase font-semibold">
                Total Orçado:
              </span>
              <span className="text-[18px] font-bold text-[#464C54]">
                R$ {formatarMoeda(totalOrcado)}
              </span>
            </div>
            <div className="flex justify-center gap-2 items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#E8F5E9]">
              <span className="text-[18px] text-sm text-[#2E7D32] uppercase font-semibold">
                Total Fechado:
              </span>
              <span className="text-[18px] font-bold text-[#1B5E20]">
                R$ {formatarMoeda(totalFechado)}
              </span>
            </div>
            <div className="flex justify-center gap-2 items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#F8F9FA] ">
              <span className="text-sm text-[18px] text-[#71717A] uppercase font-semibold">
                Diferença:
              </span>
              <span className="text-[18px] font-bold text-[#464C54]">
                R$ {formatarMoeda(diferenca)}
              </span>
            </div>
          </div>
        </div>

        {/* ================= SEÇÃO CLIENTES ================= */}
        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[40px] pt-[24px] pb-[24px]">
          <div className="flex flex-col xl:flex-row justify-between w-full items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-[30px] md:text-[40px] font-bold text-[#464C54]">
                Clientes
              </h1>
            </div>
            <div className="flex flex-col w-full justify-end px-2 xl:flex-row items-center gap-[8px]">
              <div className="w-full xl:w-[180px] ">
                <ButtonDefault
                  className="w-full text-[22px] font-semibold"
                  label="+ Novo Cliente"
                  onClick={handleNovoCliente}
                >
                  + Cliente
                </ButtonDefault>
              </div>
              <div className="w-full xl:w-[250px]">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  className="h-[40px] w-full box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54]"
                />
              </div>
              <div className="flex w-full items-center gap-2 xl:w-[400px]">
                <input
                  type="date"
                  className="outline-none w-full text-[10px] md:text-[15px] uppercase text-[#71717A] bg-transparent border border-[1.5px] border-[#DBDADE] text-center rounded-[8px] h-[40px] px-2"
                  onChange={(e) =>
                    setFiltroDataClientes({
                      ...filtroDataClientes,
                      inicio: e.target.value,
                    })
                  }
                />
                <span className="text-[#00000] text-[20px] md:text-[25px] font-semibold">
                  Até
                </span>
                <input
                  type="date"
                  className="outline-none w-full text-[10px] md:text-[15px] uppercase text-[#71717A] bg-transparent border border-[1.5px] border-[#DBDADE] text-center rounded-[8px] h-[40px] px-2"
                  onChange={(e) =>
                    setFiltroDataClientes({
                      ...filtroDataClientes,
                      fim: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {clientes.length > 0 ? (
            <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto">
              <TabelaSimples
                colunas={[
                  "Nome",
                  "Tipo",
                  "Status",
                  "Pagamento",
                  "Valor Cobrado",
                  "Valor Pago",
                  "Saldo",
                  "Data",
                  "",
                ]}
                dados={dadosTabelaClientes}
              />
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Nenhum cliente encontrado para {escritorioAtivo}.
            </div>
          )}

          <div className="flex w-full justify-between gap-2 items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#E8F5E9]">
            <span className="text-[18px] text-sm text-[#2E7D32] uppercase font-semibold">
              Total Pago:
            </span>
            <span className="text-[18px] font-bold text-[#1B5E20]">
              R$ {formatarMoeda(totalPagoClientes)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
