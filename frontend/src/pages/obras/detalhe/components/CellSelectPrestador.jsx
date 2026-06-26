import { useEffect, useState } from "react";
import BaseSelect from "../../../../components/gerais/BaseSelect";
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
    <div className="flex flex-nowrap items-center justify-center gap-1">
      <BaseSelect
        size="compact"
        searchable
        autoFocus
        loading={loadingClasses}
        value={classeId}
        onChange={(e) => {
          setClasseId(e.target.value);
          setPrestadorId("");
        }}
        className="w-[120px] shrink-0"
        onCreateOption={async (nome) => {
          const nova = await api.createClassePrestador({ nome });
          setClasses((prev) =>
            [...prev, nova].sort((a, b) =>
              (a.nome || "").localeCompare(b.nome || ""),
            ),
          );
          return String(nova.id);
        }}
        options={[
          { value: "", label: loadingClasses ? "Carregando..." : "Classe..." },
          ...classes.map((op) => ({
            value: String(op.id),
            label: op.nome,
          })),
        ]}
      />
      <BaseSelect
        size="compact"
        searchable
        loading={loadingPrestadores}
        value={prestadorId}
        onChange={(e) => setPrestadorId(e.target.value)}
        disabled={!classeId || loadingPrestadores}
        className="w-[140px] shrink-0"
        onCreateOption={async (nome) => {
          const novo = await api.createPrestador({
            nome,
            ativo: true,
            classe_ids: [Number(classeId)],
          });
          setPrestadores((prev) =>
            [...prev, { id: novo.id, nome: novo.nome }].sort((a, b) =>
              (a.nome || "").localeCompare(b.nome || ""),
            ),
          );
          return String(novo.id);
        }}
        options={[
          {
            value: "",
            label: !classeId
              ? "Prestador..."
              : loadingPrestadores
                ? "Carregando..."
                : "Selecione...",
          },
          ...prestadores.map((op) => ({
            value: String(op.id),
            label: op.nome,
          })),
        ]}
      />
      <button
        type="button"
        onClick={() =>
          onSave({
            profissional: nomePrestadorSelecionado,
            prestador_id: prestadorId ? Number(prestadorId) : null,
            classe_id: classeId ? Number(classeId) : null,
          })
        }
        disabled={!prestadorId}
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
      {!prestadorId && valorInicial ? (
        <span className="max-w-[140px] truncate text-[11px] text-[#71717A]">
          Atual: {valorInicial}
        </span>
      ) : null}
    </div>
  );
}
