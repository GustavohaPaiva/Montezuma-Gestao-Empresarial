import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import BaseModal from "../gerais/BaseModal";
import BaseButton from "../gerais/BaseButton";
import BaseInput from "../gerais/BaseInput";

export default function ModalPrestador({
  isOpen,
  onClose,
  onSave,
  classesDisponiveis = [],
  onCreateClasse,
  prestadorEdit,
}) {
  const [nome, setNome] = useState("");
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [classeIds, setClasseIds] = useState([]);
  const [mostrarNovaClasse, setMostrarNovaClasse] = useState(false);
  const [novaClasseNome, setNovaClasseNome] = useState("");
  const [criandoClasse, setCriandoClasse] = useState(false);
  const [saving, setSaving] = useState(false);

  const classesAtivas = useMemo(
    () => classesDisponiveis || [],
    [classesDisponiveis],
  );

  useEffect(() => {
    if (!isOpen) return;
    setNome(prestadorEdit?.nome ?? "");
    setCnpjCpf(prestadorEdit?.cnpj_cpf ?? "");
    setTelefone(prestadorEdit?.telefone ?? "");
    setEmail(prestadorEdit?.email ?? "");
    setClasseIds(
      (prestadorEdit?.prestadores_classes || []).map((rel) => rel.classe_id),
    );
    setMostrarNovaClasse(false);
    setNovaClasseNome("");
    setCriandoClasse(false);
    setSaving(false);
  }, [isOpen, prestadorEdit]);

  const toggleClasse = (idClasse) => {
    setClasseIds((prev) =>
      prev.includes(idClasse)
        ? prev.filter((id) => id !== idClasse)
        : [...prev, idClasse],
    );
  };

  const handleCriarClasse = async () => {
    const nomeLimpo = novaClasseNome.trim();
    if (!nomeLimpo) {
      alert("Informe o nome da nova classe.");
      return;
    }

    try {
      setCriandoClasse(true);
      const classeCriada = await onCreateClasse(nomeLimpo);
      if (classeCriada?.id) {
        setClasseIds((prev) =>
          prev.includes(classeCriada.id) ? prev : [...prev, classeCriada.id],
        );
      }
      setNovaClasseNome("");
      setMostrarNovaClasse(false);
    } catch (error) {
      console.error("Erro ao criar classe:", error);
      alert("Não foi possível criar a classe.");
    } finally {
      setCriandoClasse(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!nome.trim()) {
      alert("O nome do prestador é obrigatório!");
      return;
    }

    const payload = {
      nome: nome.trim(),
      cnpj_cpf: cnpjCpf.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      classe_ids: classeIds,
    };

    if (prestadorEdit?.id) {
      payload.id = prestadorEdit.id;
    }

    setSaving(true);
    try {
      await Promise.resolve(onSave(payload));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={prestadorEdit ? "Editar prestador" : "Novo prestador"}
      size="lg"
      contentPaddingClass="max-h-[min(78vh,680px)] overflow-y-auto overscroll-contain p-6 sm:p-8"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-600">
          Cadastro
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor="modal-prestador-nome"
            className="text-xs font-semibold uppercase text-text-muted"
          >
            Nome do prestador *
          </label>
          <BaseInput
            id="modal-prestador-nome"
            required
            autoComplete="name"
            placeholder="Ex.: João da Elétrica"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="uppercase"
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="modal-prestador-doc"
            className="text-xs font-semibold uppercase text-text-muted"
          >
            CPF / CNPJ / NIF
          </label>
          <BaseInput
            id="modal-prestador-doc"
            autoComplete="off"
            placeholder="Documento fiscal"
            value={cnpjCpf}
            onChange={(e) => setCnpjCpf(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="modal-prestador-telefone"
              className="text-xs font-semibold uppercase text-text-muted"
            >
              Telefone
            </label>
            <BaseInput
              id="modal-prestador-telefone"
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
              htmlFor="modal-prestador-email"
              className="text-xs font-semibold uppercase text-text-muted"
            >
              E-mail
            </label>
            <BaseInput
              id="modal-prestador-email"
              type="email"
              autoComplete="email"
              placeholder="contato@prestador.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lowercase"
              disabled={saving}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/90 p-4 ring-1 ring-slate-900/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase text-text-muted">
              Classes do prestador
            </span>
            <BaseButton
              type="button"
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              disabled={saving || criandoClasse}
              onClick={() => setMostrarNovaClasse((prev) => !prev)}
              icon={<Plus className="h-4 w-4" aria-hidden />}
            >
              Nova classe
            </BaseButton>
          </div>

          {mostrarNovaClasse ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <BaseInput
                value={novaClasseNome}
                onChange={(e) => setNovaClasseNome(e.target.value)}
                placeholder="Ex.: Pintura"
                className="uppercase sm:flex-1"
                disabled={criandoClasse}
                aria-label="Nome da nova classe"
              />
              <BaseButton
                type="button"
                variant="outline"
                size="md"
                className="shrink-0 sm:w-auto"
                disabled={criandoClasse}
                isLoading={criandoClasse}
                onClick={handleCriarClasse}
              >
                Criar
              </BaseButton>
            </div>
          ) : null}

          <div className="mt-3">
            {classesAtivas.length === 0 ? (
              <p className="text-sm text-text-muted">
                Nenhuma classe cadastrada no sistema.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {classesAtivas.map((classe) => (
                  <label
                    key={classe.id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-text-primary ring-1 ring-slate-900/5 transition hover:border-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={classeIds.includes(classe.id)}
                      onChange={() => toggleClasse(classe.id)}
                      disabled={saving}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-accent-primary focus:ring-2 focus:ring-accent-primary/25"
                    />
                    <span className="truncate uppercase" title={classe.nome}>
                      {classe.nome}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            type="button"
            variant="ghost"
            disabled={saving || criandoClasse}
            onClick={onClose}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            type="submit"
            isLoading={saving}
            disabled={criandoClasse}
          >
            {prestadorEdit ? "Guardar alterações" : "Registar prestador"}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
