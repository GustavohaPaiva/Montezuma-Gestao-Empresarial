import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Registrando as fontes padrão
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
  ],
});

// ==================================================================
// ESTILOS DA DECLARAÇÃO DE MOVIMENTAÇÃO DE SOLO
// ==================================================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  // --- Título ---
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30, // Reduzido o espaço abaixo do título
    lineHeight: 1.2, // Espaçamento de linha corrigido
  },
  // --- Corpo do Texto ---
  paragraph: {
    textAlign: "justify",
    marginBottom: 12, // Reduzido o espaço entre parágrafos
    lineHeight: 1.2, // CORREÇÃO PRINCIPAL: Espaçamento entre linhas mais fechado
  },
  bold: {
    fontWeight: "bold",
  },
  // Estilo para simular o preenchimento dentro dos colchetes
  underlineText: {
    textDecoration: "underline",
  },
  // --- Data ---
  dateContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 40, // Levemente aproximado do texto acima
    marginBottom: 50,
  },
  dateText: {
    fontSize: 11,
    marginBottom: 2,
  },
  dateLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    alignItems: "center",
    marginHorizontal: 4,
    paddingHorizontal: 5,
  },
  // --- Assinatura ---
  signatureContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 5,
    marginBottom: 2,
    alignItems: "center",
  },
  signatureText: {
    fontSize: 10,
    marginBottom: 3,
  },
});

// ==================================================================
// O COMPONENTE DO DOCUMENTO
// ==================================================================
const DeclaracaoMovimentacaoSoloLayout = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 1. Título */}
      <Text style={styles.title}>
        DECLARAÇÃO TÉCNICA SOBRE MOVIMENTAÇÃO DE SOLO{"\n"}E FORMAÇÕES
        SEDIMENTARES
      </Text>

      {/* 2. Parágrafo 1 - Dados Pessoais com lacunas */}
      <Text style={styles.paragraph}>
        Eu, [{" "}
        <Text style={styles.underlineText}>LINCOLN SILVA DE OLIVEIRA</Text> ],
        profissão [ <Text style={styles.underlineText}>ENGENHEIRO</Text> ],
        inscrito(a) no [ <Text style={styles.underlineText}>CREA</Text> ] sob o
        nº [ <Text style={styles.underlineText}>216305/D</Text> ], responsável
        técnico pela obra localizada à [endereço completo], inscrita sob o
        processo nº [número do processo], em atendimento ao disposto no Art. 3º
        da Portaria nº 003/2015, publicada no Porta-Voz nº 1312/15 de
        17/07/2015, que trata da necessidade de proteção e gerenciamento
        integrado das reservas fossilíferas,{" "}
        <Text style={styles.bold}>DECLARO</Text>, sob minha inteira
        responsabilidade técnica, que:
      </Text>

      {/* 3. Parágrafo 2 - Checkbox 1 */}
      <Text style={styles.paragraph}>
        ( x ) As intervenções previstas — incluindo movimentação de solo,
        escavações, aterros, cortes de terreno e/ou terraplanagem —{" "}
        <Text style={styles.bold}>não causarão impactos</Text> às rochas e
        formações sedimentares locais, em especial às Formações Geológicas
        Uberaba e Marília (Membros Ponte Alta e Serra da Galga), ao Vale do Rio
        do Peixe e aos Depósitos Aluviais Cenozoicos, conforme alínea "a" do
        Art. 3º da referida Portaria.
      </Text>

      {/* 4. Parágrafo 3 - Checkbox 2 */}
      <Text style={styles.paragraph}>
        ( ) Há indicativos de impacto nas formações sedimentares mencionadas,
        motivo pelo qual será realizado o devido Monitoramento/ Acompanhamento/
        Salvamento Paleontológico,{" "}
        <Text style={styles.bold}>
          com apresentação de relatório/laudo técnico
        </Text>{" "}
        acompanhado da devida ART — Anotação de Responsabilidade Técnica,
        conforme alínea "b" do Art. 3º da referida Portaria.
      </Text>

      {/* 5. Parágrafo Final */}
      <Text style={styles.paragraph}>
        Esta declaração é emitida sob minha inteira responsabilidade técnica e
        acompanha a devida ART nº [número da ART].
      </Text>

      {/* 6. Estrutura da Data (Flexbox) */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>Uberaba,</Text>
        <View style={[styles.dateLine, { width: 35 }]}>
          <Text style={styles.dateText}>02</Text>
        </View>
        <Text style={styles.dateText}>de</Text>
        <View style={[styles.dateLine, { width: 120 }]}>
          <Text style={styles.dateText}>FEVEREIRO</Text>
        </View>
        <Text style={styles.dateText}>de</Text>
        <View style={[styles.dateLine, { width: 60 }]}>
          <Text style={styles.dateText}>2026</Text>
        </View>
        <Text style={styles.dateText}>.</Text>
      </View>

      {/* 7. Bloco de Assinatura */}
      <View style={styles.signatureContainer}>
        <View style={styles.signatureLine}>
          <Text style={styles.signatureText}>[Nome do Profissional]</Text>
          <Text style={styles.signatureText}>
            [Profissão] – [nº do Conselho Profissional]
          </Text>
          <Text style={styles.signatureText}>[Assinatura]</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default DeclaracaoMovimentacaoSoloLayout;
