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
  formatarMoedaBRL,
  listaComplementaresExibicao,
  normalizarPropostaDados,
} from "../utils/orcamentoPropostaUtils";

const COR_FUNDO = "#F7F5F0";
const COR_TITULO = "#149FC4";
const COR_SECAO = "#A06B34";
const COR_TEXTO = "#5C544B";
const COR_ESCURO = "#3F382F";

const A4_ALTURA = 841.89;
const A4_LARGURA = 595.28;

const CAPA_LINHA_PROPOSTA_TOP = A4_ALTURA * 0.2438;
const CAPA_ANO_TOP = A4_ALTURA * 0.955;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COR_TEXTO,
    backgroundColor: COR_FUNDO,
    paddingTop: 82,
    paddingHorizontal: 48,
    paddingBottom: 40,
  },
  conteudo: {
    flexGrow: 1,
  },
  coverPage: {
    backgroundColor: COR_FUNDO,
  },
  coverNest: {
    position: "absolute",
    top: 0,
    left: 0,
    width: A4_LARGURA,
    height: A4_ALTURA,
    objectFit: "cover",
  },
  coverCodeText: {
    position: "absolute",
    top: CAPA_LINHA_PROPOSTA_TOP,
    left: 0,
    width: "100%",
    textAlign: "center",
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#a9e1f4",
  },
  coverCodeHidden: {
    color: "#a9e1f4",
  },
  coverAno: {
    position: "absolute",
    top: CAPA_ANO_TOP,
    left: 0,
    width: "100%",
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 1.8,
    color: COR_TITULO,
  },
  bgFundo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: A4_LARGURA,
    height: A4_ALTURA,
    objectFit: "cover",
  },
  headerTitulo: {
    position: "absolute",
    top: 34,
    right: 48,
    maxWidth: 360,
    fontSize: 17,
    fontWeight: "bold",
    color: COR_TITULO,
    letterSpacing: 0.5,
    textAlign: "right",
  },
  descricaoDestaque: {
    fontSize: 12,
    lineHeight: 1.55,
    color: COR_SECAO,
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  archInfo: {
    fontSize: 13,
    lineHeight: 1.6,
    color: COR_SECAO,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  archInfoTitle: {
    fontWeight: "bold",
  },
  bodyCenter: {
    fontSize: 13,
    lineHeight: 1.6,
    color: COR_TEXTO,
    textAlign: "left",
    marginBottom: 14,
  },
  sectionTitleBrown: {
    fontSize: 14,
    fontWeight: "bold",
    color: COR_SECAO,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  bulletCenter: {
    fontSize: 13,
    lineHeight: 1.6,
    color: COR_TEXTO,
    textAlign: "left",
    marginBottom: 6,
    marginLeft: 4,
  },
  bulletCenterText: {
    fontWeight: "bold",
  },
  escopoItemTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: COR_SECAO,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  escopoItemTituloPrimeiro: {
    marginTop: 0,
  },
  escopoParagrafo: {
    fontSize: 13,
    lineHeight: 1.55,
    color: COR_TEXTO,
    marginBottom: 10,
    textAlign: "left",
  },
  escopoParagrafoObs: {
    color: COR_SECAO,
    fontSize: 13,
    lineHeight: 1.55,
    marginTop: 4,
  },
  escopoParagrafoObsText: {
    fontWeight: "bold",
  },
  escopoLinha: {
    fontSize: 13,
    lineHeight: 1.55,
    color: COR_TEXTO,
    marginBottom: 5,
    textAlign: "left",
  },

  orcSecaoTitulo: {
    fontSize: 13.5,
    fontWeight: "bold",
    color: COR_SECAO,
    textAlign: "center",
  },
  orcItemTitulo: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: COR_SECAO,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 4,
  },
  orcItemDesc: {
    fontSize: 11,
    lineHeight: 1.55,
    color: COR_SECAO,
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  totalBar: {
    marginTop: 18,
    marginBottom: 18,
    paddingVertical: 12,
    backgroundColor: "#E8DDD0",
    alignItems: "center",
  },
  totalText: {
    fontSize: 14.5,
    fontWeight: "bold",
    color: COR_SECAO,
    textAlign: "center",
  },
  alterTitulo: {
    fontSize: 13.5,
    fontWeight: "bold",
    color: COR_SECAO,
    textAlign: "center",
    marginBottom: 7,
  },
  pagamentoTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: COR_SECAO,
    textAlign: "center",
    marginBottom: 6,
  },
  pagamentoLinha: {
    fontSize: 11,
    lineHeight: 1.6,
    color: COR_TEXTO,
  },
  respIntro: {
    fontSize: 14,
    lineHeight: 1.6,
    color: COR_SECAO,
    textTransform: "uppercase",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    marginTop: 20,
  },
  respLinha: {
    fontSize: 13,
    lineHeight: 1.6,
    color: COR_TEXTO,
    marginBottom: 2,
  },
  respParagrafo: {
    fontSize: 13,
    lineHeight: 1.6,
    color: COR_TEXTO,
    marginBottom: 12,
  },
  respSubtitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: COR_SECAO,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 22,
    marginBottom: 7,
  },
});

function FundoPagina() {
  return <Image src={bgPage} style={styles.bgFundo} fixed />;
}

function CabecalhoInterno({ titulo }) {
  return (
    <Text style={styles.headerTitulo} fixed>
      {titulo}
    </Text>
  );
}

/** Seção do escopo — numerada só quando visível. */
function SecaoEscopo({ titulo, primeiro, children }) {
  return (
    <View wrap={false} minPresenceAhead={120}>
      <Text
        style={
          primeiro
            ? [styles.escopoItemTitulo, styles.escopoItemTituloPrimeiro]
            : styles.escopoItemTitulo
        }
      >
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function LinhaEscopo({ children }) {
  return (
    <Text style={styles.escopoLinha}>
      <Text style={styles.bulletCenterText}> • </Text>
      {children}
    </Text>
  );
}

function linhasPdf(itens, mapaRotulos) {
  if (!itens?.length) return [];
  return itens.map((item) => `${mapaRotulos[item] || item};`);
}

function BlocoOrcamento({ titulo, valor, itens, comMarcador = false }) {
  // Só aparece se houver itens (campos) selecionados para esta categoria.
  if (!itens?.length) return null;
  const rotulo = `${titulo} : ${formatarMoedaBRL(valor)}`;

  return (
    <View wrap={false}>
      <Text style={styles.orcItemTitulo}>
        {comMarcador ? `• ${rotulo}` : rotulo}
      </Text>
      <Text style={styles.orcItemDesc}>{itens.join(", ")}</Text>
    </View>
  );
}

export default function OrcamentoVogelKopPDF({ orcamento }) {
  const proposta = normalizarPropostaDados(orcamento?.proposta_dados);
  const dataRef = orcamento?.data || orcamento?.created_at;
  const anoCompleto = dataRef
    ? new Date(dataRef).getUTCFullYear()
    : new Date().getFullYear();
  const codigoVK = formatarCodigoPropostaVK(
    orcamento?.numero_proposta,
    dataRef,
  );
  const infoGerais = formatarInfoGeraisCabecalho(dataRef);
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
      content: (
        <>
          <Text style={styles.escopoParagrafo}>{ESCOPO_TECNICO_INTRO}</Text>
          {linhasTecnico.map((linha) => (
            <LinhaEscopo key={linha}>{linha}</LinhaEscopo>
          ))}
        </>
      ),
    });
  }

  if (temComplementares) {
    secoesEscopo.push({
      key: "complementares",
      titulo: `${secoesEscopo.length + 1}. Projetos complementares:`,
      content: (
        <>
          <Text style={styles.escopoParagrafo}>
            {ESCOPO_COMPLEMENTAR_INTRO}
          </Text>
          {itensComplementares.map((item) => (
            <LinhaEscopo key={item}>{item};</LinhaEscopo>
          ))}
          <Text style={styles.escopoParagrafoObs}>
            <Text style={styles.escopoParagrafoObsText}>Obs.: </Text>
            Projetos complementares são executados por parceiros e orçados
            separadamente.
          </Text>
        </>
      ),
    });
  }

  if (temRenderizacoes) {
    secoesEscopo.push({
      key: "render",
      titulo: `${secoesEscopo.length + 1}. Modelagem 3D e Renderizações:`,
      content: (
        <>
          <Text style={styles.escopoParagrafo}>{ESCOPO_RENDER_INTRO}</Text>
          <Text style={styles.escopoLinha}>Imagens renderizadas:</Text>
          {linhasRender.map((linha) => (
            <LinhaEscopo key={linha}>{linha}</LinhaEscopo>
          ))}
        </>
      ),
    });
  }

  if (temObjeto) {
    secoesEscopo.push({
      key: "objeto",
      titulo: `${secoesEscopo.length + 1}. Objeto da Proposta:`,
      content: <Text style={styles.descricaoDestaque}>{objetoTexto}</Text>,
    });
  }

  return (
    <Document title={`PROPOSTA VK - ${codigoVK}`}>
      {/* Capa da proposta */}
      <Page size="A4" style={styles.coverPage}>
        <Image src={nestCover} style={styles.coverNest} fixed />
        <Text style={styles.coverCodeText} fixed>
          <Text style={styles.coverCodeHidden}>PROPOSTA VK - </Text>
          {codigoVK}
        </Text>
        <Text style={styles.coverAno} fixed>
          {anoCompleto}
        </Text>
      </Page>

      {/* Informações gerais */}
      <Page size="A4" style={styles.page}>
        <FundoPagina />
        <CabecalhoInterno titulo={infoGerais} />
        <View style={styles.conteudo}>
          <Text style={styles.archInfo}>
            <Text style={styles.archInfoTitle}>{ARQUITETO_INFO.titulo}</Text>
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
            <Text key={p.slice(0, 28)} style={styles.bodyCenter}>
              {p}
            </Text>
          ))}
          <Text style={styles.sectionTitleBrown}>
            {SOBRE_ESCRITORIO.titulo}
          </Text>
          <Text style={styles.bodyCenter}>{SOBRE_ESCRITORIO.paragrafo}</Text>
          {SOBRE_ESCRITORIO.especialidades.map((item) => (
            <Text key={item} style={styles.bulletCenter}>
              <Text style={styles.bulletCenterText}> • </Text> {item}
            </Text>
          ))}
        </View>
      </Page>

      {/* Escopo dos serviços */}
      {secoesEscopo.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <FundoPagina />
          <CabecalhoInterno titulo="ESCOPO DOS SERVIÇOS" />
          <View style={styles.conteudo}>
            {secoesEscopo.map((sec, idx) => (
              <SecaoEscopo
                key={sec.key}
                titulo={sec.titulo}
                primeiro={idx === 0}
              >
                {sec.content}
              </SecaoEscopo>
            ))}
          </View>
        </Page>
      )}

      {/* Investimento geral */}
      <Page size="A4" style={styles.page}>
        <FundoPagina />
        <CabecalhoInterno titulo="INVESTIMENTO" />
        <View style={styles.conteudo}>
          {INVESTIMENTO_INTRO.map((p) => (
            <Text key={p.slice(0, 28)} style={styles.bodyCenter}>
              {p}
            </Text>
          ))}

          <Text style={styles.orcSecaoTitulo}>
            ORÇAMENTO DO PROJETO DE ARQUITETURA:
          </Text>

          <BlocoOrcamento
            titulo={ORCAMENTO_ITENS_FIXOS.pacote_tecnico.titulo}
            valor={proposta.valores.pacote_tecnico}
            itens={itensTecnico}
          />
          <BlocoOrcamento
            titulo={ORCAMENTO_ITENS_FIXOS.complementares.titulo}
            valor={proposta.valores.complementares}
            itens={itensComplementares}
            comMarcador
          />
          <BlocoOrcamento
            titulo={ORCAMENTO_ITENS_FIXOS.renderizados.titulo}
            valor={proposta.valores.renderizados}
            itens={itensRender}
            comMarcador
          />
          <BlocoOrcamento
            titulo={ORCAMENTO_ITENS_FIXOS.tramites.titulo}
            valor={proposta.valores.tramites}
            itens={itensTramites}
            comMarcador
          />

          <View style={styles.totalBar}>
            <Text style={styles.totalText}>
              Investimento geral: {formatarMoedaBRL(total)}
            </Text>
          </View>

          <Text style={styles.alterTitulo}>ALTERAÇÕES E AJUSTES:</Text>
          <Text style={styles.bodyCenter}>{ALTERACOES_AJUSTES}</Text>

          <Text style={[styles.pagamentoLinha, { marginTop: 3 }]}>
            {PAGAMENTO_INTRO}
          </Text>
          <Text style={styles.pagamentoTitulo}>{PAGAMENTO_ETAPAS_TITULO}</Text>
          {PAGAMENTO_ETAPAS.map((linha) => (
            <Text key={linha} style={styles.pagamentoLinha}>
              {linha}
            </Text>
          ))}
          <Text style={styles.pagamentoTitulo}>{PAGAMENTO_CARTAO_TITULO}</Text>
          <Text style={styles.pagamentoLinha}>{PAGAMENTO_CARTAO_TEXTO}</Text>
        </View>
      </Page>

      {/* Responsabilidades */}
      <Page size="A4" style={styles.page}>
        <FundoPagina />
        <CabecalhoInterno titulo={RESPONSABILIDADES.titulo} />
        <View style={styles.conteudo}>
          <Text style={styles.respIntro}>{RESPONSABILIDADES.intro}</Text>
          {RESPONSABILIDADES.itens.map((item) => (
            <Text key={item} style={styles.respLinha}>
              <Text style={styles.bulletCenterText}> • </Text> {item}
            </Text>
          ))}
          <Text style={styles.respParagrafo}>{RESPONSABILIDADES.nota}</Text>

          <Text style={styles.respSubtitulo}>
            {RESPONSABILIDADES.direitoImagem.titulo}
          </Text>
          <Text style={styles.respParagrafo}>
            {RESPONSABILIDADES.direitoImagem.texto}
          </Text>

          <Text style={styles.respSubtitulo}>
            {RESPONSABILIDADES.prazos.titulo}
          </Text>
          <Text style={styles.respParagrafo}>
            {RESPONSABILIDADES.prazos.texto}
          </Text>
          <Text style={[styles.respParagrafo, { marginTop: 10 }]}>
            {RESPONSABILIDADES.prazos.validade}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
