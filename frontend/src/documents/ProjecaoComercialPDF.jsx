import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import logo from "../assets/logos/logo sem fundo.png";
import {
  calcularTotalProjecao,
  formatarDataProjecao,
  formatarMoedaProjecao,
  formatarPeriodoProjecao,
  labelTipoProjecaoItem,
  normalizarItensProjecao,
  sincronizarProjecaoComItens,
} from "../utils/projecaoUtils";

function textoPreenchido(valor) {
  if (valor == null) return false;
  const s = String(valor).trim();
  return s.length > 0 && s !== "—";
}

function valorEtapaPositivo(valor) {
  return (parseFloat(valor) || 0) > 0;
}

const COR_PRIMARIA = "#DC3B0B";
const COR_TEXTO = "#111827";
const COR_MUTED = "#6B7280";
const COR_DIVISOR = "#E5E7EB";
const COR_FUNDO = "#FAFAFA";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COR_TEXTO,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COR_PRIMARIA,
    marginBottom: 18,
  },
  logo: { width: 48, height: 48, objectFit: "contain", marginRight: 10 },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", color: COR_TEXTO },
  subtitle: { fontSize: 9, color: COR_MUTED, marginTop: 2 },
  meta: { alignItems: "flex-end" },
  metaLabel: {
    fontSize: 7,
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
    marginBottom: 4,
  },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.6,
    borderBottomColor: COR_DIVISOR,
  },
  infoRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    minWidth: "30%",
    flexGrow: 1,
  },
  chipLabel: {
    fontSize: 7,
    color: COR_MUTED,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  chipValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  table: {
    borderWidth: 0.6,
    borderColor: COR_DIVISOR,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#FEF3EF",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.6,
    borderBottomColor: COR_DIVISOR,
  },
  tableHeadCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COR_PRIMARIA,
    textTransform: "uppercase",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.4,
    borderBottomColor: COR_DIVISOR,
    alignItems: "center",
  },
  tableRowAlt: { backgroundColor: COR_FUNDO },
  tableCell: { fontSize: 8.5, textAlign: "center" },
  tableCellLeft: { fontSize: 8.5, textAlign: "left" },
  valorLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.4,
    borderBottomColor: COR_DIVISOR,
  },
  valorLinhaLabel: { fontSize: 9, color: COR_TEXTO },
  valorLinhaValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  totalBar: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 0.8,
    borderTopColor: COR_PRIMARIA,
  },
  totalLabel: {
    fontSize: 8,
    color: COR_MUTED,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  totalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COR_PRIMARIA,
  },
  obs: { fontSize: 9, color: COR_MUTED, lineHeight: 1.35, marginTop: 6 },
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

function Chip({ label, value }) {
  if (!textoPreenchido(value)) return null;
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{String(value).trim()}</Text>
    </View>
  );
}

function ChipDataProposta({ label, dataString }) {
  if (!textoPreenchido(dataString)) return null;
  const formatada = formatarDataProjecao(dataString);
  if (!textoPreenchido(formatada)) return null;
  return <Chip label={label} value={formatada} />;
}

function LinhaValor({ label, valor }) {
  if (!valorEtapaPositivo(valor)) return null;
  return (
    <View style={styles.valorLinha}>
      <Text style={styles.valorLinhaLabel}>{label}</Text>
      <Text style={styles.valorLinhaValue}>
        R$ {formatarMoedaProjecao(valor)}
      </Text>
    </View>
  );
}

function InfoRow({ children }) {
  const visiveis = (Array.isArray(children) ? children : [children]).filter(
    Boolean,
  );
  if (visiveis.length === 0) return null;
  return <View style={styles.infoRow}>{visiveis}</View>;
}

export default function ProjecaoComercialPDF({ projecao = {} }) {
  const p = sincronizarProjecaoComItens(projecao || {});
  const itens = normalizarItensProjecao(p.itens).filter((item) =>
    textoPreenchido(item.descricao),
  );
  const totalGeral = calcularTotalProjecao({ ...p, itens });
  const dataEmissao = new Date().toISOString();

  const etapasComValor = [
    { label: "Documentação", valor: p.valor_documentacao },
    { label: "Projeto", valor: p.valor_projeto },
    { label: "Obra", valor: p.valor_obra },
  ].filter((e) => valorEtapaPositivo(e.valor));

  const temIdentificacao =
    textoPreenchido(p.nome) ||
    textoPreenchido(p.cliente_nome) ||
    textoPreenchido(p.contato) ||
    textoPreenchido(p.data_proposta) ||
    textoPreenchido(p.endereco_obra) ||
    textoPreenchido(p.descricao);

  return (
    <Document
      title={`Proposta — ${p.nome || "Projeção"}`}
      author="Montezuma Gestão de Obras"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Image src={logo} style={styles.logo} />
            <View>
              <Text style={styles.title}>Projeção Comercial</Text>
              <Text style={styles.subtitle}>Montezuma Gestão de Obras</Text>
            </View>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Emissão</Text>
            <Text style={styles.metaValue}>
              {formatarDataProjecao(dataEmissao)}
            </Text>
          </View>
        </View>

        {temIdentificacao ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identificação</Text>
            <InfoRow>
              <Chip label="Projeção" value={p.nome} />
              <Chip label="Cliente" value={p.cliente_nome} />
              <Chip label="Contato" value={p.contato} />
            </InfoRow>
            <InfoRow>
              <ChipDataProposta
                label="Data da proposta"
                dataString={p.data_proposta}
              />
              <Chip label="Endereço da obra" value={p.endereco_obra} />
            </InfoRow>
            {textoPreenchido(p.descricao) ? (
              <Text style={styles.obs}>{String(p.descricao).trim()}</Text>
            ) : null}
          </View>
        ) : null}

        {etapasComValor.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valores por etapa</Text>
            {etapasComValor.map((etapa) => (
              <LinhaValor
                key={etapa.label}
                label={etapa.label}
                valor={etapa.valor}
              />
            ))}
          </View>
        ) : null}

        {itens.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lançamentos</Text>
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={[styles.tableHeadCell, { width: "14%" }]}>
                  Tipo
                </Text>
                <Text style={[styles.tableHeadCell, { width: "26%" }]}>
                  Descrição
                </Text>
                <Text style={[styles.tableHeadCell, { width: "22%" }]}>
                  Período
                </Text>
                <Text style={[styles.tableHeadCell, { width: "8%" }]}>Qtd.</Text>
                <Text style={[styles.tableHeadCell, { width: "15%" }]}>
                  V. Unit.
                </Text>
                <Text style={[styles.tableHeadCell, { width: "15%" }]}>
                  Total
                </Text>
              </View>
              {itens.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : null,
                  ]}
                >
                  <Text style={[styles.tableCellLeft, { width: "14%" }]}>
                    {labelTipoProjecaoItem(item.tipo)}
                  </Text>
                  <Text style={[styles.tableCellLeft, { width: "26%" }]}>
                    {item.descricao}
                  </Text>
                  <Text style={[styles.tableCell, { width: "22%" }]}>
                    {formatarPeriodoProjecao(item.data_inicio, item.data_fim)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "8%" }]}>
                    {String(item.quantidade)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>
                    R$ {formatarMoedaProjecao(item.valor_unitario)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>
                    R$ {formatarMoedaProjecao(item.valor_total)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {textoPreenchido(p.observacoes) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.obs}>{String(p.observacoes).trim()}</Text>
          </View>
        ) : null}

        {totalGeral > 0 ? (
          <View style={styles.totalBar} wrap={false}>
            <Text style={styles.totalLabel}>Total da proposta</Text>
            <Text style={styles.totalValue}>
              R$ {formatarMoedaProjecao(totalGeral)}
            </Text>
          </View>
        ) : null}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Proposta Comercial · ${p.nome || ""} · pág. ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
