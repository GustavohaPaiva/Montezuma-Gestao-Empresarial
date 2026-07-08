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
const COR_FUNDO = "#FAFAFA";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COR_TEXTO,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: COR_PRIMARIA,
    borderBottomStyle: "solid",
    marginBottom: 18,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 48,
    height: 48,
    objectFit: "contain",
    marginRight: 12,
  },
  docTitle: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    letterSpacing: 0.3,
  },
  docSubtitle: {
    fontSize: 9.5,
    color: COR_MUTED,
    marginTop: 3,
  },
  docRef: {
    fontSize: 9,
    color: COR_PRIMARIA,
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
  },
  meta: {
    alignItems: "flex-end",
    minWidth: 140,
  },
  metaLabel: {
    fontSize: 7.5,
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    marginTop: 2,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COR_PRIMARIA_SUAVE,
    borderWidth: 0.6,
    borderColor: "#F5D0C4",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: COR_PRIMARIA,
    marginTop: 2,
  },
  cardBlock: {
    marginBottom: 12,
  },
  card: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    borderWidth: 0.7,
    borderColor: COR_DIVISOR,
    backgroundColor: COR_FUNDO,
  },
  cardTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COR_PRIMARIA,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  cardLine: {
    fontSize: 9.5,
    color: COR_TEXTO,
    marginBottom: 3,
    lineHeight: 1.35,
  },
  cardMuted: {
    fontSize: 8.5,
    color: COR_MUTED,
    marginBottom: 2,
  },
  section: {
    marginTop: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
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
    gap: 8,
    marginBottom: 4,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    minWidth: "30%",
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
  table: {
    borderWidth: 0.7,
    borderColor: COR_DIVISOR,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: COR_PRIMARIA_SUAVE,
    borderBottomWidth: 0.7,
    borderBottomColor: COR_DIVISOR,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  tableHeadCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COR_PRIMARIA,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COR_DIVISOR,
  },
  tableRowAlt: {
    backgroundColor: COR_FUNDO,
  },
  tableCell: {
    fontSize: 9,
    color: COR_TEXTO,
    lineHeight: 1.3,
  },
  tableCellMuted: {
    fontSize: 8.5,
    color: COR_MUTED,
  },
  colIdx: { width: "6%" },
  colMaterial: { width: "46%" },
  colQtd: { width: "14%", textAlign: "right" },
  colUn: { width: "12%", textAlign: "center" },
  colEntrega: { width: "22%", textAlign: "right" },
  resumoBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: COR_FUNDO,
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resumoText: {
    fontSize: 9,
    color: COR_MUTED,
  },
  resumoDestaque: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  notas: {
    marginTop: 12,
    padding: 10,
    borderRadius: 4,
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    backgroundColor: "#FFFFFF",
  },
  notasTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  notasText: {
    fontSize: 8.5,
    color: COR_MUTED,
    lineHeight: 1.45,
  },
  assinaturas: {
    flexDirection: "row",
    gap: 24,
    marginTop: 22,
  },
  assinatura: {
    flex: 1,
  },
  assinaturaLinha: {
    borderBottomWidth: 0.7,
    borderBottomColor: COR_TEXTO,
    marginBottom: 4,
    height: 28,
  },
  assinaturaLabel: {
    fontSize: 8,
    color: COR_MUTED,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7.5,
    color: COR_MUTED,
    borderTopWidth: 0.6,
    borderTopColor: COR_DIVISOR,
    paddingTop: 6,
  },
});

function formatarData(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  const iso = String(raw).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, day] = iso.split("-");
    return `${day}/${m}/${y}`;
  }
  return d.toLocaleDateString("pt-BR");
}

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

function InfoChip({ label, value }) {
  return (
    <View style={styles.infoChip}>
      <View>
        <Text style={styles.infoChipLabel}>{label}</Text>
        <Text style={styles.infoChipValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function BlocoCard({ titulo, linhas }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{titulo}</Text>
      {linhas.map((linha, i) =>
        linha.muted ? (
          <Text key={i} style={styles.cardMuted}>
            {linha.texto}
          </Text>
        ) : (
          <Text key={i} style={styles.cardLine}>
            {linha.texto}
          </Text>
        ),
      )}
    </View>
  );
}

/**
 * @param {{
 *   numeroOrdem: number | string,
 *   numeroPedido: number | string,
 *   dataEmissao: string,
 *   statusOrdem?: string,
 *   statusPedido?: string,
 *   emitente: { razao: string, documento?: string, endereco?: string, contato?: string },
 *   obra: { cliente?: string, local?: string, endereco?: string },
 *   pedido: { solicitante?: string, created_at?: string },
 *   itens: Array<{ material: string, quantidade: string, unidade: string, entrega: string }>,
 * }} props
 */
export default function OrdemCompraPDF({
  numeroOrdem,
  numeroPedido,
  dataEmissao,
  statusOrdem = "Pendente",
  statusPedido,
  emitente = {},
  obra = {},
  pedido = {},
  itens = [],
}) {
  const totalItens = itens.length;

  return (
    <Document
      title={`Ordem de Compra ${numeroOrdem}`}
      author="Montezuma Gestão de Obras"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image src={logo} style={styles.logo} />
            <View>
              <Text style={styles.docTitle}>Ordem de Compra</Text>
              <Text style={styles.docSubtitle}>
                Montezuma Gestão de Obras
              </Text>
              <Text style={styles.docRef}>
                OC-{String(numeroOrdem).padStart(3, "0")} · Pedido #
                {numeroPedido}
              </Text>
            </View>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Emissão</Text>
            <Text style={styles.metaValue}>{formatarDataHora(dataEmissao)}</Text>
            <Text style={styles.metaLabel}>Status da ordem</Text>
            <Text style={styles.badge}>{statusOrdem || "Pendente"}</Text>
          </View>
        </View>

        <View style={styles.cardBlock}>
          <BlocoCard
            titulo="Emitente"
            linhas={[
              { texto: emitente.razao || "—" },
              ...(emitente.documento
                ? [{ texto: `Doc.: ${emitente.documento}`, muted: true }]
                : []),
              ...(emitente.endereco
                ? [{ texto: emitente.endereco, muted: true }]
                : []),
              ...(emitente.contato
                ? [{ texto: emitente.contato, muted: true }]
                : []),
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Obra e pedido</Text>
          <View style={styles.infoRow}>
            <InfoChip label="Cliente" value={obra.cliente} />
            <InfoChip label="Local da obra" value={obra.local} />
          </View>
          <View style={styles.infoRow}>
            <InfoChip
              label="Solicitante"
              value={pedido.solicitante || "—"}
            />
            <InfoChip
              label="Data do pedido"
              value={formatarData(pedido.created_at)}
            />
            <InfoChip label="Status do pedido" value={statusPedido || "—"} />
          </View>
          {obra.endereco ? (
            <View style={[styles.infoRow, { marginTop: 4 }]}>
              <InfoChip label="Endereço" value={obra.endereco} />
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materiais solicitados</Text>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.tableHeadCell, styles.colIdx]}>#</Text>
              <Text style={[styles.tableHeadCell, styles.colMaterial]}>
                Material
              </Text>
              <Text style={[styles.tableHeadCell, styles.colQtd]}>Qtd.</Text>
              <Text style={[styles.tableHeadCell, styles.colUn]}>Un.</Text>
              <Text style={[styles.tableHeadCell, styles.colEntrega]}>
                Entrega prevista
              </Text>
            </View>
            {itens.map((item, idx) => (
              <View
                key={`${item.material}-${idx}`}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowAlt : null,
                ]}
              >
                <Text style={[styles.tableCell, styles.colIdx]}>{idx + 1}</Text>
                <Text style={[styles.tableCell, styles.colMaterial]}>
                  {item.material}
                </Text>
                <Text style={[styles.tableCell, styles.colQtd]}>
                  {item.quantidade}
                </Text>
                <Text style={[styles.tableCellMuted, styles.colUn]}>
                  {item.unidade}
                </Text>
                <Text style={[styles.tableCell, styles.colEntrega]}>
                  {item.entrega}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.resumoBox}>
            <Text style={styles.resumoText}>Total de itens na ordem</Text>
            <Text style={styles.resumoDestaque}>
              {totalItens} {totalItens === 1 ? "material" : "materiais"}
            </Text>
          </View>
        </View>

        <View style={styles.notas}>
          <Text style={styles.notasTitle}>Observações</Text>
          <Text style={styles.notasText}>
            Documento emitido para formalização do pedido de materiais da obra.
            Os prazos de entrega indicados referem-se às datas previstas no
            pedido. Valores e condições comerciais devem ser acordados
            separadamente, conforme política interna da gestão.
          </Text>
        </View>

        <View style={styles.assinaturas}>
          <View style={styles.assinatura}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaLabel}>Autorização / Emitente</Text>
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Ordem de Compra OC-${String(numeroOrdem).padStart(3, "0")} · Montezuma Gestão de Obras · ${formatarDataHora(dataEmissao)} · pág. ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
