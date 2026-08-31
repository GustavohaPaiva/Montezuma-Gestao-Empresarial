-- Inclui a etapa "Muros" (7% da obra) entre Paredes e Painéis e Cobertura
-- nas obras que já tinham o pipeline padrão e ainda não possuem essa etapa.

DO $$
DECLARE
  r RECORD;
  etapas jsonb;
  nova jsonb;
  i int;
  idx_insert int;
  elem jsonb;
  muro jsonb;
  tem_muros boolean;
  tem_vizinha boolean;
  paredes jsonb;
  cobertura jsonb;
  paredes_ok boolean;
  cobertura_ok boolean;
  ja_passou boolean;
BEGIN
  FOR r IN
    SELECT id, etapas_selecionadas
    FROM public.obras
    WHERE jsonb_typeof(etapas_selecionadas) = 'array'
      AND jsonb_array_length(etapas_selecionadas) > 0
  LOOP
    etapas := r.etapas_selecionadas;
    tem_muros := false;
    tem_vizinha := false;
    idx_insert := NULL;
    paredes := NULL;
    cobertura := NULL;

    FOR i IN 0 .. jsonb_array_length(etapas) - 1 LOOP
      elem := etapas -> i;
      IF elem->>'nome' = 'Muros' THEN
        tem_muros := true;
      ELSIF elem->>'nome' = 'Paredes e Painéis' THEN
        tem_vizinha := true;
        paredes := elem;
        idx_insert := i + 1;
      ELSIF elem->>'nome' = 'Cobertura' THEN
        tem_vizinha := true;
        cobertura := elem;
        IF idx_insert IS NULL THEN
          idx_insert := i;
        END IF;
      END IF;
    END LOOP;

    IF tem_muros OR NOT tem_vizinha THEN
      CONTINUE;
    END IF;

    paredes_ok :=
      paredes IS NOT NULL
      AND (
        lower(coalesce(paredes->>'status', '')) = 'concluído'
        OR coalesce(NULLIF(paredes->>'progresso', '')::numeric, 0) = 100
      );
    cobertura_ok :=
      cobertura IS NOT NULL
      AND (
        lower(coalesce(cobertura->>'status', '')) IN ('concluído', 'em andamento')
        OR coalesce(NULLIF(cobertura->>'progresso', '')::numeric, 0) > 0
      );
    ja_passou := paredes_ok AND cobertura_ok;

    muro := jsonb_build_object(
      'nome', 'Muros',
      'progresso', CASE WHEN ja_passou THEN 100 ELSE 0 END,
      'status', CASE WHEN ja_passou THEN 'concluído' ELSE 'pendente' END,
      'data_inicio', NULL,
      'data_conclusao', CASE
        WHEN ja_passou THEN paredes->>'data_conclusao'
        ELSE NULL
      END
    );

    nova := '[]'::jsonb;
    FOR i IN 0 .. jsonb_array_length(etapas) - 1 LOOP
      IF i = idx_insert THEN
        nova := nova || jsonb_build_array(muro);
      END IF;
      nova := nova || jsonb_build_array(etapas -> i);
    END LOOP;
    IF idx_insert = jsonb_array_length(etapas) THEN
      nova := nova || jsonb_build_array(muro);
    END IF;

    UPDATE public.obras
    SET etapas_selecionadas = nova
    WHERE id = r.id;
  END LOOP;
END $$;
