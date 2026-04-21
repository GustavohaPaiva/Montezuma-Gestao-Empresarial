import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ModalPortal from "../gerais/ModalPortal";
import { ID_VOGELKOP } from "../../constants/escritorios";

const STATUS_OPTIONS = [
  "Produção",
  "Prefeitura",
  "Caixa",
  "Cartorio",
  "Obra",
  "Finalizado",
];

const TIPO_PROJETO_OPTIONS = ["Residencial", "Reforma", "Comercial"];

function normalizeTipoProjeto(valor) {
  const t = (valor || "").trim();
  return TIPO_PROJETO_OPTIONS.includes(t) ? t : TIPO_PROJETO_OPTIONS[0];
}

function emptyForm() {
  return {
    nome: "",
    tipo: TIPO_PROJETO_OPTIONS[0],
    pagamento: "À combinar",
    valor_pago: "",
    status: "Produção",
  };
}

export default function ModalClienteEscritorio({
  isOpen,
  onClose,
  onSave,
  escritorioId,
  clienteEdicao,
}) {
  const modoEdicao = Boolean(clienteEdicao?.id);
  const [form, setForm] = useState(emptyForm);
  const temaClasse =
    escritorioId === ID_VOGELKOP ? "theme-vogelkop" : "theme-ybyoca";

  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-esc-text shadow-inner transition-all duration-300 placeholder:text-esc-muted/40 focus:border-esc-destaque focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-esc-destaque";

  const modalOverlayClass = `${temaClasse} fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md`;

  const modalPanelClass =
    "animate-premium-reveal relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/20 bg-esc-card shadow-[0_0_40px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl";

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      if (clienteEdicao?.id) {
        setForm({
          nome: clienteEdicao.nome ?? "",
          tipo: normalizeTipoProjeto(clienteEdicao.tipo),
          pagamento: clienteEdicao.pagamento ?? "À combinar",
          valor_pago:
            clienteEdicao.valor_pago != null
              ? String(clienteEdicao.valor_pago)
              : "",
          status: clienteEdicao.status ?? "Produção",
        });
      } else {
        setForm(emptyForm());
      }
    });
  }, [isOpen, clienteEdicao]);

  if (!isOpen || !escritorioId) return null;

  const submit = () => {
    if (!form.nome?.trim()) {
      alert("O nome é obrigatório.");
      return;
    }
    const base = {
      nome: form.nome.trim(),
      tipo: normalizeTipoProjeto(form.tipo),
      pagamento: form.pagamento || "À combinar",
      valor_pago: form.valor_pago === "" ? 0 : parseFloat(form.valor_pago) || 0,
      status: form.status || "Produção",
      escritorio_id: escritorioId,
    };
    if (modoEdicao) {
      onSave({ id: clienteEdicao.id, ...base });
    } else {
      onSave(base);
    }
  };

  return (
    <ModalPortal>
      <div className={modalOverlayClass} role="dialog" aria-modal="true">
        <div className={modalPanelClass}>
          <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]"></div>
          <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/10 blur-[70px]"></div>

          <div className="flex items-center justify-between border-b border-esc-border px-6 py-4">
            <h2 className="text-xl font-bold tracking-tight text-esc-text">
              {modoEdicao ? "Editar Cliente" : "Novo Cliente"}
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

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6 custom-scrollbar">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                Nome do Cliente
              </label>
              <input
                type="text"
                name="nome"
                className={fieldClass}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: João da Silva"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Tipo do Projeto
                </label>
                <select
                  name="tipo"
                  className={fieldClass}
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  {TIPO_PROJETO_OPTIONS.map((opt) => (
                    <option
                      key={opt}
                      value={opt}
                      className="bg-esc-bg text-esc-text"
                    >
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Status
                </label>
                <select
                  className={fieldClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((s) => (
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

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Pagamento
                </label>
                <select
                  className={fieldClass}
                  value={form.pagamento}
                  onChange={(e) =>
                    setForm({ ...form, pagamento: e.target.value })
                  }
                >
                  <option value="Á vista" className="bg-esc-bg text-esc-text">
                    Á vista
                  </option>
                  <option value="Parcelado" className="bg-esc-bg text-esc-text">
                    Parcelado
                  </option>
                  <option value="Cartão" className="bg-esc-bg text-esc-text">
                    Cartão
                  </option>
                  <option
                    value="À combinar"
                    className="bg-esc-bg text-esc-text"
                  >
                    À combinar
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Valor Pago (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={fieldClass}
                  value={form.valor_pago}
                  onChange={(e) =>
                    setForm({ ...form, valor_pago: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-esc-border px-6 py-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border w-full border-white/10 bg-transparent px-6 py-2.5 text-sm font-semibold text-esc-text transition-all duration-300 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submit}
              className="rounded-xl border w-full border-esc-destaque/50 bg-esc-destaque/20 px-8 py-2.5 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all duration-300 hover:bg-esc-destaque/30 hover:shadow-[0_0_25px_-3px_var(--color-esc-destaque)]"
            >
              Salvar Cliente
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
