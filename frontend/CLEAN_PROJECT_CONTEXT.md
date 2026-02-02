# CONTEXTO TÉCNICO PARA ANÁLISE
> Este arquivo serve para que a IA entenda as dependências já instaladas e a lógica atual, evitando redundâncias.

### Caminho: eslint.config.js
```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])

```

---
### Caminho: package.json
```javascript
{
  "homepage": "https://GustavohaPaiva.githubio/Montezuma-Gest-o-de-Obras-",
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "jspdf": "^4.0.0",
    "jspdf-autotable": "^5.0.7",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.13.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@tailwindcss/postcss": "^4.1.18",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "vite": "^7.2.4"
  }
}

```

---
### Caminho: postcss.config.js
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};

```

---
### Caminho: tailwind.config.js
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

```

---
### Caminho: vite.config.js
```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/Montezuma-Gest-o-de-Obras-",
});

```

---
### Caminho: src\App.jsx
```javascript
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

```

---
### Caminho: src\main.jsx
```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

```

---
### Caminho: src\components\ButtonDefault.jsx
```javascript
export default function ButtonDefault({ children, className = "", onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#F7F7F8] border border-[#C4C4C9] rounded-[6px] h-[40px] text-[18px] text-[#464C54] transition-all active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

```

---
### Caminho: src\components\Navbar.jsx
```javascript
import ButtonDefault from "./ButtonDefault";
import logo from "../assets/logo.png";

export default function Navbar({ searchTerm, onSearchChange }) {
  return (
    <header className="w-full border-b border-[#DBDADE] flex justify-center bg-white sticky top-0 z-10">
      <div className="w-[90%] max-w-7xl h-[82px] flex items-center justify-between gap-[20px]">
        <img src={logo} alt="" className="w-[120px] h-[75px] object-contain" />

        <div className="flex items-center gap-[10px]">
          <div className="relative w-full max-w-[250px]">
            <input
              type="text"
              placeholder="Buscar obra ou cliente..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-[#F7F7F8] border border-[#C4C4C9] rounded-[6px] h-[35px] text-[18px] text-[#464C54] transition-all active:scale-[0.98]"
            />
            <span className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"></span>
          </div>

          <ButtonDefault className="w-[150px] text-[14px] shrink-0">
            + Nova Obra
          </ButtonDefault>
        </div>
      </div>
    </header>
  );
}

```

---
### Caminho: src\components\ObraCard.jsx
```javascript
import { Link } from "react-router-dom";

export default function ObraCard({ id, nome, client, status }) {
  const isAndamento = status.toLowerCase().includes("andamento");
  const bgColor = isAndamento ? "bg-[#FFF4E5]" : "bg-[#E6F4EA]";
  const textColor = isAndamento ? "text-[#B95000]" : "text-[#1E8E3E]";

  return (
    <Link
      to={`/obra/${id}`}
      className="no-underline text-inherit block bg-[#FAFAFA] rounded-[8px] w-full h-[200px] flex flex-col justify-between p-[20px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] max-w-[350px] box-border transition-transform hover:scale-[1.02] cursor-pointer no-underline text-black"
    >
      <div>
        <h2 className="text-[22px] font-bold leading-tight mb-1 text-center">
          {nome}
        </h2>
        <p className="text-[16px] text-gray-600 text-center">
          <span className="font-semibold">Cliente:</span> {client}
        </p>
      </div>

      <div className="flex justify-center">
        <span
          className={`text-sm ${bgColor} ${textColor} w-[50%] px-4 rounded-[8px] h-[35px] flex font-bold items-center justify-center box-border`}
        >
          <img
            width="25"
            height="25"
            src="https://img.icons8.com/ios-glyphs/30/full-stop--v1.png"
            alt="full-stop--v1"
            style={{
              filter: isAndamento
                ? "invert(37%) sepia(93%) saturate(1200%) hue-rotate(10deg)"
                : "invert(36%) sepia(85%) saturate(450%) hue-rotate(95deg)",
            }}
          />
          {status}
        </span>
      </div>
    </Link>
  );
}

```

---
### Caminho: src\components\TabelaSimples.jsx
```javascript
export default function TabelaSimples({ titulo, colunas, dados }) {
  return (
    <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[8px] overflow-hidden shadow-sm w-full mb-[24px]">
      <div className="border-b border-[#DBDADE] bg-[#FBFBFC] flex justify-center">
        <h3 className="font-bold text-[#464C54]">{titulo}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#EEEEF0] text-[#71717A] text-[14px] uppercase text-center">
              {colunas.map((col, i) => (
                <th key={i} className="p-[12px] font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#464C54] text-center">
            {dados.map((linha, i) => (
              <tr
                key={i}
                className="border-b border-[#F0F0F2] last:border-0 hover:bg-[#F9FAFB]"
              >
                {Object.values(linha).map((valor, j) => (
                  <td key={j} className="p-[12px]">
                    {valor}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

```

---
### Caminho: src\pages\Obras.jsx
```javascript
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ObraCard from "../components/ObraCard";
import { api } from "../services/api";

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    api.getObras().then((dados) => setObras(dados));
  }, []);

  const obrasFiltradas = obras.filter(
    (obra) =>
      obra.nome.toLowerCase().includes(busca.toLowerCase()) ||
      obra.client.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="flex flex-col min-h-screen items-center bg-white">
      <Navbar searchTerm={busca} onSearchChange={setBusca} />

      <main className="w-[90%] mt-[40px]">
        <div className="grid grid-cols-3 grid-cols-[repeat(auto-fit,minmax(0,350px))] gap-y-[30px] w-full justify-between ">
          {obrasFiltradas.map((obra) => (
            <ObraCard
              key={obra.id}
              id={obra.id}
              nome={obra.nome}
              client={obra.client}
              status={obra.status}
            />
          ))}

          {obrasFiltradas.length === 0 && (
            <p className="col-span-full text-gray-400 mt-10">
              Nenhuma obra encontrada para "{busca}"
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

```

---
### Caminho: src\pages\ObrasDetalhe.jsx
```javascript
import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../components/TabelaSimples";
import ButtonDefault from "../components/ButtonDefault";
import { gerarPDF } from "../services/pdfService";
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function ObrasDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obra, setObra] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    api.getObraById(id).then((dados) => setObra(dados));

    return () => window.removeEventListener("resize", handleResize);
  }, [id]);

  if (!obra)
    return <div className="flex justify-center mt-20">Carregando...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0] pb-[40px]">
      <header className="h-[82px] border-b border-[#DBDADE] flex justify-center sticky top-0 z-10 w-full bg-white">
        <div className="w-[90%] flex items-center justify-between">
          <div className="flex items-center gap-[16px]">
            <button
              onClick={() => navigate(-1)}
              className="border-none bg-transparent cursor-pointer flex items-center"
            >
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/ios/50/back--v1.png"
                alt="voltar"
              />
            </button>
            {!isMobile && (
              <h1 className="text-[20px] font-bold uppercase tracking-[2px]">
                {obra.nome}
              </h1>
            )}
          </div>
          {isMobile && (
            <h1 className="text-[18px] font-bold uppercase tracking-[2px]">
              {obra.nome}
            </h1>
          )}
          {!isMobile && (
            <div className="flex gap-[16px]">
              <ButtonDefault className="w-[180px] text-[14px]">
                + Materiais
              </ButtonDefault>
              <ButtonDefault className="w-[180px] text-[14px]">
                + Mão de Obra
              </ButtonDefault>
            </div>
          )}
        </div>
      </header>

      <main className="w-[90%] mt-[24px]">
        {isMobile && (
          <div className="flex flex-col gap-[12px] mb-[24px]">
            <ButtonDefault className="w-full h-[50px] text-[18px]">
              + Solicitar Materiais
            </ButtonDefault>
            <ButtonDefault className="w-full h-[50px] text-[18px]">
              + Solicitar Mão de Obra
            </ButtonDefault>
          </div>
        )}

        <div>
          <TabelaSimples
            titulo="Relatório de Materiais"
            colunas={["Material", "Quantidade", "Data"]}
            dados={obra.materiais}
          />

          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[12px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px]">
            <TabelaSimples
              titulo="Relatório de Mão de Obra"
              colunas={["Tipo", "Valor", "Data"]}
              dados={obra.maoDeObra}
            />
            <ButtonDefault
              onClick={() =>
                gerarPDF(
                  "Relatorio de Mao de Obra",
                  ["Profissão", "Valor", "Data de Execução"],
                  obra.maoDeObra,
                  obra.nome,
                )
              }
              className="w-full max-w-[450px] mb-[24px] h-[47px] "
            >
              Gerar Relatório Mão-de-Obra (PDF)
            </ButtonDefault>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px]">
          <h3 className="font-bold text-[#464C54] m-[0px]">
            Relatórios para Cliente
          </h3>
          {!isMobile && (
            <div className="w-full">
              <TabelaSimples
                titulo="Prévia do Relatório Semanal"
                colunas={[
                  "Material/Serviço",
                  "Tipo",
                  "Quantidade",
                  "Data",
                  "Valor",
                ]}
                dados={obra.relatorioCliente || []}
              />
            </div>
          )}
          <ButtonDefault
            onClick={() =>
              gerarPDF(
                "Relatório Semanal para Cliente",
                ["Item", "Tipo", "Qtd", "Data", "Valor"],
                obra.relatorioCliente,
                obra.nome,
              )
            }
            className="w-full max-w-[450px] mb-[24px] h-[47px] "
          >
            Gerar Relatório Cliente (PDF)
          </ButtonDefault>
        </div>
      </main>
    </div>
  );
}

```

---
### Caminho: src\services\api.js
```javascript
const OBRAS_MOCK = [
  {
    id: 1,
    nome: "Portal Beija Flor 897",
    client: "Jorge Silva da Costa",
    status: "Em andamento",
    materiais: [{ nome: "Cimento", qtd: "10 sacos", data: "30/01/2026" }],

    maoDeObra: [{ tipo: "Pedreiro", valor: "R$ 250,00", data: "30/01/2026" }],

    relatorioCliente: [
      {
        item: "Cimento",
        tipo: "Material",
        qtd: "10",
        data: "30/01",
        valor: "R$ 350,00",
      },
      {
        item: "Reboco",
        tipo: "Mão de Obra",
        qtd: "1",
        data: "30/01",
        valor: "R$ 250,00",
      },
    ],
  },
  {
    id: 2,
    nome: "Residencial Vale Verde 102",
    client: "Marcos Antônio Ribeiro",
    status: "Em andamento",
    materiais: [
      { nome: "Areia", qtd: "5 m³", data: "02/02/2026" },
      { nome: "Brita", qtd: "4 m³", data: "02/02/2026" },
    ],

    maoDeObra: [{ tipo: "Servente", valor: "R$ 180,00", data: "02/02/2026" }],

    relatorioCliente: [
      {
        item: "Areia",
        tipo: "Material",
        qtd: "5",
        data: "02/02",
        valor: "R$ 450,00",
      },
      {
        item: "Servente",
        tipo: "Mão de Obra",
        qtd: "1",
        data: "02/02",
        valor: "R$ 180,00",
      },
    ],
  },
  {
    id: 3,
    nome: "Reforma Santa Luzia 304",
    client: "Ana Paula Menezes",
    status: "Em andamento",
    materiais: [{ nome: "Tinta Acrílica", qtd: "6 latas", data: "15/01/2026" }],

    maoDeObra: [{ tipo: "Pintor", valor: "R$ 300,00", data: "15/01/2026" }],

    relatorioCliente: [
      {
        item: "Tinta Acrílica",
        tipo: "Material",
        qtd: "6",
        data: "15/01",
        valor: "R$ 720,00",
      },
      {
        item: "Pintura",
        tipo: "Mão de Obra",
        qtd: "1",
        data: "15/01",
        valor: "R$ 300,00",
      },
    ],
  },
  {
    id: 4,
    nome: "Condomínio Jardim das Oliveiras 221",
    client: "Carlos Eduardo Fonseca",
    status: "Em andamento",
    materiais: [
      { nome: "Bloco de Concreto", qtd: "200 unidades", data: "05/02/2026" },
      { nome: "Argamassa", qtd: "8 sacos", data: "05/02/2026" },
    ],

    maoDeObra: [{ tipo: "Pedreiro", valor: "R$ 280,00", data: "05/02/2026" }],

    relatorioCliente: [
      {
        item: "Bloco de Concreto",
        tipo: "Material",
        qtd: "200",
        data: "05/02",
        valor: "R$ 900,00",
      },
      {
        item: "Argamassa",
        tipo: "Material",
        qtd: "8",
        data: "05/02",
        valor: "R$ 320,00",
      },
      {
        item: "Alvenaria",
        tipo: "Mão de Obra",
        qtd: "1",
        data: "05/02",
        valor: "R$ 280,00",
      },
    ],
  },
];

export const api = {
  getObras: async () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(OBRAS_MOCK), 300);
    });
  },

  getObraById: async (id) => {
    return new Promise((resolve) => {
      const obra = OBRAS_MOCK.find((o) => o.id === parseInt(id));
      setTimeout(() => resolve(obra), 300);
    });
  },
};

```

---
### Caminho: src\services\pdfService.js
```javascript
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const gerarPDF = (titulo, colunas, dados, nomeObra) => {
  try {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Montezuma Gestão de Obras", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Obra: ${nomeObra || "Não informada"}`, 14, 30);
    doc.text(`Tipo de Relatório: ${titulo}`, 14, 37);
    doc.text(`Emissão: ${new Date().toLocaleDateString()}`, 14, 44);

    const corpoTabela = (dados || []).map((item) => Object.values(item));

    autoTable(doc, {
      startY: 50,
      head: [colunas],
      body: corpoTabela,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [70, 76, 84], halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const fileName = `${titulo.replace(/\s+/g, "_")}_${nomeObra.replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("ERRO AO GERAR PDF:", error);
    alert(
      "Falha ao gerar o arquivo. Verifique se os dados da tabela estão corretos.",
    );
  }
};

```

---
