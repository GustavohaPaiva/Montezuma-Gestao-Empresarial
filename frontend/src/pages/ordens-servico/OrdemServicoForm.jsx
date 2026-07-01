import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileDown, Loader2, Save } from "lucide-react";
import Navbar from "../../components/navbar/Navbar";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import BaseButton from "../../components/gerais/BaseButton";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import {
  emptyOrdemServicoForm,
  OS_ESCOPO_OPCOES,
  OS_FORMAS_PAGAMENTO,
} from "../../constants/ordemServico";
import {
  filtrarDestinatariosPermitidos,
  podeEmitirOrdemServico,
} from "../../utils/ordemServicoPermissions";
import {
  formParaOrdemServicoPdf,
  gerarPdfOrdemServico,
} from "../../utils/ordemServicoPdf";
import {
  formPayloadFromForm,
  getOrdensServicoBasePath,
  resolveEscritorioIdOrdemServico,
  temaOrdemServico,
} from "./ordensServicoUtils";

function CampoForm({ label, children, isVk }) {
  return (
    <div>
      <label
        className={
          isVk
            ? "mb-1 block text-xs font-medium text-esc-muted"
            : "mb-1 block text-xs font-medium text-text-muted"
        }
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SecaoTitulo({ children, isVk }) {
  return (
    <h3
      className={
        isVk
          ? "mb-3 text-xs font-bold uppercase tracking-wider text-esc-destaque"
          : "mb-3 text-xs font-bold uppercase tracking-wider text-accent-primary"
      }
    >
      {children}
    </h3>
  );
}

function CheckboxGroup({ opcoes, valores, onChange, isVk }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {opcoes.map((op) => {
        const checked = valores.includes(op.id);
        return (
          <label
            key={op.id}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              isVk
                ? checked
                  ? "border-esc-destaque/40 bg-esc-destaque/10 text-esc-text"
                  : "border-white/10 bg-white/5 text-esc-muted"
                : checked
                  ? "border-accent-primary/40 bg-accent-soft text-text-primary"
                  : "border-border-primary/30 bg-white text-text-muted"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                if (checked) {
                  onChange(valores.filter((v) => v !== op.id));
                } else {
                  onChange([...valores, op.id]);
                }
              }}
              className="h-4 w-4"
            />
            {op.label}
          </label>
        );
      })}
    </div>
  );
}

export default function OrdemServicoForm({ variant = "montezuma" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVk = variant === "vogelkop";
  const escritorioId = resolveEscritorioIdOrdemServico(variant, user?.escritorio_id);
  const basePath = getOrdensServicoBasePath(variant);
  const tema = temaOrdemServico(variant);

  const [form, setForm] = useState(emptyOrdemServicoForm);
  const [clientes, setClientes] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [proximoNumero, setProximoNumero] = useState(null);

  const autorizado = podeEmitirOrdemServico(user);

  const setField = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const carregarDados = useCallback(async () => {
    if (!autorizado || !escritorioId) return;
    try {
      const [clientesData, usuariosData, numero] = await Promise.all([
        isVk
          ? api.getClientesSimplesEscritorio(escritorioId)
          : api.getClientes(escritorioId),
        api.listUsuariosDestinatariosOS(),
        api.proximoNumeroOS(escritorioId),
      ]);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      const filtrados = filtrarDestinatariosPermitidos(
        user,
        usuariosData,
        escritorioId,
      );
      setDestinatarios(filtrados);
      setProximoNumero(numero);
    } catch (e) {
      console.error(e);
      setErro(e?.message || "Erro ao carregar dados do formulário.");
    }
  }, [autorizado, escritorioId, isVk, user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (!autorizado && user) {
      navigate(basePath, { replace: true });
    }
  }, [autorizado, user, navigate, basePath]);

  const opcoesClientes = useMemo(
    () =>
      clientes.map((c) => ({
        value: String(c.id),
        label: c.nome || "Sem nome",
      })),
    [clientes],
  );

  const opcoesDestinatarios = useMemo(
    () => [
      { value: "", label: "Nenhum (somente PDF)" },
      ...destinatarios.map((u) => ({
        value: String(u.id),
        label: u.nome || "Usuário",
      })),
    ],
    [destinatarios],
  );

  const aplicarCliente = (clienteId) => {
    setField("cliente_id", clienteId);
    const cliente = clientes.find((c) => String(c.id) === String(clienteId));
    if (!cliente) return;
    setForm((prev) => ({
      ...prev,
      cliente_id: clienteId,
      cliente_nome: cliente.nome || prev.cliente_nome,
      cliente_telefone: cliente.telefone || prev.cliente_telefone,
      cliente_email: cliente.email || prev.cliente_email,
      endereco_projeto:
        cliente.endereco ||
        [cliente.rua, cliente.numero_casa, cliente.bairro, cliente.cidade]
          .filter(Boolean)
          .join(", ") ||
        prev.endereco_projeto,
    }));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      const payload = formPayloadFromForm(form, {
        escritorioId,
        criadorId: user.id,
      });
      const criada = await api.createOrdemServico(payload);
      navigate(`${basePath}/${criada.id}`, { replace: true });
    } catch (e) {
      console.error(e);
      setErro(e?.message || "Não foi possível salvar a ordem de serviço.");
    } finally {
      setSalvando(false);
    }
  };

  const handleGerarPdf = () => {
    setPdfPreview({
      titulo: `Ordem de Serviço Nº ${proximoNumero ?? "—"}`,
      nomeFallback: "Ordem_Servico.pdf",
      gerador: async () => {
        const osPdf = formParaOrdemServicoPdf(form, { numero: proximoNumero });
        return gerarPdfOrdemServico({
          os: osPdf,
          escritorioId,
          retornarBlob: true,
        });
      },
    });
  };

  if (!autorizado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        A redirecionar…
      </div>
    );
  }

  const formContent = (
    <div
      className={
        isVk
          ? "mx-auto max-w-4xl space-y-8 rounded-2xl border border-white/10 bg-esc-card/40 p-6 backdrop-blur-md md:p-8"
          : "mx-auto max-w-4xl space-y-8 rounded-2xl border border-border-primary/30 bg-white p-6 shadow-sm md:p-8"
      }
    >
      {erro ? (
        <p
          className={
            isVk
              ? "rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-300"
              : "rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary"
          }
        >
          {erro}
        </p>
      ) : null}

      <section>
        <SecaoTitulo isVk={isVk}>Identificação</SecaoTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoForm label="Nº da OS (próximo)" isVk={isVk}>
            <BaseInput value={proximoNumero ?? "—"} readOnly disabled />
          </CampoForm>
          <CampoForm label="Data de Emissão" isVk={isVk}>
            <BaseInput
              type="date"
              value={form.data_emissao}
              onChange={(e) => setField("data_emissao", e.target.value)}
            />
          </CampoForm>
          <CampoForm label="Responsável Técnico" isVk={isVk}>
            <BaseInput
              value={form.responsavel_tecnico}
              onChange={(e) => setField("responsavel_tecnico", e.target.value)}
            />
          </CampoForm>
          <CampoForm label="Designar para (interno)" isVk={isVk}>
            <BaseSelect
              searchable
              value={form.responsavel_id}
              onChange={(e) => setField("responsavel_id", e.target.value)}
              options={opcoesDestinatarios}
              variant={isVk ? "escritorio" : "default"}
            />
          </CampoForm>
        </div>
      </section>

      <section>
        <SecaoTitulo isVk={isVk}>Cliente</SecaoTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoForm label="Vincular cliente (opcional)" isVk={isVk}>
            <BaseSelect
              searchable
              value={form.cliente_id}
              onChange={(e) => aplicarCliente(e.target.value)}
              options={[
                { value: "", label: "Digitar manualmente" },
                ...opcoesClientes,
              ]}
              variant={isVk ? "escritorio" : "default"}
            />
          </CampoForm>
          <CampoForm label="Cliente" isVk={isVk}>
            <BaseInput
              value={form.cliente_nome}
              onChange={(e) => setField("cliente_nome", e.target.value)}
            />
          </CampoForm>
          <CampoForm label="Telefone" isVk={isVk}>
            <BaseInput
              value={form.cliente_telefone}
              onChange={(e) => setField("cliente_telefone", e.target.value)}
            />
          </CampoForm>
          <CampoForm label="E-mail" isVk={isVk}>
            <BaseInput
              value={form.cliente_email}
              onChange={(e) => setField("cliente_email", e.target.value)}
            />
          </CampoForm>
          <div className="sm:col-span-2">
            <CampoForm label="Endereço do Projeto" isVk={isVk}>
              <BaseInput
                value={form.endereco_projeto}
                onChange={(e) => setField("endereco_projeto", e.target.value)}
              />
            </CampoForm>
          </div>
        </div>
      </section>

      <section>
        <SecaoTitulo isVk={isVk}>1. Objeto do Serviço</SecaoTitulo>
        <textarea
          value={form.objeto_servico}
          onChange={(e) => setField("objeto_servico", e.target.value)}
          rows={3}
          className={
            isVk
              ? "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-esc-text focus:border-esc-destaque focus:outline-none"
              : "w-full rounded-xl border border-border-primary/40 px-4 py-3 text-sm focus:border-accent-primary focus:outline-none"
          }
        />
      </section>

      <section>
        <SecaoTitulo isVk={isVk}>2. Escopo Contratado</SecaoTitulo>
        <CheckboxGroup
          opcoes={OS_ESCOPO_OPCOES}
          valores={form.escopo}
          onChange={(v) => setField("escopo", v)}
          isVk={isVk}
        />
        <div className="mt-3">
          <CampoForm label="Outro" isVk={isVk}>
            <BaseInput
              value={form.escopo_outro}
              onChange={(e) => setField("escopo_outro", e.target.value)}
            />
          </CampoForm>
        </div>
      </section>

      <section>
        <SecaoTitulo isVk={isVk}>3. Descrição dos Serviços</SecaoTitulo>
        <textarea
          value={form.descricao_servicos}
          onChange={(e) => setField("descricao_servicos", e.target.value)}
          rows={5}
          className={
            isVk
              ? "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-esc-text focus:border-esc-destaque focus:outline-none"
              : "w-full rounded-xl border border-border-primary/40 px-4 py-3 text-sm focus:border-accent-primary focus:outline-none"
          }
        />
      </section>

      <section>
        <SecaoTitulo isVk={isVk}>4. Prazos</SecaoTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoForm label="Data de Início" isVk={isVk}>
            <BaseInput
              type="date"
              value={form.data_inicio}
              onChange={(e) => setField("data_inicio", e.target.value)}
            />
          </CampoForm>
          <CampoForm label="Data Prevista para Entrega" isVk={isVk}>
            <BaseInput
              type="date"
              value={form.data_entrega_prevista}
              onChange={(e) => setField("data_entrega_prevista", e.target.value)}
            />
          </CampoForm>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-text-muted">
            Observações
          </label>
          <textarea
            value={form.observacoes_prazos}
            onChange={(e) => setField("observacoes_prazos", e.target.value)}
            rows={3}
            className={
              isVk
                ? "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-esc-text"
                : "w-full rounded-xl border border-border-primary/40 px-4 py-3 text-sm"
            }
          />
        </div>
      </section>

      <section>
        <SecaoTitulo isVk={isVk}>5. Valor dos Serviços</SecaoTitulo>
        <CampoForm label="Valor Total (R$)" isVk={isVk}>
          <BaseInput
            type="number"
            min="0"
            step="0.01"
            value={form.valor_total}
            onChange={(e) => setField("valor_total", e.target.value)}
          />
        </CampoForm>
        <p className="mb-2 mt-4 text-xs font-medium text-text-muted">
          Forma de Pagamento
        </p>
        <CheckboxGroup
          opcoes={OS_FORMAS_PAGAMENTO}
          valores={form.formas_pagamento}
          onChange={(v) => setField("formas_pagamento", v)}
          isVk={isVk}
        />
        <div className="mt-3">
          <CampoForm label="Outro" isVk={isVk}>
            <BaseInput
              value={form.forma_pagamento_outro}
              onChange={(e) => setField("forma_pagamento_outro", e.target.value)}
            />
          </CampoForm>
        </div>
      </section>

      <section>
        <SecaoTitulo isVk={isVk}>7. Observações Gerais</SecaoTitulo>
        <textarea
          value={form.observacoes_gerais}
          onChange={(e) => setField("observacoes_gerais", e.target.value)}
          rows={4}
          className={
            isVk
              ? "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-esc-text"
              : "w-full rounded-xl border border-border-primary/40 px-4 py-3 text-sm"
          }
        />
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border-primary/20 pt-6">
        <BaseButton type="button" onClick={handleSalvar} disabled={salvando}>
          {salvando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="mr-2 h-4 w-4" aria-hidden />
          )}
          Salvar e enviar
        </BaseButton>
        <BaseButton
          type="button"
          variant="outline"
          onClick={handleGerarPdf}
          disabled={salvando}
        >
          <FileDown className="mr-2 h-4 w-4" aria-hidden />
          Gerar PDF
        </BaseButton>
        <BaseButton
          type="button"
          variant="ghost"
          onClick={() => navigate(basePath)}
        >
          Cancelar
        </BaseButton>
      </div>
    </div>
  );

  return (
    <>
      {isVk ? (
        <div className="py-4">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-esc-muted transition hover:text-esc-text"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </button>
          <h1 className="mb-6 text-2xl font-bold text-esc-text">Nova Ordem de Serviço</h1>
          {formContent}
        </div>
      ) : (
        <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
          <Navbar title="Nova Ordem de Serviço" />
          <main className="w-full px-[5%] pb-12 pt-2">{formContent}</main>
        </div>
      )}

      <PdfPreviewModal
        isOpen={Boolean(pdfPreview)}
        onClose={() => setPdfPreview(null)}
        titulo={pdfPreview?.titulo}
        gerador={pdfPreview?.gerador}
        nomeFallback={pdfPreview?.nomeFallback}
        temaClasse={tema}
      />
    </>
  );
}
