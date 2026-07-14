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
const COR_TEXTO = "#111827";
const COR_MUTED = "#6B7280";
const COR_DIVISOR = "#E5E7EB";
const COR_FUNDO = "#FAFAFA";
const COR_AMBER = "#D97706";

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
  topicoSection: {
    marginBottom: 12,
    borderWidth: 0.7,
    borderColor: COR_DIVISOR,
    borderRadius: 6,
    overflow: "hidden",
  },
  topicoHeader: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.6,
    borderBottomColor: COR_DIVISOR,
    backgroundColor: COR_FUNDO,
  },
  topicoTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  topicoCount: {
    fontSize: 8,
    color: COR_MUTED,
    marginTop: 2,
  },
  topicoBody: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  item: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: COR_AMBER,
  },
  itemText: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: COR_TEXTO,
  },
  itemPrazo: {
    fontSize: 8,
    color: COR_MUTED,
    marginTop: 3,
    fontFamily: "Helvetica-Bold",
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
 * PDF do relatório semanal de obra (modalidade obra) — espelha a visão detalhada do site.
 */
export default function RelatorioDiretoriaObraPDF({
  titulo = "Relatório de Obra",
  subtitulo = "Montezuma Gestão Empresarial",
  referencia,
  semanaLabel,
  topicos = [],
}) {
  const dataEmissao = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const topicosPreenchidos = topicos.filter(
    (topico) => (topico.itens?.length || 0) > 0,
  );

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

        {topicosPreenchidos.length === 0 ? (
          <Text style={styles.empty}>Nenhum item registrado nesta semana.</Text>
        ) : (
          topicosPreenchidos.map((topico) => (
            <View key={topico.id} style={styles.topicoSection}>
              <View style={styles.topicoHeader}>
                <Text style={styles.topicoTitle}>{topico.label}</Text>
                <Text style={styles.topicoCount}>
                  {topico.itens.length} item
                  {topico.itens.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.topicoBody}>
                {topico.itens.map((item) => (
                  <View key={item.id} style={styles.item}>
                    <Text style={styles.itemText}>{item.texto}</Text>
                    {item.prazoLabel ? (
                      <Text style={styles.itemPrazo}>
                        Prazo: {item.prazoLabel}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

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
