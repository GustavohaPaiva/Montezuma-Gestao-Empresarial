import BaseCard from "../../../components/cards/BaseCard";
import { formatarMoeda } from "../../obras/detalhe/utils/formatters";
import { TIPOS_EXTRATO } from "../relatorioFinanceiroUtils";
import {
  relatorioAutoFitGridClass,
  relatorioFinanceiroMetricGridClass,
} from "../relatoriosDiretoriaUi";

export default function RelatorioFinanceiroResumo({ totais, porCategoria = {} }) {
  const cards = [
    {
      titulo: "A cobrar",
      valor: totais.aCobrar,
      colorTheme: "primary",
      descricao: "Extrato da semana",
    },
    {
      titulo: "Pago",
      valor: totais.pago,
      colorTheme: "emerald",
      descricao: "Valores quitados",
    },
    {
      titulo: "Aguardando",
      valor: totais.aguardando,
      colorTheme: "amber",
      descricao: "Pendente de pagamento",
    },
    {
      titulo: "Em espera",
      valor: totais.emEspera,
      colorTheme: "indigo",
      descricao: "Fora do extrato",
    },
  ];

  const categoriasAtivas = TIPOS_EXTRATO.filter(
    (tipo) => (porCategoria[tipo]?.count || 0) > 0,
  );

  return (
    <section className="mb-6">
      <div className={relatorioFinanceiroMetricGridClass}>
        {cards.map((card) => (
          <BaseCard
            key={card.titulo}
            title={card.titulo}
            value={`R$ ${formatarMoeda(card.valor)}`}
            hint={card.descricao}
            colorTheme={card.colorTheme}
          />
        ))}
      </div>

      {categoriasAtivas.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-border-primary/30 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-semibold text-text-primary">
            Por categoria
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            Subtotais da semana por tipo de lançamento
          </p>
          <div className={`mt-3 ${relatorioAutoFitGridClass}`}>
            {categoriasAtivas.map((tipo) => {
              const cat = porCategoria[tipo];
              return (
                <div
                  key={tipo}
                  className="rounded-xl border border-border-primary/15 bg-[#FAFAFA] p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {tipo}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">
                    R$ {formatarMoeda(cat.total)}
                  </p>
                  <div className="mt-2 space-y-0.5 text-[11px] text-text-muted">
                    <p>{cat.count} lançamento(s)</p>
                    {cat.aCobrar > 0 ? (
                      <p>A cobrar: R$ {formatarMoeda(cat.aCobrar)}</p>
                    ) : null}
                    {cat.pago > 0 ? (
                      <p>Pago: R$ {formatarMoeda(cat.pago)}</p>
                    ) : null}
                    {cat.aguardando > 0 ? (
                      <p>Aguardando: R$ {formatarMoeda(cat.aguardando)}</p>
                    ) : null}
                    {cat.emEspera > 0 ? (
                      <p>Em espera: R$ {formatarMoeda(cat.emEspera)}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
