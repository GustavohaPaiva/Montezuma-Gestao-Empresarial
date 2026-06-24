import { Document, Text, View } from "@react-pdf/renderer";
import { TIPOS_EXTRATO } from "../pages/relatorios-diretoria/relatorioFinanceiroUtils";
import {
  InfoChip,
  ReportHeader,
  ReportPage,
  formatData,
  formatMoeda,
  styles,
} from "./RelatorioDiretoriaPdfShared";

const SUBTITULO = "Relatórios da Diretoria · Montezuma Gestão de Obras";

function MetricCard({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>R$ {formatMoeda(value)}</Text>
    </View>
  );
}

function descricaoItem(item) {
  if (item.origem === "material") {
    return item.fornecedor
      ? `${item.material || item.descricao} (${item.fornecedor})`
      : item.material || item.descricao || "—";
  }
  if (item.origem === "mao_de_obra") {
    return `${item.servico || "Serviço"} — ${item.profissional || "—"}`;
  }
  if (item.origem === "locacao") {
    return item.equipamento || item.descricao || "—";
  }
  return item.descricao || "—";
}

function agruparPorTipo(itens) {
  const mapa = new Map();
  (itens || []).forEach((item) => {
    const tipo = item.tipo || "Outros";
    if (!mapa.has(tipo)) mapa.set(tipo, []);
    mapa.get(tipo).push(item);
  });

  const ordenados = [];
  TIPOS_EXTRATO.forEach((tipo) => {
    if (mapa.has(tipo)) {
      ordenados.push({ tipo, itens: mapa.get(tipo) });
      mapa.delete(tipo);
    }
  });
  mapa.forEach((grupo, tipo) => {
    ordenados.push({ tipo, itens: grupo });
  });
  return ordenados;
}

function TabelaFinanceira({ tipo, itens }) {
  if (!itens?.length) return null;

  const subtotal = itens.reduce(
    (acc, i) => acc + (parseFloat(i.valor) || 0),
    0,
  );

  return (
    <View wrap={false}>
      <Text style={[styles.sectionTitle, { fontSize: 9, marginBottom: 4 }]}>
        {tipo}
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadCell, { width: "38%" }]}>
            Descrição
          </Text>
          <Text style={[styles.tableHeadCell, { width: "14%" }]}>Data</Text>
          <Text style={[styles.tableHeadCell, { width: "18%" }]}>Valor</Text>
          <Text style={[styles.tableHeadCell, { width: "30%" }]}>Status</Text>
        </View>
        {itens.map((item, idx) => (
          <View
            key={item.id ?? `${tipo}-${idx}`}
            style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : null]}
          >
            <Text style={[styles.tableCell, { width: "38%" }]}>
              {descricaoItem(item)}
            </Text>
            <Text style={[styles.tableCell, { width: "14%" }]}>
              {formatData(item.data)}
            </Text>
            <Text style={[styles.tableCellBold, { width: "18%" }]}>
              R$ {formatMoeda(item.valor)}
            </Text>
            <Text style={[styles.tableCell, { width: "30%" }]}>
              {item.status || "—"}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.subtotalBar}>
        <Text style={styles.subtotalLabel}>
          Subtotal {tipo} · {itens.length} item(ns)
        </Text>
        <Text style={styles.subtotalValue}>R$ {formatMoeda(subtotal)}</Text>
      </View>
    </View>
  );
}

function BlocoClassificacao({ titulo, subtitulo, itens }) {
  const grupos = agruparPorTipo(itens);
  if (!grupos.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{titulo}</Text>
      {subtitulo ? (
        <Text style={styles.sectionSubtitle}>{subtitulo}</Text>
      ) : null}
      {grupos.map(({ tipo, itens: grupo }) => (
        <TabelaFinanceira key={tipo} tipo={tipo} itens={grupo} />
      ))}
    </View>
  );
}

function ResumoCategorias({ porCategoria }) {
  const categorias = TIPOS_EXTRATO.filter(
    (tipo) => (porCategoria?.[tipo]?.count || 0) > 0,
  );
  if (!categorias.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Por categoria</Text>
      <Text style={styles.sectionSubtitle}>
        Subtotais da semana por tipo de lançamento
      </Text>
      <View style={styles.metricGrid}>
        {categorias.map((tipo) => {
          const cat = porCategoria[tipo];
          return (
            <View key={tipo} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{tipo}</Text>
              <Text style={styles.metricValue}>R$ {formatMoeda(cat.total)}</Text>
              <Text style={[styles.sectionSubtitle, { marginTop: 3, marginBottom: 0 }]}>
                {cat.count} lançamento(s)
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function RelatorioDiretoriaFinanceiroPDF({
  titulo = "Relatório Financeiro",
  referencia = "Situação financeira da semana",
  obra,
  semanaLabel,
  resumo,
}) {
  const totais = resumo?.totais || {};

  return (
    <Document title={titulo} author="Montezuma Gestão de Obras">
      <ReportPage titulo={titulo} subtitulo={SUBTITULO}>
        <ReportHeader
          titulo={titulo}
          subtitulo={SUBTITULO}
          referencia={referencia}
          semanaLabel={semanaLabel}
        />

        {obra ? (
          <View style={styles.infoRow}>
            {obra.cliente ? (
              <InfoChip label="Cliente" value={obra.cliente} />
            ) : null}
            {obra.local ? <InfoChip label="Local" value={obra.local} /> : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo da semana</Text>
          <View style={styles.metricGrid}>
            <MetricCard label="A cobrar" value={totais.aCobrar} />
            <MetricCard label="Pago" value={totais.pago} />
            <MetricCard label="Aguardando" value={totais.aguardando} />
            <MetricCard label="Em espera" value={totais.emEspera} />
          </View>
        </View>

        <ResumoCategorias porCategoria={resumo?.porCategoria} />

        <BlocoClassificacao
          titulo="A cobrar do cliente"
          subtitulo="Itens consolidados no extrato financeiro desta semana"
          itens={resumo?.extratoSemana}
        />

        <BlocoClassificacao
          titulo="Em espera"
          subtitulo="Lançamentos ainda não consolidados no extrato"
          itens={resumo?.emEsperaSemana}
        />
      </ReportPage>
    </Document>
  );
}
