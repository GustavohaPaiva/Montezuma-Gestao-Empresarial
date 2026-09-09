import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import page1 from "../assets/documents/ybyoca-proposta/page-1.png";
import page2 from "../assets/documents/ybyoca-proposta/page-2.png";
import page3 from "../assets/documents/ybyoca-proposta/page-3.png";
import page4 from "../assets/documents/ybyoca-proposta/page-4.png";
import page5 from "../assets/documents/ybyoca-proposta/page-5.png";
import {
  formatarCodigoPropostaYB,
  formatarDataCabecalhoYB,
  formatarDataPropostaBR,
  normalizarPropostaDadosYbyoca,
} from "../utils/orcamentoPropostaUtils";

const A4_ALTURA = 841.89;
const A4_LARGURA = 595.28;
const COR_FUNDO = "#FFFFFF";
const COR_CAPA_MASK = "#F7F7F7";
const COR_HEADER_P2 = "#E5E5E5";
const COR_TEXTO = "#111111";

const styles = StyleSheet.create({
  page: {
    backgroundColor: COR_FUNDO,
    position: "relative",
  },
  fundoBox: {
    position: "absolute",
    top: 0,
    left: 0,
    width: A4_LARGURA,
    height: A4_ALTURA,
  },
  fundo: {
    width: A4_LARGURA,
    height: A4_ALTURA,
  },
  // --- Capa (página 1) ---
  maskValorEsq: {
    position: "absolute",
    left: 30,
    width: 220,
    height: 14,
    backgroundColor: COR_CAPA_MASK,
    justifyContent: "center",
  },
  maskCliente: { top: 693 },
  maskContato: { top: 740 },
  maskEndereco: { top: 785 },
  valorEsq: {
    fontSize: 10,
    color: COR_TEXTO,
    fontFamily: "Helvetica",
  },
  maskValorDir: {
    position: "absolute",
    right: 26,
    width: 110,
    height: 16,
    backgroundColor: COR_CAPA_MASK,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  maskProposta: { top: 732 },
  maskData: { top: 786 },
  valorDir: {
    fontSize: 10,
    color: COR_TEXTO,
    fontFamily: "Helvetica",
    textAlign: "right",
  },
  // --- Página 2 boas-vindas ---
  maskBoasVindas: {
    position: "absolute",
    top: 43,
    left: 34,
    width: 480,
    height: 16,
    backgroundColor: COR_HEADER_P2,
    justifyContent: "center",
  },
  textoBoasVindas: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COR_TEXTO,
  },
  // --- Páginas 3–5 data do cabeçalho ---
  maskDataInterna: {
    position: "absolute",
    top: 140,
    left: 368,
    width: 110,
    height: 15,
    backgroundColor: COR_FUNDO,
    justifyContent: "center",
  },
  textoDataInterna: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COR_TEXTO,
  },
});

function fontSizeCampo(texto, base = 10) {
  const n = String(texto || "").length;
  if (n > 36) return 7.5;
  if (n > 28) return 8.5;
  if (n > 20) return 9.5;
  return base;
}

function fontSizeBoasVindas(texto) {
  const n = String(texto || "").length;
  if (n > 62) return 8;
  if (n > 52) return 9;
  return 10;
}

const BRAND_SPACED = "Y B Y O C A  A R Q U I T E T U R A";

export default function OrcamentoYbyocaPDF({ orcamento }) {
  const proposta = normalizarPropostaDadosYbyoca(orcamento?.proposta_dados);
  const dataRef = orcamento?.data || orcamento?.created_at;
  const codigo = formatarCodigoPropostaYB(orcamento?.numero_proposta, dataRef);
  const dataCapa = formatarDataPropostaBR(dataRef);
  const dataInterna = formatarDataCabecalhoYB(dataRef);
  const nomeCliente = String(orcamento?.nome || "").trim() || "—";
  const contato = String(proposta.contato || "").trim() || "—";
  const endereco = String(proposta.endereco || "").trim() || "—";
  const boasVindas = `${nomeCliente}, seja bem vindo ao ${BRAND_SPACED}`;

  return (
    <Document title={`PROPOSTA ${codigo} — Ybyoca`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.fundoBox}>
          <Image src={page1} style={styles.fundo} />
        </View>
        <View style={[styles.maskValorEsq, styles.maskCliente]}>
          <Text
            style={[styles.valorEsq, { fontSize: fontSizeCampo(nomeCliente) }]}
          >
            {nomeCliente}
          </Text>
        </View>
        <View style={[styles.maskValorEsq, styles.maskContato]}>
          <Text style={[styles.valorEsq, { fontSize: fontSizeCampo(contato) }]}>
            {contato}
          </Text>
        </View>
        <View style={[styles.maskValorEsq, styles.maskEndereco]}>
          <Text
            style={[styles.valorEsq, { fontSize: fontSizeCampo(endereco) }]}
          >
            {endereco}
          </Text>
        </View>
        <View style={[styles.maskValorDir, styles.maskProposta]}>
          <Text style={styles.valorDir}>{codigo}</Text>
        </View>
        <View style={[styles.maskValorDir, styles.maskData]}>
          <Text style={styles.valorDir}>{dataCapa}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.fundoBox}>
          <Image src={page2} style={styles.fundo} />
        </View>
        <View style={styles.maskBoasVindas}>
          <Text
            style={[
              styles.textoBoasVindas,
              { fontSize: fontSizeBoasVindas(boasVindas) },
            ]}
          >
            {boasVindas}
          </Text>
        </View>
      </Page>

      {[page3, page4, page5].map((src, idx) => (
        <Page key={`p-${idx + 3}`} size="A4" style={styles.page}>
          <View style={styles.fundoBox}>
            <Image src={src} style={styles.fundo} />
          </View>
          <View style={styles.maskDataInterna}>
            <Text style={styles.textoDataInterna}>{dataInterna}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
