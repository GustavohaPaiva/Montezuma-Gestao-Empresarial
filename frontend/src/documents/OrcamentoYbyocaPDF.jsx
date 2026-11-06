import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import photoFachada from "../assets/documents/ybyoca-proposta/crops/fachada.png";
import montserratRegular from "../assets/fonts/ybyoca/Montserrat-Regular.ttf";
import montserratBold from "../assets/fonts/ybyoca/Montserrat-Bold.ttf";
import montserratExtraBold from "../assets/fonts/ybyoca/Montserrat-ExtraBold.ttf";
import {
  YB_ARQUITETONICO,
  YB_BOAS_VINDAS_AGRADECIMENTO,
  YB_CAPA_SUBTITULO,
  YB_CONDICOES_INTRO,
  YB_CONTATO,
  YB_DEMAIS_INTRO,
  YB_DEMAIS_TITULO,
  YB_EQUIPE,
  YB_INTRO_ESCRITORIO,
  YB_OBSERVACOES,
  YB_PAGAMENTO,
  YB_SERVICOS_DETALHE,
} from "./orcamentoPropostaYbyocaTemplate";
import {
  calcularTotalProjetosYbyoca,
  formatarCodigoPropostaYB,
  formatarDataCabecalhoYB,
  formatarMesAnoCapa,
  formatarMoedaBRL,
  listaComplementaresExibicao,
  listaDemaisServicosYbyoca,
  listaServicosOferecidosYbyoca,
  normalizarPropostaDadosYbyoca,
  OPCOES_COMPLEMENTARES_YB,
  textoEntregaArquitetonicoYbyoca,
} from "../utils/orcamentoPropostaUtils";

Font.register({
  family: "Montserrat",
  fonts: [
    { src: montserratRegular, fontWeight: 400 },
    { src: montserratBold, fontWeight: 700 },
    { src: montserratExtraBold, fontWeight: 800 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const COR_LARANJA = "#F16723";
const COR_LARANJA_SUAVE = "#FFF3EC";
const COR_TITULO = "#1C1C1C";
const COR_TEXTO = "#3A3A3A";
const COR_MUTED = "#6A6A6A";
const COR_LINHA = "#E4E4E4";
const COR_CAPA = "#FBFAF9";
const COR_FUNDO = "#FFFFFF";

const A4_ALTURA = 841.89;
const A4_LARGURA = 595.28;
const PAD_H = 46;
const PAD_TOP = 74;
const PAD_BOTTOM = 46;
const ALTURA_UTIL = A4_ALTURA - PAD_TOP - PAD_BOTTOM;

const styles = StyleSheet.create({
  capa: {
    height: A4_ALTURA,
    backgroundColor: COR_CAPA,
    fontFamily: "Montserrat",
    fontWeight: 400,
    color: COR_TITULO,
    flexDirection: "column",
  },
  capaTopo: {
    paddingTop: 48,
    paddingHorizontal: 48,
  },
  capaMarca: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 3.4,
    color: COR_TITULO,
  },
  capaMarcaSub: {
    marginTop: 3,
    fontSize: 8,
    letterSpacing: 2.8,
    color: COR_MUTED,
  },
  capaMiolo: {
    paddingHorizontal: 48,
    paddingBottom: 16,
  },
  capaTraco: {
    width: 28,
    height: 2.5,
    backgroundColor: COR_LARANJA,
    marginBottom: 12,
  },
  capaTitulo: {
    fontSize: 26,
    lineHeight: 1.05,
    letterSpacing: 0.6,
    color: COR_TITULO,
  },
  capaTituloForte: {
    fontSize: 26,
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: COR_TITULO,
  },
  capaSubtitulo: {
    marginTop: 8,
    fontSize: 10,
    color: COR_MUTED,
  },
  capaFotoJanela: {
    width: A4_LARGURA,
    height: 336,
    overflow: "hidden",
  },
  // A foto original tem faixas cinza nas laterais; o recorte mostra só a casa.
  capaFoto: {
    width: 737,
    height: 524,
    marginLeft: -49.5,
    marginTop: -42,
  },
  capaFaixa: {
    height: 2.5,
    backgroundColor: COR_LARANJA,
  },
  capaRodape: {
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 48,
  },
  capaLinhaCampos: {
    flexDirection: "row",
  },
  capaColEsq: {
    flex: 1,
    paddingRight: 22,
  },
  capaColDir: {
    width: 156,
  },
  capaRotulo: {
    fontSize: 8,
    letterSpacing: 1.1,
    color: COR_MUTED,
    marginBottom: 2,
  },
  capaValor: {
    fontSize: 12,
    color: COR_LARANJA,
    lineHeight: 1.3,
  },
  capaValorNeutro: {
    fontSize: 12,
    color: COR_TITULO,
    lineHeight: 1.3,
  },
  capaFilete: {
    marginTop: 4,
    marginBottom: 10,
    height: 0.6,
    backgroundColor: COR_LINHA,
  },
  page: {
    backgroundColor: COR_FUNDO,
    fontFamily: "Montserrat",
    fontWeight: 400,
    color: COR_TEXTO,
    paddingTop: PAD_TOP,
    paddingBottom: PAD_BOTTOM,
    paddingHorizontal: PAD_H,
  },
  header: {
    position: "absolute",
    top: 26,
    left: PAD_H,
    width: A4_LARGURA - PAD_H * 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerMarca: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.6,
    color: COR_TITULO,
  },
  headerSub: {
    marginTop: 1,
    fontSize: 7,
    letterSpacing: 1.5,
    color: COR_MUTED,
  },
  headerTitulo: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.7,
    color: COR_LARANJA,
    textAlign: "right",
  },
  headerData: {
    marginTop: 2,
    fontSize: 8,
    letterSpacing: 0.6,
    color: COR_MUTED,
    textAlign: "right",
  },
  headerLinha: {
    marginTop: 8,
    height: 1,
    backgroundColor: COR_LARANJA,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: PAD_H,
    width: A4_LARGURA - PAD_H * 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerMarca: {
    fontSize: 8,
    letterSpacing: 0.8,
    color: COR_MUTED,
  },
  footerMarcaForte: {
    fontWeight: 700,
    color: COR_LARANJA,
  },
  pageNum: {
    fontSize: 8,
    color: COR_MUTED,
    letterSpacing: 0.4,
  },
  contatoBloco: {
    fontSize: 11,
    lineHeight: 1.5,
    color: COR_LARANJA,
    textAlign: "center",
    marginBottom: 14,
  },
  contatoForte: {
    fontWeight: 700,
  },
  saudacao: {
    fontSize: 11.5,
    lineHeight: 1.5,
    color: COR_TEXTO,
    marginBottom: 8,
  },
  paragrafo: {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: COR_TEXTO,
    marginBottom: 8,
  },
  secao: {
    marginTop: 14,
    marginBottom: 8,
    alignItems: "center",
  },
  secaoTitulo: {
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: COR_TITULO,
    textAlign: "center",
  },
  secaoTraco: {
    marginTop: 4,
    width: 22,
    height: 2,
    backgroundColor: COR_LARANJA,
  },
  bullet: {
    fontSize: 10.5,
    lineHeight: 1.45,
    color: COR_TEXTO,
    marginBottom: 3,
  },
  bulletForte: {
    fontWeight: 700,
  },
  itemTitulo: {
    fontSize: 10.5,
    fontWeight: 700,
    color: COR_TITULO,
    marginBottom: 2,
  },
  bloco: {
    marginBottom: 10,
  },
  investLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: 0.6,
    borderBottomColor: COR_LINHA,
  },
  investLabel: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: 700,
    color: COR_TITULO,
    paddingRight: 12,
  },
  investValor: {
    fontSize: 10.5,
    fontWeight: 700,
    color: COR_TITULO,
    textAlign: "right",
  },
  totalBar: {
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 11,
    backgroundColor: COR_LARANJA_SUAVE,
    alignItems: "center",
  },
  totalTexto: {
    fontSize: 12,
    fontWeight: 700,
    color: COR_TITULO,
    textAlign: "center",
  },
  gestaoNota: {
    fontSize: 10.5,
    color: COR_TEXTO,
    textAlign: "center",
    marginBottom: 6,
  },
  pagtoLinha: {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: COR_TEXTO,
    marginBottom: 6,
  },
  pagtoRotulo: {
    fontWeight: 700,
    color: COR_TITULO,
  },
});

function fontSizeCampo(texto, base = 12) {
  const n = String(texto || "").length;
  if (n > 48) return 9;
  if (n > 32) return 10;
  if (n > 22) return 11;
  return base;
}

function CampoCapa({ rotulo, valor, neutro = false }) {
  return (
    <View>
      <Text style={styles.capaRotulo}>{rotulo}</Text>
      <Text
        style={[
          neutro ? styles.capaValorNeutro : styles.capaValor,
          { fontSize: fontSizeCampo(valor) },
        ]}
      >
        {valor}
      </Text>
      <View style={styles.capaFilete} />
    </View>
  );
}

function Cabecalho({ titulo, data }) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerMarca}>YBYOCA</Text>
          <Text style={styles.headerSub}>ARQUITETURA</Text>
        </View>
        <View>
          <Text style={styles.headerTitulo}>{titulo}</Text>
          <Text style={styles.headerData}>{data}</Text>
        </View>
      </View>
      <View style={styles.headerLinha} />
    </View>
  );
}

function Rodape() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerMarca}>
        <Text style={styles.footerMarcaForte}>YBYOCA</Text>
        {"  ARQUITETURA"}
      </Text>
      <Text
        style={styles.pageNum}
        render={({ pageNumber }) => String(pageNumber).padStart(2, "0")}
      />
    </View>
  );
}

function Pagina({ titulo, data, children }) {
  return (
    <Page size="A4" style={styles.page}>
      <Cabecalho titulo={titulo} data={data} />
      <Rodape />
      {children}
    </Page>
  );
}

function Secao({ titulo }) {
  return (
    <View style={styles.secao} wrap={false}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      <View style={styles.secaoTraco} />
    </View>
  );
}

function Bullet({ children, forte = false }) {
  return (
    <Text style={styles.bullet}>
      <Text style={styles.bulletForte}>• </Text>
      {forte ? <Text style={styles.bulletForte}>{children}</Text> : children}
    </Text>
  );
}

function itensEntrega(texto) {
  return String(texto || "")
    .split(";")
    .map((item) => item.replace(/\.\s*$/, "").trim())
    .filter(Boolean);
}

function estimarAlturaTexto(texto, fontSize = 10.5, lineHeight = 1.45) {
  const largura = A4_LARGURA - PAD_H * 2;
  const cpl = Math.max(24, Math.floor(largura / (fontSize * 0.5)));
  const linhas = String(texto || "")
    .split("\n")
    .reduce(
      (acc, linha) => acc + Math.max(1, Math.ceil(Math.max(linha.length, 1) / cpl)),
      0,
    );
  return linhas * fontSize * lineHeight;
}

function textoServico(titulo) {
  return (
    YB_SERVICOS_DETALHE[titulo] ||
    "Serviço complementar conforme briefing acordado com o cliente."
  );
}

/** Reparte os serviços sem deixar um item sozinho na última página. */
function paginarDemaisServicos(titulos) {
  const limite = ALTURA_UTIL - 12;
  const intro =
    YB_DEMAIS_INTRO.reduce((acc, p) => acc + estimarAlturaTexto(p) + 8, 0) + 40;
  const paginas = [];
  let atual = [];
  let altura = intro;

  for (const titulo of titulos) {
    const h = 18 + estimarAlturaTexto(textoServico(titulo)) + 12;
    if (atual.length && altura + h > limite) {
      paginas.push(atual);
      atual = [titulo];
      altura = h;
    } else {
      atual.push(titulo);
      altura += h;
    }
  }
  if (atual.length) paginas.push(atual);

  if (
    paginas.length > 1 &&
    paginas.at(-1).length === 1 &&
    paginas.at(-2).length > 1
  ) {
    paginas.at(-1).unshift(paginas.at(-2).pop());
  }
  return paginas.length ? paginas : [[]];
}

export default function OrcamentoYbyocaPDF({ orcamento }) {
  const proposta = normalizarPropostaDadosYbyoca(orcamento?.proposta_dados);
  const dataRef = orcamento?.data || orcamento?.created_at;
  const codigo = formatarCodigoPropostaYB(orcamento?.numero_proposta, dataRef);
  const dataInterna = formatarDataCabecalhoYB(dataRef);
  const mesAno = formatarMesAnoCapa(dataRef);
  const nomeCliente = String(orcamento?.nome || "").trim() || "—";
  const contato = String(proposta.contato || "").trim() || "—";
  const endereco = String(proposta.endereco || "").trim() || "—";

  const servicosOferecidos = listaServicosOferecidosYbyoca(proposta);
  const demaisServicos = listaDemaisServicosYbyoca(proposta);
  const entregaTexto = textoEntregaArquitetonicoYbyoca(proposta.arquitetonico);
  const entregaItens = itensEntrega(entregaTexto);
  const itensComplementares = listaComplementaresExibicao(
    proposta.complementares,
    proposta.complementares_outros,
    OPCOES_COMPLEMENTARES_YB,
  );

  const temArquitetonico =
    proposta.arquitetonico.length > 0 ||
    (parseFloat(proposta.valores.arquitetonico) || 0) > 0;
  const temDemais = demaisServicos.length > 0;

  const valor = (key) => parseFloat(proposta.valores[key]) || 0;
  const totalProjetos = calcularTotalProjetosYbyoca(proposta.valores);
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

  const listaServicos = servicosOferecidos.length
    ? servicosOferecidos
    : ["Serviços conforme briefing acordado com o cliente."];

  const saudacao =
    nomeCliente === "—"
      ? "Seja bem-vindo à Ybyoca Arquitetura."
      : `${nomeCliente}, seja bem-vindo à Ybyoca Arquitetura.`;

  return (
    <Document title={`PROPOSTA ${codigo} — Ybyoca`}>
      <Page size="A4" style={styles.capa}>
        <View style={styles.capaTopo}>
          <Text style={styles.capaMarca}>YBYOCA</Text>
          <Text style={styles.capaMarcaSub}>ARQUITETURA</Text>
        </View>
        <View style={{ flexGrow: 1, minHeight: 28 }} />
        <View style={styles.capaMiolo}>
          <View style={styles.capaTraco} />
          <Text style={styles.capaTitulo}>PROPOSTA</Text>
          <Text style={styles.capaTituloForte}>ORÇAMENTÁRIA</Text>
          <Text style={styles.capaSubtitulo}>{YB_CAPA_SUBTITULO}</Text>
        </View>
        <View style={styles.capaFaixa} />
        <View style={styles.capaFotoJanela}>
          <Image src={photoFachada} style={styles.capaFoto} />
        </View>
        <View style={styles.capaRodape}>
          <View style={styles.capaLinhaCampos}>
            <View style={styles.capaColEsq}>
              <CampoCapa rotulo="CLIENTE" valor={nomeCliente} />
            </View>
            <View style={styles.capaColDir}>
              <CampoCapa rotulo="PROPOSTA" valor={codigo} />
            </View>
          </View>
          <View style={styles.capaLinhaCampos}>
            <View style={styles.capaColEsq}>
              <CampoCapa rotulo="CONTATO" valor={contato} />
            </View>
            <View style={styles.capaColDir}>
              <CampoCapa
                rotulo="DATA"
                valor={`${mesAno.mes}  ·  ${mesAno.ano}`}
                neutro
              />
            </View>
          </View>
          <CampoCapa rotulo="ENDEREÇO" valor={endereco} />
        </View>
      </Page>

      <Pagina titulo="APRESENTAÇÃO" data={dataInterna}>
        <Text style={styles.contatoBloco}>
          <Text style={styles.contatoForte}>YBYOCA ARQUITETURA{"\n"}</Text>
          {YB_CONTATO.email}
          {"\n"}
          {YB_CONTATO.telefone}
        </Text>
        <Text style={styles.saudacao}>{saudacao}</Text>
        <Text style={styles.paragrafo}>{YB_BOAS_VINDAS_AGRADECIMENTO}</Text>
        <Text style={styles.paragrafo}>
          {YB_INTRO_ESCRITORIO.map((parte) =>
            parte.negrito ? (
              <Text key={parte.trecho} style={styles.bulletForte}>
                {parte.trecho}
              </Text>
            ) : (
              <Text key={parte.trecho.slice(0, 12)}>{parte.trecho}</Text>
            ),
          )}
        </Text>

        <Secao titulo="SERVIÇOS OFERECIDOS" />
        {listaServicos.map((item) => (
          <Bullet key={item} forte={servicosOferecidos.length > 0}>
            {item}
          </Bullet>
        ))}

        <Secao titulo="NOSSA EQUIPE" />
        {YB_EQUIPE.paragrafos.map((p) => (
          <Text key={p.slice(0, 32)} style={styles.paragrafo}>
            {p}
          </Text>
        ))}
      </Pagina>

      {temArquitetonico ? (
        <Pagina titulo="PROJETO ARQUITETÔNICO" data={dataInterna}>
          <Text style={styles.paragrafo}>{YB_ARQUITETONICO.intro}</Text>
          <Secao titulo={YB_ARQUITETONICO.etapasTitulo} />
          {YB_ARQUITETONICO.etapas.map((etapa) => (
            <View key={etapa.titulo} style={styles.bloco} wrap={false}>
              <Text style={styles.itemTitulo}>{etapa.titulo}</Text>
              <Text style={styles.paragrafo}>{etapa.texto}</Text>
            </View>
          ))}
          {entregaItens.length ? (
            <View>
              <Secao titulo={YB_ARQUITETONICO.entregaTitulo} />
              {entregaItens.map((item) => (
                <Bullet key={item}>{item}</Bullet>
              ))}
            </View>
          ) : null}
        </Pagina>
      ) : null}

      {temDemais
        ? paginarDemaisServicos(demaisServicos).map((grupo, idx) => (
            <Pagina
              key={`demais-${grupo[0] || idx}`}
              titulo="DEMAIS SERVIÇOS"
              data={dataInterna}
            >
              {idx === 0 ? (
                <View>
                  {YB_DEMAIS_INTRO.map((p) => (
                    <Text key={p.slice(0, 32)} style={styles.paragrafo}>
                      {p}
                    </Text>
                  ))}
                  <Secao titulo={YB_DEMAIS_TITULO} />
                </View>
              ) : null}
              {grupo.map((titulo) => (
                <View key={titulo} style={styles.bloco} wrap={false}>
                  <Text style={styles.itemTitulo}>{titulo}</Text>
                  <Text style={styles.paragrafo}>{textoServico(titulo)}</Text>
                </View>
              ))}
            </Pagina>
          ))
        : null}

      <Pagina titulo="INVESTIMENTO" data={dataInterna}>
        {YB_CONDICOES_INTRO.map((p) => (
          <Text key={p.slice(0, 32)} style={styles.paragrafo}>
            {p}
          </Text>
        ))}
        <Secao titulo="INVESTIMENTOS" />
        {linhasInvestimento.length ? (
          linhasInvestimento.map((linha) => (
            <View key={linha.label} style={styles.investLinha} wrap={false}>
              <Text style={styles.investLabel}>{linha.label}</Text>
              <Text style={styles.investValor}>{linha.valor}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.paragrafo}>
            Investimento conforme briefing acordado com o cliente.
          </Text>
        )}
        {totalProjetos > 0 ? (
          <View style={styles.totalBar} wrap={false}>
            <Text style={styles.totalTexto}>
              Investimento geral: {formatarMoedaBRL(totalProjetos)}
            </Text>
          </View>
        ) : null}
        {valor("gestao") > 0 ? (
          <Text style={styles.gestaoNota}>
            Gestão de obras: {formatarMoedaBRL(proposta.valores.gestao)} / mês
          </Text>
        ) : null}

        <Secao titulo={YB_PAGAMENTO.titulo} />
        {YB_PAGAMENTO.opcoes.map((opcao) => (
          <Text key={opcao.rotulo} style={styles.pagtoLinha}>
            <Text style={styles.pagtoRotulo}>{opcao.rotulo}</Text>
            {opcao.texto}
          </Text>
        ))}

        <Secao titulo="OBSERVAÇÕES" />
        {YB_OBSERVACOES.map((obs) => (
          <Bullet key={obs.slice(0, 40)}>{obs}</Bullet>
        ))}
        {proposta.descricao?.trim() ? (
          <Text style={[styles.paragrafo, { marginTop: 8 }]}>
            {proposta.descricao.trim()}
          </Text>
        ) : null}
      </Pagina>
    </Document>
  );
}
