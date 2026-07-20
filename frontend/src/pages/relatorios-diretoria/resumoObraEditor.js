import { TextSelection } from "@tiptap/pm/state";

/**
 * Texto colado (WhatsApp, e-mail, Bloco de Notas) costuma vir com \n
 * virando <br> dentro de um único <p>. Força uma linha = um parágrafo.
 */
export function normalizePastedPlainText(text) {
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * HTML colado (Word/Docs) muitas vezes usa <br> ou <div> como linha.
 * Converte em parágrafos para o TipTap tratar cada linha como bloco.
 */
export function normalizePastedHtml(html) {
  let out = String(html ?? "");
  out = out.replace(/<\/?div\b[^>]*>/gi, (tag) =>
    tag.startsWith("</") ? "</p>" : "<p>"
  );
  out = out.replace(/<br\s*\/?>/gi, "</p><p>");
  out = out.replace(/<p>\s*<\/p>/gi, "");
  return out;
}

function selectionIsPartialTextblock(state) {
  const { $from, $to, empty } = state.selection;
  if (empty) return false;
  if (!$from.sameParent($to) || !$from.parent.isTextblock) return false;
  return (
    $from.parentOffset > 0 || $to.parentOffset < $from.parent.content.size
  );
}

/**
 * Se a seleção for só um trecho de um parágrafo, divide o bloco para
 * título/lista/etc. afetarem apenas o selecionado (estilo Notion/Word).
 */
export function isolatePartialTextblockSelection({ state, tr, dispatch }) {
  if (!selectionIsPartialTextblock(state)) return true;

  const { from, to, $from, $to } = state.selection;
  let transaction = tr;

  if ($to.parentOffset < $from.parent.content.size) {
    transaction = transaction.split(to);
  }

  const splitAt = transaction.mapping.map(from);
  if (transaction.doc.resolve(splitAt).parentOffset > 0) {
    transaction = transaction.split(splitAt);
  }

  const mappedFrom = transaction.mapping.map(from);
  const mappedTo = transaction.mapping.map(to);
  const $start = transaction.doc.resolve(mappedFrom);
  const $end = transaction.doc.resolve(mappedTo);

  transaction = transaction.setSelection(
    TextSelection.create(transaction.doc, $start.start(), $end.end())
  );

  if (dispatch) dispatch(transaction);
  return true;
}

/** Roda comando de bloco isolando a seleção parcial antes. */
export function runBlockCommand(editor, command) {
  if (!editor) return false;
  const chain = editor.chain().focus();
  if (!editor.state.selection.empty) {
    chain.command(isolatePartialTextblockSelection);
  }
  return command(chain).run();
}
