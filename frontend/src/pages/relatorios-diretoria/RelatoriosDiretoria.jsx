import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Eye,
  FileText,
  Hammer,
  HardHat,
  MapPin,
} from "lucide-react";
import Navbar from "../../components/navbar/Navbar";
import BaseCard from "../../components/cards/BaseCard";
import BaseButton from "../../components/gerais/BaseButton";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import { api } from "../../services/api";
import {
  filtrarObrasRelatorio,
  ordenarObrasPorStatus,
  periodoAtual,
  statusThemeObra,
} from "./relatoriosDiretoriaUtils";
import {
  badgeStatusObra,
  relatorioMetricGridClass,
  relatorioObrasGridClass,
} from "./relatoriosDiretoriaUi";

export default function RelatoriosDiretoria() {
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [contagemMes, setContagemMes] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");
  const [showElements, setShowElements] = useState(false);

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain] = useScrollFadeIn();

  const periodo = periodoAtual();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, contagem] = await Promise.all([
        api.getObrasParaRelatorios(),
        api.getContagemRelatoriosDiretoriaMes(periodo.ano, periodo.mes),
      ]);
      setObras(lista || []);
      setContagemMes(contagem || {});
      setErro(null);
    } catch (e) {
      console.error("[RelatoriosDiretoria] carregar:", e);
      setErro(e?.message || "Não foi possível carregar as obras.");
      setObras([]);
      setContagemMes({});
    } finally {
      setLoading(false);
    }
  }, [periodo.ano, periodo.mes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(t);
    }
    setShowElements(false);
  }, [loading]);

  const metricas = useMemo(() => {
    const emAndamento = obras.filter((o) => o.status === "Em andamento").length;
    const totalRelatorios = Object.values(contagemMes).reduce(
      (acc, n) => acc + n,
      0,
    );
    return {
      total: obras.length,
      emAndamento,
      totalRelatorios,
      obrasComLancamentos: Object.keys(contagemMes).length,
    };
  }, [obras, contagemMes]);

  const obrasVisiveis = useMemo(() => {
    const filtradas = filtrarObrasRelatorio(obras, { busca, filtroStatus });
    return ordenarObrasPorStatus(filtradas);
  }, [obras, busca, filtroStatus]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
      <div
        ref={refNav}
        className={`w-full transition-all duration-500 ease-out ${
          isNavVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Navbar
          title="Relatórios"
          filters={[
            <BaseInput
              key="busca-relatorios"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente, local ou status…"
              className="min-w-[220px]"
            />,
            <BaseSelect
              key="filtro-status-relatorios"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              options={[
                { value: "Tudo", label: "Todos os status" },
                { value: "Em andamento", label: "Em andamento" },
                {
                  value: "Aguardando iniciação",
                  label: "Aguardando iniciação",
                },
                { value: "Concluída", label: "Concluídas" },
              ]}
            />,
          ]}
        />
      </div>

      {loading ? (
        <LoadingPainel
          titulo="Carregando obras"
          descricao="Buscando obras ativas e relatórios do mês…"
          icon={<ClipboardList className="h-7 w-7" strokeWidth={2} />}
        />
      ) : (
        <main
          ref={refMain}
          className={`w-[90%] pb-12 transition-all duration-700 ease-out ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          {erro ? (
            <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
              {erro}
            </p>
          ) : null}

          {obras.length > 0 ? (
            <section className={`mb-8 w-full ${relatorioMetricGridClass}`}>
              <BaseCard
                variant="metric"
                title="Obras ativas"
                value={String(metricas.total)}
                icon={<HardHat className="h-5 w-5" />}
                colorTheme="blue"
              />
              <BaseCard
                variant="metric"
                title="Em andamento"
                value={String(metricas.emAndamento)}
                icon={<Hammer className="h-5 w-5" />}
                colorTheme="amber"
              />
              <BaseCard
                variant="metric"
                title="Relatórios no mês"
                value={String(metricas.totalRelatorios)}
                icon={<FileText className="h-5 w-5" />}
                colorTheme="pink"
              />
              <BaseCard
                variant="metric"
                title="Obras com lançamentos"
                value={String(metricas.obrasComLancamentos)}
                icon={<ClipboardList className="h-5 w-5" />}
                colorTheme="primary"
              />
            </section>
          ) : null}

          {obras.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-primary/40 bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/[0.03]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
                <HardHat className="h-7 w-7" strokeWidth={2} />
              </div>
              <p className="text-base font-semibold text-text-primary">
                Nenhuma obra ativa encontrada
              </p>
              <p className="mt-2 text-sm text-text-muted">
                Cadastre obras no módulo Obras para começar a lançar relatórios.
              </p>
            </div>
          ) : obrasVisiveis.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border-primary/40 bg-white px-4 py-10 text-center text-sm text-text-muted shadow-sm ring-1 ring-black/[0.03]">
              Nenhuma obra corresponde aos filtros aplicados.
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs font-medium text-text-muted">
                {obrasVisiveis.length} de {obras.length} obra
                {obras.length !== 1 ? "s" : ""}
              </p>
              <div className={relatorioObrasGridClass}>
                {obrasVisiveis.map((obra, index) => {
                  const cliente = obra.clientes?.nome || obra.cliente;
                  const qtdRelatorios = contagemMes[obra.id] || 0;
                  return (
                    <div
                      key={obra.id}
                      className={`flex w-full justify-center transition-all duration-700 ease-out ${
                        showElements
                          ? "translate-y-0 opacity-100"
                          : "translate-y-8 opacity-0"
                      }`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <BaseCard
                        variant="entity"
                        colorTheme={statusThemeObra(obra.status)}
                        title={cliente || "Cliente não informado"}
                        value={obra.local || "Local não informado"}
                        statusElement={
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${badgeStatusObra(obra.status)}`}
                          >
                            {obra.status || "—"}
                          </span>
                        }
                        metadata={[
                          {
                            icon: (
                              <FileText className="h-3.5 w-3.5 text-text-muted" />
                            ),
                            label: `${qtdRelatorios} relatório${qtdRelatorios !== 1 ? "s" : ""} no mês`,
                          },
                          {
                            icon: (
                              <MapPin className="h-3.5 w-3.5 text-text-muted" />
                            ),
                            label: obra.local || "—",
                          },
                        ]}
                        onClick={() =>
                          navigate(`/relatorios-diretoria/${obra.id}`)
                        }
                      >
                        <BaseButton
                          variant="outline"
                          size="sm"
                          fullWidth
                          icon={<Eye className="h-3.5 w-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/relatorios-diretoria/${obra.id}`);
                          }}
                        >
                          Ver relatórios
                        </BaseButton>
                      </BaseCard>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}
