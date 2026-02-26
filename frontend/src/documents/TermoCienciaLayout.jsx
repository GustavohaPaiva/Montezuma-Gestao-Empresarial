import React from "react";
import logo from "../assets/imgDocumentos/prefeitura.png";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Registrando fontes para garantir negrito e itálico corretos
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
// ESTILOS REFINADOS PARA CABER EM 1 PÁGINA E MANTER O DESIGN
// ==================================================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 60,
    paddingHorizontal: 55,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  // --- Cabeçalho e Imagem ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "center", // Centraliza a imagem horizontalmente
    alignItems: "center",
    marginBottom: 10,
    height: 60, // Aumentado um pouco para acomodar a imagem maior
  },
  image: {
    width: 280, // Largura aumentada para bater com a referência
    height: 55, // Altura proporcional
    objectFit: "contain",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 5,
    marginBottom: 15,
  },
  // --- Caixas de Informação ---
  boxContainer: {
    borderWidth: 2,
    borderColor: "#000",
    padding: 6,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
    minHeight: 14,
  },
  label: {
    fontSize: 12,
    marginRight: 3,
    marginBottom: 1,
  },
  inputLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 13,
    marginLeft: 2,
  },
  // Classe específica para as linhas curtas CPF
  shortInputLineCPF: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 13,
    marginLeft: 2,
    width: "33%",
  },
  // Classe específica para as linhas curtas CPF
  shortInputLineCAU: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 13,
    marginLeft: 2,
    width: "25%",
  },
  // --- Corpo do Texto ---
  bodyTextContainer: {
    marginTop: 5,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 12,
    textAlign: "justify",
    marginBottom: 10,
    lineHeight: 1.4,
  },
  boldUnderline: {
    fontWeight: "bold",
    textDecoration: "underline",
  },
  // --- Datas e Assinaturas ---
  dateSection: {
    marginTop: 15,
    textAlign: "center",
    marginBottom: 30,
  },
  signatureSection: {
    marginTop: 5,
    paddingHorizontal: 10,
  },
  signatureBlock: {
    marginBottom: 25,
  },
  signatureLine: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    borderBottomStyle: "dotted",
    width: "70%",
    marginBottom: 5,
  },
  signatureLabel: {
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
  footerObs: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 10,
    textAlign: "justify",
    lineHeight: 1.2,
  },
  footerAddressContainer: {
    borderTopWidth: 2,
    borderTopColor: "#002060",
    paddingTop: 4,
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
const TermoCienciaLayout = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 1. Cabeçalho */}
      <View style={styles.headerContainer}>
        <Image style={styles.image} src={logo} />
      </View>

      {/* 2. Título */}
      <Text style={styles.headerTitle}>TERMO DE CIÊNCIA E CONCORDÂNCIA</Text>

      {/* 3. Primeira Caixa */}
      <View style={styles.boxContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>PROPRIETÁRIO/REQUERENTE:</Text>
          <View style={styles.inputLine} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>CPF:</Text>
          {/* CORREÇÃO AQUI: Usando shortInputLine para forçar a exibição */}
          <View style={styles.shortInputLineCPF} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>PROFISSIONAL RESPONSÁVEL:</Text>
          <View style={styles.inputLine} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>CAU/CREA:</Text>
          {/* CORREÇÃO AQUI: Usando shortInputLine para forçar a exibição */}
          <View style={styles.shortInputLineCAU} />
        </View>
      </View>

      {/* 4. Segunda Caixa */}
      <View style={styles.boxContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>ENDEREÇO DO IMÓVEL:</Text>
          <View style={styles.inputLine} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>LOTE:</Text>
          <View style={[styles.inputLine, { flex: 1 }]} />

          <Text style={[styles.label, { marginLeft: 15 }]}>QUADRA:</Text>
          <View style={[styles.inputLine, { flex: 1 }]} />

          <Text style={[styles.label, { marginLeft: 15 }]}>
            CÓDIGO IMOBILIÁRIO:
          </Text>
          <View style={[styles.inputLine, { flex: 1.2 }]} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>NOME DO LOTEAMENTO:</Text>
          <View style={styles.inputLine} />
        </View>
      </View>

      {/* 5. Corpo do Texto */}
      <View style={styles.bodyTextContainer}>
        <Text style={styles.bodyText}>
          {"              "}O Requerente declara, para os devidos fins de
          direito, estar ciente que o “habitese” do imóvel acima referido
          somente será expedido após conclusão total da execução infraestrutura
          urbana, dando condições mínimas de habitabilidade conforme ajustado
          com o Ministério Público do Estado de Minas Gerais - MPMG, bem como do
          passeio público, arborização e plantio de grama, rampas de
          acessibilidade, em toda a extensão da quadra onde seu imóvel estiver
          situado, com o devido acesso nos moldes expostos acima.
        </Text>
        <Text style={styles.bodyText}>
          {"              "}Neste ato, o Requerente{" "}
          <Text style={styles.boldUnderline}>
            DECLARA ESTAR DE PLENO ACORDO AO AQUI DELINEADO.
          </Text>
        </Text>
      </View>

      {/* 6. Data */}
      <Text style={styles.dateSection}>
        Uberaba, ......... de ......................................... de
        ...................
      </Text>

      {/* 7. Assinaturas */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>
            NOME E ASSINATURA DO PROPRIETÁRIO
          </Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>
            NOME E ASSINATURA DO AUTOR DO PROJETO
          </Text>
        </View>
      </View>

      {/* 8. Rodapé */}
      <View style={styles.footer}>
        <Text style={styles.footerObs}>
          Obs.: As diretrizes da aprovação do loteamento poderão ser solicitadas
          através do pedido formalizado de acesso à informação, conforme
          estabelecido pela Lei Federal nº 12.527/2011.
        </Text>
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

export default TermoCienciaLayout;
