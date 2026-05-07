import { useState } from "react";

export default function CellInputNumber({ valorInicial, onSave, onCancel }) {
  const [val, setVal] = useState(valorInicial);
  return (
    <div className="flex flex-nowrap items-center gap-1">
      <span className="shrink-0">R$</span>
      <input
        type="number"
        step="0.01"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-[72px] min-w-0 rounded-xl border border-border-primary/55 bg-white px-2 py-1.5 text-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
        autoFocus
      />
      <button
        type="button"
        onClick={() => onSave(val)}
        className="shrink-0 cursor-pointer border-none bg-transparent"
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
        className="shrink-0 cursor-pointer border-none bg-transparent"
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
