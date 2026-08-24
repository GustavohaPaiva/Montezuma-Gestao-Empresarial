import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startOfWeek, format } from "date-fns";
import { api } from "../../services/api";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import BaseCard from "../../components/cards/BaseCard";
import BaseButton from "../../components/gerais/BaseButton";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import BaseDatePicker from "../../components/gerais/BaseDatePicker";
import ModalAgendaPrestador from "../../components/modals/ModalAgendaPrestador";
import {
  addDays,
  parseISODate,
  toISODate,
} from "../../utils/datePickerUtils";
import {
  UserRound,
  Phone,
  Mail,
  FileText,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Edit,
  Save,
  X,
  Camera,
  ArrowLeft,
  Loader2,
  Plus,
  Link2Off,
  Tags,
  BadgeCheck,
  CalendarDays,
} from "lucide-react";

const FILTRO_INPUT_CLASS =
  "box-border min-h-11 h-11 w-full min-w-0 shrink-0 rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all placeholder:text-text-muted focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const FILTRO_SELECT_CLASS =
  "box-border min-h-11 h-11 w-full min-w-0 shrink-0 cursor-pointer rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const ORDEM_STATUS_PRESTADOR = {
  pendente: 0,
  pago: 1,
};

const DIAS_SEMANA_AGENDA = [
  { weekday: 1, label: "Seg", title: "Segunda-feira", barClass: "bg-accent-primary" },
  { weekday: 2, label: "Ter", title: "Terça-feira", barClass: "bg-accent-amber-600" },
  { weekday: 3, label: "Qua", title: "Quarta-feira", barClass: "bg-accent-indigo-600" },
  { weekday: 4, label: "Qui", title: "Quinta-feira", barClass: "bg-accent-emerald-600" },
  { weekday: 5, label: "Sex", title: "Sexta-feira", barClass: "bg-accent-blue-600" },
  { weekday: 6, label: "Sáb", title: "Sábado", barClass: "bg-accent-purple-600" },
];

function diasDaSemanaAgenda(isoSelecionado) {
  const base = parseISODate(isoSelecionado) || new Date();
  const segunda = startOfWeek(base, { weekStartsOn: 1 });
  return DIAS_SEMANA_AGENDA.map((meta, index) => {
    const date = addDays(segunda, index);
    return {
      ...meta,
      iso: toISODate(date),
      dataCurta: format(date, "dd/MM"),
    };
  });
}

function hojeISOLocal() {
  return toISODate(new Date());
}

function labelObraAgenda(obra) {
  if (!obra) return "Obra";
  const cliente = String(obra.cliente || "").trim();
  const local = String(obra.local || "").trim();
  if (cliente && local) return `${cliente} — ${local}`;
  return cliente || local || `Obra #${obra.id}`;
}

function statusPrestadorItem(item) {
  const isPago =
    item.pago_extrato === true ||
    (item.status_financeiro || "").toLowerCase().trim() === "pago";

  if (isPago) {
    return {
      key: "pago",
      label: "PAGO",
      badgeClass: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    };
  }
  return {
    key: "pendente",
    label: "PENDENTE",
    badgeClass: "bg-amber-50 text-amber-900 ring-amber-100",
  };
}

export default function PrestadorDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prestador, setPrestador] = useState(null);
  const [historicoFinanceiro, setHistoricoFinanceiro] = useState([]);
  const [classesDisponiveis, setClassesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showElements, setShowElements] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: "",
    cnpj_cpf: "",
    telefone: "",
    email: "",
  });
  
  const dataAtual = new Date();
  const [dataCalendario, setDataCalendario] = useState(
    `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}-${String(dataAtual.getDate()).padStart(2, "0")}`,
  );
  const diasSemana = useMemo(
    () => diasDaSemanaAgenda(dataCalendario),
    [dataCalendario],
  );
  const diaSelecionadoWeekday = useMemo(() => {
    const match = diasSemana.find((d) => d.iso === dataCalendario);
    if (match) return match.weekday;
    const parsed = parseISODate(dataCalendario);
    return parsed ? parsed.getDay() : 0;
  }, [diasSemana, dataCalendario]);
  const hojeIso = hojeISOLocal();

  const [agendaSemana, setAgendaSemana] = useState([]);
  const [obrasAgenda, setObrasAgenda] = useState([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [modalAgendaAberto, setModalAgendaAberto] = useState(false);
  const [modalAgendaDia, setModalAgendaDia] = useState("");
  const [lancamentoEditando, setLancamentoEditando] = useState(null);

  const [classeSelecionada, setClasseSelecionada] = useState("");
  const [salvandoSubclasse, setSalvandoSubclasse] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroObraId, setFiltroObraId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [sortConfig, setSortConfig] = useState({ campo: null, direcao: "asc" });

  const fileInputRef = useRef(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const fetchPrestador = useCallback(async () => {
    setLoading(true);
    try {
      const [dadosPrestador, dadosClasses, dadosFinanceiro] = await Promise.all(
        [
          api.getPrestadorById(id),
          api.getClassesPrestadores(),
          api.getLancamentosFinanceirosPrestador(id),
        ],
      );

      setPrestador(dadosPrestador);
      setClassesDisponiveis(dadosClasses || []);
      setHistoricoFinanceiro(dadosFinanceiro || []);

      setEditForm({
        nome: dadosPrestador.nome || "",
        cnpj_cpf: dadosPrestador.cnpj_cpf || "",
        telefone: dadosPrestador.telefone || "",
        email: dadosPrestador.email || "",
      });
    } catch (err) {
      console.error("Erro ao carregar detalhes do prestador:", err);
      alert("Prestador não encontrado.");
      navigate("/prestadores");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPrestador();
  }, [fetchPrestador]);

  useEffect(() => {
    if (prestador && !loading) {
      const timer = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(timer);
    }
    setShowElements(false);
  }, [prestador, loading]);

  const classesVinculadas = useMemo(() => {
    return (prestador?.prestadores_classes || [])
      .map((rel) => ({
        classe_id: rel.classe_id,
        nome: rel.classes_prestadores?.nome,
      }))
      .filter((item) => item.classe_id && item.nome);
  }, [prestador]);

  const classesNaoVinculadas = useMemo(() => {
    const idsAtuais = new Set(classesVinculadas.map((item) => item.classe_id));
    return (classesDisponiveis || []).filter(
      (classe) => !idsAtuais.has(classe.id),
    );
  }, [classesDisponiveis, classesVinculadas]);

  const subclassesPrestador = useMemo(() => {
    const raw = prestador?.subclasses;
    if (Array.isArray(raw)) return raw.map(String);
    return [];
  }, [prestador]);
  const ehDiarista = subclassesPrestador.includes("diarista");

  const fetchAgendaSemana = useCallback(async () => {
    if (!id || !ehDiarista || !diasSemana.length) {
      setAgendaSemana([]);
      return;
    }
    const dataInicio = diasSemana[0].iso;
    const dataFim = diasSemana[diasSemana.length - 1].iso;
    setLoadingAgenda(true);
    try {
      const lista = await api.getAgendaPrestador(id, dataInicio, dataFim);
      setAgendaSemana(lista || []);
    } catch (error) {
      console.error("Erro ao carregar agenda do prestador:", error);
      setAgendaSemana([]);
    } finally {
      setLoadingAgenda(false);
    }
  }, [id, ehDiarista, diasSemana]);

  useEffect(() => {
    void fetchAgendaSemana();
  }, [fetchAgendaSemana]);

  useEffect(() => {
    if (!ehDiarista) return;
    let cancelled = false;
    api
      .listObrasResumo()
      .then((lista) => {
        if (!cancelled) setObrasAgenda(lista || []);
      })
      .catch(() => {
        if (!cancelled) setObrasAgenda([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ehDiarista]);

  const agendaPorDia = useMemo(() => {
    const mapa = {};
    for (const item of agendaSemana) {
      const key = String(item.data || "").slice(0, 10);
      if (!key) continue;
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(item);
    }
    return mapa;
  }, [agendaSemana]);

  const abrirNovoLancamento = (isoDia) => {
    setModalAgendaDia(isoDia);
    setLancamentoEditando(null);
    setModalAgendaAberto(true);
  };

  const abrirEditarLancamento = (item) => {
    setModalAgendaDia(String(item.data || "").slice(0, 10));
    setLancamentoEditando(item);
    setModalAgendaAberto(true);
  };

  const fecharModalAgenda = () => {
    setModalAgendaAberto(false);
    setLancamentoEditando(null);
    setModalAgendaDia("");
  };

  const handleSalvarAgenda = async (payload) => {
    try {
      if (payload.id) {
        await api.updateAgendaPrestador(payload.id, {
          obra_id: payload.obra_id,
          data: payload.data,
          hora_inicio: payload.hora_inicio,
          hora_fim: payload.hora_fim,
        });
      } else {
        await api.createAgendaPrestador({
          prestador_id: Number(id),
          obra_id: payload.obra_id,
          data: payload.data,
          hora_inicio: payload.hora_inicio,
          hora_fim: payload.hora_fim,
        });
      }
      fecharModalAgenda();
      await fetchAgendaSemana();
    } catch (error) {
      console.error("Erro ao salvar agenda:", error);
      alert(error?.message || "Não foi possível salvar o lançamento.");
    }
  };

  const handleExcluirAgenda = async (lancamentoId) => {
    try {
      await api.deleteAgendaPrestador(lancamentoId);
      fecharModalAgenda();
      await fetchAgendaSemana();
    } catch (error) {
      console.error("Erro ao excluir agenda:", error);
      alert(error?.message || "Não foi possível excluir o lançamento.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.nome.trim()) {
      alert("O nome do prestador é obrigatório!");
      return;
    }
    try {
      await api.updatePrestador(id, {
        nome: editForm.nome.trim(),
        cnpj_cpf: editForm.cnpj_cpf.trim(),
        telefone: editForm.telefone.trim(),
        email: editForm.email.trim(),
      });
      setIsEditing(false);
      fetchPrestador();
    } catch (error) {
      console.error("Erro ao atualizar prestador:", error);
      alert("Falha ao salvar alterações.");
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      nome: prestador.nome || "",
      cnpj_cpf: prestador.cnpj_cpf || "",
      telefone: prestador.telefone || "",
      email: prestador.email || "",
    });
    setIsEditing(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingFoto(true);
      await api.uploadFotoPrestador(id, file);
      await fetchPrestador();
    } catch (error) {
      console.error("Erro ao subir foto:", error);
      alert("Erro ao alterar a foto.");
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleAddClasse = async () => {
    if (!classeSelecionada) return;
    try {
      await api.addClasseAoPrestador(id, classeSelecionada);
      setClasseSelecionada("");
      fetchPrestador();
    } catch (error) {
      console.error("Erro ao vincular classe:", error);
      alert("Não foi possível vincular a classe.");
    }
  };

  const handleRemoveClasse = async (classeId) => {
    try {
      await api.removeClasseDoPrestador(id, classeId);
      fetchPrestador();
    } catch (error) {
      console.error("Erro ao remover classe:", error);
      alert("Não foi possível remover a classe.");
    }
  };

  const handleToggleDiarista = async () => {
    const proximas = ehDiarista
      ? subclassesPrestador.filter((item) => item !== "diarista")
      : [...subclassesPrestador, "diarista"];
    try {
      setSalvandoSubclasse(true);
      const atualizado = await api.updatePrestador(id, {
        subclasses: proximas,
      });
      setPrestador(atualizado);
    } catch (error) {
      console.error("Erro ao atualizar subclasse:", error);
      alert("Não foi possível atualizar a subclasse.");
    } finally {
      setSalvandoSubclasse(false);
    }
  };

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);

  const formatarData = (dataIso) => {
    if (!dataIso) return "-";
    const data = new Date(dataIso);
    return data.toLocaleDateString("pt-BR");
  };

  const resumoFinanceiro = useMemo(() => {
    let contratado = 0;
    let pago = 0;

    historicoFinanceiro.forEach((item) => {
      const val = parseFloat(item.valor) || 0;
      contratado += val;
      if (statusPrestadorItem(item).key === "pago") {
        pago += val;
      }
    });

    const pendente = Math.max(contratado - pago, 0);
    const excedente = Math.max(pago - contratado, 0);

    return { contratado, pago, pendente, excedente };
  }, [historicoFinanceiro]);

  const temLancamentos = historicoFinanceiro.length > 0;

  const opcoesObras = useMemo(() => {
    const mapa = new Map();
    historicoFinanceiro.forEach((item) => {
      const obraId = item.obra_id != null ? String(item.obra_id) : "";
      if (!obraId || mapa.has(obraId)) return;
      mapa.set(obraId, item.obra_nome || "Obra Desconhecida");
    });
    return Array.from(mapa.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [historicoFinanceiro]);

  const handleSort = (campo) => {
    setSortConfig((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (campo) => {
    if (sortConfig.campo !== campo) return "↕";
    return sortConfig.direcao === "asc" ? "↑" : "↓";
  };

  const dadosTabela = useMemo(() => {
    if (!temLancamentos) return [];

    const termo = busca.trim().toLowerCase();

    let lista = historicoFinanceiro.filter((item) => {
      const status = statusPrestadorItem(item);

      if (filtroObraId && String(item.obra_id) !== filtroObraId) return false;
      if (filtroStatus && status.key !== filtroStatus) return false;

      if (termo) {
        const classe = (item.classe_nome || "").toLowerCase();
        const descricao = (item.descricao || "").toLowerCase();
        const obra = (item.obra_nome || "").toLowerCase();
        if (
          !classe.includes(termo) &&
          !descricao.includes(termo) &&
          !obra.includes(termo)
        ) {
          return false;
        }
      }

      return true;
    });

    lista = [...lista];

    if (sortConfig.campo) {
      lista.sort((a, b) => {
        let valA;
        let valB;

        if (sortConfig.campo === "data") {
          valA = new Date(a.data || 0).getTime();
          valB = new Date(b.data || 0).getTime();
        } else if (sortConfig.campo === "obra") {
          valA = (a.obra_nome || "").toLowerCase();
          valB = (b.obra_nome || "").toLowerCase();
        } else if (sortConfig.campo === "classe") {
          valA = (a.classe_nome || "").toLowerCase();
          valB = (b.classe_nome || "").toLowerCase();
        } else if (sortConfig.campo === "descricao") {
          valA = (a.descricao || "").toLowerCase();
          valB = (b.descricao || "").toLowerCase();
        } else if (sortConfig.campo === "valor") {
          valA = parseFloat(a.valor) || 0;
          valB = parseFloat(b.valor) || 0;
        } else if (sortConfig.campo === "status") {
          valA = ORDEM_STATUS_PRESTADOR[statusPrestadorItem(a).key] ?? 0;
          valB = ORDEM_STATUS_PRESTADOR[statusPrestadorItem(b).key] ?? 0;
        } else {
          return 0;
        }

        if (valA < valB) return sortConfig.direcao === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direcao === "asc" ? 1 : -1;
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
      });
    }

    return lista.map((item) => {
      const status = statusPrestadorItem(item);
      const obraNome = item.obra_nome || "Obra Desconhecida";

      return [
        <div
          key={`data-${item.id}`}
          className="whitespace-nowrap text-center font-medium text-text-primary"
        >
          {formatarData(item.data)}
        </div>,
        <div
          key={`obra-${item.id}`}
          className="mx-auto max-w-[200px] truncate text-center text-sm font-semibold uppercase text-text-primary"
          title={obraNome}
        >
          {obraNome}
        </div>,
        <div
          key={`classe-${item.id}`}
          className="mx-auto max-w-[200px] truncate text-center text-sm font-semibold uppercase text-text-primary"
          title={item.classe_nome}
        >
          {item.classe_nome || "Sem classe"}
        </div>,
        item.obra_id != null ? (
          <button
            key={`descricao-${item.id}`}
            type="button"
            title="Abrir no relatório da obra"
            onClick={() =>
              navigate(
                `/obrasD/${item.obra_id}?secao=relatorios&sub=mao&item=${item.id}`,
              )
            }
            className="mx-auto max-w-[260px] cursor-pointer truncate text-center text-sm font-semibold uppercase text-accent-primary underline-offset-2 transition-colors hover:text-accent-primary-dark hover:underline"
          >
            {item.descricao || "—"}
          </button>
        ) : (
          <div
            key={`descricao-${item.id}`}
            className="mx-auto max-w-[260px] truncate text-center text-sm uppercase text-text-muted"
            title={item.descricao}
          >
            {item.descricao || "—"}
          </div>
        ),
        <div
          key={`valor-${item.id}`}
          className="whitespace-nowrap text-center font-bold text-text-primary"
        >
          R$ {formatarMoeda(item.valor)}
        </div>,
        <div key={`status-${item.id}`} className="flex justify-center">
          <span
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ${status.badgeClass}`}
          >
            {status.label}
          </span>
        </div>,
      ];
    });
  }, [
    historicoFinanceiro,
    temLancamentos,
    busca,
    filtroObraId,
    filtroStatus,
    sortConfig,
    navigate,
  ]);

  const colunasTabela = [
    <span
      key="col-data"
      className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
      onClick={() => handleSort("data")}
    >
      Data {getSortIcon("data")}
    </span>,
    <span
      key="col-obra"
      className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
      onClick={() => handleSort("obra")}
    >
      Obra {getSortIcon("obra")}
    </span>,
    <span
      key="col-classe"
      className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
      onClick={() => handleSort("classe")}
    >
      Classe {getSortIcon("classe")}
    </span>,
    <span
      key="col-descricao"
      className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
      onClick={() => handleSort("descricao")}
    >
      Descrição {getSortIcon("descricao")}
    </span>,
    <span
      key="col-valor"
      className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
      onClick={() => handleSort("valor")}
    >
      Valor {getSortIcon("valor")}
    </span>,
    <span
      key="col-status"
      className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
      onClick={() => handleSort("status")}
    >
      Status {getSortIcon("status")}
    </span>,
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
        <div className="flex min-h-[50vh] w-full items-center justify-center px-4 py-16">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-primary/35 bg-white px-8 py-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-primary/[0.06]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-accent-primary/[0.04]"
              aria-hidden
            />
            <div className="relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shadow-inner ring-1 ring-accent-primary/15">
                <UserRound className="h-7 w-7" strokeWidth={2} />
              </div>
              <Loader2
                className="mx-auto mb-5 h-10 w-10 animate-spin text-accent-primary"
                strokeWidth={2.25}
                aria-hidden
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                Montezuma
              </p>
              <h3 className="mt-1.5 text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                Carregando prestador
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
                Buscando cadastro, classes e histórico de serviços.
              </p>
              <div
                className="mx-auto mt-7 flex justify-center gap-1.5"
                role="presentation"
                aria-hidden
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-accent-primary/75"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  

  if (!prestador) {
    return null;
  }

  const terceiroTitulo =
    resumoFinanceiro.excedente > 0 ? "Acima do contratado" : "A pagar";
  const terceiroValor =
    resumoFinanceiro.excedente > 0
      ? resumoFinanceiro.excedente
      : resumoFinanceiro.pendente;
  const terceiroTheme =
    resumoFinanceiro.excedente > 0
      ? "pink"
      : resumoFinanceiro.pendente > 0
        ? "amber"
        : "indigo";

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <header className="w-full border-b border-gray-200/90 bg-bg-primary shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full flex-col gap-1.5 px-[5%] py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/prestadores")}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
              aria-label="Voltar para prestadores"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="min-w-0 leading-tight flex flex-row gap-2 items-center">
              <h1 className="truncate text-orange-600 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                {prestador.nome}
              </h1>
              <p> - </p>
              <p className="mt-0.5 truncate text-[11px] text-text-muted sm:text-xs">
                {prestador.cnpj_cpf
                  ? `CPF / CNPJ / NIF: ${prestador.cnpj_cpf}`
                  : "Documento não cadastrado"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full flex-col gap-6 px-[5%] pt-6 lg:gap-8">
        <section
          className={`relative rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.05)] transition-all duration-700 ease-out sm:p-8 ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <div className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2 sm:right-6 sm:top-6">
            {isEditing ? (
              <>
                <BaseButton
                  variant="outline"
                  size="sm"
                  icon={<X className="h-4 w-4" aria-hidden />}
                  onClick={handleCancelEdit}
                >
                  <span className="hidden sm:inline">Cancelar</span>
                </BaseButton>
                <BaseButton
                  variant="primary"
                  size="sm"
                  icon={<Save className="h-4 w-4" aria-hidden />}
                  onClick={handleSaveEdit}
                >
                  <span className="hidden sm:inline">Salvar</span>
                </BaseButton>
              </>
            ) : (
              <BaseButton
                variant="outline"
                size="sm"
                icon={<Edit className="h-4 w-4" aria-hidden />}
                onClick={() => setIsEditing(true)}
              >
                <span className="hidden sm:inline">Editar dados</span>
                <span className="sm:hidden">Editar</span>
              </BaseButton>
            )}
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="flex flex-col items-center gap-4 lg:min-w-[150px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-[3px] border-border-primary/30 bg-bg-primary shadow-sm ring-1 ring-slate-900/5 transition hover:border-accent-primary/40"
                title="Alterar imagem"
              >
                {uploadingFoto ? (
                  <Loader2
                    className="h-8 w-8 animate-spin text-accent-primary"
                    aria-hidden
                  />
                ) : prestador.foto ? (
                  <>
                    <img
                      src={prestador.foto}
                      alt={prestador.nome}
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-8 w-8 text-white" aria-hidden />
                    </div>
                  </>
                ) : (
                  <>
                    <UserRound
                      className="h-12 w-12 text-text-muted transition-opacity group-hover:opacity-50"
                      aria-hidden
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera
                        className="h-8 w-8 text-text-primary"
                        aria-hidden
                      />
                    </div>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span
                  className={`text-xs font-bold uppercase tracking-wide ring-1 ${
                    prestador.ativo
                      ? "rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-emerald-100"
                      : "rounded-full bg-amber-50 px-3 py-1 text-amber-900 ring-amber-100"
                  }`}
                >
                  {prestador.ativo ? "Cadastro ativo" : "Cadastro inativo"}
                </span>
                {ehDiarista ? (
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-800 ring-1 ring-orange-100">
                    Diarista
                  </span>
                ) : null}
              </div>
            </div>

            <div className="min-w-0 flex-1 pt-2 lg:pt-0">
              {isEditing ? (
                <div className="mt-10 flex w-full flex-col gap-4 sm:mt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Nome do prestador
                      </label>
                      <BaseInput
                        value={editForm.nome}
                        onChange={(e) =>
                          setEditForm({ ...editForm, nome: e.target.value })
                        }
                        className="uppercase"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        CPF / CNPJ / NIF
                      </label>
                      <BaseInput
                        value={editForm.cnpj_cpf}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            cnpj_cpf: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Telefone
                      </label>
                      <BaseInput
                        value={editForm.telefone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            telefone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        E-mail
                      </label>
                      <BaseInput
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="lowercase"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pr-0 sm:pr-28">
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900 sm:text-3xl">
                      {prestador.nome}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-text-muted">
                      <FileText className="h-4 w-4 shrink-0" aria-hidden />
                      CPF / CNPJ / NIF: {prestador.cnpj_cpf || "Não cadastrado"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-100 bg-[#FAFAFA]/80 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                        <Phone className="h-5 w-5 text-gray-600" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Telefone
                        </span>
                        <p className="truncate font-semibold text-gray-900">
                          {prestador.telefone || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-100 bg-[#FAFAFA]/80 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                        <Mail className="h-5 w-5 text-gray-600" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          E-mail
                        </span>
                        <p
                          className="truncate font-semibold lowercase text-gray-900"
                          title={prestador.email}
                        >
                          {prestador.email || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.05)] transition-all delay-75 duration-700 ease-out sm:p-8 ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            <Tags className="h-5 w-5 text-orange-600" aria-hidden />
            Classes do prestador
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="prestador-add-classe"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-muted"
              >
                Vincular classe
              </label>
              <BaseSelect
                id="prestador-add-classe"
                searchable
                value={classeSelecionada}
                onChange={(e) => setClasseSelecionada(e.target.value)}
                placeholder="Selecione uma classe"
                aria-label="Classe para vincular"
                options={classesNaoVinculadas.map((c) => ({
                  value: String(c.id),
                  label: c.nome || `Classe ${c.id}`,
                }))}
              />
            </div>
            <BaseButton
              type="button"
              variant="primary"
              size="md"
              className="shrink-0 sm:mb-0"
              icon={<Plus className="h-4 w-4" aria-hidden />}
              disabled={!classeSelecionada}
              onClick={handleAddClasse}
            >
              Adicionar
            </BaseButton>
          </div>

          {classesVinculadas.length === 0 ? (
            <div className="mt-4 rounded-xl border-2 border-dashed border-border-primary/35 py-8 text-center text-sm font-medium text-text-muted">
              Nenhuma classe vinculada.
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {classesVinculadas.map((item) => (
                <div
                  key={`${item.classe_id}-${item.nome}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 ring-1 ring-slate-900/5"
                >
                  <span className="text-xs font-semibold uppercase tracking-tight text-text-primary">
                    {item.nome}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClasse(item.classe_id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-amber-700 transition hover:bg-amber-50"
                    title="Remover classe"
                    aria-label={`Remover classe ${item.nome}`}
                  >
                    <Link2Off className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.05)] transition-all delay-75 duration-700 ease-out sm:p-8 ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            <BadgeCheck className="h-5 w-5 text-orange-600" aria-hidden />
            Subclasse
          </h2>
          <p className="mb-4 text-xs text-text-muted">
            Independente das classes de ofício. Use para marcar o tipo de
            vínculo do prestador.
          </p>

          <button
            type="button"
            onClick={handleToggleDiarista}
            disabled={salvandoSubclasse}
            aria-pressed={ehDiarista}
            className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left ring-1 transition disabled:cursor-wait disabled:opacity-70 ${
              ehDiarista
                ? "border-orange-200 bg-orange-50/70 ring-orange-100 hover:border-orange-300"
                : "border-slate-200 bg-slate-50/80 ring-slate-900/5 hover:border-slate-300"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-tight text-text-primary">
                Diarista
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {ehDiarista
                  ? "Subclasse atribuída a este prestador."
                  : "Toque para atribuir a subclasse diarista."}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                ehDiarista
                  ? "bg-white text-orange-800 ring-orange-200"
                  : "bg-white text-slate-600 ring-slate-200"
              }`}
            >
              {salvandoSubclasse
                ? "Salvando…"
                : ehDiarista
                  ? "Atribuída"
                  : "Atribuir"}
            </span>
          </button>
        </section>

        {ehDiarista ? (
          <section
            className={`relative overflow-hidden rounded-2xl border border-accent-primary/15 bg-gradient-to-br from-white via-white to-accent-primary/[0.06] p-6 shadow-[0_10px_40px_-10px_rgba(220,59,11,0.14)] ring-1 ring-slate-900/5 transition-all delay-75 duration-700 ease-out sm:p-8 ${
              showElements
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0"
            }`}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_0%_0%,rgba(220,59,11,0.08),transparent_55%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-accent-primary/10 blur-[70px]"
              aria-hidden
            />
            <CalendarDays
              className="pointer-events-none absolute -bottom-4 -right-1 h-20 w-20 text-accent-primary/[0.07] md:h-24 md:w-24"
              strokeWidth={1}
              aria-hidden
            />

            <div className="relative z-10">
              <div className="mb-4 flex flex-col gap-4 lg:mb-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-primary/90">
                    Agenda
                  </span>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-text-primary md:text-xl">
                    Semana do diarista
                  </h2>
                  <div
                    className="mt-1.5 h-0.5 w-12 rounded-full bg-gradient-to-r from-accent-primary/90 to-accent-primary/25"
                    aria-hidden
                  />
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-text-muted">
                    Segunda a sábado. Escolha um dia no calendário para
                    posicionar a semana.
                  </p>
                </div>

                <div className="w-full shrink-0 lg:w-[17rem]">
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    <CalendarDays className="h-3.5 w-3.5 text-accent-primary" />
                    Semana / dia
                  </label>
                  <BaseDatePicker 
                    value={dataCalendario}
                    onChange={(e) => setDataCalendario(e.target.value)}
                    placeholder="Selecionar dia" />
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:flex lg:items-stretch xl:gap-2.5">
                {diasSemana.map((dia) => {
                  const selecionado = diaSelecionadoWeekday === dia.weekday;
                  const ehHoje = dia.iso === hojeIso;
                  const lancamentosDia = agendaPorDia[dia.iso] || [];

                  return (
                    <article
                      key={dia.iso}
                      className={`group relative flex min-h-[9.5rem] w-full flex-col self-stretch overflow-hidden rounded-xl p-2.5 backdrop-blur-sm transition-all duration-200 lg:min-w-0 lg:p-2 lg:hover:-translate-y-0.5 lg:hover:shadow-md ${
                        selecionado
                          ? "border border-accent-primary/40 bg-gradient-to-br from-white to-accent-primary/[0.09] shadow-[0_8px_20px_-8px_rgba(220,59,11,0.2)] ring-2 ring-accent-primary/30 lg:flex-[1.65]"
                          : "border border-border-primary/30 bg-white/90 shadow-sm ring-1 ring-slate-900/5 lg:flex-1"
                      }`}
                    >
                      <span
                        className={`absolute inset-x-0 top-0 h-0.5 shrink-0 ${dia.barClass}`}
                        aria-hidden
                      />
                      <div className="flex w-full shrink-0 items-center justify-between gap-2 pb-1.5">
                        <div className="min-w-0">
                          <p
                            className={`tracking-tight ${
                              selecionado
                                ? "text-sm font-extrabold text-accent-primary xl:text-base"
                                : "text-xs font-bold text-text-primary"
                            }`}
                            title={dia.title}
                          >
                            {dia.label}
                          </p>
                          <p className="text-[10px] font-medium tabular-nums text-text-muted">
                            {dia.dataCurta}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {ehHoje ? (
                            <span className="inline-flex rounded-full border border-accent-primary/25 bg-accent-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-primary xl:text-[11px]">
                              Hoje
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => abrirNovoLancamento(dia.iso)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10 text-accent-primary transition hover:bg-accent-primary/20"
                            title={`Lançar em ${dia.title}`}
                            aria-label={`Lançar obra em ${dia.title}`}
                          >
                            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                      <div className="flex min-h-0 flex-1 flex-col gap-1 border-t border-border-primary/20 pt-1.5">
                        {loadingAgenda ? (
                          <div className="rounded-md border border-dashed border-border-primary/30 bg-white/60 px-1.5 py-2 text-center text-[10px] leading-tight text-text-muted">
                            …
                          </div>
                        ) : lancamentosDia.length === 0 ? (
                          <div className="rounded-md border border-dashed border-border-primary/30 bg-white/60 px-1.5 py-2 text-center text-[10px] leading-tight text-text-muted">
                            Livre
                          </div>
                        ) : (
                          lancamentosDia.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => abrirEditarLancamento(item)}
                              className="w-full rounded-md border border-accent-primary/20 bg-accent-primary/[0.06] px-1.5 py-1.5 text-left transition hover:border-accent-primary/40 hover:bg-accent-primary/10"
                            >
                              <p className="text-[10px] font-bold tabular-nums text-accent-primary">
                                {item.hora_inicio}–{item.hora_fim}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-text-primary">
                                {labelObraAgenda(item.obras)}
                              </p>
                            </button>
                          ))
                        )}
                        <div className="mt-auto min-h-0 flex-1 shrink" aria-hidden />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <ModalAgendaPrestador
          isOpen={modalAgendaAberto}
          onClose={fecharModalAgenda}
          onSave={handleSalvarAgenda}
          onDelete={handleExcluirAgenda}
          obras={obrasAgenda}
          dataDia={modalAgendaDia}
          lancamento={lancamentoEditando}
        />

        <div
          className={`grid grid-cols-1 gap-4 transition-all delay-100 duration-700 ease-out sm:grid-cols-3 md:gap-6 ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <BaseCard
            variant="metric"
            title="Serviços contratados"
            value={`R$ ${formatarMoeda(resumoFinanceiro.contratado)}`}
            colorTheme="purple"
            icon={<Wallet className="h-5 w-5" />}
          />
          <BaseCard
            variant="metric"
            title="Total pago"
            value={`R$ ${formatarMoeda(resumoFinanceiro.pago)}`}
            colorTheme="emerald"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <BaseCard
            variant="metric"
            title={terceiroTitulo}
            value={`R$ ${formatarMoeda(terceiroValor)}`}
            colorTheme={terceiroTheme}
            icon={
              resumoFinanceiro.excedente > 0 ? (
                <AlertCircle className="h-5 w-5" />
              ) : resumoFinanceiro.pendente > 0 ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )
            }
          />
        </div>

        <section
          className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.05)] transition-all delay-150 duration-700 ease-out sm:p-8 ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-4">
          <h2 className="mb-0 lg:mb-4 flex items-center gap-2 text-lg font-bold tracking-tight w-full text-gray-900 sm:text-xl">
            <FileText className="h-5 w-5 text-orange-600" aria-hidden />
            Histórico de serviços
          </h2>

          {temLancamentos && (
            <div className="mb-5 flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
              <input
                type="text"
                placeholder="Buscar por obra, classe ou descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className={`${FILTRO_INPUT_CLASS} lg:max-w-[280px] lg:min-w-0 lg:flex-1`}
              />
              <BaseSelect
                searchable
                value={filtroObraId}
                onChange={(e) => setFiltroObraId(e.target.value)}
                wrapperClassName="w-full shrink-0 lg:w-auto lg:min-w-[220px]"
                className={`${FILTRO_SELECT_CLASS} w-full`}
                options={[
                  { value: "", label: "Todas as obras" },
                  ...opcoesObras,
                ]}
              />
              <BaseSelect
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                wrapperClassName="w-full shrink-0 lg:w-auto lg:min-w-[200px]"
                className={`${FILTRO_SELECT_CLASS} w-full`}
                options={[
                  { value: "", label: "Todos os status" },
                  { value: "pago", label: "Pago" },
                  { value: "pendente", label: "Pendente" },
                ]}
              />
            </div>
          )}</div>

          {!temLancamentos ? (
            <div className="rounded-xl border-2 border-dashed border-border-primary/35 py-12 text-center text-sm font-medium text-text-muted">
              Nenhum serviço financeiro registado para este prestador.
            </div>
          ) : dadosTabela.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border-primary/35 py-12 text-center text-sm font-medium text-text-muted">
              Nenhum item encontrado com os filtros aplicados.
            </div>
          ) : (
            <TabelaSimples
              variant="financeiro"
              colunas={colunasTabela}
              dados={dadosTabela}
            />
          )}
        </section>
      </div>
    </div>
  );
}
