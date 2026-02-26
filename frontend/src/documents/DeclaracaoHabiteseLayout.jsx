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

// Registrando as fontes (mantidas do projeto anterior)
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
// ESTILOS DA DECLARAÇÃO DE HABITE-SE
// ==================================================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
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
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 15,
    marginBottom: 25,
  },
  // --- Corpo do Texto / Formulário ---
  formRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
    minHeight: 16,
  },
  textLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  dottedLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    borderBottomStyle: "dotted",
    height: 12, // Altura ajustada para a linha bater na base do texto
    marginLeft: 2,
  },
  // --- Datas e Assinaturas ---
  dateSection: {
    marginTop: 25,
    textAlign: "center",
    marginBottom: 35,
  },
  signatureSection: {
    marginTop: 5,
  },
  signatureBlock: {
    marginBottom: 20, // Espaçamento um pouco menor para caberem as 5 assinaturas
  },
  signatureLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    borderBottomStyle: "dotted",
    width: "65%", // Mantém alinhado à esquerda ocupando a proporção da imagem
    marginBottom: 3,
  },
  signatureText: {
    fontSize: 10,
    lineHeight: 1.3,
  },
  // --- Rodapé (Sem a observação desta vez) ---
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
// SUBCOMPONENTE DE ASSINATURA (Para manter o código limpo)
// ==================================================================
const SignatureBlock = ({ title, subtitle }) => (
  <View style={styles.signatureBlock}>
    <View style={styles.signatureLine} />
    <Text style={styles.signatureText}>{title}</Text>
    {subtitle && <Text style={styles.signatureText}>{subtitle}</Text>}
  </View>
);

// ==================================================================
// O COMPONENTE DO DOCUMENTO PRINCIPAL
// ==================================================================
const DeclaracaoHabiteseLayout = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 1. Cabeçalho */}
      <View style={styles.headerContainer}>
        <Image style={styles.image} src={logo} />
      </View>

      {/* 2. Título */}
      <Text style={styles.headerTitle}>DECLARAÇÃO DE HABITE-SE</Text>

      {/* 3. Parágrafo Inicial com Linhas */}
      <View style={styles.formRow}>
        <Text style={styles.textLabel}>
          Declaramos, para fins de HABITE-SE da construção situada na Rua/Av.:
        </Text>
        <View style={[styles.dottedLine, { flex: 1 }]} />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.dottedLine, { flex: 1 }]} />
        <Text style={[styles.textLabel, { marginLeft: 5 }]}>Nº:</Text>
        <View style={[styles.dottedLine, { width: "25%" }]} />
      </View>

      <View style={[styles.formRow, { marginBottom: 25, marginTop: 5 }]}>
        <Text style={styles.textLabel}>
          Que a mesma foi executada em conformidade com a legislação vigente.
        </Text>
      </View>

      {/* 4. Lista de Detalhes do Imóvel (Com larguras variadas imitando o PDF original) */}
      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Tipo de Edificação:</Text>
        <View style={[styles.dottedLine, { width: "50%" }]} />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Número de Unidades:</Text>
        <View style={[styles.dottedLine, { width: "55%" }]} />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Metragem Quadrada por Unidade:</Text>
        <View style={[styles.dottedLine, { width: "40%" }]} />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Metragem Quadrada Total:</Text>
        <View style={[styles.dottedLine, { width: "48%" }]} />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Número do Alvará de Construção:</Text>
        <View style={[styles.dottedLine, { width: "38%" }]} />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Expedido em:</Text>
        <View style={[styles.dottedLine, { width: "30%" }]} />
      </View>

      {/* 5. Data */}
      <Text style={styles.dateSection}>
        Uberaba, ........ de ......................................... de
        ................
      </Text>

      {/* 6. Assinaturas */}
      <View style={styles.signatureSection}>
        <SignatureBlock title="RESPONSÁVEL TÉCNICO – CREA/CAU" />
        <SignatureBlock title="AUTOR DO PROJETO – CREA/CAU" />
        <SignatureBlock title="PROJETO ELÉTRICO – CREA/CAU" />
        <SignatureBlock title="PROJETO ESTRUTURAL – CREA/CAU" />
        <SignatureBlock title="PROPRIETÁRIO" />
      </View>

      {/* 7. Rodapé (Apenas endereço, conforme referência) */}
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

export default DeclaracaoHabiteseLayout;
