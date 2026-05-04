import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Edit,
  Hammer,
  Hourglass,
  LayoutGrid,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../components/navbar/Navbar";
import BaseCard from "../../components/cards/BaseCard";
import BaseButton from "../../components/gerais/BaseButton";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import BaseModal from "../../components/gerais/BaseModal";
import ModalNovaObra from "../../components/modals/ModalNovaObra";
import { api } from "../../services/api";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import { verificarStatusPagamento } from "./utils/obraPagamento";
import { useObrasList } from "./hooks/useObrasList";
import { obrasDictionary } from "../../constants/dictionaries";

function nomeResponsavelObra(obra, diretoriaUsuarios = []) {
  if (obra?.responsavel_id && Array.isArray(diretoriaUsuarios)) {
    const encontrado = diretoriaUsuarios.find(
      (usuario) => String(usuario?.id) === String(obra.responsavel_id),
    );
    if (encontrado?.nome) return String(encontrado.nome).trim();
  }

  const nomesPossiveis = [
    obra?.responsavel?.nome,
    obra?.usuarios?.nome,
    obra?.responsavel_nome,
    obra?.usuario_responsavel?.nome,
    obra?.usuarios_responsavel?.nome,
    obra?.responsaveis?.[0]?.nome,
  ];
  const nome = nomesPossiveis.find(
    (value) => value != null && String(value).trim() !== "",
  );
  return nome ? String(nome).trim() : "Nao definido";
}

function formatarDataInicio(dataValue) {
  if (!dataValue) return "Nao informado";
  const data = new Date(dataValue);
  if (Number.isNaN(data.getTime())) return String(dataValue);
  return data.toISOString().slice(0, 10);
}

function getFinanceiroInfo(obra) {
  if (obra?.isTudoPago) return { status: "Pago", isPago: true };
  return { status: "Pendente", isPago: false };
}

function getAlertaMateriaisProximosVencimento(obra, diasLimite = 7) {
  const materiais = Array.isArray(obra?.materiais) ? obra.materiais : [];
  if (!materiais.length) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + diasLimite);

  const proximos = materiais.filter((material) => {
    if (!material?.data_vencimento) return false;
    const dataVencimento = new Date(material.data_vencimento);
    if (Number.isNaN(dataVencimento.getTime())) return false;
    dataVencimento.setHours(0, 0, 0, 0);
    return dataVencimento >= hoje && dataVencimento <= limite;
  });

  if (!proximos.length) return null;

  const menorData = proximos
    .map((material) => new Date(material.data_vencimento))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const diasRestantes = Math.max(
    0,
    Math.ceil((menorData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return { total: proximos.length, diasRestantes };
}

export default function Obras() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [obraParaEditar, setObraParaEditar] = useState(null);
  const [obraParaExcluir, setObraParaExcluir] = useState(null);
  const [diretoriaUsuarios, setDiretoriaUsuarios] = useState([]);
  const { obras, carregando, showElements, reloadObras } = useObrasList();
  const isEncarregado = user?.tipo === "encarregado";

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain] = useScrollFadeIn();

  useEffect(() => {
    let cancelled = false;

    const carregarDiretoria = async () => {
      try {
        const lista = await api.listUsuariosDiretoria();
        if (!cancelled) {
          setDiretoriaUsuarios(Array.isArray(lista) ? lista : []);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setDiretoriaUsuarios([]);
      }
    };

    carregarDiretoria();
    return () => {
      cancelled = true;
    };
  }, []);

  const metricas = useMemo(() => {
    const ativas = obras.filter((o) => o.active !== false);
    const emAndamento = ativas.filter(
      (o) => o.status === "Em andamento",
    ).length;
    const aguardando = ativas.filter(
      (o) => o.status === "Aguardando iniciação",
    ).length;
    const concluidas = ativas.filter((o) => o.status === "Concluída").length;

    return {
      total: ativas.length,
      emAndamento,
      aguardando,
      concluidas,
    };
  }, [obras]);

  const obrasVisiveis = useMemo(() => {
    const termo = busca.toLowerCase();

    const filtradas = obras.filter((obra) => {
      if (obra.active === false) return false;
      if (filtroStatus !== "Tudo" && obra.status !== filtroStatus) return false;

      return (
        (obra.cliente?.toLowerCase() || "").includes(termo) ||
        (obra.local?.toLowerCase() || "").includes(termo)
      );
    });

    const pesos = {
      "Em andamento": 1,
      "Aguardando iniciação": 2,
      Concluída: 3,
    };

    return filtradas
      .map((obra) => ({
        ...obra,
        isTudoPago: verificarStatusPagamento(obra),
        alertaVencimentoMateriais: getAlertaMateriaisProximosVencimento(obra),
      }))
      .sort((a, b) => {
        const porStatus = (pesos[a.status] || 99) - (pesos[b.status] || 99);
        if (porStatus !== 0) return porStatus;

        if (isEncarregado) return 0;

        const pesoFinanceiroA = getFinanceiroInfo(a).isPago ? 1 : 0;
        const pesoFinanceiroB = getFinanceiroInfo(b).isPago ? 1 : 0;
        return pesoFinanceiroA - pesoFinanceiroB;
      });
  }, [obras, busca, filtroStatus, isEncarregado]);

  const handleDelete = async () => {
    if (!obraParaExcluir?.id) return;
    try {
      await api.deleteObra(obraParaExcluir.id);
      setObraParaExcluir(null);
      await reloadObras();
    } catch (err) {
      console.error(err);
      await reloadObras();
    }
  };

  const handleOpenCreateModal = () => {
    setObraParaEditar(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (obra) => {
    setObraParaEditar(obra);
    setIsModalOpen(true);
  };

  const statusTheme = (status) => {
    if (status === "Concluída") return "emerald";
    if (status === "Em andamento") return "amber";
    if (status === "Aguardando iniciação") return "purple";
    return "blue";
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-bg-primary">
      <div
        ref={refNav}
        className={`w-full transition-all duration-500 ease-out transform ${
          isNavVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <Navbar
          title="Obras"
          subtitle="Gestao centralizada do portifolio de obras"
          user={user}
          onLogoClick={() => navigate("/")}
          filters={[
            <BaseInput
              key="filtro-busca"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar obra ou cliente..."
            />,
            <BaseSelect
              key="filtro-status"
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value)}
              options={[
                { value: "Tudo", label: "Todas as Obras" },
                { value: "Em andamento", label: "Em andamento" },
                {
                  value: "Aguardando iniciação",
                  label: "Aguardando iniciação",
                },
                { value: "Concluída", label: "Concluídas" },
              ]}
            />,
          ]}
          actions={
            isEncarregado
              ? []
              : [
                  {
                    key: "nova-obra",
                    label: "Nova Obra",
                    onClick: handleOpenCreateModal,
                    className:
                      "bg-accent-primary text-white hover:opacity-90 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 h-10 px-4",
                  },
                ]
          }
        />
      </div>

      <main ref={refMain} className="w-[90%] pb-10">
        {!carregando && !isEncarregado && (
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 w-full transition-all duration-700 ease-out transform ${
              showElements
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <BaseCard
              variant="metric"
              title={obrasDictionary.metrics.total}
              value={metricas.total}
              colorTheme="blue"
              icon={<LayoutGrid className="h-5 w-5" />}
            />
            <BaseCard
              variant="metric"
              title={obrasDictionary.metrics.waiting}
              value={metricas.aguardando}
              colorTheme="purple"
              icon={<Hourglass className="h-5 w-5" />}
            />
            <BaseCard
              variant="metric"
              title={obrasDictionary.metrics.progress}
              value={metricas.emAndamento}
              colorTheme="amber"
              icon={<Hammer className="h-5 w-5" />}
            />
            <BaseCard
              variant="metric"
              title={obrasDictionary.metrics.done}
              value={metricas.concluidas}
              colorTheme="emerald"
              icon={<LayoutGrid className="h-5 w-5" />}
            />
          </div>
        )}

        {carregando ? (
          <div className="flex justify-center items-center py-20">
            <Hourglass className="w-8 h-8 animate-spin text-accent-primary" />
          </div>
        ) : (
          <div className="grid w-full gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 place-items-center">
            {obrasVisiveis.map((obra, index) => (
              <div
                key={obra.id}
                className={`transition-all duration-700 ease-out transform w-full flex justify-center ${
                  showElements
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <BaseCard
                  variant="entity"
                  title={obra.clientes?.nome || obra.cliente}
                  value={obra.local}
                  status={obra.status || "Aguardando iniciação"}
                  metadata={[
                    ...(!isEncarregado
                      ? [
                          {
                            icon: (
                              <CircleDollarSign
                                className={`h-4 w-4 ${
                                  getFinanceiroInfo(obra).isPago
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                }`}
                              />
                            ),
                            label: (
                              <span
                                className={
                                  getFinanceiroInfo(obra).isPago
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                }
                              >
                                {getFinanceiroInfo(obra).status}
                              </span>
                            ),
                          },
                        ]
                      : []),
                    {
                      icon: <CalendarDays className="h-4 w-4 text-slate-500" />,
                      label: `Inicio: ${formatarDataInicio(obra.data)}`,
                    },
                    {
                      icon: <User className="h-4 w-4 text-slate-500" />,
                      label: `Resp: ${nomeResponsavelObra(
                        obra,
                        diretoriaUsuarios,
                      )}`,
                    },
                    ...(obra.alertaVencimentoMateriais
                      ? [
                          {
                            icon: (
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            ),
                            label: `${obra.alertaVencimentoMateriais.total} venc. em ${obra.alertaVencimentoMateriais.diasRestantes}d`,
                            textClass: "text-amber-700",
                          },
                        ]
                      : [
                          {
                            icon: (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ),
                            label: "Sem item pendente",
                            textClass: "text-emerald-700",
                          },
                        ]),
                  ]}
                  colorTheme={statusTheme(obra.status)}
                  onClick={() => navigate(`/obrasD/${obra.id}`)}
                >
                  {!isEncarregado ? (
                    <div
                      className="mt-auto flex w-full gap-2 border-t border-slate-100 pt-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        icon={<Edit className="h-4 w-4" />}
                        onClick={() => handleOpenEditModal(obra)}
                        className="flex-1"
                      >
                        Editar
                      </BaseButton>
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => setObraParaExcluir(obra)}
                        className="flex-1"
                      >
                        Excluir
                      </BaseButton>
                    </div>
                  ) : null}
                </BaseCard>
              </div>
            ))}
            {obrasVisiveis.length === 0 && (
              <p className="w-full mt-10 text-center text-gray-500 col-span-full">
                {obrasDictionary.empty}
              </p>
            )}
          </div>
        )}
      </main>

      {!isEncarregado ? (
        <>
          <ModalNovaObra
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSaved={reloadObras}
            obraParaEditar={obraParaEditar}
          />

          <BaseModal
            isOpen={Boolean(obraParaExcluir)}
            onClose={() => setObraParaExcluir(null)}
            title="Confirmar Exclusão"
            size="sm"
          >
            <p className="text-sm text-text-muted">
              Tem certeza que deseja excluir a obra{" "}
              <span className="font-semibold text-text-primary">
                {obraParaExcluir?.local}
              </span>
              ?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <BaseButton
                variant="ghost"
                onClick={() => setObraParaExcluir(null)}
              >
                Cancelar
              </BaseButton>
              <BaseButton variant="danger" onClick={handleDelete}>
                Confirmar Exclusão
              </BaseButton>
            </div>
          </BaseModal>
        </>
      ) : null}
    </div>
  );
}
