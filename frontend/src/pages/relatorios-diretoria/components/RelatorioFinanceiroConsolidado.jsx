import { formatarMoeda } from "../../obras/detalhe/utils/formatters";
import {
  relatorioCorridoTituloClass,
} from "../relatoriosDiretoriaUi";

export default function RelatorioFinanceiroConsolidado({ resumo }) {
  if (!resumo?.totais) return null;

  const { totais, extratoCount = 0, emEsperaCount = 0 } = resumo;
  const linhas = [
    { label: "A cobrar (extrato)", valor: totais.aCobrar },
    { label: "Pago", valor: totais.pago },
    { label: "Aguardando pagamento", valor: totais.aguardando },
    { label: "Em espera", valor: totais.emEspera },
  ];

  return (
    <div>
      <h3 className={relatorioCorridoTituloClass}>Financeiro</h3>
      <p className="mb-3 text-xs text-text-muted">
        Visão automática · {extratoCount} no extrato · {emEsperaCount} em espera
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {linhas.map((linha) => (
          <div
            key={linha.label}
            className="flex items-center justify-between rounded-xl border border-border-primary/15 bg-[#FAFAFA] px-3 py-2.5"
          >
            <span className="text-sm text-text-muted">{linha.label}</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">
              R$ {formatarMoeda(linha.valor)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
