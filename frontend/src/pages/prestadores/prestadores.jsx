import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import ModalPrestador from "../../components/modals/ModalPrestador";
import {
  UserRound,
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

export default function Prestadores() {
  const navigate = useNavigate();
  const [prestadores, setPrestadores] = useState([]);
  const [classesPrestadores, setClassesPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroClasseId, setFiltroClasseId] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [modalOpen, setModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const [prestadorParaFoto, setPrestadorParaFoto] = useState(null);
  const [uploadingFotoId, setUploadingFotoId] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchBase = useCallback(async () => {
    setLoading(true);
    try {
      const [dadosPrestadores, dadosClasses] = await Promise.all([
        api.getPrestadores(),
        api.getClassesPrestadores(),
      ]);
      setPrestadores(dadosPrestadores || []);
      setClassesPrestadores(dadosClasses || []);
    } catch (err) {
      console.error("Erro ao carregar prestadores:", err);
      alert("Falha ao carregar os prestadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBase();
  }, [fetchBase]);

  const handleCreateClasse = async (nomeClasse) => {
    const classe = await api.createClassePrestador({ nome: nomeClasse });
    setClassesPrestadores((prev) =>
      [...prev, classe].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")),
    );
    return classe;
  };

  const handleSavePrestador = async (dados) => {
    try {
      const { id: _ignoreId, ...dadosSemId } = dados;
      await api.createPrestador({ ...dadosSemId, ativo: true });
      setModalOpen(false);
      fetchBase();
    } catch (error) {
      console.error("Erro ao guardar prestador:", error);
      alert("Falha ao criar o prestador.");
    }
  };

  const toggleAtivo = async (id, statusAtual) => {
    try {
      setPrestadores((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ativo: !statusAtual } : p)),
      );
      await api.updatePrestador(id, { ativo: !statusAtual });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      fetchBase();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !prestadorParaFoto) return;

    try {
      setUploadingFotoId(prestadorParaFoto.id);
      await api.uploadFotoPrestador(prestadorParaFoto.id, file);
      await fetchBase();
    } catch (error) {
      console.error("Erro ao subir foto:", error);
      alert("Erro ao alterar a foto.");
    } finally {
      setUploadingFotoId(null);
      setPrestadorParaFoto(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const prestadoresFiltrados = useMemo(() => {
    return prestadores
      .filter(
        (p) =>
          (p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
            p.cnpj_cpf?.toLowerCase().includes(busca.toLowerCase())) &&
          (!filtroClasseId ||
            (p.prestadores_classes || []).some(
              (rel) => String(rel.classe_id) === String(filtroClasseId),
            )),
      )
      .sort((a, b) => {
        if (a.ativo === b.ativo) {
          return (a.nome || "").localeCompare(b.nome || "");
        }
        return a.ativo ? -1 : 1;
      });
  }, [prestadores, busca, filtroClasseId]);

  const corClasse = (nomeClasse = "") => {
    const paleta = [
      "bg-[#FEE2E2] text-[#991B1B]",
      "bg-[#FFEDD5] text-[#9A3412]",
      "bg-[#FEF9C3] text-[#854D0E]",
      "bg-[#DCFCE7] text-[#166534]",
      "bg-[#DBEAFE] text-[#1E3A8A]",
      "bg-[#EDE9FE] text-[#4C1D95]",
      "bg-[#FCE7F3] text-[#9D174D]",
      "bg-[#E0F2FE] text-[#0C4A6E]",
    ];
    const hash = [...nomeClasse].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return paleta[hash % paleta.length];
  };

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);

  const totaisGerais = useMemo(() => {
    let contratado = 0;
    let pago = 0;

    prestadoresFiltrados.forEach((p) => {
      const resumo = p.resumo_mdo || { contratado: 0, pago: 0 };
      contratado += parseFloat(resumo.contratado) || 0;
      pago += parseFloat(resumo.pago) || 0;
    });

    return {
      contratado,
      pago,
      pendente: Math.max(contratado - pago, 0),
      excedente: Math.max(pago - contratado, 0),
    };
  }, [prestadoresFiltrados]);

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
              Prestadores
            </h1>
          </div>
          {!isMobile && (
            <ButtonDefault className="w-[180px]" onClick={() => setModalOpen(true)}>
              + Novo Prestador
            </ButtonDefault>
          )}
        </div>
      </header>

      <main className="w-[90%] mt-3 sm:mt-4">
        {isMobile && (
          <div className="flex flex-col gap-[12px] mb-[24px]">
            <ButtonDefault onClick={() => setModalOpen(true)}>
              + Novo Prestador
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
                  <Wallet size={16} /> Total Contratado
                </span>
                <span className="text-[24px] font-extrabold text-[#464C54] mt-1">
                  R$ {formatarMoeda(totaisGerais.contratado)}
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
                className={`p-4 rounded-xl border flex flex-col justify-center ${
                  totaisGerais.excedente > 0
                    ? "bg-[#FEE2E2] border-[#FECACA]"
                    : totaisGerais.pendente > 0
                      ? "bg-[#FFF3E0] border-[#FFE0B2]"
                      : "bg-[#F7F7F8] border-[#EEEEEE]"
                }`}
              >
                <span
                  className={`text-[13px] font-bold flex items-center gap-2 uppercase ${
                    totaisGerais.excedente > 0
                      ? "text-[#B91C1C]"
                      : totaisGerais.pendente > 0
                        ? "text-[#E65100]"
                        : "text-[#71717A]"
                  }`}
                >
                  <AlertCircle size={16} />
                  {totaisGerais.excedente > 0
                    ? "Pago Acima do Contratado"
                    : "Total Pendente"}
                </span>
                <span
                  className={`text-[24px] font-extrabold mt-1 ${
                    totaisGerais.excedente > 0
                      ? "text-[#991B1B]"
                      : totaisGerais.pendente > 0
                        ? "text-[#b33d00]"
                        : "text-[#464C54]"
                  }`}
                >
                  R${" "}
                  {formatarMoeda(
                    totaisGerais.excedente > 0
                      ? totaisGerais.excedente
                      : totaisGerais.pendente,
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-white p-4 rounded-[12px] shadow-sm border border-[#DBDADE]">
            <h1 className="text-[20px] md:text-[25px] font-bold text-[#464C54] hidden md:block">
              Diretório
            </h1>
            <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
              <select
                value={filtroClasseId}
                onChange={(e) => setFiltroClasseId(e.target.value)}
                className="h-[45px] px-3 border border-[#DBDADE] rounded-[8px] bg-[#F7F7F8] focus:outline-none text-[#464C54] md:w-[240px]"
              >
                <option value="">Todas as classes</option>
                {classesPrestadores.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nome}
                  </option>
                ))}
              </select>
              <div className="relative w-full md:w-[350px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou documento..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full h-[45px] pl-10 pr-4 box-border border border-[#DBDADE] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] text-[#464C54]"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-[#71717A] font-bold py-10">A carregar dados...</div>
          ) : prestadoresFiltrados.length === 0 ? (
            <div className="text-[#71717A] py-10">Nenhum prestador encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
              {prestadoresFiltrados.map((prestador) => {
                const resumoCard = prestador.resumo_mdo || {
                  contratado: 0,
                  pago: 0,
                  pendente: 0,
                };
                const contratadoCard = parseFloat(resumoCard.contratado) || 0;
                const pagoCard = parseFloat(resumoCard.pago) || 0;
                const pendenteCard = Math.max(contratadoCard - pagoCard, 0);
                const excedenteCard = Math.max(pagoCard - contratadoCard, 0);
                const classes = (prestador.prestadores_classes || [])
                  .map((rel) => rel.classes_prestadores?.nome)
                  .filter(Boolean);

                return (
                  <div
                    key={prestador.id}
                    onClick={() => navigate(`/prestadores/${prestador.id}`)}
                    className={`bg-white rounded-[16px] border border-[#DBDADE] shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col relative ${!prestador.ativo ? "opacity-70 grayscale-[30%]" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-4 mb-5 border-b border-gray-100 pb-4">
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPrestadorParaFoto(prestador);
                          fileInputRef.current.click();
                        }}
                        className="relative w-14 h-14 rounded-full bg-[#EEEDF0] border border-[#DBDADE] flex items-center justify-center text-[#464C54] shrink-0 overflow-hidden shadow-sm cursor-pointer group"
                        title="Alterar imagem"
                      >
                        {uploadingFotoId === prestador.id ? (
                          <Hourglass className="w-6 h-6 animate-spin text-[#DC3B0B]" />
                        ) : prestador.foto ? (
                          <>
                            <img
                              src={prestador.foto}
                              alt={prestador.nome}
                              className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="text-white w-5 h-5" />
                            </div>
                          </>
                        ) : (
                          <>
                            <UserRound
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
                          title={prestador.nome}
                        >
                          {prestador.nome}
                        </h3>
                        <span
                          className={`w-fit mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${prestador.ativo ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}
                        >
                          {prestador.ativo ? "ATIVO" : "INATIVO"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 text-[12px] text-[#71717A] mb-2">
                      <div className="flex items-center gap-3">
                        <FileText size={15} className="text-[#A1A1AA]" />
                        <span className="font-medium">
                          {prestador.cnpj_cpf || "Sem registo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={15} className="text-[#A1A1AA]" />
                        <span className="font-medium">
                          {prestador.telefone || "Sem telefone"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={15} className="text-[#A1A1AA]" />
                        <span
                          className="font-medium lowercase truncate"
                          title={prestador.email}
                        >
                          {prestador.email || "Sem e-mail"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                        {classes.length > 0 ? (
                          classes.slice(0, 4).map((nomeClasse) => (
                            <span
                              key={`${prestador.id}-${nomeClasse}`}
                              className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${corClasse(nomeClasse)}`}
                            >
                              {nomeClasse}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#A1A1AA]">
                            Sem classes vinculadas
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                        {excedenteCard > 0 ? (
                          <>
                            <AlertCircle size={15} className="text-[#B91C1C]" />
                            <span className="font-bold text-[#B91C1C]">
                              Pago acima: R$ {formatarMoeda(excedenteCard)}
                            </span>
                          </>
                        ) : pendenteCard > 0 ? (
                          <>
                            <AlertCircle size={15} className="text-[#E65100]" />
                            <span className="font-bold text-[#E65100]">
                              Pendente: R$ {formatarMoeda(pendenteCard)}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={15} className="text-[#2E7D32]" />
                            <span className="font-bold text-[#2E7D32]">Tudo Pago</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto border-t border-[#DBDADE] pt-4 flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleAtivo(prestador.id, prestador.ativo);
                        }}
                        className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer bg-transparent border-none ${prestador.ativo ? "text-[#E65100] hover:text-[#b33d00]" : "text-[#2E7D32] hover:text-[#1b4b1e]"}`}
                      >
                        {prestador.ativo ? <PowerOff size={14} /> : <Power size={14} />}
                        {prestador.ativo ? "DESATIVAR" : "ATIVAR"}
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
        <ModalPrestador
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSavePrestador}
          classesDisponiveis={classesPrestadores}
          onCreateClasse={handleCreateClasse}
        />
      )}
    </div>
  );
}
