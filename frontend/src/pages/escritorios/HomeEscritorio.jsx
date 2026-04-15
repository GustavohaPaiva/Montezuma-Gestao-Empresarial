import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Droplets,
  FileSpreadsheet,
  Users,
  Wallet,
  ListTodo,
} from "lucide-react";
import { ESCRITORIO_NOME_POR_ID } from "../../constants/escritorios";
import { useAuth } from "../../contexts/AuthContext";

const ITENS = [
  {
    id: "orcamentos",
    titulo: "Orçamentos",
    descricao: "Projetos e orçamentos",
    path: "orcamentos",
    Icon: FileSpreadsheet,
  },
  {
    id: "clientes",
    titulo: "Clientes",
    descricao: "Base de clientes",
    path: "clientes",
    Icon: Users,
  },
  {
    id: "financeiro",
    titulo: "Financeiro",
    descricao: "Entradas e saídas",
    path: "financeiro",
    Icon: Wallet,
  },
  {
    id: "tarefas",
    titulo: "Tarefas",
    descricao: "Tarefas do escritório",
    path: "tarefas",
    Icon: ListTodo,
  },
];

function dataHojeExtenso() {
  const raw = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function HomeEscritorio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const nomeEscritorio =
    ESCRITORIO_NOME_POR_ID[user?.escritorio_id] ?? "Escritório";

  return (
    <div className="relative w-full max-w-full overflow-x-hidden">
      <div
        className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[min(400px,70vh)] w-[min(800px,100vw)] max-w-full -translate-x-1/2 bg-esc-destaque opacity-10 blur-[150px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full">
        {/* Topbar */}
        <div className="mb-8 flex w-full items-center justify-between"></div>

        {/* Welcome Banner */}
        <div className="relative mb-8 w-full overflow-hidden rounded-2xl border border-white/5 bg-esc-card/30 p-6 backdrop-blur-sm">
          <Droplets
            className="pointer-events-none absolute -bottom-6 -right-4 h-40 w-40 text-esc-destaque opacity-[0.05] sm:h-48 sm:w-48"
            strokeWidth={1}
            aria-hidden
          />
          <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="min-w-0">
              <h1 className="text-3xl sm:flex-row flex-col font-bold tracking-tight text-esc-text flex gap-2">
                Bem-Vindo ao{" "}
                <p className="text-esc-destaque">{nomeEscritorio}</p>
              </h1>
              <p className="mt-2 text-base text-esc-muted">
                {dataHojeExtenso()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap justify-center gap-6 md:gap-8">
          {ITENS.map((item) => {
            const { Icon } = item;
            return (
              <div
                key={item.id}
                className="group w-full min-w-0 sm:w-[calc(50%-12px)] md:w-[calc(48%-12px)] lg:w-[calc(33.333%-22px)]"
              >
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="relative w-full h-[180px] flex flex-col items-center justify-center overflow-hidden rounded-[10px] border border-white/5 bg-esc-card/40 px-4 py-5 text-center shadow-inner backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-esc-destaque/50 hover:shadow-[0_0_30px_-10px_var(--color-esc-destaque)]"
                >
                  <span className="mb-3 inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3 text-esc-muted transition-colors duration-300 group-hover:border-esc-destaque/30 group-hover:bg-esc-destaque/20 group-hover:text-esc-destaque">
                    <Icon className="h-8 w-8 stroke-[1.75]" aria-hidden />
                  </span>
                  <span className="text-[22px] font-semibold leading-tight text-esc-text transition-colors duration-300 group-hover:text-white md:text-[20px]">
                    {item.titulo}
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm text-esc-muted">
                    {item.descricao}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
