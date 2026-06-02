import { useEffect, useMemo, useState } from "react";
import BaseModal from "../gerais/BaseModal";
import BaseButton from "../gerais/BaseButton";
import BaseInput from "../gerais/BaseInput";
import BaseSelect from "../gerais/BaseSelect";
import { labelCampoClass } from "../../pages/projecoes/projecoesUi";
import {
  TIPO_PROJECAO_ITEM,
  TIPO_PROJECAO_OPCOES,
  formatarMoedaBRL,
} from "../../utils/projecaoUtils";

function criarItemVazio() {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: TIPO_PROJECAO_ITEM.DOCUMENTACAO,
    descricao: "",
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    data_inicio: "",
    data_fim: "",
  };
}

export default function ModalProjecaoItem({
  isOpen,
  onClose,
  onSave,
  itemEdicao = null,
}) {
  const modoEdicao = Boolean(itemEdicao?.id);
  const [tipo, setTipo] = useState(TIPO_PROJECAO_ITEM.DOCUMENTACAO);
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valorUnitario, setValorUnitario] = useState("0");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (itemEdicao?.id) {
      setTipo(itemEdicao.tipo || TIPO_PROJECAO_ITEM.DOCUMENTACAO);
      setDescricao(itemEdicao.descricao ?? "");
      setQuantidade(String(itemEdicao.quantidade ?? 1));
      setValorUnitario(String(itemEdicao.valor_unitario ?? 0));
      setDataInicio(itemEdicao.data_inicio ?? "");
      setDataFim(itemEdicao.data_fim ?? "");
    } else {
      const vazio = criarItemVazio();
      setTipo(vazio.tipo);
      setDescricao("");
      setQuantidade("1");
      setValorUnitario("0");
      setDataInicio("");
      setDataFim("");
    }
  }, [isOpen, itemEdicao]);

  const valorTotal = useMemo(() => {
    const qtd = parseFloat(quantidade) || 0;
    const unit = parseFloat(valorUnitario) || 0;
    return qtd * unit;
  }, [quantidade, valorUnitario]);

  const submit = () => {
    if (!descricao.trim()) {
      alert("Informe a descrição do item.");
      return;
    }
    const qtd = parseFloat(quantidade) || 0;
    const unit = parseFloat(valorUnitario) || 0;
    if (qtd <= 0) {
      alert("A quantidade deve ser maior que zero.");
      return;
    }
    if (dataInicio && dataFim && dataFim < dataInicio) {
      alert("A data de fim não pode ser anterior à data de início.");
      return;
    }
    onSave({
      id: itemEdicao?.id || criarItemVazio().id,
      tipo,
      descricao: descricao.trim(),
      quantidade: qtd,
      valor_unitario: unit,
      valor_total: qtd * unit,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modoEdicao ? "Editar lançamento" : "Novo lançamento"}
      size="md"
      contentPaddingClass="p-6 sm:p-8"
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelCampoClass}>Tipo *</label>
          <BaseSelect
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            options={TIPO_PROJECAO_OPCOES}
          />
        </div>
        <div>
          <label className={labelCampoClass}>Descrição *</label>
          <BaseInput
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: Projeto arquitetônico completo"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCampoClass}>Quantidade *</label>
            <BaseInput
              type="number"
              min="0.01"
              step="0.01"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCampoClass}>Valor unitário (R$) *</label>
            <BaseInput
              type="number"
              min="0"
              step="0.01"
              value={valorUnitario}
              onChange={(e) => setValorUnitario(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCampoClass}>Data de início</label>
            <BaseInput
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCampoClass}>Data de fim</label>
            <BaseInput
              type="date"
              min={dataInicio || undefined}
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-xl border border-border-primary/30 bg-[#FAFAFA]/80 px-4 py-3">
          <p className="text-xs font-medium text-text-muted">Total do lançamento</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-accent-primary">
            {formatarMoedaBRL(valorTotal)}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/80 pt-4 sm:flex-row sm:justify-end">
          <BaseButton variant="outline" onClick={onClose}>
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" onClick={submit}>
            {modoEdicao ? "Salvar alterações" : "Adicionar lançamento"}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
