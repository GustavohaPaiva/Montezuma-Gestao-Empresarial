import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import BaseInput from "../gerais/BaseInput";
import BaseSelect from "../gerais/BaseSelect";
import OrdemServicoSecaoPainel from "./OrdemServicoSecaoPainel";
import CampoMultiLancamento from "./CampoMultiLancamento";
import OsCampoTextoComIA from "./OsCampoTextoComIA";
import {
  OS_ESCOPO_OPCOES,
  OS_FORMAS_PAGAMENTO,
} from "../../constants/ordemServico";
import {
  labelCampoClass,
  labelCampoVkClass,
} from "../../pages/ordens-servico/ordensServicoUi";

function CampoForm({ label, children, isVk }) {
  return (
    <div>
      <label className={isVk ? labelCampoVkClass : labelCampoClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckboxGroup({ opcoes, valores, onChange, isVk, disabled }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {opcoes.map((op) => {
        const checked = valores.includes(op.id);
        return (
          <label
            key={op.id}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              disabled ? "opacity-60" : "cursor-pointer"
            } ${
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
              disabled={disabled}
              onChange={() => {
                if (disabled) return;
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

export default function OrdemServicoFormCorpo({
  form,
  setField,
  variant = "montezuma",
  clientes = [],
  destinatarios = [],
  onAplicarCliente,
  somenteLeitura = false,
  numeroOs,
  clientesCarregando = false,
}) {
  const isVk = variant === "vogelkop";

  const opcoesDestinatarios = [
    { value: "", label: "Nenhum" },
    ...destinatarios.map((u) => ({
      value: String(u.id),
      label: u.nome || "Usuário",
    })),
  ];

  const opcoesClientes = clientes
    .filter((c) => c?.id)
    .map((c) => ({
      value: String(c.id),
      label: c.nome || "Sem nome",
    }));

  const inputVariant = isVk ? "escritorio" : "default";

  return (
    <div className="flex flex-col gap-6">
      <OrdemServicoSecaoPainel
        titulo="Identificação"
        icon={<ClipboardList className="h-5 w-5" />}
        variant={variant}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CampoForm label="Nº da OS" isVk={isVk}>
            <BaseInput
              value={numeroOs ?? "—"}
              readOnly
              disabled
              variant={inputVariant}
            />
          </CampoForm>
          <CampoForm label="Data de Emissão" isVk={isVk}>
            <BaseInput
              type="date"
              value={form.data_emissao}
              onChange={(e) => setField("data_emissao", e.target.value)}
              disabled={somenteLeitura}
              variant={inputVariant}
            />
          </CampoForm>
          <CampoForm label="Responsável Técnico" isVk={isVk}>
            <BaseSelect
              searchable
              value={form.responsavel_id}
              onChange={(e) => setField("responsavel_id", e.target.value)}
              options={opcoesDestinatarios}
              variant={isVk ? "escritorio" : "default"}
              disabled={somenteLeitura}
            />
          </CampoForm>
        </div>
      </OrdemServicoSecaoPainel>

      <OrdemServicoSecaoPainel
        titulo="Cliente"
        icon={<UserRound className="h-5 w-5" />}
        variant={variant}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <CampoForm label="Cliente" isVk={isVk}>
              <BaseSelect
                searchable
                placeholder="Selecione o cliente"
                value={form.cliente_id}
                onChange={(e) => onAplicarCliente?.(e.target.value)}
                options={opcoesClientes}
                variant={isVk ? "escritorio" : "default"}
                disabled={somenteLeitura}
                loading={clientesCarregando}
                emptyMessage="Nenhum cliente cadastrado"
              />
            </CampoForm>
          </div>
          <CampoForm label="Telefone" isVk={isVk}>
            <BaseInput
              type="text"
              value={form.cliente_telefone}
              onChange={(e) => setField("cliente_telefone", e.target.value)}
              disabled={somenteLeitura}
              variant={inputVariant}
            />
          </CampoForm>
          <CampoForm label="E-mail" isVk={isVk}>
            <BaseInput
              type="email"
              value={form.cliente_email}
              onChange={(e) => setField("cliente_email", e.target.value)}
              disabled={somenteLeitura}
              variant={inputVariant}
            />
          </CampoForm>
          <div className="sm:col-span-2">
            <p
              className={
                isVk
                  ? "mb-2 text-xs font-medium text-esc-muted"
                  : "mb-2 text-xs font-medium text-text-muted"
              }
            >
              Endereço do Projeto
            </p>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <CampoForm label="Rua" isVk={isVk}>
                  <BaseInput
                    type="text"
                    value={form.endereco_rua}
                    onChange={(e) => setField("endereco_rua", e.target.value)}
                    disabled={somenteLeitura}
                    variant={inputVariant}
                  />
                </CampoForm>
              </div>
              <div className="sm:col-span-2">
                <CampoForm label="Número" isVk={isVk}>
                  <BaseInput
                    type="text"
                    value={form.endereco_numero}
                    onChange={(e) =>
                      setField("endereco_numero", e.target.value)
                    }
                    disabled={somenteLeitura}
                    variant={inputVariant}
                  />
                </CampoForm>
              </div>
              <div className="sm:col-span-6">
                <CampoForm label="Bairro" isVk={isVk}>
                  <BaseInput
                    type="text"
                    value={form.endereco_bairro}
                    onChange={(e) =>
                      setField("endereco_bairro", e.target.value)
                    }
                    disabled={somenteLeitura}
                    variant={inputVariant}
                  />
                </CampoForm>
              </div>
            </div>
          </div>
        </div>
      </OrdemServicoSecaoPainel>

      <OrdemServicoSecaoPainel
        titulo="1. Objeto do Serviço"
        icon={<FileText className="h-5 w-5" />}
        variant={variant}
      >
        <OsCampoTextoComIA
          onChange={(v) => setField("objeto_servico", v)}
          multiline
          rows={3}
          disabled={somenteLeitura}
          isVk={isVk}
          maxLinhas={8}
        />
      </OrdemServicoSecaoPainel>

      <OrdemServicoSecaoPainel
        titulo="2. Escopo Contratado"
        icon={<Building2 className="h-5 w-5" />}
        variant={variant}
      >
        <CheckboxGroup
          opcoes={OS_ESCOPO_OPCOES}
          valores={form.escopo}
          onChange={(v) => setField("escopo", v)}
          isVk={isVk}
          disabled={somenteLeitura}
        />
        <div className="mt-3">
          <CampoForm label="Outro" isVk={isVk}>
            <CampoMultiLancamento
              itens={form.escopo_outros}
              onChange={(v) => setField("escopo_outros", v)}
              placeholder="Descreva outro item de escopo…"
              disabled={somenteLeitura}
              isVk={isVk}
            />
          </CampoForm>
        </div>
      </OrdemServicoSecaoPainel>

      <OrdemServicoSecaoPainel
        titulo="3. Descrição dos Serviços"
        icon={<FileText className="h-5 w-5" />}
        variant={variant}
      >
        <OsCampoTextoComIA
          value={form.descricao_servicos}
          onChange={(v) => setField("descricao_servicos", v)}
          multiline
          rows={5}
          disabled={somenteLeitura}
          isVk={isVk}
          maxLinhas={15}
        />
      </OrdemServicoSecaoPainel>

      <OrdemServicoSecaoPainel
        titulo="4. Prazos"
        icon={<Calendar className="h-5 w-5" />}
        variant={variant}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoForm label="Data de Início" isVk={isVk}>
            <BaseInput
              type="date"
              value={form.data_inicio}
              onChange={(e) => setField("data_inicio", e.target.value)}
              disabled={somenteLeitura}
              variant={inputVariant}
            />
          </CampoForm>
          <CampoForm label="Data Prevista para Entrega" isVk={isVk}>
            <BaseInput
              type="date"
              value={form.data_entrega_prevista}
              onChange={(e) =>
                setField("data_entrega_prevista", e.target.value)
              }
              disabled={somenteLeitura}
              variant={inputVariant}
            />
          </CampoForm>
        </div>
        <div className="mt-3">
          <CampoForm label="Observações" isVk={isVk}>
            <OsCampoTextoComIA
              value={form.observacoes_prazos}
              onChange={(v) => setField("observacoes_prazos", v)}
              multiline
              rows={3}
              disabled={somenteLeitura}
              isVk={isVk}
              maxLinhas={10}
            />
          </CampoForm>
        </div>
      </OrdemServicoSecaoPainel>

      <OrdemServicoSecaoPainel
        titulo="5. Valor dos Serviços"
        icon={<Wallet className="h-5 w-5" />}
        variant={variant}
      >
        <CampoForm label="Valor Total (R$)" isVk={isVk}>
          <BaseInput
            type="number"
            min="0"
            step="0.01"
            value={form.valor_total}
            onChange={(e) => setField("valor_total", e.target.value)}
            disabled={somenteLeitura}
            variant={inputVariant}
          />
        </CampoForm>
        <p
          className={
            isVk
              ? "mb-2 mt-4 text-xs font-medium text-esc-muted"
              : "mb-2 mt-4 text-xs font-medium text-text-muted"
          }
        >
          Forma de Pagamento
        </p>
        <CheckboxGroup
          opcoes={OS_FORMAS_PAGAMENTO}
          valores={form.formas_pagamento}
          onChange={(v) => setField("formas_pagamento", v)}
          isVk={isVk}
          disabled={somenteLeitura}
        />
        <div className="mt-3">
          <CampoForm label="Outro" isVk={isVk}>
            <CampoMultiLancamento
              itens={form.formas_pagamento_outros}
              onChange={(v) => setField("formas_pagamento_outros", v)}
              placeholder="Descreva outra forma de pagamento…"
              disabled={somenteLeitura}
              isVk={isVk}
            />
          </CampoForm>
        </div>
      </OrdemServicoSecaoPainel>

      <OrdemServicoSecaoPainel
        titulo="6. Responsabilidades do Cliente"
        icon={<ShieldCheck className="h-5 w-5" />}
        variant={variant}
      >
        <OsCampoTextoComIA
          value={form.responsabilidades_cliente}
          onChange={(v) => setField("responsabilidades_cliente", v)}
          multiline
          rows={4}
          disabled={somenteLeitura}
          isVk={isVk}
          maxLinhas={12}
        />
      </OrdemServicoSecaoPainel>

      <OrdemServicoSecaoPainel
        titulo="7. Observações Gerais"
        icon={<FileText className="h-5 w-5" />}
        variant={variant}
      >
        <OsCampoTextoComIA
          value={form.observacoes_gerais}
          onChange={(v) => setField("observacoes_gerais", v)}
          multiline
          rows={4}
          disabled={somenteLeitura}
          isVk={isVk}
          maxLinhas={12}
        />
      </OrdemServicoSecaoPainel>
    </div>
  );
}
