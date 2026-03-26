import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import {
  Building2,
  Phone,
  Mail,
  FileText,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Edit,
  Save,
  X,
  Camera,
  Hourglass,
} from "lucide-react";

export default function FornecedorDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fornecedor, setFornecedor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para Edição In-line
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
  });

  // Estados para Foto
  const fileInputRef = useRef(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const fetchFornecedor = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await api.getFornecedorById(id);
      setFornecedor(dados);
      setEditForm({
        nome: dados.nome || "",
        cnpj: dados.cnpj || "",
        telefone: dados.telefone || "",
        email: dados.email || "",
      });
    } catch (err) {
      console.error("Erro ao carregar detalhes do fornecedor:", err);
      alert("Fornecedor não encontrado.");
      navigate("/fornecedores");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchFornecedor();
  }, [fetchFornecedor]);

  // Salvar a edição in-line
  const handleSaveEdit = async () => {
    if (!editForm.nome) {
      alert("O nome do fornecedor é obrigatório!");
      return;
    }
    try {
      await api.updateFornecedor(id, editForm);
      setIsEditing(false);
      fetchFornecedor();
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      alert("Falha ao salvar alterações.");
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      nome: fornecedor.nome || "",
      cnpj: fornecedor.cnpj || "",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
    });
    setIsEditing(false);
  };

  // Upload da Foto
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingFoto(true);
      await api.uploadFotoFornecedor(id, file);
      await fetchFornecedor();
    } catch (error) {
      console.error("Erro ao subir foto:", error);
      alert("Erro ao alterar a foto.");
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return "-";
    const data = new Date(dataIso);
    return data.toLocaleDateString("pt-BR");
  };

  // Cálculos Financeiros
  const resumoFinanceiro = useMemo(() => {
    if (!fornecedor || !fornecedor.relatorio_materiais)
      return { comprado: 0, pago: 0, pendente: 0 };

    let comprado = 0;
    let pago = 0;

    fornecedor.relatorio_materiais.forEach((m) => {
      const val = parseFloat(m.valor) || 0;
      comprado += val;
      const status = m.status_financeiro
        ? m.status_financeiro.trim().toLowerCase()
        : "";
      if (status === "" || status === "pago") {
        pago += val;
      }
    });

    return { comprado, pago, pendente: comprado - pago };
  }, [fornecedor]);

  // Tabela
  const dadosTabela = useMemo(() => {
    if (!fornecedor || !fornecedor.relatorio_materiais) return [];
    const materiaisOrdenados = [...fornecedor.relatorio_materiais].sort(
      (a, b) =>
        new Date(b.data_solicitacao || 0) - new Date(a.data_solicitacao || 0),
    );

    return materiaisOrdenados.map((m) => {
      const status = m.status_financeiro
        ? m.status_financeiro.trim().toLowerCase()
        : "";
      const isPago = status === "" || status === "pago";

      return [
        <div
          key={`data-${m.id}`}
          className="font-medium text-[#464C54] whitespace-nowrap"
        >
          {formatarData(m.data_solicitacao)}
        </div>,
        <div
          key={`obra-${m.id}`}
          className="font-bold text-[#464C54] uppercase max-w-[200px] truncate"
          title={m.obras?.cliente}
        >
          {m.obras?.cliente || "Obra Desconhecida"}
        </div>,
        <div
          key={`material-${m.id}`}
          className="uppercase text-[#71717A] max-w-[250px] truncate"
          title={m.material}
        >
          {m.material}
        </div>,
        <div key={`valor-${m.id}`} className="font-bold whitespace-nowrap">
          R$ {formatarMoeda(m.valor)}
        </div>,
        <div key={`status-${m.id}`}>
          <span
            className={`px-3 py-1 rounded-[20px] text-[12px] font-bold whitespace-nowrap ${
              isPago
                ? "bg-[#E8F5E9] text-[#2E7D32]"
                : "bg-[#FFF3E0] text-[#E65100]"
            }`}
          >
            {isPago ? "PAGO" : "PENDENTE"}
          </span>
        </div>,
      ];
    });
  }, [fornecedor]);

  if (loading || !fornecedor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#EEEDF0]">
        <h2 className="text-[#464C54] font-bold text-xl">
          Carregando Detalhes do Fornecedor...
        </h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0] pb-[40px]">
      {/* Input de Arquivo Escondido */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <header className="h-[60px] border-b border-[#DBDADE] flex justify-center top-0 z-10 w-full bg-[#EEEDF0]">
        <div className="w-[90%] flex items-center justify-between">
          <div className="flex items-center gap-[16px]">
            <button
              onClick={() => navigate("/fornecedores")}
              className="border-none bg-transparent cursor-pointer flex items-center hover:opacity-70 transition-opacity"
            >
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/ios/50/back--v1.png"
                alt="voltar"
              />
            </button>
            <h1 className="text-[20px] font-bold uppercase tracking-[2px] text-[#464C54]">
              Detalhes do Fornecedor
            </h1>
          </div>
        </div>
      </header>

      <main className="w-[90%] mt-[24px] flex flex-col gap-[24px]">
        {/* Painel do Fornecedor (O Layout original que você pediu) */}
        <div className="bg-white rounded-[16px] border border-[#DBDADE] shadow-sm p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-start relative">
          {/* Controle de Edição */}
          <div className="absolute top-6 right-6 flex gap-2 z-10">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 bg-[#F7F7F8] hover:bg-[#EEEDF0] text-[#71717A] font-bold px-4 py-2 rounded-lg border border-[#DBDADE] transition-colors cursor-pointer text-[12px] md:text-[14px]"
                >
                  <X size={16} />{" "}
                  <span className="hidden sm:inline">CANCELAR</span>
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 bg-[#464C54] hover:bg-black text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer text-[12px] md:text-[14px]"
                >
                  <Save size={16} />{" "}
                  <span className="hidden sm:inline">SALVAR</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-[#F7F7F8] hover:bg-[#EEEDF0] text-[#464C54] font-bold px-4 py-2 rounded-lg border border-[#DBDADE] transition-colors cursor-pointer"
              >
                <Edit size={16} />{" "}
                <span className="hidden sm:inline">EDITAR DADOS</span>
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 min-w-[150px]">
            {/* Foto Interativa */}
            <div
              onClick={() => fileInputRef.current.click()}
              className="w-28 h-28 rounded-full bg-[#EEEDF0] border-[3px] border-[#DBDADE] flex items-center justify-center overflow-hidden shadow-sm relative cursor-pointer group"
              title="Alterar imagem"
            >
              {uploadingFoto ? (
                <Hourglass className="w-8 h-8 animate-spin text-[#DC3B0B]" />
              ) : fornecedor.foto ? (
                <>
                  <img
                    src={fornecedor.foto}
                    alt={fornecedor.nome}
                    className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </>
              ) : (
                <>
                  <Building2
                    size={48}
                    className="text-[#A1A1AA] group-hover:opacity-50 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-[#464C54] w-8 h-8" />
                  </div>
                </>
              )}
            </div>

            <span
              className={`text-[12px] font-bold px-3 py-1 rounded-full ${fornecedor.ativo ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}
            >
              {fornecedor.ativo ? "CADASTRO ATIVO" : "CADASTRO INATIVO"}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-6 w-full mt-2">
            {isEditing ? (
              /* MODO EDIÇÃO (Substitui os textos) */
              <div className="w-full flex flex-col gap-4 animate-in fade-in pt-12 sm:pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex flex-col text-left gap-1">
                    <label className="text-[12px] font-bold text-[#71717A] uppercase">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nome: e.target.value })
                      }
                      className="w-full h-[45px] text-[15px] font-bold text-[#464C54] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] uppercase"
                    />
                  </div>
                  <div className="flex flex-col text-left gap-1">
                    <label className="text-[12px] font-bold text-[#71717A] uppercase">
                      CNPJ / NIF
                    </label>
                    <input
                      type="text"
                      value={editForm.cnpj}
                      onChange={(e) =>
                        setEditForm({ ...editForm, cnpj: e.target.value })
                      }
                      className="w-full h-[45px] text-[15px] text-[#464C54] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col text-left gap-1">
                    <label className="text-[12px] font-bold text-[#71717A] uppercase">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={editForm.telefone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, telefone: e.target.value })
                      }
                      className="w-full h-[45px] text-[15px] text-[#464C54] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54]"
                    />
                  </div>
                  <div className="flex flex-col text-left gap-1">
                    <label className="text-[12px] font-bold text-[#71717A] uppercase">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full h-[45px] text-[15px] text-[#464C54] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] lowercase"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* MODO VISUALIZAÇÃO (O seu layout original) */
              <div className="animate-in fade-in">
                <h1 className="text-3xl font-extrabold text-[#464C54] uppercase mb-1 sm:pr-[150px]">
                  {fornecedor.nome}
                </h1>
                <p className="text-[#71717A] font-medium flex items-center gap-2 mb-6">
                  <FileText size={16} /> CNPJ / NIF:{" "}
                  {fornecedor.cnpj || "Não cadastrado"}
                </p>

                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center gap-3 bg-[#F7F7F8] px-4 py-3 rounded-xl border border-[#EEEEEE] flex-1">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                      <Phone size={18} className="text-[#464C54]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-[#A1A1AA] uppercase">
                        Telefone
                      </span>
                      <span className="font-bold text-[#464C54] truncate">
                        {fornecedor.telefone || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-[#F7F7F8] px-4 py-3 rounded-xl border border-[#EEEEEE] flex-1">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                      <Mail size={18} className="text-[#464C54]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-[#A1A1AA] uppercase">
                        E-mail
                      </span>
                      <span
                        className="font-bold text-[#464C54] lowercase truncate"
                        title={fornecedor.email}
                      >
                        {fornecedor.email || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[16px] border border-[#DBDADE] shadow-sm flex flex-col justify-center items-center md:items-start">
            <span className="text-[14px] font-bold text-[#71717A] flex items-center gap-2 uppercase mb-1">
              <Wallet size={18} /> Histórico de Compras
            </span>
            <span className="text-[28px] font-extrabold text-[#464C54]">
              R$ {formatarMoeda(resumoFinanceiro.comprado)}
            </span>
          </div>
          <div className="bg-[#E8F5E9] p-6 rounded-[16px] border border-[#C8E6C9] shadow-sm flex flex-col justify-center items-center md:items-start">
            <span className="text-[14px] font-bold text-[#2E7D32] flex items-center gap-2 uppercase mb-1">
              <CheckCircle2 size={18} /> Total Pago
            </span>
            <span className="text-[28px] font-extrabold text-[#1b4b1e]">
              R$ {formatarMoeda(resumoFinanceiro.pago)}
            </span>
          </div>
          <div
            className={`p-6 rounded-[16px] border shadow-sm flex flex-col justify-center items-center md:items-start ${resumoFinanceiro.pendente > 0 ? "bg-[#FFF3E0] border-[#FFE0B2]" : "bg-white border-[#DBDADE]"}`}
          >
            <span
              className={`text-[14px] font-bold flex items-center gap-2 uppercase mb-1 ${resumoFinanceiro.pendente > 0 ? "text-[#E65100]" : "text-[#71717A]"}`}
            >
              <AlertCircle size={18} /> Saldo a Pagar
            </span>
            <span
              className={`text-[28px] font-extrabold ${resumoFinanceiro.pendente > 0 ? "text-[#b33d00]" : "text-[#464C54]"}`}
            >
              R$ {formatarMoeda(resumoFinanceiro.pendente)}
            </span>
          </div>
        </div>

        {/* Histórico / Tabela de Materiais */}
        <div className="bg-white border border-[#DBDADE] rounded-[16px] shadow-sm px-[30px] pt-[30px] pb-[40px]">
          <h2 className="text-[22px] font-bold text-[#464C54] mb-6 mt-6 uppercase flex items-center gap-2">
            <FileText /> Histórico de Relatórios
          </h2>

          {dadosTabela.length === 0 ? (
            <div className="text-center py-10 text-[#71717A] font-medium border-2 border-dashed border-[#DBDADE] rounded-xl">
              Nenhum material registrado para este fornecedor.
            </div>
          ) : (
            <TabelaSimples
              colunas={[
                "Data",
                "Obra",
                "Material / Serviço",
                "Valor",
                "Status",
              ]}
              dados={dadosTabela}
            />
          )}
        </div>
      </main>
    </div>
  );
}
