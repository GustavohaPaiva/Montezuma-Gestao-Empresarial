import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import coverBg from "../assets/documents/ybyoca-proposta/page-1.png";
import photoCasa1 from "../assets/documents/ybyoca-proposta/crops/casa-1.png";
import photoCasa2 from "../assets/documents/ybyoca-proposta/crops/casa-2.png";
import photoEquipe from "../assets/documents/ybyoca-proposta/crops/equipe-c.png";
import qrInstagram from "../assets/documents/ybyoca-proposta/crops/qr-card.png";
import photoFachada from "../assets/documents/ybyoca-proposta/crops/fachada.png";
import photoPrancheta from "../assets/documents/ybyoca-proposta/crops/prancheta.png";
import photoInvestimento from "../assets/documents/ybyoca-proposta/crops/investimento.png";
import questrialSrc from "../assets/fonts/ybyoca/Questrial-Regular.ttf";
import montserratRegular from "../assets/fonts/ybyoca/Montserrat-Regular.ttf";
import montserratBold from "../assets/fonts/ybyoca/Montserrat-Bold.ttf";
import montserratExtraBold from "../assets/fonts/ybyoca/Montserrat-ExtraBold.ttf";
import archivoBlack from "../assets/fonts/ybyoca/ArchivoBlack-Regular.ttf";
import {
  YB_ARQUITETONICO,
  YB_BOAS_VINDAS_AGRADECIMENTO,
  YB_BOAS_VINDAS_SUFIXO,
  YB_CONDICOES_INTRO,
  YB_CONTATO,
  YB_COR_BANNER,
  YB_COR_CAPA_MASK,
  YB_COR_FUNDO,
  YB_COR_HEADER_P2,
  YB_COR_LARANJA,
  YB_COR_LARANJA_LINHA,
  YB_COR_TEXTO,
  YB_COR_TITULO,
  YB_DEMAIS_INTRO,
  YB_DEMAIS_TITULO,
  YB_EQUIPE,
  YB_INTRO_ESCRITORIO,
  YB_MARCA_ESPACADA,
  YB_OBSERVACOES,
  YB_PAGAMENTO,
  YB_SERVICOS_DETALHE,
} from "./orcamentoPropostaYbyocaTemplate";
import {
  formatarCodigoPropostaYB,
  formatarDataCabecalhoYB,
  formatarDataPropostaBR,
  formatarMoedaBRL,
  listaDemaisServicosYbyoca,
  listaServicosOferecidosYbyoca,
  normalizarPropostaDadosYbyoca,
  rotuloComplementar,
  textoEntregaArquitetonicoYbyoca,
} from "../utils/orcamentoPropostaUtils";

Font.register({ family: "Questrial", src: questrialSrc });
Font.register({
  family: "Montserrat",
  fonts: [
    { src: montserratRegular, fontWeight: 400 },
    { src: montserratBold, fontWeight: 700 },
    { src: montserratExtraBold, fontWeight: 800 },
  ],
});
Font.register({ family: "ArchivoBlack", src: archivoBlack });
Font.registerHyphenationCallback((word) => [word]);

const A4_ALTURA = 841.89;
const A4_LARGURA = 595.28;

const styles = StyleSheet.create({
  page: {
    backgroundColor: YB_COR_FUNDO,
    fontFamily: "Montserrat",
    fontWeight: 400,
    color: YB_COR_TEXTO,
    position: "relative",
  },
  fundoBox: {
    position: "absolute",
    top: 0,
    left: 0,
    width: A4_LARGURA,
    height: A4_ALTURA,
  },
  fundo: {
    width: A4_LARGURA,
    height: A4_ALTURA,
  },
  maskValorEsq: {
    position: "absolute",
    left: 31,
    width: 230,
    height: 16,
    backgroundColor: YB_COR_CAPA_MASK,
    justifyContent: "center",
  },
  maskCliente: { top: 691 },
  maskContato: { top: 738 },
  maskEndereco: { top: 785 },
  valorEsq: {
    fontSize: 13,
    fontFamily: "Montserrat",
    fontWeight: 400,
    color: "#111111",
  },
  maskValorDir: {
    position: "absolute",
    right: 28,
    width: 110,
    height: 16,
    backgroundColor: YB_COR_CAPA_MASK,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  maskProposta: { top: 731 },
  maskData: { top: 785 },
  valorDir: {
    fontSize: 13,
    fontFamily: "Montserrat",
    fontWeight: 400,
    color: "#111111",
    textAlign: "right",
  },
  headerP2: {
    position: "absolute",
    top: 0,
    left: 0,
    width: A4_LARGURA,
    height: 107,
    backgroundColor: YB_COR_HEADER_P2,
    paddingTop: 40,
    paddingHorizontal: 38,
  },
  headerP2Nome: {
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: "#111111",
  },
  headerP2Texto: {
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: 400,
    color: "#111111",
  },
  headerP2Agrad: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: 400,
    color: "#111111",
  },
  p2Intro: {
    position: "absolute",
    top: 120,
    left: 38,
    width: 516,
    fontSize: 12,
    lineHeight: 1.72,
    color: "#111111",
  },
  p2IntroBold: {
    fontFamily: "Montserrat",
    fontWeight: 700,
  },
  p2ServicosTitulo: {
    position: "absolute",
    top: 254,
    left: 38,
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: "#111111",
  },
  p2Servico: {
    fontSize: 12,
    lineHeight: 1.72,
    color: "#111111",
    marginBottom: 0,
  },
  p2ServicosLista: {
    position: "absolute",
    top: 275,
    left: 38,
    width: 300,
  },
  p2Casa1: {
    position: "absolute",
    left: 354,
    top: 250,
    width: 200,
    height: 133,
    objectFit: "cover",
  },
  p2Casa2: {
    position: "absolute",
    left: 342,
    top: 370,
    width: 224,
    height: 149,
    objectFit: "cover",
  },
  p2EquipeTitulo: {
    position: "absolute",
    top: 462,
    left: 38,
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: "#111111",
  },
  p2EquipeFoto: {
    position: "absolute",
    left: 38,
    top: 490,
    width: 198,
    height: 300,
    objectFit: "cover",
  },
  p2EquipeTexto: {
    position: "absolute",
    left: 254,
    top: 536,
    width: 208,
    fontSize: 12,
    lineHeight: 1.38,
    color: "#111111",
  },
  p2EquipeParagrafo: {
    marginBottom: 8,
  },
  qrBox: {
    position: "absolute",
    left: 468,
    top: 718,
    width: 102,
    height: 108,
  },
  qrImg: {
    width: 102,
    height: 108,
    objectFit: "contain",
  },
  headerTitulo1: {
    position: "absolute",
    top: 51,
    left: 36,
    fontSize: 36,
    fontFamily: "Montserrat",
    fontWeight: 800,
    color: YB_COR_TITULO,
    lineHeight: 1,
  },
  headerTitulo2: {
    position: "absolute",
    top: 93,
    left: 36,
    fontSize: 36,
    fontFamily: "Montserrat",
    fontWeight: 800,
    color: YB_COR_LARANJA,
    lineHeight: 1,
  },
  headerLinhaVertical: {
    position: "absolute",
    left: 359,
    top: 0,
    width: 3.6,
    height: 165,
    backgroundColor: YB_COR_LARANJA_LINHA,
  },
  headerContato: {
    position: "absolute",
    left: 371,
    top: 46,
    width: 200,
  },
  headerMarca: {
    fontSize: 14,
    fontFamily: "Montserrat",
    fontWeight: 700,
    letterSpacing: 1.8,
    color: "#111111",
    marginBottom: 6,
  },
  headerContatoLinha: {
    fontSize: 11.5,
    fontFamily: "Montserrat",
    fontWeight: 400,
    color: "#111111",
    marginBottom: 1,
  },
  headerData: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: "ArchivoBlack",
    color: "#111111",
  },
  banner: {
    position: "absolute",
    top: 171,
    left: 0,
    width: A4_LARGURA,
    height: 197,
    backgroundColor: YB_COR_BANNER,
  },
  bannerTexto: {
    position: "absolute",
    top: 12,
    left: 36,
    width: 300,
  },
  bannerParagrafo: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "#111111",
    fontFamily: "Montserrat",
    fontWeight: 400,
  },
  corpo: {
    marginTop: 382,
    paddingHorizontal: 36,
    paddingBottom: 28,
  },
  secaoLaranja: {
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: YB_COR_LARANJA,
    marginBottom: 10,
  },
  etapaTitulo: {
    fontSize: 11,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: YB_COR_TEXTO,
    marginBottom: 3,
    marginTop: 10,
  },
  etapaTexto: {
    fontSize: 11,
    lineHeight: 1.45,
    color: YB_COR_TEXTO,
    fontFamily: "Montserrat",
    fontWeight: 400,
    marginBottom: 2,
  },
  entregaTexto: {
    fontSize: 11,
    lineHeight: 1.5,
    color: YB_COR_TEXTO,
    fontFamily: "Montserrat",
    fontWeight: 400,
  },
  demaisTitulo: {
    fontSize: 11,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: YB_COR_TEXTO,
    marginBottom: 3,
    marginTop: 12,
  },
  demaisTexto: {
    fontSize: 11,
    lineHeight: 1.45,
    color: YB_COR_TEXTO,
    fontFamily: "Montserrat",
    fontWeight: 400,
  },
  investRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  investLabel: {
    fontSize: 11,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: YB_COR_TEXTO,
    flex: 1,
    paddingRight: 12,
  },
  investValor: {
    fontSize: 11,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: YB_COR_TEXTO,
    textAlign: "right",
  },
  pagtoTitulo: {
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: YB_COR_LARANJA,
    marginTop: 28,
    marginBottom: 10,
  },
  pagtoLinha: {
    fontSize: 11,
    lineHeight: 1.45,
    color: YB_COR_TEXTO,
    fontFamily: "Montserrat",
    fontWeight: 400,
    marginBottom: 6,
  },
  pagtoRotulo: {
    fontFamily: "Montserrat",
    fontWeight: 700,
  },
  obsTitulo: {
    fontSize: 11,
    fontFamily: "Montserrat",
    fontWeight: 700,
    color: YB_COR_LARANJA,
    marginTop: 36,
    marginBottom: 8,
  },
  obsTexto: {
    fontSize: 10,
    lineHeight: 1.45,
    color: YB_COR_TEXTO,
    fontFamily: "Montserrat",
    fontWeight: 400,
    marginBottom: 6,
  },
});

function fontSizeCampo(texto, base = 13) {
  const n = String(texto || "").length;
  if (n > 36) return 8;
  if (n > 28) return 9.5;
  if (n > 20) return 11;
  return base;
}

function CabecalhoInterno({ linha1, linha2, dataInterna }) {
  return (
    <View>
      <Text style={styles.headerTitulo1}>{linha1}</Text>
      <Text style={styles.headerTitulo2}>{linha2}</Text>
      <View style={styles.headerLinhaVertical} />
      <View style={styles.headerContato}>
        <Text style={styles.headerMarca}>{YB_MARCA_ESPACADA}</Text>
        <Text style={styles.headerContatoLinha}>{YB_CONTATO.email}</Text>
        <Text style={styles.headerContatoLinha}>{YB_CONTATO.telefone}</Text>
        <Text style={styles.headerData}>{dataInterna}</Text>
      </View>
    </View>
  );
}

function BannerIntro({ paragrafos, foto, fotoStyle }) {
  return (
    <View style={styles.banner} wrap={false}>
      <View style={styles.bannerTexto}>
        {paragrafos.map((p) => (
          <Text key={p.slice(0, 28)} style={styles.bannerParagrafo}>
            {p}
          </Text>
        ))}
      </View>
      <Image src={foto} style={fotoStyle} wrap={false} />
    </View>
  );
}

function chunk(lista, tamanho) {
  const out = [];
  for (let i = 0; i < lista.length; i += tamanho) {
    out.push(lista.slice(i, i + tamanho));
  }
  return out;
}

export default function OrcamentoYbyocaPDF({ orcamento }) {
  const proposta = normalizarPropostaDadosYbyoca(orcamento?.proposta_dados);
  const dataRef = orcamento?.data || orcamento?.created_at;
  const codigo = formatarCodigoPropostaYB(orcamento?.numero_proposta, dataRef);
  const dataCapa = formatarDataPropostaBR(dataRef);
  const dataInterna = formatarDataCabecalhoYB(dataRef);
  const nomeCliente = String(orcamento?.nome || "").trim() || "—";
  const contato = String(proposta.contato || "").trim() || "—";
  const endereco = String(proposta.endereco || "").trim() || "—";

  const servicosOferecidos = listaServicosOferecidosYbyoca(proposta);
  const demaisServicos = listaDemaisServicosYbyoca(proposta);
  const entregaTexto = textoEntregaArquitetonicoYbyoca(proposta.arquitetonico);
  const itensComplementares = (proposta.complementares || []).map((item) =>
    rotuloComplementar(item, proposta.complementares_outros),
  );
  const temArquitetonico =
    proposta.arquitetonico.length > 0 ||
    (parseFloat(proposta.valores.arquitetonico) || 0) > 0;
  const temDemais = demaisServicos.length > 0;

  const valor = (key) => parseFloat(proposta.valores[key]) || 0;
  const linhasInvestimento = [];
  if (valor("arquitetonico") > 0) {
    linhasInvestimento.push({
      label: "Projeto Arquitetônico",
      valor: formatarMoedaBRL(proposta.valores.arquitetonico),
    });
  }
  if (valor("tramites") > 0) {
    linhasInvestimento.push({
      label: "Trâmites",
      valor: formatarMoedaBRL(proposta.valores.tramites),
    });
  }
  if (valor("complementares") > 0) {
    linhasInvestimento.push({
      label: itensComplementares.length
        ? `Complementares (${itensComplementares.join(", ")})`
        : "Complementares",
      valor: formatarMoedaBRL(proposta.valores.complementares),
    });
  }
  if (valor("gestao") > 0) {
    linhasInvestimento.push({
      label: "Gestão de Obras",
      valor: `${formatarMoedaBRL(proposta.valores.gestao)} / mês`,
      espacoAntes: true,
    });
  }

  const demaisPaginas =
    demaisServicos.length <= 4
      ? [demaisServicos]
      : [demaisServicos.slice(0, 3), ...chunk(demaisServicos.slice(3), 5)];

  const listaServicos = servicosOferecidos.length
    ? servicosOferecidos
    : ["Serviços conforme briefing acordado com o cliente."];

  return (
    <Document title={`PROPOSTA ${codigo} — Ybyoca`}>
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={{ width: A4_LARGURA, height: A4_ALTURA }} />
        <View style={styles.fundoBox}>
          <Image src={coverBg} style={styles.fundo} />
        </View>
        <View style={[styles.maskValorEsq, styles.maskCliente]}>
          <Text
            style={[styles.valorEsq, { fontSize: fontSizeCampo(nomeCliente) }]}
          >
            {nomeCliente}
          </Text>
        </View>
        <View style={[styles.maskValorEsq, styles.maskContato]}>
          <Text style={[styles.valorEsq, { fontSize: fontSizeCampo(contato) }]}>
            {contato}
          </Text>
        </View>
        <View style={[styles.maskValorEsq, styles.maskEndereco]}>
          <Text
            style={[styles.valorEsq, { fontSize: fontSizeCampo(endereco) }]}
          >
            {endereco}
          </Text>
        </View>
        <View style={[styles.maskValorDir, styles.maskProposta]}>
          <Text style={styles.valorDir}>{codigo}</Text>
        </View>
        <View style={[styles.maskValorDir, styles.maskData]}>
          <Text style={styles.valorDir}>{dataCapa}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page} wrap={false}>
        <View style={{ width: A4_LARGURA, height: A4_ALTURA }} />
        <View style={styles.headerP2}>
          <Text style={styles.headerP2Texto}>
            <Text style={styles.headerP2Nome}>{nomeCliente}</Text>
            {YB_BOAS_VINDAS_SUFIXO}
          </Text>
          <Text style={styles.headerP2Agrad}>{YB_BOAS_VINDAS_AGRADECIMENTO}</Text>
        </View>
        <Text style={styles.p2Intro}>
          {YB_INTRO_ESCRITORIO.map((parte) => (
            <Text
              key={parte.trecho.slice(0, 24)}
              style={parte.negrito ? styles.p2IntroBold : undefined}
            >
              {parte.trecho}
            </Text>
          ))}
        </Text>
        <Text style={styles.p2ServicosTitulo}>Serviços oferecidos:</Text>
        <View style={styles.p2ServicosLista}>
          {listaServicos.map((item) => (
            <Text key={item} style={styles.p2Servico}>
              {item}
            </Text>
          ))}
        </View>
        <Image src={photoCasa1} style={styles.p2Casa1} wrap={false} />
        <Image src={photoCasa2} style={styles.p2Casa2} wrap={false} />
        <Text style={styles.p2EquipeTitulo}>{YB_EQUIPE.titulo}</Text>
        <Image src={photoEquipe} style={styles.p2EquipeFoto} wrap={false} />
        <View style={styles.p2EquipeTexto}>
          {YB_EQUIPE.paragrafos.map((p) => (
            <Text key={p.slice(0, 32)} style={styles.p2EquipeParagrafo}>
              {p}
            </Text>
          ))}
        </View>
        <View style={styles.qrBox}>
          <Image src={qrInstagram} style={styles.qrImg} wrap={false} />
        </View>
      </Page>

      {temArquitetonico ? (
        <Page size="A4" style={styles.page} wrap={false}>
          <CabecalhoInterno
            linha1="Projeto"
            linha2="Arquitetônico"
            dataInterna={dataInterna}
          />
          <BannerIntro
            paragrafos={[YB_ARQUITETONICO.intro]}
            foto={photoFachada}
            fotoStyle={{
              position: "absolute",
              left: 346,
              top: 10,
              width: 250,
              height: 178,
              objectFit: "cover",
            }}
          />
          <View style={styles.corpo}>
            <Text style={styles.secaoLaranja}>
              {YB_ARQUITETONICO.etapasTitulo}
            </Text>
            {YB_ARQUITETONICO.etapas.map((etapa, idx) => (
              <View key={etapa.titulo}>
                <Text
                  style={[
                    styles.etapaTitulo,
                    idx === 0 ? { marginTop: 0 } : null,
                  ]}
                >
                  {etapa.titulo}
                </Text>
                <Text style={styles.etapaTexto}>{etapa.texto}</Text>
              </View>
            ))}
            {entregaTexto ? (
              <View>
                <Text style={[styles.secaoLaranja, { marginTop: 14 }]}>
                  {YB_ARQUITETONICO.entregaTitulo}
                </Text>
                <Text style={styles.entregaTexto}>{entregaTexto}</Text>
              </View>
            ) : null}
          </View>
        </Page>
      ) : null}

      {temDemais
        ? demaisPaginas.map((grupo, idx) => (
            <Page key={`demais-${idx}`} size="A4" style={styles.page} wrap={false}>
              <CabecalhoInterno
                linha1="Demais"
                linha2="Serviços"
                dataInterna={dataInterna}
              />
              {idx === 0 ? (
                <BannerIntro
                  paragrafos={YB_DEMAIS_INTRO}
                  foto={photoPrancheta}
                  fotoStyle={{
                    position: "absolute",
                    left: 362,
                    top: 2,
                    width: 202,
                    height: 193,
                    objectFit: "cover",
                  }}
                />
              ) : null}
              <View style={styles.corpo}>
                {idx === 0 ? (
                  <Text style={styles.secaoLaranja}>{YB_DEMAIS_TITULO}</Text>
                ) : null}
                {grupo.map((titulo, i) => (
                  <View key={titulo}>
                    <Text
                      style={[
                        styles.demaisTitulo,
                        idx === 0 && i === 0 ? { marginTop: 0 } : null,
                      ]}
                    >
                      {titulo}
                    </Text>
                    <Text style={styles.demaisTexto}>
                      {YB_SERVICOS_DETALHE[titulo] ||
                        "Serviço complementar conforme briefing acordado com o cliente."}
                    </Text>
                  </View>
                ))}
              </View>
            </Page>
          ))
        : null}

      <Page size="A4" style={styles.page} wrap={false}>
        <CabecalhoInterno
          linha1="Condições"
          linha2="Gerais"
          dataInterna={dataInterna}
        />
        <BannerIntro
          paragrafos={YB_CONDICOES_INTRO}
          foto={photoInvestimento}
          fotoStyle={{
            position: "absolute",
            left: 330,
            top: 10,
            width: 266,
            height: 178,
            objectFit: "cover",
          }}
        />
        <View style={styles.corpo}>
          <Text style={styles.secaoLaranja}>INVESTIMENTOS</Text>
          {linhasInvestimento.length ? (
            linhasInvestimento.map((linha) => (
              <View
                key={linha.label}
                style={[
                  styles.investRow,
                  linha.espacoAntes ? { marginTop: 14 } : null,
                ]}
              >
                <Text style={styles.investLabel}>{linha.label}</Text>
                <Text style={styles.investValor}>{linha.valor}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.demaisTexto}>
              Investimento conforme briefing acordado com o cliente.
            </Text>
          )}

          <Text style={styles.pagtoTitulo}>{YB_PAGAMENTO.titulo}</Text>
          {YB_PAGAMENTO.opcoes.map((opcao) => (
            <Text key={opcao.rotulo} style={styles.pagtoLinha}>
              <Text style={styles.pagtoRotulo}>{opcao.rotulo}</Text>
              {opcao.texto}
            </Text>
          ))}

          <Text style={styles.obsTitulo}>OBSERVAÇÕES:</Text>
          {YB_OBSERVACOES.map((obs) => (
            <Text key={obs.slice(0, 32)} style={styles.obsTexto}>
              {obs}
            </Text>
          ))}
          {proposta.descricao?.trim() ? (
            <Text style={styles.obsTexto}>{proposta.descricao.trim()}</Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
