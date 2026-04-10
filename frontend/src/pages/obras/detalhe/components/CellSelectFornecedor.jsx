import { useEffect, useState } from "react";
import { api } from "../../../../services/api";

export default function CellSelectFornecedor({
  valorInicialId,
  onSave,
  onCancel,
}) {
  const [val, setVal] = useState(valorInicialId || "");
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const dados = await api.getFornecedoresSimples();
        setLista(dados || []);
      } catch (error) {
        console.error("Erro ao buscar fornecedores", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFornecedores();
  }, []);

  return (
    <div className="flex items-center gap-1">
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-[120px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-[13px] uppercase disabled:opacity-50"
        disabled={loading}
        autoFocus
      >
        <option value="">{loading ? "Carregando..." : "Selecione..."}</option>
        {lista.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nome}
          </option>
        ))}
      </select>
      <button
        onClick={() => onSave(val)}
        disabled={loading || !val}
        className="cursor-pointer border-none bg-transparent flex-shrink-0 disabled:opacity-50"
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
