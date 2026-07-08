-- Campos "Outro" passam a armazenar lista de itens (jsonb array).

ALTER TABLE ordens_servico
  ALTER COLUMN escopo_outro TYPE jsonb
    USING CASE
      WHEN escopo_outro IS NULL OR trim(escopo_outro) = '' THEN '[]'::jsonb
      ELSE jsonb_build_array(trim(escopo_outro))
    END,
  ALTER COLUMN forma_pagamento_outro TYPE jsonb
    USING CASE
      WHEN forma_pagamento_outro IS NULL OR trim(forma_pagamento_outro) = '' THEN '[]'::jsonb
      ELSE jsonb_build_array(trim(forma_pagamento_outro))
    END;

ALTER TABLE ordens_servico
  ALTER COLUMN escopo_outro SET DEFAULT '[]'::jsonb,
  ALTER COLUMN forma_pagamento_outro SET DEFAULT '[]'::jsonb;
