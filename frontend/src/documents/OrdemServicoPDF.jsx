import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import logoMontezuma from "../assets/logos/logo sem fundo.png";
import logoVogelkop from "../assets/documents/vogelkop-proposta/logo-bird.png";
import { ID_VOGELKOP } from "../constants/escritorios";
import { OS_STATUS_LABEL } from "../constants/ordemServico";
import {
  buildSecoesPdfOs,
  campoPreenchido,
  enderecoProjetoFromOs,
} from "../pages/ordens-servico/ordensServicoUtils";

const COR_TEXTO = "#111827";
const COR_MUTED = "#6B7280";
const COR_DIVISOR = "#E5E7EB";
const COR_FUNDO = "#FAFAFA";
const COR_BRANCO = "#FFFFFF";

const COR_MONTEZUMA = "#DC3B0B";
const COR_MONTEZUMA_SUAVE = "#FEF3EF";
const COR_VK = "#149FC4";
const COR_VK_SUAVE = "#E8F4F8";

function getBrandConfig(escritorioId) {
  const isVogelkop = escritorioId === ID_VOGELKOP;
  return {
    isVogelkop,
    logo: isVogelkop ? logoVogelkop : logoMontezuma,
    nomeMarca: isVogelkop
      ? "VogelKop Arquitetura"
      : "Montezuma Gestão de Obras",
    author: isVogelkop ? "VogelKop Arquitetura" : "Montezuma Gestão de Obras",
    corPrimaria: isVogelkop ? COR_VK : COR_MONTEZUMA,
    corPrimariaSuave: isVogelkop ? COR_VK_SUAVE : COR_MONTEZUMA_SUAVE,
  };
}

function criarStyles(corPrimaria, corPrimariaSuave) {
  return StyleSheet.create({
    page: {
      paddingTop: 44,
      paddingBottom: 60,
      paddingHorizontal: 44,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: COR_TEXTO,
      backgroundColor: COR_BRANCO,
    },
    topBand: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: corPrimaria,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingBottom: 16,
      borderBottomWidth: 2,
      borderBottomColor: corPrimaria,
      marginBottom: 20,
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    logo: {
      width: 56,
      height: 56,
      objectFit: "contain",
      marginRight: 14,
    },
    docTitle: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
      letterSpacing: 0.4,
    },
    docSubtitle: {
      fontSize: 9.5,
      color: COR_MUTED,
      marginTop: 4,
    },
    docRef: {
      fontSize: 9,
      color: corPrimaria,
      fontFamily: "Helvetica-Bold",
      marginTop: 6,
      letterSpacing: 0.3,
    },
    metaCard: {
      alignItems: "flex-end",
      minWidth: 148,
      padding: 10,
      borderRadius: 6,
      borderWidth: 0.7,
      borderColor: COR_DIVISOR,
      backgroundColor: COR_FUNDO,
    },
    metaLabel: {
      fontSize: 7,
      color: COR_MUTED,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    metaValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
      marginTop: 2,
      marginBottom: 8,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: corPrimariaSuave,
      borderWidth: 0.6,
      borderColor: corPrimaria,
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
      marginTop: 2,
    },
    cardBlock: {
      marginBottom: 16,
    },
    card: {
      width: "100%",
      padding: 12,
      borderRadius: 6,
      borderWidth: 0.7,
      borderColor: COR_DIVISOR,
      backgroundColor: COR_FUNDO,
      borderLeftWidth: 3,
      borderLeftColor: corPrimaria,
    },
    cardTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 8,
    },
    cardLine: {
      fontSize: 9.5,
      color: COR_TEXTO,
      marginBottom: 4,
      lineHeight: 1.4,
    },
    cardMuted: {
      fontSize: 8.5,
      color: COR_MUTED,
      marginBottom: 3,
      lineHeight: 1.35,
    },
    sectionCard: {
      marginBottom: 16,
      borderWidth: 0.7,
      borderColor: COR_DIVISOR,
      borderRadius: 6,
      overflow: "hidden",
      backgroundColor: COR_BRANCO,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: COR_FUNDO,
      borderBottomWidth: 0.6,
      borderBottomColor: COR_DIVISOR,
      borderLeftWidth: 3,
      borderLeftColor: corPrimaria,
    },
    sectionNumeroWrap: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: corPrimariaSuave,
      borderWidth: 0.6,
      borderColor: corPrimaria,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    sectionNumero: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
      textAlign: "center",
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      flex: 1,
    },
    sectionBody: {
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    infoRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 4,
    },
    infoChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 4,
      backgroundColor: COR_BRANCO,
      borderWidth: 0.6,
      borderColor: COR_DIVISOR,
      minWidth: "30%",
      flexGrow: 1,
    },
    infoChipLabel: {
      fontSize: 7,
      color: COR_MUTED,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    infoChipValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
    },
    textBlock: {
      fontSize: 9.5,
      color: COR_TEXTO,
      lineHeight: 1.5,
    },
    listaBox: {
      borderWidth: 0.6,
      borderColor: COR_DIVISOR,
      borderRadius: 4,
      overflow: "hidden",
      marginTop: 4,
    },
    listaItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: COR_DIVISOR,
    },
    listaItemAlt: {
      backgroundColor: COR_FUNDO,
    },
    listaMarcadorWrap: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: corPrimariaSuave,
      borderWidth: 0.5,
      borderColor: corPrimaria,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    listaMarcador: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
    },
    listaTexto: {
      fontSize: 9,
      color: COR_TEXTO,
      flex: 1,
      lineHeight: 1.35,
    },
    resumoBox: {
      marginTop: 4,
      padding: 12,
      borderRadius: 6,
      backgroundColor: corPrimariaSuave,
      borderWidth: 0.8,
      borderColor: corPrimaria,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    resumoText: {
      fontSize: 9,
      color: COR_MUTED,
    },
    resumoDestaque: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
    },
    notas: {
      marginTop: 16,
      padding: 12,
      borderRadius: 6,
      borderWidth: 0.6,
      borderColor: COR_DIVISOR,
      backgroundColor: COR_FUNDO,
      borderLeftWidth: 3,
      borderLeftColor: corPrimaria,
    },
    notasTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    notasText: {
      fontSize: 8.5,
      color: COR_MUTED,
      lineHeight: 1.5,
    },
    assinaturasWrap: {
      marginTop: 32,
      paddingTop: 16,
      borderTopWidth: 0.8,
      borderTopColor: COR_DIVISOR,
    },
    assinaturasTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 14,
      textAlign: "center",
    },
    assinaturas: {
      flexDirection: "row",
      gap: 20,
    },
    assinatura: {
      flex: 1,
      padding: 10,
      borderRadius: 6,
      borderWidth: 0.7,
      borderColor: COR_DIVISOR,
      backgroundColor: COR_FUNDO,
      minHeight: 100,
    },
    assinaturaTitulo: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
      textAlign: "center",
    },
    assinaturaNome: {
      fontSize: 8.5,
      color: COR_TEXTO,
      textAlign: "center",
      marginBottom: 6,
    },
    assinaturaImgWrap: {
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    assinaturaImg: {
      maxHeight: 44,
      maxWidth: "100%",
      objectFit: "contain",
    },
    assinaturaPendente: {
      fontSize: 8,
      color: COR_MUTED,
      fontStyle: "italic",
      textAlign: "center",
      marginVertical: 12,
    },
    assinaturaData: {
      fontSize: 7.5,
      color: COR_MUTED,
      textAlign: "center",
      marginTop: 4,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 44,
      right: 44,
      textAlign: "center",
      fontSize: 7.5,
      color: COR_MUTED,
      borderTopWidth: 0.6,
      borderTopColor: COR_DIVISOR,
      paddingTop: 8,
    },
  });
}

function formatarData(raw) {
  if (!raw) return "—";
  const iso = String(raw).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, day] = iso.split("-");
    return `${day}/${m}/${y}`;
  }
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function formatarDataHora(raw) {
  if (!raw) return "—";
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return formatarData(raw);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarMoeda(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function InfoChip({ label, value, styles }) {
  return (
    <View style={styles.infoChip}>
      <View>
        <Text style={styles.infoChipLabel}>{label}</Text>
        <Text style={styles.infoChipValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function BlocoCard({ titulo, linhas, styles }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{titulo}</Text>
      {linhas.map((linha, i) =>
        linha.muted ? (
          <Text key={i} style={styles.cardMuted}>
            {linha.texto}
          </Text>
        ) : (
          <Text key={i} style={styles.cardLine}>
            {linha.texto}
          </Text>
        ),
      )}
    </View>
  );
}

function ListaMarcada({ itens, styles }) {
  if (!itens.length) return null;
  return (
    <View style={styles.listaBox}>
      {itens.map((item, idx) => (
        <View
          key={`${item}-${idx}`}
          style={[styles.listaItem, idx % 2 === 1 ? styles.listaItemAlt : null]}
        >
          <View style={styles.listaMarcadorWrap}>
            <Text style={styles.listaMarcador}>✓</Text>
          </View>
          <Text style={styles.listaTexto}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function SecaoPdf({ secao, numero, styles }) {
  const titulo = secao.titulo;

  const header = (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionNumeroWrap}>
        <Text style={styles.sectionNumero}>{numero}</Text>
      </View>
      <Text style={styles.sectionTitle}>{titulo}</Text>
    </View>
  );

  if (secao.tipo === "texto") {
    return (
      <View style={styles.sectionCard} wrap={false}>
        {header}
        <View style={styles.sectionBody}>
          <Text style={styles.textBlock}>{secao.conteudo}</Text>
        </View>
      </View>
    );
  }

  if (secao.tipo === "checkboxes") {
    const itens = [
      ...secao.opcoes,
      ...secao.outros.map((item) => `Outro: ${item}`),
    ];
    return (
      <View style={styles.sectionCard}>
        {header}
        <View style={styles.sectionBody}>
          <ListaMarcada itens={itens} styles={styles} />
        </View>
      </View>
    );
  }

  if (secao.tipo === "prazos") {
    return (
      <View style={styles.sectionCard} wrap={false}>
        {header}
        <View style={styles.sectionBody}>
          <View style={styles.infoRow}>
            {campoPreenchido(secao.data_inicio) ? (
              <InfoChip
                label="Data de início"
                value={formatarData(secao.data_inicio)}
                styles={styles}
              />
            ) : null}
            {campoPreenchido(secao.data_entrega_prevista) ? (
              <InfoChip
                label="Entrega prevista"
                value={formatarData(secao.data_entrega_prevista)}
                styles={styles}
              />
            ) : null}
          </View>
          {campoPreenchido(secao.observacoes) ? (
            <Text style={[styles.textBlock, { marginTop: 8 }]}>
              {secao.observacoes}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (secao.tipo === "valor") {
    const valorFormatado =
      secao.valor_total != null ? formatarMoeda(secao.valor_total) : "";
    const formas = [
      ...secao.opcoes,
      ...secao.outros.map((item) => `Outro: ${item}`),
    ];
    return (
      <View style={styles.sectionCard}>
        {header}
        <View style={styles.sectionBody}>
          {valorFormatado ? (
            <View style={styles.resumoBox}>
              <Text style={styles.resumoText}>Valor total dos serviços</Text>
              <Text style={styles.resumoDestaque}>{valorFormatado}</Text>
            </View>
          ) : null}
          {formas.length > 0 ? (
            <>
              <Text
                style={{
                  fontSize: 8,
                  color: COR_MUTED,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginTop: valorFormatado ? 10 : 0,
                  marginBottom: 6,
                }}
              >
                Forma de pagamento
              </Text>
              <ListaMarcada itens={formas} styles={styles} />
            </>
          ) : null}
        </View>
      </View>
    );
  }

  return null;
}

function BlocoCliente({ os, styles }) {
  const endereco = enderecoProjetoFromOs(os);
  const linhas = [];

  if (campoPreenchido(os?.cliente_nome)) {
    linhas.push({ texto: os.cliente_nome });
  }
  if (campoPreenchido(os?.cliente_telefone)) {
    linhas.push({ texto: `Tel.: ${os.cliente_telefone}`, muted: true });
  }
  if (campoPreenchido(os?.cliente_email)) {
    linhas.push({ texto: os.cliente_email, muted: true });
  }
  if (campoPreenchido(endereco)) {
    linhas.push({ texto: endereco, muted: true });
  }

  const temResponsavel = campoPreenchido(os?.responsavel_tecnico);
  if (linhas.length === 0 && !temResponsavel) return null;

  return (
    <View style={styles.cardBlock}>
      {linhas.length > 0 ? (
        <BlocoCard titulo="Cliente e projeto" linhas={linhas} styles={styles} />
      ) : null}
      {temResponsavel ? (
        <View
          style={[styles.infoRow, linhas.length > 0 ? { marginTop: 10 } : null]}
        >
          <InfoChip
            label="Responsável técnico"
            value={os.responsavel_tecnico}
            styles={styles}
          />
        </View>
      ) : null}
    </View>
  );
}

function BlocoAssinatura({ titulo, nome, assinadoEm, assinaturaUrl, styles }) {
  const assinado = Boolean(assinadoEm);
  return (
    <View style={styles.assinatura}>
      <Text style={styles.assinaturaTitulo}>{titulo}</Text>
      {nome ? <Text style={styles.assinaturaNome}>{nome}</Text> : null}
      {assinado && assinaturaUrl ? (
        <View style={styles.assinaturaImgWrap}>
          <Image src={assinaturaUrl} style={styles.assinaturaImg} />
        </View>
      ) : assinado ? (
        <Text style={styles.assinaturaPendente}>Assinatura registrada</Text>
      ) : (
        <Text style={styles.assinaturaPendente}>Assinatura pendente</Text>
      )}
      {assinado ? (
        <Text style={styles.assinaturaData}>
          {formatarDataHora(assinadoEm)}
        </Text>
      ) : null}
    </View>
  );
}

export default function OrdemServicoPDF({ os, escritorioId }) {
  const brand = getBrandConfig(escritorioId);
  const styles = criarStyles(brand.corPrimaria, brand.corPrimariaSuave);
  const secoes = buildSecoesPdfOs(os);

  const numeroOs = os?.numero ?? "";
  const docRef = numeroOs
    ? `OS-${String(numeroOs).padStart(3, "0")}`
    : "OS — nova";
  const statusLabel = OS_STATUS_LABEL[os?.status] || OS_STATUS_LABEL.pendente;
  const dataEmissao = os?.data_emissao || new Date().toISOString();

  const temBlocoCliente =
    campoPreenchido(os?.responsavel_tecnico) ||
    campoPreenchido(os?.cliente_nome) ||
    campoPreenchido(os?.cliente_telefone) ||
    campoPreenchido(os?.cliente_email) ||
    campoPreenchido(enderecoProjetoFromOs(os));

  const footerRef = numeroOs ? `OS-${String(numeroOs).padStart(3, "0")}` : "OS";

  const nomeEmissor = os?.criador?.nome || "—";
  const nomeResponsavel = os?.responsavel?.nome || null;

  return (
    <Document title={`Ordem de Serviço ${numeroOs}`} author={brand.author}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} fixed />

        <View style={styles.header}>
          <View style={styles.brand}>
            <Image src={brand.logo} style={styles.logo} />
            <View>
              <Text style={styles.docTitle}>Ordem de Serviço</Text>
              <Text style={styles.docSubtitle}>{brand.nomeMarca}</Text>
              <Text style={styles.docRef}>{docRef}</Text>
            </View>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Emissão</Text>
            <Text style={styles.metaValue}>
              {formatarDataHora(dataEmissao)}
            </Text>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.badge}>{statusLabel}</Text>
          </View>
        </View>

        {temBlocoCliente ? <BlocoCliente os={os} styles={styles} /> : null}

        {secoes.map((secao, index) => (
          <SecaoPdf
            key={secao.id}
            secao={secao}
            numero={index + 1}
            styles={styles}
          />
        ))}

        <View style={styles.notas}>
          <Text style={styles.notasTitle}>Termos e condições</Text>
          <Text style={styles.notasText}>
            Esta Ordem de Serviço formaliza o escopo, prazos e condições
            comerciais acordados para a prestação dos serviços descritos.
            Alterações não previstas no escopo poderão gerar custos adicionais.
            Os prazos poderão ser ajustados em caso de atrasos nas aprovações ou
            fornecimento de informações necessárias à execução.
          </Text>
        </View>

        <View style={styles.assinaturasWrap}>
          <Text style={styles.assinaturasTitle}>Assinaturas internas</Text>
          <View style={styles.assinaturas}>
            <BlocoAssinatura
              titulo="Emissor"
              nome={nomeEmissor}
              assinadoEm={os?.assinatura_emissor_em}
              assinaturaUrl={os?.criador?.assinatura_url}
              styles={styles}
            />
            {os?.responsavel_id ? (
              <BlocoAssinatura
                titulo="Responsável designado"
                nome={nomeResponsavel || "—"}
                assinadoEm={os?.assinatura_responsavel_em}
                assinaturaUrl={os?.responsavel?.assinatura_url}
                styles={styles}
              />
            ) : (
              <View style={styles.assinatura}>
                <Text style={styles.assinaturaTitulo}>
                  Responsável designado
                </Text>
                <Text style={styles.assinaturaPendente}>Não designado</Text>
              </View>
            )}
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Ordem de Serviço ${footerRef} · ${brand.nomeMarca} · ${formatarDataHora(dataEmissao)} · pág. ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
