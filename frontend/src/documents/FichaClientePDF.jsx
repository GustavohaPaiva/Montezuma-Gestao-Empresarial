import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import logo from "../assets/logos/logo sem fundo.png";
import { formatClienteParaDocumentos } from "../utils/clienteFormatters";

const COR_PRIMARIA = "#DC3B0B";
const COR_TEXTO = "#111827";
const COR_MUTED = "#6B7280";
const COR_DIVISOR = "#E5E7EB";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: COR_TEXTO,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: COR_PRIMARIA,
    borderBottomStyle: "solid",
    marginBottom: 22,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 52,
    height: 52,
    objectFit: "contain",
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  subtitle: {
    fontSize: 9.5,
    color: COR_MUTED,
    marginTop: 2,
  },
  meta: {
    textAlign: "right",
  },
  metaLabel: {
    fontSize: 8.5,
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    marginTop: 2,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
    paddingBottom: 4,
    marginBottom: 8,
    borderBottomWidth: 0.7,
    borderBottomColor: COR_DIVISOR,
    borderBottomStyle: "solid",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  field: {
    flex: 1,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize: 8.5,
    color: COR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 11,
    color: COR_TEXTO,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.7,
    borderColor: COR_DIVISOR,
    borderStyle: "solid",
    fontSize: 9,
    color: COR_TEXTO,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8.5,
    color: COR_MUTED,
    borderTopWidth: 0.7,
    borderTopColor: COR_DIVISOR,
    borderTopStyle: "solid",
    paddingTop: 8,
  },
});

function formatarData(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatarDataHora(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

function montarEndereco({
  rua,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  cep,
}) {
  const partes = [];
  if (rua) partes.push(numero ? `${rua}, ${numero}` : rua);
  if (complemento) partes.push(complemento);
  if (bairro) partes.push(bairro);
  if (cidade && estado) partes.push(`${cidade}/${estado}`);
  else if (cidade) partes.push(cidade);
  if (cep) partes.push(`CEP ${cep}`);
  return partes.length ? partes.join(" · ") : "—";
}

const Field = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || "—"}</Text>
  </View>
);

export default function FichaClientePDF({ cliente = {} }) {
  const c = formatClienteParaDocumentos(cliente);
  const dataEmissaoLegivel = formatarDataHora(new Date().toISOString());

  const enderecoResidencial = montarEndereco({
    rua: c.rua,
    numero: c.numero_casa,
    complemento: c.complemento,
    bairro: c.bairro,
    cidade: c.cidade,
    estado: c.estado,
    cep: c.cep,
  });

  const temEnderecoObra = c.rua_obra || c.bairro_obra || c.numero_obra;
  const enderecoObra = temEnderecoObra
    ? montarEndereco({
        rua: c.rua_obra,
        numero: c.numero_obra,
        bairro: c.bairro_obra,
        cidade: c.cidade,
        estado: c.estado,
      })
    : null;

  return (
    <Document title={`Ficha — ${c.nome || "Cliente"}`} author="Montezuma">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brand}>
            <Image src={logo} style={styles.logo} />
            <View>
              <Text style={styles.title}>Ficha do Cliente</Text>
              <Text style={styles.subtitle}>
                Documento gerado pelo Montezuma
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação</Text>
          <View style={styles.row}>
            <Field label="Nome completo" value={c.nome} />
            <Field label="CPF / CNPJ" value={c.cpf} />
          </View>
          <View style={styles.row}>
            <Field label="RG" value={c.rg} />
            <Field label="Profissão" value={c.profissao} />
          </View>
          <View style={styles.row}>
            <Field label="E-mail" value={c.email} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço residencial</Text>
          <View style={styles.row}>
            <Field label="Endereço" value={enderecoResidencial} />
          </View>
        </View>

        {enderecoObra ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço da obra</Text>
            <View style={styles.row}>
              <Field label="Endereço da obra" value={enderecoObra} />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cadastro</Text>
          <View style={styles.row}>
            <Field label="Tipo" value={c.tipo} />
            <Field label="Status" value={c.status} />
            <Field
              label="Data de cadastro"
              value={formatarData(c.data || c.created_at)}
            />
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Ficha do Cliente · Montezuma · ${dataEmissaoLegivel} · página ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
