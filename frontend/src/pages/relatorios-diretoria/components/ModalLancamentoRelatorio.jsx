import { useEffect, useState } from "react";
import BaseButton from "../../../components/gerais/BaseButton";
import BaseModal from "../../../components/gerais/BaseModal";
import BaseSelect from "../../../components/gerais/BaseSelect";
import {
  isSemanaAtual,
  labelSemanaFromInicio,
  modalidadePorId,
  normalizarConteudo,
  opcoesSemanaSelect,
  periodoAtual,
  semanaAtualInicio,
  chaveSemanaLancamento,
} from "../relatoriosDiretoriaUtils";
import { projecaoSubpainelClass, textareaCampoClass } from "../../projecoes/projecoesUi";

export default function ModalLancamentoRelatorio({
  isOpen,
  onClose,
  onSave,
  salvando = false,
  obraId,
  modalidade,
  periodo,
  lancamentoExistente = null,
  semanaInicial,
}) {
  const mod = modalidadePorId(modalidade);
  const atual = periodoAtual();
  const ano = periodo?.ano ?? atual.ano;
  const mes = periodo?.mes ?? atual.mes;

  const [semanaInicio, setSemanaInicio] = useState(
    semanaInicial ?? atual.semana_inicio,
  );
  const [mostrarSeletorSemana, setMostrarSeletorSemana] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const semanaDefault =
      semanaInicial ??
      (lancamentoExistente
        ? chaveSemanaLancamento(lancamentoExistente)
        : semanaAtualInicio());
    setSemanaInicio(semanaDefault || semanaAtualInicio());
    setMostrarSeletorSemana(false);
    setObservacoes(
      normalizarConteudo(lancamentoExistente?.conteudo).observacoes || "",
    );
  }, [isOpen, lancamentoExistente, semanaInicial]);

  const handleSalvar = async () => {
    await onSave?.({
      obra_id: obraId,
      modalidade,
      ano,
      mes,
      semana_inicio: String(semanaInicio).slice(0, 10),
      conteudo: { observacoes: observacoes.trim() },
    });
  };

  const opcoes = opcoesSemanaSelect(ano, mes);

  if (modalidade === "obra" || modalidade === "financeiro") return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        lancamentoExistente
          ? `Editar relatório — ${mod?.label || ""}`
          : `Novo relatório — ${mod?.label || ""}`
      }
      size="lg"
    >
      <div className="space-y-5">
        <div className={`${projecaoSubpainelClass} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Semana de referência
            </p>
            <p className="mt-1 text-sm font-semibold text-text-primary">
              {labelSemanaFromInicio(semanaInicio)}
              {isSemanaAtual(semanaInicio) ? (
                <span className="ml-2 text-xs font-medium text-accent-primary">
                  (semana atual)
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarSeletorSemana((v) => !v)}
            className="text-xs font-medium text-text-muted underline-offset-2 hover:text-accent-primary hover:underline"
          >
            {mostrarSeletorSemana ? "Ocultar alteração" : "Alterar semana"}
          </button>
        </div>

        {mostrarSeletorSemana ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Semana do calendário
            </label>
            <BaseSelect
              searchable={false}
              value={String(semanaInicio)}
              onChange={(e) => setSemanaInicio(e.target.value)}
              options={opcoes}
            />
          </div>
        ) : null}

        <div>
          <label
            htmlFor="relatorio-observacoes"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Observações
          </label>
          <textarea
            id="relatorio-observacoes"
            rows={6}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder={`Descreva o relatório ${mod?.label?.toLowerCase() || ""} desta semana…`}
            className={textareaCampoClass}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border-primary/20 pt-4">
          <BaseButton variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleSalvar}
            isLoading={salvando}
          >
            Salvar relatório
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
