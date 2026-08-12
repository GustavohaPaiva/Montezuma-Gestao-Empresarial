export const FORMA_PAGAMENTO_OPCOES = [
  { value: "Á vista", label: "Á vista" },
  { value: "Debito", label: "Débito" },
  { value: "Crédito", label: "Crédito" },
  { value: "Parcelado", label: "Parcelado" },
];

export const PARCELAS_OPCOES = Array.from({ length: 12 }, (_, i) => {
  const value = `${i + 1}X`;
  return { value, label: value };
});

/** Quantidade de ocorrências mensais para lançamento recorrente */
export const RECORRENCIAS_OPCOES = Array.from({ length: 35 }, (_, i) => {
  const n = i + 2;
  return {
    value: String(n),
    label: n === 12 ? "12 meses" : `${n} meses`,
  };
});

export const PAGAMENTO_CLIENTE_OPCOES = [
  { value: "Á vista", label: "Á vista" },
  { value: "Parcelado", label: "Parcelado" },
  { value: "Cartão", label: "Cartão" },
  { value: "À combinar", label: "À combinar" },
];
