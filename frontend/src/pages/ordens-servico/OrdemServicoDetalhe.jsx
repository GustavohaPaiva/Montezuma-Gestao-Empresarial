import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Loader2,
  PenLine,
  Trash2,
} from "lucide-react";
import BaseButton from "../../components/gerais/BaseButton";
import BaseModal from "../../components/gerais/BaseModal";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import ModalPortal from "../../components/gerais/ModalPortal";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import OrdemServicoFormCorpo from "../../components/ordens-servico/OrdemServicoFormCorpo";
import StatusOrdemServicoBadge from "../../components/ordens-servico/StatusOrdemServicoBadge";
import { useAuth } from "../../contexts/AuthContext";
import { ESCRITORIO_NOME_POR_ID } from "../../constants/escritorios";
import { api } from "../../services/api";
import { emptyOrdemServicoForm, OS_STATUS } from "../../constants/ordemServico";
import {
  filtrarDestinatariosPermitidos,
  podeAcessarModuloOrdemServico,
  podeAssinarEmissorOrdemServico,
  podeAssinarResponsavelOrdemServico,
  podeConcluirOrdemServico,
  podeExcluirOrdemServico,
  usuarioVeOrdemServico,
} from "../../utils/ordemServicoPermissions";
import { gerarPdfOrdemServico } from "../../utils/ordemServicoPdf";
import {
  aplicarDadosClienteNaForm,
  formPayloadFromForm,
  formatarDataListaOS,
  getOrdensServicoBasePath,
  osParaForm,
  resolveEscritorioIdOrdemServico,
  snapshotFormOrdemServico,
  temaOrdemServico,
} from "./ordensServicoUtils";

const AUTO_SAVE_MS = 900;
import {
  osDetalheHeaderClass,
  osDetalheHeaderVkClass,
  osDetalheIconClass,
  osDetalheIconVkClass,
  osSecaoClass,
  osSecaoVkClass,
} from "./ordensServicoUi";

export default function OrdemServicoDetalhe({ variant = "montezuma" }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVk = variant === "vogelkop";
  const escritorioId = resolveEscritorioIdOrdemServico(
    variant,
    user?.escritorio_id,
  );
  const basePath = getOrdensServicoBasePath(variant);
  const tema = temaOrdemServico(variant);

  const [os, setOs] = useState(null);
  const [form, setForm] = useState(emptyOrdemServicoForm);
  const [clientes, setClientes] = useState([]);
  const [clientesCarregando, setClientesCarregando] = useState(false);
  const [destinatarios, setDestinatarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [statusSalvamento, setStatusSalvamento] = useState("idle");
  const snapshotInicial = useRef("");
  const saveTimerRef = useRef(null);
  const salvandoRef = useRef(false);
  const formRef = useRef(form);
  const osRef = useRef(os);
  const destinatariosRef = useRef(destinatarios);
  const [concluindo, setConcluindo] = useState(false);
  const [assinandoEmissor, setAssinandoEmissor] = useState(false);
  const [assinandoResponsavel, setAssinandoResponsavel] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const autorizado = podeAcessarModuloOrdemServico(user);
  const somenteLeitura = os?.status === OS_STATUS.concluida;
  const podeConcluir = podeConcluirOrdemServico(user, os);
  const podeExcluir = podeExcluirOrdemServico(user, os, variant);
  const podeAssinarEmissor = podeAssinarEmissorOrdemServico(user, os);
  const podeAssinarResponsavel = podeAssinarResponsavelOrdemServico(user, os);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    osRef.current = os;
  }, [os]);

  useEffect(() => {
    destinatariosRef.current = destinatarios;
  }, [destinatarios]);

  const snapshotOpts = useMemo(
    () => ({
      escritorioId: os?.escritorio_id || escritorioId,
      criadorId: os?.criador_id,
      destinatarios,
    }),
    [os?.escritorio_id, os?.criador_id, escritorioId, destinatarios],
  );

  const dirty = useMemo(
    () =>
      snapshotFormOrdemServico(form, snapshotOpts) !== snapshotInicial.current,
    [form, snapshotOpts],
  );

  const setField = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const carregarAuxiliares = useCallback(
    async (incluirClienteId) => {
      setClientesCarregando(true);
      try {
        const [clientesData, usuariosData] = await Promise.all([
          api.listClientesOrdemServico(variant, { incluirClienteId }),
          api.listUsuariosDestinatariosOS({ variant, escritorioId }),
        ]);
        const clientesLista = Array.isArray(clientesData) ? clientesData : [];
        const destinatariosLista = filtrarDestinatariosPermitidos(
          user,
          usuariosData,
          variant,
        );
        setClientes(clientesLista);
        setDestinatarios(destinatariosLista);
        return { clientes: clientesLista, destinatarios: destinatariosLista };
      } catch (e) {
        console.error("[OrdemServicoDetalhe] auxiliares:", e);
        setClientes([]);
        setDestinatarios([]);
        return { clientes: [], destinatarios: [] };
      } finally {
        setClientesCarregando(false);
      }
    },
    [variant, user, escritorioId],
  );

  const carregar = useCallback(async () => {
    if (!id || !autorizado) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = await api.getOrdemServicoById(id);
      if (!row || !usuarioVeOrdemServico(user, row, variant)) {
        setErro("Ordem de serviço não encontrada ou acesso negado.");
        setOs(null);
      } else {
        setOs(row);
        const formCarregado = osParaForm(row) || emptyOrdemServicoForm();
        setForm(formCarregado);
        setErro(null);
        const { destinatarios: destinatariosCarregados } =
          await carregarAuxiliares(row.cliente_id);
        snapshotInicial.current = snapshotFormOrdemServico(formCarregado, {
          escritorioId: row.escritorio_id || escritorioId,
          criadorId: row.criador_id,
          destinatarios: destinatariosCarregados,
        });
        setStatusSalvamento("idle");
      }
    } catch (e) {
      console.error(e);
      setErro(e?.message || "Erro ao carregar a ordem de serviço.");
      setOs(null);
    } finally {
      setLoading(false);
    }
  }, [id, autorizado, user, carregarAuxiliares, variant, escritorioId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!autorizado && user) {
      navigate(isVk ? "/escritorio/vogelkop" : "/", { replace: true });
    }
  }, [autorizado, user, navigate, isVk]);

  const aplicarCliente = (clienteId) => {
    if (!clienteId) {
      setForm((prev) => ({
        ...prev,
        cliente_id: "",
        cliente_nome: "",
      }));
      return;
    }
    const cliente = clientes.find((c) => String(c.id) === String(clienteId));
    setForm((prev) => aplicarDadosClienteNaForm(cliente, prev));
  };

  const osParaPdf = useMemo(() => {
    if (!os) return null;
    return {
      ...os,
      ...formPayloadFromForm(form, {
        escritorioId: os.escritorio_id || escritorioId,
        criadorId: os.criador_id,
        destinatarios,
      }),
      numero: os.numero,
      assinatura_emissor_em: os.assinatura_emissor_em,
      assinatura_responsavel_em: os.assinatura_responsavel_em,
      criador: os.criador,
      responsavel: os.responsavel,
    };
  }, [os, form, escritorioId, destinatarios]);

  const salvarForm = useCallback(
    async (formParaSalvar) => {
      const osAtual = osRef.current;
      if (!osAtual?.id || osAtual.status === OS_STATUS.concluida) return true;

      const opts = {
        escritorioId: osAtual.escritorio_id || escritorioId,
        criadorId: osAtual.criador_id,
        destinatarios: destinatariosRef.current,
      };
      const snapshotAtual = snapshotFormOrdemServico(formParaSalvar, opts);
      if (
        snapshotAtual === snapshotInicial.current ||
        salvandoRef.current
      ) {
        return true;
      }

      salvandoRef.current = true;
      setStatusSalvamento("saving");
      try {
        const payload = formPayloadFromForm(formParaSalvar, opts);
        delete payload.escritorio_id;
        delete payload.criador_id;
        const atualizada = await api.updateOrdemServico(osAtual.id, payload);
        setOs(atualizada);
        const formAtualizada = osParaForm(atualizada) || formParaSalvar;
        setForm(formAtualizada);
        snapshotInicial.current = snapshotFormOrdemServico(formAtualizada, {
          escritorioId: atualizada.escritorio_id || escritorioId,
          criadorId: atualizada.criador_id,
          destinatarios: destinatariosRef.current,
        });
        setStatusSalvamento("saved");
        return true;
      } catch (e) {
        console.error(e);
        setStatusSalvamento("error");
        return false;
      } finally {
        salvandoRef.current = false;
      }
    },
    [escritorioId],
  );

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    return salvarForm(formRef.current);
  }, [salvarForm]);

  useEffect(() => {
    if (loading || somenteLeitura || !os?.id || !dirty) return undefined;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      salvarForm(formRef.current);
    }, AUTO_SAVE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [form, loading, somenteLeitura, os?.id, dirty, salvarForm]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const handleConcluir = async () => {
    if (!os?.id) return;
    setConcluindo(true);
    try {
      await flushSave();
      const responsavelId =
        formRef.current.responsavel_id || os.responsavel_id || null;
      const atualizada = await api.concluirOrdemServico(
        os.id,
        user.id,
        responsavelId,
      );
      setOs(atualizada);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível concluir a ordem de serviço.");
    } finally {
      setConcluindo(false);
    }
  };

  const handleAssinarEmissor = async () => {
    if (!os?.id) return;
    setAssinandoEmissor(true);
    try {
      const atualizada = await api.assinarOrdemServicoEmissor(os.id, user.id);
      setOs(atualizada);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível registrar a assinatura.");
    } finally {
      setAssinandoEmissor(false);
    }
  };

  const handleAssinarResponsavel = async () => {
    if (!os?.id) return;
    setAssinandoResponsavel(true);
    try {
      const atualizada = await api.assinarOrdemServicoResponsavel(
        os.id,
        user.id,
      );
      setOs(atualizada);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível registrar a assinatura.");
    } finally {
      setAssinandoResponsavel(false);
    }
  };

  const handleExcluir = async () => {
    if (!os?.id) return;
    setExcluindo(true);
    try {
      await api.deleteOrdemServico(os.id);
      navigate(basePath);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível excluir a ordem de serviço.");
    } finally {
      setExcluindo(false);
      setModalExcluir(false);
    }
  };

  if (!autorizado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        A redirecionar…
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingPainel
        variant={isVk ? "escritorio" : "default"}
        titulo="Carregando ordem de serviço"
        descricao="Aguarde um momento."
        icon={<ClipboardList className="h-7 w-7" strokeWidth={2} />}
      />
    );
  }

  if (erro || !os) {
    return (
      <div
        className={
          isVk
            ? "py-8 text-center text-sm text-rose-600"
            : "flex min-h-[40vh] flex-col items-center justify-center px-[5%] text-sm text-danger-primary"
        }
      >
        <p>{erro || "Ordem não encontrada."}</p>
        <BaseButton
          variant="outline"
          className="mt-4"
          onClick={() => navigate(basePath)}
        >
          Voltar à lista
        </BaseButton>
      </div>
    );
  }

  const headerBg = "bg-[#FAFAFA]/95";
  const headerBorder = "border-border-primary/40";

  const textoStatusSalvamento =
    !somenteLeitura && statusSalvamento === "saving"
      ? "Salvando alterações…"
      : !somenteLeitura && statusSalvamento === "error"
        ? "Erro ao salvar — verifique a conexão"
        : !somenteLeitura && statusSalvamento === "saved" && !dirty
          ? "Alterações salvas"
          : null;

  const voltarComSalvamento = async () => {
    await flushSave();
    navigate(basePath);
  };

  const abrirPdfPreview = async () => {
    await flushSave();
    setPdfPreview(true);
  };

  const statusAssinaturas = (
    <div className="mt-2 flex flex-wrap gap-2">
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          os.assinatura_emissor_em
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-800"
        }`}
      >
        Emissor: {os.assinatura_emissor_em ? "Assinado" : "Pendente"}
      </span>
      {os.responsavel_id ? (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            os.assinatura_responsavel_em
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          Responsável:{" "}
          {os.assinatura_responsavel_em ? "Assinado" : "Pendente"}
        </span>
      ) : null}
    </div>
  );

  const botoesAssinatura = (
    <>
      {podeAssinarEmissor ? (
        <BaseButton
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          icon={
            assinandoEmissor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PenLine className="h-4 w-4" />
            )
          }
          onClick={handleAssinarEmissor}
          disabled={assinandoEmissor}
        >
          Assinar emissor
        </BaseButton>
      ) : null}
      {podeAssinarResponsavel ? (
        <BaseButton
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          icon={
            assinandoResponsavel ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PenLine className="h-4 w-4" />
            )
          }
          onClick={handleAssinarResponsavel}
          disabled={assinandoResponsavel}
        >
          Assinar responsável
        </BaseButton>
      ) : null}
    </>
  );

  if (isVk) {
    const nomeEscritorio = ESCRITORIO_NOME_POR_ID[escritorioId] ?? "Escritório";

    return (
      <div className="relative w-full max-w-full overflow-x-hidden pb-6">
        <div
          className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[min(400px,70vh)] w-[min(800px,100vw)] max-w-full -translate-x-1/2 bg-esc-destaque opacity-10 blur-[150px]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full">
          <button
            type="button"
            onClick={voltarComSalvamento}
            className="mb-6 mt-4 flex cursor-pointer items-center gap-2 text-esc-muted transition-colors hover:text-esc-destaque"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1 text-lg font-bold tracking-tight text-esc-text sm:text-2xl">
                <span>OS Nº {os.numero}</span>
                {os.cliente_nome ? (
                  <span className="text-esc-destaque">{os.cliente_nome}</span>
                ) : null}
              </h1>
              <p className="mt-1 text-sm text-esc-muted">
                Ordens de Serviço — {nomeEscritorio}
                {textoStatusSalvamento ? ` · ${textoStatusSalvamento}` : ""}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:justify-end">
              <BaseButton
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                icon={<Download className="h-4 w-4" />}
                onClick={abrirPdfPreview}
              >
                PDF
              </BaseButton>
              {botoesAssinatura}
              {podeConcluir && !somenteLeitura ? (
                <BaseButton
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  icon={
                    concluindo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )
                  }
                  onClick={handleConcluir}
                  disabled={concluindo}
                >
                  Concluir
                </BaseButton>
              ) : null}
              {podeExcluir ? (
                <BaseButton
                  variant="danger"
                  size="sm"
                  className="w-full sm:w-auto"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setModalExcluir(true)}
                >
                  Excluir
                </BaseButton>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-col gap-6">
            <article className={osSecaoVkClass}>
              <div className={osDetalheHeaderVkClass}>
                <div className="flex items-start gap-3">
                  <span className={osDetalheIconVkClass}>
                    <ClipboardList className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-esc-text sm:text-xl">
                      {os.cliente_nome || "Cliente não informado"}
                    </h2>
                    <div className="mt-1 space-y-0.5 text-sm text-esc-muted">
                      <p>Emissão: {formatarDataListaOS(os.data_emissao)}</p>
                      {os.responsavel?.nome || os.responsavel_tecnico ? (
                        <p className="break-words">
                          Responsável Técnico:{" "}
                          {os.responsavel?.nome || os.responsavel_tecnico}
                        </p>
                      ) : null}
                    </div>
                    {somenteLeitura && os.data_conclusao ? (
                      <p className="mt-2 text-sm text-emerald-700">
                        Concluída em {formatarDataListaOS(os.data_conclusao)}
                        {os.concluido_por?.nome
                          ? ` por ${os.concluido_por.nome}`
                          : ""}
                      </p>
                    ) : null}
                    {statusAssinaturas}
                  </div>
                </div>
              </div>
            </article>

            <OrdemServicoFormCorpo
              form={form}
              setField={setField}
              variant={variant}
              clientes={clientes}
              destinatarios={destinatarios}
              onAplicarCliente={aplicarCliente}
              somenteLeitura={somenteLeitura}
              clientesCarregando={clientesCarregando}
              numeroOs={os.numero}
            />
          </div>
        </div>

        {modalExcluir ? (
          <ModalPortal>
            <div className="theme-vogelkop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-esc-border bg-esc-card shadow-[0_0_80px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl">
                <div className="border-b border-esc-border bg-esc-bg px-6 py-4">
                  <h2 className="text-lg font-bold text-esc-text">
                    Excluir ordem de serviço
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-sm text-esc-muted">
                    Excluir permanentemente a{" "}
                    <strong className="text-esc-text">OS Nº {os.numero}</strong>
                    {os.cliente_nome ? ` (${os.cliente_nome})` : ""}?
                  </p>
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <BaseButton
                      variant="outline"
                      onClick={() => setModalExcluir(false)}
                      disabled={excluindo}
                    >
                      Cancelar
                    </BaseButton>
                    <BaseButton
                      variant="danger"
                      onClick={handleExcluir}
                      isLoading={excluindo}
                    >
                      Excluir
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </ModalPortal>
        ) : null}

        <PdfPreviewModal
          isOpen={pdfPreview}
          onClose={() => setPdfPreview(false)}
          titulo={`Ordem de Serviço Nº ${os.numero}`}
          gerador={async () =>
            gerarPdfOrdemServico({
              os: osParaPdf,
              escritorioId: os.escritorio_id || escritorioId,
              retornarBlob: true,
            })
          }
          nomeFallback="Ordem_Servico.pdf"
          temaClasse={tema}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-[#FAFAFA] overflow-x-hidden">
      <header
        className={`sticky top-0 z-[60] shrink-0 border-b ${headerBorder} ${headerBg} shadow-sm backdrop-blur-sm`}
      >
        <div className="flex w-full flex-col gap-3 px-[5%] py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 w-full gap-3">
            <button
              type="button"
              onClick={voltarComSalvamento}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-primary/50 bg-white shadow-sm transition hover:border-accent-primary/35"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted sm:text-sm">
                Ordens de Serviço
                {textoStatusSalvamento ? ` · ${textoStatusSalvamento}` : ""}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="break-words text-base font-bold text-text-primary sm:text-md">
                  OS Nº {os.numero}
                  {os.cliente_nome ? ` · ${os.cliente_nome}` : ""}
                </h1>
              </div>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:justify-end">
            <BaseButton
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              icon={<Download className="h-4 w-4" />}
              onClick={abrirPdfPreview}
            >
              PDF
            </BaseButton>
            {botoesAssinatura}
            {podeConcluir && !somenteLeitura ? (
              <BaseButton
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                icon={
                  concluindo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )
                }
                onClick={handleConcluir}
                disabled={concluindo}
              >
                Concluir
              </BaseButton>
            ) : null}
            {podeExcluir ? (
              <BaseButton
                variant="danger"
                size="sm"
                className="w-full sm:w-auto"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => setModalExcluir(true)}
              >
                Excluir
              </BaseButton>
            ) : null}
          </div>
        </div>
      </header>

      <main className="w-full flex-1 px-[5%] py-6">
        <div className="flex w-full flex-col gap-6">
          <article className={osSecaoClass}>
            <div className={osDetalheHeaderClass}>
              <div className="flex items-start gap-3">
                <span className={osDetalheIconClass}>
                  <ClipboardList className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-text-primary sm:text-xl">
                    {os.cliente_nome || "Cliente não informado"}
                  </h2>
                  <div className="mt-1 space-y-0.5 text-sm text-text-muted">
                    <p>Emissão: {formatarDataListaOS(os.data_emissao)}</p>
                    {os.responsavel?.nome || os.responsavel_tecnico ? (
                      <p className="break-words">
                        Responsável Técnico:{" "}
                        {os.responsavel?.nome || os.responsavel_tecnico}
                      </p>
                    ) : null}
                  </div>
                  {somenteLeitura && os.data_conclusao ? (
                    <p className="mt-2 text-sm text-emerald-600">
                      Concluída em {formatarDataListaOS(os.data_conclusao)}
                      {os.concluido_por?.nome
                        ? ` por ${os.concluido_por.nome}`
                        : ""}
                    </p>
                  ) : null}
                  {statusAssinaturas}
                </div>
              </div>
            </div>
          </article>

          <OrdemServicoFormCorpo
            form={form}
            setField={setField}
            variant={variant}
            clientes={clientes}
            destinatarios={destinatarios}
            onAplicarCliente={aplicarCliente}
            somenteLeitura={somenteLeitura}
            clientesCarregando={clientesCarregando}
            numeroOs={os.numero}
          />
        </div>
      </main>

      <BaseModal
        isOpen={modalExcluir}
        onClose={() => !excluindo && setModalExcluir(false)}
        title="Excluir ordem de serviço"
        size="sm"
      >
        <p className="text-sm text-text-muted">
          Excluir permanentemente a{" "}
          <strong className="text-text-primary">OS Nº {os.numero}</strong>
          {os.cliente_nome ? ` (${os.cliente_nome})` : ""}?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            variant="outline"
            onClick={() => setModalExcluir(false)}
            disabled={excluindo}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={handleExcluir}
            isLoading={excluindo}
          >
            Excluir
          </BaseButton>
        </div>
      </BaseModal>

      <PdfPreviewModal
        isOpen={pdfPreview}
        onClose={() => setPdfPreview(false)}
        titulo={`Ordem de Serviço Nº ${os.numero}`}
        gerador={async () =>
          gerarPdfOrdemServico({
            os: osParaPdf,
            escritorioId: os.escritorio_id || escritorioId,
            retornarBlob: true,
          })
        }
        nomeFallback="Ordem_Servico.pdf"
        temaClasse={tema}
      />
    </div>
  );
}
