import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Obras from "./pages/Obras";
import ObrasDetalhe from "./pages/ObrasDetalhe";
import Home from "./pages/Home";
import Projetos from "./pages/Projetos";
import Processos from "./pages/Processos";
import "./index.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projetos" element={<Projetos />} />
        <Route path="/obras" element={<Obras />} />
        <Route path="/obra/:id" element={<ObrasDetalhe />} />
        <Route path="/processos" element={<Processos />} />
      </Routes>
    </Router>
  );
}
