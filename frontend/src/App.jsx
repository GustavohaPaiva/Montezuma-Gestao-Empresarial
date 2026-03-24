import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RotaProtegida from "./services/RotaProtegida";
import PageTransition from "./components/gerais/PageTransition";

import Obras from "./pages/obras/Obras";
import ObrasDetalhe from "./pages/obras/ObrasDetalhe";
import Home from "./pages/home/Home";
import Projetos from "./pages/projetos/Projetos";
import Processos from "./pages/processos/Processos";
import LoginCliente from "./pages/login/LoginCliente";
import LoginAdm from "./pages/login/LoginAdm";
import Obra from "./pages/obras/ObraCliente";
import Financeiro from "./pages/financeiro/Financeiro";
import ProcessosDetalhes from "./pages/processos/ProcessosDetalhes";
import DocumentosProcesso from "./pages/processos/DocumentosProcesso";

import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login do Cliente */}
          <Route
            path="/login"
            element={
              <PageTransition>
                <LoginCliente />
              </PageTransition>
            }
          />

          {/* Login do Admin (RotaSecreta) */}
          <Route
            path="/loginadm"
            element={
              <PageTransition>
                <LoginAdm />
              </PageTransition>
            }
          />

          {/* --- ÁREA EXCLUSIVA DO ADM (Obras, Projetos) --- */}
          <Route element={<RotaProtegida allowedTypes={["adm"]} />}>
            <Route
              path="/projetos"
              element={
                <PageTransition>
                  <Projetos />
                </PageTransition>
              }
            />
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

          {/* --- ÁREA COMPARTILHADA (ADM + SECRETARIA) --- */}
          <Route
            element={<RotaProtegida allowedTypes={["adm", "secretaria"]} />}
          >
            {/* A HOME AGORA ESTÁ AQUI, PARA A SECRETÁRIA ACESSAR O PAINEL DE CARDS */}
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

          {/* --- ÁREA COMUM (CLIENTE + ADM) --- */}
          <Route element={<RotaProtegida allowedTypes={["cliente", "adm"]} />}>
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
      </Router>
    </AuthProvider>
  );
}
