-- Permite gestor_os emitir ordens de serviço (ex.: Leonardo)

DROP POLICY IF EXISTS ordens_servico_insert ON ordens_servico;

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
