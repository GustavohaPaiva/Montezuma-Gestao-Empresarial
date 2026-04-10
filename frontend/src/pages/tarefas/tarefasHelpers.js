export const STATUS = {
  pendente: "Pendente",
  emAndamento: "Em Andamento",
  aguardando: "Aguardando Validação",
  concluida: "Concluída",
};

/**
 * Quem pode lançar tarefas escolhe responsáveis entre todos os utilizadores exceto estes tipos.
 * Comparação em minúsculas.
 */
export function usuarioPodeSerResponsavelEmTarefa(usuarioOuTipo) {
  const raw =
    usuarioOuTipo != null && typeof usuarioOuTipo === "object"
      ? usuarioOuTipo.tipo
      : usuarioOuTipo;
  const t = String(raw ?? "").trim().toLowerCase();
  if (!t) return true;
  return t !== "gestor_master";
}

/**
 * Nome de quem criou/designou a tarefa.
 * Usa cópia na linha (`criador_nome`) quando o join com `usuarios` não vem (ex.: RLS para cargos baixos).
 */
export function nomeDesignadorTarefa(row) {
  if (!row) return null;
  const snap = row.criador_nome;
  if (snap != null && String(snap).trim() !== "") return String(snap).trim();
  const n = row.criador?.nome;
  if (n != null && String(n).trim() !== "") return String(n).trim();
  return null;
}

/** Escritório do criador; mesma lógica de cópia em `criador_escritorio`. */
export function escritorioDesignadorTarefa(row) {
  if (!row) return null;
  const snap = row.criador_escritorio;
  if (snap != null && String(snap).trim() !== "") return String(snap).trim();
  const e = row.criador?.escritorio;
  if (e != null && String(e).trim() !== "") return String(e).trim();
  return null;
}

export function extrairResponsaveis(row) {
  const raw = row?.responsaveis ?? row?.tarefa_responsaveis ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const u = r?.usuarios ?? r?.usuario;
      const id = u?.id ?? r?.usuario_id;
      if (!id) return null;
      return {
        id: String(id),
        nome: u?.nome ?? "—",
        escritorio: u?.escritorio ?? null,
        tipo: u?.tipo ?? null,
      };
    })
    .filter(Boolean);
}

export function normalizarStatus(raw) {
  const s = raw || STATUS.pendente;
  if (Object.values(STATUS).includes(s)) return s;
  return STATUS.pendente;
}

const CHEFIA_TOTAL_VISIBILIDADE = ["gestor_master", "diretoria"];

/** Gestor/diretoria: todas; demais: só se constarem em `tarefa_responsaveis`. */
export function usuarioVeTarefa(user, t) {
  if (!user?.id || !t) return false;
  if (CHEFIA_TOTAL_VISIBILIDADE.includes(user.tipo)) return true;
  const uid = String(user.id);
  return extrairResponsaveis(t).some((r) => r.id === uid);
}

export function filtrarTarefasVisiveis(user, tarefas) {
  if (!Array.isArray(tarefas)) return [];
  if (!user?.id) return [];
  return tarefas.filter((t) => usuarioVeTarefa(user, t));
}

/**
 * Badge: tarefas que exigem ação (apenas entre as visíveis para o utilizador).
 */
export function contarTarefasPendentesBadge(user, tarefas) {
  if (!user?.id || !Array.isArray(tarefas)) return 0;
  const visiveis = filtrarTarefasVisiveis(user, tarefas);
  const uid = String(user.id);
  const tipo = user.tipo;
  const isGestorOuDiretoria = CHEFIA_TOTAL_VISIBILIDADE.includes(tipo);
  const ids = new Set();
  for (const t of visiveis) {
    const st = normalizarStatus(t.status);
    if (st === STATUS.concluida) continue;
    if (isGestorOuDiretoria && st === STATUS.aguardando) {
      ids.add(t.id);
      continue;
    }
    const assignee = extrairResponsaveis(t).some((r) => r.id === uid);
    if (assignee && (st === STATUS.pendente || st === STATUS.emAndamento)) {
      ids.add(t.id);
    }
  }
  return ids.size;
}
