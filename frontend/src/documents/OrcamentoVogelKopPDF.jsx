import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import nestCover from "../assets/documents/vogelkop-proposta/nest-cover.png";
import bgPage from "../assets/documents/vogelkop-proposta/bg.png";
import {
  ALTERACOES_AJUSTES,
  ARQUITETO_INFO,
  ESCOPO_RENDER_INTRO,
  ESCOPO_TECNICO_INTRO,
  ESCOPO_COMPLEMENTAR_INTRO,
  INTRO_PROPOSTA,
  INVESTIMENTO_INTRO,
  ORCAMENTO_ITENS_FIXOS,
  PAGAMENTO_CARTAO_TEXTO,
  PAGAMENTO_CARTAO_TITULO,
  PAGAMENTO_ETAPAS,
  PAGAMENTO_ETAPAS_TITULO,
  PAGAMENTO_INTRO,
  RESPONSABILIDADES,
  ROTULO_RENDER_PDF,
  ROTULO_TECNICO_PDF,
  SOBRE_ESCRITORIO,
} from "./orcamentoPropostaTemplate";
import {
  calcularTotalValoresProposta,
  formatarCodigoPropostaVK,
  formatarInfoGeraisCabecalho,
  formatarMesAnoCapa,
  formatarMoedaBRL,
  listaComplementaresExibicao,
  normalizarPropostaDados,
} from "../utils/orcamentoPropostaUtils";

const COR_FUNDO = "#FFFFFF";
const COR_CAPA = "#FBFAF9";
const COR_CYAN = "#00B0EC";
const COR_TITULO = "#222222";
const COR_TEXTO = "#3A3A3A";
const COR_MUTED = "#5A5A5A";

const A4_ALTURA = 841.89;
const A4_LARGURA = 595.28;
const PAD_TOP = 125;
const PAD_BOTTOM = 58;
const PAD_H = 46;
const ALTURA_UTIL = A4_ALTURA - PAD_TOP - PAD_BOTTOM;
const LARGURA_UTIL = A4_LARGURA - PAD_H * 2;

const ESCALA_MIN = 0.88;
const ESCALA_MAX = 1.06;

const chrome = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COR_TEXTO,
    backgroundColor: COR_FUNDO,
    paddingTop: PAD_TOP,
    paddingHorizontal: PAD_H,
    paddingBottom: PAD_BOTTOM,
  },
  conteudo: {
    flex: 1,
    flexDirection: "column",
  },
  coverPage: {
    backgroundColor: COR_CAPA,
  },
  coverNest: {
    position: "absolute",
    top: 0,
    left: 0,
    width: A4_LARGURA,
    height: A4_ALTURA,
    objectFit: "cover",
  },
  coverFieldRow: {
    position: "absolute",
    left: 50,
    width: 248,
    height: 16,
    backgroundColor: COR_CAPA,
    flexDirection: "row",
    alignItems: "center",
  },
  coverCliente: {
    top: 680,
  },
  coverProposta: {
    top: 710,
  },
  coverFieldLabel: {
    fontSize: 9,
    letterSpacing: 0.7,
    color: "#222222",
  },
  coverFieldValue: {
    fontSize: 10,
    color: COR_CYAN,
    letterSpacing: 0.35,
    marginLeft: 8,
  },
  coverDataMask: {
    position: "absolute",
    top: 780,
    left: 50,
    width: 168,
    height: 14,
    backgroundColor: COR_CAPA,
    flexDirection: "row",
    alignItems: "center",
  },
  coverData: {
    fontSize: 9,
    letterSpacing: 0.8,
    color: "#222222",
  },
  coverDataDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: COR_CYAN,
    marginHorizontal: 6,
  },
  bgFundo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: A4_LARGURA,
    height: A4_ALTURA,
    objectFit: "cover",
  },
  headerTituloBox: {
    position: "absolute",
    top: 26,
    right: 38,
    width: 210,
    height: 20,
    backgroundColor: COR_FUNDO,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  headerTitulo: {
    fontSize: 10,
    fontWeight: "bold",
    color: COR_CYAN,
    letterSpacing: 0.55,
    textAlign: "right",
  },
  pageNumBox: {
    position: "absolute",
    right: 36,
    bottom: 39,
    width: 32,
    height: 16,
    backgroundColor: COR_FUNDO,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  pageNum: {
    fontSize: 8,
    color: COR_MUTED,
    letterSpacing: 0.4,
  },
});

function s(n, escala) {
  return Math.round(n * escala * 10) / 10;
}

function estilosComEscala(escala) {
  return {
    descricaoDestaque: {
      fontSize: s(12, escala),
      lineHeight: 1.5,
      color: COR_TEXTO,
      textAlign: "center",
      marginBottom: s(8, escala),
      paddingHorizontal: 8,
    },
    archInfo: {
      fontSize: s(12.5, escala),
      lineHeight: 1.55,
      color: COR_CYAN,
      textAlign: "center",
      marginBottom: s(14, escala),
    },
    archInfoTitle: {
      fontWeight: "bold",
    },
    bodyCenter: {
      fontSize: s(12, escala),
      lineHeight: 1.5,
      color: COR_TEXTO,
      textAlign: "left",
      marginBottom: s(12, escala),
    },
    sectionTitleBrown: {
      fontSize: s(13.5, escala),
      fontWeight: "bold",
      color: COR_TITULO,
      textAlign: "center",
      marginTop: s(10, escala),
      marginBottom: s(12, escala),
    },
    bulletCenter: {
      fontSize: s(12, escala),
      lineHeight: 1.5,
      color: COR_TEXTO,
      textAlign: "left",
      marginBottom: s(5, escala),
      marginLeft: 4,
    },
    bulletCenterText: {
      fontWeight: "bold",
    },
    escopoItemTitulo: {
      fontSize: s(13.5, escala),
      fontWeight: "bold",
      color: COR_TITULO,
      textAlign: "center",
      marginTop: s(12, escala),
      marginBottom: s(8, escala),
    },
    escopoItemTituloPrimeiro: {
      marginTop: 0,
    },
    escopoParagrafo: {
      fontSize: s(12, escala),
      lineHeight: 1.5,
      color: COR_TEXTO,
      marginBottom: s(8, escala),
      textAlign: "left",
    },
    escopoParagrafoObs: {
      color: COR_CYAN,
      fontSize: s(11.5, escala),
      lineHeight: 1.5,
      marginTop: s(4, escala),
    },
    escopoParagrafoObsText: {
      fontWeight: "bold",
    },
    escopoLinha: {
      fontSize: s(12, escala),
      lineHeight: 1.5,
      color: COR_TEXTO,
      marginBottom: s(4, escala),
      textAlign: "left",
    },
    orcSecaoTitulo: {
      fontSize: s(13, escala),
      fontWeight: "bold",
      color: COR_TITULO,
      textAlign: "center",
      marginBottom: s(6, escala),
    },
    orcItemTitulo: {
      fontSize: s(12, escala),
      fontWeight: "bold",
      color: COR_TITULO,
      textAlign: "center",
      marginTop: s(12, escala),
      marginBottom: s(4, escala),
    },
    orcItemDesc: {
      fontSize: s(11, escala),
      lineHeight: 1.5,
      color: COR_MUTED,
      textAlign: "center",
      marginBottom: s(8, escala),
      paddingHorizontal: 8,
    },
    totalBar: {
      marginTop: s(14, escala),
      marginBottom: s(14, escala),
      paddingVertical: s(11, escala),
      backgroundColor: "#E6F6FC",
      alignItems: "center",
    },
    totalText: {
      fontSize: s(14, escala),
      fontWeight: "bold",
      color: COR_TITULO,
      textAlign: "center",
    },
    alterTitulo: {
      fontSize: s(13, escala),
      fontWeight: "bold",
      color: COR_TITULO,
      textAlign: "center",
      marginBottom: s(6, escala),
    },
    pagamentoTitulo: {
      fontSize: s(11.5, escala),
      fontWeight: "bold",
      color: COR_TITULO,
      textAlign: "center",
      marginBottom: s(5, escala),
      marginTop: s(6, escala),
    },
    pagamentoLinha: {
      fontSize: s(11, escala),
      lineHeight: 1.5,
      color: COR_TEXTO,
    },
    respIntro: {
      fontSize: s(13, escala),
      lineHeight: 1.5,
      color: COR_TITULO,
      textTransform: "uppercase",
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: s(8, escala),
    },
    respLinha: {
      fontSize: s(12.5, escala),
      lineHeight: 1.55,
      color: COR_TEXTO,
      marginBottom: s(4, escala),
    },
    respParagrafo: {
      fontSize: s(12.5, escala),
      lineHeight: 1.55,
      color: COR_TEXTO,
      marginBottom: s(10, escala),
    },
    respSubtitulo: {
      fontSize: s(13, escala),
      fontWeight: "bold",
      color: COR_TITULO,
      textTransform: "uppercase",
      textAlign: "center",
      marginTop: s(14, escala),
      marginBottom: s(8, escala),
    },
  };
}

function alturaTexto(texto, fontSize, lineHeight, largura = LARGURA_UTIL) {
  const cpl = Math.max(16, Math.floor(largura / (fontSize * 0.58)));
  let linhas = 0;
  for (const p of String(texto || "").split("\n")) {
    linhas += Math.max(1, Math.ceil(Math.max(p.trim().length, 1) / cpl));
  }
  return linhas * fontSize * lineHeight * 1.12;
}

function escalaPara(alturaBase) {
  if (alturaBase < 8) return 1;
  const alvo = ALTURA_UTIL * 0.92;
  const escala = alvo / alturaBase;
  if (escala >= 1) return Math.min(ESCALA_MAX, escala);
  return Math.max(ESCALA_MIN, escala);
}

/** Empacota tópicos inteiros na mesma página; reduz letra se ainda couber. */
function empacotarTopicos(topicos) {
  const paginas = [];
  let atual = [];
  for (const topico of topicos) {
    const tentativa = [...atual, topico];
    const altura = tentativa.reduce((acc, t) => acc + t.altura, 0);
    if (atual.length > 0 && altura * ESCALA_MIN > ALTURA_UTIL) {
      paginas.push(atual);
      atual = [topico];
    } else {
      atual = tentativa;
    }
  }
  if (atual.length) paginas.push(atual);
  return paginas;
}

function FundoPagina() {
  return <Image src={bgPage} style={chrome.bgFundo} fixed />;
}

function CabecalhoInterno({ titulo }) {
  return (
    <View style={chrome.headerTituloBox} fixed>
      <Text style={chrome.headerTitulo}>{titulo}</Text>
    </View>
  );
}

function NumeroPagina() {
  return (
    <View style={chrome.pageNumBox} fixed>
      <Text
        style={chrome.pageNum}
        render={({ pageNumber }) => String(pageNumber).padStart(2, "0")}
        fixed
      />
    </View>
  );
}

function interpolarEspaco(elementos) {
  const itens = (Array.isArray(elementos) ? elementos : [elementos]).filter(
    Boolean,
  );
  if (itens.length < 2) return itens;
  const saida = [];
  itens.forEach((el, i) => {
    if (i > 0) {
      saida.push(<View key={`espaco-${i}`} style={{ height: 16 }} />);
    }
    saida.push(el);
  });
  return saida;
}

function PaginaInterna({ titulo, children }) {
  const itens = Array.isArray(children) ? children.filter(Boolean) : [children];
  return (
    <Page size="A4" style={chrome.page}>
      <FundoPagina />
      <CabecalhoInterno titulo={titulo} />
      <NumeroPagina />
      <View style={chrome.conteudo}>{interpolarEspaco(itens)}</View>
    </Page>
  );
}

function SecaoEscopo({ titulo, primeiro, styles: st, children }) {
  return (
    <View>
      <Text
        style={
          primeiro
            ? [st.escopoItemTitulo, st.escopoItemTituloPrimeiro]
            : st.escopoItemTitulo
        }
      >
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function LinhaEscopo({ styles: st, children }) {
  return (
    <Text style={st.escopoLinha}>
      <Text style={st.bulletCenterText}> • </Text>
      {children}
    </Text>
  );
}

function linhasPdf(itens, mapaRotulos) {
  if (!itens?.length) return [];
  return itens.map((item) => `${mapaRotulos[item] || item};`);
}

function BlocoOrcamento({ titulo, valor, itens, comMarcador = false, styles: st }) {
  if (!itens?.length) return null;
  const rotulo = `${titulo} : ${formatarMoedaBRL(valor)}`;

  return (
    <View>
      <Text style={st.orcItemTitulo}>
        {comMarcador ? `• ${rotulo}` : rotulo}
      </Text>
      <Text style={st.orcItemDesc}>{itens.join(", ")}</Text>
    </View>
  );
}

function fontSizeCapaCampo(texto, base = 10) {
  const n = String(texto || "").length;
  if (n > 44) return 7.5;
  if (n > 34) return 8.5;
  if (n > 24) return 9.5;
  return base;
}

export default function OrcamentoVogelKopPDF({ orcamento }) {
  const proposta = normalizarPropostaDados(orcamento?.proposta_dados);
  const dataRef = orcamento?.data || orcamento?.created_at;
  const codigoVK = formatarCodigoPropostaVK(
    orcamento?.numero_proposta,
    dataRef,
  );
  const infoGerais = formatarInfoGeraisCabecalho(dataRef);
  const mesAnoCapa = formatarMesAnoCapa(dataRef);
  const total = calcularTotalValoresProposta(proposta.valores);

  const linhasTecnico = linhasPdf(proposta.tecnico, ROTULO_TECNICO_PDF);
  const linhasRender = linhasPdf(proposta.renderizacoes, ROTULO_RENDER_PDF);

  const itensTecnico = proposta.tecnico.map((i) => ROTULO_TECNICO_PDF[i] || i);
  const itensRender = proposta.renderizacoes.map(
    (i) => ROTULO_RENDER_PDF[i] || i,
  );
  const itensComplementares = listaComplementaresExibicao(
    proposta.complementares,
    proposta.complementares_outros,
  );
  const itensTramites = proposta.tramites;

  const temTecnico = proposta.tecnico.length > 0;
  const temComplementares = proposta.complementares.length > 0;
  const temRenderizacoes = proposta.renderizacoes.length > 0;
  const temObjeto = proposta.descricao?.trim()?.length > 0;

  const objetoTexto =
    proposta.descricao?.trim() ||
    "Objeto conforme briefing acordado com o cliente.";

  const secoesEscopo = [];

  if (temTecnico) {
    secoesEscopo.push({
      key: "tecnico",
      titulo: `${secoesEscopo.length + 1}. Projeto Técnico Arquitetônico Legal:`,
      altura:
        36 +
        alturaTexto(ESCOPO_TECNICO_INTRO, 12, 1.5) +
        linhasTecnico.length * 26,
      render: (st, primeiro) => (
        <SecaoEscopo
          key="tecnico"
          titulo={`${secoesEscopo.find((x) => x.key === "tecnico").titulo}`}
          primeiro={primeiro}
          styles={st}
        >
          <Text style={st.escopoParagrafo}>{ESCOPO_TECNICO_INTRO}</Text>
          {linhasTecnico.map((linha) => (
            <LinhaEscopo key={linha} styles={st}>
              {linha}
            </LinhaEscopo>
          ))}
        </SecaoEscopo>
      ),
    });
  }

  if (temComplementares) {
    secoesEscopo.push({
      key: "complementares",
      titulo: `${secoesEscopo.length + 1}. Projetos complementares:`,
      altura:
        36 +
        alturaTexto(ESCOPO_COMPLEMENTAR_INTRO, 12, 1.5) +
        itensComplementares.length * 26 +
        32,
      render: (st, primeiro) => (
        <SecaoEscopo
          key="complementares"
          titulo={`${secoesEscopo.find((x) => x.key === "complementares").titulo}`}
          primeiro={primeiro}
          styles={st}
        >
          <Text style={st.escopoParagrafo}>{ESCOPO_COMPLEMENTAR_INTRO}</Text>
          {itensComplementares.map((item) => (
            <LinhaEscopo key={item} styles={st}>
              {item};
            </LinhaEscopo>
          ))}
          <Text style={st.escopoParagrafoObs}>
            <Text style={st.escopoParagrafoObsText}>Obs.: </Text>
            Projetos complementares são executados por parceiros e orçados
            separadamente.
          </Text>
        </SecaoEscopo>
      ),
    });
  }

  if (temRenderizacoes) {
    secoesEscopo.push({
      key: "render",
      titulo: `${secoesEscopo.length + 1}. Modelagem 3D e Renderizações:`,
      altura:
        36 +
        alturaTexto(ESCOPO_RENDER_INTRO, 12, 1.5) +
        24 +
        linhasRender.length * 26,
      render: (st, primeiro) => (
        <SecaoEscopo
          key="render"
          titulo={`${secoesEscopo.find((x) => x.key === "render").titulo}`}
          primeiro={primeiro}
          styles={st}
        >
          <Text style={st.escopoParagrafo}>{ESCOPO_RENDER_INTRO}</Text>
          <Text style={st.escopoLinha}>Imagens renderizadas:</Text>
          {linhasRender.map((linha) => (
            <LinhaEscopo key={linha} styles={st}>
              {linha}
            </LinhaEscopo>
          ))}
        </SecaoEscopo>
      ),
    });
  }

  if (temObjeto) {
    secoesEscopo.push({
      key: "objeto",
      titulo: `${secoesEscopo.length + 1}. Objeto da Proposta:`,
      altura: 36 + alturaTexto(objetoTexto, 12, 1.5) + 16,
      render: (st, primeiro) => (
        <SecaoEscopo
          key="objeto"
          titulo={`${secoesEscopo.find((x) => x.key === "objeto").titulo}`}
          primeiro={primeiro}
          styles={st}
        >
          <Text style={st.descricaoDestaque}>{objetoTexto}</Text>
        </SecaoEscopo>
      ),
    });
  }

  const paginasEscopo = empacotarTopicos(secoesEscopo);

  const topicosInfo = [
    {
      key: "arquiteto",
      altura:
        7 * 12.5 * 1.55 +
        24 +
        INTRO_PROPOSTA.reduce((acc, p) => acc + alturaTexto(p, 12, 1.5) + 14, 0),
    },
    {
      key: "sobre",
      altura:
        40 +
        alturaTexto(SOBRE_ESCRITORIO.paragrafo, 12, 1.5) +
        SOBRE_ESCRITORIO.especialidades.length * 26,
    },
  ];
  const alturaInfo = topicosInfo.reduce((acc, t) => acc + t.altura, 0);
  const escalaInfo = escalaPara(alturaInfo);
  const stInfo = estilosComEscala(escalaInfo);

  function alturaBlocoOrc(itens, titulo) {
    if (!itens?.length) return 0;
    return 20 + alturaTexto(`${titulo} : 00.000,00`, 12, 1.5) + alturaTexto(itens.join(", "), 11, 1.5) + 8;
  }

  const topicosInvestimento = [
    {
      key: "orcamento",
      altura:
        INVESTIMENTO_INTRO.reduce((acc, p) => acc + alturaTexto(p, 12, 1.5) + 12, 0) +
        24 +
        alturaBlocoOrc(itensTecnico, ORCAMENTO_ITENS_FIXOS.pacote_tecnico.titulo) +
        alturaBlocoOrc(itensComplementares, ORCAMENTO_ITENS_FIXOS.complementares.titulo) +
        alturaBlocoOrc(itensRender, ORCAMENTO_ITENS_FIXOS.renderizados.titulo) +
        alturaBlocoOrc(itensTramites, ORCAMENTO_ITENS_FIXOS.tramites.titulo) +
        48,
      render: (st) => (
        <View key="orcamento">
          {INVESTIMENTO_INTRO.map((p) => (
            <Text key={p.slice(0, 28)} style={st.bodyCenter}>
              {p}
            </Text>
          ))}
          <Text style={st.orcSecaoTitulo}>
            ORÇAMENTO DO PROJETO DE ARQUITETURA:
          </Text>
          <BlocoOrcamento
            titulo={ORCAMENTO_ITENS_FIXOS.pacote_tecnico.titulo}
            valor={proposta.valores.pacote_tecnico}
            itens={itensTecnico}
            styles={st}
          />
          <BlocoOrcamento
            titulo={ORCAMENTO_ITENS_FIXOS.complementares.titulo}
            valor={proposta.valores.complementares}
            itens={itensComplementares}
            comMarcador
            styles={st}
          />
          <BlocoOrcamento
            titulo={ORCAMENTO_ITENS_FIXOS.renderizados.titulo}
            valor={proposta.valores.renderizados}
            itens={itensRender}
            comMarcador
            styles={st}
          />
          <BlocoOrcamento
            titulo={ORCAMENTO_ITENS_FIXOS.tramites.titulo}
            valor={proposta.valores.tramites}
            itens={itensTramites}
            comMarcador
            styles={st}
          />
          <View style={st.totalBar}>
            <Text style={st.totalText}>
              Investimento geral: {formatarMoedaBRL(total)}
            </Text>
          </View>
        </View>
      ),
    },
    {
      key: "pagamento",
      altura:
        22 +
        alturaTexto(ALTERACOES_AJUSTES, 12, 1.5) +
        16 +
        alturaTexto(PAGAMENTO_INTRO, 11, 1.5) +
        22 +
        PAGAMENTO_ETAPAS.length * 18 +
        22 +
        18,
      render: (st) => (
        <View key="pagamento">
          <Text style={st.alterTitulo}>ALTERAÇÕES E AJUSTES:</Text>
          <Text style={st.bodyCenter}>{ALTERACOES_AJUSTES}</Text>
          <Text style={[st.pagamentoLinha, { marginTop: 3 }]}>
            {PAGAMENTO_INTRO}
          </Text>
          <Text style={st.pagamentoTitulo}>{PAGAMENTO_ETAPAS_TITULO}</Text>
          {PAGAMENTO_ETAPAS.map((linha) => (
            <Text key={linha} style={st.pagamentoLinha}>
              {linha}
            </Text>
          ))}
          <Text style={st.pagamentoTitulo}>{PAGAMENTO_CARTAO_TITULO}</Text>
          <Text style={st.pagamentoLinha}>{PAGAMENTO_CARTAO_TEXTO}</Text>
        </View>
      ),
    },
  ];
  const paginasInvestimento = empacotarTopicos(topicosInvestimento);

  const topicosResp = [
    {
      key: "cliente",
      altura:
        28 +
        RESPONSABILIDADES.itens.length * 22 +
        alturaTexto(RESPONSABILIDADES.nota, 12.5, 1.5) +
        12,
      render: (st) => (
        <View key="cliente">
          <Text style={st.respIntro}>{RESPONSABILIDADES.intro}</Text>
          {RESPONSABILIDADES.itens.map((item) => (
            <Text key={item} style={st.respLinha}>
              <Text style={st.bulletCenterText}> • </Text> {item}
            </Text>
          ))}
          <Text style={st.respParagrafo}>{RESPONSABILIDADES.nota}</Text>
        </View>
      ),
    },
    {
      key: "imagem",
      altura: 28 + alturaTexto(RESPONSABILIDADES.direitoImagem.texto, 12.5, 1.5),
      render: (st) => (
        <View key="imagem">
          <Text style={st.respSubtitulo}>
            {RESPONSABILIDADES.direitoImagem.titulo}
          </Text>
          <Text style={st.respParagrafo}>
            {RESPONSABILIDADES.direitoImagem.texto}
          </Text>
        </View>
      ),
    },
    {
      key: "prazos",
      altura:
        28 +
        alturaTexto(RESPONSABILIDADES.prazos.texto, 12.5, 1.5) +
        alturaTexto(RESPONSABILIDADES.prazos.validade, 12.5, 1.5) +
        16,
      render: (st) => (
        <View key="prazos">
          <Text style={st.respSubtitulo}>
            {RESPONSABILIDADES.prazos.titulo}
          </Text>
          <Text style={st.respParagrafo}>
            {RESPONSABILIDADES.prazos.texto}
          </Text>
          <Text style={[st.respParagrafo, { marginTop: 6 }]}>
            {RESPONSABILIDADES.prazos.validade}
          </Text>
        </View>
      ),
    },
  ];
  const paginasResp = empacotarTopicos(topicosResp);

  return (
    <Document title={`PROPOSTA VK - ${codigoVK}`}>
      <Page size="A4" style={chrome.coverPage}>
        <Image src={nestCover} style={chrome.coverNest} fixed />
        <View style={[chrome.coverFieldRow, chrome.coverCliente]}>
          <Text style={chrome.coverFieldLabel}>PROPOSTA:</Text>
          <Text
            style={[
              chrome.coverFieldValue,
              { fontSize: fontSizeCapaCampo(codigoVK) },
            ]}
          >
            {codigoVK}
          </Text>
        </View>
        <View style={[chrome.coverFieldRow, chrome.coverProposta]} />
        <View style={chrome.coverDataMask}>
          <Text style={chrome.coverData}>{mesAnoCapa.mes}</Text>
          <View style={chrome.coverDataDot} />
          <Text style={chrome.coverData}>{mesAnoCapa.ano}</Text>
        </View>
      </Page>

      <PaginaInterna titulo={infoGerais}>
        <View key="arquiteto">
          <Text style={stInfo.archInfo}>
            <Text style={stInfo.archInfoTitle}>{ARQUITETO_INFO.titulo}</Text>
            {"\n"}
            {ARQUITETO_INFO.nome}
            {"\n"}
            CNPJ: {ARQUITETO_INFO.cnpj} CAU: {ARQUITETO_INFO.cau}
            {"\n"}
            Endereço: {ARQUITETO_INFO.endereco}
            {"\n"}
            E-mail: {ARQUITETO_INFO.email}
            {"\n"}
            Telefone: {ARQUITETO_INFO.telefone}
          </Text>
          {INTRO_PROPOSTA.map((p) => (
            <Text key={p.slice(0, 28)} style={stInfo.bodyCenter}>
              {p}
            </Text>
          ))}
        </View>
        <View key="sobre">
          <Text style={stInfo.sectionTitleBrown}>
            {SOBRE_ESCRITORIO.titulo}
          </Text>
          <Text style={stInfo.bodyCenter}>{SOBRE_ESCRITORIO.paragrafo}</Text>
          {SOBRE_ESCRITORIO.especialidades.map((item) => (
            <Text key={item} style={stInfo.bulletCenter}>
              <Text style={stInfo.bulletCenterText}> • </Text> {item}
            </Text>
          ))}
        </View>
      </PaginaInterna>

      {paginasEscopo.map((pagina, idxPagina) => {
        const altura = pagina.reduce((acc, t) => acc + t.altura, 0);
        const escala = escalaPara(altura);
        const st = estilosComEscala(escala);
        return (
          <PaginaInterna
            key={`escopo-${idxPagina}`}
            titulo="ESCOPO DOS SERVIÇOS"
          >
            {pagina.map((sec, idx) => sec.render(st, idx === 0))}
          </PaginaInterna>
        );
      })}

      {paginasInvestimento.map((pagina, idxPagina) => {
        const altura = pagina.reduce((acc, t) => acc + t.altura, 0);
        const escala = escalaPara(altura);
        const st = estilosComEscala(escala);
        return (
          <PaginaInterna key={`invest-${idxPagina}`} titulo="INVESTIMENTO">
            {pagina.map((topico) => topico.render(st))}
          </PaginaInterna>
        );
      })}

      {paginasResp.map((pagina, idxPagina) => {
        const altura = pagina.reduce((acc, t) => acc + t.altura, 0);
        const escala = escalaPara(altura);
        const st = estilosComEscala(escala);
        return (
          <PaginaInterna
            key={`resp-${idxPagina}`}
            titulo={RESPONSABILIDADES.titulo}
          >
            {pagina.map((topico) => topico.render(st))}
          </PaginaInterna>
        );
      })}
    </Document>
  );
}
