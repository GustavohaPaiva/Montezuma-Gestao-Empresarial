import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import Navbar from "../../components/navbar/Navbar";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import BaseButton from "../../components/gerais/BaseButton";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { OS_STATUS } from "../../constants/ordemServico";
import {
  filtrarOrdensServicoVisiveis,
  podeAcessarModuloOrdemServico,
  podeEmitirOrdemServico,
  podeVerTodasOrdensServico,
} from "../../utils/ordemServicoPermissions";
import OrdemServicoCard from "./OrdemServicoCard";
import {
  getOrdensServicoBasePath,
  resolveEscritorioIdOrdemServico,
} from "./ordensServicoUtils";

const ABAS = [
  { id: "pendentes", label: "Pendentes" },
  { id: "concluidas", label: "Concluídas" },
  { id: "todas", label: "Todas" },
];

export default function OrdensServicoLista({ variant = "montezuma" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVk = variant === "vogelkop";
  const escritorioId = resolveEscritorioIdOrdemServico(variant, user?.escritorio_id);
  const basePath = getOrdensServicoBasePath(variant);

  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState("pendentes");

  const autorizado = podeAcessarModuloOrdemServico(user);
  const podeCriar = podeEmitirOrdemServico(user);
  const veTodas = podeVerTodasOrdensServico(user);

  const abasVisiveis = useMemo(
    () => (veTodas ? ABAS : ABAS.filter((a) => a.id !== "todas")),
    [veTodas],
  );

  const carregar = useCallback(async () => {
    if (!autorizado) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await api.listOrdensServico({
        escritorioId: veTodas ? null : escritorioId,
      });
      const visiveis = filtrarOrdensServicoVisiveis(user, rows);
      setOrdens(visiveis);
      setErro(null);
    } catch (e) {
      console.error("[OrdensServicoLista]", e);
      setErro(e?.message || "Não foi possível carregar as ordens de serviço.");
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  }, [autorizado, escritorioId, user, veTodas]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!autorizado && user) {
      navigate(isVk ? "/escritorio/vogelkop" : "/", { replace: true });
    }
  }, [autorizado, user, navigate, isVk]);

  const ordensFiltradas = useMemo(() => {
    let lista = ordens;
    if (aba === "pendentes") {
      lista = lista.filter((o) => o.status === OS_STATUS.pendente);
    } else if (aba === "concluidas") {
      lista = lista.filter((o) => o.status === OS_STATUS.concluida);
    }
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((o) => {
      const texto = [
        o.numero,
        o.cliente_nome,
        o.responsavel?.nome,
        o.responsavel_tecnico,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [ordens, aba, busca]);

  if (!autorizado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        A redirecionar…
      </div>
    );
  }

  const conteudoVk = (
    <div className="relative w-full max-w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-esc-text">
            Ordens de Serviço
          </h1>
          <p className="mt-1 text-sm text-esc-muted">
            Solicitações internas e documentos para clientes
          </p>
        </div>
        {podeCriar ? (
          <BaseButton
            type="button"
            onClick={() => navigate(`${basePath}/nova`)}
            className="!bg-esc-destaque !text-white"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Nova OS
          </BaseButton>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {abasVisiveis.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAba(item.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              aba === item.id
                ? "border-esc-destaque/50 bg-esc-destaque/15 text-esc-destaque"
                : "border-white/10 bg-white/5 text-esc-muted hover:text-esc-text"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <BaseInput
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nº, cliente ou responsável…"
        className="mb-4"
      />

      {erro ? (
        <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-300">
          {erro}
        </p>
      ) : null}

      {loading ? (
        <LoadingPainel
          titulo="Carregando ordens de serviço"
          descricao="Buscando solicitações do escritório."
          icon={<ClipboardList className="h-7 w-7" strokeWidth={2} />}
        />
      ) : ordensFiltradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-esc-muted">
          Nenhuma ordem de serviço encontrada.
        </p>
      ) : (
        <div className="grid gap-3">
          {ordensFiltradas.map((os) => (
            <OrdemServicoCard
              key={os.id}
              os={os}
              variant={variant}
              onClick={() => navigate(`${basePath}/${os.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (isVk) return conteudoVk;

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
      <Navbar
        title="Ordens de Serviço"
        filters={[
          <BaseInput
            key="busca-os"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nº, cliente ou responsável…"
          />,
          <BaseSelect
            key="aba-os"
            searchable={false}
            value={aba}
            onChange={(e) => setAba(e.target.value)}
            options={abasVisiveis.map((a) => ({
              value: a.id,
              label: a.label,
            }))}
          />,
        ]}
        actions={
          podeCriar ? (
            <BaseButton
              type="button"
              onClick={() => navigate(`${basePath}/nova`)}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Nova OS
            </BaseButton>
          ) : null
        }
      />
      <main className="w-full px-[5%] pb-12 pt-2">
        {erro ? (
          <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
            {erro}
          </p>
        ) : null}
        {loading ? (
          <LoadingPainel
            titulo="Carregando ordens de serviço"
            descricao="Buscando solicitações."
            icon={<ClipboardList className="h-7 w-7" strokeWidth={2} />}
          />
        ) : ordensFiltradas.length === 0 ? (
          <p className="text-sm text-text-muted">
            Nenhuma ordem de serviço encontrada.
          </p>
        ) : (
          <div className="grid gap-3">
            {ordensFiltradas.map((os) => (
              <OrdemServicoCard
                key={os.id}
                os={os}
                variant={variant}
                onClick={() => navigate(`${basePath}/${os.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
