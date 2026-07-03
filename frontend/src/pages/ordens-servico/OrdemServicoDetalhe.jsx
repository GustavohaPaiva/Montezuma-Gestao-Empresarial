import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Loader2,
  Save,
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
  temaOrdemServico,
} from "./ordensServicoUtils";
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
  const [salvando, setSalvando] = useState(false);
  const [concluindo, setConcluindo] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const autorizado = podeAcessarModuloOrdemServico(user);
  const somenteLeitura = os?.status === OS_STATUS.concluida;
  const podeConcluir = podeConcluirOrdemServico(user, os);
  const podeExcluir = podeExcluirOrdemServico(user, os, variant);

  const setField = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const carregarAuxiliares = useCallback(async () => {
    setClientesCarregando(true);
    try {
      const [clientesData, usuariosData] = await Promise.all([
        api.listClientesOrdemServico(variant),
        api.listUsuariosDestinatariosOS({ variant, escritorioId }),
      ]);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setDestinatarios(
        filtrarDestinatariosPermitidos(user, usuariosData, variant),
      );
    } catch (e) {
      console.error("[OrdemServicoDetalhe] auxiliares:", e);
      setClientes([]);
      setDestinatarios([]);
    } finally {
      setClientesCarregando(false);
    }
  }, [variant, user, escritorioId]);

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
        setForm(osParaForm(row) || emptyOrdemServicoForm());
        setErro(null);
        await carregarAuxiliares();
      }
    } catch (e) {
      console.error(e);
      setErro(e?.message || "Erro ao carregar a ordem de serviço.");
      setOs(null);
    } finally {
      setLoading(false);
    }
  }, [id, autorizado, user, carregarAuxiliares, variant]);

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
    };
  }, [os, form, escritorioId, destinatarios]);

  const handleSalvar = async () => {
    if (!os?.id || somenteLeitura) return;
    setSalvando(true);
    try {
      const payload = formPayloadFromForm(form, {
        escritorioId: os.escritorio_id || escritorioId,
        criadorId: os.criador_id,
        destinatarios,
      });
      delete payload.escritorio_id;
      delete payload.criador_id;
      const atualizada = await api.updateOrdemServico(os.id, payload);
      setOs(atualizada);
      setForm(osParaForm(atualizada) || form);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível salvar a ordem de serviço.");
    } finally {
      setSalvando(false);
    }
  };

  const handleConcluir = async () => {
    if (!os?.id) return;
    setConcluindo(true);
    try {
      const atualizada = await api.concluirOrdemServico(os.id, user.id);
      setOs(atualizada);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível concluir a ordem de serviço.");
    } finally {
      setConcluindo(false);
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
            ? "py-8 text-center text-sm text-rose-300"
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
            onClick={() => navigate(basePath)}
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
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:justify-end">
              {!somenteLeitura ? (
                <BaseButton
                  variant="primary"
                  size="sm"
                  className="w-full !bg-esc-destaque !text-white sm:w-auto"
                  icon={
                    salvando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )
                  }
                  onClick={handleSalvar}
                  disabled={salvando}
                >
                  Salvar
                </BaseButton>
              ) : null}
              <BaseButton
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                icon={<Download className="h-4 w-4" />}
                onClick={() => setPdfPreview(true)}
              >
                PDF
              </BaseButton>
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
                      <p className="mt-2 text-sm text-emerald-300">
                        Concluída em {formatarDataListaOS(os.data_conclusao)}
                        {os.concluido_por?.nome
                          ? ` por ${os.concluido_por.nome}`
                          : ""}
                      </p>
                    ) : null}
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
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-esc-card shadow-[0_0_80px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl">
                <div className="border-b border-white/10 bg-white/[0.02] px-6 py-4">
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
              onClick={() => navigate(basePath)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-primary/50 bg-white shadow-sm transition hover:border-accent-primary/35"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted sm:text-sm">
                Ordens de Serviço
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
            {!somenteLeitura ? (
              <BaseButton
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
                icon={
                  salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )
                }
                onClick={handleSalvar}
                disabled={salvando}
              >
                Salvar
              </BaseButton>
            ) : null}
            <BaseButton
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              icon={<Download className="h-4 w-4" />}
              onClick={() => setPdfPreview(true)}
            >
              PDF
            </BaseButton>
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
