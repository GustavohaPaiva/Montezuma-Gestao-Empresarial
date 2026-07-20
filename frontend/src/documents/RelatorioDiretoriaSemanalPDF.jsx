import { Document, Text, View } from "@react-pdf/renderer";
import { TIPOS_EXTRATO } from "../pages/relatorios-diretoria/relatorioFinanceiroUtils";
import { HtmlResumoObraPdf } from "./HtmlResumoObraPdf";
import {
  InfoChip,
  ReportHeader,
  ReportPage,
  formatData,
  formatMoeda,
  styles,
} from "./RelatorioDiretoriaPdfShared";

const SUBTITULO = "Relatórios da Diretoria · Montezuma Gestão Empresarial";

const htmlPdfStyles = {
  ...styles,
  resumoBody: { marginBottom: 6 },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 5,
  },
  heading1: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 4,
  },
  heading2: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 3,
  },
  heading3: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
    marginBottom: 2,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  underline: { textDecoration: "underline" },
  strike: { textDecoration: "line-through" },
  blockquote: {
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#DC3B0B",
  },
  list: { marginBottom: 5, paddingLeft: 2 },
  listItem: {
    flexDirection: "row",
    marginBottom: 3,
    paddingRight: 8,
  },
  listBullet: { width: 14, fontSize: 9 },
  listItemText: { flex: 1, fontSize: 9, lineHeight: 1.4 },
};

function LinhaLista({ children }) {
  return (
    <View style={styles.listItem} wrap={false}>
      <Text style={styles.listItemText}>{children}</Text>
    </View>
  );
}

function FinanceiroResumoCompacto({ resumo, observacoes = "" }) {
  const totais = resumo?.totais || {};
  const categorias = TIPOS_EXTRATO.filter(
    (tipo) => (resumo?.porCategoria?.[tipo]?.count || 0) > 0,
  );
  const temResumo = Boolean(resumo);

  return (
    <View>
      {temResumo ? (
        <>
          <View style={styles.metricGrid} wrap={false}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>A cobrar</Text>
              <Text style={styles.metricValue}>
                R$ {formatMoeda(totais.aCobrar)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Pago</Text>
              <Text style={styles.metricValue}>
                R$ {formatMoeda(totais.pago)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Aguardando</Text>
              <Text style={styles.metricValue}>
                R$ {formatMoeda(totais.aguardando)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Em espera</Text>
              <Text style={styles.metricValue}>
                R$ {formatMoeda(totais.emEspera)}
              </Text>
            </View>
          </View>

          {categorias.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.sectionSubtitle, { marginBottom: 4 }]}>
                Por categoria
              </Text>
              {categorias.map((tipo) => {
                const cat = resumo.porCategoria[tipo];
                return (
                  <LinhaLista key={tipo}>
                    {tipo}: R$ {formatMoeda(cat.total)} ({cat.count} lanç.)
                  </LinhaLista>
                );
              })}
            </View>
          ) : null}

          {(resumo?.extratoSemana?.length || 0) > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.sectionTitle, { fontSize: 9 }]} wrap={false}>
                A cobrar do cliente
              </Text>
              {resumo.extratoSemana.map((item, idx) => (
                <LinhaLista key={item.id ?? idx}>
                  · {item.descricao || item.tipo} — {formatData(item.data)} — R${" "}
                  {formatMoeda(item.valor)} ({item.status})
                </LinhaLista>
              ))}
            </View>
          ) : null}

          {(resumo?.emEsperaSemana?.length || 0) > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.sectionTitle, { fontSize: 9 }]} wrap={false}>
                Em espera
              </Text>
              {resumo.emEsperaSemana.map((item, idx) => (
                <LinhaLista key={item.id ?? idx}>
                  · {item.descricao || item.tipo} — {formatData(item.data)} — R${" "}
                  {formatMoeda(item.valor)}
                </LinhaLista>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {observacoes ? (
        <View style={{ marginTop: temResumo ? 10 : 0 }}>
          <Text style={[styles.sectionTitle, { fontSize: 9 }]} wrap={false}>
            Observações
          </Text>
          <Text style={styles.prosa}>{observacoes}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ModalitySection({ titulo, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.modalityHeader} wrap={false}>
        <Text style={styles.modalityTitle}>{titulo}</Text>
        <Text style={styles.modalityBadge}>Lançado</Text>
      </View>
      {children}
    </View>
  );
}

export default function RelatorioDiretoriaSemanalPDF({
  titulo = "Relatório Semanal",
  referencia = "Visão consolidada da semana",
  semanaLabel,
  blocos = [],
  ultimaAtualizacao,
  completo,
}) {
  return (
    <Document title={titulo} author="Montezuma Gestão Empresarial">
      <ReportPage titulo={titulo} subtitulo={SUBTITULO}>
        <ReportHeader
          titulo={titulo}
          subtitulo={SUBTITULO}
          referencia={referencia}
          semanaLabel={semanaLabel}
          extraMeta={
            completo
              ? [{ label: "Status", value: "Completo" }]
              : []
          }
        />

        <View style={styles.infoRow}>
          <InfoChip label="Escopo" value="Todas as obras" />
          {semanaLabel ? (
            <InfoChip label="Período" value={semanaLabel} />
          ) : null}
          {ultimaAtualizacao ? (
            <InfoChip label="Última atualização" value={ultimaAtualizacao} />
          ) : null}
        </View>

        {blocos.length === 0 ? (
          <Text style={styles.empty}>
            Nenhum conteúdo lançado para esta semana.
          </Text>
        ) : (
          blocos.map((bloco) => {
            if (bloco.tipo === "obra_html") {
              return (
                <ModalitySection key={bloco.id} titulo="Obra">
                  <HtmlResumoObraPdf html={bloco.html} styles={htmlPdfStyles} />
                </ModalitySection>
              );
            }

            if (bloco.tipo === "financeiro") {
              return (
                <ModalitySection key={bloco.id} titulo="Financeiro">
                  <FinanceiroResumoCompacto
                    resumo={bloco.resumo}
                    observacoes={bloco.observacoes}
                  />
                </ModalitySection>
              );
            }

            if (bloco.tipo === "prosa") {
              return (
                <ModalitySection key={bloco.id} titulo={bloco.titulo}>
                  <Text style={styles.prosa}>{bloco.texto}</Text>
                </ModalitySection>
              );
            }

            return null;
          })
        )}
      </ReportPage>
    </Document>
  );
}
