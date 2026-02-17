import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RotaProtegida from "./RotaProtegida";

import Obras from "./pages/Obras";
import ObrasDetalhe from "./pages/ObrasDetalhe";
import Home from "./pages/Home"; // <--- Home voltou!
import Projetos from "./pages/Projetos";
import Processos from "./pages/Processos";
import LoginCliente from "./pages/LoginCliente";
import LoginAdm from "./pages/LoginAdm";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* --- ROTAS PÚBLICAS (Acesso livre) --- */}

          {/* Login do Cliente */}
          <Route path="/login" element={<LoginCliente />} />

          {/* Login do Admin (RotaSecreta) */}
          <Route path="/loginadm212" element={<LoginAdm />} />

          {/* --- ÁREA DO ADMIN (Só você vê) --- */}
          <Route element={<RotaProtegida allowedTypes={["admin"]} />}>
            {/* Agora a rota "/" é a HOME, acessível apenas após logar */}
            <Route path="/" element={<Home />} />

            <Route path="/projetos" element={<Projetos />} />
            <Route path="/obras" element={<Obras />} />
            <Route path="/processos" element={<Processos />} />
          </Route>

          {/* --- ÁREA COMUM --- */}
          <Route
            element={<RotaProtegida allowedTypes={["cliente", "admin"]} />}
          >
            <Route path="/obra/:id" element={<ObrasDetalhe />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
