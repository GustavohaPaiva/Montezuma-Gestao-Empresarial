import React from "react";
import logo from "../assets/imgDocumentos/prefeitura.png";
import { Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 55,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
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
    marginTop: 10,
    marginBottom: 15,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6,
    minHeight: 14,
  },
  textLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  dottedLine: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    borderBottomStyle: "dotted",
    height: 12,
  },
  inputText: {
    fontSize: 10,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    marginBottom: -2,
  },
  dateSection: {
    marginTop: 40,
    textAlign: "center",
    marginBottom: 30,
  },
  signatureSection: {
    marginTop: 15,
  },
  signatureBlock: {
    marginBottom: 35,
  },
  signatureLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    borderBottomStyle: "dotted",
    width: "65%",
    marginBottom: 2,
  },
  signatureText: {
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 25,
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

const SignatureBlock = ({ title, subtitle }) => (
  <View style={styles.signatureBlock} wrap={false}>
    <View style={styles.signatureLine} />
    <Text style={styles.signatureText}>{title}</Text>
    {subtitle && <Text style={styles.signatureText}>{subtitle}</Text>}
  </View>
);

const DeclaracaoHabiteseLayout = ({ cliente }) => {
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

  const respNome = "LINCOLN SILVA DE OLIVEIRA";
  const respCrea = "216305/D";

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Image style={styles.image} src={logo} />
      </View>

      <Text style={styles.headerTitle}>DECLARAÇÃO DE HABITE-SE</Text>

      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 14, lineHeight: 1.5, textAlign: "justify" }}>
          <Text>
            Declaramos, para fins de HABITE-SE da construção situada na Rua/Av.:
          </Text>
        </Text>
        <View style={{ flexDirection: "row" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              marginTop: 5,
            }}
          >
            <View
              style={{
                width: "100%",
                borderBottomWidth: 1.5,
                borderBottomColor: "#000",
                borderBottomStyle: "dotted",
                marginLeft: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  textAlign: "start",
                  marginBottom: -1,
                }}
              >
                {cliente?.rua || ""} {cliente?.numero_obra || ""},{" "}
                {cliente?.bairro_obra || ""}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              marginTop: 5,
            }}
          >
            <Text style={{ fontSize: 11 }}>Nº:</Text>
            <View
              style={{
                width: 80,
                borderBottomWidth: 1.5,
                borderBottomColor: "#000",
                borderBottomStyle: "dotted",
                marginLeft: 5,
                height: 12,
              }}
            >
              <Text
                style={{ fontSize: 10, textAlign: "center", marginBottom: -2 }}
              >
                {cliente?.numero_obra || ""}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 11 }}>
          Que a mesma foi executada em conformidade com a legislação vigente.
        </Text>
      </View>

      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Tipo de Edificação:</Text>
        <View style={[styles.dottedLine, { maxWidth: 250 }]}>
          <Text style={styles.inputText}>{cliente?.tipo || ""}</Text>
        </View>
      </View>

      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Número de Unidades:</Text>
        <View style={[styles.dottedLine, { maxWidth: 250 }]}>
          <Text style={styles.inputText}>1</Text>
        </View>
      </View>

      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Metragem Quadrada por Unidade:</Text>
        <View style={[styles.dottedLine, { maxWidth: 250 }]}>
          <Text style={styles.inputText}>
            {cliente?.tamanho_m2 ? `${cliente.tamanho_m2} m²` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Metragem Quadrada Total:</Text>
        <View style={[styles.dottedLine, { maxWidth: 250 }]}>
          <Text style={styles.inputText}>
            {cliente?.tamanho_m2 ? `${cliente.tamanho_m2} m²` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Número do Alvará de Construção:</Text>
        <View style={[styles.dottedLine, { maxWidth: 250 }]}>
          <Text style={styles.inputText}>{cliente?.numero_alvara || ""}</Text>
        </View>
      </View>

      <View style={styles.formRow}>
        <Text style={styles.textLabel}>Expedido em:</Text>
        <View style={[styles.dottedLine, { maxWidth: 250 }]}>
          <Text style={styles.inputText}>{cliente?.data_expedicao || ""}</Text>
        </View>
      </View>

      <Text style={styles.dateSection}>{dataExtenso}</Text>

      <View style={styles.signatureSection}>
        <SignatureBlock
          title={`${respNome} – ${respCrea}`}
          subtitle="RESPONSÁVEL TÉCNICO"
        />
        <SignatureBlock
          title={`${respNome} – ${respCrea}`}
          subtitle="AUTOR DO PROJETO"
        />
        <SignatureBlock
          title={`${respNome} – ${respCrea}`}
          subtitle="PROJETO ELÉTRICO"
        />
        <SignatureBlock
          title={`${respNome} – ${respCrea}`}
          subtitle="PROJETO ESTRUTURAL"
        />
        <SignatureBlock
          title={cliente?.nome || "PROPRIETÁRIO"}
          subtitle="PROPRIETÁRIO"
        />
      </View>

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

export default DeclaracaoHabiteseLayout;
