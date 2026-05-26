import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import logo from "../assets/logos/logo sem fundo.png";

// Paleta espelhada da OrdemCompraPDF/FichaClientePDF — visual premium Montezuma.
const COR_PRIMARIA = "#DC3B0B";
const COR_PRIMARIA_SUAVE = "#FEF3EF";
const COR_TEXTO = "#111827";
const COR_MUTED = "#6B7280";
const COR_DIVISOR = "#E5E7EB";
const COR_FUNDO = "#FAFAFA";
const COR_SUCESSO = "#047857";
const COR_SUCESSO_SUAVE = "#ECFDF5";
const COR_ALERTA = "#B45309";
const COR_ALERTA_SUAVE = "#FFFBEB";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 58,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: COR_TEXTO,
  },
  // ─── Cabeçalho ──────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COR_PRIMARIA,
    borderBottomStyle: "solid",
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
    letterSpacing: 0.3,
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
  // ─── Bloco da obra ──────────────────────────────────────────────────────
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    paddingBottom: 4,
    marginBottom: 8,
    borderBottomWidth: 0.7,
    borderBottomColor: COR_DIVISOR,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
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
  // ─── Resumo (KPIs) ──────────────────────────────────────────────────────
  resumoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  resumoCard: {
    flexGrow: 1,
    flexBasis: "23%",
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    alignItems: "center",
  },
  resumoCardLabel: {
    fontSize: 7,
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: "center",
  },
  resumoCardValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    textAlign: "center",
  },
  resumoCardDestaque: {
    color: COR_PRIMARIA,
  },
  resumoCardSucesso: {
    color: COR_SUCESSO,
    backgroundColor: COR_SUCESSO_SUAVE,
  },
  resumoCardAlerta: {
    color: COR_ALERTA,
    backgroundColor: COR_ALERTA_SUAVE,
  },
  // ─── Tabela ─────────────────────────────────────────────────────────────
  table: {
    borderWidth: 0.7,
    borderColor: COR_DIVISOR,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: COR_PRIMARIA_SUAVE,
    borderBottomWidth: 0.7,
    borderBottomColor: COR_DIVISOR,
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  tableHeadCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COR_PRIMARIA,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottomWidth: 0.4,
    borderBottomColor: COR_DIVISOR,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: COR_FUNDO,
  },
  tableCell: {
    fontSize: 8.5,
    color: COR_TEXTO,
    lineHeight: 1.3,
    textAlign: "center",
  },
  tableCellMuted: {
    fontSize: 8,
    color: COR_MUTED,
    textAlign: "center",
  },
  toneSuccess: {
    color: COR_SUCESSO,
    fontFamily: "Helvetica-Bold",
  },
  toneWarning: {
    color: COR_ALERTA,
    fontFamily: "Helvetica-Bold",
  },
  toneDanger: {
    color: "#B91C1C",
    fontFamily: "Helvetica-Bold",
  },
  tonePrimary: {
    color: COR_PRIMARIA,
    fontFamily: "Helvetica-Bold",
  },
  pillCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pillSuccess: {
    backgroundColor: COR_SUCESSO_SUAVE,
    color: COR_SUCESSO,
  },
  pillWarning: {
    backgroundColor: COR_ALERTA_SUAVE,
    color: COR_ALERTA,
  },
  pillMuted: {
    backgroundColor: "#F3F4F6",
    color: COR_MUTED,
  },
  empty: {
    padding: 24,
    textAlign: "center",
    color: COR_MUTED,
    fontSize: 9,
  },
  // ─── Destaque final (TOTAL GERAL) ───────────────────────────────────────
  totalCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 6,
    backgroundColor: COR_PRIMARIA,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalCardLabel: {
    fontSize: 9,
    color: "#FDE8DE",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontFamily: "Helvetica-Bold",
  },
  totalCardValue: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  // Linha de sub-totais (Pago/Pendente etc.) ao lado/abaixo do total grande
  totaisLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  totaisChip: {
    flexGrow: 1,
    flexBasis: "30%",
    padding: 8,
    borderRadius: 4,
    backgroundColor: COR_FUNDO,
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    alignItems: "center",
  },
  totaisChipLabel: {
    fontSize: 7,
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totaisChipValue: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  totaisChipSuccess: {
    color: COR_SUCESSO,
  },
  totaisChipWarning: {
    color: COR_ALERTA,
  },
  // ─── Rodapé ─────────────────────────────────────────────────────────────
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

function formatarDataHora(raw) {
  if (!raw) return "—";
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

function tomToStyle(tone) {
  switch (tone) {
    case "success":
      return styles.toneSuccess;
    case "warning":
      return styles.toneWarning;
    case "danger":
      return styles.toneDanger;
    case "primary":
      return styles.tonePrimary;
    case "muted":
      return styles.tableCellMuted;
    default:
      return null;
  }
}

function pillStyle(tone) {
  switch (tone) {
    case "success":
      return styles.pillSuccess;
    case "warning":
      return styles.pillWarning;
    default:
      return styles.pillMuted;
  }
}

function totaisChipTone(tone) {
  if (tone === "success") return styles.totaisChipSuccess;
  if (tone === "warning") return styles.totaisChipWarning;
  return null;
}

function InfoChip({ label, value }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipLabel}>{label}</Text>
      <Text style={styles.infoChipValue}>{value || "—"}</Text>
    </View>
  );
}

function ResumoCard({ label, value, tone }) {
  const toneStyle =
    tone === "success"
      ? styles.resumoCardSucesso
      : tone === "warning"
        ? styles.resumoCardAlerta
        : tone === "destaque"
          ? styles.resumoCardDestaque
          : null;
  return (
    <View
      style={[
        styles.resumoCard,
        tone === "success" || tone === "warning" ? toneStyle : null,
      ]}
    >
      <Text style={styles.resumoCardLabel}>{label}</Text>
      <Text
        style={[
          styles.resumoCardValue,
          tone === "destaque" ? toneStyle : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Cell({ value, columnStyle }) {
  if (value == null) {
    return <Text style={[styles.tableCell, columnStyle]}>—</Text>;
  }
  if (typeof value === "object") {
    const { text, tone, kind } = value;
    if (kind === "pill") {
      return (
        <View style={[styles.pillCell, columnStyle]}>
          <Text style={[styles.pill, pillStyle(tone)]}>{text || "—"}</Text>
        </View>
      );
    }
    return (
      <Text style={[styles.tableCell, columnStyle, tomToStyle(tone)]}>
        {text || "—"}
      </Text>
    );
  }
  return (
    <Text style={[styles.tableCell, columnStyle]}>
      {String(value) || "—"}
    </Text>
  );
}

/**
 * Componente PDF reutilizável para os relatórios da obra — visual premium Montezuma.
 * Sempre A4 em PORTRAIT (vertical). Todas as colunas centralizadas.
 *
 * @param {{
 *   titulo: string,
 *   subtitulo?: string,
 *   referencia?: string,
 *   obra?: { cliente?: string, local?: string, endereco?: string },
 *   info?: Array<{ label: string, value: string }>,
 *   resumo?: Array<{ label: string, value: string, tone?: "success"|"warning"|"destaque" }>,
 *   colunas: Array<{ key: string, label: string, width: string }>,
 *   linhas: Array<Array<string|number|{text:string,tone?:string,kind?:string}>>,
 *   totalDestaque?: { label: string, value: string },
 *   totais?: Array<{ label: string, value: string, tone?: "success"|"warning" }>,
 * }} props
 */
export default function RelatorioObraPDF({
  titulo,
  subtitulo = "Montezuma Gestão de Obras",
  referencia,
  obra,
  info = [],
  resumo = [],
  colunas,
  linhas = [],
  totalDestaque,
  totais = [],
}) {
  const dataEmissao = new Date().toISOString();

  return (
    <Document title={titulo} author="Montezuma Gestão de Obras">
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
            <Text style={styles.metaValue}>{formatarDataHora(dataEmissao)}</Text>
            {obra?.local ? (
              <>
                <Text style={styles.metaLabel}>Obra</Text>
                <Text style={styles.metaValue}>{obra.local}</Text>
              </>
            ) : null}
          </View>
        </View>

        {obra && (obra.cliente || obra.local || obra.endereco) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Obra</Text>
            <View style={styles.infoRow}>
              {obra.cliente ? (
                <InfoChip label="Cliente" value={obra.cliente} />
              ) : null}
              {obra.local ? (
                <InfoChip label="Local" value={obra.local} />
              ) : null}
              {obra.endereco ? (
                <InfoChip label="Endereço" value={obra.endereco} />
              ) : null}
            </View>
            {info.length > 0 ? (
              <View style={styles.infoRow}>
                {info.map((i, idx) => (
                  <InfoChip key={idx} label={i.label} value={i.value} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {resumo.length > 0 ? (
          <View style={styles.resumoGrid}>
            {resumo.map((r, idx) => (
              <ResumoCard
                key={idx}
                label={r.label}
                value={r.value}
                tone={r.tone}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.table}>
          <View style={styles.tableHead} fixed>
            {colunas.map((c) => (
              <Text
                key={c.key}
                style={[styles.tableHeadCell, { width: c.width }]}
              >
                {c.label}
              </Text>
            ))}
          </View>
          {linhas.length === 0 ? (
            <Text style={styles.empty}>
              Nenhum registro disponível para esta seleção.
            </Text>
          ) : (
            linhas.map((linha, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowAlt : null,
                ]}
                wrap={false}
              >
                {colunas.map((c, ci) => (
                  <Cell
                    key={c.key}
                    value={linha[ci]}
                    columnStyle={{ width: c.width }}
                  />
                ))}
              </View>
            ))
          )}
        </View>

        {totalDestaque ? (
          <View style={styles.totalCard} wrap={false}>
            <Text style={styles.totalCardLabel}>
              {totalDestaque.label || "Total Geral"}
            </Text>
            <Text style={styles.totalCardValue}>{totalDestaque.value}</Text>
          </View>
        ) : null}

        {totais.length > 0 ? (
          <View style={styles.totaisLinha} wrap={false}>
            {totais.map((t, idx) => (
              <View key={idx} style={styles.totaisChip}>
                <Text style={styles.totaisChipLabel}>{t.label}</Text>
                <Text
                  style={[styles.totaisChipValue, totaisChipTone(t.tone)]}
                >
                  {t.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${titulo} · ${subtitulo} · ${formatarDataHora(dataEmissao)} · pág. ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
