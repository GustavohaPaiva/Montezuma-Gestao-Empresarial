import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import BaseModal from "../gerais/BaseModal";
import BaseButton from "../gerais/BaseButton";
import BaseInput from "../gerais/BaseInput";
import BaseSelect from "../gerais/BaseSelect";
import ModalPortal from "../gerais/ModalPortal";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { filtrarDestinatariosPermitidos } from "../../utils/ordemServicoPermissions";
import {
  aplicarDadosClienteNaForm,
  formPayloadMinimoModal,
  resolveEscritorioIdOrdemServico,
} from "../../pages/ordens-servico/ordensServicoUtils";
import {
  labelCampoClass,
  labelCampoVkClass,
} from "../../pages/ordens-servico/ordensServicoUi";

const hojeISO = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  cliente_id: "",
  cliente_nome: "",
  cliente_telefone: "",
  cliente_email: "",
  endereco_rua: "",
  endereco_numero: "",
  endereco_bairro: "",
  responsavel_id: "",
  data_emissao: hojeISO(),
};

export default function ModalNovaOrdemServico({
  isOpen,
  onClose,
  onSaved,
  variant = "montezuma",
}) {
  const { user } = useAuth();
  const isVk = variant === "vogelkop";
  const escritorioId = resolveEscritorioIdOrdemServico(
    variant,
    user?.escritorio_id,
  );

  const [form, setForm] = useState(EMPTY);
  const [clientes, setClientes] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const setField = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const carregarDados = useCallback(async () => {
    if (!isOpen || !escritorioId) return;
    setCarregando(true);
    try {
      const [clientesResult, usuariosResult] = await Promise.allSettled([
        api.listClientesOrdemServico(variant),
        api.listUsuariosDestinatariosOS({ variant, escritorioId }),
      ]);

      if (clientesResult.status === "fulfilled") {
        setClientes(
          Array.isArray(clientesResult.value) ? clientesResult.value : [],
        );
      } else {
        console.error("[ModalNovaOrdemServico] clientes:", clientesResult.reason);
        setClientes([]);
      }

      if (usuariosResult.status === "fulfilled") {
        setDestinatarios(
          filtrarDestinatariosPermitidos(user, usuariosResult.value, variant),
        );
      } else {
        console.error(
          "[ModalNovaOrdemServico] destinatários:",
          usuariosResult.reason,
        );
        setDestinatarios([]);
      }
    } finally {
      setCarregando(false);
    }
  }, [isOpen, escritorioId, user, variant]);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...EMPTY, data_emissao: hojeISO() });
    carregarDados();
  }, [isOpen, carregarDados]);

  const opcoesDestinatarios = useMemo(
    () => [
      { value: "", label: "Nenhum" },
      ...destinatarios.map((u) => ({
        value: String(u.id),
        label: u.nome || "Usuário",
      })),
    ],
    [destinatarios],
  );

  const opcoesClientes = useMemo(
    () =>
      clientes
        .filter((c) => c?.id)
        .map((c) => ({
          value: String(c.id),
          label: c.nome || "Sem nome",
        })),
    [clientes],
  );

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

  const submit = async () => {
    setSalvando(true);
    try {
      const payload = formPayloadMinimoModal(form, {
        escritorioId,
        criadorId: user.id,
        destinatarios,
      });
      await api.createOrdemServico(payload);
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível criar a ordem de serviço.");
    } finally {
      setSalvando(false);
    }
  };

  const labelClass = isVk ? labelCampoVkClass : labelCampoClass;

  const formBody = (
    <div className="flex flex-col gap-4">
      {carregando ? (
        <p
          className={
            isVk ? "text-sm text-esc-muted" : "text-sm text-text-muted"
          }
        >
          Carregando opções…
        </p>
      ) : null}
      <div>
        <label className={labelClass}>Cliente</label>
        <BaseSelect
          searchable
          placeholder="Selecione o cliente"
          value={form.cliente_id}
          onChange={(e) => aplicarCliente(e.target.value)}
          options={opcoesClientes}
          variant={isVk ? "escritorio" : "default"}
          loading={carregando}
          disabled={carregando}
          emptyMessage="Nenhum cliente cadastrado"
        />
      </div>
      <div>
        <label className={labelClass}>Responsável Técnico</label>
        <BaseSelect
          searchable
          value={form.responsavel_id}
          onChange={(e) => setField("responsavel_id", e.target.value)}
          options={opcoesDestinatarios}
          variant={isVk ? "escritorio" : "default"}
        />
      </div>
      <div>
        <label className={labelClass}>Data de emissão</label>
        <BaseInput
          type="date"
          value={form.data_emissao}
          onChange={(e) => setField("data_emissao", e.target.value)}
          variant={isVk ? "escritorio" : "default"}
        />
      </div>
      <div className="flex flex-row w-full gap-2 pt-2">
        <BaseButton
          type="button"
          variant="outline"
          onClick={onClose}
          className="w-full"
          disabled={salvando}
        >
          Cancelar
        </BaseButton>
        <BaseButton
          type="button"
          onClick={submit}
          className={isVk ? "w-full !bg-esc-destaque !text-white" : "w-full"}
          disabled={salvando || carregando}
        >
          {salvando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Criar OS
        </BaseButton>
      </div>
    </div>
  );

  if (isVk) {
    if (!isOpen) return null;
    const overlayClass =
      "theme-vogelkop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md sm:p-6";
    const panelClass =
      "animate-premium-reveal relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/20 bg-esc-card shadow-[0_0_80px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl";
    return (
      <ModalPortal>
        <div className={overlayClass}>
          <div className={panelClass}>
            <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]" />
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
              <h2 className="text-lg font-bold tracking-tight text-esc-text">
                Nova Ordem de Serviço
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-esc-muted transition hover:text-esc-text"
                aria-label="Fechar"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto p-6">{formBody}</div>
          </div>
        </div>
      </ModalPortal>
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Ordem de Serviço"
      size="lg"
      contentPaddingClass="p-6 sm:p-8"
    >
      {formBody}
    </BaseModal>
  );
}

