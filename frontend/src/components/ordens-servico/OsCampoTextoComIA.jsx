import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import BaseButton from "../gerais/BaseButton";
import BaseInput from "../gerais/BaseInput";
import BaseModal from "../gerais/BaseModal";
import { melhorarTextoPortugues } from "../../utils/textoPortuguesAssistant";
import {
  textareaCampoClass,
  textareaCampoVkClass,
} from "../../pages/ordens-servico/ordensServicoUi";

export default function OsCampoTextoComIA({
  value,
  onChange,
  multiline = false,
  rows = 4,
  placeholder,
  disabled = false,
  isVk = false,
  maxLinhas = 20,
  inputClassName,
}) {
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [rascunho, setRascunho] = useState("");
  const [sugerido, setSugerido] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modo, setModo] = useState("editar");

  const textareaClass = isVk ? textareaCampoVkClass : textareaCampoClass;

  useEffect(() => {
    if (!assistenteAberto) return;
    setRascunho(value || "");
    setSugerido("");
    setAviso("");
    setModo("editar");
  }, [assistenteAberto, value]);

  const gerarSugestao = async () => {
    setCarregando(true);
    setAviso("");
    try {
      const resultado = await melhorarTextoPortugues(rascunho, {
        contexto: "ordem_servico",
        maxLinhas,
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
    onChange(String(texto ?? "").trim());
    setAssistenteAberto(false);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            disabled={disabled}
            placeholder={placeholder}
            className={textareaClass}
          />
        ) : (
          <BaseInput
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className={inputClassName}
          />
        )}
        {!disabled ? (
          <div className="flex justify-stretch sm:justify-end">
            <BaseButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssistenteAberto(true)}
              disabled={!String(value ?? "").trim()}
              icon={<Sparkles className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              Corretor com IA
            </BaseButton>
          </div>
        ) : null}
      </div>

      <BaseModal
        isOpen={assistenteAberto}
        onClose={() => setAssistenteAberto(false)}
        title="Corretor com IA"
        size="lg"
      >
        <div className="space-y-4">
          <p
            className={
              isVk ? "text-xs text-esc-muted" : "text-xs text-text-muted"
            }
          >
            Correção com IA (Google Gemini) — revise antes de aplicar ao campo.
          </p>

          {modo === "editar" ? (
            <>
              <div>
                <label
                  className={
                    isVk
                      ? "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-esc-muted"
                      : "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
                  }
                >
                  Texto original
                </label>
                <textarea
                  rows={rows}
                  value={rascunho}
                  onChange={(e) => setRascunho(e.target.value)}
                  className={textareaClass}
                />
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
                <label
                  className={
                    isVk
                      ? "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-esc-muted"
                      : "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
                  }
                >
                  Sugestão
                </label>
                <textarea
                  rows={rows}
                  value={sugerido}
                  onChange={(e) => setSugerido(e.target.value)}
                  className={textareaClass}
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
    </>
  );
}
