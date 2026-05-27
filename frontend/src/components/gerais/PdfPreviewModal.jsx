import { useCallback, useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import ModalPortal from "./ModalPortal";
import BaseButton from "./BaseButton";
import { baixarPdfBlob } from "../../utils/downloadPdfBlob";

/**
 * Visualização de PDF dentro do sistema (tema Montezuma).
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   titulo?: string,
 *   gerador: () => Promise<{ blob: Blob, nomePadrao?: string } | Blob | void>,
 *   nomeFallback?: string,
 * }} props
 */
export default function PdfPreviewModal({
  isOpen,
  onClose,
  titulo = "Visualizar documento",
  gerador,
  nomeFallback = "documento.pdf",
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState(nomeFallback);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [baixando, setBaixando] = useState(false);

  const limparUrl = useCallback(() => {
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!isOpen || typeof gerador !== "function") {
      limparUrl();
      setErro(null);
      setCarregando(false);
      return undefined;
    }

    let cancelado = false;

    (async () => {
      setCarregando(true);
      setErro(null);
      limparUrl();
      try {
        const resultado = await gerador();
        if (cancelado) return;
        const blob = resultado?.blob ?? resultado;
        if (!blob || !(blob instanceof Blob)) {
          throw new Error("Não foi possível gerar o PDF.");
        }
        const nome = resultado?.nomePadrao || nomeFallback;
        setNomeArquivo(nome);
        setPdfUrl(URL.createObjectURL(blob));
      } catch (e) {
        if (!cancelado) {
          console.error("[PdfPreviewModal]", e);
          setErro(e?.message || "Erro ao gerar o documento.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [isOpen, gerador, nomeFallback, limparUrl]);

  useEffect(
    () => () => {
      limparUrl();
    },
    [limparUrl],
  );

  const handleBaixar = async () => {
    if (!pdfUrl) return;
    setBaixando(true);
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      await baixarPdfBlob(blob, nomeArquivo);
    } catch (e) {
      console.error("[PdfPreviewModal] download:", e);
    } finally {
      setBaixando(false);
    }
  };

  const handleAbrirNovaAba = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex flex-col bg-slate-900/40 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold uppercase tracking-tight text-slate-800 sm:text-base">
                {titulo}
              </h2>
              <p className="truncate text-xs text-slate-500">{nomeArquivo}</p>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
            <BaseButton
              type="button"
              variant="outline"
              size="md"
              onClick={handleAbrirNovaAba}
              disabled={!pdfUrl || carregando}
              icon={<ExternalLink className="h-4 w-4" aria-hidden />}
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              Nova aba
            </BaseButton>
            <BaseButton
              type="button"
              variant="primary"
              size="md"
              onClick={handleBaixar}
              disabled={!pdfUrl || carregando}
              isLoading={baixando}
              icon={
                !baixando ? (
                  <Download className="h-4 w-4" aria-hidden />
                ) : undefined
              }
              className="min-h-[44px] flex-1 shadow-[0_4px_14px_rgba(220,59,11,0.25)] sm:flex-initial"
            >
              {baixando ? "Salvando…" : "Baixar PDF"}
            </BaseButton>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 bg-gradient-to-b from-[#F4F4F5] to-[#E4E4E7] p-3 sm:p-4">
          {carregando && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#F4F4F5]/90">
              <Loader2
                className="h-10 w-10 animate-spin text-accent-primary"
                aria-hidden
              />
              <p className="text-sm font-semibold text-slate-700">
                Gerando documento…
              </p>
            </div>
          )}

          {erro && !carregando && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-lg shadow-red-900/5">
                <p className="text-base font-semibold text-red-600">{erro}</p>
                <BaseButton
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="mt-4"
                >
                  Fechar
                </BaseButton>
              </div>
            </div>
          )}

          {pdfUrl && !erro && (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              title={titulo}
              className="h-full w-full rounded-xl border border-slate-200/80 bg-white shadow-md ring-1 ring-black/[0.04]"
            />
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
