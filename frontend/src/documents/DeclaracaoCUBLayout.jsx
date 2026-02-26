import React from "react";
import logo from "../assets/imgDocumentos/secretariaFazenda.png";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// ==================================================================
// ESTILOS DA DECLARAÇÃO DE CUSTOS (CUB) - CAIXA DE ENDEREÇO BLINDADA
// ==================================================================
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
  // --- Corpo de Texto ---
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
  // --- Tabela CUB ---
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
  // --- Data e Declarantes ---
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
  },
  // --- Rodapé e Observação ---
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

// ==================================================================
// SUBCOMPONENTE DE CHECKBOX
// ==================================================================
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
        transform: "translateY(1px)",
      }}
    >
      {checked && (
        <Text style={{ fontSize: 7, fontFamily: "Times-Bold" }}>X</Text>
      )}
    </View>
    <Text style={{ fontSize: 8.5, paddingTop: 1 }}>{label}</Text>
  </View>
);

// ==================================================================
// O COMPONENTE DO DOCUMENTO
// ==================================================================
const DeclaracaoCUBLayout = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 1. Cabeçalho */}
      <View style={styles.headerContainer}>
        <Image style={styles.image} src={logo} />
      </View>

      {/* 2. Título */}
      <Text style={styles.title}>
        DECLARAÇÃO DE CLASSIFICAÇÃO CONFORME CUSTOS UNITÁRIOS BÁSICOS DE{"\n"}
        CONSTRUÇÃO (CUB)
      </Text>

      {/* 3. Corpo de Texto */}
      <View style={styles.formSection}>
        <Text style={styles.paragraph}>
          {"        "}À Prefeitura Municipal de Uberaba,
        </Text>
        <Text style={styles.paragraph}>
          {"        "}Na qualidade de proprietário e de responsável técnico pela
          execução da obra, referente a
        </Text>

        {/* Linha 3: Checkboxes */}
        <View style={styles.rowInline}>
          <View style={styles.checkboxBox}>
            <Checkbox label="CONSTRUÇÃO" />
            <Checkbox label="REFORMA" />
            <Checkbox label="AMPLIAÇÃO" noMargin />
          </View>
          <Text style={styles.textBase}>, de edificação com área de </Text>
          <View
            style={{
              flex: 1,
              borderBottomWidth: 1,
              borderColor: "#000",
              marginHorizontal: 2,
            }}
          />
          <Text style={styles.textBase}> m², a ser</Text>
        </View>

        {/* Linha 4: Endereço 1 */}
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
            }}
          />
        </View>

        {/* Linha 5: Endereço 2 */}
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

        {/* Linha 6: Código do Imóvel */}
        <View style={styles.rowInline}>
          <Text style={styles.textBase}>
            código de identificação do imóvel{" "}
          </Text>
          <View
            style={{
              width: 35,
              borderBottomWidth: 1,
              borderColor: "#000",
              marginHorizontal: 2,
            }}
          />
          <Text style={styles.textBase}>.</Text>
          <View
            style={{
              width: 35,
              borderBottomWidth: 1,
              borderColor: "#000",
              marginHorizontal: 2,
            }}
          />
          <Text style={styles.textBase}>.</Text>
          <View
            style={{
              width: 35,
              borderBottomWidth: 1,
              borderColor: "#000",
              marginHorizontal: 2,
            }}
          />
          <Text style={styles.textBase}>-</Text>
          <View
            style={{
              width: 35,
              borderBottomWidth: 1,
              borderColor: "#000",
              marginHorizontal: 2,
            }}
          />
          <Text style={styles.textBase}>
            , declaramos, para os devidos fins,
          </Text>
        </View>

        {/* Linha 7 e 8: Restante do parágrafo */}
        <Text
          style={[styles.paragraph, { textAlign: "justify", marginTop: 2 }]}
        >
          que a obra de construção civil supracitada corresponde a seguinte
          classificação conforme os Custos Unitários Básicos de Construção
          (CUB), publicada pelo Sindicato da Indústria da Construção Civil no
          Estado de Minas Gerais (SINDUSCON - MG):
        </Text>
      </View>

      {/* 4. Tabelas CUB */}
      <View style={styles.tableSection}>
        <View style={styles.tableTitleBox}>
          <Text style={styles.tableTitleText}>
            Caracterização dos projetos-padrão conforme a ABNT NBR 12721:2006
          </Text>
        </View>

        {/* Tabelas Lado a Lado (Separadas) */}
        <View style={styles.tablesWrapper}>
          {/* Tabela 1: Esquerda */}
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
                <Checkbox label="R-1" />
              </View>
              <View style={styles.cell}>
                <Checkbox label="R-1" checked />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox label="R-1" />
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Checkbox label="PP-4" />
              </View>
              <View style={styles.cell}>
                <Checkbox label="PP-4" />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox label="R-8" />
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Checkbox label="R-8" />
              </View>
              <View style={styles.cell}>
                <Checkbox label="R-8" />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox label="R-16" />
              </View>
            </View>
            <View style={[styles.tr, { borderBottomWidth: 0 }]}>
              <View style={styles.cell}>
                <Checkbox label="PIS" />
              </View>
              <View style={styles.cell}>
                <Checkbox label="R-16" />
              </View>
              <View style={styles.cellNoBorder}></View>
            </View>
          </View>

          {/* Tabela 2: Direita */}
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
                <Checkbox label="CAL-8" />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox label="CAL-8" />
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.cell}>
                <Checkbox label="CSL-8" />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox label="CSL-8" />
              </View>
            </View>
            <View style={[styles.tr, { borderBottomWidth: 0 }]}>
              <View style={styles.cell}>
                <Checkbox label="CSL-16" />
              </View>
              <View style={styles.cellNoBorder}>
                <Checkbox label="CSL-16" />
              </View>
            </View>
          </View>
        </View>

        {/* Tabela 3: Inferior */}
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
              <Checkbox label="RP1Q" />
            </View>
            <View style={{ width: "45%", padding: 3 }}>
              <Checkbox label="GI" />
            </View>
          </View>
        </View>
      </View>

      {/* 5. Data */}
      <View style={styles.dateRow}>
        <Text style={styles.textBase}>Uberaba - MG, </Text>
        <View
          style={{
            width: 40,
            borderBottomWidth: 1,
            borderColor: "#000",
            marginHorizontal: 2,
          }}
        />
        <Text style={styles.textBase}> , de </Text>
        <View
          style={{
            width: 120,
            borderBottomWidth: 1,
            borderColor: "#000",
            marginHorizontal: 2,
          }}
        />
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
            2025
          </Text>
        </View>
      </View>

      {/* 6. Declarantes */}
      <View style={{ width: "100%" }}>
        <Text style={styles.declarantesTitle}>Declarantes:</Text>

        {/* Titular */}
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>
            Nome do titular/responsável pela obra:
          </Text>
          <View style={styles.decInput} />
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>CPF:</Text>
          <View style={[styles.decInput, { flex: 0.6 }]} />
          <Text style={[styles.decLabel, { marginLeft: 15 }]}>Telefone:</Text>
          <View style={styles.decInput} />
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>E-mail:</Text>
          <View style={styles.decInput} />
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>Assinatura:</Text>
          <View style={styles.decInput} />
        </View>

        {/* Responsável Técnico (Com espaçamento maior no topo) */}
        <View style={[styles.decRow, { marginTop: 20 }]}>
          <Text style={styles.decLabel}>
            Nome do responsável técnico pela obra:
          </Text>
          <View style={styles.decInput} />
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>Registro profissional:</Text>
          <View style={[styles.decInput, { flex: 0.5 }]} />
          <Text style={[styles.decLabel, { marginLeft: 15 }]}>ART:</Text>
          <View style={styles.decInput} />
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>Telefone:</Text>
          <View style={[styles.decInput, { flex: 0.4 }]} />
          <Text style={[styles.decLabel, { marginLeft: 15 }]}>E-mail:</Text>
          <View style={styles.decInput} />
        </View>
        <View style={styles.decRow}>
          <Text style={styles.decLabel}>Assinatura:</Text>
          <View style={styles.decInput} />
        </View>
      </View>

      {/* 7. Observação (Movida para fixar no fim da tela) */}
      <Text style={styles.obs}>
        Observação: É obrigatório selecionar a classificações do CUB e preencher
        corretamente todas as informações solicitadas acima.
      </Text>

      {/* 8. Rodapé Cercado */}
      <View style={styles.footerBox}>
        <Text style={styles.footerText}>
          Av. Dom Luiz Maria Santana, 141 – CEP 38061-080 – Uberaba/MG – (34)
          3318-2000 – www.uberaba.mg.gov.br
        </Text>
      </View>
    </Page>
  </Document>
);

export default DeclaracaoCUBLayout;
