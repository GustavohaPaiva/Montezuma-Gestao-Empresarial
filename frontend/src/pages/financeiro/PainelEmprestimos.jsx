import { useState } from "react";
import { Building2, ChevronDown, ChevronUp, Handshake, Plus } from "lucide-react";
import BaseButton from "../../components/gerais/BaseButton";
import { homeDictionary } from "../../constants/dictionaries";
import { formatarMoeda } from "../obras/detalhe/utils/formatters";

const hub = homeDictionary.financeiroHub;

function totalAberto(itens) {
  return (itens || []).reduce(
    (acc, item) => acc + (parseFloat(item.saldo_aberto) || 0),
    0,
  );
}

function CardEmprestimo({
  item,
  isEsc,
  podeEditar,
  onAmortizar,
  onEditar,
  onExcluir,
}) {
  return (
    <div
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
      <dl
        className={`grid grid-cols-2 gap-2 border-t pt-3 ${isEsc ? "border-esc-border" : "border-slate-100"}`}
      >
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
      {podeEditar ? (
        <div className="flex flex-col gap-2">
          {typeof onAmortizar === "function" ? (
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
          {typeof onEditar === "function" || typeof onExcluir === "function" ? (
            <div className="grid grid-cols-2 gap-2">
              {typeof onEditar === "function" ? (
                isEsc ? (
                  <button
                    type="button"
                    onClick={() => onEditar(item)}
                    className="rounded-xl border border-esc-border px-3 py-2 text-xs font-bold uppercase tracking-wide text-esc-text"
                  >
                    Editar
                  </button>
                ) : (
                  <BaseButton
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => onEditar(item)}
                  >
                    Editar
                  </BaseButton>
                )
              ) : null}
              {typeof onExcluir === "function" ? (
                isEsc ? (
                  <button
                    type="button"
                    onClick={() => onExcluir(item)}
                    className="rounded-xl border border-rose-400/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-rose-700"
                  >
                    Excluir
                  </button>
                ) : (
                  <BaseButton
                    type="button"
                    variant="danger"
                    className="w-full"
                    onClick={() => onExcluir(item)}
                  >
                    Excluir
                  </BaseButton>
                )
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ColunaEmprestimos({
  isEsc,
  titulo,
  descricao,
  vazio,
  itens,
  podeEditar,
  onAmortizar,
  onEditar,
  onExcluir,
}) {
  const total = totalAberto(itens);

  return (
    <section
      className={
        isEsc
          ? "rounded-2xl border border-esc-border bg-esc-card p-6 shadow-lg backdrop-blur-md"
          : "rounded-2xl border border-border-primary/40 bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-5"
      }
    >
      <div className="mb-4">
        <h3
          className={
            isEsc
              ? "text-2xl font-bold text-esc-destaque md:text-3xl"
              : "text-lg font-bold tracking-tight text-text-primary"
          }
        >
          {titulo}
        </h3>
        <p
          className={
            isEsc ? "mt-1 text-sm text-esc-muted" : "text-sm text-text-muted"
          }
        >
          {descricao}
        </p>
      </div>

      {itens.length === 0 ? (
        <div
          className={
            isEsc
              ? "rounded-xl border border-dashed border-esc-border px-5 py-8 text-center"
              : "rounded-2xl border border-dashed border-border-primary/55 bg-[#FAFAFA] px-4 py-8 text-center"
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
                : "text-sm font-semibold text-text-primary"
            }
          >
            {vazio}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {itens.map((item) => (
            <CardEmprestimo
              key={item.id}
              item={item}
              isEsc={isEsc}
              podeEditar={podeEditar}
              onAmortizar={onAmortizar}
              onEditar={onEditar}
              onExcluir={onExcluir}
            />
          ))}
        </div>
      )}

      <div
        className={
          isEsc
            ? "mt-4 flex items-center justify-center gap-2 rounded-xl border border-esc-border bg-esc-card p-3 shadow-inner"
            : "mt-4 rounded-xl border border-border-primary/40 bg-[#FAFAFA] p-3"
        }
      >
        <p
          className={
            isEsc
              ? "text-xs font-semibold uppercase text-esc-muted"
              : "text-[10px] font-bold uppercase tracking-wider text-text-muted"
          }
        >
          {hub.emprestimosTotalAberto}
        </p>
        <p
          className={
            isEsc
              ? "text-sm font-bold tabular-nums text-esc-text md:text-lg"
              : "mt-1 text-sm font-semibold tabular-nums text-text-primary"
          }
        >
          R$ {formatarMoeda(total)}
        </p>
      </div>
    </section>
  );
}

export default function PainelEmprestimos({
  itens = [],
  onNovo,
  onAmortizar,
  onEditar,
  onExcluir,
  podeEditar = false,
  variant = "default",
  titulo = hub.emprestimosTitulo,
  descricao = hub.emprestimosDescricao,
}) {
  const [expandido, setExpandido] = useState(false);
  const isEsc = variant === "escritorio";
  const abertos = (itens || []).filter(
    (i) => (parseFloat(i.saldo_aberto) || 0) > 1e-9,
  );
  const emprestados = abertos.filter((i) => i.emprestou);
  const tomados = abertos.filter((i) => !i.emprestou);
  const total = totalAberto(abertos);

  return (
    <section className={isEsc ? "mb-6" : "mb-5"}>
      <div
        className={
          isEsc
            ? "rounded-2xl border border-esc-border bg-esc-card p-5 shadow-lg backdrop-blur-md sm:p-6"
            : "rounded-2xl border border-border-primary/40 bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-5"
        }
      >
      <div
        className={
          isEsc
            ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={
              isEsc
                ? "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-esc-destaque/15 text-esc-destaque"
                : "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary"
            }
          >
            <Handshake className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
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
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={
                  isEsc
                    ? "inline-flex rounded-lg border border-esc-border bg-esc-card px-2.5 py-1 text-xs font-semibold tabular-nums text-esc-text"
                    : "inline-flex rounded-lg border border-border-primary/40 bg-[#FAFAFA] px-2.5 py-1 text-xs font-semibold tabular-nums text-text-primary"
                }
              >
                {abertos.length} {hub.emprestimosTotalAberto.toLowerCase()}
              </span>
              <span
                className={
                  isEsc
                    ? "inline-flex rounded-lg border border-esc-border bg-esc-card px-2.5 py-1 text-xs font-semibold tabular-nums text-esc-text"
                    : "inline-flex rounded-lg border border-border-primary/40 bg-[#FAFAFA] px-2.5 py-1 text-xs font-semibold tabular-nums text-text-primary"
                }
              >
                R$ {formatarMoeda(total)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
          {isEsc ? (
            <button
              type="button"
              onClick={() => setExpandido((prev) => !prev)}
              aria-expanded={expandido}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-esc-border px-3 py-2 text-sm font-bold text-esc-text"
            >
              {expandido ? hub.emprestimosOcultar : hub.emprestimosVer}
              {expandido ? (
                <ChevronUp className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setExpandido((prev) => !prev)}
              aria-expanded={expandido}
              className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl border border-border-primary/45 bg-[#FAFAFA] px-3 text-xs font-semibold text-text-primary sm:w-auto"
            >
              {expandido ? (
                <>
                  {hub.emprestimosOcultar}{" "}
                  <ChevronUp className="h-4 w-4" aria-hidden />
                </>
              ) : (
                <>
                  {hub.emprestimosVer}{" "}
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          )}
        </div>
      </div>
      </div>

      {expandido ? (
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ColunaEmprestimos
            isEsc={isEsc}
            titulo={hub.emprestimosColunaEmprestado}
            descricao={hub.emprestimosColunaEmprestadoSub}
            vazio={hub.emprestimosVazioEmprestado}
            itens={emprestados}
            podeEditar={podeEditar}
            onAmortizar={onAmortizar}
            onEditar={onEditar}
            onExcluir={onExcluir}
          />
          <ColunaEmprestimos
            isEsc={isEsc}
            titulo={hub.emprestimosColunaTomado}
            descricao={hub.emprestimosColunaTomadoSub}
            vazio={hub.emprestimosVazioTomado}
            itens={tomados}
            podeEditar={podeEditar}
            onAmortizar={onAmortizar}
            onEditar={onEditar}
            onExcluir={onExcluir}
          />
        </div>
      ) : null}
    </section>
  );
}
