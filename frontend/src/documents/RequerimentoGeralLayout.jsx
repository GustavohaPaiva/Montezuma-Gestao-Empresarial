import React from "react";
import logo from "../assets/imgDocumentos/prefeitura.png";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// ==================================================================
// ESTILOS DO REQUERIMENTO GERAL - FORMULÁRIO EM BRANCO E AJUSTADO
// ==================================================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 20, // Margem reduzida para evitar quebra de página
    paddingBottom: 20,
    paddingHorizontal: 30,
    fontFamily: "Helvetica",
  },
  // --- Cabeçalho ---
  headerWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  logoBox: {
    width: "20%",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  headerCenter: {
    width: "45%",
    alignItems: "center",
    paddingTop: 5, // Alinha os textos com o topo da imagem
  },
  headerGovText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textAlign: "center",
  },
  headerSecText: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 2,
  },
  headerDocText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8, // Separando o "Requerimento Geral" para baixo
  },
  // --- Repartição (Selo) ---
  repBox: {
    width: "32%",
    borderWidth: 1,
    borderColor: "#000",
  },
  repTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textAlign: "center",
    backgroundColor: "#e6e6e6",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  repRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  repCell: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 2,
  },
  repLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
  },
  // --- Aviso ---
  warningText: {
    fontSize: 7,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
    color: "#555",
    marginBottom: 10,
    marginTop: 5,
  },
  // --- Título Exmo ---
  exmoText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 10,
  },
  // --- Títulos das Seções ---
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingBottom: 2,
    marginBottom: 6,
    marginTop: 5,
  },
  // --- Linhas dos Inputs ---
  inputRow: {
    flexDirection: "row",
    marginBottom: 4, // Espaçamento espremido para não quebrar a folha
    width: "100%",
  },
  // --- Textos Soltos ---
  bodyText: {
    fontSize: 10,
    marginVertical: 6,
    textAlign: "justify",
  },
  // --- Datas e Assinaturas ---
  deferimentoText: {
    fontSize: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  dateSignContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  dateText: {
    fontSize: 10,
  },
  signBlock: {
    width: 200,
    borderTopWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    paddingTop: 3,
  },
  signTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  signSub: {
    fontSize: 8,
  },
  // --- Orientações ---
  orientacoesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginTop: 10,
    marginBottom: 3,
  },
  orientacoesText: {
    fontSize: 8,
    marginBottom: 2,
    color: "#333",
  },
});

// ==================================================================
// COMPONENTE DE CAIXA DE INPUT (Formato Moderno)
// ==================================================================
const BoxInput = ({
  label,
  value,
  flex = 1,
  marginRight = 5,
  height = 18,
  multiline = false,
}) => (
  <View style={{ flex: flex, marginRight: marginRight }}>
    <Text
      style={{
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        marginBottom: 1,
        color: "#333",
      }}
    >
      {label}
    </Text>
    <View
      style={{
        borderWidth: 1,
        borderColor: "#555",
        borderRadius: 2,
        paddingHorizontal: 4,
        paddingVertical: 2,
        minHeight: height,
        justifyContent: multiline ? "flex-start" : "center",
      }}
    >
      <Text style={{ fontSize: 9, lineHeight: 1.3 }}>{value}</Text>
    </View>
  </View>
);

// ==================================================================
// O COMPONENTE DO DOCUMENTO
// ==================================================================
const RequerimentoGeralLayout = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 1. Cabeçalho */}
      <View style={styles.headerWrapper}>
        <View style={styles.logoBox}>
          <Image style={styles.logo} src={logo} />
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerGovText}>
            PREFEITURA MUNICIPAL DE UBERABA
          </Text>
          <Text style={styles.headerSecText}>
            SECRETARIA MUNICIPAL DE ADMINISTRAÇÃO
          </Text>
          <Text style={styles.headerDocText}>REQUERIMENTO GERAL</Text>
        </View>

        {/* Bloco de Protocolo */}
        <View style={styles.repBox}>
          <Text style={styles.repTitle}>PARA USO DA REPARTIÇÃO</Text>
          <View style={styles.repRow}>
            <View style={styles.repCell}>
              <Text style={styles.repLabel}>TP</Text>
            </View>
            <View style={[styles.repCell, { flex: 2 }]}>
              <Text style={styles.repLabel}>PROCESSO</Text>
            </View>
            <View style={[styles.repCell, { borderRightWidth: 0 }]}>
              <Text style={styles.repLabel}>EXERCÍCIO</Text>
            </View>
          </View>
          <View style={[styles.repRow, { padding: 2, height: 16 }]}>
            <Text style={styles.repLabel}>FOLHA:</Text>
          </View>
          <View style={[styles.repRow, { padding: 2, height: 16 }]}>
            <Text style={styles.repLabel}>PROTOCOLADO EM:</Text>
          </View>
          <View style={{ padding: 2, height: 20 }}>
            <Text style={styles.repLabel}>ASSINATURA DO PROTOCOLO:</Text>
          </View>
        </View>
      </View>

      {/* 2. Aviso */}
      <Text style={styles.warningText}>
        Caso não consiga inserir informações, favor ler o "Aviso de Segurança"
        acima do texto, clicar em "opções" e marcar a opção "Habilitar este
        conteúdo".
      </Text>

      {/* 3. Destinatário */}
      <Text style={styles.exmoText}>
        EXMO. SR. PREFEITO MUNICIPAL DE UBERABA
      </Text>

      {/* 4. Identificação do Requerente */}
      <Text style={styles.sectionTitle}>IDENTIFICAÇÃO DO REQUERENTE</Text>

      <View style={styles.inputRow}>
        <BoxInput label="Nome:" value="" marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <BoxInput label="Cart. Identidade:" value="" />
        <BoxInput label="CPF/CNPJ:" value="" marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <BoxInput label="Profissão:" value="" />
        <BoxInput label="Inscrição Municipal:" value="" marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <BoxInput label="Endereço:" value="" flex={4} />
        <BoxInput label="Nº:" value="" flex={1} marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <BoxInput label="Complemento:" value="" flex={2} />
        <BoxInput label="Bairro:" value="" flex={2} />
        <BoxInput label="CEP:" value="" flex={1.5} marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <BoxInput label="Cidade:" value="" flex={4} />
        <BoxInput label="Estado:" value="" flex={1} marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <BoxInput label="Telefone:" value="" flex={1.5} />
        <BoxInput label="E-mail:" value="" flex={2.5} marginRight={0} />
      </View>

      {/* 5. Pedido */}
      <Text style={styles.bodyText}>
        Vem mui respeitosamente requerer de V. Exª, que seja submetido a exame e
        decisão dos órgãos competentes o que se segue:
      </Text>

      <View style={styles.inputRow}>
        <BoxInput
          label="Pedido:"
          value=""
          height={60}
          multiline={true}
          marginRight={0}
        />
      </View>

      {/* 6. Assinaturas */}
      <Text style={styles.deferimentoText}>
        Nestes termos pede deferimento:
      </Text>

      <View style={styles.dateSignContainer}>
        {/* Você pode preencher essas datas dinamicamente depois */}
        <Text style={styles.dateText}>Uberaba, ___ / ___ / ______</Text>

        <View style={styles.signBlock}>
          <Text style={styles.signTitle}>Assinatura:</Text>
          <Text style={styles.signSub}>
            (Requerente ou Representante Legal)
          </Text>
        </View>
      </View>

      {/* 7. Representante Legal */}
      <Text style={styles.sectionTitle}>
        Identificação do Representante Legal (se for o caso):
      </Text>

      <View style={styles.inputRow}>
        <BoxInput label="Nome:" value="" marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <BoxInput label="Endereço:" value="" flex={4} />
        <BoxInput label="Nº:" value="" flex={1} marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <BoxInput label="Complemento:" value="" flex={1} />
        <BoxInput label="Bairro:" value="" flex={1} />
        <BoxInput label="Cidade:" value="" flex={1} marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <BoxInput label="Telefone:" value="" flex={1} />
        <BoxInput label="Documento:" value="" flex={2} marginRight={0} />
      </View>

      {/* 8. Orientações Gerais */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.orientacoesTitle}>ORIENTAÇÕES GERAIS:</Text>
        <Text style={styles.orientacoesText}>
          • Os requerimentos de Pessoas Jurídicas deverão conter razão social,
          nome fantasia, sigla (quando houver).
        </Text>
        <Text style={styles.orientacoesText}>
          • Sr. Contribuinte: O preenchimento completo deste requerimento,
          agilizará a tramitação do seu expediente, bem como, facilitará futuras
          consultas.
        </Text>
        <Text style={styles.orientacoesText}>
          • Obs.: Imprima esta ficha e leve ao balcão de atendimento da
          Prefeitura Municipal de Uberaba.
        </Text>
      </View>
    </Page>
  </Document>
);

export default RequerimentoGeralLayout;
