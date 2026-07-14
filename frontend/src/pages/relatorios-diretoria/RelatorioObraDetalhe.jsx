import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import { api } from "../../services/api";
import MenuNovoLancamento from "./components/MenuNovoLancamento";
import ModalLancamentoRelatorio from "./components/ModalLancamentoRelatorio";
import RelatorioDetalheHeader from "./components/RelatorioDetalheHeader";
import RelatorioModalidadeCard from "./components/RelatorioModalidadeCard";
import RelatorioPeriodoCard from "./components/RelatorioPeriodoCard";
import RelatorioSemanaCard from "./components/RelatorioSemanaCard";
import { useRelatoriosDiretoriaPeriodo } from "./hooks/useRelatoriosDiretoriaObra";
import {
  calcularResumosFinanceirosGlobaisPorSemana,
  classificarLancamentosGlobal,
  contarSemanasComFinanceiroGlobal,
} from "./relatorioFinanceiroUtils";
import {
  agruparLancamentosPorSemana,
  isSemanaAtual,
  MODALIDADES_RELATORIO,
  periodoAtual,
  rotaLancamentoObra,
  rotaRelatorioFinanceiro,
  rotaRelatorioSemana,
  semanaAtualInicio,
  semanasDoMes,
} from "./relatoriosDiretoriaUtils";
import {
  relatorioHistoricoHeaderClass,
  relatorioHistoricoTimelineClass,
  relatorioSecaoAccentLineClass,
  relatorioSecaoLabelAccentClass,
  relatorioSecaoTituloClass,
} from "./relatoriosDiretoriaUi";

export default function RelatorioObraDetalhe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const atual = periodoAtual();

  const periodoInicial = useMemo(() => {
    const anoParam = Number(searchParams.get("ano"));
    const mesParam = Number(searchParams.get("mes"));
    return {
      ano: anoParam || atual.ano,
      mes: mesParam || atual.mes,
    };
  }, [searchParams, atual.ano, atual.mes]);

  const {
    obrasFinanceiro,
    lancamentos,
    loading,
    erro,
    periodo,
    atualizarPeriodo,
    recarregar,
  } = useRelatoriosDiretoriaPeriodo(periodoInicial);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalidadeAtiva, setModalidadeAtiva] = useState(null);
  const [lancamentoEdicao, setLancamentoEdicao] = useState(null);
  const [semanaModal, setSemanaModal] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [menuNovaAberto, setMenuNovaAberto] = useState(false);

  const porSemana = useMemo(
    () => agruparLancamentosPorSemana(lancamentos),
    [lancamentos],
  );

  const semanas = useMemo(
    () => semanasDoMes(periodo.ano, periodo.mes),
    [periodo.ano, periodo.mes],
  );

  const resumosFinanceirosPorSemana = useMemo(
    () =>
      calcularResumosFinanceirosGlobaisPorSemana(obrasFinanceiro, semanas),
    [obrasFinanceiro, semanas],
  );

  const quantidadeFinanceiro = useMemo(
    () => contarSemanasComFinanceiroGlobal(obrasFinanceiro, semanas),
    [obrasFinanceiro, semanas],
  );

  const irParaLancamento = (modalidade, { semanaInicio } = {}) => {
    const semana = semanaInicio ?? semanaAtualInicio();
    if (modalidade === "obra") {
      navigate(
        rotaLancamentoObra(semana, {
          ano: periodo.ano,
          mes: periodo.mes,
          origem: "lista",
        }),
      );
      setMenuNovaAberto(false);
      return;
    }
    if (modalidade === "financeiro") {
      navigate(
        rotaRelatorioFinanceiro(semana, {
          ano: periodo.ano,
          mes: periodo.mes,
          origem: "lista",
        }),
      );
      setMenuNovaAberto(false);
      return;
    }
    setModalidadeAtiva(modalidade);
    setLancamentoEdicao(null);
    setSemanaModal(semana);
    setModalAberto(true);
    setMenuNovaAberto(false);
  };

  const handleSalvar = async (payload) => {
    setSalvando(true);
    try {
      await api.upsertRelatorioDiretoria(payload);
      setModalAberto(false);
      setLancamentoEdicao(null);
      await recarregar();
    } catch (e) {
      console.error("[RelatorioObraDetalhe] salvar:", e);
      alert(e?.message || "Não foi possível salvar o relatório.");
    } finally {
      setSalvando(false);
    }
  };

  const irParaSemana = (semanaInicio) => {
    navigate(
      rotaRelatorioSemana(semanaInicio, {
        ano: periodo.ano,
        mes: periodo.mes,
      }),
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-[5%] py-12">
        <LoadingPainel
          titulo="Carregando relatórios"
          descricao="Buscando histórico semanal da empresa…"
          icon={<ClipboardList className="h-7 w-7" strokeWidth={2} />}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center overflow-x-hidden bg-[#FAFAFA] pb-10">
      <RelatorioDetalheHeader
        titulo="Relatórios Semanais"
        onVoltar={() => navigate("/")}
        subtitulo="Relatório geral da semana"
        acoes={
          <MenuNovoLancamento
            aberto={menuNovaAberto}
            onToggle={setMenuNovaAberto}
            onSelecionar={(mod) => irParaLancamento(mod)}
          />
        }
      />

      <main className="w-full px-[5%] pt-4">
        {erro ? (
          <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
            {erro}
          </p>
        ) : null}

        <RelatorioPeriodoCard
          periodo={periodo}
          onAtualizarPeriodo={atualizarPeriodo}
        />

        <section className="mb-6 grid w-full gap-3 sm:grid-cols-3 md:gap-4">
          {MODALIDADES_RELATORIO.map((mod) => {
            const qtd =
              mod.id === "financeiro"
                ? quantidadeFinanceiro
                : lancamentos.filter((l) => l.modalidade === mod.id).length;
            return (
              <RelatorioModalidadeCard
                key={mod.id}
                modalidade={mod}
                quantidade={qtd}
                onClick={() => irParaLancamento(mod.id)}
              />
            );
          })}
        </section>

        <section>
          <div className={relatorioHistoricoHeaderClass}>
            <span className={relatorioSecaoLabelAccentClass}>Histórico</span>
            <h2 className={`${relatorioSecaoTituloClass} mt-1`}>
              Histórico semanal
            </h2>
            <div className={relatorioSecaoAccentLineClass} aria-hidden />
          </div>

          {semanas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-primary/40 bg-white px-4 py-8 text-center text-sm text-text-muted">
              Nenhuma semana completa neste mês.
            </p>
          ) : (
            <div className={relatorioHistoricoTimelineClass}>
              {semanas.map((semana) => (
                <RelatorioSemanaCard
                  key={semana.inicio}
                  semanaInicio={semana.inicio}
                  lancamentos={porSemana[semana.inicio] || []}
                  financeiroResumo={
                    resumosFinanceirosPorSemana[semana.inicio] ||
                    classificarLancamentosGlobal(
                      obrasFinanceiro,
                      semana.inicio,
                    )
                  }
                  isSemanaAtual={isSemanaAtual(semana.inicio)}
                  onVerRelatorio={() => irParaSemana(semana.inicio)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ModalLancamentoRelatorio
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setLancamentoEdicao(null);
        }}
        onSave={handleSalvar}
        salvando={salvando}
        modalidade={modalidadeAtiva}
        periodo={periodo}
        lancamentoExistente={lancamentoEdicao}
        semanaInicial={semanaModal}
      />
    </div>
  );
}
