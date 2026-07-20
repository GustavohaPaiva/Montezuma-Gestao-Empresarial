import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import logo from "../assets/logos/logo sem fundo.png";
import { HtmlResumoObraPdf } from "./HtmlResumoObraPdf";

const COR_PRIMARIA = "#DC3B0B";
const COR_TEXTO = "#111827";
const COR_MUTED = "#6B7280";
const COR_DIVISOR = "#E5E7EB";

const styles = StyleSheet.create({
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
  secaoTitulo: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    marginBottom: 8,
  },
  resumoBody: {
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: COR_TEXTO,
    marginBottom: 6,
  },
  heading2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    marginTop: 8,
    marginBottom: 4,
  },
  heading1: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    marginTop: 10,
    marginBottom: 5,
  },
  heading3: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    marginTop: 6,
    marginBottom: 3,
  },
  itemText: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: COR_TEXTO,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  italic: {
    fontFamily: "Helvetica-Oblique",
  },
  underline: {
    textDecoration: "underline",
  },
  strike: {
    textDecoration: "line-through",
  },
  blockquote: {
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: COR_PRIMARIA,
  },
  list: {
    marginBottom: 6,
    paddingLeft: 2,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 3,
    paddingRight: 8,
  },
  listBullet: {
    width: 14,
    fontSize: 9.5,
    color: COR_TEXTO,
  },
  listItemText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.45,
    color: COR_TEXTO,
  },
  empty: {
    fontSize: 9,
    color: COR_MUTED,
    fontStyle: "italic",
    marginBottom: 12,
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

function InfoChip({ label, value }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipLabel}>{label}</Text>
      <Text style={styles.infoChipValue}>{value || "—"}</Text>
    </View>
  );
}

/**
 * PDF do relatório semanal de obra (modalidade obra) — resumo geral em rich text.
 */
export default function RelatorioDiretoriaObraPDF({
  titulo = "Relatório de Obra",
  subtitulo = "Montezuma Gestão Empresarial",
  referencia,
  semanaLabel,
  resumoHtml = "",
}) {
  const dataEmissao = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document title={titulo} author="Montezuma Gestão Empresarial">
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brand}>
            <Image src={logo} style={styles.logo} />
            <View>
              <Text style={styles.docTitle}>{titulo}</Text>
              <Text style={styles.docSubtitle}>{subtitulo}</Text>
              {referencia ? (
                <Text style={styles.docRef}>{referencia}</Text>
              ) : null}
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
          </View>
        </View>

        <View style={styles.infoRow}>
          <InfoChip label="Escopo" value="Geral da semana" />
          {semanaLabel ? (
            <InfoChip label="Período" value={semanaLabel} />
          ) : null}
        </View>

        <Text style={styles.secaoTitulo}>Resumo geral</Text>
        <HtmlResumoObraPdf html={resumoHtml} styles={styles} />

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${titulo} · ${subtitulo} · pág. ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
