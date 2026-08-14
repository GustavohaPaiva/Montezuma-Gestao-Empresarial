-- Renomeia o escritório PV para Arruda Arquitetura.

UPDATE public.escritorios
SET nome = 'Arruda Arquitetura'
WHERE id = '44444444-4444-4444-4444-444444444444'::uuid;
