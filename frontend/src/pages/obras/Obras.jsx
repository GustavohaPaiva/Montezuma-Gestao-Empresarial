import { useEffect, useState } from "react";
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
    let isMounted = true;
    async function fetchData() {
      try {
        const dados = await api.getObras();
        if (isMounted) {
          setObras(dados || []);
        }
      } catch (err) {
        console.error("Erro ao carregar obras:", err);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [refresh]);

  const reloadObras = () => setRefresh((prev) => !prev);

  // --- LÓGICA DE VERIFICAÇÃO RAIO-X ---
  const verificarStatusPagamento = (obra) => {
    const extrato = obra.extrato || obra.relatorioExtrato || [];
    const mdo = obra.maoDeObra || [];
    const mat = obra.materiais || [];

    // 1. Obra nova, sem nenhum lançamento = Verde
    if (extrato.length === 0 && mdo.length === 0 && mat.length === 0)
      return true;

    // 2. Procura no EXTRATO (O Extrato é o chefe!)
    for (let e of extrato) {
      if ((e.status_financeiro || "").toLowerCase().trim() !== "pago") {
        console.log(
          `🟠 [${obra.local}] Laranja: Extrato pendente ->`,
          e.descricao,
        );
        return false; // Achou dívida, fica Laranja!
      }
    }

    // 3. Procura na MÃO DE OBRA
    for (let m of mdo) {
      const orcado = parseFloat(m.valor_orcado) || 0;
      const pago = parseFloat(m.valor_pago) || 0;

      // Se tem saldo a pagar...
      if (orcado - pago > 0.01) {
        // Verifica se já foi mandado pro extrato
        const taNoExtrato = extrato.some((e) => e.mao_de_obra_id === m.id);

        // Se NÃO está no extrato, significa que nem foi cobrado ainda = Laranja!
        // Se ESTÁ no extrato, a gente já conferiu no Passo 2 que tá pago.
        if (!taNoExtrato) {
          console.log(
            `🟠 [${obra.local}] Laranja: Mão de Obra pendente de envio pro extrato ->`,
            m.tipo,
          );
          return false;
        }
      }
    }

    // 4. Procura nos MATERIAIS
    for (let m of mat) {
      const valor = parseFloat(m.valor) || 0;
      if (valor > 0) {
        const taNoExtrato = extrato.some((e) => e.material_id === m.id);
        if (!taNoExtrato) {
          console.log(
            `🟠 [${obra.local}] Laranja: Material com valor não enviado pro extrato ->`,
            m.material,
          );
          return false;
        }
      }
    }

    // Se chegou até aqui, tá limpo!
    console.log(`🟢 [${obra.local}] TUDO PAGO!`);
    return true;
  };

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
      setObras((prevObras) =>
        prevObras.map((obra) =>
          obra.id === id ? { ...obra, ...dadosAtualizados } : obra,
        ),
      );
      await api.updateObra(id, dadosAtualizados);
    } catch (err) {
      console.error("Erro ao atualizar obra:", err);
      alert("Erro ao atualizar a obra.");
      reloadObras();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja remover esta obra?")) {
      try {
        setObras((prevObras) =>
          prevObras.map((obra) =>
            obra.id === id ? { ...obra, active: false } : obra,
          ),
        );
        await api.deleteObra(id);
      } catch (err) {
        console.error("Erro ao deletar:", err);
        alert("Erro ao remover obra.");
        reloadObras();
      }
    }
  };

  const ordenarObras = (lista) => {
    const pesos = {
      "Em andamento": 1,
      "Aguardando iniciação": 2,
      Concluída: 3,
    };
    return [...lista].sort(
      (a, b) => (pesos[a.status] || 99) - (pesos[b.status] || 99),
    );
  };

  const obrasFiltradas = obras.filter((obra) => {
    if (obra.active === false) return false;
    if (filtroStatus !== "Tudo" && obra.status !== filtroStatus) return false;
    const termo = busca.toLowerCase();
    return (
      (obra.cliente?.toLowerCase() || "").includes(termo) ||
      (obra.local?.toLowerCase() || "").includes(termo)
    );
  });

  const obrasVisiveis = ordenarObras(obrasFiltradas);

  return (
    <div className="flex flex-col min-h-screen w-full items-center bg-[#EEEDF0]">
      <Navbar
        searchTerm={busca}
        onSearchChange={setBusca}
        filterStatus={filtroStatus}
        onFilterChange={setFiltroStatus}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <main className="w-[90%] mt-[40px]">
        <div className="grid w-full md:grid-cols-[repeat(auto-fit,minmax(0,380px))] gap-y-[30px] justify-center md:justify-between">
          {obrasVisiveis.map((obra) => (
            <ObraCard
              key={obra.id}
              id={obra.id}
              nome={obra.local}
              client={obra.cliente}
              status={obra.status || "Aguardando iniciação"}
              tudoPago={verificarStatusPagamento(obra)}
              onUpdate={handleUpdateInline}
              onDelete={() => handleDelete(obra.id)}
            />
          ))}
          {obrasVisiveis.length === 0 && (
            <p className="col-span-full text-gray-400 mt-10 text-center">
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
