import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import logo from "../assets/logos/logo sem fundo.png";

export const COR_PRIMARIA = "#DC3B0B";
export const COR_TEXTO = "#111827";
export const COR_MUTED = "#6B7280";
export const COR_DIVISOR = "#E5E7EB";
export const COR_FUNDO = "#FAFAFA";
export const COR_PRIMARIA_SUAVE = "#FEF3EF";
export const COR_SUCESSO = "#047857";
export const COR_ALERTA = "#B45309";

export const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 52,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: COR_TEXTO,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COR_PRIMARIA,
    marginBottom: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 46,
    height: 46,
    objectFit: "contain",
    marginRight: 12,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  docSubtitle: {
    fontSize: 9,
    color: COR_MUTED,
    marginTop: 3,
  },
  docRef: {
    fontSize: 8.5,
    color: COR_PRIMARIA,
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  meta: {
    alignItems: "flex-end",
    minWidth: 150,
  },
  metaLabel: {
    fontSize: 7,
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    marginTop: 2,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  infoChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    minWidth: "22%",
    flexGrow: 1,
  },
  infoChipLabel: {
    fontSize: 7,
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  infoChipValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.6,
    borderBottomColor: COR_DIVISOR,
  },
  sectionSubtitle: {
    fontSize: 8,
    color: COR_MUTED,
    marginBottom: 8,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  metricCard: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    backgroundColor: COR_FUNDO,
    minWidth: "22%",
    flexGrow: 1,
  },
  metricLabel: {
    fontSize: 7,
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    marginTop: 2,
  },
  topicoSection: {
    marginBottom: 10,
    borderWidth: 0.7,
    borderColor: COR_DIVISOR,
    borderRadius: 6,
    overflow: "hidden",
  },
  topicoHeader: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 0.6,
    borderBottomColor: COR_DIVISOR,
    backgroundColor: COR_FUNDO,
  },
  topicoTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  topicoBody: {
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  item: {
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: COR_ALERTA,
  },
  itemText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: COR_TEXTO,
  },
  itemPrazo: {
    fontSize: 7.5,
    color: COR_MUTED,
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
  },
  prosa: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: COR_TEXTO,
  },
  table: {
    borderWidth: 0.7,
    borderColor: COR_DIVISOR,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: COR_PRIMARIA_SUAVE,
    borderBottomWidth: 0.7,
    borderBottomColor: COR_DIVISOR,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeadCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COR_PRIMARIA,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.4,
    borderBottomColor: COR_DIVISOR,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: COR_FUNDO,
  },
  tableCell: {
    fontSize: 8,
    color: COR_TEXTO,
    lineHeight: 1.35,
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  listItem: {
    marginBottom: 4,
    paddingBottom: 2,
  },
  listItemText: {
    fontSize: 8,
    color: COR_TEXTO,
    lineHeight: 1.4,
  },
  subtotalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: COR_FUNDO,
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    marginBottom: 10,
  },
  subtotalLabel: {
    fontSize: 8,
    color: COR_MUTED,
  },
  subtotalValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  modalityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COR_PRIMARIA,
  },
  modalityTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  modalityBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COR_PRIMARIA,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: COR_PRIMARIA_SUAVE,
  },
  empty: {
    fontSize: 9,
    color: COR_MUTED,
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 7.5,
    color: COR_MUTED,
    borderTopWidth: 0.6,
    borderTopColor: COR_DIVISOR,
    paddingTop: 6,
  },
});

export function formatMoeda(valor) {
  const n = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatData(iso) {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  const [ano, mes, dia] = s.split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

export function InfoChip({ label, value }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipLabel}>{label}</Text>
      <Text style={styles.infoChipValue}>{value || "—"}</Text>
    </View>
  );
}

export function ReportHeader({
  titulo,
  subtitulo,
  referencia,
  semanaLabel,
  extraMeta = [],
}) {
  const dataEmissao = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.header} fixed>
      <View style={styles.brand}>
        <Image src={logo} style={styles.logo} />
        <View>
          <Text style={styles.docTitle}>{titulo}</Text>
          <Text style={styles.docSubtitle}>{subtitulo}</Text>
          {referencia ? <Text style={styles.docRef}>{referencia}</Text> : null}
        </View>
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaLabel}>Emissão</Text>
        <Text style={styles.metaValue}>{dataEmissao}</Text>
        {semanaLabel ? (
          <>
            <Text style={styles.metaLabel}>Semana</Text>
            <Text style={styles.metaValue}>{semanaLabel}</Text>
          </>
        ) : null}
        {extraMeta.map(({ label, value }) => (
          <View key={label}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ReportFooter({ titulo, subtitulo }) {
  return (
    <Text
      style={styles.footer}
      render={({ pageNumber, totalPages }) =>
        `${titulo} · ${subtitulo} · pág. ${pageNumber}/${totalPages}`
      }
      fixed
    />
  );
}

export function ReportPage({ children, titulo, subtitulo }) {
  return (
    <Page size="A4" orientation="portrait" style={styles.page}>
      {children}
      <ReportFooter titulo={titulo} subtitulo={subtitulo} />
    </Page>
  );
}
