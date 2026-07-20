import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Loader2,
  Sparkles,
  Type,
} from "lucide-react";
import BaseButton from "../../../components/gerais/BaseButton";
import BaseModal from "../../../components/gerais/BaseModal";
import { melhorarTextoPortugues } from "../../../utils/textoPortuguesAssistant";
import { sanitizeResumoObraHtml } from "../../../utils/sanitizeHtml";
import { resumoObraTemConteudo } from "../relatoriosDiretoriaUtils";
import {
  relatorioSecaoAccentLineClass,
  relatorioSecaoLabelAccentClass,
  relatorioSecaoTituloClass,
} from "../relatoriosDiretoriaUi";

const toolbarBtnClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-text-muted transition hover:border-border-primary/40 hover:bg-[#FAFAFA] hover:text-text-primary disabled:opacity-40";

const toolbarBtnActiveClass =
  "border-accent-primary/30 bg-accent-primary/10 text-accent-primary";

function ToolbarButton({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`${toolbarBtnClass} ${active ? toolbarBtnActiveClass : ""}`}
    >
      {children}
    </button>
  );
}

function HtmlPreview({ html, className = "" }) {
  const safe = sanitizeResumoObraHtml(html);
  if (!resumoObraTemConteudo(safe)) {
    return (
      <p className="text-sm italic text-text-muted">Nenhum conteúdo.</p>
    );
  }
  return (
    <div
      className={`prose-resumo-obra text-sm leading-relaxed text-text-primary ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export default function RelatorioObraResumoCampo({
  value,
  onChange,
  disabled = false,
  salvando = false,
}) {
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [rascunhoHtml, setRascunhoHtml] = useState("");
  const [sugeridoHtml, setSugeridoHtml] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modo, setModo] = useState("editar");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
    ],
    content: value || "",
    editable: !disabled && !salvando,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose-resumo-obra min-h-[220px] max-w-none px-3 py-3 text-sm leading-relaxed text-text-primary outline-none sm:min-h-[280px] sm:text-base",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const atual = editor.getHTML();
    const próximo = value || "";
    if (próximo !== atual) {
      editor.commands.setContent(próximo, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled && !salvando);
  }, [editor, disabled, salvando]);

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
    if (editor) editor.commands.setContent(safe || "", { emitUpdate: false });
    setAssistenteAberto(false);
  };

  const temConteudo = resumoObraTemConteudo(value);

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-2xl border border-border-primary/35 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6">
        <div className="mb-4">
          <span className={relatorioSecaoLabelAccentClass}>Texto livre</span>
          <h3 className={`${relatorioSecaoTituloClass} mt-1`}>Resumo geral</h3>
          <div className={relatorioSecaoAccentLineClass} aria-hidden />
          <p className="mt-2 text-xs text-text-muted sm:text-sm">
            Descreva o andamento da semana. Use negrito, listas e títulos para
            organizar o texto.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border-primary/30 bg-white">
          <div className="flex flex-wrap items-center gap-0.5 border-b border-border-primary/20 bg-[#FAFAFA]/80 px-2 py-1.5">
            <ToolbarButton
              title="Negrito"
              disabled={!editor || disabled}
              active={editor?.isActive("bold")}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" strokeWidth={2.25} />
            </ToolbarButton>
            <ToolbarButton
              title="Lista"
              disabled={!editor || disabled}
              active={editor?.isActive("bulletList")}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Lista numerada"
              disabled={!editor || disabled}
              active={editor?.isActive("orderedList")}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-border-primary/30" aria-hidden />
            <ToolbarButton
              title="Título grande"
              disabled={!editor || disabled}
              active={editor?.isActive("heading", { level: 2 })}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Título médio"
              disabled={!editor || disabled}
              active={editor?.isActive("heading", { level: 3 })}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Parágrafo"
              disabled={!editor || disabled}
              active={editor?.isActive("paragraph")}
              onClick={() => editor?.chain().focus().setParagraph().run()}
            >
              <Type className="h-4 w-4" />
            </ToolbarButton>
          </div>
          <EditorContent editor={editor} />
        </div>

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
                  <HtmlPreview html={rascunhoHtml} />
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
                  disabled={!resumoObraTemConteudo(rascunhoHtml) || carregando}
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
                  <HtmlPreview html={sugeridoHtml} />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <BaseButton variant="outline" onClick={() => setModo("editar")}>
                  Voltar
                </BaseButton>
                <BaseButton
                  variant="primary"
                  onClick={() => aplicar(sugeridoHtml)}
                  disabled={!resumoObraTemConteudo(sugeridoHtml)}
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
