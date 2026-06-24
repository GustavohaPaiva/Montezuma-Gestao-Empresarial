import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Wallet } from "lucide-react";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import RelatorioDetalheHeader from "./components/RelatorioDetalheHeader";
import RelatorioFinanceiroDetalhes from "./components/RelatorioFinanceiroDetalhes";
import RelatorioFinanceiroGraficos from "./components/RelatorioFinanceiroGraficos";
import RelatorioFinanceiroResumo from "./components/RelatorioFinanceiroResumo";
import RelatorioSemanaReferenciaCard from "./components/RelatorioSemanaReferenciaCard";
import { useRelatorioFinanceiroObra } from "./hooks/useRelatorioFinanceiroObra";
import { financeiroSemanaTemDados } from "./relatorioFinanceiroUtils";
import {
  buildSemanaSearchParams,
  derivarPeriodoDaSemana,
  isSemanaAtual,
  labelSemanaFromInicio,
  periodoAtual,
  rotaRelatorioFinanceiro,
} from "./relatoriosDiretoriaUtils";

export default function RelatorioFinanceiroSemana() {
  const { obraId, semanaRef: semanaInicioParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const atual = periodoAtual();

  const semanaInicio = String(semanaInicioParam || "").slice(0, 10);
  const ano =
    Number(searchParams.get("ano")) ||
    derivarPeriodoDaSemana(semanaInicio).ano ||
    atual.ano;
  const mes =
    Number(searchParams.get("mes")) ||
    derivarPeriodoDaSemana(semanaInicio).mes ||
    atual.mes;
  const origem = searchParams.get("origem") === "obra" ? "obra" : "semana";

  const { obra, resumo, loading, erro } = useRelatorioFinanceiroObra(
    obraId,
    semanaInicio,
  );

  const voltarDestino = () => {
    if (origem === "obra") {
      return `/relatorios-diretoria/${obraId}${buildSemanaSearchParams(ano, mes)}`;
    }
    return `/relatorios-diretoria/${obraId}/semana/${semanaInicio}${buildSemanaSearchParams(ano, mes)}`;
  };

  const trocarSemana = (novaSemana) => {
    if (!novaSemana || novaSemana === semanaInicio) return;
    navigate(
      rotaRelatorioFinanceiro(obraId, novaSemana, { ano, mes, origem }),
    );
  };

  const labelSemana = labelSemanaFromInicio(semanaInicio);
  const subtituloBase = isSemanaAtual(semanaInicio)
    ? `Relatório financeiro · ${labelSemana} · Semana atual`
    : `Relatório financeiro · ${labelSemana}`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-[5%] py-12">
        <LoadingPainel
          titulo="Carregando relatório financeiro"
          descricao="Consolidando lançamentos da semana…"
          icon={<Wallet className="h-7 w-7" strokeWidth={2} />}
        />
      </div>
    );
  }

  const temDados = financeiroSemanaTemDados(resumo);

  return (
    <div className="flex min-h-screen w-full flex-col items-center overflow-x-hidden bg-[#FAFAFA] pb-10">
      <RelatorioDetalheHeader
        obra={obra}
        onVoltar={() => navigate(voltarDestino())}
        subtitulo={subtituloBase}
      />

      <main className="w-full px-[5%] pt-4">
        {erro ? (
          <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
            {erro}
          </p>
        ) : null}

        <RelatorioSemanaReferenciaCard
          semanaInicio={semanaInicio}
          ano={ano}
          mes={mes}
          onTrocarSemana={trocarSemana}
        />

        {!temDados ? (
          <p className="rounded-xl border border-dashed border-border-primary/40 bg-white px-4 py-10 text-center text-sm text-text-muted">
            Nenhum lançamento financeiro registrado nesta semana.
          </p>
        ) : (
          <>
            <RelatorioFinanceiroResumo
              totais={resumo.totais}
              porCategoria={resumo.porCategoria}
            />
            <RelatorioFinanceiroGraficos graficos={resumo.graficos} />
            <RelatorioFinanceiroDetalhes
              extratoSemana={resumo.extratoSemana}
              emEsperaSemana={resumo.emEsperaSemana}
            />
          </>
        )}
      </main>
    </div>
  );
}
