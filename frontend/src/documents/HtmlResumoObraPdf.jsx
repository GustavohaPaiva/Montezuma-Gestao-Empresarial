import { Text, View } from "@react-pdf/renderer";
import { sanitizeResumoObraHtml } from "../utils/sanitizeHtml";
import { resumoObraTemConteudo } from "../pages/relatorios-diretoria/relatoriosDiretoriaUtils";

/**
 * Converte HTML sanitizado do resumo de obra em nós do @react-pdf/renderer.
 */
export function HtmlResumoObraPdf({ html, styles }) {
  const safe = sanitizeResumoObraHtml(html);
  if (!resumoObraTemConteudo(safe)) {
    return (
      <Text style={styles.empty}>Nenhum conteúdo registrado nesta semana.</Text>
    );
  }

  if (typeof DOMParser === "undefined") {
    return <Text style={styles.itemText}>{safe.replace(/<[^>]+>/g, " ")}</Text>;
  }

  const doc = new DOMParser().parseFromString(
    `<div>${safe}</div>`,
    "text/html",
  );
  const root = doc.body.firstChild;

  return (
    <View style={styles.resumoBody}>
      {Array.from(root?.childNodes || []).map((node, idx) =>
        renderNode(node, styles, `n-${idx}`),
      )}
    </View>
  );
}

function alignFromNode(node) {
  const style = node.getAttribute?.("style") || "";
  const match = /text-align\s*:\s*(left|center|right)/i.exec(style);
  return match ? match[1].toLowerCase() : null;
}

function withAlign(baseStyle, align) {
  if (!align || align === "left") return baseStyle;
  return { ...baseStyle, textAlign: align };
}

function renderNode(node, styles, key) {
  if (!node) return null;

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    if (!text.trim()) return null;
    return (
      <Text key={key} style={styles.itemText}>
        {text}
      </Text>
    );
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toLowerCase();
  const align = alignFromNode(node);
  const children = Array.from(node.childNodes).map((child, idx) =>
    renderInline(child, styles, `${key}-${idx}`),
  );

  if (tag === "br") {
    return <Text key={key}>{"\n"}</Text>;
  }

  if (tag === "h1") {
    return (
      <Text key={key} style={withAlign(styles.heading1 || styles.heading2, align)}>
        {children}
      </Text>
    );
  }

  if (tag === "h2") {
    return (
      <Text key={key} style={withAlign(styles.heading2, align)}>
        {children}
      </Text>
    );
  }

  if (tag === "h3" || tag === "h4") {
    return (
      <Text key={key} style={withAlign(styles.heading3, align)}>
        {children}
      </Text>
    );
  }

  if (tag === "p") {
    return (
      <Text key={key} style={withAlign(styles.paragraph, align)}>
        {children}
      </Text>
    );
  }

  if (tag === "blockquote") {
    return (
      <View key={key} style={styles.blockquote || { marginBottom: 6, paddingLeft: 8 }}>
        <Text style={withAlign(styles.paragraph, align)}>{children}</Text>
      </View>
    );
  }

  if (tag === "ul" || tag === "ol") {
    const items = Array.from(node.children).filter(
      (el) => el.tagName?.toLowerCase() === "li",
    );
    return (
      <View key={key} style={styles.list}>
        {items.map((li, idx) => (
          <View key={`${key}-li-${idx}`} style={styles.listItem} wrap={false}>
            <Text style={styles.listBullet}>
              {tag === "ol" ? `${idx + 1}.` : "•"}
            </Text>
            <Text style={styles.listItemText}>
              {Array.from(li.childNodes).map((child, cIdx) =>
                renderInline(child, styles, `${key}-li-${idx}-${cIdx}`),
              )}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (tag === "li") {
    return (
      <View key={key} style={styles.listItem} wrap={false}>
        <Text style={styles.listBullet}>•</Text>
        <Text style={styles.listItemText}>{children}</Text>
      </View>
    );
  }

  return (
    <Text key={key} style={styles.itemText}>
      {children}
    </Text>
  );
}

function renderInline(node, styles, key) {
  if (!node) return null;

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map((child, idx) =>
    renderInline(child, styles, `${key}-${idx}`),
  );

  if (tag === "br") return "\n";

  if (tag === "strong" || tag === "b") {
    return (
      <Text key={key} style={styles.bold}>
        {children}
      </Text>
    );
  }

  if (tag === "em" || tag === "i") {
    return (
      <Text key={key} style={styles.italic}>
        {children}
      </Text>
    );
  }

  if (tag === "u") {
    return (
      <Text key={key} style={styles.underline}>
        {children}
      </Text>
    );
  }

  if (tag === "s" || tag === "del" || tag === "strike") {
    return (
      <Text key={key} style={styles.strike || { textDecoration: "line-through" }}>
        {children}
      </Text>
    );
  }

  if (tag === "ul" || tag === "ol" || tag === "blockquote") {
    return renderNode(node, styles, key);
  }

  return children;
}
