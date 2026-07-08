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

export const PAGAMENTO_CLIENTE_OPCOES = [
  { value: "Á vista", label: "Á vista" },
  { value: "Parcelado", label: "Parcelado" },
  { value: "Cartão", label: "Cartão" },
  { value: "À combinar", label: "À combinar" },
];
