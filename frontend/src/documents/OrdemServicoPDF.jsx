import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import logoMontezuma from "../assets/logos/logo sem fundo.png";
import { ID_VOGELKOP } from "../constants/escritorios";
import {
  OS_ESCOPO_OPCOES,
  OS_FORMAS_PAGAMENTO,
  OS_RESPONSABILIDADES_CLIENTE,
} from "../constants/ordemServico";
import { ARQUITETO_INFO } from "./orcamentoPropostaTemplate";

const COR_MONTEZUMA = "#DC3B0B";
const COR_VK = "#149FC4";
const COR_TEXTO = "#111827";
const COR_MUTED = "#6B7280";
const COR_DIVISOR = "#E5E7EB";

function formatarDataBR(raw) {
  if (!raw) return "___/___/______";
  const d = new Date(`${String(raw).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return "R$ __________________";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function criarStyles(isVogelkop) {
  const corPrimaria = isVogelkop ? COR_VK : COR_MONTEZUMA;
  return StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 48,
      paddingHorizontal: 40,
      fontFamily: "Helvetica",
      fontSize: 9.5,
      color: COR_TEXTO,
      lineHeight: 1.4,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 2,
      borderBottomColor: corPrimaria,
      paddingBottom: 12,
      marginBottom: 16,
    },
    brand: { flexDirection: "row", alignItems: "center", flex: 1 },
    logo: { width: 44, height: 44, objectFit: "contain", marginRight: 10 },
    title: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
    },
    subtitle: { fontSize: 8.5, color: COR_MUTED, marginTop: 2 },
    meta: { alignItems: "flex-end", minWidth: 120 },
    metaLabel: {
      fontSize: 7,
      color: COR_MUTED,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    metaValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      marginBottom: 4,
    },
    section: { marginBottom: 12 },
    sectionTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 0.5,
      borderBottomColor: COR_DIVISOR,
    },
    fieldRow: { flexDirection: "row", marginBottom: 4, flexWrap: "wrap" },
    fieldLabel: { fontSize: 8, color: COR_MUTED, width: "28%" },
    fieldValue: { fontSize: 9.5, flex: 1 },
    checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
    checkbox: { width: 10, marginRight: 6, fontSize: 10 },
    bullet: { fontSize: 9, marginBottom: 3, paddingLeft: 8 },
    divider: {
      borderBottomWidth: 0.5,
      borderBottomColor: COR_DIVISOR,
      marginVertical: 8,
    },
    textBlock: { fontSize: 9.5, marginBottom: 6, minHeight: 40 },
    assinaturaBox: {
      marginTop: 16,
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: COR_DIVISOR,
    },
    assinaturaTitulo: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      marginBottom: 12,
    },
    linhaAssinatura: { marginBottom: 14 },
    linhaLabel: { fontSize: 8, color: COR_MUTED, marginBottom: 2 },
    linhaValor: {
      borderBottomWidth: 0.5,
      borderBottomColor: COR_TEXTO,
      minHeight: 14,
      fontSize: 9,
    },
  });
}

function CheckboxItem({ checked, label, styles }) {
  return (
    <View style={styles.checkboxRow}>
      <Text style={styles.checkbox}>{checked ? "☑" : "☐"}</Text>
      <Text>{label}</Text>
    </View>
  );
}

export default function OrdemServicoPDF({ os, escritorioId }) {
  const isVogelkop = escritorioId === ID_VOGELKOP;
  const styles = criarStyles(isVogelkop);
  const escopoSet = new Set(Array.isArray(os?.escopo) ? os.escopo : []);
  const pagamentoSet = new Set(
    Array.isArray(os?.formas_pagamento) ? os.formas_pagamento : [],
  );

  const nomeMarca = isVogelkop ? "VK ARQUITETURA" : "MONTEZUMA";
  const responsavelEmpresa = isVogelkop
    ? ARQUITETO_INFO.nome
    : os?.responsavel_tecnico || "—";

  return (
    <Document title={`Ordem de Serviço Nº ${os?.numero ?? ""}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image src={logoMontezuma} style={styles.logo} />
            <View>
              <Text style={styles.title}>ORDEM DE SERVIÇO (OS)</Text>
              <Text style={styles.subtitle}>{nomeMarca}</Text>
            </View>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Nº da OS</Text>
            <Text style={styles.metaValue}>{os?.numero ?? "—"}</Text>
            <Text style={styles.metaLabel}>Data de Emissão</Text>
            <Text style={styles.metaValue}>
              {formatarDataBR(os?.data_emissao)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Responsável Técnico:</Text>
            <Text style={styles.fieldValue}>
              {os?.responsavel_tecnico || "—"}
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Cliente:</Text>
            <Text style={styles.fieldValue}>{os?.cliente_nome || "—"}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Telefone:</Text>
            <Text style={styles.fieldValue}>
              {os?.cliente_telefone || "—"}
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>E-mail:</Text>
            <Text style={styles.fieldValue}>{os?.cliente_email || "—"}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Endereço do Projeto:</Text>
            <Text style={styles.fieldValue}>
              {os?.endereco_projeto || "—"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Objeto do Serviço</Text>
          <Text style={styles.textBlock}>
            {os?.objeto_servico ||
              "Prestação de serviços conforme escopo descrito nesta Ordem de Serviço."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Escopo Contratado</Text>
          {OS_ESCOPO_OPCOES.map((op) => (
            <CheckboxItem
              key={op.id}
              checked={escopoSet.has(op.id)}
              label={op.label}
              styles={styles}
            />
          ))}
          <CheckboxItem
            checked={Boolean(os?.escopo_outro)}
            label={`Outro: ${os?.escopo_outro || "________________"}`}
            styles={styles}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Descrição dos Serviços</Text>
          <Text style={styles.textBlock}>
            {os?.descricao_servicos || " "}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Prazos</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Data de Início:</Text>
            <Text style={styles.fieldValue}>
              {formatarDataBR(os?.data_inicio)}
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Data Prevista para Entrega:</Text>
            <Text style={styles.fieldValue}>
              {formatarDataBR(os?.data_entrega_prevista)}
            </Text>
          </View>
          <Text style={styles.fieldLabel}>Observações:</Text>
          <Text style={styles.textBlock}>{os?.observacoes_prazos || " "}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Valor dos Serviços</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Valor Total:</Text>
            <Text style={styles.fieldValue}>
              {formatarMoeda(os?.valor_total)}
            </Text>
          </View>
          <Text style={{ fontSize: 8.5, marginTop: 4, marginBottom: 4 }}>
            Forma de Pagamento:
          </Text>
          {OS_FORMAS_PAGAMENTO.map((fp) => (
            <CheckboxItem
              key={fp.id}
              checked={pagamentoSet.has(fp.id)}
              label={fp.label}
              styles={styles}
            />
          ))}
          <CheckboxItem
            checked={Boolean(os?.forma_pagamento_outro)}
            label={`Outro: ${os?.forma_pagamento_outro || "________________"}`}
            styles={styles}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            6. Responsabilidades do Cliente
          </Text>
          {OS_RESPONSABILIDADES_CLIENTE.map((item) => (
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Observações Gerais</Text>
          <Text style={styles.textBlock}>
            {os?.observacoes_gerais || " "}
          </Text>
        </View>

        <View style={styles.assinaturaBox}>
          <Text style={styles.assinaturaTitulo}>APROVAÇÃO</Text>
          <Text style={{ fontSize: 8.5, marginBottom: 10 }}>
            Declaro estar de acordo com os serviços descritos nesta Ordem de
            Serviço.
          </Text>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
            Cliente
          </Text>
          <View style={styles.linhaAssinatura}>
            <Text style={styles.linhaLabel}>Nome:</Text>
            <Text style={styles.linhaValor}> </Text>
          </View>
          <View style={styles.linhaAssinatura}>
            <Text style={styles.linhaLabel}>Assinatura:</Text>
            <Text style={styles.linhaValor}> </Text>
          </View>
          <View style={styles.linhaAssinatura}>
            <Text style={styles.linhaLabel}>Data:</Text>
            <Text style={styles.linhaValor}> </Text>
          </View>

          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            {nomeMarca}
          </Text>
          <View style={styles.linhaAssinatura}>
            <Text style={styles.linhaLabel}>Responsável:</Text>
            <Text style={styles.linhaValor}>{responsavelEmpresa}</Text>
          </View>
          <View style={styles.linhaAssinatura}>
            <Text style={styles.linhaLabel}>Assinatura:</Text>
            <Text style={styles.linhaValor}> </Text>
          </View>
          <View style={styles.linhaAssinatura}>
            <Text style={styles.linhaLabel}>Data:</Text>
            <Text style={styles.linhaValor}> </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
