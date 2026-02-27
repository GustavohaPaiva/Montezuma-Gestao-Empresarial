import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import { api } from "../../services/api";

export default function ProcessosDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [processo, setProcesso] = useState(null);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProcesso((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSalvarInformacoes = async () => {
    try {
      const dadosParaSalvar = { ...processo };
      delete dadosParaSalvar.id;
      delete dadosParaSalvar.created_at;

      await api.updateCliente(id, dadosParaSalvar);
      alert("Informações atualizadas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar informações do formulário:", err);
      alert("Erro ao atualizar informações.");
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
        </div>
      </header>

      <div className="px-[5%] w-full">
        {/* TABELAS SUPERIORES */}
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

        {/* FORMULÁRIO DO CLIENTE */}
        <div className="bg-[#ffffff] w-full border border-[#DBDADE] rounded-[12px] px-[30px] shadow-sm flex flex-col mt-[24px] pt-[24px] pb-[24px]">
          <div className="flex justify-center items-center mb-6">
            <h2 className="text-[24px] font-bold text-[#000000] text-center w-full">
              Informações Completas do Cliente
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {/* 1. Informações do cliente */}
            <div className="border-t border-[#C4C4C9] pt-[15px] flex flex-col">
              <div className="w-full text-center mb-4">
                <h3 className="text-[25px]">Informações do cliente</h3>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">
                    Nome do Proprietario (nome completo)
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={processo.nome || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">
                    CPF do Cliente
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={processo.cpf || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: 123.456.789-00"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">
                    E-mail do Proprietário
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={processo.email || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: joao@dominio.com"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">RG</label>
                  <input
                    type="text"
                    name="rg"
                    value={processo.rg || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: MG-12.345.678"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-1 mt-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Profissão</label>
                  <input
                    type="text"
                    name="profissao"
                    value={processo.profissao || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: Engenheiro Civil"
                  />
                </div>
              </div>
            </div>

            {/* 2. Informações de Moradia do cliente */}
            <div className="border-t border-[#C4C4C9] pt-[15px] flex flex-col">
              <div className="w-full text-center mb-4">
                <h3 className="text-[25px]">Informações de Moradia</h3>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Bairro</label>
                  <input
                    type="text"
                    name="bairro"
                    value={processo.bairro || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: Centro"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Rua</label>
                  <input
                    type="text"
                    name="rua"
                    value={processo.rua || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: Rua das Flores"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full md:w-[17%]">
                  <label className="text-[#71717A] text-sm">Nº</label>
                  <input
                    type="text"
                    name="numero_casa"
                    value={processo.numero_casa || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: 123"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={processo.cidade || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: Uberaba"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Estado</label>
                  <input
                    type="text"
                    name="estado"
                    value={processo.estado || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: MG"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full md:w-[17%]">
                  <label className="text-[#71717A] text-sm">CEP</label>
                  <input
                    type="text"
                    name="cep"
                    value={processo.cep || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: 12345-678"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Complemento</label>
                  <input
                    type="text"
                    name="complemento"
                    value={processo.complemento || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: Apto 101, Casa"
                  />
                </div>
              </div>
            </div>

            {/* 3. Informações da Obra */}
            <div className="border-t border-[#C4C4C9] pt-[15px] flex flex-col">
              <div className="w-full text-center mb-4">
                <h3 className="text-[25px]">Informações da Obra</h3>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Bairro</label>
                  <input
                    type="text"
                    name="bairro_obra"
                    value={processo.bairro_obra || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: Centro"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Rua</label>
                  <input
                    type="text"
                    name="rua_obra"
                    value={processo.rua_obra || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: Rua das Flores"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Número</label>
                  <input
                    type="text"
                    name="numero_obra"
                    value={processo.numero_obra || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: 123"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">
                    Tamanho em m²
                  </label>
                  <input
                    type="text"
                    name="tamanho_m2"
                    value={processo.tamanho_m2 || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: 120.5 m²"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Lote</label>
                  <input
                    type="text"
                    name="lote"
                    value={processo.lote || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: Lote 123"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">Quadra</label>
                  <input
                    type="text"
                    name="quadra"
                    value={processo.quadra || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: quadra 5"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">
                    Codigo de identificação do imóvel
                  </label>
                  <input
                    type="text"
                    name="codigo_identificacao_imovel"
                    value={processo.codigo_identificacao_imovel || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: 123456798"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">ART</label>
                  <input
                    type="text"
                    name="art"
                    value={processo.art || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: 123456798"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* SELECTS EM CASCATA - LÓGICA CUB ATUALIZADA POR PADRÃO      */}
              {/* ======================================================== */}
              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                {/* 1. TIPO DE PROJETO */}
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">
                    Tipo de Projeto (CUB)
                  </label>
                  <select
                    name="cub_tipo_projeto"
                    value={processo.cub_tipo_projeto || ""}
                    onChange={(e) => {
                      setProcesso((prev) => ({
                        ...prev,
                        cub_tipo_projeto: e.target.value,
                        cub_padrao: "",
                        cub_nomenclatura: "",
                      }));
                    }}
                    className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#FFFFFF] focus:outline-none box-border"
                  >
                    <option value="">Selecione...</option>
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Industrial">Industrial / Galpão</option>
                  </select>
                </div>

                {/* 2. PADRÃO */}
                {processo.cub_tipo_projeto &&
                  processo.cub_tipo_projeto !== "Industrial" && (
                    <div className="flex flex-col text-left gap-1 w-full">
                      <label className="text-[#71717A] text-sm">
                        Padrão de Acabamento
                      </label>
                      <select
                        name="cub_padrao"
                        value={processo.cub_padrao || ""}
                        onChange={(e) => {
                          setProcesso((prev) => ({
                            ...prev,
                            cub_padrao: e.target.value,
                            cub_nomenclatura: "",
                          }));
                        }}
                        className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#FFFFFF] focus:outline-none box-border"
                      >
                        <option value="">Selecione...</option>
                        <option value="Baixo">Baixo</option>
                        <option value="Normal">Normal</option>
                        <option value="Alto">Alto</option>
                      </select>
                    </div>
                  )}

                {/* 3. CÓDIGO DINÂMICO BASEADO NO PADRÃO ESCOLHIDO */}
                {((processo.cub_tipo_projeto &&
                  processo.cub_tipo_projeto !== "Industrial" &&
                  processo.cub_padrao) ||
                  processo.cub_tipo_projeto === "Industrial") && (
                  <div className="flex flex-col text-left gap-1 w-full">
                    <label className="text-[#71717A] text-sm">
                      Código / Pavimentos
                    </label>
                    <select
                      name="cub_nomenclatura"
                      value={processo.cub_nomenclatura || ""}
                      onChange={handleInputChange}
                      className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#FFFFFF] focus:outline-none box-border"
                    >
                      <option value="">Selecione...</option>

                      {/* === OPÇÕES RESIDENCIAIS === */}
                      {processo.cub_tipo_projeto === "Residencial" &&
                        processo.cub_padrao === "Baixo" && (
                          <>
                            <option value="R1">R1</option>
                            <option value="PP-4">PP-4</option>
                            <option value="R8">R8 </option>
                            <option value="PIS">PIS</option>
                          </>
                        )}

                      {processo.cub_tipo_projeto === "Residencial" &&
                        processo.cub_padrao === "Normal" && (
                          <>
                            <option value="R1">R1</option>
                            <option value="PP-4">PP-4</option>
                            <option value="R8">R8 </option>
                            <option value="R16">R16</option>
                          </>
                        )}

                      {processo.cub_tipo_projeto === "Residencial" &&
                        processo.cub_padrao === "Alto" && (
                          <>
                            <option value="R1">R1</option>
                            <option value="R8">R8 </option>
                            <option value="R16">R16</option>
                          </>
                        )}

                      {/* === OPÇÕES COMERCIAIS === */}
                      {processo.cub_tipo_projeto === "Comercial" && (
                        <>
                          <option value="CAL-8">CAL-8</option>
                          <option value="CSL-8">CSL-8 </option>
                          <option value="CSL-16">CSL-16</option>
                        </>
                      )}

                      {/* === OPÇÃO INDUSTRIAL === */}
                      {processo.cub_tipo_projeto === "Industrial" && (
                        <>
                          <option value="GI">GI </option>
                          <option value="RP1Q">RP1Q </option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
              {/* ======================================================== */}
            </div>

            {/* 4. Informações do Alvara */}
            <div className="border-t border-[#C4C4C9] pt-[15px] flex flex-col">
              <div className="w-full text-center mb-4">
                <h3 className="text-[25px]">Informações do Alvara</h3>
              </div>
              <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">
                    Número do Alvara
                  </label>
                  <input
                    type="text"
                    name="numero_alvara"
                    value={processo.numero_alvara || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: 123456798"
                  />
                </div>
                <div className="flex flex-col text-left gap-1 w-full">
                  <label className="text-[#71717A] text-sm">
                    Data expedição
                  </label>
                  <input
                    type="text"
                    name="data_expedicao"
                    value={processo.data_expedicao || ""}
                    onChange={handleInputChange}
                    className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                    placeholder="Ex: 12/12/2020"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-[#C4C4C9] shrink-0">
              <div className="flex-1 w-full">
                <ButtonDefault
                  onClick={handleSalvarInformacoes}
                  className="w-full"
                >
                  Salvar
                </ButtonDefault>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
