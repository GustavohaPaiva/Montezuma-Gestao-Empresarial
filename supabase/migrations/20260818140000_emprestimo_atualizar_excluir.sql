-- Editar valor/data/descrição e excluir empréstimo (estorno completo).
-- Partes (origem/destino) não mudam. Caixa e obra_movimentacoes acompanham.

CREATE OR REPLACE FUNCTION public._caixa_parte_emprestimo(
  p_tipo text,
  p_escritorio_id uuid,
  p_obra_id bigint
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF p_tipo = 'escritorio' THEN
    RETURN public.caixa_escritorio_valor(p_escritorio_id);
  END IF;
  RETURN public._saldo_obra(p_obra_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_emprestimo(
  p_emprestimo_id uuid,
  p_valor numeric,
  p_descricao text DEFAULT NULL,
  p_data date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp emprestimos%ROWTYPE;
  v_desc text;
  v_data date;
  v_amortizado numeric;
  v_delta numeric;
  v_novo_saldo numeric;
  v_status text;
  v_caixa numeric;
  v_obra_tipo text;
BEGIN
  PERFORM public._assert_pode_emprestar();

  IF p_emprestimo_id IS NULL THEN
    RAISE EXCEPTION 'Empréstimo é obrigatório';
  END IF;
  IF p_valor IS NULL OR p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;

  SELECT * INTO v_emp FROM emprestimos WHERE id = p_emprestimo_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empréstimo não encontrado';
  END IF;

  PERFORM public._lock_partes_emprestimo(
    v_emp.origem_escritorio_id,
    v_emp.destino_escritorio_id,
    v_emp.origem_obra_id,
    v_emp.destino_obra_id
  );

  v_amortizado := v_emp.valor_original - v_emp.saldo_aberto;
  IF p_valor <= v_amortizado THEN
    RAISE EXCEPTION 'Valor deve ser maior que o já amortizado (%)', v_amortizado;
  END IF;

  v_delta := p_valor - v_emp.valor_original;
  v_novo_saldo := p_valor - v_amortizado;
  v_data := COALESCE(p_data, v_emp.data);
  v_desc := NULLIF(trim(COALESCE(p_descricao, '')), '');

  IF v_delta > 0 THEN
    v_caixa := public._caixa_parte_emprestimo(
      v_emp.origem_tipo, v_emp.origem_escritorio_id, v_emp.origem_obra_id
    );
    IF v_caixa < v_delta THEN
      RAISE EXCEPTION 'Saldo insuficiente no caixa da origem (disponível: %)', v_caixa;
    END IF;
  ELSIF v_delta < 0 THEN
    v_caixa := public._caixa_parte_emprestimo(
      v_emp.destino_tipo, v_emp.destino_escritorio_id, v_emp.destino_obra_id
    );
    IF v_caixa < abs(v_delta) THEN
      RAISE EXCEPTION 'Saldo insuficiente no caixa do destino (disponível: %)', v_caixa;
    END IF;
  END IF;

  IF v_amortizado > 0 THEN
    v_status := 'parcial';
  ELSE
    v_status := 'aberto';
  END IF;

  UPDATE emprestimos
  SET
    valor_original = p_valor,
    saldo_aberto = v_novo_saldo,
    data = v_data,
    descricao = v_desc,
    status = v_status
  WHERE id = p_emprestimo_id;

  UPDATE emprestimo_movimentos
  SET valor = p_valor, data = v_data, descricao = v_desc
  WHERE emprestimo_id = p_emprestimo_id
    AND tipo = 'concessao';

  IF v_emp.origem_tipo = 'obra' THEN
    v_obra_tipo := 'transferencia_saida';
  ELSIF v_emp.destino_tipo = 'obra' THEN
    v_obra_tipo := 'transferencia_entrada';
  ELSE
    v_obra_tipo := NULL;
  END IF;

  IF v_obra_tipo IS NOT NULL THEN
    UPDATE obra_movimentacoes
    SET valor = p_valor, data = v_data, descricao = v_desc
    WHERE transferencia_grupo_id = p_emprestimo_id
      AND tipo = v_obra_tipo;
  END IF;

  RETURN p_emprestimo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.excluir_emprestimo(p_emprestimo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp emprestimos%ROWTYPE;
  v_caixa numeric;
BEGIN
  PERFORM public._assert_pode_emprestar();

  IF p_emprestimo_id IS NULL THEN
    RAISE EXCEPTION 'Empréstimo é obrigatório';
  END IF;

  SELECT * INTO v_emp FROM emprestimos WHERE id = p_emprestimo_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empréstimo não encontrado';
  END IF;

  PERFORM public._lock_partes_emprestimo(
    v_emp.origem_escritorio_id,
    v_emp.destino_escritorio_id,
    v_emp.origem_obra_id,
    v_emp.destino_obra_id
  );

  IF v_emp.saldo_aberto > 0 THEN
    v_caixa := public._caixa_parte_emprestimo(
      v_emp.destino_tipo, v_emp.destino_escritorio_id, v_emp.destino_obra_id
    );
    IF v_caixa < v_emp.saldo_aberto THEN
      RAISE EXCEPTION 'Saldo insuficiente no caixa do destino para estornar (disponível: %)', v_caixa;
    END IF;
  END IF;

  DELETE FROM obra_movimentacoes
  WHERE transferencia_grupo_id = p_emprestimo_id;

  DELETE FROM emprestimos
  WHERE id = p_emprestimo_id;
END;
$$;

REVOKE ALL ON FUNCTION public._caixa_parte_emprestimo(text, uuid, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.atualizar_emprestimo(uuid, numeric, text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.excluir_emprestimo(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.atualizar_emprestimo(uuid, numeric, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.excluir_emprestimo(uuid) TO authenticated;
