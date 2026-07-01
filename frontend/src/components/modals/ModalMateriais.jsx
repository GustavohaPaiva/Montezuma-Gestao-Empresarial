import { useState, useEffect } from "react";
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

export default function ModalMateriais({
  isOpen,
  onClose,
  onSave,
  nomeObra,
  obra,
}) {
  const [material, setMaterial] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("Un.");
  const [dataVencimento, setDataVencimento] = useState("");
  const [etapaNome, setEtapaNome] = useState("");

  const [listaFornecedores, setListaFornecedores] = useState([]);
  const [carregandoFornecedores, setCarregandoFornecedores] = useState(false);

  const listaUnidades = [
    "Sc.",
    "Kg.",
    "Lt.",
    "m²",
    "m³",
    "Un.",
    "Lata",
    "m",
    "cm",
    "Gl.",
    "Mensal",
    "Pç.",
    "Cx.",
  ];

  useEffect(() => {
    if (!isOpen) return;
    const carregarFornecedores = async () => {
      setCarregandoFornecedores(true);
      try {
        const dados = await api.getFornecedoresSimples();
        setListaFornecedores(dados || []);
      } catch (error) {
        console.error("Erro ao carregar lista de fornecedores", error);
      } finally {
        setCarregandoFornecedores(false);
      }
    };
    carregarFornecedores();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setEtapaNome((prev) => prev || getEtapaPadrao(obra) || "");
  }, [isOpen, obra]);

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (!material || !quantidade || !fornecedorId) {
      alert("Preencha o material, a quantidade e selecione um fornecedor!");
      return;
    }

    const erroEtapa = validarEtapaLancamento(obra, etapaNome);
    if (erroEtapa) {
      alert(erroEtapa);
      return;
    }

    onSave({
      material,
      fornecedor_id: fornecedorId,
      quantidade,
      unidade,
      data_vencimento: dataVencimento || null,
      etapa_nome: etapaNome || null,
    });

    setMaterial("");
    setFornecedorId("");
    setQuantidade("");
    setUnidade("Un.");
    setDataVencimento("");
  };

  const etapaObrigatoria = isEtapaObrigatoria(obra);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
        <div className="flex max-h-[95vh] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4">
            <div className="flex-1 min-w-0">
              <h2 className="truncate text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg">
                Solicitação Material
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
                alt="fechar"
              />
            </button>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Material
              </label>
              <input
                type="text"
                placeholder="Ex: Cimento, tijolo..."
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
              />
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Fornecedor
              </label>
              <BaseSelect
                searchable
                loading={carregandoFornecedores}
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                disabled={carregandoFornecedores}
                onCreateOption={async (nome) => {
                  const novo = await api.createFornecedor({ nome, ativo: true });
                  setListaFornecedores((prev) =>
                    [...prev, novo].sort((a, b) =>
                      (a.nome || "").localeCompare(b.nome || ""),
                    ),
                  );
                  return String(novo.id);
                }}
                options={[
                  {
                    value: "",
                    label: carregandoFornecedores
                      ? "Carregando..."
                      : "Selecione um fornecedor",
                  },
                  ...listaFornecedores.map((f) => ({
                    value: String(f.id),
                    label: f.nome,
                  })),
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

            <div className="flex w-full gap-3">
              <div className="flex-[2] flex flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Quant.
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                />
              </div>
              <div className="flex-[1] flex flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Un.
                </label>
                <BaseSelect
                  searchable={false}
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  options={listaUnidades.map((un) => ({
                    value: un,
                    label: un,
                  }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Data de vencimento (opcional)
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
              />
            </div>

            <ButtonDefault
              onClick={handleConfirmar}
              className="!mt-2 !h-11 !w-full !cursor-pointer !rounded-xl !border !border-accent-primary !bg-accent-primary !text-sm !font-bold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.35)] transition-all hover:!bg-accent-primary-dark hover:!shadow-lg"
            >
              Confirmar Solicitação
            </ButtonDefault>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
