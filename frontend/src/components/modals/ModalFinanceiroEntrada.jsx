import { useState, useEffect } from "react";
import ButtonDefault from "../gerais/ButtonDefault";
import ModalPortal from "../gerais/ModalPortal";
import { ID_MONTEZUMA } from "../../constants/escritorios";

const initialForm = () => ({
  descricao: "",
  valor: "",
  data: new Date().toISOString().split("T")[0],
  formaPagamento: "Á vista",
  parcelas: "1X",
});

export default function ModalFinanceiroEntrada({
  isOpen,
  onClose,
  onSave,
  userTipo,
  escritorioProprioId,
  escritorioProprioNome,
  visaoEscritorioAtual,
}) {
  const [formData, setFormData] = useState(initialForm);
  const [escritorioLan, setEscritorioLan] = useState("Montezuma");

  const isSecretaria = userTipo === "secretaria";
  const escritorioSelectDisabled = isSecretaria;

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => {
      setFormData(initialForm());
    }, 0);
    setTimeout(() => {
      setEscritorioLan(
        isSecretaria
          ? "Montezuma"
          : visaoEscritorioAtual === "proprio"
            ? "proprio"
            : "Montezuma",
      );
    }, 0);
  }, [isOpen, isSecretaria, visaoEscritorioAtual]);

  if (!isOpen) return null;

  const salvar = () => {
    const escritorio_id = isSecretaria
      ? ID_MONTEZUMA
      : escritorioLan === "Montezuma"
        ? ID_MONTEZUMA
        : escritorioProprioId;
    onSave({ ...formData, escritorio_id });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
        <div className="flex max-h-[95vh] w-[500px] max-w-[95%] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4">
            <div className="flex-1 min-w-0">
              <h2 className="truncate text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg">
                Nova Entrada
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border-primary/40 bg-[#FAFAFA] text-[22px] text-text-muted transition-all hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            >
              &times;
            </button>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Escritório
              </label>
              <select
                disabled={escritorioSelectDisabled}
                className="h-11 w-full cursor-pointer rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25 disabled:cursor-not-allowed disabled:opacity-70"
                value={escritorioLan}
                onChange={(e) => setEscritorioLan(e.target.value)}
              >
                <option value="Montezuma">Montezuma</option>
                {!isSecretaria && (
                  <option value="proprio">
                    {escritorioProprioNome || "Meu escritório"}
                  </option>
                )}
              </select>
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Descrição
              </label>
              <input
                type="text"
                placeholder="Descrição da Entrada"
                className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
              />
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex flex-col gap-[5px] w-full">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Valor
                </label>
                <input
                  type="number"
                  placeholder="Valor da Entrada"
                  className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({ ...formData, valor: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-[5px] w-full">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Data
                </label>
                <input
                  type="date"
                  placeholder="Data da Entrada"
                  className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                  value={formData.data}
                  onChange={(e) =>
                    setFormData({ ...formData, data: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Forma de Pagamento
              </label>
              <select
                className="h-11 w-full cursor-pointer rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                value={formData.formaPagamento}
                onChange={(e) =>
                  setFormData({ ...formData, formaPagamento: e.target.value })
                }
              >
                <option value="Á vista">Á vista</option>
                <option value="Debito">Débito</option>
                <option value="Crédito">Crédito</option>
                <option value="Parcelado">Parcelado</option>
              </select>
            </div>

            {formData.formaPagamento === "Parcelado" && (
              <div className="flex flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Quantidade de Parcelas
                </label>
                <select
                  className="h-11 w-full cursor-pointer rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                  value={formData.parcelas}
                  onChange={(e) =>
                    setFormData({ ...formData, parcelas: e.target.value })
                  }
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={`${i + 1}X`}>
                      {i + 1}X
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ButtonDefault
              onClick={salvar}
              className="!mt-2 !h-11 !w-full !cursor-pointer !rounded-xl !border !border-accent-primary !bg-accent-primary !text-sm !font-bold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.35)] transition-all hover:!bg-accent-primary-dark hover:!shadow-lg"
            >
              Salvar Entrada
            </ButtonDefault>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
