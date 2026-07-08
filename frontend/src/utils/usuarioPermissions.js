const GESTORES_SISTEMA = ["diretoria", "gestor_master"];

export function usuarioEhGestorSistema(user) {
  return GESTORES_SISTEMA.includes(user?.tipo);
}

export function podeGerenciarUsuarios(user) {
  return usuarioEhGestorSistema(user);
}

export function usuarioProtegidoContraEdicaoExterna(usuario) {
  return GESTORES_SISTEMA.includes(usuario?.tipo);
}

/**
 * Diretoria/gestor master podem editar terceiros, exceto outros diretoria/gestor master.
 * Qualquer usuário pode editar o próprio perfil.
 */
export function podeEditarUsuario(editor, alvo) {
  if (!editor?.id || !alvo?.id) return false;
  if (String(editor.id) === String(alvo.id)) return true;
  if (!usuarioEhGestorSistema(editor)) return false;
  if (usuarioProtegidoContraEdicaoExterna(alvo)) return false;
  return true;
}

export function podeVisualizarUsuario(viewer, alvo) {
  if (!viewer?.id || !alvo?.id) return false;
  if (String(viewer.id) === String(alvo.id)) return true;
  return usuarioEhGestorSistema(viewer);
}

export function podeAlterarCredenciaisDe(editor, alvo) {
  return podeEditarUsuario(editor, alvo);
}

export function podeAlterarLoginDe(editor, alvo) {
  return usuarioEhGestorSistema(editor) && podeEditarUsuario(editor, alvo);
}
