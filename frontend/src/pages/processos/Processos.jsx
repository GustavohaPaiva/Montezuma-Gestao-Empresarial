import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/navbar/NavbarProcessos"; // Importando a sua Navbar
import ModalCliente from "../../components/modals/ModalClientes";
import CardProcessos from "../../components/cards/CardProcessos";
import { api } from "../../services/api";

export default function Processos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processos, setProcessos] = useState([]);

  // Estados que serão passados para a Navbar
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");

  const carregarProcessos = useCallback(async () => {
    try {
      const data = await api.getClientes();

      const filtrados = data.filter((c) => {
        const idEscritorio = c.escritorio_id
          ? c.escritorio_id.toLowerCase()
          : "";
        return idEscritorio === "vk" || idEscritorio === "yb";
      });

      setProcessos(filtrados);
    } catch (error) {
      console.error("Erro ao carregar processos:", error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarProcessos();
  }, [carregarProcessos]);

  const handleCreateClient = async (formData) => {
    try {
      await api.createCliente({
        nome: formData.cliente,
        tipo: formData.tipo,
        escritorio_id: formData.escritorio_id || "vk",
        status: "Produção",
      });
      setIsModalOpen(false);
      carregarProcessos();
    } catch (err) {
      console.error("Erro ao criar obra:", err);
      alert("Erro ao criar obra.");
    }
  };

  const handleUpdateProcesso = async (id, dadosAtualizados) => {
    try {
      await api.updateCliente(id, dadosAtualizados);
      carregarProcessos();
    } catch (error) {
      console.error("Erro ao atualizar processo:", error);
    }
  };

  const handleDeleteProcesso = async (id) => {
    try {
      await api.deleteCliente(id);
      carregarProcessos();
    } catch (error) {
      console.error("Erro ao deletar processo:", error);
    }
  };

  // Processamento e filtragem dos dados
  const processosProcessados = useMemo(() => {
    let lista = [...processos];

    // NOVO: Exclui da listagem processos que estão no status "Produção"
    lista = lista.filter((p) => p.status !== "Produção");

    // Filtro por Nome ou Tipo
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome?.toLowerCase().includes(termo) ||
          p.tipo?.toLowerCase().includes(termo),
      );
    }

    // Filtro por Status
    if (filtroStatus !== "Tudo") {
      lista = lista.filter((p) => p.status === filtroStatus);
    }

    // Ordenação (Mesma lógica da tela de clientes, ignorando Produção)
    const pesosStatus = {
      Prefeitura: 1,
      Caixa: 2,
      Obra: 3,
      Finalizado: 4,
    };

    lista.sort((a, b) => {
      const pesoA = pesosStatus[a.status] || 99;
      const pesoB = pesosStatus[b.status] || 99;

      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }

      // Desempate pela data (mais recentes primeiro)
      const dataA = new Date(a.data || a.created_at).getTime();
      const dataB = new Date(b.data || b.created_at).getTime();
      return dataB - dataA;
    });

    return lista;
  }, [processos, busca, filtroStatus]);

  return (
    <div className="flex flex-col min-h-screen w-full items-center bg-[#EEEDF0] pb-10">
      {/* Passando as props para a sua Navbar controlar os estados */}
      <Navbar
        searchTerm={busca}
        onSearchChange={setBusca}
        filterStatus={filtroStatus}
        onFilterChange={setFiltroStatus}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <main className="w-[90%] mt-[40px] flex flex-col gap-6">
        {processosProcessados.length > 0 ? (
          <div className="grid w-full md:grid-cols-[repeat(auto-fit,minmax(0,380px))] gap-[30px] justify-center md:justify-between">
            {processosProcessados.map((item) => (
              <CardProcessos
                key={item.id}
                id={item.id}
                client={item.nome}
                tipo={item.tipo}
                status={item.status}
                onUpdate={handleUpdateProcesso}
                onDelete={() => handleDeleteProcesso(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center w-full h-[200px] text-gray-500 font-medium">
            Nenhum processo encontrado com esses filtros.
          </div>
        )}
      </main>

      <ModalCliente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateClient}
        obra={null}
      />
    </div>
  );
}
