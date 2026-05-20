/**
 * Abre o PDF numa nova aba para pré-visualização (padrão Obras / relatórios).
 * @param {() => Promise<{ blob: Blob, nomePadrao?: string } | Blob | null | undefined>} gerador
 * @param {string} [fallbackNome]
 */
export async function abrirPdfEmNovaAba(gerador, fallbackNome = "documento.pdf") {
  const novaAba = window.open("", "_blank");
  try {
    const resultado = await gerador();
    const blob = resultado?.blob ?? resultado;
    if (!blob) throw new Error("PDF vazio.");
    const url = URL.createObjectURL(blob);
    if (novaAba && !novaAba.closed) {
      novaAba.location.href = url;
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = resultado?.nomePadrao || fallbackNome;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    if (novaAba && !novaAba.closed) novaAba.close();
    throw e;
  }
}
