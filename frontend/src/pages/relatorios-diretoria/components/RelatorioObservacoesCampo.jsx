import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import BaseButton from "../../../components/gerais/BaseButton";
import BaseModal from "../../../components/gerais/BaseModal";
import { melhorarTextoPortugues } from "../../../utils/textoPortuguesAssistant";
import { textareaCampoClass } from "../../projecoes/projecoesUi";
import {
  relatorioSecaoAccentLineClass,
  relatorioSecaoLabelAccentClass,
  relatorioSecaoTituloClass,
} from "../relatoriosDiretoriaUi";

export default function RelatorioObservacoesCampo({
  value,
  onChange,
  onSave,
  salvando = false,
  disabled = false,
  titulo = "Observações",
  descricao = "Texto livre para comentários, destaques e notas da semana.",
  placeholder = "Escreva observações sobre o relatório financeiro desta semana…",
  rows = 5,
  maxLinhas = 20,
  contextoIa = "relatorio_financeiro",
}) {
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [rascunho, setRascunho] = useState("");
  const [sugerido, setSugerido] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modo, setModo] = useState("editar");

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
        contexto: contextoIa,
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
      <section className="mb-6 overflow-hidden rounded-2xl border border-border-primary/35 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6">
        <div className="mb-4">
          <span className={relatorioSecaoLabelAccentClass}>Texto livre</span>
          <h3 className={`${relatorioSecaoTituloClass} mt-1`}>{titulo}</h3>
          <div className={relatorioSecaoAccentLineClass} aria-hidden />
          {descricao ? (
            <p className="mt-2 text-xs text-text-muted sm:text-sm">{descricao}</p>
          ) : null}
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          disabled={disabled || salvando}
          placeholder={placeholder}
          className={textareaCampoClass}
        />

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {!disabled ? (
            <BaseButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssistenteAberto(true)}
              disabled={!String(value ?? "").trim() || salvando}
              icon={<Sparkles className="h-4 w-4" />}
            >
              Corretor com IA
            </BaseButton>
          ) : null}
          {onSave ? (
            <BaseButton
              type="button"
              variant="primary"
              size="sm"
              onClick={onSave}
              isLoading={salvando}
              disabled={disabled}
            >
              Salvar observações
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
            Correção com IA (Google Gemini) — revise antes de aplicar ao campo.
          </p>

          {modo === "editar" ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Texto original
                </label>
                <textarea
                  rows={rows}
                  value={rascunho}
                  onChange={(e) => setRascunho(e.target.value)}
                  className={textareaCampoClass}
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
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Sugestão
                </label>
                <textarea
                  rows={rows}
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
    </>
  );
}
