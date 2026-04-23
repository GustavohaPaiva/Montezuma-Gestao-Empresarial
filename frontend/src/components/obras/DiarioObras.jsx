import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import ButtonDefault from "../gerais/ButtonDefault";
import ModalPortal from "../gerais/ModalPortal";

/** @param {string | undefined} iso */
function formatarDataHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const DD = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const YYYY = d.getFullYear();
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${DD}/${MM}/${YYYY} às ${HH}:${mm}`;
}

const BATCH = 100;

/**
 * @param {{ obraId: string | number | undefined }} props
 */
export default function DiarioObras({ obraId }) {
  const { user } = useAuth();

  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [texto, setTexto] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [textoEdicao, setTextoEdicao] = useState("");

  const [msgErro, setMsgErro] = useState(null);
  const [idExcluirPendente, setIdExcluirPendente] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const fecharErro = () => setMsgErro(null);
  const fecharConfirmarExcluir = () => {
    if (!excluindo) setIdExcluirPendente(null);
  };

  const carregarTudo = useCallback(async () => {
    if (obraId == null || String(obraId) === "") {
      setItens([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const acc = [];
      let offset = 0;
      let hasMore = true;
      while (hasMore) {
        const { rows, hasMore: more } = await api.getDiarioObras(
          obraId,
          BATCH,
          offset,
        );
        acc.push(...rows);
        offset += rows.length;
        hasMore = more;
      }
      setItens(acc);
    } catch (e) {
      console.error("[DiarioObras] carregar:", e);
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  const handleEnviar = async () => {
    const msg = String(texto || "").trim();
    if (!msg || !obraId || !user) return;
    setEnviando(true);
    try {
      const novo = await api.addDiarioObra({
        obra_id: obraId,
        user_id: user.id,
        nome_usuario: user.nome || user.email || "Usuário",
        mensagem: msg,
      });
      setTexto("");
      setItens((prev) => [novo, ...prev]);
    } catch (e) {
      console.error("[DiarioObras] enviar:", e);
      setMsgErro(e?.message || "Não foi possível publicar a mensagem.");
    } finally {
      setEnviando(false);
    }
  };

  const iniciarEdicao = (item) => {
    setEditandoId(item.id);
    setTextoEdicao(item.mensagem || "");
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setTextoEdicao("");
  };

  const salvarEdicao = async (id) => {
    const msg = String(textoEdicao || "").trim();
    if (!msg) return;
    try {
      const atualizado = await api.updateDiarioObra(id, msg);
      setItens((prev) => prev.map((i) => (i.id === id ? atualizado : i)));
      cancelarEdicao();
    } catch (e) {
      console.error("[DiarioObras] editar:", e);
      setMsgErro(e?.message || "Não foi possível salvar.");
    }
  };

  const abrirExcluir = (id) => setIdExcluirPendente(id);

  const executarExclusao = async () => {
    if (idExcluirPendente == null) return;
    setExcluindo(true);
    const id = idExcluirPendente;
    try {
      await api.deleteDiarioObra(id);
      setItens((prev) => prev.filter((i) => i.id !== id));
      setIdExcluirPendente(null);
    } catch (e) {
      console.error("[DiarioObras] excluir:", e);
      setIdExcluirPendente(null);
      setMsgErro(e?.message || "Não foi possível excluir.");
    } finally {
      setExcluindo(false);
    }
  };

  const podeInteragir = Boolean(user);
  const souAutor = (item) =>
    user != null && String(item.user_id) === String(user.id);

  return (
    <div className="w-full mx-auto mb-6 flex flex-col gap-4 text-left bg-surface border border-border-primary rounded-2xl shadow-sm p-5 md:p-6">
      <h2 className="text-lg md:text-[22px] font-bold text-text-primary tracking-tight">
        Diário de Obras
      </h2>

      {/* Histórico (recentes no topo) */}
      <div
        className="flex flex-col gap-3 max-h-[280px] md:max-h-[560px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--color-border-muted)_transparent] scroll-smooth
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-border-muted/80
        hover:[&::-webkit-scrollbar-thumb]:bg-border-primary/60"
      >
        {loading && <p className="text-sm text-text-muted py-2">A carregar…</p>}
        {!loading && itens.length === 0 && (
          <p className="text-sm text-text-muted py-2">Sem entradas ainda.</p>
        )}
        {!loading &&
          itens.map((item) => (
            <article
              key={item.id}
              className="relative bg-surface border border-border-primary rounded-2xl p-4 shadow-sm"
            >
              {souAutor(item) && editandoId !== item.id && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => iniciarEdicao(item)}
                    className="p-1.5 rounded-lg text-text-muted transition-colors hover:text-accent-primary hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-border-muted"
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirExcluir(item.id)}
                    className="p-1.5 rounded-lg text-text-muted transition-colors hover:text-danger-primary hover:bg-danger-soft/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-muted"
                    title="Excluir"
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              )}

              <div
                className={
                  souAutor(item) && editandoId !== item.id ? "pr-14" : ""
                }
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-bold text-text-primary">
                    {item.nome_usuario || "—"}
                  </span>
                  <span className="text-xs font-medium text-text-muted/90">
                    {formatarDataHora(item.created_at)}
                  </span>
                </div>
                {editandoId === item.id ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <textarea
                      value={textoEdicao}
                      onChange={(e) => setTextoEdicao(e.target.value)}
                      rows={3}
                      className="w-full box-border border border-border-primary rounded-xl bg-surface-alt p-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface"
                    />
                    <div className="flex gap-2">
                      <ButtonDefault
                        onClick={() => salvarEdicao(item.id)}
                        className="!h-9 !text-sm !rounded-lg !bg-accent-primary !text-white !border-accent-primary hover:!bg-accent-primary-dark"
                      >
                        Guardar
                      </ButtonDefault>
                      <button
                        type="button"
                        onClick={cancelarEdicao}
                        className="text-sm text-text-muted underline px-2 py-1.5 rounded-lg hover:text-text-primary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-primary/90 mt-2 leading-relaxed whitespace-pre-wrap break-words">
                    {item.mensagem}
                  </p>
                )}
              </div>
            </article>
          ))}
      </div>

      {/* Lançamento */}
      {podeInteragir && (
        <div className="pt-1 border-t border-border-primary/50 flex flex-col gap-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Registre uma observação, progresso ou ocorrência…"
            rows={3}
            className="w-full min-h-[44px] mt-2 box-border resize-y rounded-xl border border-border-primary bg-surface-alt px-3.5 py-3 text-sm text-text-primary placeholder:text-text-muted/80 transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-0 focus:bg-surface"
          />
          <div className="flex justify-end">
            <ButtonDefault
              onClick={handleEnviar}
              disabled={enviando || !String(texto || "").trim()}
              className="!min-w-[128px] !w-full !h-10 !rounded-xl !font-semibold !bg-accent-primary !text-white !border-accent-primary hover:!bg-accent-primary-dark"
            >
              {enviando ? "A enviar…" : "Publicar"}
            </ButtonDefault>
          </div>
        </div>
      )}

      {msgErro != null && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
            onClick={fecharErro}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="diario-obra-erro-titulo"
              className="w-full max-w-sm rounded-2xl border border-border-primary bg-surface p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                id="diario-obra-erro-titulo"
                className="text-sm font-bold text-text-primary"
              >
                Atenção
              </h3>
              <p className="mt-2 text-sm text-text-primary/90 leading-relaxed">
                {msgErro}
              </p>
              <div className="mt-4 flex justify-end">
                <ButtonDefault
                  type="button"
                  onClick={fecharErro}
                  className="!h-9 !px-4 !text-sm !rounded-lg !bg-accent-primary !text-white !border-accent-primary hover:!bg-accent-primary-dark"
                >
                  Entendi
                </ButtonDefault>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {idExcluirPendente != null && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
            onClick={fecharConfirmarExcluir}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="diario-obra-excluir-titulo"
              className="w-full max-w-sm rounded-2xl border border-border-primary bg-surface p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                id="diario-obra-excluir-titulo"
                className="text-sm font-bold text-text-primary"
              >
                Excluir mensagem?
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Esta ação não pode ser desfeita.
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <ButtonDefault
                  type="button"
                  onClick={fecharConfirmarExcluir}
                  disabled={excluindo}
                  className="!h-9 !px-3 !text-sm !rounded-lg"
                >
                  Cancelar
                </ButtonDefault>
                <ButtonDefault
                  type="button"
                  onClick={executarExclusao}
                  disabled={excluindo}
                  className="!h-9 !px-3 !text-sm !rounded-lg !text-danger-primary !border-danger-primary/40 hover:!bg-danger-soft/80"
                >
                  {excluindo ? "A excluir…" : "Excluir"}
                </ButtonDefault>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
