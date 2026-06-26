import { X } from "lucide-react";
import { useState } from "react";
import ButtonDefault from "../../../../components/gerais/ButtonDefault";
import BaseSelect from "../../../../components/gerais/BaseSelect";
import ModalPortal from "../../../../components/gerais/ModalPortal";

export default function ModalRelatorioPrestador({
  isOpen,
  onClose,
  onGenerate,
  prestadoresDisponiveis,
}) {
  const [selecionado, setSelecionado] = useState("");
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
        <div className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-3 border-b border-border-primary/35 px-5 py-4">
            <h2 className="text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg">
              Relatório por prestador
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-primary/40 bg-[#FAFAFA] text-text-primary transition-all hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            >
              <X className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>
          <div className="flex flex-col gap-4 px-5 py-5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Selecione o prestador
            </label>
            <BaseSelect
              searchable
              value={selecionado}
              onChange={(e) => setSelecionado(e.target.value)}
              options={[
                { value: "", label: "Selecione..." },
                ...prestadoresDisponiveis.map((p) => ({
                  value: p,
                  label: p.toUpperCase(),
                })),
              ]}
            />
            <ButtonDefault
              onClick={() => {
                onGenerate(selecionado);
                setSelecionado("");
              }}
              disabled={!selecionado}
              className="!h-12 !w-full !rounded-xl !border !border-accent-primary !bg-accent-primary !text-base !font-bold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.35)] transition-all hover:!bg-accent-primary-dark hover:!shadow-lg disabled:!opacity-50"
            >
              Gerar PDF
            </ButtonDefault>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
