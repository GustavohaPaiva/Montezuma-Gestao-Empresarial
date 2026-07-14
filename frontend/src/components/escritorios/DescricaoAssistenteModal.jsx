import { useEffect, useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import ModalPortal from "../gerais/ModalPortal";
import { melhorarTextoPortugues } from "../../utils/textoPortuguesAssistant";
import {
  MAX_LINHAS_DESCRICAO,
  limitarLinhasDescricao,
} from "../../utils/orcamentoPropostaUtils";
import { orcTextareaClass } from "../../pages/escritorios/orcamentosUi";

export default function DescricaoAssistenteModal({
  isOpen,
  textoInicial,
  onClose,
  onAplicar,
  temaClasse = "theme-vogelkop",
}) {
  const [rascunho, setRascunho] = useState(textoInicial || "");
  const [sugerido, setSugerido] = useState("");
  const [aviso, setAviso] = useState("");
  const [modelo, setModelo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modo, setModo] = useState("editar");

  useEffect(() => {
    if (!isOpen) return;
    setRascunho(limitarLinhasDescricao(textoInicial || ""));
    setSugerido("");
    setAviso("");
    setModelo("");
    setModo("editar");
  }, [isOpen, textoInicial]);

  if (!isOpen) return null;

  const linhas = rascunho.replace(/\r\n/g, "\n").split("\n").length;

  const handleChange = (valor) => {
    setRascunho(limitarLinhasDescricao(valor));
  };

  const gerarSugestao = async () => {
    setCarregando(true);
    setAviso("");
    try {
      const resultado = await melhorarTextoPortugues(rascunho);
      setSugerido(resultado.sugerido || "");
      setAviso(resultado.aviso || "");
      setModelo(resultado.modelo || "");
      setModo("revisar");
    } catch (e) {
      console.error(e);
      setAviso("Não foi possível gerar sugestão. Edite o texto manualmente.");
    } finally {
      setCarregando(false);
    }
  };

  const aplicar = (texto) => {
    onAplicar(limitarLinhasDescricao(texto));
    onClose();
  };

  return (
    <ModalPortal>
      <div
        className={`${temaClasse} fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md`}
      >
        <div className="animate-premium-reveal relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-esc-border bg-esc-card shadow-[0_0_40px_-15px_var(--color-esc-destaque)]">
          <div className="flex items-center justify-between border-b border-esc-border px-5 py-4">
            <div>
              <h3 className="text-base font-bold text-esc-text">
                Assistente de descrição
              </h3>
              <p className="mt-0.5 text-xs text-esc-muted">
                Reescrita formal com Google Gemini (gratuito) — revise antes de
                aplicar (máx. {MAX_LINHAS_DESCRICAO} linhas).
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-esc-bg text-esc-muted transition hover:bg-esc-bg hover:text-esc-text"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-5">
            {modo === "editar" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-esc-muted">
                    Texto original
                  </label>
                  <textarea
                    rows={MAX_LINHAS_DESCRICAO}
                    value={rascunho}
                    onChange={(e) => handleChange(e.target.value)}
                    className={orcTextareaClass}
                    placeholder="Escreva o resumo da proposta…"
                  />
                  <p className="mt-1 text-[11px] text-esc-muted">
                    {linhas}/{MAX_LINHAS_DESCRICAO} linhas
                  </p>
                </div>
                {aviso ? (
                  <p className="rounded-lg border border-esc-border bg-esc-bg px-3 py-2 text-xs text-esc-muted">
                    {aviso}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-esc-muted">
                    Original
                  </p>
                  <div className="min-h-[10rem] whitespace-pre-wrap rounded-xl border border-esc-border bg-esc-bg p-3 text-sm text-esc-muted">
                    {rascunho || "—"}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-esc-destaque">
                    Sugestão (editável)
                  </p>
                  <textarea
                    rows={MAX_LINHAS_DESCRICAO}
                    value={sugerido}
                    onChange={(e) =>
                      setSugerido(limitarLinhasDescricao(e.target.value))
                    }
                    className={orcTextareaClass}
                  />
                </div>
              </div>
            )}

            {modo === "revisar" && aviso ? (
              <p className="rounded-lg border border-esc-destaque/20 bg-esc-destaque/10 px-3 py-2 text-xs text-esc-muted">
                {aviso}
                {modelo ? ` Modelo: ${modelo}.` : ""}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-esc-border bg-esc-bg px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-esc-border px-4 py-2 text-sm font-semibold text-esc-muted transition hover:bg-esc-bg"
            >
              Cancelar
            </button>
            {modo === "editar" ? (
              <>
                <button
                  type="button"
                  onClick={() => aplicar(rascunho)}
                  className="rounded-xl border border-esc-border bg-esc-bg px-4 py-2 text-sm font-semibold text-esc-text transition hover:bg-esc-bg"
                >
                  Usar sem revisar
                </button>
                <button
                  type="button"
                  onClick={() => void gerarSugestao()}
                  disabled={carregando || !rascunho.trim()}
                  className="inline-flex items-center gap-2 rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 px-4 py-2 text-sm font-bold text-esc-destaque transition hover:bg-esc-destaque/30 disabled:opacity-50"
                >
                  {carregando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Melhorar com IA
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModo("editar")}
                  className="rounded-xl border border-esc-border bg-esc-bg px-4 py-2 text-sm font-semibold text-esc-text transition hover:bg-esc-bg"
                >
                  Voltar ao original
                </button>
                <button
                  type="button"
                  onClick={() => aplicar(sugerido)}
                  disabled={!sugerido.trim()}
                  className="rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 px-4 py-2 text-sm font-bold text-esc-destaque transition hover:bg-esc-destaque/30 disabled:opacity-50"
                >
                  Aplicar sugestão
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
