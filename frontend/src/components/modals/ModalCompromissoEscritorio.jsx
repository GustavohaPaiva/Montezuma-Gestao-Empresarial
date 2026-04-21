import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Search,
  Loader2,
  Calendar,
  Clock,
  Check,
  Repeat,
} from "lucide-react";
import { addMonths, addYears, addDays } from "date-fns";
import ModalPortal from "../gerais/ModalPortal";
import { ID_VOGELKOP } from "../../constants/escritorios";
import { api } from "../../services/api";

const TIPOS_PADRAO = ["Reunião", "Visita", "Comprar Material", "Outro"];
const STATUS = ["Agendado", "Realizado", "Cancelado"];
const RECORRENCIAS = ["Semanal", "Mensal", "Anual"];
const DIAS_SEMANA = [
  { label: "D", value: 0 },
  { label: "S", value: 1 },
  { label: "T", value: 2 },
  { label: "Q", value: 3 },
  { label: "Q", value: 4 },
  { label: "S", value: 5 },
  { label: "S", value: 6 },
];

function normalizarTipo(raw) {
  if (!raw) return "";
  const s = String(raw).trim().replace(/\s+/g, " ");
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const fieldClass =
  "w-full rounded-xl border border-gray-600/55 bg-esc-bg/75 px-4 py-3 text-sm text-gray-200 shadow-inner transition-all duration-300 placeholder:text-esc-muted/45 focus:border-[var(--esc-destaque)] focus:bg-esc-bg focus:outline-none focus:ring-1 focus:ring-[var(--esc-destaque)] disabled:cursor-not-allowed disabled:opacity-50";

const selectClass = `${fieldClass} cursor-pointer`;

const fieldRecCompact =
  "w-full rounded-lg border border-gray-600/45 bg-esc-bg/65 px-2 py-1 text-sm text-gray-200 shadow-inner transition-all duration-300 focus:border-[var(--esc-destaque)] focus:bg-esc-bg/80 focus:outline-none focus:ring-1 focus:ring-[var(--esc-destaque)]";
const selectRecCompact = `${fieldRecCompact} cursor-pointer`;

const nativePickerHidden =
  "[&::-webkit-calendar-picker-indicator]:hidden [&::-moz-calendar-picker-indicator]:hidden appearance-none";

function combinarDataHora(dataStr, horaStr) {
  if (!dataStr) return null;
  const hh = (horaStr || "09:00").slice(0, 5);
  const d = new Date(`${dataStr}T${hh}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function extrairData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function extrairHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function gerarUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function limiteMaximoRecorrencia(freq, baseDate) {
  if (freq === "Semanal") return addMonths(baseDate, 6);
  if (freq === "Mensal") return addYears(baseDate, 1);
  return addYears(baseDate, 3);
}

function formatarDataInput(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function rotuloFrequenciaResumo(freq) {
  if (freq === "Semanal") return "semanalmente";
  if (freq === "Mensal") return "mensalmente";
  return "anualmente";
}

function gerarOcorrenciasRecorrentes(
  isoInicial,
  frequencia,
  diasSelecionados,
  dataFim,
) {
  const inicio = new Date(isoInicial);
  const fim = new Date(`${dataFim}T23:59:59`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return [];

  const ocorrencias = [];
  if (frequencia === "Semanal") {
    const dias = Array.isArray(diasSelecionados) ? diasSelecionados : [];
    let cursor = new Date(inicio);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= fim) {
      if (dias.includes(cursor.getDay())) {
        const evento = new Date(cursor);
        evento.setHours(
          inicio.getHours(),
          inicio.getMinutes(),
          inicio.getSeconds(),
          inicio.getMilliseconds(),
        );
        if (evento >= inicio && evento <= fim) {
          ocorrencias.push(evento.toISOString());
        }
      }
      cursor = addDays(cursor, 1);
    }
  } else {
    let cursor = new Date(inicio);
    while (cursor <= fim) {
      ocorrencias.push(cursor.toISOString());
      cursor =
        frequencia === "Mensal" ? addMonths(cursor, 1) : addYears(cursor, 1);
    }
  }
  return ocorrencias.sort((a, b) => a.localeCompare(b));
}

export default function ModalCompromissoEscritorio({
  isOpen,
  onClose,
  onSaved,
  escritorioId,
  compromissoEdicao,
  dataInicial,
  escopoRecorrencia = "evento",
}) {
  const modoEdicao = Boolean(compromissoEdicao?.id);

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("Reunião");
  const [tipoCustom, setTipoCustom] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("09:00");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("Agendado");
  const [clienteId, setClienteId] = useState(null);
  const [clienteNome, setClienteNome] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [focoBusca, setFocoBusca] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [repetirCompromisso, setRepetirCompromisso] = useState(false);
  const [frequenciaRecorrencia, setFrequenciaRecorrencia] = useState("Semanal");
  const [diasSemanaSelecionados, setDiasSemanaSelecionados] = useState([]);
  const [dataFinalRecorrencia, setDataFinalRecorrencia] = useState("");
  const [painelRecorrenciaAberto, setPainelRecorrenciaAberto] = useState(false);

  const buscaRef = useRef(null);
  const dataInputRef = useRef(null);
  const horaInputRef = useRef(null);
  const dataFinalInputRef = useRef(null);

  const temaClasse =
    escritorioId === ID_VOGELKOP ? "theme-vogelkop" : "theme-ybyoca";

  const modalOverlayClass = `${temaClasse} fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md`;
  const modalPanelClass =
    "scheme-dark animate-premium-reveal relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-esc-card shadow-[0_0_40px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl";

  const carregarClientes = useCallback(async () => {
    if (!escritorioId) return;
    setCarregandoClientes(true);
    try {
      const lista = await api.getClientesSimplesEscritorio(escritorioId);
      setClientes(Array.isArray(lista) ? lista : []);
    } catch (e) {
      console.error("[ModalCompromisso] clientes:", e);
      setClientes([]);
    } finally {
      setCarregandoClientes(false);
    }
  }, [escritorioId]);

  useEffect(() => {
    if (!isOpen) return;
    void carregarClientes();
  }, [isOpen, carregarClientes]);

  useEffect(() => {
    if (!isOpen) return;
    setErro(null);
    if (modoEdicao && compromissoEdicao) {
      const tipoSalvo = compromissoEdicao.tipo || "Reunião";
      const ehPadrao = TIPOS_PADRAO.includes(tipoSalvo);
      setTitulo(compromissoEdicao.titulo ?? "");
      setTipo(ehPadrao ? tipoSalvo : "Outro");
      setTipoCustom(ehPadrao ? "" : tipoSalvo);
      setData(extrairData(compromissoEdicao.data_hora));
      setHora(extrairHora(compromissoEdicao.data_hora) || "09:00");
      setDescricao(compromissoEdicao.descricao ?? "");
      setStatus(compromissoEdicao.status || "Agendado");
      setClienteId(compromissoEdicao.cliente_id ?? null);
      setClienteNome(compromissoEdicao.cliente?.nome ?? "");
      setBuscaCliente(compromissoEdicao.cliente?.nome ?? "");
      setRepetirCompromisso(false);
      setFrequenciaRecorrencia("Semanal");
      setDiasSemanaSelecionados([]);
      setDataFinalRecorrencia("");
      setPainelRecorrenciaAberto(false);
    } else {
      const baseData = dataInicial || extrairData(new Date().toISOString());
      const baseDay = new Date(`${baseData}T09:00:00`).getDay();
      setTitulo("");
      setTipo("Reunião");
      setTipoCustom("");
      setData(baseData);
      setHora("09:00");
      setDescricao("");
      setStatus("Agendado");
      setClienteId(null);
      setClienteNome("");
      setBuscaCliente("");
      setRepetirCompromisso(false);
      setFrequenciaRecorrencia("Semanal");
      setDiasSemanaSelecionados([baseDay]);
      const limite = limiteMaximoRecorrencia(
        "Semanal",
        new Date(`${baseData}T09:00:00`),
      );
      setDataFinalRecorrencia(formatarDataInput(limite));
      setPainelRecorrenciaAberto(false);
    }
  }, [isOpen, modoEdicao, compromissoEdicao, dataInicial]);

  useEffect(() => {
    if (!data || modoEdicao) return;
    const base = new Date(`${data}T${(hora || "09:00").slice(0, 5)}:00`);
    if (Number.isNaN(base.getTime())) return;
    const limite = limiteMaximoRecorrencia(frequenciaRecorrencia, base);
    const maxData = formatarDataInput(limite);
    setDataFinalRecorrencia((prev) => {
      if (!prev || prev > maxData) return maxData;
      return prev;
    });
    if (
      frequenciaRecorrencia === "Semanal" &&
      diasSemanaSelecionados.length === 0
    ) {
      setDiasSemanaSelecionados([base.getDay()]);
    }
  }, [
    data,
    hora,
    frequenciaRecorrencia,
    modoEdicao,
    diasSemanaSelecionados.length,
  ]);

  const clientesFiltrados = useMemo(() => {
    const q = buscaCliente.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      String(c.nome || "")
        .toLowerCase()
        .includes(q),
    );
  }, [clientes, buscaCliente]);

  const maxDataRecorrencia = useMemo(() => {
    if (!data) return "";
    const base = new Date(`${data}T${(hora || "09:00").slice(0, 5)}:00`);
    if (Number.isNaN(base.getTime())) return "";
    return formatarDataInput(
      limiteMaximoRecorrencia(frequenciaRecorrencia, base),
    );
  }, [data, hora, frequenciaRecorrencia]);

  if (!isOpen || !escritorioId) return null;

  const selecionarCliente = (c) => {
    setClienteId(c?.id ?? null);
    setClienteNome(c?.nome ?? "");
    setBuscaCliente(c?.nome ?? "");
    setFocoBusca(false);
  };

  const limparCliente = () => {
    setClienteId(null);
    setClienteNome("");
    setBuscaCliente("");
    buscaRef.current?.focus();
  };

  const alternarDiaSemana = (dia) => {
    setDiasSemanaSelecionados((prev) =>
      prev.includes(dia)
        ? prev.filter((d) => d !== dia)
        : [...prev, dia].sort(),
    );
  };

  const onGatilhoRecorrencia = () => {
    if (!repetirCompromisso) {
      setRepetirCompromisso(true);
      setPainelRecorrenciaAberto(true);
      return;
    }
    setPainelRecorrenciaAberto((v) => !v);
  };

  const desativarRecorrencia = () => {
    setRepetirCompromisso(false);
    setPainelRecorrenciaAberto(false);
  };

  const salvar = async () => {
    setErro(null);
    if (!titulo.trim()) {
      setErro("Informe o título.");
      return;
    }
    if (!data) {
      setErro("Informe a data.");
      return;
    }
    const isoDataHora = combinarDataHora(data, hora);
    if (!isoDataHora) {
      setErro("Data ou horário inválidos.");
      return;
    }
    const tipoFinal =
      tipo === "Outro" && tipoCustom.trim() ? normalizarTipo(tipoCustom) : tipo;
    if (tipo === "Outro" && !tipoCustom.trim()) {
      setErro("Informe o tipo do compromisso.");
      return;
    }
    const payload = {
      titulo: titulo.trim(),
      tipo: tipoFinal,
      data_hora: isoDataHora,
      descricao: descricao.trim() || null,
      cliente_id: clienteId,
      status,
      escritorio_id: escritorioId,
    };
    if (repetirCompromisso && !modoEdicao) {
      if (!dataFinalRecorrencia) {
        setErro("Informe a data final da recorrência.");
        return;
      }
      if (dataFinalRecorrencia < data) {
        setErro("A data final deve ser igual ou posterior à data inicial.");
        return;
      }
      if (dataFinalRecorrencia > maxDataRecorrencia) {
        setErro(
          `A data final excede o limite permitido (${maxDataRecorrencia}).`,
        );
        return;
      }
      if (
        frequenciaRecorrencia === "Semanal" &&
        diasSemanaSelecionados.length === 0
      ) {
        setErro(
          "Selecione ao menos um dia da semana para recorrência semanal.",
        );
        return;
      }
    }
    setSalvando(true);
    try {
      if (modoEdicao) {
        if (
          compromissoEdicao?.grupo_recorrencia_id &&
          escopoRecorrencia === "futuros"
        ) {
          await api.updateCompromissosFuturos(
            compromissoEdicao.grupo_recorrencia_id,
            compromissoEdicao.data_hora,
            payload,
            escritorioId,
          );
        } else {
          await api.updateCompromisso(
            compromissoEdicao.id,
            payload,
            escritorioId,
          );
        }
      } else {
        if (repetirCompromisso) {
          const grupoRecorrenciaId = gerarUuid();
          const ocorrencias = gerarOcorrenciasRecorrentes(
            isoDataHora,
            frequenciaRecorrencia,
            diasSemanaSelecionados,
            dataFinalRecorrencia,
          );
          if (!ocorrencias.length) {
            setErro(
              "Não foi possível gerar ocorrências para os critérios informados.",
            );
            setSalvando(false);
            return;
          }
          const lote = ocorrencias.map((dataHoraIso) => ({
            ...payload,
            data_hora: dataHoraIso,
            grupo_recorrencia_id: grupoRecorrenciaId,
          }));
          await api.createCompromissosLote(lote);
        } else {
          await api.createCompromisso(payload);
        }
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error("[ModalCompromisso] salvar:", e);
      setErro(e?.message || "Não foi possível salvar o compromisso.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalPortal>
      <div className={modalOverlayClass} role="dialog" aria-modal="true">
        <div className={modalPanelClass}>
          <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/10 blur-[70px]" />

          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
            <h2 className="text-xl font-bold tracking-tight text-esc-text">
              {modoEdicao ? "Editar Compromisso" : "Novo Compromisso"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-esc-muted transition-all duration-300 hover:bg-white/10 hover:text-esc-text"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                Título
              </label>
              <input
                type="text"
                className={fieldClass}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Reunião de alinhamento"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Tipo
                </label>
                <select
                  className={selectClass}
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value);
                    if (e.target.value !== "Outro") setTipoCustom("");
                  }}
                >
                  {TIPOS_PADRAO.map((t) => (
                    <option
                      key={t}
                      value={t}
                      className="bg-esc-bg text-esc-text"
                    >
                      {t}
                    </option>
                  ))}
                </select>
                {tipo === "Outro" ? (
                  <input
                    type="text"
                    className={fieldClass}
                    value={tipoCustom}
                    onChange={(e) => setTipoCustom(e.target.value)}
                    placeholder="Especifique o tipo (ex.: Inspeção)"
                    maxLength={40}
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Status
                </label>
                <select
                  className={selectClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUS.map((s) => (
                    <option
                      key={s}
                      value={s}
                      className="bg-esc-bg text-esc-text"
                    >
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Data
                </label>
                <div className="relative">
                  <input
                    ref={dataInputRef}
                    type="date"
                    className={`${fieldClass} pr-10 ${nativePickerHidden}`}
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                  <div
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center py-2 pl-2"
                    onClick={() => void dataInputRef.current?.showPicker?.()}
                    role="presentation"
                  >
                    <Calendar
                      className="pointer-events-none h-4 w-4 text-[var(--esc-destaque)] opacity-90"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Horário
                </label>
                <div className="relative">
                  <input
                    ref={horaInputRef}
                    type="time"
                    className={`${fieldClass} pr-10 ${nativePickerHidden}`}
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                  <div
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center py-2 pl-2"
                    onClick={() => void horaInputRef.current?.showPicker?.()}
                    role="presentation"
                  >
                    <Clock
                      className="pointer-events-none h-4 w-4 text-[var(--esc-destaque)] opacity-90"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>

            {!modoEdicao ? (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={onGatilhoRecorrencia}
                  aria-expanded={Boolean(
                    repetirCompromisso && painelRecorrenciaAberto,
                  )}
                  className="group inline-flex max-w-full items-center gap-1.5 rounded-md px-0 py-0.5 text-left transition-colors duration-300 hover:bg-transparent"
                >
                  <Repeat
                    className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-colors duration-300 group-hover:text-[var(--esc-destaque)]"
                    aria-hidden
                  />
                  <span className="text-xs text-gray-400 transition-colors duration-300 group-hover:text-[var(--esc-destaque)]">
                    {repetirCompromisso
                      ? `Repete ${rotuloFrequenciaResumo(frequenciaRecorrencia)}`
                      : "Não se repete"}
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    repetirCompromisso && painelRecorrenciaAberto
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 transition-all duration-300">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex min-w-0 flex-col gap-1">
                          <label className="text-xs font-medium text-esc-muted">
                            Frequência
                          </label>
                          <select
                            className={selectRecCompact}
                            value={frequenciaRecorrencia}
                            onChange={(e) =>
                              setFrequenciaRecorrencia(e.target.value)
                            }
                          >
                            {RECORRENCIAS.map((freq) => (
                              <option
                                key={freq}
                                value={freq}
                                className="bg-esc-bg text-esc-text"
                              >
                                {freq}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <label className="text-xs font-medium text-esc-muted">
                            Data final
                          </label>
                          <div className="relative">
                            <input
                              ref={dataFinalInputRef}
                              type="date"
                              className={`${fieldRecCompact} pr-7 ${nativePickerHidden}`}
                              value={dataFinalRecorrencia}
                              min={data || undefined}
                              max={maxDataRecorrencia}
                              onChange={(e) =>
                                setDataFinalRecorrencia(e.target.value)
                              }
                            />
                            <div
                              className="absolute right-1.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center py-1 pl-1"
                              onClick={() =>
                                void dataFinalInputRef.current?.showPicker?.()
                              }
                              role="presentation"
                            >
                              <Calendar
                                className="pointer-events-none h-3.5 w-3.5 text-[var(--esc-destaque)]/90"
                                aria-hidden
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {frequenciaRecorrencia === "Semanal" ? (
                        <div className="mt-2 flex flex-col gap-1">
                          <span className="text-xs font-medium text-esc-muted">
                            Dias
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {DIAS_SEMANA.map((dia, idx) => {
                              const ativo = diasSemanaSelecionados.includes(
                                dia.value,
                              );
                              return (
                                <button
                                  key={`${dia.label}-${idx}`}
                                  type="button"
                                  onClick={() => alternarDiaSemana(dia.value)}
                                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-colors duration-200 ${
                                    ativo
                                      ? "bg-[var(--esc-destaque)]/20 text-[var(--esc-destaque)]"
                                      : "border border-white/10 bg-white/[0.04] text-esc-muted hover:border-white/15 hover:text-esc-text"
                                  }`}
                                >
                                  {dia.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={desativarRecorrencia}
                        className="mt-2 text-[11px] text-gray-500 underline-offset-2 transition-colors hover:text-[var(--esc-destaque)] hover:underline"
                      >
                        Não repetir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="relative flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                Cliente
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-esc-muted" />
                <input
                  ref={buscaRef}
                  type="text"
                  className={`${fieldClass} pl-10 pr-10`}
                  value={buscaCliente}
                  onFocus={() => setFocoBusca(true)}
                  onBlur={() => setTimeout(() => setFocoBusca(false), 150)}
                  onChange={(e) => {
                    setBuscaCliente(e.target.value);
                    setFocoBusca(true);
                    if (clienteId) setClienteId(null);
                  }}
                  placeholder={
                    carregandoClientes
                      ? "Carregando clientes…"
                      : "Pesquisar cliente (opcional)"
                  }
                />
                {clienteNome ? (
                  <button
                    type="button"
                    onClick={limparCliente}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-esc-muted transition-all hover:bg-white/10 hover:text-esc-text"
                    aria-label="Limpar cliente"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              {focoBusca && clientesFiltrados.length > 0 ? (
                <ul className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-esc-card/95 p-1 shadow-lg backdrop-blur-md">
                  {clientesFiltrados.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selecionarCliente(c)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-esc-text transition hover:bg-white/10"
                      >
                        <span className="truncate">{c.nome}</span>
                        {clienteId === c.id ? (
                          <Check className="h-3.5 w-3.5 text-esc-destaque" />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {focoBusca &&
              buscaCliente.trim() &&
              clientesFiltrados.length === 0 ? (
                <p className="mt-1 text-[11px] text-esc-muted">
                  Nenhum cliente encontrado.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                Descrição
              </label>
              <textarea
                className={`${fieldClass} min-h-[96px] resize-y`}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Observações sobre o compromisso"
              />
            </div>

            {erro ? (
              <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
                {erro}
              </p>
            ) : null}
          </div>

          <div className="flex gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-esc-muted transition-colors hover:bg-white/5 hover:text-esc-text disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={salvando || !titulo.trim() || !data}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 py-3 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all hover:bg-esc-destaque/30 disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {repetirCompromisso && !modoEdicao
                    ? "Gerando série..."
                    : "Salvando..."}
                </>
              ) : modoEdicao ? (
                "Salvar alterações"
              ) : (
                "Criar Compromisso"
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
