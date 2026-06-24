import { Plus } from "lucide-react";
import { useState } from "react";
import {
  criarItemObra,
  ordenarItensObra,
  proximaOrdemItemObra,
  reindexarOrdensItensObra,
} from "../relatoriosDiretoriaUtils";
import {
  relatorioHeaderBotaoPrimarioClass,
  relatorioSecaoCabecalhoClass,
  relatorioSecaoCorpoClass,
  relatorioTopicoSecaoClass,
} from "../relatoriosDiretoriaUi";
import RelatorioObraItemRow from "./RelatorioObraItemRow";

export default function RelatorioObraTopicoSection({
  topico,
  itens = [],
  onChange,
}) {
  const itensOrdenados = ordenarItensObra(itens);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const emitir = (novaLista) => {
    onChange(reindexarOrdensItensObra(novaLista));
  };

  const adicionarItem = () => {
    const novo = criarItemObra(proximaOrdemItemObra(itens));
    emitir(ordenarItensObra([novo, ...itens]));
  };

  const atualizarItem = (itemAtualizado) => {
    emitir(
      itens.map((item) =>
        item.id === itemAtualizado.id ? itemAtualizado : item,
      ),
    );
  };

  const removerItem = (itemId) => {
    emitir(itens.filter((item) => item.id !== itemId));
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragStart = (e, itemId) => {
    if (!e || !itemId) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
    setDraggingId(itemId);
  };

  const handleDragOver = (e, itemId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(itemId);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    const oldIndex = itensOrdenados.findIndex((i) => i.id === sourceId);
    const newIndex = itensOrdenados.findIndex((i) => i.id === targetId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = [...itensOrdenados];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    emitir(reordered);
  };

  return (
    <section className={relatorioTopicoSecaoClass}>
      <div
        className={`${relatorioSecaoCabecalhoClass} flex flex-wrap items-center justify-between gap-3 border-border-primary/20 bg-[#FAFAFA]/40`}
      >
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            {topico.label}
          </h3>
          <p className="mt-0.5 text-xs text-text-muted">
            {itensOrdenados.length} item{itensOrdenados.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={adicionarItem}
          className={`${relatorioHeaderBotaoPrimarioClass} !min-w-0 sm:!min-w-[148px]`}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar item
        </button>
      </div>

      <div className={`${relatorioSecaoCorpoClass} space-y-4`}>
        {itensOrdenados.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-primary/30 bg-[#FAFAFA]/80 px-4 py-5 text-center text-xs text-text-muted">
            Nenhum item neste tópico. Clique em &quot;Adicionar item&quot; para
            começar.
          </p>
        ) : (
          itensOrdenados.map((item) => (
            <RelatorioObraItemRow
              key={item.id}
              item={item}
              onChange={atualizarItem}
              onRemove={() => removerItem(item.id)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggingId === item.id}
              isDragOver={dragOverId === item.id && draggingId !== item.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
