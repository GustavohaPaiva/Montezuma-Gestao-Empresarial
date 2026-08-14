-- Alinha RLS de contas_pagar_fornecedor ao padrão de relatorio_materiais / fornecedores
DROP POLICY IF EXISTS contas_pagar_fornecedor_select ON public.contas_pagar_fornecedor;
DROP POLICY IF EXISTS contas_pagar_fornecedor_write ON public.contas_pagar_fornecedor;

CREATE POLICY "Acesso Global Contas Pagar Fornecedor"
  ON public.contas_pagar_fornecedor
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
