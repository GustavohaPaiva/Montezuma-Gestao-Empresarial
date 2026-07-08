-- Endereço dividido + policy DELETE para ordens de serviço

ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS endereco_rua text,
  ADD COLUMN IF NOT EXISTS endereco_numero text,
  ADD COLUMN IF NOT EXISTS endereco_bairro text;

-- Migração legado: texto único em endereco_projeto → endereco_rua
UPDATE ordens_servico
SET endereco_rua = endereco_projeto
WHERE endereco_projeto IS NOT NULL
  AND TRIM(endereco_projeto) <> ''
  AND (endereco_rua IS NULL OR TRIM(endereco_rua) = '');

CREATE OR REPLACE FUNCTION usuario_pode_excluir_ordem_servico(os ordens_servico)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = auth.uid()
      AND usuario_pode_ver_ordem_servico(os)
      AND (
        u.tipo = 'gestor_master'
        OR u.subclasses @> '["gestor_os"]'::jsonb
        OR (os.criador_id = auth.uid() AND os.status = 'pendente')
      )
  );
$$;

CREATE POLICY ordens_servico_delete ON ordens_servico
  FOR DELETE TO authenticated
  USING (usuario_pode_excluir_ordem_servico(ordens_servico.*));
