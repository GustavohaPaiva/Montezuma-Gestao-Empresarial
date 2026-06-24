import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ClipboardList,
  CircleDollarSign,
  HardHat,
  Layers,
  ShoppingCart,
} from "lucide-react";
import ModuleHub from "../../components/gerais/ModuleHub";
import { homeDictionary } from "../../constants/dictionaries";
import { api } from "../../services/api";
import { useObraById } from "./detalhe/hooks/useObraById";
import { verificarStatusPagamento } from "./utils/obraPagamento";
import { periodoAtual } from "../relatorios-diretoria/relatoriosDiretoriaUtils";

const d = homeDictionary;
const hub = d.obraHub;
const dest = d.modulos.destaques;

function contarEtapasConcluidas(etapas = []) {
  if (!Array.isArray(etapas) || etapas.length === 0) return "—";
  const concluidas = etapas.filter((etapa) => {
    const progresso = Number(etapa?.progresso) || 0;
    const status = String(etapa?.status || "").toLowerCase();
    return (
      progresso === 100 || status === "concluído" || status === "concluido"
    );
  }).length;
  return `${concluidas}/${etapas.length}`;
}

function formatarDataInicio(dataValue) {
  if (!dataValue) return null;
  const data = new Date(dataValue);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function nomeResponsavel(obra) {
  const nomes = [
    obra?.responsavel?.nome,
    obra?.usuarios?.nome,
    obra?.responsavel_nome,
  ];
  const nome = nomes.find((value) => value != null && String(value).trim());
  return nome ? String(nome).trim() : null;
}

export default function ObraHub() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obra, fetchDados } = useObraById(id);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [pedidosCount, setPedidosCount] = useState(0);
  const [relatoriosMes, setRelatoriosMes] = useState(0);

  const carregarExtras = useCallback(async () => {
    if (!id) return;
    setLoadingExtra(true);
    try {
      const periodo = periodoAtual();
      const [pedidos, contagem] = await Promise.all([
        api.getObraPedidos(id),
        api.getContagemRelatoriosDiretoriaMes(periodo.ano, periodo.mes),
      ]);
      setPedidosCount(Array.isArray(pedidos) ? pedidos.length : 0);
      setRelatoriosMes(contagem?.[id] ?? contagem?.[String(id)] ?? 0);
    } catch (error) {
      console.error("[ObraHub] carregarExtras:", error);
      setPedidosCount(0);
      setRelatoriosMes(0);
    } finally {
      setLoadingExtra(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDados();
  }, [fetchDados]);

  useEffect(() => {
    void carregarExtras();
  }, [carregarExtras]);

  const loading = !obra || loadingExtra;

  const nomeCliente = obra?.clientes?.nome || obra?.cliente || "Obra";
  const local = obra?.local || "Local não informado";
  const responsavel = nomeResponsavel(obra);
  const dataInicio = formatarDataInicio(obra?.data);
  const financeiroPago = obra ? verificarStatusPagamento(obra) : null;

  const subtituloPartes = [
    obra?.status,
    responsavel ? `Resp.: ${responsavel}` : null,
    dataInicio ? `Início: ${dataInicio}` : null,
  ].filter(Boolean);

  const resumo = useMemo(
    () => [
      {
        id: "financeiro",
        label: hub.metricFinanceiro,
        value:
          financeiroPago == null
            ? "—"
            : financeiroPago
              ? hub.financeiroPago
              : hub.financeiroPendente,
        icon: <CircleDollarSign className="h-5 w-5" />,
        theme: financeiroPago ? "emerald" : "amber",
      },
      {
        id: "etapas",
        label: hub.metricEtapas,
        value: contarEtapasConcluidas(obra?.etapas_selecionadas),
        icon: <Layers className="h-5 w-5" />,
        theme: "indigo",
      },
      {
        id: "pedidos",
        label: hub.metricPedidos,
        value: pedidosCount,
        icon: <ShoppingCart className="h-5 w-5" />,
        theme: "primary",
      },
      {
        id: "relatorios",
        label: hub.metricRelatorios,
        value: relatoriosMes,
        icon: <ClipboardList className="h-5 w-5" />,
        theme: "pink",
      },
    ],
    [financeiroPago, obra?.etapas_selecionadas, pedidosCount, relatoriosMes],
  );

  const acessos = useMemo(
    () => [
      {
        id: "detalhes",
        titulo: hub.acessoDetalhes,
        descricao: hub.acessoDetalhesDescricao,
        destaques: dest.obras,
        colorTheme: "amber",
        Icon: HardHat,
        onClick: () => navigate(`/obrasD/${id}`),
      },
      {
        id: "relatorios",
        titulo: hub.acessoRelatorios,
        descricao: hub.acessoRelatoriosDescricao,
        destaques: ["Semanal", "Por obra", "Consolidado"],
        colorTheme: "pink",
        Icon: ClipboardList,
        onClick: () => navigate(`/relatorios-diretoria/${id}`),
      },
    ],
    [id, navigate],
  );

  return (
    <ModuleHub
      eyebrow={hub.eyebrow}
      titulo={`${nomeCliente} · ${local}`}
      subtitulo={subtituloPartes.join(" · ")}
      onVoltar={() => navigate("/obras")}
      resumo={resumo}
      resumoLoading={loadingExtra}
      acessos={acessos}
      loading={loading}
      loadingTitulo={hub.loadingTitulo}
      loadingDescricao={hub.loadingDescricao}
      loadingIcon={<HardHat className="h-7 w-7" strokeWidth={2} />}
    />
  );
}
