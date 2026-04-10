import { useEffect, useState } from "react";
import { api } from "../../../../services/api";

export default function CellSelectPrestador({
  valorInicial,
  valorInicialId,
  valorInicialClasseId,
  onSave,
  onCancel,
}) {
  const [classes, setClasses] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [classeId, setClasseId] = useState(
    valorInicialClasseId ? String(valorInicialClasseId) : "",
  );
  const [prestadorId, setPrestadorId] = useState(
    valorInicialId ? String(valorInicialId) : "",
  );
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingPrestadores, setLoadingPrestadores] = useState(false);

  useEffect(() => {
    const carregarClasses = async () => {
      try {
        setLoadingClasses(true);
        const dados = await api.getClassesPrestadores();
        setClasses(dados || []);
      } catch (error) {
        console.error("Erro ao carregar classes:", error);
      } finally {
        setLoadingClasses(false);
      }
    };
    carregarClasses();
  }, []);

  useEffect(() => {
    const carregarPrestadores = async () => {
      if (!classeId) {
        setPrestadores([]);
        setPrestadorId("");
        return;
      }
      try {
        setLoadingPrestadores(true);
        const dados = await api.getPrestadoresByClasse(classeId);
        setPrestadores(dados || []);
      } catch (error) {
        console.error("Erro ao carregar prestadores:", error);
        setPrestadores([]);
      } finally {
        setLoadingPrestadores(false);
      }
    };
    carregarPrestadores();
  }, [classeId]);

  const nomePrestadorSelecionado =
    prestadores.find((p) => String(p.id) === String(prestadorId))?.nome || "";

  return (
    <div className="flex flex-col gap-1 items-center">
      <div className="flex items-center gap-1">
        <select
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          className="w-[120px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-[13px] uppercase"
          autoFocus
        >
          <option value="">
            {loadingClasses ? "Carregando..." : "Classe..."}
          </option>
          {classes.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nome}
            </option>
          ))}
        </select>
        <select
          value={prestadorId}
          onChange={(e) => setPrestadorId(e.target.value)}
          disabled={!classeId || loadingPrestadores}
          className="w-[140px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-[13px] uppercase disabled:opacity-50"
        >
          <option value="">
            {!classeId
              ? "Prestador..."
              : loadingPrestadores
                ? "Carregando..."
                : "Selecione..."}
          </option>
          {prestadores.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nome}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            onSave({
              profissional: nomePrestadorSelecionado,
              prestador_id: prestadorId ? Number(prestadorId) : null,
              classe_id: classeId ? Number(classeId) : null,
            })
          }
          disabled={!prestadorId}
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
      {!prestadorId && valorInicial && (
        <span className="text-[11px] text-[#71717A]">Atual: {valorInicial}</span>
      )}
    </div>
  );
}
