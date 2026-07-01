import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileDown,
  Loader2,
} from "lucide-react";
import Navbar from "../../components/navbar/Navbar";
import BaseButton from "../../components/gerais/BaseButton";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import {
  OS_ESCOPO_OPCOES,
  OS_FORMAS_PAGAMENTO,
  OS_STATUS_LABEL,
} from "../../constants/ordemServico";
import {
  podeAcessarModuloOrdemServico,
  podeConcluirOrdemServico,
  usuarioVeOrdemServico,
} from "../../utils/ordemServicoPermissions";
import { gerarPdfOrdemServico } from "../../utils/ordemServicoPdf";
import {
  formatarDataListaOS,
  getOrdensServicoBasePath,
  resolveEscritorioIdOrdemServico,
  temaOrdemServico,
} from "./ordensServicoUtils";

function Campo({ label, valor, isVk }) {
  return (
    <div>
      <p
        className={
          isVk
            ? "text-[10px] font-semibold uppercase tracking-wider text-esc-muted"
            : "text-[10px] font-semibold uppercase tracking-wider text-text-muted"
        }
      >
        {label}
      </p>
      <p
        className={
          isVk
            ? "mt-0.5 text-sm text-esc-text"
            : "mt-0.5 text-sm text-text-primary"
        }
      >
        {valor || "—"}
      </p>
    </div>
  );
}

function labelsFromIds(ids, opcoes) {
  if (!Array.isArray(ids) || ids.length === 0) return "—";
  const map = Object.fromEntries(opcoes.map((o) => [o.id, o.label]));
  return ids.map((id) => map[id] || id).join(", ");
}

export default function OrdemServicoDetalhe({ variant = "montezuma" }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVk = variant === "vogelkop";
  const escritorioId = resolveEscritorioIdOrdemServico(variant, user?.escritorio_id);
  const basePath = getOrdensServicoBasePath(variant);
  const tema = temaOrdemServico(variant);

  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [concluindo, setConcluindo] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);

  const autorizado = podeAcessarModuloOrdemServico(user);

  const carregar = useCallback(async () => {
    if (!id || !autorizado) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = await api.getOrdemServicoById(id);
      if (!row || !usuarioVeOrdemServico(user, row)) {
        setErro("Ordem de serviço não encontrada ou acesso negado.");
        setOs(null);
      } else {
        setOs(row);
        setErro(null);
      }
    } catch (e) {
      console.error(e);
      setErro(e?.message || "Erro ao carregar a ordem de serviço.");
      setOs(null);
    } finally {
      setLoading(false);
    }
  }, [id, autorizado, user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!autorizado && user) {
      navigate(isVk ? "/escritorio/vogelkop" : "/", { replace: true });
    }
  }, [autorizado, user, navigate, isVk]);

  const handleConcluir = async () => {
    if (!os?.id) return;
    setConcluindo(true);
    try {
      const atualizada = await api.concluirOrdemServico(os.id, user.id);
      setOs(atualizada);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível concluir a ordem de serviço.");
    } finally {
      setConcluindo(false);
    }
  };

  const handlePdf = () => {
    setPdfPreview({
      titulo: `Ordem de Serviço Nº ${os?.numero ?? ""}`,
      nomeFallback: "Ordem_Servico.pdf",
      gerador: async () =>
        gerarPdfOrdemServico({
          os,
          escritorioId: os.escritorio_id || escritorioId,
          retornarBlob: true,
        }),
    });
  };

  if (!autorizado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        A redirecionar…
      </div>
    );
  }

  const podeConcluir = podeConcluirOrdemServico(user, os);
  const concluida = os?.status === "concluida";

  const detalheContent = loading ? (
    <LoadingPainel
      titulo="Carregando ordem de serviço"
      descricao="Aguarde um momento."
    />
  ) : erro || !os ? (
    <p
      className={
        isVk
          ? "text-sm text-rose-300"
          : "text-sm text-danger-primary"
      }
    >
      {erro || "Ordem não encontrada."}
    </p>
  ) : (
    <div
      className={
        isVk
          ? "space-y-6 rounded-2xl border border-white/10 bg-esc-card/40 p-6 backdrop-blur-md"
          : "space-y-6 rounded-2xl border border-border-primary/30 bg-white p-6 shadow-sm"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className={
              isVk
                ? "text-xl font-bold text-esc-text"
                : "text-xl font-bold text-text-primary"
            }
          >
            OS Nº {os.numero}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Status: {OS_STATUS_LABEL[os.status] || os.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BaseButton type="button" variant="outline" onClick={handlePdf}>
            <FileDown className="mr-2 h-4 w-4" aria-hidden />
            PDF
          </BaseButton>
          {podeConcluir && !concluida ? (
            <BaseButton
              type="button"
              onClick={handleConcluir}
              disabled={concluindo}
              className={isVk ? "!bg-emerald-600 !text-white" : ""}
            >
              {concluindo ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
              )}
              Marcar como concluída
            </BaseButton>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="Data de Emissão"
          valor={formatarDataListaOS(os.data_emissao)}
          isVk={isVk}
        />
        <Campo
          label="Responsável Técnico"
          valor={os.responsavel_tecnico}
          isVk={isVk}
        />
        <Campo
          label="Designado para"
          valor={os.responsavel?.nome || "Somente PDF"}
          isVk={isVk}
        />
        <Campo label="Cliente" valor={os.cliente_nome} isVk={isVk} />
        <Campo label="Telefone" valor={os.cliente_telefone} isVk={isVk} />
        <Campo label="E-mail" valor={os.cliente_email} isVk={isVk} />
        <div className="sm:col-span-2">
          <Campo
            label="Endereço do Projeto"
            valor={os.endereco_projeto}
            isVk={isVk}
          />
        </div>
      </div>

      <div>
        <Campo label="Objeto do Serviço" valor={os.objeto_servico} isVk={isVk} />
      </div>

      <div>
        <Campo
          label="Escopo Contratado"
          valor={labelsFromIds(os.escopo, OS_ESCOPO_OPCOES)}
          isVk={isVk}
        />
        {os.escopo_outro ? (
          <p className="mt-1 text-sm text-text-muted">Outro: {os.escopo_outro}</p>
        ) : null}
      </div>

      <div>
        <Campo
          label="Descrição dos Serviços"
          valor={os.descricao_servicos}
          isVk={isVk}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="Data de Início"
          valor={formatarDataListaOS(os.data_inicio)}
          isVk={isVk}
        />
        <Campo
          label="Entrega Prevista"
          valor={formatarDataListaOS(os.data_entrega_prevista)}
          isVk={isVk}
        />
      </div>

      {os.observacoes_prazos ? (
        <Campo
          label="Observações (Prazos)"
          valor={os.observacoes_prazos}
          isVk={isVk}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="Valor Total"
          valor={
            os.valor_total != null
              ? Number(os.valor_total).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : "—"
          }
          isVk={isVk}
        />
        <Campo
          label="Forma de Pagamento"
          valor={labelsFromIds(os.formas_pagamento, OS_FORMAS_PAGAMENTO)}
          isVk={isVk}
        />
      </div>

      {os.observacoes_gerais ? (
        <Campo
          label="Observações Gerais"
          valor={os.observacoes_gerais}
          isVk={isVk}
        />
      ) : null}

      {concluida ? (
        <p className="text-sm text-emerald-600">
          Concluída em {formatarDataListaOS(os.data_conclusao)}
          {os.concluido_por?.nome ? ` por ${os.concluido_por.nome}` : ""}
        </p>
      ) : null}
    </div>
  );

  return (
    <>
      {isVk ? (
        <div className="py-4">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-esc-muted transition hover:text-esc-text"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </button>
          <h1 className="mb-6 text-2xl font-bold text-esc-text">
            Detalhe da OS
          </h1>
          {detalheContent}
        </div>
      ) : (
        <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
          <Navbar title={`OS Nº ${os?.numero ?? "—"}`} />
          <main className="w-full px-[5%] pb-12 pt-2">{detalheContent}</main>
        </div>
      )}

      <PdfPreviewModal
        isOpen={Boolean(pdfPreview)}
        onClose={() => setPdfPreview(null)}
        titulo={pdfPreview?.titulo}
        gerador={pdfPreview?.gerador}
        nomeFallback={pdfPreview?.nomeFallback}
        temaClasse={tema}
      />
    </>
  );
}
