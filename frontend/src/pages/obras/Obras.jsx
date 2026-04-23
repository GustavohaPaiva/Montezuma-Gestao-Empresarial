import { useMemo, useState } from "react";
import Navbar from "../../components/navbar/NavbarObras";
import ObraCard from "../../components/cards/CardObra";
import ModalNovaObra from "../../components/modals/ModalNovaObra";
import { api } from "../../services/api";
import { Hourglass } from "lucide-react";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import { verificarStatusPagamento } from "./utils/obraPagamento";
import { useObrasList } from "./hooks/useObrasList";
import { obrasDictionary } from "../../constants/dictionaries";

export default function Obras() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { obras, setObras, carregando, showElements, reloadObras } =
    useObrasList();

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain] = useScrollFadeIn();

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
      .sort((a, b) => (pesos[a.status] || 99) - (pesos[b.status] || 99))
      .map((obra) => ({
        ...obra,
        isTudoPago: verificarStatusPagamento(obra),
      }));
  }, [obras, busca, filtroStatus]);

  const handleCreateObra = async (formData) => {
    try {
      await api.createObra({
        cliente: formData.cliente,
        local: formData.nomeObra,
      });
      reloadObras();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(obrasDictionary.errors.create);
    }
  };

  const handleUpdateInline = async (id, dadosAtualizados) => {
    try {
      await api.updateObra(id, dadosAtualizados);
      setObras((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...dadosAtualizados } : o)),
      );
    } catch (err) {
      console.error(err);
      alert(obrasDictionary.errors.update);
      reloadObras();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(obrasDictionary.confirm.remove)) {
      try {
        await api.deleteObra(id);
        setObras((prev) =>
          prev.map((o) => (o.id === id ? { ...o, active: false } : o)),
        );
      } catch (err) {
        console.error(err);
        alert(obrasDictionary.errors.remove);
        reloadObras();
      }
    }
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
          searchTerm={busca}
          onSearchChange={setBusca}
          filterStatus={filtroStatus}
          onFilterChange={setFiltroStatus}
          onOpenModal={() => setIsModalOpen(true)}
        />
      </div>

      <main ref={refMain} className="w-[90%] mt-4 pb-10 sm:mt-6">
        {!carregando && (
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 w-full transition-all duration-700 ease-out transform ${
              showElements
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="bg-surface p-6 rounded-xl border border-border-primary shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[12px] font-bold text-text-muted uppercase tracking-wider">
                {obrasDictionary.metrics.total}
              </span>
              <span className="text-4xl font-bold text-text-primary mt-2">
                {metricas.total}
              </span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                {obrasDictionary.metrics.waiting}
              </span>
              <span className="text-4xl font-bold text-gray-700 mt-2">
                {metricas.aguardando}
              </span>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[12px] font-bold text-orange-800 uppercase tracking-wider">
                {obrasDictionary.metrics.progress}
              </span>
              <span className="text-4xl font-bold text-orange-600 mt-2">
                {metricas.emAndamento}
              </span>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[12px] font-bold text-green-800 uppercase tracking-wider">
                {obrasDictionary.metrics.done}
              </span>
              <span className="text-4xl font-bold text-green-600 mt-2">
                {metricas.concluidas}
              </span>
            </div>
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
                <ObraCard
                  id={obra.id}
                  nome={obra.local}
                  client={obra.clientes?.nome || obra.cliente}
                  data={obra.data}
                  status={obra.status || "Aguardando iniciação"}
                  tudoPago={obra.isTudoPago}
                  onUpdate={handleUpdateInline}
                  onDelete={() => handleDelete(obra.id)}
                />
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

      <ModalNovaObra
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateObra}
        obra={null}
      />
    </div>
  );
}
