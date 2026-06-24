import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarMoeda } from "../../obras/detalhe/utils/formatters";
import {
  relatorioSecaoClass,
  relatorioSecaoCabecalhoClass,
  relatorioSecaoCorpoClass,
  relatorioSecaoTituloClass,
} from "../relatoriosDiretoriaUi";

function GraficoVazio({ mensagem }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm italic text-text-muted">
      {mensagem}
    </div>
  );
}

export default function RelatorioFinanceiroGraficos({ graficos }) {
  const { pizza = [], barras = [] } = graficos || {};
  const temPizza = pizza.length > 0;
  const temBarras = barras.length > 0;

  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-2">
      <div className={relatorioSecaoClass}>
        <div className={relatorioSecaoCabecalhoClass}>
          <h3 className={relatorioSecaoTituloClass}>
            Distribuição por categoria
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            Valores do extrato da semana
          </p>
        </div>
        <div className={relatorioSecaoCorpoClass}>
          {temPizza ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pizza}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                >
                  {pizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${formatarMoeda(value)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <GraficoVazio mensagem="Sem lançamentos no extrato desta semana." />
          )}
          {temPizza ? (
            <div className="mt-3 space-y-1.5">
              {pizza.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-text-primary">{item.name}</span>
                  </div>
                  <span className="font-semibold tabular-nums text-text-primary">
                    R$ {formatarMoeda(item.value)} ({item.percentual}%)
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className={relatorioSecaoClass}>
        <div className={relatorioSecaoCabecalhoClass}>
          <h3 className={relatorioSecaoTituloClass}>Pago vs pendente</h3>
          <p className="mt-1 text-xs text-text-muted">
            Por categoria no extrato da semana
          </p>
        </div>
        <div className={relatorioSecaoCorpoClass}>
          {temBarras ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barras} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `R$ ${formatarMoeda(value)}`} />
                <Bar dataKey="pago" name="Pago" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="aguardando"
                  name="Aguardando"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <GraficoVazio mensagem="Sem dados de pagamento nesta semana." />
          )}
        </div>
      </div>
    </section>
  );
}
