import { useState } from "react";
import BaseSelect from "../../../../components/gerais/BaseSelect";
import { etapasParaSelectOptions } from "../utils/etapasLancamento";

export default function CellSelectEtapa({
  obra,
  valorInicial,
  onSave,
  onCancel,
}) {
  const [val, setVal] = useState(valorInicial || "");

  return (
    <div className="flex items-center gap-1">
      <BaseSelect
        size="compact"
        searchable
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="min-w-[140px] max-w-[200px]"
        options={etapasParaSelectOptions(obra)}
      />
      <button
        type="button"
        onClick={() => onSave(val || null)}
        className="cursor-pointer border-none bg-transparent flex-shrink-0"
      >
        <img
          width="15"
          src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
          alt="salvar"
        />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer border-none bg-transparent flex-shrink-0"
      >
        <img
          width="15"
          src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
          alt="cancelar"
        />
      </button>
    </div>
  );
}
