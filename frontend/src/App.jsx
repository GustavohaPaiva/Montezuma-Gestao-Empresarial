import {
  HashRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RotaProtegida from "./services/RotaProtegida";
import PageTransition from "./components/gerais/PageTransition";
import { AdminPwaProvider } from "./pwa/AdminPwaContext";
import AppShellMatriz from "./layouts/AppShellMatriz";

import Obras from "./pages/obras/Obras";
import ObrasDetalhe from "./pages/obras/ObrasDetalhe";
import PedidoObraDetalhe from "./pages/obras/detalhe/PedidoObraDetalhe";
import PedidosGestao from "./pages/pedidos/PedidosGestao";
import PedidoGestaoDetalhe from "./pages/pedidos/PedidoGestaoDetalhe";
import Home from "./pages/home/Home";
import Processos from "./pages/processos/Processos";
import LoginCliente from "./pages/login/LoginCliente";
import LoginAdm from "./pages/login/LoginAdm";
import Obra from "./pages/obras/ObraCliente";
import FinanceiroHub from "./pages/financeiro/FinanceiroHub";
import Financeiro from "./pages/financeiro/Financeiro";
import FinanceiroMaoDeObra from "./pages/financeiro/FinanceiroMaoDeObra";
import FinanceiroMateriais from "./pages/financeiro/materiais/FinanceiroMateriais";
import FinanceiroMateriaisDetalhe from "./pages/financeiro/materiais/FinanceiroMateriaisDetalhe";
import ProcessosDetalhes from "./pages/processos/ProcessosDetalhes";
import DocumentosProcesso from "./pages/processos/DocumentosProcesso";
import Fornecedores from "./pages/fornecedores/Fornecedores";
import FornecedorDetalhes from "./pages/fornecedores/FornecedorDetalhes";
import SuprimentosServicos from "./pages/suprimentos-servicos/SuprimentosServicos";
import Prestadores from "./pages/prestadores/prestadores";
import PrestadorDetalhes from "./pages/prestadores/PrestadorDetalhes";
import TarefasGlobalDock from "./pages/tarefas/TarefasGlobalDock";
import { ID_ARRUDA, ID_VOGELKOP, ID_YBYOCA } from "./constants/escritorios";
import LayoutEscritorio from "./pages/escritorios/layouts/LayoutEscritorio";
import HomeEscritorio from "./pages/escritorios/HomeEscritorio";
import TarefasEscritorio from "./pages/escritorios/TarefasEscritorio";
import ClientesEscritorio from "./pages/escritorios/ClientesEscritorio";
import OrcamentoEscritorio from "./pages/escritorios/OrcamentoEscritorio";
import OrcamentoDetalhe from "./pages/escritorios/OrcamentoDetalhe";
import FinanceiroEscritorio from "./pages/escritorios/FinanceiroEscritorio";
import AgendaEscritorio from "./pages/escritorios/AgendaEscritorio";
import Projecoes from "./pages/projecoes/Projecoes";
import ProjecaoDetalhe from "./pages/projecoes/ProjecaoDetalhe";
import RelatorioObraDetalhe from "./pages/relatorios-diretoria/RelatorioObraDetalhe";
import RelatorioObraLancamento from "./pages/relatorios-diretoria/RelatorioObraLancamento";
import RelatorioFinanceiroSemana from "./pages/relatorios-diretoria/RelatorioFinanceiroSemana";
import RelatorioSemanaDetalhe from "./pages/relatorios-diretoria/RelatorioSemanaDetalhe";
import OrdensServicoLista from "./pages/ordens-servico/OrdensServicoLista";
import OrdemServicoDetalhe from "./pages/ordens-servico/OrdemServicoDetalhe";
import UsuariosLista from "./pages/usuarios/UsuariosLista";
import UsuarioDetalhe from "./pages/usuarios/UsuarioDetalhe";

import "./index.css";

function RedirectPvToArruda() {
  const { pathname } = useLocation();
  const to = pathname.replace(/^\/escritorio\/pv(?=\/|$)/i, "/escritorio/arruda");
  return <Navigate to={to} replace />;
}

const MATRIZ_STAFF_TYPES = [
  "gestor_master",
  "diretoria",
  "secretaria",
  "suporte_ti",
  "encarregado",
  "funcionario",
  "dono",
  "admin",
];

export default function App() {
  return (
    <AuthProvider>
      <AdminPwaProvider>
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

          <Route path="/escritorio/pv" element={<RedirectPvToArruda />} />
          <Route path="/escritorio/pv/*" element={<RedirectPvToArruda />} />

          <Route
            element={<RotaProtegida allowedTypes={MATRIZ_STAFF_TYPES} />}
          >
            <Route element={<AppShellMatriz />}>
              <Route
                element={
                  <RotaProtegida
                    allowedTypes={[
                      "diretoria",
                      "suporte_ti",
                      "encarregado",
                      "secretaria",
                    ]}
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
                <Route
                  path="/obrasD/:id/pedidos/:pedidoId"
                  element={
                    <PageTransition>
                      <PedidoObraDetalhe />
                    </PageTransition>
                  }
                />
                <Route
                  path="/projecoes"
                  element={
                    <PageTransition>
                      <Projecoes />
                    </PageTransition>
                  }
                />
                <Route
                  path="/projecoes/:id"
                  element={
                    <PageTransition>
                      <ProjecaoDetalhe />
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
                  path="/suprimentos-servicos"
                  element={
                    <PageTransition>
                      <SuprimentosServicos />
                    </PageTransition>
                  }
                />
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
                      "encarregado",
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
                <Route path="/documentos/:id" element={<DocumentosProcesso />} />
                <Route
                  path="/financeiro"
                  element={
                    <PageTransition>
                      <FinanceiroHub />
                    </PageTransition>
                  }
                />
                <Route
                  path="/financeiro/escritorio"
                  element={
                    <PageTransition>
                      <Financeiro />
                    </PageTransition>
                  }
                />
                <Route
                  path="/financeiro/materiais"
                  element={
                    <PageTransition>
                      <FinanceiroMateriais />
                    </PageTransition>
                  }
                />
                <Route
                  path="/financeiro/materiais/:fornecedorId"
                  element={
                    <PageTransition>
                      <FinanceiroMateriaisDetalhe />
                    </PageTransition>
                  }
                />
                <Route
                  path="/financeiro/mao-de-obra"
                  element={
                    <PageTransition>
                      <FinanceiroMaoDeObra />
                    </PageTransition>
                  }
                />
                <Route
                  path="/pedidos"
                  element={
                    <PageTransition>
                      <PedidosGestao />
                    </PageTransition>
                  }
                />
                <Route
                  path="/pedidos/:pedidoId"
                  element={
                    <PageTransition>
                      <PedidoGestaoDetalhe />
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
                      "encarregado",
                      "funcionario",
                      "dono",
                      "admin",
                    ]}
                  />
                }
              >
                <Route
                  path="/ordens-servico"
                  element={
                    <PageTransition>
                      <OrdensServicoLista variant="montezuma" />
                    </PageTransition>
                  }
                />
                <Route
                  path="/ordens-servico/:id"
                  element={
                    <PageTransition>
                      <OrdemServicoDetalhe variant="montezuma" />
                    </PageTransition>
                  }
                />
              </Route>

              <Route
                element={
                  <RotaProtegida allowedTypes={["gestor_master", "diretoria"]} />
                }
              >
                <Route
                  path="/relatorios-diretoria/semana/:semanaRef/obra"
                  element={
                    <PageTransition>
                      <RelatorioObraLancamento />
                    </PageTransition>
                  }
                />
                <Route
                  path="/relatorios-diretoria/semana/:semanaRef/financeiro"
                  element={
                    <PageTransition>
                      <RelatorioFinanceiroSemana />
                    </PageTransition>
                  }
                />
                <Route
                  path="/relatorios-diretoria/semana/:semanaRef"
                  element={
                    <PageTransition>
                      <RelatorioSemanaDetalhe />
                    </PageTransition>
                  }
                />
                <Route
                  path="/relatorios-diretoria"
                  element={
                    <PageTransition>
                      <RelatorioObraDetalhe />
                    </PageTransition>
                  }
                />
              </Route>

              <Route
                element={
                  <RotaProtegida allowedTypes={["diretoria", "gestor_master"]} />
                }
              >
                <Route
                  path="/usuarios"
                  element={
                    <PageTransition>
                      <UsuariosLista />
                    </PageTransition>
                  }
                />
                <Route
                  path="/usuarios/novo"
                  element={
                    <PageTransition>
                      <UsuarioDetalhe modoCriacao />
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
                      "encarregado",
                      "funcionario",
                      "dono",
                      "admin",
                    ]}
                  />
                }
              >
                <Route
                  path="/usuarios/:id"
                  element={
                    <PageTransition>
                      <UsuarioDetalhe />
                    </PageTransition>
                  }
                />
              </Route>
            </Route>
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
                path="orcamentos/:orcamentoId"
                element={
                  <PageTransition>
                    <OrcamentoDetalhe />
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
              <Route
                path="ordens-servico"
                element={
                  <PageTransition>
                    <OrdensServicoLista variant="vogelkop" />
                  </PageTransition>
                }
              />
              <Route
                path="ordens-servico/:id"
                element={
                  <PageTransition>
                    <OrdemServicoDetalhe variant="vogelkop" />
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
                allowedTypes={["diretoria", "gestor_master"]}
                allowedEscritorios={[ID_ARRUDA]}
              />
            }
          >
            <Route path="/escritorio/arruda" element={<LayoutEscritorio />}>
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
      </AdminPwaProvider>
    </AuthProvider>
  );
}
