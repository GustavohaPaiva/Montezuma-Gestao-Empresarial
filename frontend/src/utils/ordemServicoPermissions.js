import { OS_SUBCLASSES } from "../constants/ordemServico";

function normalizarSubclasses(user) {
  const raw = user?.subclasses;
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function usuarioTemSubclasse(user, subclasse) {
  if (!subclasse) return false;
  return normalizarSubclasses(user).includes(String(subclasse));
}

export function podeEmitirOrdemServico(user) {
  if (!user?.id) return false;
  if (user.tipo === "gestor_master") return true;
  return (
    usuarioTemSubclasse(user, OS_SUBCLASSES.gestor) ||
    usuarioTemSubclasse(user, OS_SUBCLASSES.emissorGestor) ||
    usuarioTemSubclasse(user, OS_SUBCLASSES.emissorEncarregado)
  );
}

export function podeVerTodasOrdensServico(user) {
  if (!user?.id) return false;
  if (user.tipo === "gestor_master") return true;
  return usuarioTemSubclasse(user, OS_SUBCLASSES.gestor);
}

export function usuarioVeOrdemServico(user, os) {
  if (!user?.id || !os) return false;
  if (podeVerTodasOrdensServico(user)) return true;
  const uid = String(user.id);
  if (String(os.criador_id ?? "") === uid) return true;
  if (String(os.responsavel_id ?? "") === uid) return true;
  return false;
}

export function filtrarOrdensServicoVisiveis(user, lista) {
  if (!Array.isArray(lista)) return [];
  if (!user?.id) return [];
  return lista.filter((os) => usuarioVeOrdemServico(user, os));
}

export function podeConcluirOrdemServico(user, os) {
  if (!user?.id || !os) return false;
  if (os.status === "concluida") return false;
  if (!os.responsavel_id) return false;
  const uid = String(user.id);
  if (String(os.responsavel_id) === uid) return true;
  if (podeVerTodasOrdensServico(user)) return true;
  return false;
}

export function podeEditarOrdemServico(user, os) {
  if (!user?.id || !os) return false;
  if (os.status === "concluida") return false;
  if (podeVerTodasOrdensServico(user)) return true;
  if (String(os.criador_id ?? "") === String(user.id)) return true;
  return podeEmitirOrdemServico(user) && String(os.criador_id ?? "") === String(user.id);
}

export function isEmissorGestorOS(user) {
  if (user?.tipo === "gestor_master") return true;
  return (
    usuarioTemSubclasse(user, OS_SUBCLASSES.gestor) ||
    usuarioTemSubclasse(user, OS_SUBCLASSES.emissorGestor)
  );
}

export function isEmissorEncarregadoOS(user) {
  return usuarioTemSubclasse(user, OS_SUBCLASSES.emissorEncarregado);
}

export function filtrarDestinatariosPermitidos(emissorUser, usuarios, escritorioId) {
  if (!Array.isArray(usuarios)) return [];
  const lista = usuarios.filter((u) => u?.id && u.id !== emissorUser?.id);

  if (emissorUser?.tipo === "gestor_master" || isEmissorGestorOS(emissorUser)) {
    if (isEmissorEncarregadoOS(emissorUser) && !isEmissorGestorOS(emissorUser)) {
      return lista.filter((u) => usuarioTemSubclasse(u, OS_SUBCLASSES.gestor));
    }
    if (escritorioId) {
      return lista.filter(
        (u) => String(u.escritorio_id ?? "") === String(escritorioId),
      );
    }
    return lista;
  }

  if (isEmissorEncarregadoOS(emissorUser)) {
    return lista.filter((u) => usuarioTemSubclasse(u, OS_SUBCLASSES.gestor));
  }

  return [];
}

export function podeAcessarModuloOrdemServico(user) {
  if (!user?.id) return false;
  if (user.tipo === "cliente") return false;
  if (podeEmitirOrdemServico(user)) return true;
  if (podeVerTodasOrdensServico(user)) return true;
  const tiposInternos = [
    "gestor_master",
    "diretoria",
    "secretaria",
    "suporte_ti",
    "encarregado",
    "funcionario",
    "dono",
    "admin",
  ];
  return tiposInternos.includes(user.tipo);
}
