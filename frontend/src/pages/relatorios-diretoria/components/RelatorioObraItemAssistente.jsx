import { useEffect, useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import BaseButton from "../../../components/gerais/BaseButton";
import BaseModal from "../../../components/gerais/BaseModal";
import { melhorarTextoPortugues } from "../../../utils/textoPortuguesAssistant";
import { textareaCampoClass } from "../../projecoes/projecoesUi";

export default function RelatorioObraItemAssistente({
  isOpen,
  textoInicial,
  onClose,
  onAplicar,
}) {
  const [rascunho, setRascunho] = useState(textoInicial || "");
  const [sugerido, setSugerido] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modo, setModo] = useState("editar");

  useEffect(() => {
    if (!isOpen) return;
    setRascunho(textoInicial || "");
    setSugerido("");
    setAviso("");
    setModo("editar");
  }, [isOpen, textoInicial]);

  const gerarSugestao = async () => {
    setCarregando(true);
    setAviso("");
    try {
      const resultado = await melhorarTextoPortugues(rascunho, {
        contexto: "relatorio_obra",
      });
      setSugerido(resultado.sugerido || "");
      setAviso(resultado.aviso || "");
      setModo("revisar");
    } catch (e) {
      console.error(e);
      setAviso("Não foi possível gerar sugestão. Edite o texto manualmente.");
    } finally {
      setCarregando(false);
    }
  };

  const aplicar = (texto) => {
    onAplicar(String(texto ?? "").trim());
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Assistente de texto"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Correção com IA (Google Gemini) — revise antes de aplicar ao item.
        </p>

        {modo === "editar" ? (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Texto do item
              </label>
              <textarea
                rows={5}
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                className={textareaCampoClass}
                placeholder="Descreva o item…"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <BaseButton variant="outline" onClick={onClose}>
                Cancelar
              </BaseButton>
              <BaseButton
                variant="primary"
                onClick={gerarSugestao}
                disabled={!rascunho.trim() || carregando}
                icon={
                  carregando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )
                }
              >
                {carregando ? "Gerando…" : "Melhorar com IA"}
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
              <textarea
                rows={5}
                value={sugerido}
                onChange={(e) => setSugerido(e.target.value)}
                className={textareaCampoClass}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <BaseButton variant="outline" onClick={() => setModo("editar")}>
                Voltar
              </BaseButton>
              <BaseButton
                variant="primary"
                onClick={() => aplicar(sugerido)}
                disabled={!sugerido.trim()}
              >
                Aplicar sugestão
              </BaseButton>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}
