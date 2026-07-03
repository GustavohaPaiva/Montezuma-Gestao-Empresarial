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
import { ARQUITETO_INFO } from "./orcamentoPropostaTemplate";

const COR_TEXTO = "#111827";
const COR_MUTED = "#6B7280";
const COR_DIVISOR = "#E5E7EB";
const COR_FUNDO = "#FAFAFA";

const COR_MONTEZUMA = "#DC3B0B";
const COR_MONTEZUMA_SUAVE = "#FEF3EF";
const COR_VK = "#149FC4";
const COR_VK_SUAVE = "#E8F4F8";

function getBrandConfig(escritorioId) {
  const isVogelkop = escritorioId === ID_VOGELKOP;
  return {
    isVogelkop,
    logo: isVogelkop ? logoVogelkop : logoMontezuma,
    nomeMarca: isVogelkop ? "VogelKop Arquitetura" : "Montezuma Gestão de Obras",
    author: isVogelkop ? "VogelKop Arquitetura" : "Montezuma Gestão de Obras",
    corPrimaria: isVogelkop ? COR_VK : COR_MONTEZUMA,
    corPrimariaSuave: isVogelkop ? COR_VK_SUAVE : COR_MONTEZUMA_SUAVE,
  };
}

function criarStyles(corPrimaria, corPrimariaSuave) {
  return StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 56,
      paddingHorizontal: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: COR_TEXTO,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingBottom: 14,
      borderBottomWidth: 2,
      borderBottomColor: corPrimaria,
      borderBottomStyle: "solid",
      marginBottom: 18,
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    logo: {
      width: 48,
      height: 48,
      objectFit: "contain",
      marginRight: 12,
    },
    docTitle: {
      fontSize: 17,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
      letterSpacing: 0.3,
    },
    docSubtitle: {
      fontSize: 9.5,
      color: COR_MUTED,
      marginTop: 3,
    },
    docRef: {
      fontSize: 9,
      color: corPrimaria,
      fontFamily: "Helvetica-Bold",
      marginTop: 5,
    },
    meta: {
      alignItems: "flex-end",
      minWidth: 140,
    },
    metaLabel: {
      fontSize: 7.5,
      color: COR_MUTED,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    metaValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
      marginTop: 2,
      marginBottom: 6,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: corPrimariaSuave,
      borderWidth: 0.6,
      borderColor: COR_DIVISOR,
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
      marginTop: 2,
    },
    cardBlock: {
      marginBottom: 12,
    },
    card: {
      width: "100%",
      padding: 10,
      borderRadius: 6,
      borderWidth: 0.7,
      borderColor: COR_DIVISOR,
      backgroundColor: COR_FUNDO,
    },
    cardTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    cardLine: {
      fontSize: 9.5,
      color: COR_TEXTO,
      marginBottom: 3,
      lineHeight: 1.35,
    },
    cardMuted: {
      fontSize: 8.5,
      color: COR_MUTED,
      marginBottom: 2,
    },
    section: {
      marginTop: 4,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
      paddingBottom: 4,
      marginBottom: 8,
      borderBottomWidth: 0.7,
      borderBottomColor: COR_DIVISOR,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    infoRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 4,
    },
    infoChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      backgroundColor: "#FFFFFF",
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
      marginBottom: 1,
    },
    infoChipValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
    },
    textBlock: {
      fontSize: 9.5,
      color: COR_TEXTO,
      lineHeight: 1.45,
    },
    listaBox: {
      borderWidth: 0.7,
      borderColor: COR_DIVISOR,
      borderRadius: 4,
      overflow: "hidden",
      marginTop: 4,
    },
    listaItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: COR_DIVISOR,
    },
    listaItemAlt: {
      backgroundColor: COR_FUNDO,
    },
    listaMarcador: {
      width: 12,
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: corPrimaria,
      marginRight: 6,
    },
    listaTexto: {
      fontSize: 9,
      color: COR_TEXTO,
      flex: 1,
      lineHeight: 1.3,
    },
    resumoBox: {
      marginTop: 8,
      padding: 10,
      borderRadius: 4,
      backgroundColor: COR_FUNDO,
      borderWidth: 0.6,
      borderColor: COR_DIVISOR,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    resumoText: {
      fontSize: 9,
      color: COR_MUTED,
    },
    resumoDestaque: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
    },
    notas: {
      marginTop: 12,
      padding: 10,
      borderRadius: 4,
      borderWidth: 0.6,
      borderColor: COR_DIVISOR,
      backgroundColor: "#FFFFFF",
    },
    notasTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: COR_MUTED,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 5,
    },
    notasText: {
      fontSize: 8.5,
      color: COR_MUTED,
      lineHeight: 1.45,
    },
    assinaturas: {
      flexDirection: "row",
      gap: 24,
      marginTop: 22,
    },
    assinatura: {
      flex: 1,
    },
    assinaturaTitulo: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: COR_TEXTO,
      marginBottom: 8,
    },
    assinaturaLinha: {
      borderBottomWidth: 0.7,
      borderBottomColor: COR_TEXTO,
      marginBottom: 4,
      height: 28,
    },
    assinaturaLabel: {
      fontSize: 8,
      color: COR_MUTED,
      textAlign: "center",
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      textAlign: "center",
      fontSize: 7.5,
      color: COR_MUTED,
      borderTopWidth: 0.6,
      borderTopColor: COR_DIVISOR,
      paddingTop: 6,
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
  const iso = String(raw).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return formatarData(raw);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
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
          style={[
            styles.listaItem,
            idx % 2 === 1 ? styles.listaItemAlt : null,
          ]}
        >
          <Text style={styles.listaMarcador}>✓</Text>
          <Text style={styles.listaTexto}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function SecaoPdf({ secao, numero, styles }) {
  const titulo = `${numero}. ${secao.titulo}`;

  if (secao.tipo === "texto") {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{titulo}</Text>
        <Text style={styles.textBlock}>{secao.conteudo}</Text>
      </View>
    );
  }

  if (secao.tipo === "checkboxes") {
    const itens = [
      ...secao.opcoes,
      ...secao.outros.map((item) => `Outro: ${item}`),
    ];
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{titulo}</Text>
        <ListaMarcada itens={itens} styles={styles} />
      </View>
    );
  }

  if (secao.tipo === "prazos") {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{titulo}</Text>
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
          <Text style={[styles.textBlock, { marginTop: 6 }]}>
            {secao.observacoes}
          </Text>
        ) : null}
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{titulo}</Text>
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
                marginTop: valorFormatado ? 8 : 0,
                marginBottom: 4,
              }}
            >
              Forma de pagamento
            </Text>
            <ListaMarcada itens={formas} styles={styles} />
          </>
        ) : null}
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
        <View style={[styles.infoRow, linhas.length > 0 ? { marginTop: 8 } : null]}>
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

export default function OrdemServicoPDF({ os, escritorioId }) {
  const brand = getBrandConfig(escritorioId);
  const styles = criarStyles(brand.corPrimaria, brand.corPrimariaSuave);
  const secoes = buildSecoesPdfOs(os);

  const numeroOs = os?.numero ?? "";
  const docRef = numeroOs
    ? `OS-${String(numeroOs).padStart(3, "0")}`
    : "OS — nova";
  const statusLabel =
    OS_STATUS_LABEL[os?.status] || OS_STATUS_LABEL.pendente;
  const dataEmissao = os?.data_emissao || new Date().toISOString();

  const responsavelEmpresa = brand.isVogelkop
    ? ARQUITETO_INFO.nome
    : os?.responsavel_tecnico || "";

  const temBlocoCliente =
    campoPreenchido(os?.responsavel_tecnico) ||
    campoPreenchido(os?.cliente_nome) ||
    campoPreenchido(os?.cliente_telefone) ||
    campoPreenchido(os?.cliente_email) ||
    campoPreenchido(enderecoProjetoFromOs(os));

  const footerRef = numeroOs
    ? `OS-${String(numeroOs).padStart(3, "0")}`
    : "OS";

  return (
    <Document
      title={`Ordem de Serviço ${numeroOs}`}
      author={brand.author}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image src={brand.logo} style={styles.logo} />
            <View>
              <Text style={styles.docTitle}>Ordem de Serviço</Text>
              <Text style={styles.docSubtitle}>{brand.nomeMarca}</Text>
              <Text style={styles.docRef}>{docRef}</Text>
            </View>
          </View>
          <View style={styles.meta}>
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
          <Text style={styles.notasTitle}>Aprovação</Text>
          <Text style={styles.notasText}>
            Declaro estar de acordo com os serviços descritos nesta Ordem de
            Serviço. Alterações não previstas no escopo poderão gerar custos
            adicionais. Os prazos poderão ser ajustados em caso de atrasos nas
            aprovações ou fornecimento de informações pelo cliente.
          </Text>
        </View>

        <View style={styles.assinaturas}>
          <View style={styles.assinatura}>
            <Text style={styles.assinaturaTitulo}>Cliente</Text>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaLabel}>Nome e assinatura</Text>
            <View style={[styles.assinaturaLinha, { marginTop: 16 }]} />
            <Text style={styles.assinaturaLabel}>Data</Text>
          </View>
          <View style={styles.assinatura}>
            <Text style={styles.assinaturaTitulo}>{brand.nomeMarca}</Text>
            {responsavelEmpresa ? (
              <Text
                style={{
                  fontSize: 8.5,
                  color: COR_MUTED,
                  textAlign: "center",
                  marginBottom: 6,
                }}
              >
                {responsavelEmpresa}
              </Text>
            ) : null}
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaLabel}>Assinatura</Text>
            <View style={[styles.assinaturaLinha, { marginTop: 16 }]} />
            <Text style={styles.assinaturaLabel}>Data</Text>
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
