import { BrowserRouter, Routes, Route } from "react-router-dom";
import Obras from "./pages/Obras";
import ObrasDetalhe from "./pages/ObrasDetalhe";

export default function App() {
  return (
    <BrowserRouter basename="/Montezuma-Gest-o-de-Obras-">
      <Routes>
        <Route path="/" element={<Obras />} />
        <Route path="/obra/:id" element={<ObrasDetalhe />} />
      </Routes>
    </BrowserRouter>
  );
}
