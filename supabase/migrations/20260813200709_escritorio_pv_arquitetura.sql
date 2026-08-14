-- Novo escritório de arquitetura: PV Arquitetura.
-- UUID fixo no mesmo padrão dos escritórios existentes.

INSERT INTO public.escritorios (id, nome)
VALUES (
  '44444444-4444-4444-4444-444444444444'::uuid,
  'PV Arquitetura'
)
ON CONFLICT (id) DO NOTHING;
