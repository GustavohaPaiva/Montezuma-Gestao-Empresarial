import { useEffect, useRef } from "react";
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
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { sanitizeResumoObraHtml } from "../../utils/sanitizeHtml";
import {
  pareceHtmlTextoLivre,
  textoLivreParaHtml,
  textoLivreTemConteudo,
  textoPlanoParaHtml,
} from "../../utils/textoLivre";
import {
  normalizePastedHtml,
  normalizePastedPlainText,
  runBlockCommand,
} from "../../pages/relatorios-diretoria/resumoObraEditor";

const toolbarBtnClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-text-muted transition hover:border-border-primary/40 hover:bg-[#FAFAFA] hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40";

const toolbarBtnActiveClass =
  "border-accent-primary/30 bg-accent-primary/10 text-accent-primary";

const editorContentClassCompleta =
  "prose-resumo-obra min-h-[220px] max-w-none px-3 py-3 text-sm leading-relaxed text-text-primary outline-none sm:min-h-[280px] sm:text-base";

const editorContentClassSimples =
  "prose-resumo-obra min-h-[140px] max-w-none px-3 py-3 text-sm leading-relaxed text-text-primary outline-none sm:min-h-[180px] sm:text-base";

function ToolbarButton({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={Boolean(active)}
      disabled={disabled}
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

function EditorToolbar({ editor, disabled, variant = "completa" }) {
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

  const completa = variant === "completa";

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

      {completa ? (
        <>
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
        </>
      ) : (
        <ToolbarDivider />
      )}

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
      {completa ? (
        <ToolbarButton
          title="Citação"
          disabled={disabled}
          active={active.blockquote}
          onClick={() => runBlock((c) => c.toggleBlockquote())}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
      ) : null}

      {completa ? (
        <>
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
        </>
      ) : null}

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

function temMarkdownNegrito(texto) {
  return /\*\*.+?\*\*|__.+?__/.test(String(texto ?? ""));
}

/**
 * Visualização somente leitura de HTML sanitizado (texto livre).
 */
export function HtmlTextoLivre({
  html,
  className = "",
  emptyMessage = null,
}) {
  const safe = textoLivreParaHtml(html);
  if (!textoLivreTemConteudo(safe)) {
    if (emptyMessage) {
      return (
        <p className="text-sm italic text-text-muted">{emptyMessage}</p>
      );
    }
    return null;
  }
  return (
    <div
      className={`prose-resumo-obra text-sm leading-relaxed text-text-primary ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export default function EditorTextoLivre({
  value,
  onChange,
  disabled = false,
  variant = "completa",
  placeholder = "Escreva aqui… Use **negrito** ou a barra de ferramentas.",
  editorClassName,
  onEditorReady,
}) {
  const editorRef = useRef(null);
  const completa = variant === "completa";

  const extensions = [
    StarterKit.configure({
      heading: completa ? { levels: [1, 2, 3] } : false,
      code: false,
      codeBlock: false,
      horizontalRule: false,
    }),
    Underline,
    ...(completa
      ? [
          TextAlign.configure({
            types: ["heading", "paragraph"],
            alignments: ["left", "center", "right"],
          }),
        ]
      : []),
    Placeholder.configure({ placeholder }),
  ];

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: textoLivreParaHtml(value),
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(sanitizeResumoObraHtml(ed.getHTML()));
    },
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
      onEditorReady?.(ed);
    },
    onDestroy: () => {
      editorRef.current = null;
    },
    editorProps: {
      attributes: {
        class:
          editorClassName ||
          (completa ? editorContentClassCompleta : editorContentClassSimples),
      },
      transformPastedText: normalizePastedPlainText,
      transformPastedHTML: normalizePastedHtml,
      handlePaste: (_view, event) => {
        const htmlClipboard = event.clipboardData?.getData("text/html")?.trim();
        if (htmlClipboard && pareceHtmlTextoLivre(htmlClipboard)) {
          return false;
        }

        const plain = event.clipboardData?.getData("text/plain");
        if (!plain || !temMarkdownNegrito(plain)) {
          return false;
        }

        event.preventDefault();
        const normalizado = normalizePastedPlainText(plain);
        const html = textoPlanoParaHtml(normalizado);
        editorRef.current?.chain().focus().insertContent(html).run();
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const atual = editor.getHTML();
    const próximo = textoLivreParaHtml(value);
    if (próximo !== atual) {
      editor.commands.setContent(próximo, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div className="overflow-hidden rounded-xl border border-border-primary/30 bg-white">
      <EditorToolbar editor={editor} disabled={disabled} variant={variant} />
      <EditorContent editor={editor} />
    </div>
  );
}

export { textoLivreTemConteudo };
