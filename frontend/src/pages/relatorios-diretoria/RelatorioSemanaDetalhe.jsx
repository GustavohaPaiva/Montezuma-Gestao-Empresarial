import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FileDown, FileText, Wallet } from "lucide-react";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import { api } from "../../services/api";
import MenuNovoLancamento from "./components/MenuNovoLancamento";
import ModalLancamentoRelatorio from "./components/ModalLancamentoRelatorio";
import RelatorioDetalheHeader from "./components/RelatorioDetalheHeader";
import RelatorioSemanaDocumento from "./components/RelatorioSemanaDocumento";
import { classificarLancamentosGlobal } from "./relatorioFinanceiroUtils";
import {
  isSemanaAtual,
  labelSemanaFromInicio,
  montarRelatorioConsolidado,
  periodoAtual,
  derivarPeriodoDaSemana,
  rotaLancamentoObra,
  rotaListaRelatorios,
  rotaRelatorioFinanceiro,
} from "./relatoriosDiretoriaUtils";
import { relatorioNavbarAcaoClass } from "./relatoriosDiretoriaUi";
import { gerarPdfRelatorioDiretoriaSemanal } from "./utils/relatoriosDiretoriaPdf";

export default function RelatorioSemanaDetalhe() {
  const { semanaRef: semanaInicioParam } = useParams();
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

  const [lancamentos, setLancamentos] = useState([]);
  const [obrasFinanceiro, setObrasFinanceiro] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalidadeAtiva, setModalidadeAtiva] = useState(null);
  const [lancamentoEdicao, setLancamentoEdicao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [menuNovaAberto, setMenuNovaAberto] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);

  const carregar = useCallback(async () => {
    if (!semanaInicio) return;
    setLoading(true);
    try {
      const [relatorios, obrasFin] = await Promise.all([
        api.getRelatoriosDiretoriaSemana(semanaInicio),
        api.getObrasFinanceiroParaRelatorioGlobal(),
      ]);
      setLancamentos(relatorios || []);
      setObrasFinanceiro(obrasFin || []);
      setErro(null);
    } catch (e) {
      console.error("[RelatorioSemanaDetalhe] carregar:", e);
      setErro(e?.message || "Não foi possível carregar o relatório.");
      setLancamentos([]);
      setObrasFinanceiro([]);
    } finally {
      setLoading(false);
    }
  }, [semanaInicio]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const financeiroResumo = useMemo(
    () => classificarLancamentosGlobal(obrasFinanceiro, semanaInicio),
    [obrasFinanceiro, semanaInicio],
  );

  const consolidado = useMemo(
    () => montarRelatorioConsolidado(lancamentos, { financeiroResumo }),
    [lancamentos, financeiroResumo],
  );

  const label = labelSemanaFromInicio(semanaInicio);
  const subtituloSemana = isSemanaAtual(semanaInicio)
    ? `${label} · Semana atual`
    : label;

  const ultimaAtualizacao = useMemo(() => {
    if (!lancamentos.length) return null;
    const datas = lancamentos
      .map((l) => l.updated_at || l.created_at)
      .filter(Boolean)
      .sort()
      .reverse();
    if (!datas[0]) return null;
    return new Date(datas[0]).toLocaleString("pt-BR");
  }, [lancamentos]);

  const voltarLista = () => {
    navigate(rotaListaRelatorios({ ano, mes }));
  };

  const abrirLancamento = (modalidade, lancamento = null) => {
    if (modalidade === "obra") {
      navigate(
        rotaLancamentoObra(semanaInicio, {
          ano,
          mes,
          origem: "semana",
        }),
      );
      setMenuNovaAberto(false);
      return;
    }
    if (modalidade === "financeiro") {
      navigate(
        rotaRelatorioFinanceiro(semanaInicio, {
          ano,
          mes,
          origem: "semana",
        }),
      );
      setMenuNovaAberto(false);
      return;
    }
    setModalidadeAtiva(modalidade);
    setLancamentoEdicao(lancamento);
    setModalAberto(true);
    setMenuNovaAberto(false);
  };

  const handleSalvar = async (payload) => {
    setSalvando(true);
    try {
      await api.upsertRelatorioDiretoria(payload);
      setModalAberto(false);
      setLancamentoEdicao(null);
      await carregar();
    } catch (e) {
      console.error("[RelatorioSemanaDetalhe] salvar:", e);
      alert(e?.message || "Não foi possível salvar o relatório.");
    } finally {
      setSalvando(false);
    }
  };

  const handleGerarPdf = () => {
    setPdfPreview({
      titulo: "Relatório Semanal",
      nomeFallback: "Relatorio_Semanal.pdf",
      gerador: () =>
        gerarPdfRelatorioDiretoriaSemanal({
          semanaInicio,
          consolidado,
          ultimaAtualizacao,
        }),
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-[5%] py-12">
        <LoadingPainel
          titulo="Carregando relatório"
          descricao="Montando visão consolidada da semana…"
          icon={<FileText className="h-7 w-7" strokeWidth={2} />}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center overflow-x-hidden bg-[#FAFAFA] pb-10">
      <RelatorioDetalheHeader
        titulo="Relatórios Semanais"
        onVoltar={voltarLista}
        subtitulo={subtituloSemana}
        acoes={
          <>
            <button
              type="button"
              onClick={handleGerarPdf}
              className={relatorioNavbarAcaoClass}
            >
              <FileDown className="h-4 w-4" strokeWidth={2} />
              Gerar PDF
            </button>
            <button
              type="button"
              onClick={() => abrirLancamento("financeiro")}
              className={relatorioNavbarAcaoClass}
            >
              <Wallet className="h-4 w-4" strokeWidth={2} />
              Ver financeiro
            </button>
            <MenuNovoLancamento
              aberto={menuNovaAberto}
              onToggle={setMenuNovaAberto}
              onSelecionar={(mod) => abrirLancamento(mod)}
            />
          </>
        }
      />

      <main className="w-full px-[5%] pt-4">
        {erro ? (
          <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
            {erro}
          </p>
        ) : null}

        <RelatorioSemanaDocumento
          semanaInicio={semanaInicio}
          consolidado={consolidado}
          ultimaAtualizacao={ultimaAtualizacao}
        />
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
        periodo={{ ano, mes }}
        lancamentoExistente={lancamentoEdicao}
        semanaInicial={semanaInicio}
      />

      <PdfPreviewModal
        isOpen={Boolean(pdfPreview)}
        onClose={() => setPdfPreview(null)}
        titulo={pdfPreview?.titulo}
        gerador={pdfPreview?.gerador}
        nomeFallback={pdfPreview?.nomeFallback}
      />
    </div>
  );
}
