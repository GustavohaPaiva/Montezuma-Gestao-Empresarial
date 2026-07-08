-- FKs de ordens_servico apontavam para auth.users; PostgREST precisa de vínculo com public.usuarios.

ALTER TABLE ordens_servico
  DROP CONSTRAINT IF EXISTS ordens_servico_criador_id_fkey,
  DROP CONSTRAINT IF EXISTS ordens_servico_responsavel_id_fkey,
  DROP CONSTRAINT IF EXISTS ordens_servico_concluido_por_id_fkey;

ALTER TABLE ordens_servico
  ADD CONSTRAINT ordens_servico_criador_id_fkey
    FOREIGN KEY (criador_id) REFERENCES usuarios(id),
  ADD CONSTRAINT ordens_servico_responsavel_id_fkey
    FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  ADD CONSTRAINT ordens_servico_concluido_por_id_fkey
    FOREIGN KEY (concluido_por_id) REFERENCES usuarios(id);
