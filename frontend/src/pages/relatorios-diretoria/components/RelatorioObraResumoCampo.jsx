import { useEffect, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  RemoveFormatting,
  Sparkles,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import BaseButton from "../../../components/gerais/BaseButton";
import BaseModal from "../../../components/gerais/BaseModal";
import { melhorarTextoPortugues } from "../../../utils/textoPortuguesAssistant";
import { sanitizeResumoObraHtml } from "../../../utils/sanitizeHtml";
import { resumoObraTemConteudo } from "../relatoriosDiretoriaUtils";
import {
  normalizePastedHtml,
  normalizePastedPlainText,
  runBlockCommand,
} from "../resumoObraEditor";
import {
  relatorioSecaoAccentLineClass,
  relatorioSecaoLabelAccentClass,
  relatorioSecaoTituloClass,
} from "../relatoriosDiretoriaUi";

const toolbarBtnClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-text-muted transition hover:border-border-primary/40 hover:bg-[#FAFAFA] hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40";

const toolbarBtnActiveClass =
  "border-accent-primary/30 bg-accent-primary/10 text-accent-primary";

function ToolbarButton({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={Boolean(active)}
      disabled={disabled}
      // Impede que o clique na toolbar roube o foco e a seleção do editor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`${toolbarBtnClass} ${active ? toolbarBtnActiveClass : ""}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span className="mx-1 h-5 w-px shrink-0 bg-border-primary/30" aria-hidden />
  );
}

function HtmlPreview({ html, className = "" }) {
  const safe = sanitizeResumoObraHtml(html);
  if (!resumoObraTemConteudo(safe)) {
    return <p className="text-sm italic text-text-muted">Nenhum conteúdo.</p>;
  }
  return (
    <div
      className={`prose-resumo-obra text-sm leading-relaxed text-text-primary ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

function ResumoToolbar({ editor, disabled }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) {
        return {
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          h1: false,
          h2: false,
          h3: false,
          paragraph: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          alignLeft: false,
          alignCenter: false,
          alignRight: false,
          canUndo: false,
          canRedo: false,
        };
      }
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        strike: ed.isActive("strike"),
        h1: ed.isActive("heading", { level: 1 }),
        h2: ed.isActive("heading", { level: 2 }),
        h3: ed.isActive("heading", { level: 3 }),
        paragraph: ed.isActive("paragraph"),
        bulletList: ed.isActive("bulletList"),
        orderedList: ed.isActive("orderedList"),
        blockquote: ed.isActive("blockquote"),
        alignLeft: ed.isActive({ textAlign: "left" }),
        alignCenter: ed.isActive({ textAlign: "center" }),
        alignRight: ed.isActive({ textAlign: "right" }),
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo(),
      };
    },
  });

  if (!editor || !active) return null;

  const runMark = (command) => {
    command(editor.chain().focus()).run();
  };

  const runBlock = (command) => {
    runBlockCommand(editor, command);
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border-primary/20 bg-[#FAFAFA]/80 px-2 py-1.5">
      <ToolbarButton
        title="Desfazer (Ctrl+Z)"
        disabled={disabled || !active.canUndo}
        onClick={() => runMark((c) => c.undo())}
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Refazer (Ctrl+Shift+Z)"
        disabled={disabled || !active.canRedo}
        onClick={() => runMark((c) => c.redo())}
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Negrito (Ctrl+B)"
        disabled={disabled}
        active={active.bold}
        onClick={() => runMark((c) => c.toggleBold())}
      >
        <Bold className="h-4 w-4" strokeWidth={2.25} />
      </ToolbarButton>
      <ToolbarButton
        title="Itálico (Ctrl+I)"
        disabled={disabled}
        active={active.italic}
        onClick={() => runMark((c) => c.toggleItalic())}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Sublinhado (Ctrl+U)"
        disabled={disabled}
        active={active.underline}
        onClick={() => runMark((c) => c.toggleUnderline())}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Tachado"
        disabled={disabled}
        active={active.strike}
        onClick={() => runMark((c) => c.toggleStrike())}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Título 1 — aplica ao trecho selecionado"
        disabled={disabled}
        active={active.h1}
        onClick={() => runBlock((c) => c.toggleHeading({ level: 1 }))}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Título 2 — aplica ao trecho selecionado"
        disabled={disabled}
        active={active.h2}
        onClick={() => runBlock((c) => c.toggleHeading({ level: 2 }))}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Título 3 — aplica ao trecho selecionado"
        disabled={disabled}
        active={active.h3}
        onClick={() => runBlock((c) => c.toggleHeading({ level: 3 }))}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Parágrafo"
        disabled={disabled}
        active={active.paragraph}
        onClick={() => runBlock((c) => c.setParagraph())}
      >
        <Type className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Lista com marcadores"
        disabled={disabled}
        active={active.bulletList}
        onClick={() => runBlock((c) => c.toggleBulletList())}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Lista numerada"
        disabled={disabled}
        active={active.orderedList}
        onClick={() => runBlock((c) => c.toggleOrderedList())}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Citação"
        disabled={disabled}
        active={active.blockquote}
        onClick={() => runBlock((c) => c.toggleBlockquote())}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Alinhar à esquerda"
        disabled={disabled}
        active={active.alignLeft}
        onClick={() => runBlock((c) => c.setTextAlign("left"))}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Centralizar"
        disabled={disabled}
        active={active.alignCenter}
        onClick={() => runBlock((c) => c.setTextAlign("center"))}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Alinhar à direita"
        disabled={disabled}
        active={active.alignRight}
        onClick={() => runBlock((c) => c.setTextAlign("right"))}
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Limpar formatação"
        disabled={disabled}
        onClick={() =>
          runBlock((c) => c.unsetAllMarks().clearNodes().setParagraph())
        }
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>
    </div>
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
        heading: { levels: [1, 2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      Placeholder.configure({
        placeholder:
          "Escreva o resumo da semana… Selecione um trecho e use a barra para formatar.",
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
      transformPastedText: normalizePastedPlainText,
      transformPastedHTML: normalizePastedHtml,
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
  const toolbarDisabled = disabled || salvando;

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
            selecionado.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border-primary/30 bg-white">
          <ResumoToolbar editor={editor} disabled={toolbarDisabled} />
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
