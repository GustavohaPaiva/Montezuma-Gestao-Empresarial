import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Obras from "./pages/Obras";
import ObrasDetalhe from "./pages/ObrasDetalhe";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Obras />} />
        <Route path="/obra/:id" element={<ObrasDetalhe />} />
      </Routes>
    </Router>
  );
}
