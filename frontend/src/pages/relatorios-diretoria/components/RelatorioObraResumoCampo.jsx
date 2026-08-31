import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import BaseButton from "../../../components/gerais/BaseButton";
import BaseModal from "../../../components/gerais/BaseModal";
import EditorTextoLivre, {
  HtmlTextoLivre,
  textoLivreTemConteudo,
} from "../../../components/gerais/EditorTextoLivre";
import { melhorarTextoPortugues } from "../../../utils/textoPortuguesAssistant";
import { sanitizeResumoObraHtml } from "../../../utils/sanitizeHtml";
import {
  relatorioSecaoAccentLineClass,
  relatorioSecaoLabelAccentClass,
  relatorioSecaoTituloClass,
} from "../relatoriosDiretoriaUi";

export default function RelatorioObraResumoCampo({
  value,
  onChange,
  disabled = false,
  salvando = false,
}) {
  const editorRef = useRef(null);
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [rascunhoHtml, setRascunhoHtml] = useState("");
  const [sugeridoHtml, setSugeridoHtml] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modo, setModo] = useState("editar");

  useEffect(() => {
    if (!assistenteAberto) return;
    setRascunhoHtml(value || "");
    setSugeridoHtml("");
    setAviso("");
    setModo("editar");
  }, [assistenteAberto, value]);

  const gerarSugestao = async () => {
    setCarregando(true);
    setAviso("");
    try {
      const resultado = await melhorarTextoPortugues(rascunhoHtml, {
        contexto: "relatorio_obra",
      });
      setSugeridoHtml(sanitizeResumoObraHtml(resultado.sugerido || ""));
      setAviso(resultado.aviso || "");
      setModo("revisar");
    } catch (e) {
      console.error(e);
      setAviso("Não foi possível gerar sugestão. Edite o texto manualmente.");
    } finally {
      setCarregando(false);
    }
  };

  const aplicar = (html) => {
    const safe = sanitizeResumoObraHtml(html);
    onChange(safe);
    editorRef.current?.commands.setContent(safe || "", { emitUpdate: false });
    setAssistenteAberto(false);
  };

  const temConteudo = textoLivreTemConteudo(value);
  const editorDisabled = disabled || salvando;

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-2xl border border-border-primary/35 bg-white p-5 shadow-sm ring-1 ring-slate-900/3 sm:p-6">
        <div className="mb-4">
          <span className={relatorioSecaoLabelAccentClass}>Texto livre</span>
          <h3 className={`${relatorioSecaoTituloClass} mt-1`}>Resumo geral</h3>
          <div className={relatorioSecaoAccentLineClass} aria-hidden />
          <p className="mt-2 text-xs text-text-muted sm:text-sm">
            Cole o texto pronto, selecione o trecho desejado e use a barra para
            aplicar título, lista, negrito e alinhamento — só no que estiver
            selecionado. Use **negrito** ao colar texto do WhatsApp ou e-mail.
          </p>
        </div>

        <EditorTextoLivre
          value={value}
          onChange={onChange}
          disabled={editorDisabled}
          variant="completa"
          placeholder="Escreva o resumo da semana… Selecione um trecho e use a barra para formatar."
          onEditorReady={(ed) => {
            editorRef.current = ed;
          }}
        />

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {!disabled ? (
            <BaseButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssistenteAberto(true)}
              disabled={!temConteudo || salvando}
              icon={<Sparkles className="h-4 w-4" />}
            >
              Corretor com IA
            </BaseButton>
          ) : null}
        </div>
      </section>

      <BaseModal
        isOpen={assistenteAberto}
        onClose={() => setAssistenteAberto(false)}
        title="Corretor com IA"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            Corrige apenas ortografia e gramática, preservando listas, negrito e
            títulos. Revise antes de aplicar.
          </p>

          {modo === "editar" ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Texto original
                </label>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-border-primary/30 bg-[#FAFAFA]/60 px-4 py-3">
                  <HtmlTextoLivre
                    html={rascunhoHtml}
                    emptyMessage="Nenhum conteúdo."
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <BaseButton
                  variant="outline"
                  onClick={() => setAssistenteAberto(false)}
                >
                  Cancelar
                </BaseButton>
                <BaseButton
                  variant="primary"
                  onClick={gerarSugestao}
                  disabled={!textoLivreTemConteudo(rascunhoHtml) || carregando}
                  icon={
                    carregando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )
                  }
                >
                  {carregando ? "Corrigindo…" : "Corrigir com IA"}
                </BaseButton>
              </div>
            </>
          ) : (
            <>
              {aviso ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                  {aviso}
                </p>
              ) : null}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Sugestão
                </label>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-border-primary/30 bg-[#FAFAFA]/60 px-4 py-3">
                  <HtmlTextoLivre
                    html={sugeridoHtml}
                    emptyMessage="Nenhum conteúdo."
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <BaseButton variant="outline" onClick={() => setModo("editar")}>
                  Voltar
                </BaseButton>
                <BaseButton
                  variant="primary"
                  onClick={() => aplicar(sugeridoHtml)}
                  disabled={!textoLivreTemConteudo(sugeridoHtml)}
                >
                  Aplicar sugestão
                </BaseButton>
              </div>
            </>
          )}
        </div>
      </BaseModal>
    </>
  );
}
