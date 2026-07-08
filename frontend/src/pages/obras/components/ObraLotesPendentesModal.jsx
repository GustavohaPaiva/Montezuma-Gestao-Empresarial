import BaseModal from "../../../components/gerais/BaseModal";
import BaseButton from "../../../components/gerais/BaseButton";
import { formatarDataBR, formatarMoeda } from "../detalhe/utils/formatters";
import {
  classesStatusLote,
  labelStatusLote,
} from "../detalhe/utils/lotesPagamentoUtils";

export default function ObraLotesPendentesModal({
  isOpen,
  onClose,
  obra,
  lotes = [],
  processandoId = null,
  onMarcarPago,
  onAbrirExtrato,
}) {
  if (!obra) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lotes pendentes — ${obra.clientes?.nome || obra.cliente || obra.local}`}
      size="md"
    >
      {lotes.length === 0 ? (
        <p className="text-sm text-text-muted">
          Nenhum lote de pagamento pendente nesta obra.
        </p>
      ) : (
        <ul className="space-y-3">
          {lotes.map((lote) => (
            <li
              key={lote.id}
              className="rounded-2xl border border-border-primary/45 bg-[#FAFAFA] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">
                      Lote #{lote.numero}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${classesStatusLote(lote.status)}`}
                    >
                      {labelStatusLote(lote.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatarDataBR(lote.data_criacao)} · R${" "}
                    {formatarMoeda(lote.total)}
                  </p>
                </div>
                <BaseButton
                  onClick={() => onMarcarPago?.(lote)}
                  disabled={processandoId === lote.id}
                  className="!h-9 !text-xs"
                >
                  Marcar como pago
                </BaseButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <BaseButton variant="secondary" onClick={onClose}>
          Fechar
        </BaseButton>
        <BaseButton onClick={() => onAbrirExtrato?.(obra)}>
          Abrir extrato
        </BaseButton>
      </div>
    </BaseModal>
  );
}
