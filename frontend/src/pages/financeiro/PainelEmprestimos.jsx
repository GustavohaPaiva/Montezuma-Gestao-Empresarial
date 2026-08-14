import { Building2, Handshake, Plus } from "lucide-react";
import BaseButton from "../../components/gerais/BaseButton";
import { formatarMoeda } from "../obras/detalhe/utils/formatters";

export default function PainelEmprestimos({
  itens = [],
  onNovo,
  onAmortizar,
  podeEditar = false,
  variant = "default",
  titulo = "Emprestado e para quem",
  descricao = "Sai do caixa, não do mês. Saldo em aberto por contraparte.",
}) {
  const isEsc = variant === "escritorio";
  const abertos = (itens || []).filter(
    (i) => (parseFloat(i.saldo_aberto) || 0) > 1e-9,
  );

  return (
    <section
      className={
        isEsc
          ? "mb-6 rounded-2xl border border-esc-border bg-esc-card p-6"
          : "mb-5 overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.06)]"
      }
    >
      <div
        className={
          isEsc
            ? "mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
            : "flex flex-col gap-3 border-b border-border-primary/30 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5"
        }
      >
        <div className="min-w-0">
          <h2
            className={
              isEsc
                ? "text-lg font-bold text-esc-text"
                : "text-lg font-bold tracking-tight text-text-primary sm:text-xl"
            }
          >
            {titulo}
          </h2>
          <p
            className={
              isEsc
                ? "mt-1 text-sm text-esc-muted"
                : "mt-1 max-w-xl text-sm text-text-muted"
            }
          >
            {descricao}
          </p>
        </div>
        {podeEditar && typeof onNovo === "function" ? (
          isEsc ? (
            <button
              type="button"
              onClick={onNovo}
              className="rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 px-3 py-2 text-sm font-bold text-esc-destaque"
            >
              + Empréstimo
            </button>
          ) : (
            <BaseButton
              type="button"
              variant="outline"
              onClick={onNovo}
              icon={<Plus className="h-4 w-4" strokeWidth={2.25} />}
              className="w-full sm:w-auto"
            >
              Novo empréstimo
            </BaseButton>
          )
        ) : null}
      </div>

      {abertos.length === 0 ? (
        <div
          className={
            isEsc
              ? "rounded-xl border border-dashed border-esc-border px-5 py-8 text-center"
              : "px-4 py-8 text-center sm:px-5"
          }
        >
          <Handshake
            className={`mx-auto mb-3 h-8 w-8 ${isEsc ? "text-esc-muted/60" : "text-text-muted/60"}`}
            aria-hidden
          />
          <p
            className={
              isEsc
                ? "text-sm font-medium text-esc-text"
                : "text-sm font-medium text-text-primary"
            }
          >
            Nada emprestado no momento
          </p>
        </div>
      ) : (
        <div
          className={
            isEsc
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
              : "grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:px-5 sm:pb-5 lg:grid-cols-3"
          }
        >
          {abertos.map((item) => (
            <div
              key={item.id}
              className={
                isEsc
                  ? "flex flex-col gap-3 rounded-xl border border-esc-border bg-esc-card p-4"
                  : "flex flex-col gap-3 rounded-2xl border border-border-primary/35 bg-white p-4"
              }
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={
                    isEsc
                      ? "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-esc-destaque/15 text-esc-destaque"
                      : "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary"
                  }
                >
                  <Building2 className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <span
                    className={`block truncate text-sm font-bold tracking-tight ${isEsc ? "text-esc-text" : "text-text-primary"}`}
                  >
                    {item.contraLabel}
                  </span>
                  <span
                    className={`mt-0.5 block text-xs ${isEsc ? "text-esc-muted" : "text-text-muted"}`}
                  >
                    {item.emprestou
                      ? "Você emprestou · a receber"
                      : "Você tomou · a devolver"}
                    {item.contraKind === "obra" ? " · Obra" : " · Escritório"}
                  </span>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <div>
                  <dt
                    className={`text-[10px] font-medium uppercase tracking-wide ${isEsc ? "text-esc-muted" : "text-slate-500"}`}
                  >
                    Original
                  </dt>
                  <dd
                    className={`mt-0.5 text-xs font-semibold tabular-nums ${isEsc ? "text-esc-text" : "text-text-primary"}`}
                  >
                    R$ {formatarMoeda(item.valor_original)}
                  </dd>
                </div>
                <div>
                  <dt
                    className={`text-[10px] font-medium uppercase tracking-wide ${isEsc ? "text-esc-muted" : "text-slate-500"}`}
                  >
                    Em aberto
                  </dt>
                  <dd
                    className={`mt-0.5 text-xs font-semibold tabular-nums ${item.emprestou ? "text-amber-700" : "text-rose-700"}`}
                  >
                    R$ {formatarMoeda(item.saldo_aberto)}
                  </dd>
                </div>
              </dl>
              {podeEditar && typeof onAmortizar === "function" ? (
                isEsc ? (
                  <button
                    type="button"
                    onClick={() => onAmortizar(item)}
                    className="rounded-xl border border-esc-destaque/40 px-3 py-2 text-xs font-bold uppercase tracking-wide text-esc-destaque"
                  >
                    {item.emprestou ? "Receber" : "Devolver"}
                  </button>
                ) : (
                  <BaseButton
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => onAmortizar(item)}
                  >
                    {item.emprestou ? "Receber" : "Devolver"}
                  </BaseButton>
                )
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
