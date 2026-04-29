import { useEffect, useState } from "react";
import BaseModal from "../gerais/BaseModal";
import BaseButton from "../gerais/BaseButton";
import BaseInput from "../gerais/BaseInput";
import BaseSelect from "../gerais/BaseSelect";
import { supabase } from "../../services/supabase";
import { api } from "../../services/api";

const EMPTY_FORM = {
  nomeObra: "",
  cliente_id: "",
  responsavel_id: "",
  status: "Aguardando iniciação",
};

export default function ModalNovaObra({
  isOpen,
  onClose,
  onSaved,
  obraParaEditar = null,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [clientes, setClientes] = useState([]);
  const [diretoria, setDiretoria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [cliRes, dirRes] = await Promise.all([
          supabase
            .from("clientes")
            .select("id, nome")
            .order("nome", { ascending: true }),
          api.listUsuariosDiretoria().catch((e) => {
            console.error(e);
            return [];
          }),
        ]);
        if (!cliRes.error && cliRes.data) setClientes(cliRes.data);
        else if (cliRes.error)
          console.error("Erro ao carregar clientes:", cliRes.error);
        setDiretoria(Array.isArray(dirRes) ? dirRes : []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!obraParaEditar) {
      setFormData(EMPTY_FORM);
      return;
    }

    setFormData({
      nomeObra: obraParaEditar.local || "",
      cliente_id: obraParaEditar.cliente_id
        ? String(obraParaEditar.cliente_id)
        : "",
      responsavel_id:
        obraParaEditar.responsavel_id != null
          ? String(obraParaEditar.responsavel_id)
          : "",
      status: obraParaEditar.status || "Aguardando iniciação",
    });
  }, [isOpen, obraParaEditar]);

  const handleCloseAndReset = () => {
    setFormData(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.cliente_id) return;

    setSaving(true);
    try {
      if (obraParaEditar?.id) {
        await api.updateObra(obraParaEditar.id, {
          local: formData.nomeObra,
          cliente_id: formData.cliente_id,
          responsavel_id: formData.responsavel_id || null,
          status: formData.status,
        });
      } else {
        const clienteSelecionado = clientes.find(
          (cliente) => String(cliente.id) === String(formData.cliente_id),
        );
        await api.createObra({
          cliente: clienteSelecionado?.nome ?? "",
          local: formData.nomeObra,
          cliente_id: formData.cliente_id,
          responsavel_id: formData.responsavel_id || null,
          status: formData.status,
        });
      }
      if (typeof onSaved === "function") await onSaved();
      handleCloseAndReset();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCloseAndReset}
      title={obraParaEditar ? "Editar Obra" : "Nova Obra"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="nomeObra"
            className="text-xs font-semibold uppercase text-text-muted"
          >
            Local da obra
          </label>
          <BaseInput
            id="nomeObra"
            required
            placeholder="Ex: Edificio Aurora"
            value={formData.nomeObra}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, nomeObra: event.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="cliente_id"
            className="text-xs font-semibold uppercase text-text-muted"
          >
            Cliente responsável
          </label>
          <BaseSelect
            id="cliente_id"
            required
            value={formData.cliente_id}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                cliente_id: event.target.value,
              }))
            }
            disabled={loading || saving}
            options={[
              {
                value: "",
                label: loading
                  ? "Carregando clientes..."
                  : "Selecione um cliente...",
              },
              ...clientes.map((cli) => ({
                value: String(cli.id),
                label: cli.nome,
              })),
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="responsavel_id"
            className="text-xs font-semibold uppercase text-text-muted"
          >
            Responsável
          </label>
          <BaseSelect
            id="responsavel_id"
            value={formData.responsavel_id}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                responsavel_id: event.target.value,
              }))
            }
            disabled={loading || saving}
            options={[
              { value: "", label: "Nenhum responsável" },
              ...diretoria.map((u) => ({ value: String(u.id), label: u.nome })),
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="status"
            className="text-xs font-semibold uppercase text-text-muted"
          >
            Status da obra
          </label>
          <BaseSelect
            id="status"
            value={formData.status}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, status: event.target.value }))
            }
            disabled={saving}
            options={[
              { value: "Aguardando iniciação", label: "Aguardando iniciação" },
              { value: "Em andamento", label: "Em andamento" },
              { value: "Concluída", label: "Concluída" },
            ]}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <BaseButton
            type="button"
            variant="ghost"
            onClick={handleCloseAndReset}
          >
            Cancelar
          </BaseButton>
          <BaseButton type="submit" isLoading={saving} disabled={loading}>
            {obraParaEditar ? "Salvar Alterações" : "Criar Obra"}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
