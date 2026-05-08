import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import BaseCard from "../../components/cards/BaseCard";
import BaseButton from "../../components/gerais/BaseButton";
import BaseInput from "../../components/gerais/BaseInput";
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
  ArrowLeft,
  Loader2,
} from "lucide-react";

export default function FornecedorDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fornecedor, setFornecedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showElements, setShowElements] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
  });

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

  useEffect(() => {
    if (fornecedor && !loading) {
      const timer = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(timer);
    }
    setShowElements(false);
  }, [fornecedor, loading]);

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

      if (status === "pago") {
        pago += val;
      }
    });

    return { comprado, pago, pendente: comprado - pago };
  }, [fornecedor]);

  const dadosTabela = useMemo(() => {
    if (!fornecedor || !fornecedor.relatorio_materiais) return [];

    const materiaisOrdenados = [...fornecedor.relatorio_materiais].sort(
      (a, b) => {
        const statusA = a.status_financeiro
          ? a.status_financeiro.trim().toLowerCase()
          : "";
        const statusB = b.status_financeiro
          ? b.status_financeiro.trim().toLowerCase()
          : "";

        const isPagoA = statusA === "pago";
        const isPagoB = statusB === "pago";

        if (isPagoA && !isPagoB) return 1;
        if (!isPagoA && isPagoB) return -1;

        return (
          new Date(b.data_solicitacao || 0) - new Date(a.data_solicitacao || 0)
        );
      },
    );

    return materiaisOrdenados.map((m) => {
      const status = m.status_financeiro
        ? m.status_financeiro.trim().toLowerCase()
        : "";

      const isPago = status === "pago";

      return [
        <div
          key={`data-${m.id}`}
          className="whitespace-nowrap text-center font-medium text-text-primary"
        >
          {formatarData(m.data_solicitacao)}
        </div>,
        <div
          key={`obra-${m.id}`}
          className="mx-auto max-w-[200px] truncate text-center text-sm font-semibold uppercase text-text-primary"
          title={m.obras?.cliente}
        >
          {m.obras?.cliente || "Obra Desconhecida"}
        </div>,
        <div
          key={`material-${m.id}`}
          className="mx-auto max-w-[250px] truncate text-center text-sm uppercase text-text-muted"
          title={m.material}
        >
          {m.material}
        </div>,
        <div
          key={`valor-${m.id}`}
          className="whitespace-nowrap text-center font-bold text-text-primary"
        >
          R$ {formatarMoeda(m.valor)}
        </div>,
        <div key={`status-${m.id}`} className="flex justify-center">
          <span
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ${
              isPago
                ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
                : "bg-amber-50 text-amber-900 ring-amber-100"
            }`}
          >
            {isPago ? "PAGO" : "PENDENTE"}
          </span>
        </div>,
      ];
    });
  }, [fornecedor]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
        <div className="flex min-h-[50vh] w-full items-center justify-center px-4 py-16">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-primary/35 bg-white px-8 py-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-primary/[0.06]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-accent-primary/[0.04]"
              aria-hidden
            />
            <div className="relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shadow-inner ring-1 ring-accent-primary/15">
                <Building2 className="h-7 w-7" strokeWidth={2} />
              </div>
              <Loader2
                className="mx-auto mb-5 h-10 w-10 animate-spin text-accent-primary"
                strokeWidth={2.25}
                aria-hidden
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                Montezuma
              </p>
              <h3 className="mt-1.5 text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                Carregando fornecedor
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
                Buscando cadastro e histórico de materiais.
              </p>
              <div
                className="mx-auto mt-7 flex justify-center gap-1.5"
                role="presentation"
                aria-hidden
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-accent-primary/75"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fornecedor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-12">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <header className="w-full border-b border-gray-200/90 bg-bg-primary shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full flex-col gap-4 px-[5%] py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/fornecedores")}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
              aria-label="Voltar para fornecedores"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0 flex flex-row gap-2 items-center">
              <h1 className="truncate text-orange-600 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                {fornecedor.nome}
              </h1>
              <p> - </p>
              <p className="mt-0.5 truncate text-xs text-text-muted sm:text-sm">
                {fornecedor.cnpj
                  ? `CNPJ / NIF: ${fornecedor.cnpj}`
                  : "CNPJ / NIF não cadastrado"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full flex-col gap-6 px-[5%] pt-6 lg:gap-8">
        <section
          className={`relative rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.05)] transition-all duration-700 ease-out sm:p-8 ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <div className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2 sm:right-6 sm:top-6">
            {isEditing ? (
              <>
                <BaseButton
                  variant="outline"
                  size="sm"
                  icon={<X className="h-4 w-4" aria-hidden />}
                  onClick={handleCancelEdit}
                >
                  <span className="hidden sm:inline">Cancelar</span>
                </BaseButton>
                <BaseButton
                  variant="primary"
                  size="sm"
                  icon={<Save className="h-4 w-4" aria-hidden />}
                  onClick={handleSaveEdit}
                >
                  <span className="hidden sm:inline">Salvar</span>
                </BaseButton>
              </>
            ) : (
              <BaseButton
                variant="outline"
                size="sm"
                icon={<Edit className="h-4 w-4" aria-hidden />}
                onClick={() => setIsEditing(true)}
              >
                <span className="hidden sm:inline">Editar dados</span>
                <span className="sm:hidden">Editar</span>
              </BaseButton>
            )}
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="flex flex-col items-center gap-4 lg:min-w-[150px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-[3px] border-border-primary/30 bg-bg-primary shadow-sm ring-1 ring-slate-900/5 transition hover:border-accent-primary/40"
                title="Alterar imagem"
              >
                {uploadingFoto ? (
                  <Loader2
                    className="h-8 w-8 animate-spin text-accent-primary"
                    aria-hidden
                  />
                ) : fornecedor.foto ? (
                  <>
                    <img
                      src={fornecedor.foto}
                      alt={fornecedor.nome}
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-8 w-8 text-white" aria-hidden />
                    </div>
                  </>
                ) : (
                  <>
                    <Building2
                      className="h-12 w-12 text-text-muted transition-opacity group-hover:opacity-50"
                      aria-hidden
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera
                        className="h-8 w-8 text-text-primary"
                        aria-hidden
                      />
                    </div>
                  </>
                )}
              </button>

              <span
                className={`text-xs font-bold uppercase tracking-wide ring-1 ${
                  fornecedor.ativo
                    ? "rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-emerald-100"
                    : "rounded-full bg-amber-50 px-3 py-1 text-amber-900 ring-amber-100"
                }`}
              >
                {fornecedor.ativo ? "Cadastro ativo" : "Cadastro inativo"}
              </span>
            </div>

            <div className="min-w-0 flex-1 pt-2 lg:pt-0">
              {isEditing ? (
                <div className="mt-10 flex w-full flex-col gap-4 sm:mt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Nome da empresa
                      </label>
                      <BaseInput
                        value={editForm.nome}
                        onChange={(e) =>
                          setEditForm({ ...editForm, nome: e.target.value })
                        }
                        className="uppercase"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        CNPJ / NIF
                      </label>
                      <BaseInput
                        value={editForm.cnpj}
                        onChange={(e) =>
                          setEditForm({ ...editForm, cnpj: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Telefone
                      </label>
                      <BaseInput
                        value={editForm.telefone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            telefone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        E-mail
                      </label>
                      <BaseInput
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="lowercase"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pr-0 sm:pr-28">
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900 sm:text-3xl">
                      {fornecedor.nome}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-text-muted">
                      <FileText className="h-4 w-4 shrink-0" aria-hidden />
                      CNPJ / NIF: {fornecedor.cnpj || "Não cadastrado"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-100 bg-[#FAFAFA]/80 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                        <Phone className="h-5 w-5 text-gray-600" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Telefone
                        </span>
                        <p className="truncate font-semibold text-gray-900">
                          {fornecedor.telefone || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-100 bg-[#FAFAFA]/80 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                        <Mail className="h-5 w-5 text-gray-600" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          E-mail
                        </span>
                        <p
                          className="truncate font-semibold lowercase text-gray-900"
                          title={fornecedor.email}
                        >
                          {fornecedor.email || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div
          className={`grid grid-cols-1 gap-4 transition-all delay-75 duration-700 ease-out sm:grid-cols-3 md:gap-6 ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <BaseCard
            variant="metric"
            title="Histórico de compras"
            value={`R$ ${formatarMoeda(resumoFinanceiro.comprado)}`}
            colorTheme="purple"
            icon={<Wallet className="h-5 w-5" />}
          />
          <BaseCard
            variant="metric"
            title="Total pago"
            value={`R$ ${formatarMoeda(resumoFinanceiro.pago)}`}
            colorTheme="emerald"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <BaseCard
            variant="metric"
            title="Saldo a pagar"
            value={`R$ ${formatarMoeda(resumoFinanceiro.pendente)}`}
            colorTheme={resumoFinanceiro.pendente > 0 ? "amber" : "indigo"}
            icon={
              resumoFinanceiro.pendente > 0 ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )
            }
          />
        </div>

        <section
          className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.05)] transition-all delay-150 duration-700 ease-out sm:p-8 ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            <FileText className="h-5 w-5 text-orange-600" aria-hidden />
            Histórico de relatórios
          </h2>

          {dadosTabela.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border-primary/35 py-12 text-center text-sm font-medium text-text-muted">
              Nenhum material registrado para este fornecedor.
            </div>
          ) : (
            <TabelaSimples
              variant="financeiro"
              colunas={[
                "Data",
                "Obra",
                "Material / serviço",
                "Valor",
                "Status",
              ]}
              dados={dadosTabela}
            />
          )}
        </section>
      </div>
    </div>
  );
}
