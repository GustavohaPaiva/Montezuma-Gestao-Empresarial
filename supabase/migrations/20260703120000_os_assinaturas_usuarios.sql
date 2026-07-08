  -- Assinaturas de usuário + timestamps de assinatura na OS

  ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS assinatura_url text;

  ALTER TABLE ordens_servico
    ADD COLUMN IF NOT EXISTS assinatura_emissor_em timestamptz,
    ADD COLUMN IF NOT EXISTS assinatura_responsavel_em timestamptz;

  -- Helpers de permissão para gestão de usuários
  CREATE OR REPLACE FUNCTION usuario_eh_gestor_sistema()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master')
    );
  $$;

  CREATE OR REPLACE FUNCTION usuario_pode_editar_usuario(alvo usuarios)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
    SELECT
      auth.uid() IS NOT NULL
      AND (
        alvo.id = auth.uid()
        OR (
          usuario_eh_gestor_sistema()
          AND alvo.tipo NOT IN ('diretoria', 'gestor_master')
        )
      );
  $$;

  -- RLS em usuarios (SELECT amplo para uso interno; UPDATE restrito)
  ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS usuarios_select_authenticated ON usuarios;
  CREATE POLICY usuarios_select_authenticated ON usuarios
    FOR SELECT TO authenticated
    USING (true);

  DROP POLICY IF EXISTS usuarios_update_perfil ON usuarios;
  CREATE POLICY usuarios_update_perfil ON usuarios
    FOR UPDATE TO authenticated
    USING (usuario_pode_editar_usuario(usuarios.*))
    WITH CHECK (usuario_pode_editar_usuario(usuarios.*));

  -- Storage: bucket público para leitura no PDF
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('assinaturas_usuarios', 'assinaturas_usuarios', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

  DROP POLICY IF EXISTS assinaturas_usuarios_select ON storage.objects;
  CREATE POLICY assinaturas_usuarios_select ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'assinaturas_usuarios');

  DROP POLICY IF EXISTS assinaturas_usuarios_insert ON storage.objects;
  CREATE POLICY assinaturas_usuarios_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'assinaturas_usuarios'
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR usuario_eh_gestor_sistema()
      )
    );

  DROP POLICY IF EXISTS assinaturas_usuarios_update ON storage.objects;
  CREATE POLICY assinaturas_usuarios_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'assinaturas_usuarios'
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR usuario_eh_gestor_sistema()
      )
    );

  DROP POLICY IF EXISTS assinaturas_usuarios_delete ON storage.objects;
  CREATE POLICY assinaturas_usuarios_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'assinaturas_usuarios'
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR usuario_eh_gestor_sistema()
      )
    );
