import React from "react";
import { ID_YBYOCA, ID_VOGELKOP } from "../constants/escritorios";
import logo from "../assets/imgDocumentos/secretariaFazenda.png";
import {
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  Svg,
  Path,
} from "@react-pdf/renderer";

Font.register({
  family: "Times-Roman",
  fonts: [{ src: "https://fonts.cdnfonts.com/s/16014/Times New Roman.woff" }],
});
Font.register({
  family: "Times-Bold",
  fonts: [
    { src: "https://fonts.cdnfonts.com/s/16014/Times New Roman Bold.woff" },
  ],
});
const styles = StyleSheet.create({
  page: {
    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 40,
    fontFamily: "Times-Roman",
    fontSize: 11,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    height: 45,
  },
  image: {
    width: 240,
    height: 45,
    objectFit: "contain",
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 10,
  },
  formSection: {
    marginBottom: 8,
    width: "100%",
  },
  textBase: {
    fontSize: 11,
    paddingBottom: 1,
  },
  rowInline: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
    width: "100%",
    minHeight: 14,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.2,
  },
  tableSection: {
    marginBottom: 8,
    width: "100%",
  },
  tableTitleBox: {
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    marginBottom: 4,
    alignItems: "center",
    width: "100%",
  },
  tableTitleText: {
    fontSize: 10,
  },
  tablesWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  tableLeft: {
    width: "53%",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRight: {
    width: "45%",
    borderWidth: 1,
    borderColor: "#000",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    width: "100%",
  },
  th: {
    fontFamily: "Times-Bold",
    fontSize: 8.5,
    lineHeight: 1.1,
  },
  td: {
    fontSize: 8,
  },
  cell: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 3,
    justifyContent: "center",
  },
  checkboxBox: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 3,
    marginRight: 4,
    alignItems: "center",
  },
  cellNoBorder: {
    flex: 1,
    padding: 3,
    justifyContent: "center",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginBottom: 8,
    width: "100%",
  },
  declarantesTitle: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    marginBottom: 5,
  },
  decRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    width: "100%",
  },
  decLabel: {
    fontSize: 10,
    marginRight: 4,
  },
  decInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 10,
    position: "relative",
  },
  fillText: {
    position: "absolute",
    bottom: 2,
    left: 0,
    fontSize: 10,
    textTransform: "uppercase",
  },
  obs: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    position: "absolute",
    bottom: 45,
    left: 40,
    right: 40,
  },
  footerBox: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
    paddingVertical: 3,
    alignItems: "center",
  },
  footerText: {
    fontSize: 8.5,
  },
});

const Checkbox = ({ label, checked, noMargin }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginRight: noMargin ? 0 : 5,
    }}
  >
    <View
      style={{
        width: 9,
        height: 9,
        borderWidth: 1,
        borderColor: "#000",
        marginRight: 2,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      {checked && (
        <Svg viewBox="0 0 24 24" width={7} height={7}>
          <Path
            d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"
            fill="#000"
          />
        </Svg>
      )}
    </View>
    <Text style={{ fontSize: 8.5, paddingTop: 1 }}>{label}</Text>
  </View>
);

const DeclaracaoCUBLayout = ({ cliente }) => {
  const isReformaObra = cliente?.tipo?.toLowerCase().includes("reforma");
  const isConstrucaoObra = !isReformaObra;

  const tipoProjeto = cliente?.cub_tipo_projeto || "";
  const padraoProjeto = cliente?.cub_padrao || "";
  const nomProjeto = cliente?.cub_nomenclatura
    ? cliente.cub_nomenclatura.trim()
    : "";

  let contatoTelefone = "";
  let contatoEmail = "";
  if (cliente?.escritorio_id === ID_YBYOCA) {
    contatoTelefone = "34 9 9855-3710";
    contatoEmail = "ybyoca.studio@gmail.com";
  } else if (cliente?.escritorio_id === ID_VOGELKOP) {
    contatoTelefone = "34 9 8417-4206";
    contatoEmail = "arquiteturavogelkop@gmail.com";
  }

  const enderecoCompleto = `${cliente?.rua_obra || ""} ${cliente?.numero_obra ? `, ${cliente.numero_obra}` : ""} ${cliente?.bairro_obra ? `- ${cliente.bairro_obra}` : ""}`;

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

  const codImovel = cliente?.codigo_identificacao_imovel || "";

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Image style={styles.image} src={logo} />
      </View>

      <Text style={styles.title}>
        DECLARAÇÃO DE CLASSIFICAÇÃO CONFORME CUSTOS UNITÁRIOS BÁSICOS DE{"\n"}
        CONSTRUÇÃO (CUB)
      </Text>

      <View style={styles.formSection}>
        <Text style={styles.paragraph}>
          {"        "}À Prefeitura Municipal de Uberaba,
        </Text>
        <Text style={styles.paragraph}>
          {"        "}Na qualidade de proprietário e de responsável técnico pela
          execução da obra, referente a
        </Text>

        <View style={styles.rowInline}>
          <View style={styles.checkboxBox}>
            <Checkbox label="CONSTRUÇÃO" checked={isConstrucaoObra} />
            <Checkbox label="REFORMA" checked={isReformaObra} />
            <Checkbox label="AMPLIAÇÃO" noMargin checked={false} />
          </View>
          <Text style={styles.textBase}>, de edificação com área de </Text>
          <View
            style={{
              flex: 1,
              borderBottomWidth: 1,
              borderColor: "#000",
              marginHorizontal: 2,
              position: "relative",
            }}
          >
            <Text
              style={[
                styles.fillText,
                { bottom: 1, width: "100%", textAlign: "center" },
              ]}
            >
              {cliente?.tamanho_m2 || ""}
            </Text>
          </View>
          <Text style={styles.textBase}> m², a ser</Text>
        </View>

        <View style={styles.rowInline}>
          <Text style={styles.textBase}>
            executada no imóvel localizado na{" "}
          </Text>
          <View
            style={{
              flex: 1,
              borderBottomWidth: 1,
              borderColor: "#000",
              marginLeft: 2,
              position: "relative",
            }}
          >
            <Text style={[styles.fillText, { bottom: 1, marginLeft: 4 }]}>
              {enderecoCompleto}
            </Text>
          </View>
        </View>

        <View style={styles.rowInline}>
          <View
            style={{
              flex: 1,
              borderBottomWidth: 1,
              borderColor: "#000",
              marginRight: 2,
            }}
          />
          <Text style={styles.textBase}> (ENDEREÇO),</Text>
        </View>

        <View style={styles.rowInline}>
          <Text style={styles.textBase}>
            código de identificação do imóvel{" "}
          </Text>
          <View
            style={{
              flex: 1,
              borderBottomWidth: 1,
              borderColor: "#000",
              marginHorizontal: 2,
              position: "relative",
            }}
          >
            <Text
              style={[
                styles.fillText,
                { bottom: 1, textAlign: "center", width: "100%" },
              ]}
            >
              {codImovel}
            </Text>
          </View>
          <Text style={styles.textBase}>
            , declaramos, para os devidos fins,
          </Text>
        </View>

        <Text
          style={[styles.paragraph, { textAlign: "justify", marginTop: 2 }]}
        >
          que a obra de construção civil supracitada corresponde a seguinte
          classificação conforme os Custos Unitários Básicos de Construção
          (CUB), publicada pelo Sindicato da Indústria da Construção Civil no
          Estado de Minas Gerais (SINDUSCON - MG):
        </Text>
      </View>

      <View style={styles.tableSection}>
        <View style={styles.tableTitleBox}>
          <Text style={styles.tableTitleText}>
            Caracterização dos projetos-padrão conforme a ABNT NBR 12721:2006
          </Text>
        </View>

        <View style={styles.tablesWrapper}>
          <View style={styles.tableLeft}>
            <View style={styles.tr}>
              <View style={[styles.cellNoBorder, { alignItems: "flex-start" }]}>
                <Text style={styles.th}>
                  1. PROJETOS – PADRÃO RESIDENCIAIS:
                </Text>
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Text style={styles.td}>1.1. PADRÃO BAIXO</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.td}>1.2. PADRÃO NORMAL</Text>
              </View>
              <View style={styles.cellNoBorder}>
                <Text style={styles.td}>1.3. PADRÃO ALTO</Text>
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Checkbox
                  label="R-1"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Baixo" &&
                    nomProjeto === "R1"
                  }
                />
              </View>
              <View style={styles.cell}>
                <Checkbox
                  label="R-1"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Normal" &&
                    nomProjeto === "R1"
                  }
                />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox
                  label="R-1"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Alto" &&
                    nomProjeto === "R1"
                  }
                />
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Checkbox
                  label="PP-4"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Baixo" &&
                    nomProjeto === "PP-4"
                  }
                />
              </View>
              <View style={styles.cell}>
                <Checkbox
                  label="PP-4"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Normal" &&
                    nomProjeto === "PP-4"
                  }
                />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox
                  label="R-8"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Alto" &&
                    nomProjeto === "R8"
                  }
                />
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Checkbox
                  label="R-8"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Baixo" &&
                    nomProjeto === "R8"
                  }
                />
              </View>
              <View style={styles.cell}>
                <Checkbox
                  label="R-8"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Normal" &&
                    nomProjeto === "R8"
                  }
                />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox
                  label="R-16"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Alto" &&
                    nomProjeto === "R16"
                  }
                />
              </View>
            </View>
            <View style={[styles.tr, { borderBottomWidth: 0 }]}>
              <View style={styles.cell}>
                <Checkbox
                  label="PIS"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Baixo" &&
                    nomProjeto === "PIS"
                  }
                />
              </View>
              <View style={styles.cell}>
                <Checkbox
                  label="R-16"
                  checked={
                    tipoProjeto === "Residencial" &&
                    padraoProjeto === "Normal" &&
                    nomProjeto === "R16"
                  }
                />
              </View>
              <View style={styles.cellNoBorder}></View>
            </View>
          </View>

          <View style={styles.tableRight}>
            <View style={styles.tr}>
              <View style={[styles.cellNoBorder, { alignItems: "flex-start" }]}>
                <Text style={styles.th}>
                  2. PROJETOS - PADRÃO COMERCIAIS CAL (Comercial Andares Livres)
                  e CSL (Comercial Salas e Lojas)
                </Text>
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Text style={styles.td}>2.1. PADRÃO NORMAL</Text>
              </View>
              <View style={styles.cellNoBorder}>
                <Text style={styles.td}>2.2. PADRÃO ALTO</Text>
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Checkbox
                  label="CAL-8"
                  checked={
                    tipoProjeto === "Comercial" &&
                    padraoProjeto === "Normal" &&
                    nomProjeto === "CAL-8"
                  }
                />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox
                  label="CAL-8"
                  checked={
                    tipoProjeto === "Comercial" &&
                    padraoProjeto === "Alto" &&
                    nomProjeto === "CAL-8"
                  }
                />
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Checkbox
                  label="CSL-8"
                  checked={
                    tipoProjeto === "Comercial" &&
                    padraoProjeto === "Normal" &&
                    nomProjeto === "CSL-8"
                  }
                />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox
                  label="CSL-8"
                  checked={
                    tipoProjeto === "Comercial" &&
                    padraoProjeto === "Alto" &&
                    nomProjeto === "CSL-8"
                  }
                />
              </View>
            </View>
            <View style={[styles.tr, { borderBottomWidth: 0 }]}>
              <View style={styles.cell}>
                <Checkbox
                  label="CSL-16"
                  checked={
                    tipoProjeto === "Comercial" &&
                    padraoProjeto === "Normal" &&
                    nomProjeto === "CSL-16"
                  }
                />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox
                  label="CSL-16"
                  checked={
                    tipoProjeto === "Comercial" &&
                    padraoProjeto === "Alto" &&
                    nomProjeto === "CSL-16"
                  }
                />
              </View>
            </View>
          </View>
        </View>

        <View
          style={{
            width: "100%",
            borderWidth: 1,
            borderColor: "#000",
            marginTop: 8,
          }}
        >
          <View
            style={{ borderBottomWidth: 1, borderColor: "#000", padding: 3 }}
          >
            <Text style={styles.th}>
              3. PROJETOS - PADRÃO GALPÃO INDUSTRIAL (GI) E RESIDÊNCIA POPULAR
              (RP1Q)
            </Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                width: "55%",
                borderRightWidth: 1,
                borderColor: "#000",
                padding: 3,
              }}
            >
              <Checkbox
                label="RP1Q"
                checked={tipoProjeto === "Industrial" && nomProjeto === "RP1Q"}
              />
            </View>
            <View style={{ width: "45%", padding: 3 }}>
              <Checkbox
                label="GI"
                checked={tipoProjeto === "Industrial" && nomProjeto === "GI"}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.textBase}>Uberaba - MG, </Text>
        <View
          style={{
            width: 40,
            borderBottomWidth: 1,
            borderColor: "#000",
            marginHorizontal: 2,
            position: "relative",
          }}
        >
          <Text
            style={[
              styles.fillText,
              { bottom: 1, width: "100%", textAlign: "center" },
            ]}
          >
            {hoje.getDate()}
          </Text>
        </View>
        <Text style={styles.textBase}> , de </Text>
        <View
          style={{
            width: 120,
            borderBottomWidth: 1,
            borderColor: "#000",
            marginHorizontal: 2,
            position: "relative",
          }}
        >
          <Text
            style={[
              styles.fillText,
              {
                bottom: 1,
                width: "100%",
                textAlign: "center",
                textTransform: "lowercase",
              },
            ]}
          >
            {meses[hoje.getMonth()]}
          </Text>
        </View>
        <Text style={styles.textBase}> de </Text>
        <View
          style={{
            width: 35,
            borderBottomWidth: 1,
            borderColor: "#000",
            marginLeft: 2,
          }}
        >
          <Text style={{ fontSize: 10, textAlign: "center", paddingBottom: 1 }}>
            {hoje.getFullYear()}
          </Text>
        </View>
      </View>

      <View style={{ width: "100%" }}>
        <Text style={styles.declarantesTitle}>Declarantes:</Text>

        <View style={styles.decRow}>
          <Text style={styles.decLabel}>
            Nome do titular/responsável pela obra:
          </Text>
          <View style={styles.decInput}>
            <Text style={[styles.fillText, { marginLeft: 4 }]}>
              {cliente?.nome || ""}
            </Text>
          </View>
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>CPF:</Text>
          <View style={[styles.decInput, { flex: 0.6 }]}>
            <Text style={[styles.fillText, { marginLeft: 4 }]}>
              {cliente?.cpf || ""}
            </Text>
          </View>
          <Text style={[styles.decLabel, { marginLeft: 15 }]}>Telefone:</Text>
          <View style={styles.decInput}>
            <Text style={[styles.fillText, { marginLeft: 4 }]}>
              {contatoTelefone}
            </Text>
          </View>
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>E-mail:</Text>
          <View style={styles.decInput}>
            <Text
              style={[
                styles.fillText,
                { textTransform: "none", marginLeft: 4 },
              ]}
            >
              {contatoEmail}
            </Text>
          </View>
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>Assinatura:</Text>
          <View style={styles.decInput} />
        </View>

        <View style={[styles.decRow, { marginTop: 20 }]}>
          <Text style={styles.decLabel}>
            Nome do responsável técnico pela obra:
          </Text>
          <View style={styles.decInput}>
            <Text style={[styles.fillText, { marginLeft: 4 }]}>
              LINCOLN SILVA DE OLIVEIRA
            </Text>
          </View>
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>Registro profissional:</Text>
          <View style={[styles.decInput, { flex: 0.5 }]}>
            <Text style={[styles.fillText, { marginLeft: 4 }]}>216305/D</Text>
          </View>
          <Text style={[styles.decLabel, { marginLeft: 15 }]}>ART:</Text>
          <View style={styles.decInput}>
            <Text style={[styles.fillText, { marginLeft: 4 }]}>
              {cliente?.art || ""}
            </Text>
          </View>
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>Telefone:</Text>
          <View style={[styles.decInput, { flex: 0.4 }]}>
            <Text style={[styles.fillText, { marginLeft: 4 }]}>
              {contatoTelefone}
            </Text>
          </View>
          <Text style={[styles.decLabel, { marginLeft: 15 }]}>E-mail:</Text>
          <View style={styles.decInput}>
            <Text
              style={[
                styles.fillText,
                { textTransform: "none", marginLeft: 4 },
              ]}
            >
              {contatoEmail}
            </Text>
          </View>
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>Assinatura:</Text>
          <View style={styles.decInput} />
        </View>
      </View>

      <Text style={styles.obs}>
        Observação: É obrigatório selecionar a classificações do CUB e preencher
        corretamente todas as informações solicitadas acima.
      </Text>

      <View style={styles.footerBox}>
        <Text style={styles.footerText}>
          Av. Dom Luiz Maria Santana, 141 – CEP 38061-080 – Uberaba/MG – (34)
          3318-2000 – www.uberaba.mg.gov.br
        </Text>
      </View>
    </Page>
  );
};

export default DeclaracaoCUBLayout;
