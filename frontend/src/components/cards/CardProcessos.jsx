import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Check, Pencil, Trash2, X } from "lucide-react";
import BaseCard from "./BaseCard";
import BaseButton from "../gerais/BaseButton";
import StatusSelectBadge from "../gerais/StatusSelectBadge";
import { STATUS_CLIENTE_OPCOES } from "../gerais/statusSelectOptions";

function formatarDataRegistro(dataValue) {
  if (!dataValue) return "Não informado";
  const data = new Date(dataValue);
  if (Number.isNaN(data.getTime())) return String(dataValue);
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** Alinhado ao `statusTheme` de Obras (`BaseCard` entity). */
function processStatusTheme(status) {
  const s = status || "Produção";
  if (s === "Finalizado") return "emerald";
  if (s === "Obra") return "amber";
  if (s === "Cartorio") return "pink";
  if (s === "Caixa") return "indigo";
  if (s === "Prefeitura") return "blue";
  if (s === "Produção") return "purple";
  return "blue";
}

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function CardProcessos({
  id,
  client,
  tipo,
  status,
  dataRegistro,
  onUpdate,
  onDelete,
}) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(client);
  const [editedTipo, setEditedTipo] = useState(tipo);

  const handleNavigate = () => {
    if (!isEditing) navigate(`/processo/${id}`);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditedClient(client);
    setEditedTipo(tipo);
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    await onUpdate(id, { nome: editedClient, tipo: editedTipo });
    setIsEditing(false);
  };

  const toggleEdit = (e) => {
    e.stopPropagation();
    setEditedClient(client);
    setEditedTipo(tipo);
    setIsEditing(true);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleStatusChange = async (novoStatus) => {
    await onUpdate(id, { status: novoStatus });
  };

  const metadata = dataRegistro
    ? [
        {
          icon: <CalendarDays className="h-4 w-4 text-slate-500" />,
          label: `Cadastro: ${formatarDataRegistro(dataRegistro)}`,
        },
      ]
    : [];

  return (
    <div
      className={joinClasses(
        "h-full w-full outline-none transition-shadow",
        !isEditing &&
          "cursor-pointer focus-within:ring-2 focus-within:ring-accent-primary/25 rounded-2xl",
      )}
      role={!isEditing ? "button" : undefined}
      tabIndex={!isEditing ? 0 : undefined}
      onKeyDown={(e) => {
        if (isEditing) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNavigate();
        }
      }}
      onClick={() => handleNavigate()}
    >
      <BaseCard
        variant="entity"
        title={isEditing ? "Editar dados" : client}
        value={
          isEditing
            ? "Ajuste nome e tipo nos campos abaixo."
            : tipo?.trim()
              ? String(tipo)
              : "Tipo não informado"
        }
        status={isEditing ? undefined : status || "Produção"}
        metadata={isEditing ? [] : metadata}
        colorTheme={processStatusTheme(status)}
      >
        <div
          className="mt-auto space-y-4 border-t border-slate-100 pt-4"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          {!isEditing ? (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor={`status-processo-${id}`}
                  className="text-[11px] font-semibold uppercase tracking-wide text-text-muted"
                >
                  Status do processo
                </label>
                <StatusSelectBadge
                  id={`status-processo-${id}`}
                  value={status || "Produção"}
                  options={STATUS_CLIENTE_OPCOES}
                  variant="processo"
                  onChange={handleStatusChange}
                  className="shadow-inner"
                />
              </div>
              <div className="flex w-full gap-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={toggleEdit}
                  className="flex-1"
                >
                  Editar
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={handleDeleteClick}
                  className="flex-1 text-red-600 hover:bg-red-50"
                >
                  Excluir
                </BaseButton>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    Cliente
                  </span>
                  <input
                    type="text"
                    value={editedClient}
                    onChange={(e) => setEditedClient(e.target.value)}
                    className="box-border h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-text-primary outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    Tipo
                  </span>
                  <input
                    type="text"
                    value={editedTipo}
                    onChange={(e) => setEditedTipo(e.target.value)}
                    className="box-border h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-text-primary outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>
              <div className="flex w-full gap-2">
                <BaseButton
                  variant="primary"
                  size="sm"
                  icon={<Check className="h-4 w-4" />}
                  onClick={handleSave}
                  className="flex-1"
                >
                  Salvar
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  icon={<X className="h-4 w-4" />}
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancelar
                </BaseButton>
              </div>
            </>
          )}
        </div>
      </BaseCard>
    </div>
  );
}
