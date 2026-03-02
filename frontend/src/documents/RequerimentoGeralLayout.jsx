import React from "react";
import logo from "../assets/imgDocumentos/secretariaMunicipalAdministracao.jpg";
import { Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

// Registar fontes padrão
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
// ESTILOS DO REQUERIMENTO GERAL - IDÊNTICO AO MODELO OFICIAL
// ==================================================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 25,
    fontFamily: "Helvetica",
  },
  // --- Cabeçalho Superior ---
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    width: "100%",
  },
  logoBox: {
    width: 80,
    alignItems: "flex-start",
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingRight: 80, // Compensar a largura do logo para centrar o texto perfeitamente
  },
  headerGovText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    textAlign: "center",
  },
  headerSecText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  // --- Faixas Cinzentas (Títulos) ---
  grayTitleBox: {
    borderRadius: "3px",
    backgroundColor: "#E0E0E0",
    borderWidth: 1.3,
    borderColor: "#000",
    paddingVertical: 4,
    marginBottom: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  grayTitle: {
    textAlign: "center",
    marginTop: 2.5,
    marginBottom: 5,
  },
  grayTitleText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  // --- Repartição (Caixas Superiores) ---
  repContainer: {
    marginBottom: 8,
    width: "100%",
  },
  repAlignRight: {
    textAlign: "right",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    marginBottom: 0,
    marginRight: 0,
  },
  repRow: {
    border: "1px solid #000",
    padding: "15px 8px",
    borderColor: "#000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
  },
  repItem: {
    alignItems: "center",
  },
  repLabel: {
    fontSize: 8,
    marginBottom: 2,
    fontFamily: "Helvetica",
  },
  repBox: {
    borderWidth: 1,
    borderColor: "#000",
    height: 18,
    backgroundColor: "#FFF",
  },
  repBoxDateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  repBoxDate: {
    borderWidth: 1,
    borderColor: "#000",
    height: 18,
    width: 20,
    backgroundColor: "#FFF",
  },
  repDateSlash: {
    fontSize: 10,
    marginHorizontal: 3,
  },
  // --- Aviso ---
  warningText: {
    fontSize: 12,
    fontFamily: "Helvetica-Oblique",
    textAlign: "justify",
    fontWeight: "800",
    marginBottom: 8,
  },
  // --- Linhas dos Inputs (Inline) ---
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    width: "100%",
  },
  inputLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    marginRight: 4,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: "#000",
    height: 16,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  inputText: {
    fontSize: 8,
    textTransform: "uppercase",
  },
  // --- Textos Soltos e Pedido ---
  bodyText: {
    fontSize: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  pedidoBox: {
    borderWidth: 1,
    borderColor: "#000",
    height: 90,
    width: "100%",
    marginBottom: 5,
    padding: 4,
  },
  // --- Datas e Assinaturas ---
  deferimentoText: {
    fontSize: 9,
    marginTop: 4,
    marginBottom: 10,
  },
  dateSignContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  signBlock: {
    width: 250,
    alignItems: "center",
  },
  signLineContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    marginBottom: 2,
  },
  signLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    marginLeft: 4,
  },
  signSub: {
    fontSize: 7,
  },
  // --- Orientações Gerais ---
  orientacoesBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 4,
    marginTop: 5,
  },
  orientacoesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    marginBottom: 3,
  },
  orientacoesText: {
    fontSize: 7.5,
    marginBottom: 2,
    lineHeight: 1.2,
  },
  // --- Rodapé ---
  footerText: {
    fontSize: 7,
    textAlign: "center",
    marginTop: 5,
  },
});

// ==================================================================
// COMPONENTE DE INPUT INLINE
// ==================================================================
const InlineInput = ({ label, value, flex = 1, marginRight = 5 }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      flex: flex,
      marginRight: marginRight,
    }}
  >
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputBox, { flex: 1 }]}>
      <Text style={styles.inputText}>{value || ""}</Text>
    </View>
  </View>
);

// ==================================================================
// O COMPONENTE DO DOCUMENTO
// ==================================================================
const RequerimentoGeralLayout = ({ cliente }) => {
  // Lógica de Contato (Telefone e Email)
  let contatoTelefone = cliente?.telefone || "";
  let contatoEmail = cliente?.email || "";

  if (cliente?.escritorio_id === "YB") {
    contatoTelefone = "34 9 9855-3710";
    contatoEmail = "ybyoca.studio@gmail.com";
  } else if (cliente?.escritorio_id === "VK") {
    contatoTelefone = "34 9 8417-4206";
    contatoEmail = "arquiteturavogelkop@gmail.com";
  }

  // Tratamento de Data
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = String(hoje.getFullYear());

  return (
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
          <Text style={styles.headerGovText}>
            SECRETARIA MUNICIPAL DE ADMINISTRAÇÃO
          </Text>
        </View>
      </View>

      <View style={styles.grayTitleBox}>
        <Text style={styles.grayTitleText}>REQUERIMENTO GERAL</Text>
      </View>

      {/* 2. Para Uso da Repartição (Layout Horizontal Fiel) */}
      <View style={styles.repContainer}>
        <Text style={styles.repAlignRight}>PARA USO DA REPARTIÇÃO</Text>
        <View style={styles.repRow}>
          <View style={styles.repItem}>
            <Text style={styles.repLabel}>TP</Text>
            <View style={[styles.repBox, { width: 30 }]} />
          </View>
          <View style={styles.repItem}>
            <Text style={styles.repLabel}>PROCESSO</Text>
            <View style={[styles.repBox, { width: 60 }]} />
          </View>
          <View style={styles.repItem}>
            <Text style={styles.repLabel}>EXERCÍCIO</Text>
            <View style={[styles.repBox, { width: 50 }]} />
          </View>
          <View style={styles.repItem}>
            <Text style={styles.repLabel}>FOLHA</Text>
            <View style={[styles.repBox, { width: 40 }]} />
          </View>
          <View style={styles.repItem}>
            <Text style={styles.repLabel}>PROTOCOLADO EM:</Text>
            <View style={styles.repBoxDateRow}>
              <View style={styles.repBoxDate} />
              <Text style={styles.repDateSlash}>/</Text>
              <View style={styles.repBoxDate} />
              <Text style={styles.repDateSlash}>/</Text>
              <View style={[styles.repBoxDate, { width: 35 }]} />
            </View>
          </View>
          <View style={styles.repItem}>
            <Text style={styles.repLabel}>ASSINATURA DO PROTOCOLO:</Text>
            <View style={[styles.repBox, { width: 140 }]} />
          </View>
        </View>
      </View>

      {/* 3. Aviso e Títulos Principais */}
      <Text style={styles.warningText}>
        Caso não consiga inserir informações, favor ler o "Aviso de Segurança"
        acima do texto, clicar em "opções" e marcar a opção "Habilitar este
        conteúdo".
      </Text>

      <View style={styles.grayTitleBox}>
        <Text style={styles.grayTitleText}>
          EXMO. SR. PREFEITO MUNICIPAL DE UBERABA
        </Text>
      </View>

      <View style={styles.grayTitle}>
        <Text style={styles.grayTitleText}>IDENTIFICAÇÃO DO REQUERENTE</Text>
      </View>

      {/* 4. Formulário do Requerente */}
      <View style={styles.inputRow}>
        <InlineInput label="Nome:" value={cliente?.nome} marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <InlineInput label="Cart.Identidade:" value={cliente?.rg} flex={1.2} />
        <InlineInput
          label="Profissão:"
          value={cliente?.profissao}
          flex={1}
          marginRight={0}
        />
      </View>
      <View style={styles.inputRow}>
        <InlineInput label="CPF/CNPJ:" value={cliente?.cpf} flex={1.2} />
        <InlineInput
          label="Inscrição Municipal:"
          value=""
          flex={1}
          marginRight={0}
        />
      </View>
      <View style={styles.inputRow}>
        <InlineInput label="Endereço:" value={cliente?.rua} flex={5} />
        <InlineInput
          label="Nº:"
          value={cliente?.numero_casa}
          flex={1}
          marginRight={0}
        />
      </View>
      <View style={styles.inputRow}>
        <InlineInput
          label="Complemento:"
          value={cliente?.complemento}
          flex={2}
        />
        <InlineInput label="Bairro:" value={cliente?.bairro} flex={2} />
        <InlineInput
          label="Cidade:"
          value={cliente?.cidade || "UBERABA"}
          flex={2}
        />
        <InlineInput
          label="Estado:"
          value={cliente?.estado || "MG"}
          flex={1}
          marginRight={0}
        />
      </View>
      <View style={styles.inputRow}>
        <InlineInput label="CEP:" value={cliente?.cep} flex={1.2} />
        <InlineInput label="Telefone:" value={contatoTelefone} flex={1.8} />
        <InlineInput
          label="E-mail:"
          value={contatoEmail}
          flex={2.5}
          marginRight={0}
        />
      </View>

      {/* 5. Pedido */}
      <Text style={styles.bodyText}>
        Vem mui respeitosamente requerer de V. Exª, que seja submetido a exame e
        decisão dos órgãos competentes o que se segue:
      </Text>
      <Text
        style={[styles.inputLabel, { textAlign: "center", marginBottom: 2 }]}
      >
        Pedido:
      </Text>
      <View style={styles.pedidoBox}>
        <Text style={styles.inputText}>{cliente?.observacao_pmu || ""}</Text>
      </View>

      {/* 6. Assinatura do Pedido */}
      <Text style={styles.deferimentoText}>
        Nestes termos pede deferimento:
      </Text>

      <View style={styles.dateSignContainer}>
        <View style={styles.dateRow}>
          <Text style={styles.inputLabel}>Uberaba,</Text>
          <View style={styles.repBoxDate}>
            <Text
              style={[styles.inputText, { textAlign: "center", marginTop: 3 }]}
            >
              {dia}
            </Text>
          </View>
          <Text style={styles.repDateSlash}>/</Text>
          <View style={styles.repBoxDate}>
            <Text
              style={[styles.inputText, { textAlign: "center", marginTop: 3 }]}
            >
              {mes}
            </Text>
          </View>
          <Text style={styles.repDateSlash}>/</Text>
          <View style={[styles.repBoxDate, { width: 35 }]}>
            <Text
              style={[styles.inputText, { textAlign: "center", marginTop: 3 }]}
            >
              {ano}
            </Text>
          </View>
        </View>

        <View style={styles.signBlock}>
          <View style={styles.signLineContainer}>
            <Text style={styles.inputLabel}>Assinatura:</Text>
            <View style={styles.signLine} />
          </View>
          <Text style={styles.signSub}>
            (Requerente ou Representante Legal)
          </Text>
        </View>
      </View>

      {/* 7. Representante Legal */}
      <View style={[styles.grayTitle, { marginTop: 20 }]}>
        <Text style={styles.grayTitleText}>
          IDENTIFICAÇÃO DO REPRESENTANTE LEGAL (SE FOR O CASO)
        </Text>
      </View>

      <View style={styles.inputRow}>
        <InlineInput label="Nome:" value="" flex={2} />
        <InlineInput label="Qualificação:" value="" flex={1} marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <InlineInput label="Endereço:" value="" flex={5} />
        <InlineInput label="Nº:" value="" flex={1} marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <InlineInput label="Complemento:" value="" flex={1.5} />
        <InlineInput label="Bairro:" value="" flex={1.5} />
        <InlineInput label="Cidade:" value="" flex={1.5} />
        <InlineInput label="CEP:" value="" flex={1} marginRight={0} />
      </View>
      <View style={styles.inputRow}>
        <InlineInput label="Telefone:" value="" flex={1.5} />
        <InlineInput label="Documento:" value="" flex={3.5} marginRight={0} />
      </View>

      {/* 8. Orientações Gerais */}
      <View style={styles.orientacoesBox}>
        <Text style={styles.orientacoesTitle}>ORIENTAÇÕES GERAIS:</Text>
        <Text style={styles.orientacoesText}>
          Os requerimentos de Pessoas Jurídicas deverão conter razão social,
          nome fantasia, sigla (quando houver).
        </Text>
        <Text style={styles.orientacoesText}>
          Sr. Contribuinte: O preenchimento completo deste requerimento,
          agilizará a tramitação do seu expediente, bem como, facilitará futuras
          consultas.
        </Text>
        <Text style={styles.orientacoesText}>
          Obs.: Imprima esta ficha e leve ao balcão de atendimento da Prefeitura
          Municipal de Uberaba.
        </Text>
      </View>

      {/* 9. Rodapé */}
      <Text style={styles.footerText}>
        Av. Dom Luis Maria de Santana nº 141, Bairro Santa Marta{"\n"}
        CEP: 38.061-080 TELEFONE: (34) 3318-2000.
      </Text>
    </Page>
  );
};

export default RequerimentoGeralLayout;
