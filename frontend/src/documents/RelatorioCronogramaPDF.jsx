import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import logo from "../assets/logos/logo sem fundo.png";

const COR_PRIMARIA = "#DC3B0B";
const COR_PRIMARIA_SUAVE = "#FEF3EF";
const COR_TEXTO = "#111827";
const COR_MUTED = "#6B7280";
const COR_DIVISOR = "#E5E7EB";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 52,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COR_TEXTO,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COR_PRIMARIA,
    marginBottom: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", flex: 1 },
  logo: { width: 44, height: 44, objectFit: "contain", marginRight: 10 },
  docTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  docSubtitle: { fontSize: 8.5, color: COR_MUTED, marginTop: 2 },
  docRef: {
    fontSize: 8,
    color: COR_PRIMARIA,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    textTransform: "uppercase",
  },
  meta: { alignItems: "flex-end", minWidth: 130 },
  metaLabel: {
    fontSize: 6.5,
    color: COR_MUTED,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 1,
    marginBottom: 4,
  },
  calSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingBottom: 3,
    marginBottom: 6,
    borderBottomWidth: 0.6,
    borderBottomColor: COR_DIVISOR,
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 8,
  },
  infoChip: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3,
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    minWidth: "30%",
    flexGrow: 1,
  },
  infoChipLabel: {
    fontSize: 6.5,
    color: COR_MUTED,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  infoChipValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },
  calWrap: {
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  calHeadRow: {
    flexDirection: "row",
    backgroundColor: COR_PRIMARIA,
  },
  calHeadCell: {
    flex: 1,
    paddingVertical: 4,
    textAlign: "center",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    borderRightWidth: 0.4,
    borderRightColor: "#C2410C",
  },
  calRow: {
    flexDirection: "row",
    borderTopWidth: 0.4,
    borderTopColor: COR_DIVISOR,
  },
  calCell: {
    flex: 1,
    minHeight: 62,
    padding: 2,
    borderRightWidth: 0.4,
    borderRightColor: COR_DIVISOR,
    backgroundColor: "#FFFFFF",
  },
  calCellMuted: { backgroundColor: "#F9FAFB" },
  calCellHoje: { backgroundColor: COR_PRIMARIA_SUAVE },
  calDayNum: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginBottom: 2,
    color: COR_TEXTO,
  },
  calDayNumMuted: { color: COR_MUTED },
  calDayNumHoje: { color: COR_PRIMARIA },
  calItem: {
    fontSize: 5.5,
    color: "#FFFFFF",
    paddingVertical: 1.5,
    paddingHorizontal: 2,
    marginTop: 1,
    borderRadius: 2,
    lineHeight: 1.15,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 7,
    color: COR_MUTED,
    borderTopWidth: 0.5,
    borderTopColor: COR_DIVISOR,
    paddingTop: 5,
  },
});

function formatarDataHora(raw) {
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoChip({ label, value }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipLabel}>{label}</Text>
      <Text style={styles.infoChipValue}>{value || "—"}</Text>
    </View>
  );
}

export default function RelatorioCronogramaPDF({ dados }) {
  const dataEmissao = new Date().toISOString();
  const obra = dados?.obra || {};
  const resumo = dados?.resumo || [];
  const semanas = dados?.semanas || [];
  const diasSemana = dados?.diasSemana || [];
  const referencia = dados?.referencia || "";

  return (
    <Document
      title="Relatório de Cronograma"
      author="Montezuma Gestão de Obras"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brand}>
            <Image src={logo} style={styles.logo} />
            <View>
              <Text style={styles.docTitle}>Relatório de Cronograma</Text>
              <Text style={styles.docSubtitle}>Montezuma Gestão de Obras</Text>
              {referencia ? (
                <Text style={styles.docRef}>Referência: {referencia}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Emissão</Text>
            <Text style={styles.metaValue}>
              {formatarDataHora(dataEmissao)}
            </Text>
            {obra.local ? (
              <>
                <Text style={styles.metaLabel}>Obra</Text>
                <Text style={styles.metaValue}>{obra.local}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Obra</Text>
          <View style={styles.infoRow}>
            <InfoChip label="Cliente" value={obra.cliente} />
            <InfoChip label="Local" value={obra.local} />
            {obra.endereco ? (
              <InfoChip label="Endereço" value={obra.endereco} />
            ) : null}
            {obra.tipoObra ? (
              <InfoChip label="Tipo" value={obra.tipoObra} />
            ) : null}
          </View>
        </View>

        {resumo.length > 0 ? (
          <View style={styles.calSection}>
            <Text style={styles.sectionTitle}>Cronograma</Text>
            <View style={styles.infoRow}>
              {resumo.map((r) => (
                <InfoChip key={r.label} label={r.label} value={r.value} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.calSection}>
          <Text style={styles.sectionTitle}>Agenda do mês</Text>
          <View style={styles.calWrap}>
            <View style={styles.calHeadRow}>
              {diasSemana.map((nome) => (
                <Text
                  key={nome}
                  style={[
                    styles.calHeadCell,
                    nome === diasSemana[diasSemana.length - 1]
                      ? { borderRightWidth: 0 }
                      : null,
                  ]}
                >
                  {nome}
                </Text>
              ))}
            </View>
            {semanas.map((semana, wi) => (
              <View key={`w-${wi}`} style={styles.calRow}>
                {semana.map((dia, di) => (
                  <View
                    key={dia.dayIso || `d-${wi}-${di}`}
                    style={[
                      styles.calCell,
                      !dia.inMonth ? styles.calCellMuted : null,
                      dia.hoje ? styles.calCellHoje : null,
                      di === 6 ? { borderRightWidth: 0 } : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayNum,
                        !dia.inMonth ? styles.calDayNumMuted : null,
                        dia.hoje ? styles.calDayNumHoje : null,
                      ]}
                    >
                      {dia.dayNum}
                    </Text>
                    {(dia.itens || []).slice(0, 4).map((item, ii) => (
                      <Text
                        key={`${dia.dayIso}-${ii}`}
                        style={[styles.calItem, { backgroundColor: item.cor }]}
                      >
                        {item.texto}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Relatório de Cronograma · Montezuma Gestão de Obras · ${formatarDataHora(dataEmissao)} · pág. ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
