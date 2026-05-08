import { useEffect, useState } from "react";
import BaseModal from "../gerais/BaseModal";
import BaseButton from "../gerais/BaseButton";
import BaseInput from "../gerais/BaseInput";

export default function ModalFornecedor({
  isOpen,
  onClose,
  onSave,
  fornecedorEdit,
}) {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNome(fornecedorEdit?.nome ?? "");
    setCnpj(fornecedorEdit?.cnpj ?? "");
    setTelefone(fornecedorEdit?.telefone ?? "");
    setEmail(fornecedorEdit?.email ?? "");
    setSaving(false);
  }, [isOpen, fornecedorEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!nome?.trim()) {
      alert("O nome do fornecedor é obrigatório!");
      return;
    }

    setSaving(true);
    try {
      await Promise.resolve(
        onSave({
          nome: nome.trim(),
          cnpj: cnpj.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={fornecedorEdit ? "Editar fornecedor" : "Novo fornecedor"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-600">
          Cadastro
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor="modal-fornecedor-nome"
            className="text-xs font-semibold uppercase text-text-muted"
          >
            Nome da empresa *
          </label>
          <BaseInput
            id="modal-fornecedor-nome"
            required
            autoComplete="organization"
            placeholder="Ex.: Depósito do Zé"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="uppercase"
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="modal-fornecedor-cnpj"
            className="text-xs font-semibold uppercase text-text-muted"
          >
            CNPJ / NIF
          </label>
          <BaseInput
            id="modal-fornecedor-cnpj"
            autoComplete="off"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="modal-fornecedor-telefone"
              className="text-xs font-semibold uppercase text-text-muted"
            >
              Telefone
            </label>
            <BaseInput
              id="modal-fornecedor-telefone"
              type="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="modal-fornecedor-email"
              className="text-xs font-semibold uppercase text-text-muted"
            >
              E-mail
            </label>
            <BaseInput
              id="modal-fornecedor-email"
              type="email"
              autoComplete="email"
              placeholder="contato@loja.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lowercase"
              disabled={saving}
            />
          </div>
        </div>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={onClose}
          >
            Cancelar
          </BaseButton>
          <BaseButton type="submit" isLoading={saving}>
            {fornecedorEdit ? "Guardar alterações" : "Registar fornecedor"}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
