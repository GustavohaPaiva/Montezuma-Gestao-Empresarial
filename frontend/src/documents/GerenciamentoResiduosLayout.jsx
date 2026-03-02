import React from "react";
import logo from "../assets/imgDocumentos/prefeitura.png";
import { Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

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
// ESTILOS AJUSTADOS PARA EVITAR QUEBRA DE PÁGINA E RECEBER DADOS
// ==================================================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 55,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
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
    marginTop: 10,
    marginBottom: 15,
  },
  formContainer: {
    marginBottom: 10,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6,
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
    position: "relative", // Necessário para o texto flutuar corretamente
  },
  fillText: {
    position: "absolute",
    bottom: 2,
    left: 4,
    fontSize: 10,
    textTransform: "uppercase",
  },
  rulesContainer: {
    marginTop: 5,
  },
  bodyParagraph: {
    fontSize: 11,
    textAlign: "justify",
    marginBottom: 7,
    lineHeight: 1.3,
  },
  dateSection: {
    marginTop: 15,
    textAlign: "center",
    marginBottom: 25,
  },
  signatureSection: {
    marginTop: 5,
  },
  signatureBlock: {
    marginBottom: 20,
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

const GerenciamentoResiduosLayout = ({ cliente }) => {
  // 1. Tratamento de Data
  const hoje = new Date();
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const dataExtenso = `Uberaba, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;

  // 2. Junção de Endereço (Rua + Número)
  const enderecoObra = `${cliente?.rua_obra || ""} ${cliente?.numero_obra ? `, ${cliente.numero_obra}` : ""}`;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Image style={styles.image} src={logo} />
      </View>

      <Text style={styles.headerTitle}>
        GERENCIAMENTO DE RESÍDUOS DA CONSTRUÇÃO CIVIL
      </Text>

      {/* BLOCO DE PREENCHIMENTO */}
      <View style={styles.formContainer}>
        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Endereço:</Text>
          <View style={[styles.dottedLine, { flex: 1 }]}>
            <Text style={styles.fillText}>{enderecoObra}</Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Loteamento:</Text>
          <View style={[styles.dottedLine, { flex: 1 }]}>
            <Text style={styles.fillText}>{cliente?.bairro_obra || ""}</Text>
          </View>
          <Text style={[styles.textLabel, { marginLeft: 5 }]}>/ Lote:</Text>
          <View style={[styles.dottedLine, { width: "15%" }]}>
            <Text style={styles.fillText}>{cliente?.lote || ""}</Text>
          </View>
          <Text style={[styles.textLabel, { marginLeft: 5 }]}>Quadra:</Text>
          <View style={[styles.dottedLine, { width: "15%" }]}>
            <Text style={styles.fillText}>{cliente?.quadra || ""}</Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Uso:</Text>
          <View style={[styles.dottedLine, { width: "40%" }]}>
            <Text style={styles.fillText}>{cliente?.tipo || ""}</Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Metragem:</Text>
          <View style={[styles.dottedLine, { width: "25%" }]}>
            <Text style={styles.fillText}>{cliente?.tamanho_m2 || ""}</Text>
          </View>
          <Text style={[styles.textLabel, { marginLeft: 5 }]}>m²</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Proprietário:</Text>
          <View style={[styles.dottedLine, { flex: 1 }]}>
            <Text style={styles.fillText}>{cliente?.nome || ""}</Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>CPF do proprietário:</Text>
          <View style={[styles.dottedLine, { width: "45%" }]}>
            <Text style={styles.fillText}>{cliente?.cpf || ""}</Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>Responsável técnico:</Text>
          <View style={[styles.dottedLine, { flex: 1 }]}>
            <Text style={styles.fillText}>LINCOLN SILVA DE OLIVEIRA</Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.textLabel}>CREA ou CAU:</Text>
          <View style={[styles.dottedLine, { width: "45%" }]}>
            <Text style={styles.fillText}>216305/D</Text>
          </View>
        </View>
      </View>

      {/* REGRAS */}
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

      {/* DATA E ASSINATURAS */}
      <Text style={styles.dateSection}>{dataExtenso}</Text>

      <View style={styles.signatureSection}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{cliente?.nome || ""}</Text>
          <Text style={styles.signatureText}>PROPRIETÁRIO</Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>
            LINCOLN SILVA DE OLIVEIRA – CREA: 216305/D
          </Text>
          <Text style={styles.signatureText}>RESPONSÁVEL TÉCNICO</Text>
        </View>
      </View>

      {/* RODAPÉ */}
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
  );
};

export default GerenciamentoResiduosLayout;
