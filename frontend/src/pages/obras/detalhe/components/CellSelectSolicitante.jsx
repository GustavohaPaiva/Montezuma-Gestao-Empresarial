import { useMemo, useState } from "react";
import BaseSelect from "../../../../components/gerais/BaseSelect";

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
      <BaseSelect
        size="compact"
        searchable={false}
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-[140px]"
        options={[
          { value: "", label: "Selecione..." },
          ...opcoes.map((s) => ({ value: s, label: s })),
        ]}
      />
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
