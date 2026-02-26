import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RotaProtegida from "./services/RotaProtegida";

import Obras from "./pages/obras/Obras";
import ObrasDetalhe from "./pages/obras/ObrasDetalhe";
import Home from "./pages/home/Home";
import Projetos from "./pages/projetos/Projetos";
import Processos from "./pages/processos/Processos";
import LoginCliente from "./pages/login/LoginCliente";
import LoginAdm from "./pages/login/LoginAdm";
import ObrasCliente from "./pages/obras/ObraCliente";
import Financeiro from "./pages/financeiro/Financeiro";
import ProcessosDetalhes from "./pages/processos/ProcessosDetalhes";
import TestePDFViewer from "./pages/testes/TestePDFViewer";

import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login do Cliente */}
          <Route path="/login" element={<LoginCliente />} />

          {/* Login do Admin (RotaSecreta) */}
          <Route path="/loginadm" element={<LoginAdm />} />

          {/* --- ÁREA DO ADMIN --- */}
          <Route element={<RotaProtegida allowedTypes={["admin"]} />}>
            <Route path="/" element={<Home />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/obras" element={<Obras />} />
            <Route path="/processos" element={<Processos />} />
            <Route path="/obra/:id" element={<ObrasDetalhe />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/processo/:id" element={<ProcessosDetalhes />} />
            <Route path="/teste-pdf" element={<TestePDFViewer />} />
          </Route>

          {/* --- ÁREA COMUM --- */}
          <Route
            element={<RotaProtegida allowedTypes={["cliente", "admin"]} />}
          >
            <Route path="/obraCliente/:id" element={<ObrasCliente />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
