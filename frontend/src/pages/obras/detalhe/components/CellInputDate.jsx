import { useState } from "react";

export default function CellInputDate({ valorInicial, onSave, onCancel }) {
  const [val, setVal] = useState(valorInicial || "");

  return (
    <div className="flex items-center gap-1">
      <input
        type="date"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-[150px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none"
        autoFocus
      />
      <button
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
