import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Hammer,
  HardHat,
  MapPin,
  Package,
  Pencil,
  Plus,
  ScrollText,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import BaseButton from "../../components/gerais/BaseButton";
import BaseModal from "../../components/gerais/BaseModal";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import ModalProjecao from "../../components/modals/ModalProjecao";
import ProjecaoSecaoPainel from "../../components/projecoes/ProjecaoSecaoPainel";
import ModalProjecaoItem from "../../components/modals/ModalProjecaoItem";
import StatusProjecaoBadge from "../../components/projecoes/StatusProjecaoBadge";
import { api } from "../../services/api";
import { gerarPdfProjecao } from "../../utils/projecaoPdf";
import {
  calcularTotalProjecao,
  labelTipoProjecaoItem,
  calcularValoresPorTipo,
  formatarDataProjecao,
  formatarMoedaBRL,
  formatarMoedaProjecao,
  normalizarItensProjecao,
  sincronizarProjecaoComItens,
} from "../../utils/projecaoUtils";
import {
  labelCampoClass,
  projecaoDetalheHeaderClass,
  projecaoDetalheIconClass,
  projecaoSecaoClass,
  projecaoGrid3Class,
  projecaoTabelaHeadClass,
  textareaCampoClass,
  valorSomenteLeituraClass,
} from "./projecoesUi";

export default function ProjecaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projecao, setProjecao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  const [itens, setItens] = useState([]);
  const [observacoes, setObservacoes] = useState("");

  const carregar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const row = await api.getProjecaoById(id);
      if (!row) {
        setErro("Projeção não encontrada.");
        setProjecao(null);
        return;
      }
      const sync = sincronizarProjecaoComItens(row);
      setProjecao(sync);
      setItens(normalizarItensProjecao(sync.itens));
      setObservacoes(sync.observacoes ?? "");
      setErro(null);
    } catch (e) {
      console.error("[ProjecaoDetalhe] carregar:", e);
      setErro(e?.message || "Erro ao carregar a projeção.");
      setProjecao(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const valoresPorTipo = useMemo(() => calcularValoresPorTipo(itens), [itens]);

  const totalPreview = useMemo(
    () =>
      calcularTotalProjecao({
        itens,
        valor_documentacao: valoresPorTipo.valor_documentacao,
        valor_projeto: valoresPorTipo.valor_projeto,
        valor_obra: valoresPorTipo.valor_obra,
        valor_mao_de_obra: valoresPorTipo.valor_mao_de_obra,
        valor_materiais: valoresPorTipo.valor_materiais,
      }),
    [itens, valoresPorTipo],
  );

  const projecaoParaPdf = useMemo(
    () =>
      sincronizarProjecaoComItens({
        ...projecao,
        itens: normalizarItensProjecao(itens),
        observacoes,
      }),
    [projecao, itens, observacoes],
  );

  const persistirProjecao = useCallback(
    async ({ itens: itensPayload, observacoes: obsPayload } = {}) => {
      if (!projecao?.id) return;
      const lista = normalizarItensProjecao(itensPayload ?? itens);
      const obs =
        obsPayload !== undefined
          ? String(obsPayload).trim()
          : observacoes.trim();
      const atualizada = await api.updateProjecao(projecao.id, {
        itens: lista,
        observacoes: obs,
      });
      const sync = sincronizarProjecaoComItens(atualizada);
      setProjecao(sync);
      setItens(normalizarItensProjecao(sync.itens));
      setObservacoes(sync.observacoes ?? "");
      return sync;
    },
    [projecao?.id, itens, observacoes],
  );

  const abrirModalNovoItem = () => setModalItem({ modo: "criar" });
  const abrirModalEditarItem = (item) => setModalItem({ modo: "editar", item });
  const fecharModalItem = () => setModalItem(null);

  const confirmarItemModal = async (item) => {
    const existe = itens.some((i) => i.id === item.id);
    const nextItens = normalizarItensProjecao(
      existe
        ? itens.map((i) => (i.id === item.id ? item : i))
        : [...itens, item],
    );
    fecharModalItem();
    setItens(nextItens);
    try {
      await persistirProjecao({ itens: nextItens });
    } catch (e) {
      console.error("[ProjecaoDetalhe] salvar item:", e);
      alert(e?.message || "Não foi possível salvar o lançamento.");
      await carregar();
    }
  };

  const removerItem = async (itemId) => {
    const nextItens = itens.filter((i) => i.id !== itemId);
    setItens(nextItens);
    try {
      await persistirProjecao({ itens: nextItens });
    } catch (e) {
      console.error("[ProjecaoDetalhe] remover item:", e);
      alert(e?.message || "Não foi possível remover o lançamento.");
      await carregar();
    }
  };

  const salvarObservacoes = async () => {
    try {
      await persistirProjecao();
    } catch (e) {
      console.error("[ProjecaoDetalhe] salvar observações:", e);
      alert(e?.message || "Não foi possível salvar as observações.");
    }
  };

  const salvarDadosBasicos = async (dados) => {
    if (!projecao?.id) return;
    setSalvando(true);
    try {
      const atualizada = await api.updateProjecao(projecao.id, dados);
      setProjecao(sincronizarProjecaoComItens(atualizada));
      setModalEditar(false);
    } catch (e) {
      console.error("[ProjecaoDetalhe] editar básico:", e);
      alert(e?.message || "Não foi possível atualizar a projeção.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirProjecao = async () => {
    if (!projecao?.id) return;
    setSalvando(true);
    try {
      await api.deleteProjecao(projecao.id);
      navigate("/projecoes", { replace: true });
    } catch (e) {
      console.error("[ProjecaoDetalhe] excluir:", e);
      alert(e?.message || "Não foi possível excluir a projeção.");
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
        <div className="px-[5%] py-8">
          <LoadingPainel
            titulo="Carregando projeção"
            descricao="Buscando detalhes da projeção comercial…"
            icon={<FileSpreadsheet className="h-7 w-7" strokeWidth={2} />}
          />
        </div>
      </div>
    );
  }

  if (erro || !projecao) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAFAFA] px-[5%] py-8">
        <div className="rounded-2xl border border-danger-primary/30 bg-danger-soft/40 p-6 text-center text-sm text-danger-primary">
          {erro}
        </div>
        <BaseButton
          variant="outline"
          onClick={() => navigate("/projecoes")}
          className="mt-4"
        >
          Voltar à lista
        </BaseButton>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FAFAFA]">
      <header className="sticky top-0 z-[60] shrink-0 border-b border-border-primary/40 bg-[#FAFAFA]/95 shadow-sm backdrop-blur-sm">
        <div className="flex w-full flex-col sm:flex-row justify-between items-center gap-3 px-[5%] py-3">
          <div className="flex flex-row w-full gap-3">
            <button
              type="button"
              onClick={() => navigate("/projecoes")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-primary/50 bg-white shadow-sm transition hover:border-accent-primary/35"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4 text-text-primary" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                Projeções
              </p>
              <h1 className="truncate text-md font-bold text-text-primary">
                {projecao.nome}
              </h1>
            </div>
          </div>
          <div className="flex w-full gap-2 flex-row sm:justify-end">
            <BaseButton
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setModalEditar(true)}
            >
              Editar
            </BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              icon={<Download className="h-4 w-4" />}
              onClick={() => setPdfPreview(true)}
            >
              PDF
            </BaseButton>
            <BaseButton
              variant="danger"
              size="sm"
              className="w-full sm:w-auto"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setModalExcluir(true)}
            >
              Excluir
            </BaseButton>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 px-[5%] py-6">
        <div className="flex w-full flex-col gap-6">
          <article className={projecaoSecaoClass}>
            <div className={projecaoDetalheHeaderClass}>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex w-full gap-3">
                  <span className={projecaoDetalheIconClass}>
                    <FileSpreadsheet className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                      {projecao.nome}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                      <UserRound className="h-3.5 w-3.5 shrink-0" />
                      {projecao.cliente_nome || "Cliente não informado"}
                    </p>
                    {projecao.endereco_obra ? (
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-text-muted">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{projecao.endereco_obra}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="text-left w-auto sm:text-right">
                  <p className="mt-2 text-xs text-text-muted">
                    Proposta: {formatarDataProjecao(projecao.data_proposta)}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-accent-primary">
                    {formatarMoedaBRL(totalPreview)}
                  </p>
                </div>
              </div>
              {projecao.descricao ? (
                <p className="mt-4 border-t border-border-primary/25 pt-4 text-sm leading-relaxed text-text-muted">
                  {projecao.descricao}
                </p>
              ) : null}
            </div>
          </article>

          <div className={projecaoGrid3Class}>
            <ProjecaoSecaoPainel
              titulo="Documentação"
              descricao="Soma dos itens do tipo Documentação"
              icon={<ScrollText className="h-5 w-5" />}
              iconTheme="blue"
            >
              <label className={labelCampoClass}>Valor (R$)</label>
              <div className={valorSomenteLeituraClass}>
                {formatarMoedaBRL(valoresPorTipo.valor_documentacao)}
              </div>
            </ProjecaoSecaoPainel>

            <ProjecaoSecaoPainel
              titulo="Projeto"
              descricao="Soma dos itens do tipo Projeto"
              icon={<ClipboardList className="h-5 w-5" />}
              iconTheme="purple"
            >
              <label className={labelCampoClass}>Valor (R$)</label>
              <div className={valorSomenteLeituraClass}>
                {formatarMoedaBRL(valoresPorTipo.valor_projeto)}
              </div>
            </ProjecaoSecaoPainel>

            <ProjecaoSecaoPainel
              titulo="Obra"
              descricao="Soma dos itens do tipo Obra"
              icon={<Hammer className="h-5 w-5" />}
              iconTheme="amber"
            >
              <label className={labelCampoClass}>Valor (R$)</label>
              <div className={valorSomenteLeituraClass}>
                {formatarMoedaBRL(valoresPorTipo.valor_obra)}
              </div>
            </ProjecaoSecaoPainel>

            <ProjecaoSecaoPainel
              titulo="Mão de Obra"
              descricao="Soma dos itens do tipo Mão de Obra"
              icon={<HardHat className="h-5 w-5" />}
              iconTheme="indigo"
            >
              <label className={labelCampoClass}>Valor (R$)</label>
              <div className={valorSomenteLeituraClass}>
                {formatarMoedaBRL(valoresPorTipo.valor_mao_de_obra)}
              </div>
            </ProjecaoSecaoPainel>

            <ProjecaoSecaoPainel
              titulo="Materiais"
              descricao="Soma dos itens do tipo Materiais"
              icon={<Package className="h-5 w-5" />}
              iconTheme="purple"
            >
              <label className={labelCampoClass}>Valor (R$)</label>
              <div className={valorSomenteLeituraClass}>
                {formatarMoedaBRL(valoresPorTipo.valor_materiais)}
              </div>
            </ProjecaoSecaoPainel>

            <ProjecaoSecaoPainel
              titulo="Total da proposta"
              descricao={`${itens.length} lançamento(s) cadastrado(s)`}
              icon={<Wallet className="h-5 w-5" />}
              iconTheme="emerald"
            >
              <label className={labelCampoClass}>Valor total (R$)</label>
              <div className={valorSomenteLeituraClass}>
                {formatarMoedaBRL(totalPreview)}
              </div>
            </ProjecaoSecaoPainel>
          </div>

          <ProjecaoSecaoPainel
            titulo="Lançamento de itens"
            icon={<Plus className="h-5 w-5" />}
            iconTheme="emerald"
            acoes={
              <BaseButton
                variant="primary"
                size="sm"
                className="text-xs sm:text-sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={abrirModalNovoItem}
              >
                Novo
              </BaseButton>
            }
          >
            {itens.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border-primary/40 bg-[#FAFAFA]/80 px-4 py-10 text-center text-sm text-text-muted">
                <p>Nenhum lançamento cadastrado.</p>
                <BaseButton
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={abrirModalNovoItem}
                >
                  Novo
                </BaseButton>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border-primary/30">
                <table className="w-full min-w-[900px] text-center text-sm">
                  <thead>
                    <tr className={projecaoTabelaHeadClass}>
                      <th className="w-36 px-3 py-2.5 font-semibold">Tipo</th>
                      <th className="px-3 py-2.5 font-semibold">Descrição</th>
                      <th className="w-32 px-3 py-2.5 font-semibold">Início</th>
                      <th className="w-32 px-3 py-2.5 font-semibold">Fim</th>
                      <th className="w-24 px-3 py-2.5 font-semibold">Qtd.</th>
                      <th className="w-32 px-3 py-2.5 font-semibold">
                        V. unit.
                      </th>
                      <th className="w-32 px-3 py-2.5 font-semibold">Total</th>
                      <th className="w-24 px-2 py-2.5 text-center font-semibold">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={
                          idx % 2 === 1
                            ? "border-t border-border-primary/20 bg-[#FAFAFA]/60"
                            : "border-t border-border-primary/20 bg-white"
                        }
                      >
                        <td className="px-3 py-2 text-text-primary">
                          {labelTipoProjecaoItem(item.tipo)}
                        </td>
                        <td className="px-3 py-2 text-text-primary">
                          {item.descricao || "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap tabular-nums text-text-primary">
                          {formatarDataProjecao(item.data_inicio)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap tabular-nums text-text-primary">
                          {formatarDataProjecao(item.data_fim)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-text-primary">
                          {item.quantidade}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-text-primary">
                          R$ {formatarMoedaProjecao(item.valor_unitario)}
                        </td>
                        <td className="px-3 py-2 tabular-nums font-semibold text-text-primary">
                          R$ {formatarMoedaProjecao(item.valor_total)}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => abrirModalEditarItem(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-slate-100 hover:text-text-primary"
                              aria-label="Editar lançamento"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removerItem(item.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger-primary transition hover:bg-danger-soft/50"
                              aria-label="Remover lançamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ProjecaoSecaoPainel>

          <ProjecaoSecaoPainel
            titulo="Observações"
            descricao="Condições comerciais e notas finais da proposta"
            icon={<ScrollText className="h-5 w-5" />}
            iconTheme="indigo"
          >
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              onBlur={salvarObservacoes}
              rows={4}
              className={textareaCampoClass}
              placeholder="Condições comerciais, prazos, observações finais…"
            />
          </ProjecaoSecaoPainel>
        </div>
      </main>

      <ModalProjecaoItem
        isOpen={Boolean(modalItem)}
        onClose={fecharModalItem}
        onSave={confirmarItemModal}
        itemEdicao={modalItem?.modo === "editar" ? modalItem.item : null}
      />

      <ModalProjecao
        isOpen={modalEditar}
        onClose={() => !salvando && setModalEditar(false)}
        onSave={salvarDadosBasicos}
        projecaoEdicao={projecao}
        salvando={salvando}
      />

      <BaseModal
        isOpen={modalExcluir}
        onClose={() => !salvando && setModalExcluir(false)}
        title="Excluir projeção"
        size="sm"
      >
        <p className="text-sm text-text-muted">
          Excluir permanentemente{" "}
          <strong className="text-text-primary">{projecao.nome}</strong>?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            variant="outline"
            onClick={() => setModalExcluir(false)}
            disabled={salvando}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={excluirProjecao}
            isLoading={salvando}
          >
            Excluir
          </BaseButton>
        </div>
      </BaseModal>

      <PdfPreviewModal
        isOpen={pdfPreview}
        onClose={() => setPdfPreview(false)}
        titulo="Proposta comercial"
        nomeFallback="proposta.pdf"
        gerador={() => gerarPdfProjecao(projecaoParaPdf)}
      />
    </div>
  );
}
