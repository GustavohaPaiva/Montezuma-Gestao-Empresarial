import { useEffect, useState } from "react";
import BaseSelect from "../../../../components/gerais/BaseSelect";
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
      <BaseSelect
        size="compact"
        searchable
        autoFocus
        loading={loading}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={loading}
        className="w-[120px]"
        onCreateOption={async (nome) => {
          const novo = await api.createFornecedor({ nome, ativo: true });
          setLista((prev) =>
            [...prev, novo].sort((a, b) =>
              (a.nome || "").localeCompare(b.nome || ""),
            ),
          );
          return String(novo.id);
        }}
        options={[
          { value: "", label: loading ? "Carregando..." : "Selecione..." },
          ...lista.map((f) => ({
            value: String(f.id),
            label: f.nome,
          })),
        ]}
      />
      <button
        type="button"
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
