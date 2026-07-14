import { Document, Text, View } from "@react-pdf/renderer";
import { TIPOS_EXTRATO } from "../pages/relatorios-diretoria/relatorioFinanceiroUtils";
import {
  InfoChip,
  ReportHeader,
  ReportPage,
  formatData,
  formatMoeda,
  styles,
} from "./RelatorioDiretoriaPdfShared";

const SUBTITULO = "Relatórios da Diretoria · Montezuma Gestão Empresarial";

function TopicosObraSection({ topicos }) {
  if (!topicos?.length) return null;

  return (
    <>
      {topicos.map((topico) => (
        <View key={topico.id} style={styles.topicoSection}>
          <View style={styles.topicoHeader}>
            <Text style={styles.topicoTitle}>{topico.label}</Text>
          </View>
          <View style={styles.topicoBody}>
            {topico.itens.length === 0 ? (
              <Text style={styles.empty}>Nenhum item registrado.</Text>
            ) : (
              topico.itens.map((item) => (
                <View key={item.id} style={styles.item}>
                  <Text style={styles.itemText}>{item.texto}</Text>
                  {item.prazoLabel ? (
                    <Text style={styles.itemPrazo}>
                      Prazo: {item.prazoLabel}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      ))}
    </>
  );
}

function FinanceiroResumoCompacto({ resumo }) {
  const totais = resumo?.totais || {};
  const categorias = TIPOS_EXTRATO.filter(
    (tipo) => (resumo?.porCategoria?.[tipo]?.count || 0) > 0,
  );

  return (
    <View>
      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>A cobrar</Text>
          <Text style={styles.metricValue}>R$ {formatMoeda(totais.aCobrar)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pago</Text>
          <Text style={styles.metricValue}>R$ {formatMoeda(totais.pago)}</Text>
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
              <Text key={tipo} style={styles.tableCell}>
                {tipo}: R$ {formatMoeda(cat.total)} ({cat.count} lanç.)
              </Text>
            );
          })}
        </View>
      ) : null}

      {(resumo?.extratoSemana?.length || 0) > 0 ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 9 }]}>
            A cobrar do cliente
          </Text>
          {resumo.extratoSemana.map((item, idx) => (
            <Text key={item.id ?? idx} style={styles.tableCell}>
              · {item.descricao || item.tipo} — {formatData(item.data)} — R${" "}
              {formatMoeda(item.valor)} ({item.status})
            </Text>
          ))}
        </View>
      ) : null}

      {(resumo?.emEsperaSemana?.length || 0) > 0 ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 9 }]}>Em espera</Text>
          {resumo.emEsperaSemana.map((item, idx) => (
            <Text key={item.id ?? idx} style={styles.tableCell}>
              · {item.descricao || item.tipo} — {formatData(item.data)} — R${" "}
              {formatMoeda(item.valor)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ModalitySection({ titulo, children }) {
  return (
    <View style={styles.section} wrap={false}>
      <View style={styles.modalityHeader}>
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
            if (bloco.tipo === "obra") {
              return (
                <ModalitySection key={bloco.id} titulo="Obra">
                  <TopicosObraSection topicos={bloco.topicos} />
                </ModalitySection>
              );
            }

            if (bloco.tipo === "financeiro") {
              return (
                <ModalitySection key={bloco.id} titulo="Financeiro">
                  <FinanceiroResumoCompacto resumo={bloco.resumo} />
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
