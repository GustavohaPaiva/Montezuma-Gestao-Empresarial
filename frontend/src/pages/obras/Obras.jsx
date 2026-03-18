import { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/navbar/NavbarObras";
import ObraCard from "../../components/cards/CardObra";
import ModalNovaObra from "../../components/modals/ModalNovaObra";
import { api } from "../../services/api";

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const dados = await api.getObras({ signal: controller.signal });
        setObras(dados || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Erro ao carregar obras:", err);
        }
      }
    }

    fetchData();
    return () => controller.abort();
  }, [refresh]);

  const reloadObras = () => setRefresh((prev) => !prev);

  // Função isolada apenas para lógica (sem gargalos no JSX)
  const verificarStatusPagamento = (obra) => {
    const extrato = obra.extrato || obra.relatorioExtrato || [];
    const mdo = obra.maoDeObra || [];
    const mat = obra.materiais || [];

    if (extrato.length === 0 && mdo.length === 0 && mat.length === 0)
      return true;

    for (let e of extrato) {
      if ((e.status_financeiro || "").toLowerCase().trim() !== "pago")
        return false;
    }

    for (let m of mdo) {
      const orcado = parseFloat(m.valor_orcado) || 0;
      const pago = parseFloat(m.valor_pago) || 0;
      if (
        orcado - pago > 0.01 &&
        !extrato.some((e) => e.mao_de_obra_id === m.id)
      ) {
        return false;
      }
    }

    for (let m of mat) {
      if (
        (parseFloat(m.valor) || 0) > 0 &&
        !extrato.some((e) => e.material_id === m.id)
      ) {
        return false;
      }
    }

    return true;
  };

  // PERFORMANCE: useMemo evita que a lista seja filtrada, ordenada e calculada
  // (status de pagamento) a cada renderização boba (como abrir um modal).
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
        // Calculamos aqui e gravamos no objeto, sem rodar no JSX
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
      console.error("Erro ao criar obra:", err);
      alert("Erro ao criar obra.");
    }
  };

  const handleUpdateInline = async (id, dadosAtualizados) => {
    try {
      await api.updateObra(id, dadosAtualizados);
      // Atualiza o state local DEPOIS da API confirmar, evitando dados dessincronizados na tela
      setObras((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...dadosAtualizados } : o)),
      );
    } catch (err) {
      console.error("Erro ao atualizar obra:", err);
      alert("Erro ao atualizar a obra.");
      reloadObras();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja remover esta obra?")) {
      try {
        await api.deleteObra(id);
        setObras((prev) =>
          prev.map((o) => (o.id === id ? { ...o, active: false } : o)),
        );
      } catch (err) {
        console.error("Erro ao deletar:", err);
        alert("Erro ao remover obra.");
        reloadObras();
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[#EEEDF0]">
      <Navbar
        searchTerm={busca}
        onSearchChange={setBusca}
        filterStatus={filtroStatus}
        onFilterChange={setFiltroStatus}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <main className="w-[90%] mt-10">
        <div className="grid w-full gap-8 md:grid-cols-[repeat(auto-fit,minmax(0,380px))] justify-center md:justify-between">
          {obrasVisiveis.map((obra) => (
            <ObraCard
              key={obra.id}
              id={obra.id}
              nome={obra.local}
              client={obra.clientes?.nome || obra.cliente}
              status={obra.status || "Aguardando iniciação"}
              tudoPago={obra.isTudoPago}
              onUpdate={handleUpdateInline}
              onDelete={() => handleDelete(obra.id)}
            />
          ))}
          {obrasVisiveis.length === 0 && (
            <p className="w-full mt-10 text-center text-gray-500 col-span-full">
              Nenhuma obra encontrada.
            </p>
          )}
        </div>
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
