import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FileText,
  Loader2,
  ArrowLeft,
  Check,
  Circle,
  CalendarDays,
  UserRound,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import BaseSelect from "../../components/gerais/BaseSelect";
import { api } from "../../services/api";
import { ID_VOGELKOP, ID_YBYOCA } from "../../constants/escritorios";
import FichaClientePDF from "../../documents/FichaClientePDF";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import { gerarDocumentosPrefeituraPdf } from "../../utils/documentosPrefeituraPdf";
import {
  formatClienteCampo,
  formatClienteRecord,
  formatValorPipeline,
  FORMATADORES_POR_CAMPO,
} from "../../utils/clienteFormatters";

const STATUS_PMU_OPCOES = [
  "Produção de Projeto",
  "Prefeitura",
  "Codau",
  "Paralizado",
  "Seplan",
  "Sefaz",
  "Concluído",
];

const STATUS_CAIXA_OPCOES = [
  "Engenharia",
  "Assinatura",
  "Conformidade",
  "ITBI",
  "Cartório",
  "Concluído",
];

const STATUS_FIN_OPCOES = [
  "Acompanhamento",
  "Gestão",
  "Finalizado",
  "Futuros",
  "Concluído",
];

const CUB_TIPO_OPCOES = [
  { value: "Residencial", label: "Residencial" },
  { value: "Comercial", label: "Comercial" },
  { value: "Industrial", label: "Industrial / Galpão" },
];

const CUB_PADRAO_OPCOES = [
  { value: "Baixo", label: "Baixo" },
  { value: "Normal", label: "Normal" },
  { value: "Alto", label: "Alto" },
];

function mapStringOptions(list) {
  return list.map((item) => ({ value: item, label: item }));
}

function getCubNomenclaturaOptions(processo) {
  const tipo = processo?.cub_tipo_projeto;
  const padrao = processo?.cub_padrao;

  if (tipo === "Residencial" && padrao === "Baixo") {
    return mapStringOptions(["R1", "PP-4", "R8", "PIS"]);
  }
  if (tipo === "Residencial" && padrao === "Normal") {
    return mapStringOptions(["R1", "PP-4", "R8", "R16"]);
  }
  if (tipo === "Residencial" && padrao === "Alto") {
    return mapStringOptions(["R1", "R8", "R16"]);
  }
  if (tipo === "Comercial") {
    return mapStringOptions(["CAL-8", "CSL-8", "CSL-16"]);
  }
  if (tipo === "Industrial") {
    return mapStringOptions(["GI", "RP1Q"]);
  }
  return [];
}

function nomeArquivoSeguro(raw) {
  const limpo = String(raw || "Cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return limpo || "Cliente";
}

export default function ProcessosDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [processo, setProcesso] = useState(null);
  const [editando, setEditando] = useState(null);
  const [valorEdicao, setValorEdicao] = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    async function carregarDados() {
      try {
        const data = await api.getClienteById(id, {
          allowedEscritorioIds: [ID_VOGELKOP, ID_YBYOCA],
        });
        setProcesso(formatClienteRecord(data));
      } catch (error) {
        console.error("Erro ao carregar detalhes do processo:", error);
      }
    }

    if (id) {
      carregarDados();
    }
  }, [id]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const formatarData = (dataString) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const macroPhaseIndex = (prefeituraConcluida, caixaConcluida) => {
    if (caixaConcluida) return 2;
    if (prefeituraConcluida) return 1;
    return 0;
  };

  const MACRO_STEPS_META = [
    { title: "Prefeitura", subtitle: "Projeto e trâmite público" },
    { title: "Caixa", subtitle: "Engenharia e registro" },
    { title: "Finalização", subtitle: "Validação e encerramento" },
  ];

  const iniciarEdicao = (campo, valorAtual, tipoInput) => {
    setEditando(campo);
    if (tipoInput === "date" && valorAtual) {
      setValorEdicao(valorAtual.split("T")[0]);
    } else if (FORMATADORES_POR_CAMPO[campo]) {
      setValorEdicao(formatClienteCampo(campo, valorAtual));
    } else {
      setValorEdicao(valorAtual ?? "");
    }
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setValorEdicao("");
  };

  const salvarEdicao = async (campo, tipoInput) => {
    let novoValor = valorEdicao;

    if (FORMATADORES_POR_CAMPO[campo]) {
      novoValor = formatClienteCampo(campo, novoValor);
    } else if (tipoInput === "number") {
      novoValor = novoValor ? Number(novoValor) : null;
    } else if (tipoInput === "date") {
      novoValor = novoValor ? new Date(novoValor).toISOString() : null;
    }

    setProcesso((prev) => ({ ...prev, [campo]: novoValor }));
    setEditando(null);

    try {
      if (!processo?.escritorio_id) return;
      await api.updateCliente(
        id,
        { [campo]: novoValor },
        processo.escritorio_id,
      );
    } catch (err) {
      console.error(`Erro ao atualizar ${campo}:`, err);
      const data = await api.getClienteById(id, {
        allowedEscritorioIds: [ID_VOGELKOP, ID_YBYOCA],
      });
      setProcesso(formatClienteRecord(data));
    }
  };

  const handleStatusChange = async (campo, novoStatus) => {
    setProcesso((prev) => ({ ...prev, [campo]: novoStatus }));
    try {
      if (!processo?.escritorio_id) return;
      await api.updateCliente(
        id,
        { [campo]: novoStatus },
        processo.escritorio_id,
      );
    } catch (err) {
      console.error(`Erro ao atualizar ${campo}:`, err);
      const data = await api.getClienteById(id, {
        allowedEscritorioIds: [ID_VOGELKOP, ID_YBYOCA],
      });
      setProcesso(formatClienteRecord(data));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProcesso((prev) => ({
      ...prev,
      [name]: formatClienteCampo(name, value),
    }));
  };

  const handleGerarFichaPDF = () => {
    if (!processo?.id || !processo?.escritorio_id) return;
    const dataHoje = new Date().toISOString().slice(0, 10);
    setPdfPreview({
      titulo: "Ficha do Cliente",
      nomeFallback: `Ficha_Cliente_${nomeArquivoSeguro(processo.nome)}.pdf`,
      gerador: async () => {
        const dados = formatClienteRecord(
          await api.getClienteById(processo.id, {
            allowedEscritorioIds: [processo.escritorio_id],
          }),
        );
        if (!dados) {
          throw new Error("Cliente não encontrado ou fora do escritório atual.");
        }
        const blob = await pdf(<FichaClientePDF cliente={dados} />).toBlob();
        return {
          blob,
          nomePadrao: `Montezuma_Ficha-Cliente_${nomeArquivoSeguro(dados.nome)}_${dataHoje}.pdf`,
        };
      },
    });
  };

  const handleVerDocumentosPrefeitura = () => {
    if (!processo?.id) return;
    setPdfPreview({
      titulo: "Documentos para a Prefeitura",
      nomeFallback: "documentos_prefeitura.pdf",
      gerador: () => gerarDocumentosPrefeituraPdf(processo.id),
    });
  };

  const handleSalvarInformacoes = async () => {
    try {
      const formatado = formatClienteRecord(processo);
      const dadosParaSalvar = { ...formatado };
      delete dadosParaSalvar.id;
      delete dadosParaSalvar.created_at;

      if (!processo?.escritorio_id) return;
      await api.updateCliente(id, dadosParaSalvar, processo.escritorio_id);
      setProcesso(formatado);
      alert("Informações atualizadas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar informações do formulário:", err);
      alert("Erro ao atualizar informações.");
    }
  };

  if (!processo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-[5%] py-12">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-primary/35 bg-white px-8 py-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-primary/[0.07]"
            aria-hidden
          />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
              <ClipboardList className="h-6 w-6" strokeWidth={2} />
            </div>
            <Loader2
              className="mx-auto mb-4 h-9 w-9 animate-spin text-accent-primary"
              strokeWidth={2.25}
              aria-hidden
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              Processo
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              Carregando detalhes
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-text-muted">
              Sincronizando etapas, validações e informações do cliente.
            </p>
            <div
              className="mx-auto mt-6 flex justify-center gap-1.5"
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
    );
  }

  const isPrefeituraConcluida = processo.status_pmu === "Concluído";
  const isCaixaConcluida = processo.status_caixa === "Concluído";
  const isFinalizadoConcluido = processo.status_fin === "Concluído";
  const phaseActive = isFinalizadoConcluido
    ? 3
    : macroPhaseIndex(isPrefeituraConcluida, isCaixaConcluida);

  const renderCelulaEditavel = (campo, tipoInput, valorAtual) => {
    const isEditing = editando === campo;

    if (isEditing) {
      return (
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          key={campo}
        >
          <input
            type={tipoInput}
            value={valorEdicao}
            onChange={(e) => {
              const v = FORMATADORES_POR_CAMPO[campo]
                ? formatClienteCampo(campo, e.target.value)
                : e.target.value;
              setValorEdicao(v);
            }}
            className={`rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-sm text-gray-900 shadow-inner outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20 ${
              tipoInput === "text" ? "min-w-[150px]" : "min-w-[130px]"
            }`}
            autoFocus
          />
          <button
            type="button"
            onClick={() => salvarEdicao(campo, tipoInput)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 transition hover:bg-emerald-100"
          >
            <img
              width="18"
              src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
              alt="salvar"
            />
          </button>
          <button
            type="button"
            onClick={cancelarEdicao}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-red-200 bg-red-50 transition hover:bg-red-100"
          >
            <img
              width="18"
              src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
              alt="cancelar"
            />
          </button>
        </div>
      );
    }

    const exibicao = formatValorPipeline(campo, valorAtual, tipoInput);

    return (
      <div
        className="group flex cursor-pointer items-center justify-center gap-2"
        onClick={() => iniciarEdicao(campo, valorAtual, tipoInput)}
        key={campo}
      >
        <span className="font-semibold text-gray-800">{exibicao}</span>
        <img
          width="15"
          src="https://img.icons8.com/ios/50/edit--v1.png"
          alt="edit"
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    );
  };

  const getCorStatus = (status) => {
    switch (status) {
      case "Produção de Projeto":
        return "bg-cyan-50 text-cyan-900 ring-1 ring-cyan-100/90";
      case "Prefeitura":
        return "bg-sky-50 text-sky-900 ring-1 ring-sky-100/90";
      case "Codau":
        return "bg-teal-50 text-teal-900 ring-1 ring-teal-100/90";
      case "Paralizado":
        return "bg-rose-50 text-rose-900 ring-1 ring-rose-100/90";
      case "Engenharia":
        return "bg-orange-50 text-orange-900 ring-1 ring-orange-100/90";
      case "Assinatura":
        return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100/90";
      case "Conformidade":
        return "bg-purple-50 text-purple-900 ring-1 ring-purple-100/90";
      case "ITBI":
        return "bg-amber-50 text-amber-900 ring-1 ring-amber-100/90";
      case "Cartório":
        return "bg-stone-50 text-stone-800 ring-1 ring-stone-100/90";
      case "Acompanhamento":
        return "bg-blue-50 text-blue-900 ring-1 ring-blue-100/90";
      case "Gestão":
        return "bg-violet-50 text-violet-900 ring-1 ring-violet-100/90";
      case "Finalizado":
        return "bg-green-50 text-green-900 ring-1 ring-green-100/90";
      case "Concluído":
        return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100/90";
      case "Futuros":
        return "bg-slate-50 text-slate-800 ring-1 ring-slate-100/90";
      case "Seplan":
      case "Sefaz":
        return "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-100/90";
      default:
        return "bg-gray-50 text-gray-700 ring-1 ring-gray-100/90";
    }
  };

  const selectEtapaClass = (statusVal) =>
    `inline-flex min-h-[38px] w-fit max-w-full cursor-pointer appearance-none rounded-full px-4 py-2 text-center text-[13px] font-semibold shadow-sm outline-none transition focus:ring-2 focus:ring-orange-400/35 ${getCorStatus(statusVal)}`;

  const cubSelectClass =
    "box-border h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[16px] outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15";

  const renderEtapaSelect = (
    key,
    field,
    value,
    statusForClass,
    options,
    disabled = false,
  ) => (
    <BaseSelect
      key={key}
      searchable={false}
      hideChevron
      optionsCentered
      wrapperClassName="inline-flex w-fit max-w-full"
      triggerClassName={`${selectEtapaClass(statusForClass)} ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
      value={value}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => handleStatusChange(field, e.target.value)}
      options={mapStringOptions(options)}
    />
  );

  const getCorGlobalPipeline = (status) => {
    const s = status || "Produção";
    switch (s) {
      case "Produção":
        return "bg-violet-50 text-violet-900 ring-1 ring-violet-100/90";
      case "Prefeitura":
        return "bg-sky-50 text-sky-900 ring-1 ring-sky-100/90";
      case "Caixa":
        return "bg-teal-50 text-teal-900 ring-1 ring-teal-100/90";
      case "Cartorio":
        return "bg-rose-50 text-rose-900 ring-1 ring-rose-100/90";
      case "Obra":
        return "bg-orange-50 text-orange-900 ring-1 ring-orange-100/90";
      case "Finalizado":
        return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100/90";
      default:
        return "bg-gray-50 text-gray-700 ring-1 ring-gray-100/90";
    }
  };

  const dadosPrefeitura = [
    [
      <span
        key="tipo-pmu"
        className="inline-flex rounded-lg bg-gray-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-700 ring-1 ring-gray-100"
      >
        {processo.tipo || "-"}
      </span>,
      renderEtapaSelect(
        "status-pmu",
        "status_pmu",
        processo.status_pmu || "Prefeitura",
        processo.status_pmu || "Prefeitura",
        STATUS_PMU_OPCOES,
      ),
      renderCelulaEditavel("protocolo_pmu", "number", processo.protocolo_pmu),
      renderCelulaEditavel("observacao_pmu", "text", processo.observacao_pmu),
    ],
  ];

  const dadosCaixa = [
    [
      renderEtapaSelect(
        "status-caixa",
        "status_caixa",
        processo.status_caixa || "Engenharia",
        processo.status_caixa || "Engenharia",
        STATUS_CAIXA_OPCOES,
        !isPrefeituraConcluida,
      ),
      renderCelulaEditavel("engenheiro", "text", processo.engenheiro),
      renderCelulaEditavel(
        "protocolo_caixa",
        "number",
        processo.protocolo_caixa,
      ),
      renderCelulaEditavel("data_ass_caixa", "date", processo.data_ass_caixa),
    ],
  ];

  const dadosFinalizados = [
    [
      <span
        key="tipo-fin"
        className="inline-flex rounded-lg bg-gray-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-700 ring-1 ring-gray-100"
      >
        {processo.tipo || "-"}
      </span>,
      renderEtapaSelect(
        "status-fin",
        "status_fin",
        processo.status_fin || "Acompanhamento",
        processo.status_fin || "Acompanhamento",
        STATUS_FIN_OPCOES,
        !isCaixaConcluida,
      ),
      renderCelulaEditavel("n_alvara", "text", processo.n_alvara),
      renderCelulaEditavel("n_contrato", "number", processo.n_contrato),
      renderCelulaEditavel("data_ass_fin", "date", processo.data_ass_fin),
    ],
  ];

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <header className="w-full border-b border-gray-200/90 bg-bg-primary shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full flex-col gap-4 px-[5%] py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-600">
                Processo
              </p>
              <h1 className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                {processo.nome}
            </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ButtonDefault
              type="button"
              onClick={handleGerarFichaPDF}
              aria-label="Gerar ficha do cliente em PDF"
              className="h-auto min-h-[44px] cursor-pointer gap-2 rounded-xl border-gray-200 px-4 py-2.5 text-sm shadow-sm"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Gerar Ficha
            </ButtonDefault>

            <ButtonDefault
              type="button"
              onClick={handleVerDocumentosPrefeitura}
              className="h-auto min-h-[44px] cursor-pointer rounded-xl px-4 py-2.5 text-sm shadow-sm"
            >
              Ver Documentos
            </ButtonDefault>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full flex-col gap-6 px-[5%] pt-6 lg:gap-8">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {processo.nome}
                </h2>
                {processo.tipo ? (
                  <p className="mt-2 inline-flex rounded-lg bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600 ring-1 ring-gray-100">
                    {processo.tipo}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex gap-3 rounded-xl border border-gray-100 bg-[#FAFAFA]/80 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                    <UserRound className="h-5 w-5 text-gray-600" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Responsável técnico
                    </p>
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {processo.engenheiro?.trim() ? processo.engenheiro : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-gray-100 bg-[#FAFAFA]/80 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                    <Briefcase
                      className="h-5 w-5 text-orange-600"
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Status global
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCorGlobalPipeline(processo.status)}`}
                    >
                      {processo.status || "Produção"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-gray-100 bg-[#FAFAFA]/80 p-4 sm:col-span-2 lg:col-span-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                    <CalendarDays
                      className="h-5 w-5 text-gray-600"
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Datas
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-gray-900">
                      Início:{" "}
                      <span className="font-medium text-gray-700">
                        {formatarData(processo.created_at)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4">
            <Briefcase className="h-5 w-5 text-orange-600" aria-hidden />
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              Visão Geral do Processo
            </h2>
          </div>

          <div className="hidden md:block">
            <div className="flex items-start justify-between gap-1 px-1">
              {MACRO_STEPS_META.map((step, i) => {
                const done = i < phaseActive;
                const current = i === phaseActive;
                return (
                  <div
                    key={step.title}
                    className="flex min-w-0 flex-1 flex-col items-center"
                  >
                    <div className="flex w-full items-center">
                      {i > 0 && (
                        <div
                          className={`mx-1 h-[3px] flex-1 rounded-full ${phaseActive >= i ? "bg-emerald-400" : "bg-gray-200"}`}
                          aria-hidden
                        />
                      )}
                      <div
                        className={`relative z-[1] mx-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                          done
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                            : current
                              ? "border-orange-500 bg-orange-50 text-orange-600 shadow-md ring-4 ring-orange-500/15"
                              : "border-gray-200 bg-white text-gray-300"
                        }`}
                      >
                        {done ? (
                          <Check
                            className="h-6 w-6"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        ) : current ? (
                          <span className="h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.25)]" />
                        ) : (
                          <Circle
                            className="h-6 w-6"
                            strokeWidth={2}
                            aria-hidden
                          />
                        )}
                      </div>
                      {i < MACRO_STEPS_META.length - 1 && (
                        <div
                          className={`mx-1 h-[3px] flex-1 rounded-full ${phaseActive > i ? "bg-emerald-400" : "bg-gray-200"}`}
                          aria-hidden
                        />
                      )}
                    </div>
                    <p className="mt-4 text-center text-sm font-semibold text-gray-900">
                      {step.title}
                    </p>
                    <p className="mt-1 hidden text-center text-xs text-gray-500 sm:block">
                      {step.subtitle}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative md:hidden">
            <div
              className="absolute bottom-2 left-[19px] top-2 w-0.5 bg-gray-200"
              aria-hidden
            />
            <div className="space-y-8">
              {MACRO_STEPS_META.map((step, i) => {
                const done = i < phaseActive;
                const current = i === phaseActive;
                return (
                  <div key={step.title} className="relative flex gap-4">
                    <div
                      className={`relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                        done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : current
                            ? "border-orange-500 bg-orange-50 text-orange-600 ring-4 ring-orange-500/15"
                            : "border-gray-200 bg-white text-gray-300"
                      }`}
                    >
                      {done ? (
                        <Check
                          className="h-5 w-5"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      ) : current ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      ) : (
                        <Circle
                          className="h-5 w-5"
                          strokeWidth={2}
                          aria-hidden
                        />
                      )}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="font-semibold text-gray-900">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
            <ClipboardList className="h-5 w-5 text-orange-600" aria-hidden />
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              Panorama das etapas internas
            </h2>
            <span className="ml-auto text-xs text-gray-500">
              PMU · Caixa · Finalização
            </span>
          </div>
          <div className="divide-y divide-gray-100 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Prefeitura (PMU)
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Trâmite junto ao poder público
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex max-w-full rounded-full px-4 py-2 text-center text-[13px] font-semibold shadow-sm ${getCorStatus(processo.status_pmu || "Prefeitura")}`}
                >
                  {processo.status_pmu || "Prefeitura"}
                </span>
                {isPrefeituraConcluida && (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Concluído
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Caixa (habitação / registro)
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {isPrefeituraConcluida
                    ? "Fluxo operacional e documental"
                    : "Aguardando conclusão da Prefeitura"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex max-w-full rounded-full px-4 py-2 text-center text-[13px] font-semibold shadow-sm ${getCorStatus(processo.status_caixa || "Engenharia")}`}
                >
                  {processo.status_caixa || "Engenharia"}
                </span>
                {!isPrefeituraConcluida && (
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                    Pendente
                  </span>
                )}
                {isCaixaConcluida && (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Concluído
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Finalização
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {isCaixaConcluida
                    ? "Pós-obra e encerramento"
                    : "Aguardando conclusão da Caixa"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex max-w-full rounded-full px-4 py-2 text-center text-[13px] font-semibold shadow-sm ${getCorStatus(processo.status_fin || "Acompanhamento")}`}
                >
                  {processo.status_fin || "Acompanhamento"}
                </span>
                {!isCaixaConcluida && (
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                    Pendente
                  </span>
                )}
                {isFinalizadoConcluido && (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Concluído
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-col gap-1 border-b border-gray-100 pb-4 text-center sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
              Etapa 1
            </p>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Prefeitura
            </h2>
          </div>
          {isMobile ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tipo
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {processo.tipo || "-"}
                  </span>
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </span>
                  {renderEtapaSelect(
                    "status-pmu-mobile",
                    "status_pmu",
                    processo.status_pmu || "Prefeitura",
                    processo.status_pmu || "Prefeitura",
                    STATUS_PMU_OPCOES,
                  )}
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Protocolo
                  </span>
                  {renderCelulaEditavel(
                    "protocolo_pmu",
                    "number",
                    processo.protocolo_pmu,
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Obs.
                  </span>
                  {renderCelulaEditavel(
                    "observacao_pmu",
                    "text",
                    processo.observacao_pmu,
                  )}
                </div>
              </div>
            </div>
          ) : (
          <TabelaSimples
              variant="processoDetalhe"
            colunas={["Tipo", "Status", "Protocolo", "OBS."]}
            dados={dadosPrefeitura}
          />
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-col gap-1 border-b border-gray-100 pb-4 text-center sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
              Etapa 2
            </p>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Caixa
            </h2>
          </div>
          {isMobile ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </span>
                  {renderEtapaSelect(
                    "status-caixa-mobile",
                    "status_caixa",
                    processo.status_caixa || "Engenharia",
                    processo.status_caixa || "Engenharia",
                    STATUS_CAIXA_OPCOES,
                    !isPrefeituraConcluida,
                  )}
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Engenheiro
                  </span>
                  {renderCelulaEditavel(
                    "engenheiro",
                    "text",
                    processo.engenheiro,
                  )}
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Protocolo
                  </span>
                  {renderCelulaEditavel(
                    "protocolo_caixa",
                    "number",
                    processo.protocolo_caixa,
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Data assinatura
                  </span>
                  {renderCelulaEditavel(
                    "data_ass_caixa",
                    "date",
                    processo.data_ass_caixa,
                  )}
                </div>
              </div>
            </div>
          ) : (
          <TabelaSimples
              variant="processoDetalhe"
            colunas={["Status", "Engenheiro", "Protocolo", "Data Assinatura"]}
            dados={dadosCaixa}
          />
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-col gap-1 border-b border-gray-100 pb-4 text-center sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
              Etapa 3
            </p>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Finalizados
            </h2>
          </div>
          {isMobile ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tipo
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {processo.tipo || "-"}
                  </span>
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </span>
                  {renderEtapaSelect(
                    "status-fin-mobile",
                    "status_fin",
                    processo.status_fin || "Acompanhamento",
                    processo.status_fin || "Acompanhamento",
                    STATUS_FIN_OPCOES,
                    !isCaixaConcluida,
                  )}
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nº Alvará
                  </span>
                  {renderCelulaEditavel(
                    "n_alvara",
                    "number",
                    processo.n_alvara,
                  )}
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nº Contrato
                  </span>
                  {renderCelulaEditavel(
                    "n_contrato",
                    "number",
                    processo.n_contrato,
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Data assinatura
                  </span>
                  {renderCelulaEditavel(
                    "data_ass_fin",
                    "date",
                    processo.data_ass_fin,
                  )}
                </div>
              </div>
            </div>
          ) : (
          <TabelaSimples
              variant="processoDetalhe"
            colunas={[
              "Tipo",
              "Status",
              "Nº Alvara",
              "Nº Contrato",
              "Data Assinatura",
            ]}
            dados={dadosFinalizados}
          />
          )}
        </section>

        <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-8 shadow-sm sm:px-8 sm:py-10">
          <div className="mb-8 flex justify-center border-b border-gray-100 pb-6 sm:justify-start">
            <h2 className="w-full text-center text-xl font-bold tracking-tight text-gray-900 sm:text-left sm:text-2xl">
              Informações Completas do Cliente
            </h2>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 p-5 shadow-sm sm:p-6">
              <div className="mb-6 w-full text-center sm:text-left">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                  Informações do cliente
                </h3>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Nome do Proprietario (nome completo)
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={processo.nome || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    CPF do Cliente
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={processo.cpf || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 123.456.789-00"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    E-mail do Proprietário
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={processo.email || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: joao@dominio.com"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    RG
                  </label>
                  <input
                    type="text"
                    name="rg"
                    value={processo.rg || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: MG-12.345.678"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-1 mt-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Profissão
                  </label>
                  <input
                    type="text"
                    name="profissao"
                    value={processo.profissao || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: Engenheiro Civil"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 p-5 shadow-sm sm:p-6">
              <div className="mb-6 w-full text-center sm:text-left">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                  Informações de Moradia
                </h3>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="bairro"
                    value={processo.bairro || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: Centro"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Rua
                  </label>
                  <input
                    type="text"
                    name="rua"
                    value={processo.rua || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: Rua das Flores"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full md:w-[17%]">
                  <label className="text-xs font-medium text-gray-600">
                    Nº
                  </label>
                  <input
                    type="text"
                    name="numero_casa"
                    value={processo.numero_casa || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 123"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={processo.cidade || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: Uberaba"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="estado"
                    value={processo.estado || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: MG"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full md:w-[17%]">
                  <label className="text-xs font-medium text-gray-600">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={processo.cep || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 12345-678"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complemento"
                    value={processo.complemento || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: Apto 101, Casa"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 p-5 shadow-sm sm:p-6">
              <div className="mb-6 w-full text-center sm:text-left">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                  Informações da Obra
                </h3>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="bairro_obra"
                    value={processo.bairro_obra || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: Centro"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Rua
                  </label>
                  <input
                    type="text"
                    name="rua_obra"
                    value={processo.rua_obra || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: Rua das Flores"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Número
                  </label>
                  <input
                    type="text"
                    name="numero_obra"
                    value={processo.numero_obra || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 123"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Tamanho em m²
                  </label>
                  <input
                    type="text"
                    name="tamanho_m2"
                    value={processo.tamanho_m2 || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 120.5 m²"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Lote
                  </label>
                  <input
                    type="text"
                    name="lote"
                    value={processo.lote || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: Lote 123"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Quadra
                  </label>
                  <input
                    type="text"
                    name="quadra"
                    value={processo.quadra || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: quadra 5"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Codigo de identificação do imóvel
                  </label>
                  <input
                    type="text"
                    name="codigo_identificacao_imovel"
                    value={processo.codigo_identificacao_imovel || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 123456798"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    ART
                  </label>
                  <input
                    type="text"
                    name="art"
                    value={processo.art || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 123456798"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Número do Processo
                  </label>
                  <input
                    type="text"
                    name="numero_processo"
                    value={processo.numero_processo || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 123456798"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Tipo de Projeto (CUB)
                  </label>
                  <BaseSelect
                    searchable={false}
                    name="cub_tipo_projeto"
                    className={cubSelectClass}
                    value={processo.cub_tipo_projeto || ""}
                    onChange={(e) => {
                      setProcesso((prev) => ({
                        ...prev,
                        cub_tipo_projeto: e.target.value,
                        cub_padrao: "",
                        cub_nomenclatura: "",
                      }));
                    }}
                    options={[
                      { value: "", label: "Selecione..." },
                      ...CUB_TIPO_OPCOES,
                    ]}
                  />
                </div>
                {processo.cub_tipo_projeto &&
                  processo.cub_tipo_projeto !== "Industrial" && (
                    <div className="flex flex-col text-left gap-1 w-full">
                      <label className="text-xs font-medium text-gray-600">
                        Padrão de Acabamento
                      </label>
                      <BaseSelect
                        searchable={false}
                        name="cub_padrao"
                        className={cubSelectClass}
                        value={processo.cub_padrao || ""}
                        onChange={(e) => {
                          setProcesso((prev) => ({
                            ...prev,
                            cub_padrao: e.target.value,
                            cub_nomenclatura: "",
                          }));
                        }}
                        options={[
                          { value: "", label: "Selecione..." },
                          ...CUB_PADRAO_OPCOES,
                        ]}
                      />
                    </div>
                  )}
                {((processo.cub_tipo_projeto &&
                  processo.cub_tipo_projeto !== "Industrial" &&
                  processo.cub_padrao) ||
                  processo.cub_tipo_projeto === "Industrial") && (
                  <div className="flex flex-col text-left gap-1 w-full">
                    <label className="text-xs font-medium text-gray-600">
                      Código / Pavimentos
                    </label>
                    <BaseSelect
                      searchable={false}
                      name="cub_nomenclatura"
                      className={cubSelectClass}
                      value={processo.cub_nomenclatura || ""}
                      onChange={(e) =>
                        setProcesso((prev) => ({
                          ...prev,
                          cub_nomenclatura: e.target.value,
                        }))
                      }
                      options={[
                        { value: "", label: "Selecione..." },
                        ...getCubNomenclaturaOptions(processo),
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 p-5 shadow-sm sm:p-6">
              <div className="mb-6 w-full text-center sm:text-left">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                  Informações do Alvara
                </h3>
              </div>
              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Número do Alvara
                  </label>
                  <input
                    type="text"
                    name="numero_alvara"
                    value={processo.numero_alvara || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 123456798"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Data expedição
                  </label>
                  <input
                    type="text"
                    name="data_expedicao"
                    value={processo.data_expedicao || ""}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA]/80 px-3 py-2.5 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    placeholder="Ex: 12/12/2020"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex shrink-0 gap-2 border-t border-gray-200 pt-6">
              <div className="w-full flex-1">
                <ButtonDefault
                  onClick={handleSalvarInformacoes}
                  className="w-full rounded-xl py-3 font-semibold shadow-sm"
                >
                  Salvar
                </ButtonDefault>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PdfPreviewModal
        isOpen={Boolean(pdfPreview)}
        onClose={() => setPdfPreview(null)}
        titulo={pdfPreview?.titulo}
        gerador={pdfPreview?.gerador}
        nomeFallback={pdfPreview?.nomeFallback}
      />
    </div>
  );
}
