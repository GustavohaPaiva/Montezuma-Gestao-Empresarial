import { useEffect, useMemo, useState } from "react";
import ButtonDefault from "../gerais/ButtonDefault";
import BaseSelect from "../gerais/BaseSelect";
import ModalPortal from "../gerais/ModalPortal";
import { api } from "../../services/api";
import {
  etapasParaSelectOptions,
  getEtapaPadrao,
  isEtapaObrigatoria,
  validarEtapaLancamento,
} from "../../pages/obras/detalhe/utils/etapasLancamento";

export default function ModalMaoDeObra({ isOpen, onClose, onSave, nomeObra, obra }) {
  const [formData, setFormData] = useState({
    tipo: "",
    classe_id: "",
    prestador_id: "",
    valor: "",
  });
  const [etapaNome, setEtapaNome] = useState("");
  const [classes, setClasses] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingPrestadores, setLoadingPrestadores] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setEtapaNome((prev) => prev || getEtapaPadrao(obra) || "");
  }, [isOpen, obra]);

  useEffect(() => {
    const carregarPrestadores = async () => {
      if (!formData.classe_id) {
        setPrestadores([]);
        return;
      }

      try {
        setLoadingPrestadores(true);
        const dados = await api.getPrestadoresByClasse(formData.classe_id);
        setPrestadores(dados || []);
      } catch (error) {
        console.error("Erro ao carregar prestadores por classe:", error);
        setPrestadores([]);
      } finally {
        setLoadingPrestadores(false);
      }
    };
    carregarPrestadores();
  }, [formData.classe_id]);

  const prestadorSelecionado = useMemo(
    () =>
      prestadores.find((p) => String(p.id) === String(formData.prestador_id)),
    [prestadores, formData.prestador_id],
  );

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.tipo || !formData.classe_id || !formData.prestador_id) {
      alert("Preencha serviço, classe e prestador.");
      return;
    }

    const erroEtapa = validarEtapaLancamento(obra, etapaNome);
    if (erroEtapa) {
      alert(erroEtapa);
      return;
    }

    onSave({
      ...formData,
      profissional: prestadorSelecionado?.nome || "",
      classe_id: Number(formData.classe_id),
      prestador_id: Number(formData.prestador_id),
      etapa_nome: etapaNome || null,
    });

    setFormData({ tipo: "", classe_id: "", prestador_id: "", valor: "" });
    setPrestadores([]);
  };

  const etapaObrigatoria = isEtapaObrigatoria(obra);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
        <div className="flex w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4">
            <div className="flex-1 min-w-0">
              <h2 className="truncate text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg">
                Solicitação Mão de Obra
              </h2>
              <p className="truncate text-xs text-text-muted sm:text-sm">
                Obra: {nomeObra}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border-primary/40 bg-[#FAFAFA] transition-all hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            >
              <img
                width="20"
                height="20"
                src="https://img.icons8.com/ios/50/multiply.png"
                alt="multiply"
              />
            </button>
          </div>

          <div className="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Serviço
              </label>
              <input
                type="text"
                placeholder="Ex: Pintura de fachada"
                value={formData.tipo}
                className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Classe do Serviço
              </label>
              <BaseSelect
                searchable
                loading={loadingClasses}
                value={formData.classe_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    classe_id: e.target.value,
                    prestador_id: "",
                  })
                }
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
                  {
                    value: "",
                    label: loadingClasses
                      ? "Carregando classes..."
                      : "Selecione uma classe...",
                  },
                  ...(classes?.map((classe) => ({
                    value: String(classe.id),
                    label: classe.nome,
                  })) ?? []),
                ]}
              />
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Prestador
              </label>
              <BaseSelect
                searchable
                loading={loadingPrestadores}
                value={formData.prestador_id}
                onChange={(e) =>
                  setFormData({ ...formData, prestador_id: e.target.value })
                }
                disabled={!formData.classe_id || loadingPrestadores}
                onCreateOption={async (nome) => {
                  const novo = await api.createPrestador({
                    nome,
                    ativo: true,
                    classe_ids: [Number(formData.classe_id)],
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
                    label: !formData.classe_id
                      ? "Selecione uma classe primeiro..."
                      : loadingPrestadores
                        ? "Carregando prestadores..."
                        : "Selecione um prestador...",
                  },
                  ...(prestadores?.map((opcao) => ({
                    value: String(opcao.id),
                    label: opcao.nome,
                  })) ?? []),
                ]}
              />
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Etapa{etapaObrigatoria ? " *" : ""}
              </label>
              <BaseSelect
                searchable
                value={etapaNome}
                onChange={(e) => setEtapaNome(e.target.value)}
                options={[
                  {
                    value: "",
                    label: etapaObrigatoria
                      ? "Selecione a etapa..."
                      : "— Sem etapa —",
                  },
                  ...etapasParaSelectOptions(obra, { incluirVazio: false }),
                ]}
              />
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Valor Estimado
              </label>
              <input
                type="number"
                placeholder="R$ 0,00"
                value={formData.valor}
                className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                onChange={(e) =>
                  setFormData({ ...formData, valor: e.target.value })
                }
              />
            </div>

            <ButtonDefault
              onClick={handleSave}
              className="!mt-2 !h-11 !w-full !cursor-pointer !rounded-xl !border !border-accent-primary !bg-accent-primary !text-sm !font-bold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.35)] transition-all hover:!bg-accent-primary-dark hover:!shadow-lg"
            >
              Confirmar Registro
            </ButtonDefault>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
