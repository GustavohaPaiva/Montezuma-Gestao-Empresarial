import TabelaSimples from "../../../components/gerais/TabelaSimples";
import {
  formatarDataBR,
  formatarMoeda,
} from "../../obras/detalhe/utils/formatters";
import { TIPOS_EXTRATO } from "../relatorioFinanceiroUtils";
import {
  relatorioSecaoClass,
  relatorioSecaoCabecalhoClass,
  relatorioSecaoCorpoClass,
  relatorioSecaoTituloClass,
} from "../relatoriosDiretoriaUi";

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const cls =
    s === "pago"
      ? "bg-emerald-50 text-emerald-700"
      : s === "em espera"
        ? "bg-indigo-50 text-indigo-700"
        : "bg-amber-50 text-amber-800";

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

function ValorCell({ valor, id }) {
  return (
    <span key={`valor-${id}`} className="font-semibold tabular-nums">
      R$ {formatarMoeda(valor)}
    </span>
  );
}

function SubtotalBar({ label, valor, count }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-primary/20 bg-[#FAFAFA] px-4 py-2.5">
      <span className="text-xs font-medium text-text-muted">
        Subtotal {label} · {count} item(ns)
      </span>
      <span className="text-sm font-bold tabular-nums text-text-primary">
        R$ {formatarMoeda(valor)}
      </span>
    </div>
  );
}

function linhasMaterial(itens) {
  return itens.map((item) => [
    item.material || item.descricao,
    item.fornecedor || "—",
    item.quantidade != null ? String(item.quantidade) : "—",
    formatarDataBR(item.data),
    <ValorCell key={`v-${item.id}`} valor={item.valor} id={item.id} />,
    <StatusBadge key={`s-${item.id}`} status={item.status} />,
  ]);
}

function linhasMaoDeObra(itens) {
  return itens.map((item) => [
    item.servico || "—",
    item.profissional || "—",
    formatarDataBR(item.data),
    <ValorCell key={`o-${item.id}`} valor={item.valor_orcado} id={`o-${item.id}`} />,
    <ValorCell key={`p-${item.id}`} valor={item.valor_pago} id={`p-${item.id}`} />,
    <ValorCell key={`c-${item.id}`} valor={item.valor} id={`c-${item.id}`} />,
    <ValorCell key={`sl-${item.id}`} valor={item.saldo} id={`sl-${item.id}`} />,
    <StatusBadge key={`s-${item.id}`} status={item.status} />,
  ]);
}

function linhasLocacao(itens) {
  return itens.map((item) => [
    item.equipamento || item.descricao,
    formatarDataBR(item.data),
    item.data_vencimento ? formatarDataBR(item.data_vencimento) : "—",
    <ValorCell key={`v-${item.id}`} valor={item.valor} id={item.id} />,
    <StatusBadge key={`s-${item.id}`} status={item.status} />,
  ]);
}

const CONFIG_CATEGORIA = {
  Material: {
    colunas: ["Material", "Fornecedor", "Qtd.", "Data", "Valor", "Status"],
    linhas: linhasMaterial,
  },
  "Mão de Obra": {
    colunas: [
      "Serviço",
      "Profissional",
      "Data",
      "Orçado",
      "Pago",
      "A cobrar",
      "Saldo",
      "Status",
    ],
    linhas: linhasMaoDeObra,
  },
  Locação: {
    colunas: ["Equipamento", "Data", "Vencimento", "Valor", "Status"],
    linhas: linhasLocacao,
  },
  Outros: {
    colunas: ["Descrição", "Data", "Valor", "Status"],
    linhas: (itens) =>
      itens.map((item) => [
        item.descricao || "—",
        formatarDataBR(item.data),
        <ValorCell key={`v-${item.id}`} valor={item.valor} id={item.id} />,
        <StatusBadge key={`s-${item.id}`} status={item.status} />,
      ]),
  },
};

function agruparPorTipo(itens) {
  const mapa = new Map();
  (itens || []).forEach((item) => {
    const tipo = item.tipo || "Outros";
    if (!mapa.has(tipo)) mapa.set(tipo, []);
    mapa.get(tipo).push(item);
  });

  const ordenados = [];
  TIPOS_EXTRATO.forEach((tipo) => {
    if (mapa.has(tipo)) {
      ordenados.push({ tipo, itens: mapa.get(tipo) });
      mapa.delete(tipo);
    }
  });
  mapa.forEach((grupo, tipo) => {
    ordenados.push({ tipo, itens: grupo });
  });
  return ordenados;
}

function TabelaCategoria({ tipo, itens }) {
  const config = CONFIG_CATEGORIA[tipo] || CONFIG_CATEGORIA.Outros;
  if (!itens?.length) return null;

  const subtotal = itens.reduce((acc, i) => acc + (parseFloat(i.valor) || 0), 0);

  return (
    <div className="mb-5 last:mb-0">
      <h4 className="mb-2 text-sm font-semibold text-text-primary">{tipo}</h4>
      <TabelaSimples
        colunas={config.colunas}
        dados={config.linhas(itens)}
        variant="financeiro"
        dense
      />
      <SubtotalBar label={tipo} valor={subtotal} count={itens.length} />
    </div>
  );
}

function BlocoClassificacao({ titulo, subtitulo, itens, vazio }) {
  const porTipo = agruparPorTipo(itens);

  return (
    <div className={relatorioSecaoClass}>
      <div className={relatorioSecaoCabecalhoClass}>
        <h3 className={relatorioSecaoTituloClass}>{titulo}</h3>
        {subtitulo ? (
          <p className="mt-1 text-xs text-text-muted">{subtitulo}</p>
        ) : null}
      </div>
      <div className={relatorioSecaoCorpoClass}>
        {porTipo.length ? (
          porTipo.map(({ tipo, itens: grupo }) => (
            <TabelaCategoria key={tipo} tipo={tipo} itens={grupo} />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border-primary/40 bg-[#FAFAFA] px-4 py-6 text-center text-sm text-text-muted">
            {vazio}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RelatorioFinanceiroDetalhes({
  extratoSemana,
  emEsperaSemana,
}) {
  return (
    <section className="space-y-4">
      <BlocoClassificacao
        titulo="A cobrar do cliente"
        subtitulo="Itens consolidados no extrato financeiro desta semana"
        itens={extratoSemana}
        vazio="Nenhum item no extrato para esta semana."
      />
      <BlocoClassificacao
        titulo="Em espera"
        subtitulo="Lançamentos ainda não consolidados no extrato"
        itens={emEsperaSemana}
        vazio="Nenhum lançamento em espera nesta semana."
      />
    </section>
  );
}
