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
