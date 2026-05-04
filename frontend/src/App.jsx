import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RotaProtegida from "./services/RotaProtegida";
import PageTransition from "./components/gerais/PageTransition";

import Obras from "./pages/obras/Obras";
import ObrasDetalhe from "./pages/obras/ObrasDetalhe";
import Home from "./pages/home/Home";
import Processos from "./pages/processos/Processos";
import LoginCliente from "./pages/login/LoginCliente";
import LoginAdm from "./pages/login/LoginAdm";
import Obra from "./pages/obras/ObraCliente";
import Financeiro from "./pages/financeiro/Financeiro";
import ProcessosDetalhes from "./pages/processos/ProcessosDetalhes";
import DocumentosProcesso from "./pages/processos/DocumentosProcesso";
import Fornecedores from "./pages/fornecedores/Fornecedores";
import FornecedorDetalhes from "./pages/fornecedores/FornecedorDetalhes";
import Prestadores from "./pages/prestadores/prestadores";
import PrestadorDetalhes from "./pages/prestadores/PrestadorDetalhes";
import TarefasGlobalDock from "./pages/tarefas/TarefasGlobalDock";
import { ID_VOGELKOP, ID_YBYOCA } from "./constants/escritorios";
import LayoutEscritorio from "./pages/escritorios/layouts/LayoutEscritorio";
import HomeEscritorio from "./pages/escritorios/HomeEscritorio";
import TarefasEscritorio from "./pages/escritorios/TarefasEscritorio";
import ClientesEscritorio from "./pages/escritorios/ClientesEscritorio";
import OrcamentoEscritorio from "./pages/escritorios/OrcamentoEscritorio";
import FinanceiroEscritorio from "./pages/escritorios/FinanceiroEscritorio";
import AgendaEscritorio from "./pages/escritorios/AgendaEscritorio";

import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PageTransition>
                <LoginCliente />
              </PageTransition>
            }
          />

          <Route
            path="/loginadm"
            element={
              <PageTransition>
                <LoginAdm />
              </PageTransition>
            }
          />

          <Route
            element={
              <RotaProtegida
                allowedTypes={["diretoria", "suporte_ti", "encarregado"]}
              />
            }
          >
            <Route
              path="/obras"
              element={
                <PageTransition>
                  <Obras />
                </PageTransition>
              }
            />
            <Route
              path="/obrasD/:id"
              element={
                <PageTransition>
                  <ObrasDetalhe />
                </PageTransition>
              }
            />
          </Route>

          <Route
            element={
              <RotaProtegida allowedTypes={["diretoria", "suporte_ti"]} />
            }
          >
            <Route
              path="/fornecedores/:id"
              element={
                <PageTransition>
                  <FornecedorDetalhes />
                </PageTransition>
              }
            />
            <Route
              path="/fornecedores"
              element={
                <PageTransition>
                  <Fornecedores />
                </PageTransition>
              }
            />
            <Route
              path="/prestadores/:id"
              element={
                <PageTransition>
                  <PrestadorDetalhes />
                </PageTransition>
              }
            />
            <Route
              path="/prestadores"
              element={
                <PageTransition>
                  <Prestadores />
                </PageTransition>
              }
            />
          </Route>

          <Route
            element={
              <RotaProtegida
                allowedTypes={[
                  "gestor_master",
                  "diretoria",
                  "secretaria",
                  "suporte_ti",
                ]}
              />
            }
          >
            <Route
              path="/"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />
            <Route
              path="/processos"
              element={
                <PageTransition>
                  <Processos />
                </PageTransition>
              }
            />
            <Route
              path="/processo/:id"
              element={
                <PageTransition>
                  <ProcessosDetalhes />
                </PageTransition>
              }
            />
            <Route
              path="/documentos/:id"
              element={
                <PageTransition>
                  <DocumentosProcesso />
                </PageTransition>
              }
            />
            <Route
              path="/financeiro"
              element={
                <PageTransition>
                  <Financeiro />
                </PageTransition>
              }
            />
          </Route>

          <Route
            element={
              <RotaProtegida
                allowedTypes={["diretoria", "gestor_master"]}
                allowedEscritorios={[ID_VOGELKOP]}
              />
            }
          >
            <Route path="/escritorio/vogelkop" element={<LayoutEscritorio />}>
              <Route
                index
                element={
                  <PageTransition>
                    <HomeEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="tarefas"
                element={
                  <PageTransition>
                    <TarefasEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="clientes"
                element={
                  <PageTransition>
                    <ClientesEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="orcamentos"
                element={
                  <PageTransition>
                    <OrcamentoEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="financeiro"
                element={
                  <PageTransition>
                    <FinanceiroEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="agenda"
                element={
                  <PageTransition>
                    <AgendaEscritorio />
                  </PageTransition>
                }
              />
            </Route>
          </Route>
          <Route
            element={
              <RotaProtegida
                allowedTypes={["diretoria", "gestor_master"]}
                allowedEscritorios={[ID_YBYOCA]}
              />
            }
          >
            <Route path="/escritorio/ybyoca" element={<LayoutEscritorio />}>
              <Route
                index
                element={
                  <PageTransition>
                    <HomeEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="tarefas"
                element={
                  <PageTransition>
                    <TarefasEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="clientes"
                element={
                  <PageTransition>
                    <ClientesEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="orcamentos"
                element={
                  <PageTransition>
                    <OrcamentoEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="financeiro"
                element={
                  <PageTransition>
                    <FinanceiroEscritorio />
                  </PageTransition>
                }
              />
              <Route
                path="agenda"
                element={
                  <PageTransition>
                    <AgendaEscritorio />
                  </PageTransition>
                }
              />
            </Route>
          </Route>

          <Route
            element={
              <RotaProtegida
                allowedTypes={[
                  "cliente",
                  "diretoria",
                  "secretaria",
                  "suporte_ti",
                ]}
              />
            }
          >
            <Route
              path="/obra/:id"
              element={
                <PageTransition>
                  <Obra />
                </PageTransition>
              }
            />
          </Route>
        </Routes>
        <TarefasGlobalDock />
      </Router>
    </AuthProvider>
  );
}
