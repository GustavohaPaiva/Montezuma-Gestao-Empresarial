-- ─────────────────────────────────────────────────────────────────────────────
-- Migração: validação de locações para envio ao extrato
--
-- 1) Adiciona o campo `validacao` em relatorio_locacoes (mesma lógica usada em
--    relatorio_mao_de_obra: 0 = ainda não enviado ao extrato, 1 = enviado).
-- 2) Adiciona a referência `locacao_id` em relatorio_extrato para permitir
--    rastrear de qual locação cada lançamento veio (espelhando material_id e
--    mao_de_obra_id).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.relatorio_locacoes
  ADD COLUMN IF NOT EXISTS validacao integer NOT NULL DEFAULT 0;

ALTER TABLE public.relatorio_extrato
  ADD COLUMN IF NOT EXISTS locacao_id bigint NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.table_constraints
     WHERE table_schema = 'public'
       AND table_name   = 'relatorio_extrato'
       AND constraint_name = 'relatorio_extrato_locacao_id_fkey'
  ) THEN
    ALTER TABLE public.relatorio_extrato
      ADD CONSTRAINT relatorio_extrato_locacao_id_fkey
        FOREIGN KEY (locacao_id)
        REFERENCES public.relatorio_locacoes (id)
        ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS relatorio_extrato_locacao_id_idx
  ON public.relatorio_extrato (locacao_id);

COMMENT ON COLUMN public.relatorio_locacoes.validacao IS
  '0 = pendente de validação no extrato; 1 = já lançado no extrato';

COMMENT ON COLUMN public.relatorio_extrato.locacao_id IS
  'Referência opcional para relatorio_locacoes quando o lançamento vier de uma locação';
