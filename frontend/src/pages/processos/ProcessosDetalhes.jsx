import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import { api } from "../../services/api";
import ModalInformacaoCliente from "../../components/modals/ModalInformacaoCliente";

export default function ProcessosDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [processo, setProcesso] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [valorEdicao, setValorEdicao] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const data = await api.getClienteById(id);
        setProcesso(data);
      } catch (error) {
        console.error("Erro ao carregar detalhes do processo:", error);
      }
    }

    if (id) {
      carregarDados();
    }
  }, [id]);

  const formatarData = (dataString) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const iniciarEdicao = (campo, valorAtual, tipoInput) => {
    setEditando(campo);
    if (tipoInput === "date" && valorAtual) {
      setValorEdicao(valorAtual.split("T")[0]);
    } else {
      setValorEdicao(valorAtual || "");
    }
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setValorEdicao("");
  };

  const salvarEdicao = async (campo, tipoInput) => {
    let novoValor = valorEdicao;

    if (tipoInput === "number") {
      novoValor = novoValor ? Number(novoValor) : null;
    } else if (tipoInput === "date") {
      novoValor = novoValor ? new Date(novoValor).toISOString() : null;
    }

    setProcesso((prev) => ({ ...prev, [campo]: novoValor }));
    setEditando(null);

    try {
      await api.updateCliente(id, { [campo]: novoValor });
    } catch (err) {
      console.error(`Erro ao atualizar ${campo}:`, err);
      const data = await api.getClienteById(id);
      setProcesso(data);
    }
  };

  const handleStatusChange = async (campo, novoStatus) => {
    setProcesso((prev) => ({ ...prev, [campo]: novoStatus }));
    try {
      await api.updateCliente(id, { [campo]: novoStatus });
    } catch (err) {
      console.error(`Erro ao atualizar ${campo}:`, err);
      const data = await api.getClienteById(id);
      setProcesso(data);
    }
  };

  if (!processo) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#EEEDF0] font-bold text-[#464C54]">
        Carregando...
      </div>
    );
  }

  const renderCelulaEditavel = (campo, tipoInput, valorAtual) => {
    const isEditing = editando === campo;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 justify-center" key={campo}>
          <input
            type={tipoInput}
            value={valorEdicao}
            onChange={(e) => setValorEdicao(e.target.value)}
            className={`p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-center ${
              tipoInput === "text" ? "w-[150px]" : "w-[130px]"
            }`}
            autoFocus
          />
          <button
            onClick={() => salvarEdicao(campo, tipoInput)}
            className="cursor-pointer border-none bg-transparent flex-shrink-0"
          >
            <img
              width="18"
              src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
              alt="salvar"
            />
          </button>
          <button
            onClick={cancelarEdicao}
            className="cursor-pointer border-none bg-transparent flex-shrink-0"
          >
            <img
              width="18"
              src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
              alt="cancelar"
            />
          </button>
        </div>
      );
    }

    let exibicao = valorAtual || "-";
    if (tipoInput === "date" && valorAtual) exibicao = formatarData(valorAtual);

    return (
      <div
        className="flex items-center justify-center gap-2 group cursor-pointer"
        onClick={() => iniciarEdicao(campo, valorAtual, tipoInput)}
        key={campo}
      >
        <span className="font-semibold text-[#464C54]">{exibicao}</span>
        <img
          width="15"
          src="https://img.icons8.com/ios/50/edit--v1.png"
          alt="edit"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    );
  };

  const getCorStatus = (status) => {
    switch (status) {
      case "Prefeitura":
        return "bg-[#E3F2FD] text-[#1565C0]";
      case "Codau":
        return "bg-[#E0F7FA] text-[#006064]";
      case "Paralizado":
        return "bg-[#FFEBEE] text-[#C62828]";
      case "Engenharia":
        return "bg-[#FFF3E0] text-[#E65100]";
      case "Assinatura":
        return "bg-[#E8F5E9] text-[#2E7D32]";
      case "Conformidade":
        return "bg-[#F3E5F5] text-[#7B1FA2]";
      case "ITBI":
        return "bg-[#FFFDE7] text-[#F57F17]";
      case "Cartório":
        return "bg-[#EFEBE9] text-[#4E342E]";
      case "Acompanhamento":
        return "bg-[#E3F2FD] text-[#1565C0]";
      case "Gestão":
        return "bg-[#F3E5F5] text-[#7B1FA2]";
      case "Finalizado":
        return "bg-[#E8F5E9] text-[#2E7D32]";
      case "Futuros":
        return "bg-[#ECEFF1] text-[#455A64]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const dadosPrefeitura = [
    [
      <span key="tipo-pmu" className="uppercase font-bold text-[#464C54]">
        {processo.tipo || "-"}
      </span>,
      <select
        key="status-pmu"
        value={processo.status_pmu || "Prefeitura"}
        onChange={(e) => handleStatusChange("status_pmu", e.target.value)}
        className={`w-fit text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none cursor-pointer appearance-none ${getCorStatus(processo.status_pmu || "Prefeitura")}`}
      >
        <option value="Prefeitura">Prefeitura</option>
        <option value="Codau">Codau</option>
        <option value="Paralizado">Paralizado</option>
        <option value="Seplan">Seplan</option>
        <option value="Sefaz">Sefaz</option>
        <option value="ASD">ASD</option>
      </select>,
      renderCelulaEditavel("protocolo_pmu", "number", processo.protocolo_pmu),
      renderCelulaEditavel("observacao_pmu", "text", processo.observacao_pmu),
    ],
  ];

  const dadosCaixa = [
    [
      <select
        key="status-caixa"
        value={processo.status_caixa || "Engenharia"}
        onChange={(e) => handleStatusChange("status_caixa", e.target.value)}
        className={`w-fit text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none cursor-pointer appearance-none ${getCorStatus(processo.status_caixa || "Engenharia")}`}
      >
        <option value="Engenharia">Engenharia</option>
        <option value="Assinatura">Assinatura</option>
        <option value="Conformidade">Conformidade</option>
        <option value="ITBI">ITBI</option>
        <option value="Cartório">Cartório</option>
      </select>,
      renderCelulaEditavel("engenheiro", "text", processo.engenheiro),
      renderCelulaEditavel(
        "protocolo_caixa",
        "number",
        processo.protocolo_caixa,
      ),
      renderCelulaEditavel("data_ass_caixa", "date", processo.data_ass_caixa),
    ],
  ];

  const dadosFinalizados = [
    [
      <span key="tipo-fin" className="uppercase font-bold text-[#464C54]">
        {processo.tipo || "-"}
      </span>,
      <select
        key="status-fin"
        value={processo.status_fin || "Acompanhamento"}
        onChange={(e) => handleStatusChange("status_fin", e.target.value)}
        className={`w-fit text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none cursor-pointer appearance-none ${getCorStatus(processo.status_fin || "Acompanhamento")}`}
      >
        <option value="Acompanhamento">Acompanhamento</option>
        <option value="Gestão">Gestão</option>
        <option value="Finalizado">Finalizado</option>
        <option value="Futuros">Futuros</option>
      </select>,
      renderCelulaEditavel("n_alvara", "number", processo.n_alvara),
      renderCelulaEditavel("n_contrato", "number", processo.n_contrato),
      renderCelulaEditavel("data_ass_fin", "date", processo.data_ass_fin),
    ],
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0] pb-[40px]">
      <ModalInformacaoCliente
        isOpen={modalAberto}
        cliente={processo}
        onClose={() => setModalAberto(false)}
      />

      <header className="h-[82px] border-b border-[#DBDADE] flex justify-center top-0 z-10 w-full bg-[#EEEDF0]">
        <div className="w-[90%] flex items-center justify-between">
          <div className="flex items-center gap-[16px] w-full">
            <button
              onClick={() => navigate(-1)}
              className="border-none bg-transparent cursor-pointer flex items-center"
            >
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/ios/50/back--v1.png"
                alt="voltar"
              />
            </button>
            <div className="w-full flex justify-center">
              <h1 className="text-[20px] font-bold uppercase tracking-[2px] text-[#464C54]">
                {processo.nome} {processo.tipo ? `- ${processo.tipo}` : ""}
              </h1>
            </div>
          </div>
          <div className="">
            <ButtonDefault
              onClick={() => setModalAberto(true)}
              className="w-full h-[55px] md:h-[45px] md:w-[200px] text-[14px] shrink-0"
            >
              Informações do cliente
            </ButtonDefault>
          </div>
        </div>
      </header>

      <div className="px-[5%] w-full">
        <div className="bg-[#ffffff] w-full border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px] overflow-x-auto">
          <h1 className="text-[30px] font-bold text-[#464C54]">Prefeitura</h1>
          <TabelaSimples
            colunas={["Tipo", "Status", "Protocolo", "OBS."]}
            dados={dadosPrefeitura}
          />
        </div>

        <div className="bg-[#ffffff] w-full border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px] overflow-x-auto">
          <h1 className="text-[30px] font-bold text-[#464C54]">Caixa</h1>
          <TabelaSimples
            colunas={["Status", "Engenheiro", "Protocolo", "Data Assinatura"]}
            dados={dadosCaixa}
          />
        </div>

        <div className="bg-[#ffffff] w-full border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px] overflow-x-auto">
          <h1 className="text-[30px] font-bold text-[#464C54]">Finalizados</h1>
          <TabelaSimples
            colunas={[
              "Tipo",
              "Status",
              "Nº Alvara",
              "Nº Contrato",
              "Data Assinatura",
            ]}
            dados={dadosFinalizados}
          />
        </div>
      </div>
    </div>
  );
}
