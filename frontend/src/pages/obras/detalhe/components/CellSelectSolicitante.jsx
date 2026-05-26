import { useMemo, useState } from "react";

const SOLICITANTES_FIXOS = ["Montezuma", "Marcelo"];

/**
 * Editor inline para o campo "Solicitante" da locação.
 * Reaproveita as mesmas opções do ModalLocacoes (Montezuma, Marcelo e cliente).
 */
export default function CellSelectSolicitante({
  valorInicial,
  nomeCliente,
  onSave,
  onCancel,
}) {
  const nomeDoCliente =
    (typeof nomeCliente === "string" ? nomeCliente : nomeCliente?.nome) || "";

  const opcoes = useMemo(() => {
    const lista = [...SOLICITANTES_FIXOS];
    if (nomeDoCliente && !lista.includes(nomeDoCliente)) {
      lista.push(nomeDoCliente);
    }
    if (valorInicial && !lista.includes(valorInicial)) {
      lista.push(valorInicial);
    }
    return lista;
  }, [nomeDoCliente, valorInicial]);

  const [val, setVal] = useState(valorInicial || "");

  return (
    <div className="flex items-center gap-1">
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-[140px] rounded-xl border border-border-primary/55 bg-white p-1.5 text-[13px] uppercase transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
        autoFocus
      >
        <option value="">Selecione...</option>
        {opcoes.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onSave(val)}
        disabled={!val}
        className="cursor-pointer border-none bg-transparent flex-shrink-0 disabled:opacity-50"
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
