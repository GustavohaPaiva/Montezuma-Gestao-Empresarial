import React from "react";
import logo from "../assets/imgDocumentos/prefeitura.png"; // Ajuste o caminho se necessário
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Registrando as fontes
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf",
      fontWeight: "bold",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Oblique.ttf",
      fontStyle: "italic",
    },
  ],
});

// ==================================================================
// ESTILOS AJUSTADOS PARA EVITAR QUEBRA DE PÁGINA
// ==================================================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 30, // Reduzido levemente
    paddingBottom: 60,
    paddingHorizontal: 55,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  // --- Cabeçalho ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    height: 60,
  },
  image: {
    width: 280,
    height: 55,
    objectFit: "contain",
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 10, // Reduzido
    marginBottom: 15, // Reduzido
  },
  // --- Formulário Superior ---
  formContainer: {
    marginBottom: 10, // Reduzido
  },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6, // Reduzido sutilmente
    minHeight: 15,
  },
  textLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  dottedLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    borderBottomStyle: "dotted",
    height: 12,
    marginLeft: 2,
  },
  // --- Corpo do Texto (Regras) ---
  rulesContainer: {
    marginTop: 5,
  },
  bodyParagraph: {
    fontSize: 11,
    textAlign: "justify",
    marginBottom: 7, // Reduzido para encolher o bloco de texto
    lineHeight: 1.3,
  },
  // --- Datas e Assinaturas ---
  dateSection: {
    marginTop: 15, // Reduzido
    textAlign: "center",
    marginBottom: 25, // Reduzido bastante para puxar assinaturas pra cima
  },
  signatureSection: {
    marginTop: 5,
  },
  signatureBlock: {
    marginBottom: 20, // Reduzido
  },
  signatureLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    borderBottomStyle: "dotted",
    width: "60%",
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
  },
  // --- Rodapé ---
  footer: {
    position: "absolute",
    bottom: 30,
    left: 55,
    right: 55,
    textAlign: "center",
  },
  footerAddressContainer: {
    borderTopWidth: 2,
    borderTopColor: "#002060",
    paddingTop: 5,
    alignItems: "center",
  },
  footerAddress: {
    fontSize: 8.5,
    color: "#002060",
    lineHeight: 1.2,
  },
});

// ==================================================================
// O COMPONENTE DO DOCUMENTO
// ==================================================================
const GerenciamentoResiduosLayout = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 1. Cabeçalho */}
      <View style={styles.headerContainer}>
        <Image style={styles.image} src={logo} />
      </View>

      {/* 2. Título */}
      <Text style={styles.headerTitle}>
        GERENCIAMENTO DE RESÍDUOS DA CONSTRUÇÃO CIVIL
      </Text>

      {/* 3. Bloco de Preenchimento (Formulário) */}
      <View style={styles.formContainer}>
        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Endereço:</Text>
          <View style={[styles.dottedLine, { flex: 1 }]} />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Loteamento:</Text>
          <View style={[styles.dottedLine, { flex: 1 }]} />
          <Text style={[styles.textLabel, { marginLeft: 5 }]}>/ Lote:</Text>
          <View style={[styles.dottedLine, { width: "15%" }]} />
          <Text style={[styles.textLabel, { marginLeft: 5 }]}>Quadra:</Text>
          <View style={[styles.dottedLine, { width: "15%" }]} />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Uso:</Text>
          <View style={[styles.dottedLine, { width: "40%" }]} />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Metragem:</Text>
          <View style={[styles.dottedLine, { width: "25%" }]} />
          <Text style={[styles.textLabel, { marginLeft: 5 }]}>m²</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Proprietário:</Text>
          <View style={[styles.dottedLine, { flex: 1 }]} />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>CPF do proprietário:</Text>
          <View style={[styles.dottedLine, { width: "45%" }]} />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Responsável técnico:</Text>
          <View style={[styles.dottedLine, { flex: 1 }]} />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>CREA ou CAU:</Text>
          <View style={[styles.dottedLine, { width: "45%" }]} />
        </View>
      </View>

      {/* 4. Regras (Parágrafos) */}
      <View style={styles.rulesContainer}>
        <Text style={styles.bodyParagraph}>
          O lixo produzido na obra é referente ao art. 3º parágrafo 1º alínea b
          da resolução nº 307/2002.
        </Text>
        <Text style={styles.bodyParagraph}>
          Foi feito um contrato com empresa que retira entulho com caçambas.
          Este contrato estará disposição no local da obra.
        </Text>
        <Text style={styles.bodyParagraph}>
          As caçambas serão retiradas no máximo em 15 dias ou quando estiver com
          a carga completa.
        </Text>
        <Text style={styles.bodyParagraph}>
          Os entulhos serão acondicionados nas caçambas na frente da obra,
          contendo somente entulho da construção
        </Text>
        <Text style={styles.bodyParagraph}>
          O meio de transporte é por caminhão da empresa responsável pela
          retirada da caçamba.
        </Text>
        <Text style={styles.bodyParagraph}>
          A segurança no transporte e conforme Lei 10.697/2008 Cp. 6 Art. 131
          alínea I da Lei Municipal.
        </Text>
        <Text style={styles.bodyParagraph}>
          O destino final do lixo é no aterro da SOMA – Ambiental – situado na
          Av. Filomena Cartafina – Km 12.
        </Text>
        <Text style={styles.bodyParagraph}>
          O resíduo doméstico será acondicionado em sacos plásticos e colocado
          na calçada nas terças, quintas e sábados, pois é quando é feito a
          coleta pública.
        </Text>
      </View>

      {/* 5. Data */}
      <Text style={styles.dateSection}>
        Uberaba, ........ de ......................................... de
        ................
      </Text>

      {/* 6. Assinaturas */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>
            NOME E ASSINATURA DO PROPRIETÁRIO
          </Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>
            NOME E ASSINATURA DO RESPONSÁVEL TÉCNICO
          </Text>
        </View>
      </View>

      {/* 7. Rodapé */}
      <View style={styles.footer}>
        <View style={styles.footerAddressContainer}>
          <Text style={styles.footerAddress}>
            Av. Dom Luiz Maria Santana, 141 - Santa Marta - CEP: 38061-080 -
            Uberaba/MG - Tel.: (34) 3318-2000
          </Text>
          <Text style={styles.footerAddress}>portal.uberaba.mg.gov.br</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default GerenciamentoResiduosLayout;
