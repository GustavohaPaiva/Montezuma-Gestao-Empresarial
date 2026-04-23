import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import {
  UserRound,
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
  Plus,
  Link2Off,
} from "lucide-react";

export default function PrestadorDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prestador, setPrestador] = useState(null);
  const [historicoFinanceiro, setHistoricoFinanceiro] = useState([]);
  const [classesDisponiveis, setClassesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: "",
    cnpj_cpf: "",
    telefone: "",
    email: "",
  });

  const [classeSelecionada, setClasseSelecionada] = useState("");

  const fileInputRef = useRef(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const fetchPrestador = useCallback(async () => {
    setLoading(true);
    try {
      const [dadosPrestador, dadosClasses, dadosFinanceiro] = await Promise.all(
        [
          api.getPrestadorById(id),
          api.getClassesPrestadores(),
          api.getLancamentosFinanceirosPrestador(id),
        ],
      );

      setPrestador(dadosPrestador);
      setClassesDisponiveis(dadosClasses || []);
      setHistoricoFinanceiro(dadosFinanceiro || []);

      setEditForm({
        nome: dadosPrestador.nome || "",
        cnpj_cpf: dadosPrestador.cnpj_cpf || "",
        telefone: dadosPrestador.telefone || "",
        email: dadosPrestador.email || "",
      });
    } catch (err) {
      console.error("Erro ao carregar detalhes do prestador:", err);
      alert("Prestador não encontrado.");
      navigate("/prestadores");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPrestador();
  }, [fetchPrestador]);

  const classesVinculadas = useMemo(() => {
    return (prestador?.prestadores_classes || [])
      .map((rel) => ({
        relacaoId: rel.id,
        classe_id: rel.classe_id,
        nome: rel.classes_prestadores?.nome,
      }))
      .filter((item) => item.classe_id && item.nome);
  }, [prestador]);

  const classesNaoVinculadas = useMemo(() => {
    const idsAtuais = new Set(classesVinculadas.map((item) => item.classe_id));
    return (classesDisponiveis || []).filter(
      (classe) => !idsAtuais.has(classe.id),
    );
  }, [classesDisponiveis, classesVinculadas]);

  const handleSaveEdit = async () => {
    if (!editForm.nome.trim()) {
      alert("O nome do prestador é obrigatório!");
      return;
    }
    try {
      await api.updatePrestador(id, {
        nome: editForm.nome.trim(),
        cnpj_cpf: editForm.cnpj_cpf.trim(),
        telefone: editForm.telefone.trim(),
        email: editForm.email.trim(),
      });
      setIsEditing(false);
      fetchPrestador();
    } catch (error) {
      console.error("Erro ao atualizar prestador:", error);
      alert("Falha ao salvar alterações.");
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      nome: prestador.nome || "",
      cnpj_cpf: prestador.cnpj_cpf || "",
      telefone: prestador.telefone || "",
      email: prestador.email || "",
    });
    setIsEditing(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingFoto(true);
      await api.uploadFotoPrestador(id, file);
      await fetchPrestador();
    } catch (error) {
      console.error("Erro ao subir foto:", error);
      alert("Erro ao alterar a foto.");
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleAddClasse = async () => {
    if (!classeSelecionada) return;
    try {
      await api.addClasseAoPrestador(id, classeSelecionada);
      setClasseSelecionada("");
      fetchPrestador();
    } catch (error) {
      console.error("Erro ao vincular classe:", error);
      alert("Não foi possível vincular a classe.");
    }
  };

  const handleRemoveClasse = async (classeId) => {
    try {
      await api.removeClasseDoPrestador(id, classeId);
      fetchPrestador();
    } catch (error) {
      console.error("Erro ao remover classe:", error);
      alert("Não foi possível remover a classe.");
    }
  };

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);

  const formatarData = (dataIso) => {
    if (!dataIso) return "-";
    const data = new Date(dataIso);
    return data.toLocaleDateString("pt-BR");
  };

  const resumoFinanceiro = useMemo(() => {
    let contratado = 0;
    let pago = 0;

    historicoFinanceiro.forEach((item) => {
      const val = parseFloat(item.valor) || 0;
      contratado += val;
      if (item.validacao === 1) pago += val;
    });

    return {
      contratado,
      pago,
      pendente: Math.max(contratado - pago, 0),
      excedente: Math.max(pago - contratado, 0),
    };
  }, [historicoFinanceiro]);

  const dadosTabela = useMemo(() => {
    if (!historicoFinanceiro.length) return [];

    return [...historicoFinanceiro].map((item) => {
      const isPago = item.validacao === 1;
      const valorContratado = parseFloat(item.valor) || 0;
      const valorPago = parseFloat(item.valor_pago) || 0;
      const pagamentoCorreto = valorPago <= valorContratado;
      return [
        <div
          key={`data-${item.id}`}
          className="font-medium text-[#464C54] whitespace-nowrap text-center"
        >
          {formatarData(item.data)}
        </div>,
        <div
          key={`classe-${item.id}`}
          className="font-bold text-[#464C54] uppercase max-w-[200px] truncate mx-auto text-center"
          title={item.classe_nome}
        >
          {item.classe_nome || "Sem classe"}
        </div>,
        <div
          key={`descricao-${item.id}`}
          className="uppercase text-[#71717A] max-w-[260px] truncate mx-auto text-center"
          title={item.descricao}
        >
          {item.descricao || "-"}
        </div>,
        <div
          key={`valor-${item.id}`}
          className="font-bold whitespace-nowrap text-center"
        >
          R$ {formatarMoeda(item.valor)}
        </div>,
        <div key={`status-${item.id}`} className="flex justify-center">
          <span
            className={`px-3 py-1 rounded-[20px] text-[12px] font-bold whitespace-nowrap ${
              !pagamentoCorreto
                ? "bg-[#FEE2E2] text-[#B91C1C]"
                : isPago
                  ? "bg-[#E8F5E9] text-[#2E7D32]"
                  : "bg-[#FFF3E0] text-[#E65100]"
            }`}
          >
            {!pagamentoCorreto ? "PAGO ACIMA" : isPago ? "PAGO" : "PENDENTE"}
          </span>
        </div>,
      ];
    });
  }, [historicoFinanceiro]);

  if (loading || !prestador) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#EEEDF0]">
        <h2 className="text-[#464C54] font-bold text-xl">
          Carregando Detalhes do Prestador...
        </h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0] pb-[40px]">
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
              onClick={() => navigate("/prestadores")}
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
              Detalhes do Prestador
            </h1>
          </div>
        </div>
      </header>

      <main className="w-[90%] mt-3 flex flex-col gap-[24px] sm:mt-4">
        <div className="bg-white rounded-[16px] border border-[#DBDADE] shadow-sm p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-start relative">
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
            <div
              onClick={() => fileInputRef.current.click()}
              className="w-28 h-28 rounded-full bg-[#EEEDF0] border-[3px] border-[#DBDADE] flex items-center justify-center overflow-hidden shadow-sm relative cursor-pointer group"
              title="Alterar imagem"
            >
              {uploadingFoto ? (
                <Hourglass className="w-8 h-8 animate-spin text-[#DC3B0B]" />
              ) : prestador.foto ? (
                <>
                  <img
                    src={prestador.foto}
                    alt={prestador.nome}
                    className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </>
              ) : (
                <>
                  <UserRound
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
              className={`text-[12px] font-bold px-3 py-1 rounded-full ${prestador.ativo ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}
            >
              {prestador.ativo ? "CADASTRO ATIVO" : "CADASTRO INATIVO"}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-6 w-full mt-2">
            {isEditing ? (
              <div className="w-full flex flex-col gap-4 animate-in fade-in pt-12 sm:pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex flex-col text-left gap-1">
                    <label className="text-[12px] font-bold text-[#71717A] uppercase">
                      Nome do Prestador
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
                      CPF / CNPJ / NIF
                    </label>
                    <input
                      type="text"
                      value={editForm.cnpj_cpf}
                      onChange={(e) =>
                        setEditForm({ ...editForm, cnpj_cpf: e.target.value })
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
              <div className="animate-in fade-in">
                <h1 className="text-3xl font-extrabold text-[#464C54] uppercase mb-1 sm:pr-[150px]">
                  {prestador.nome}
                </h1>
                <p className="text-[#71717A] font-medium flex items-center gap-2 mb-6">
                  <FileText size={16} /> CPF / CNPJ / NIF:{" "}
                  {prestador.cnpj_cpf || "Não cadastrado"}
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
                        {prestador.telefone || "N/A"}
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
                        title={prestador.email}
                      >
                        {prestador.email || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#DBDADE] rounded-[16px] shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-4">
            <h2 className="text-[20px] font-bold text-[#464C54] uppercase">
              Classes do Prestador
            </h2>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={classeSelecionada}
                onChange={(e) => setClasseSelecionada(e.target.value)}
                className="h-[40px] px-3 border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none text-[#464C54] text-[13px] w-full md:w-[260px]"
              >
                <option value="">Selecione uma classe para vincular</option>
                {classesNaoVinculadas.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nome}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddClasse}
                disabled={!classeSelecionada}
                className="h-[40px] px-3 rounded-[8px] bg-[#464C54] hover:bg-black text-white text-[12px] font-bold flex items-center gap-1 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </div>

          {classesVinculadas.length === 0 ? (
            <div className="text-[13px] text-[#71717A] border border-dashed border-[#DBDADE] rounded-[10px] p-4 text-center">
              Nenhuma classe vinculada.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classesVinculadas.map((item) => (
                <div
                  key={`${item.classe_id}-${item.nome}`}
                  className="flex items-center gap-2 bg-[#F7F7F8] border border-[#DBDADE] rounded-full px-3 py-1"
                >
                  <span className="text-[12px] font-bold text-[#464C54] uppercase">
                    {item.nome}
                  </span>
                  <button
                    onClick={() => handleRemoveClasse(item.classe_id)}
                    className="border-none bg-transparent text-[#E65100] hover:text-[#b33d00] cursor-pointer"
                    title="Remover classe"
                  >
                    <Link2Off size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[16px] border border-[#DBDADE] shadow-sm flex flex-col justify-center items-center md:items-start">
            <span className="text-[14px] font-bold text-[#71717A] flex items-center gap-2 uppercase mb-1">
              <Wallet size={18} /> Serviços Contratados
            </span>
            <span className="text-[28px] font-extrabold text-[#464C54]">
              R$ {formatarMoeda(resumoFinanceiro.contratado)}
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
            className={`p-6 rounded-[16px] border shadow-sm flex flex-col justify-center items-center md:items-start ${
              resumoFinanceiro.excedente > 0
                ? "bg-[#FEE2E2] border-[#FECACA]"
                : resumoFinanceiro.pendente > 0
                  ? "bg-[#FFF3E0] border-[#FFE0B2]"
                  : "bg-white border-[#DBDADE]"
            }`}
          >
            <span
              className={`text-[14px] font-bold flex items-center gap-2 uppercase mb-1 ${
                resumoFinanceiro.excedente > 0
                  ? "text-[#B91C1C]"
                  : resumoFinanceiro.pendente > 0
                    ? "text-[#E65100]"
                    : "text-[#71717A]"
              }`}
            >
              <AlertCircle size={18} />{" "}
              {resumoFinanceiro.excedente > 0
                ? "Pago Acima do Contratado"
                : "Saldo a Pagar"}
            </span>
            <span
              className={`text-[28px] font-extrabold ${
                resumoFinanceiro.excedente > 0
                  ? "text-[#991B1B]"
                  : resumoFinanceiro.pendente > 0
                    ? "text-[#b33d00]"
                    : "text-[#464C54]"
              }`}
            >
              R${" "}
              {formatarMoeda(
                resumoFinanceiro.excedente > 0
                  ? resumoFinanceiro.excedente
                  : resumoFinanceiro.pendente,
              )}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#DBDADE] rounded-[16px] shadow-sm px-[30px] pt-[30px] pb-[40px]">
          <h2 className="text-[22px] font-bold text-[#464C54] mb-6 uppercase flex items-center gap-2">
            <FileText /> Histórico de Serviços
          </h2>

          {dadosTabela.length === 0 ? (
            <div className="text-center py-10 text-[#71717A] font-medium border-2 border-dashed border-[#DBDADE] rounded-xl">
              Nenhum serviço financeiro registrado para este prestador.
            </div>
          ) : (
            <TabelaSimples
              colunas={["Data", "Classe", "Descrição", "Valor", "Status"]}
              dados={dadosTabela}
            />
          )}
        </div>
      </main>
    </div>
  );
}
