-- Subclasses de usuário + Ordens de Serviço (OS)

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS subclasses jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL,
  escritorio_id uuid NOT NULL,
  criador_id uuid NOT NULL REFERENCES auth.users(id),
  responsavel_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'concluida')),
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  data_conclusao timestamptz,
  concluido_por_id uuid REFERENCES auth.users(id),
  cliente_id uuid,

  responsavel_tecnico text,
  cliente_nome text,
  cliente_telefone text,
  cliente_email text,
  endereco_projeto text,
  objeto_servico text,
  escopo jsonb NOT NULL DEFAULT '[]'::jsonb,
  escopo_outro text,
  descricao_servicos text,
  data_inicio date,
  data_entrega_prevista date,
  observacoes_prazos text,
  valor_total numeric,
  formas_pagamento jsonb NOT NULL DEFAULT '[]'::jsonb,
  forma_pagamento_outro text,
  observacoes_gerais text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ordens_servico_escritorio_numero_unique UNIQUE (escritorio_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_escritorio_status
  ON ordens_servico (escritorio_id, status, data_emissao DESC);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_responsavel_status
  ON ordens_servico (responsavel_id, status);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_criador
  ON ordens_servico (criador_id);

-- Helpers RLS
CREATE OR REPLACE FUNCTION usuario_subclasses_contem(subclasse text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT u.subclasses @> jsonb_build_array(subclasse)
      FROM usuarios u
      WHERE u.id = auth.uid()
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION usuario_pode_ver_ordem_servico(os ordens_servico)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = auth.uid()
      AND (
        u.tipo = 'gestor_master'
        OR u.subclasses @> '["gestor_os"]'::jsonb
        OR os.criador_id = auth.uid()
        OR os.responsavel_id = auth.uid()
      )
  );
$$;

ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY ordens_servico_select ON ordens_servico
  FOR SELECT TO authenticated
  USING (usuario_pode_ver_ordem_servico(ordens_servico.*));

CREATE POLICY ordens_servico_insert ON ordens_servico
  FOR INSERT TO authenticated
  WITH CHECK (
    criador_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.tipo = 'gestor_master'
          OR u.subclasses @> '["gestor_os"]'::jsonb
          OR u.subclasses @> '["emissor_os_gestor"]'::jsonb
          OR u.subclasses @> '["emissor_os_encarregado"]'::jsonb
        )
    )
  );

CREATE POLICY ordens_servico_update ON ordens_servico
  FOR UPDATE TO authenticated
  USING (usuario_pode_ver_ordem_servico(ordens_servico.*))
  WITH CHECK (usuario_pode_ver_ordem_servico(ordens_servico.*));

-- Seed: Leonardo (gestor VK) e encarregados Montezuma
UPDATE usuarios
SET subclasses = '["gestor_os", "emissor_os_gestor"]'::jsonb
WHERE nome ILIKE '%Leonardo%'
AND escritorio_id = '22222222-2222-2222-2222-222222222222';

UPDATE usuarios
SET subclasses = '["emissor_os_encarregado"]'::jsonb
WHERE tipo = 'encarregado'
  AND (subclasses IS NULL OR subclasses = '[]'::jsonb);
