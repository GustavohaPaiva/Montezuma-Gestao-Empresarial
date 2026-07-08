import {
  ESCRITORIO_NOME_POR_ID,
  ID_MONTEZUMA,
  ID_VOGELKOP,
  ID_YBYOCA,
} from "../../constants/escritorios";
import { OS_SUBCLASSES } from "../../constants/ordemServico";
import { homeDictionary } from "../../constants/dictionaries";

export const TIPOS_USUARIO_SISTEMA = [
  { value: "gestor_master", label: homeDictionary.perfis.gestor_master },
  { value: "diretoria", label: homeDictionary.perfis.diretoria },
  { value: "secretaria", label: homeDictionary.perfis.secretaria },
  { value: "suporte_ti", label: homeDictionary.perfis.suporte_ti },
  { value: "encarregado", label: homeDictionary.perfis.encarregado },
  { value: "funcionario", label: "Funcionário" },
  { value: "dono", label: "Dono" },
  { value: "admin", label: "Administrador" },
];

export const ESCRITORIOS_OPCOES = [
  { value: ID_MONTEZUMA, label: ESCRITORIO_NOME_POR_ID[ID_MONTEZUMA] },
  { value: ID_VOGELKOP, label: ESCRITORIO_NOME_POR_ID[ID_VOGELKOP] },
  { value: ID_YBYOCA, label: ESCRITORIO_NOME_POR_ID[ID_YBYOCA] },
];

export const SUBCLASSES_OS_OPCOES = [
  { value: OS_SUBCLASSES.gestor, label: "Gestor de OS (vê todas)" },
  { value: OS_SUBCLASSES.emissorGestor, label: "Emissor OS — gestor" },
  { value: OS_SUBCLASSES.emissorEncarregado, label: "Emissor OS — encarregado" },
];

export function labelTipoUsuario(tipo) {
  return TIPOS_USUARIO_SISTEMA.find((t) => t.value === tipo)?.label || tipo || "—";
}

export function labelEscritorio(escritorioId) {
  return ESCRITORIO_NOME_POR_ID[escritorioId] || "—";
}

export function parseSubclasses(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function emptyUsuarioForm() {
  return {
    login: "",
    senha: "",
    novoLogin: "",
    novaSenha: "",
    confirmarSenha: "",
    loginAtual: "",
    nome: "",
    tipo: "encarregado",
    escritorio_id: ID_MONTEZUMA,
    subclasses: [],
  };
}

export function usuarioParaForm(usuario) {
  if (!usuario) return emptyUsuarioForm();
  return {
    login: "",
    senha: "",
    novoLogin: "",
    novaSenha: "",
    confirmarSenha: "",
    loginAtual: usuario.loginAtual || "",
    nome: usuario.nome || "",
    tipo: usuario.tipo || "encarregado",
    escritorio_id: usuario.escritorio_id || ID_MONTEZUMA,
    subclasses: parseSubclasses(usuario.subclasses),
  };
}

export function formPayloadUsuario(form, { modoCriacao = false } = {}) {
  const payload = {
    nome: String(form.nome ?? "").trim(),
    tipo: form.tipo,
    escritorio_id: form.escritorio_id || null,
    escritorio: labelEscritorio(form.escritorio_id),
    subclasses: Array.isArray(form.subclasses) ? form.subclasses : [],
  };
  if (modoCriacao) {
    payload.login = String(form.login ?? "").trim().toLowerCase();
    payload.senha = form.senha;
  }
  return payload;
}

export function validarCredenciaisForm(
  form,
  { modoCriacao = false, podeAlterarLogin = false } = {},
) {
  if (modoCriacao) {
    const login = String(form.login ?? "").trim();
    const senha = String(form.senha ?? "");
    if (!login) return "Informe o login.";
    if (!senha || senha.length < 6) {
      return "A senha inicial deve ter pelo menos 6 caracteres.";
    }
    return null;
  }

  const novaSenha = String(form.novaSenha ?? "");
  const confirmarSenha = String(form.confirmarSenha ?? "");
  const novoLogin = String(form.novoLogin ?? "").trim().toLowerCase();

  if (!novaSenha && !novoLogin) return null;

  if (novaSenha) {
    if (novaSenha.length < 6) {
      return "A nova senha deve ter pelo menos 6 caracteres.";
    }
    if (novaSenha !== confirmarSenha) {
      return "A confirmação da senha não confere.";
    }
  }

  if (novoLogin && !podeAlterarLogin) {
    return "Você não pode alterar o login deste usuário.";
  }

  return null;
}

export function payloadCredenciais(form, { podeAlterarLogin = false } = {}) {
  const payload = {};
  const novaSenha = String(form.novaSenha ?? "");
  const novoLogin = String(form.novoLogin ?? "").trim().toLowerCase();

  if (novaSenha) payload.senha = novaSenha;
  if (novoLogin && podeAlterarLogin) payload.login = novoLogin;

  return payload;
}

export function temAlteracaoCredenciais(form, { podeAlterarLogin = false } = {}) {
  const payload = payloadCredenciais(form, { podeAlterarLogin });
  return Boolean(payload.senha || payload.login);
}

/** Mapeamento inicial das imagens em src/assets/Assinaturas para upload manual. */
export const ASSINATURAS_LOCAIS_REFERENCIA = [
  { arquivo: "Gustavo.jpeg", nomeSugerido: "Gustavo" },
  { arquivo: "Leonardo.jpeg", nomeSugerido: "Leonardo" },
  { arquivo: "Otavio.jpeg", nomeSugerido: "Otávio" },
  { arquivo: "Paulo Vitor.jpeg", nomeSugerido: "Paulo Vitor" },
];
