import { useEffect, useState } from "react";
import BaseModal from "../gerais/BaseModal";
import BaseButton from "../gerais/BaseButton";
import BaseInput from "../gerais/BaseInput";
import BaseSelect from "../gerais/BaseSelect";
import {
  labelCampoClass,
  textareaCampoClass,
} from "../../pages/projecoes/projecoesUi";
import { STATUS_PROJECAO_OPCOES } from "../../utils/projecaoUtils";

const hojeISO = () => new Date().toISOString().slice(0, 10);

export default function ModalProjecao({
  isOpen,
  onClose,
  onSave,
  projecaoEdicao = null,
  salvando = false,
}) {
  const modoEdicao = Boolean(projecaoEdicao?.id);
  const [nome, setNome] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [contato, setContato] = useState("");
  const [enderecoObra, setEnderecoObra] = useState("");
  const [dataProposta, setDataProposta] = useState(hojeISO());
  const [status, setStatus] = useState("Rascunho");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (projecaoEdicao?.id) {
      setNome(projecaoEdicao.nome ?? "");
      setClienteNome(projecaoEdicao.cliente_nome ?? "");
      setContato(projecaoEdicao.contato ?? "");
      setEnderecoObra(projecaoEdicao.endereco_obra ?? "");
      setDataProposta(
        projecaoEdicao.data_proposta
          ? String(projecaoEdicao.data_proposta).slice(0, 10)
          : hojeISO(),
      );
      setStatus(projecaoEdicao.status || "Rascunho");
      setDescricao(projecaoEdicao.descricao ?? "");
    } else {
      setNome("");
      setClienteNome("");
      setContato("");
      setEnderecoObra("");
      setDataProposta(hojeISO());
      setStatus("Rascunho");
      setDescricao("");
    }
  }, [isOpen, projecaoEdicao]);

  const submit = () => {
    if (!nome.trim()) {
      alert("Informe o nome da projeção.");
      return;
    }
    onSave({
      ...(modoEdicao ? { id: projecaoEdicao.id } : {}),
      nome: nome.trim(),
      cliente_nome: clienteNome.trim(),
      contato: contato.trim(),
      endereco_obra: enderecoObra.trim(),
      data_proposta: dataProposta || hojeISO(),
      status: status || "Rascunho",
      descricao: descricao.trim(),
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modoEdicao ? "Editar projeção" : "Nova projeção"}
      size="lg"
      contentPaddingClass="p-6 sm:p-8"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCampoClass}>Nome da projeção *</label>
            <BaseInput
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Residencial Silva — fase 1"
            />
          </div>
          <div>
            <label className={labelCampoClass}>Cliente</label>
            <BaseInput
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
          <div>
            <label className={labelCampoClass}>Contato</label>
            <BaseInput
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              placeholder="Telefone ou e-mail"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCampoClass}>Endereço da obra</label>
            <BaseInput
              value={enderecoObra}
              onChange={(e) => setEnderecoObra(e.target.value)}
              placeholder="Rua, número, bairro…"
            />
          </div>
          <div>
            <label className={labelCampoClass}>Data da proposta</label>
            <BaseInput
              type="date"
              value={dataProposta}
              onChange={(e) => setDataProposta(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCampoClass}>Status</label>
            <BaseSelect
              searchable={false}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_PROJECAO_OPCOES.map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCampoClass}>Descrição / resumo</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className={textareaCampoClass}
              placeholder="Observações gerais da proposta…"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/80 pt-4 sm:flex-row sm:justify-end">
          <BaseButton variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" onClick={submit} isLoading={salvando}>
            {modoEdicao ? "Salvar alterações" : "Criar projeção"}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
