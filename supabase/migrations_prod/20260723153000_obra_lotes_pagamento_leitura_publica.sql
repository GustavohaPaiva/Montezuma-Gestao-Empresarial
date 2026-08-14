-- Clientes acessam a obra via login por nome/local (sem sessão auth.users).
-- Espelha a leitura pública já usada em relatorio_extrato / obras,
-- para que lotes gerados apareçam na tela do cliente (modalidade gestão).

CREATE POLICY "Permitir leitura publica lotes pagamento"
  ON obra_lotes_pagamento
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir leitura publica lote itens"
  ON obra_lote_itens
  FOR SELECT
  USING (true);
