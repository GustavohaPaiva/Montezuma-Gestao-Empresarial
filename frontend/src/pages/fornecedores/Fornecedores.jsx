import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import ModalFornecedor from "../../components/modals/ModalFornecedor";
import {
  Building2,
  Phone,
  Mail,
  FileText,
  Power,
  PowerOff,
  Search,
  Camera,
  Hourglass,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function Fornecedores() {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [modalOpen, setModalOpen] = useState(false);

  // Estados para Upload de Foto direto no card
  const fileInputRef = useRef(null);
  const [fornecedorParaFoto, setFornecedorParaFoto] = useState(null);
  const [uploadingFotoId, setUploadingFotoId] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchFornecedores = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await api.getFornecedores();
      setFornecedores(dados || []);
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  // Salva dados de texto do Modal
  const handleSaveFornecedor = async (dados) => {
    try {
      await api.createFornecedor({ ...dados, ativo: true });
      setModalOpen(false);
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao guardar fornecedor:", error);
      alert("Falha ao criar o fornecedor.");
    }
  };

  // Desativar/Ativar
  const toggleAtivo = async (id, statusAtual) => {
    try {
      setFornecedores((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ativo: !statusAtual } : f)),
      );
      await api.updateFornecedor(id, { ativo: !statusAtual });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      fetchFornecedores();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !fornecedorParaFoto) return;

    try {
      setUploadingFotoId(fornecedorParaFoto.id);
      await api.uploadFotoFornecedor(fornecedorParaFoto.id, file);
      await fetchFornecedores();
    } catch (error) {
      console.error("Erro ao subir foto:", error);
      alert("Erro ao alterar a foto.");
    } finally {
      setUploadingFotoId(null);
      setFornecedorParaFoto(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  // 1. ORDENAÇÃO E FILTRO: Ativos primeiro (ordem alfabética), depois inativos
  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores
      .filter(
        (f) =>
          f.nome?.toLowerCase().includes(busca.toLowerCase()) ||
          f.cnpj?.toLowerCase().includes(busca.toLowerCase()),
      )
      .sort((a, b) => {
        if (a.ativo === b.ativo) {
          return (a.nome || "").localeCompare(b.nome || "");
        }
        return a.ativo ? -1 : 1; // Ativos (-1) vêm antes dos inativos (1)
      });
  }, [fornecedores, busca]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);
  };

  const totaisGerais = useMemo(() => {
    let comprado = 0;
    let pago = 0;

    fornecedoresFiltrados.forEach((f) => {
      const materiais = f.relatorio_materiais || [];
      materiais.forEach((m) => {
        const val = parseFloat(m.valor) || 0;
        comprado += val;

        const status = m.status_financeiro
          ? m.status_financeiro.trim().toLowerCase()
          : "";

        if (status === "pago") {
          pago += val;
        }
      });
    });

    return {
      comprado,
      pago,
      pendente: comprado - pago,
    };
  }, [fornecedoresFiltrados]);

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
              onClick={() => navigate("/")}
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
              Fornecedores
            </h1>
          </div>
          {!isMobile && (
            <ButtonDefault
              className="w-[180px]"
              onClick={() => setModalOpen(true)}
            >
              + Novo Fornecedor
            </ButtonDefault>
          )}
        </div>
      </header>

      <main className="w-[90%] mt-[24px]">
        {isMobile && (
          <div className="flex flex-col gap-[12px] mb-[24px]">
            <ButtonDefault onClick={() => setModalOpen(true)}>
              + Novo Fornecedor
            </ButtonDefault>
          </div>
        )}

        <div className="bg-transparent flex flex-col items-center gap-[24px] pb-[40px]">
          <div className="w-full bg-white rounded-[16px] shadow-sm border border-[#DBDADE] p-6 mb-2">
            <h2 className="text-[18px] font-bold text-[#464C54] mb-4 uppercase tracking-wide">
              Visão Financeira Global
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#F7F7F8] p-4 rounded-xl border border-[#EEEEEE] flex flex-col justify-center">
                <span className="text-[13px] font-bold text-[#71717A] flex items-center gap-2 uppercase">
                  <Wallet size={16} /> Total Comprado
                </span>
                <span className="text-[24px] font-extrabold text-[#464C54] mt-1">
                  R$ {formatarMoeda(totaisGerais.comprado)}
                </span>
              </div>
              <div className="bg-[#E8F5E9] p-4 rounded-xl border border-[#C8E6C9] flex flex-col justify-center">
                <span className="text-[13px] font-bold text-[#2E7D32] flex items-center gap-2 uppercase">
                  <CheckCircle2 size={16} /> Total Pago
                </span>
                <span className="text-[24px] font-extrabold text-[#1b4b1e] mt-1">
                  R$ {formatarMoeda(totaisGerais.pago)}
                </span>
              </div>
              <div
                className={`p-4 rounded-xl border flex flex-col justify-center ${totaisGerais.pendente > 0 ? "bg-[#FFF3E0] border-[#FFE0B2]" : "bg-[#F7F7F8] border-[#EEEEEE]"}`}
              >
                <span
                  className={`text-[13px] font-bold flex items-center gap-2 uppercase ${totaisGerais.pendente > 0 ? "text-[#E65100]" : "text-[#71717A]"}`}
                >
                  <AlertCircle size={16} /> Total Pendente
                </span>
                <span
                  className={`text-[24px] font-extrabold mt-1 ${totaisGerais.pendente > 0 ? "text-[#b33d00]" : "text-[#464C54]"}`}
                >
                  R$ {formatarMoeda(totaisGerais.pendente)}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-between items-center bg-white p-4 rounded-[12px] shadow-sm border border-[#DBDADE]">
            <h1 className="text-[20px] md:text-[25px] font-bold text-[#464C54] hidden md:block">
              Diretório
            </h1>
            <div className="relative w-full md:w-[350px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Pesquisar por nome ou NIF/CNPJ..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full h-[45px] pl-10 pr-4 box-border border border-[#DBDADE] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] text-[#464C54]"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-[#71717A] font-bold py-10">
              A carregar dados...
            </div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <div className="text-[#71717A] py-10">
              Nenhum fornecedor encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
              {fornecedoresFiltrados.map((f) => {
                const materiais = f.relatorio_materiais || [];
                const totalCompradoCard = materiais.reduce(
                  (acc, curr) => acc + (parseFloat(curr.valor) || 0),
                  0,
                );
                const totalPagoCard = materiais.reduce((acc, curr) => {
                  const status = curr.status_financeiro
                    ? curr.status_financeiro.trim().toLowerCase()
                    : "";
                  if (status === "pago") {
                    return acc + (parseFloat(curr.valor) || 0);
                  }
                  return acc;
                }, 0);
                const totalPendenteCard = totalCompradoCard - totalPagoCard;

                return (
                  <div
                    key={f.id}
                    onClick={() => navigate(`/fornecedores/${f.id}`)}
                    className={`bg-white rounded-[16px] border border-[#DBDADE] shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col relative ${!f.ativo ? "opacity-70 grayscale-[30%]" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-4 mb-5 border-b border-gray-100 pb-4">
                      {/* 2. PROTEÇÃO DO CLIQUE: stopPropagation + preventDefault */}
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFornecedorParaFoto(f);
                          fileInputRef.current.click();
                        }}
                        className="relative w-14 h-14 rounded-full bg-[#EEEDF0] border border-[#DBDADE] flex items-center justify-center text-[#464C54] shrink-0 overflow-hidden shadow-sm cursor-pointer group"
                        title="Alterar imagem"
                      >
                        {uploadingFotoId === f.id ? (
                          <Hourglass className="w-6 h-6 animate-spin text-[#DC3B0B]" />
                        ) : f.foto ? (
                          <>
                            <img
                              src={f.foto}
                              alt={f.nome}
                              className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="text-white w-5 h-5" />
                            </div>
                          </>
                        ) : (
                          <>
                            <Building2
                              size={24}
                              className="group-hover:opacity-50 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="text-[#464C54] w-5 h-5" />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <h3
                          className="font-bold text-[#464C54] uppercase text-[15px] leading-tight truncate"
                          title={f.nome}
                        >
                          {f.nome}
                        </h3>
                        <span
                          className={`w-fit mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${f.ativo ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}
                        >
                          {f.ativo ? "ATIVO" : "INATIVO"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 text-[12px] text-[#71717A] mb-2">
                      <div className="flex items-center gap-3">
                        <FileText size={15} className="text-[#A1A1AA]" />
                        <span className="font-medium">
                          {f.cnpj || "Sem Registo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={15} className="text-[#A1A1AA]" />
                        <span className="font-medium">
                          {f.telefone || "Sem Telefone"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={15} className="text-[#A1A1AA]" />
                        <span
                          className="font-medium lowercase truncate"
                          title={f.email}
                        >
                          {f.email || "Sem e-mail"}
                        </span>
                      </div>

                      {/* 3. TUDO PAGO VS PENDENTE */}
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                        {totalPendenteCard > 0 ? (
                          <>
                            <AlertCircle size={15} className="text-[#E65100]" />
                            <span className="font-bold text-[#E65100]">
                              Pendente: R$ {formatarMoeda(totalPendenteCard)}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2
                              size={15}
                              className="text-[#2E7D32]"
                            />
                            <span className="font-bold text-[#2E7D32]">
                              Tudo Pago
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto border-t border-[#DBDADE] pt-4 flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleAtivo(f.id, f.ativo);
                        }}
                        className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer bg-transparent border-none ${f.ativo ? "text-[#E65100] hover:text-[#b33d00]" : "text-[#2E7D32] hover:text-[#1b4b1e]"}`}
                      >
                        {f.ativo ? <PowerOff size={14} /> : <Power size={14} />}
                        {f.ativo ? "DESATIVAR" : "ATIVAR"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <ModalFornecedor
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveFornecedor}
        />
      )}
    </div>
  );
}
