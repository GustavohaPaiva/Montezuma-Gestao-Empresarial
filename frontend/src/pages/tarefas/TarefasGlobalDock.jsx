import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import ListaTarefas from "./ListaTarefas";
import ModalPortal from "../../components/gerais/ModalPortal";
import { contarTarefasPendentesBadge } from "./tarefasHelpers";

const TIPOS_COM_ACESSO = [
  "gestor_master",
  "diretoria",
  "secretaria",
  "suporte_ti",
  "funcionario",
];

export default function TarefasGlobalDock() {
  const { user } = useAuth();
  const location = useLocation();
  const { pathname } = location;
  const [aberto, setAberto] = useState(false);
  const [contagem, setContagem] = useState(0);
  const [tick, setTick] = useState(0);

  const mostrarDock =
    user && user.tipo !== "cliente" && TIPOS_COM_ACESSO.includes(user.tipo);

  const refreshContagem = useCallback(async () => {
    if (!user?.id || !mostrarDock) {
      setContagem(0);
      return;
    }
    try {
      const { data, error } = await supabase.from("tarefas").select(`
          id,
          status,
          criador_id,
          escritorio_id,
          responsaveis:tarefa_responsaveis(
            usuarios!usuario_id(id)
          )
        `);
      if (error) throw error;
      const lista = Array.isArray(data) ? data : [];
      setContagem(contarTarefasPendentesBadge(user, lista));
    } catch (e) {
      console.error(e);
    }
  }, [user, mostrarDock]);

  useEffect(() => {
    refreshContagem();
  }, [refreshContagem, tick, pathname]);

  useEffect(() => {
    if (!aberto) return;
    const id = setInterval(() => refreshContagem(), 45000);
    return () => clearInterval(id);
  }, [aberto, refreshContagem]);

  const isLoginRoute = location.pathname.toLowerCase().includes("/login");

  useEffect(() => {
    if (isLoginRoute) setAberto(false);
  }, [isLoginRoute]);

  if (!mostrarDock) return null;

  if (pathname.includes("/escritorio")) return null;

  return (
    <>
      {!isLoginRoute && (
        <>
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-800 shadow-md ring-1 ring-gray-200 transition hover:shadow-lg hover:ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            aria-label="Abrir tarefas"
          >
            <Bell className="h-6 w-6" strokeWidth={1.75} />
            {contagem > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm">
                {contagem > 99 ? "99+" : contagem}
              </span>
            )}
          </button>

          {aberto && (
            <ModalPortal>
              <div className="fixed inset-0 z-[100] flex justify-end">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
                  aria-label="Fechar painel de tarefas"
                  onClick={() => setAberto(false)}
                />
                <div
                  className="relative flex h-[100dvh] max-h-[100dvh] w-[90vw] max-w-5xl flex-col bg-white shadow-sm ring-1 ring-gray-200 lg:ml-auto"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <ListaTarefas
                      embedded
                      onClose={() => setAberto(false)}
                      onTasksUpdated={() => {
                        setTick((n) => n + 1);
                        refreshContagem();
                      }}
                    />
                  </div>
                </div>
              </div>
            </ModalPortal>
          )}
        </>
      )}
    </>
  );
}
