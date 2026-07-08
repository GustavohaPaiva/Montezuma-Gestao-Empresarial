import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Save,
  UserRound,
} from "lucide-react";
import BaseButton from "../../components/gerais/BaseButton";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import {
  podeAlterarCredenciaisDe,
  podeAlterarLoginDe,
  podeEditarUsuario,
  podeGerenciarUsuarios,
  usuarioProtegidoContraEdicaoExterna,
} from "../../utils/usuarioPermissions";
import UsuarioForm from "./UsuarioForm";
import {
  emptyUsuarioForm,
  formPayloadUsuario,
  labelTipoUsuario,
  payloadCredenciais,
  temAlteracaoCredenciais,
  usuarioParaForm,
  validarCredenciaisForm,
} from "./usuariosUtils";

export default function UsuarioDetalhe({ modoCriacao = false }) {
  const { id } = useParams();
  const { user, updateUserFoto } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [usuario, setUsuario] = useState(null);
  const [form, setForm] = useState(emptyUsuarioForm());
  const [fotoUrl, setFotoUrl] = useState(null);
  const [loading, setLoading] = useState(!modoCriacao);
  const [salvando, setSalvando] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingAssinatura, setUploadingAssinatura] = useState(false);
  const [showElements, setShowElements] = useState(false);
  const [erro, setErro] = useState(null);

  const autorizado = modoCriacao
    ? podeGerenciarUsuarios(user)
    : podeGerenciarUsuarios(user) || String(user?.id) === String(id);

  const podeEditar =
    modoCriacao ||
    (usuario && user && podeEditarUsuario(user, usuario));

  const podeEditarAssinatura = podeEditar;
  const podeEditarFoto = podeEditar;
  const podeAlterarCredenciais =
    modoCriacao || (usuario && user && podeAlterarCredenciaisDe(user, usuario));
  const podeAlterarLogin =
    !modoCriacao &&
    usuario &&
    user &&
    podeAlterarLoginDe(user, usuario);

  const setField = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const toggleSubclasse = (valor) => {
    setForm((prev) => {
      const set = new Set(prev.subclasses || []);
      if (set.has(valor)) set.delete(valor);
      else set.add(valor);
      return { ...prev, subclasses: [...set] };
    });
  };

  const carregar = useCallback(async () => {
    if (modoCriacao || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [row, fotoStorage, authInfo] = await Promise.all([
        api.getUsuarioSistemaById(id),
        api.resolverFotoUsuarioStorage(id),
        api.consultarAuthUsuario(id).catch(() => null),
      ]);

      if (
        !row ||
        !(podeGerenciarUsuarios(user) || String(user?.id) === String(id))
      ) {
        setErro("Usuário não encontrado ou acesso negado.");
        setUsuario(null);
      } else {
        const loginAtual = authInfo?.login ?? "";
        setUsuario(row);
        setForm(
          usuarioParaForm({
            ...row,
            loginAtual,
          }),
        );
        setFotoUrl(fotoStorage || authInfo?.foto || null);
        setErro(null);
      }
    } catch (e) {
      console.error(e);
      setErro(e?.message || "Erro ao carregar usuário.");
    } finally {
      setLoading(false);
    }
  }, [id, modoCriacao, user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (user && !autorizado) {
      navigate("/", { replace: true });
    }
  }, [user, autorizado, navigate]);

  useEffect(() => {
    if ((usuario || modoCriacao) && !loading) {
      const timer = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(timer);
    }
    setShowElements(false);
  }, [usuario, modoCriacao, loading]);

  const handleSalvar = async () => {
    if (!podeEditar) return;

    const erroCred = validarCredenciaisForm(form, {
      modoCriacao,
      podeAlterarLogin,
    });
    if (erroCred) {
      alert(erroCred);
      return;
    }

    setSalvando(true);
    try {
      if (modoCriacao) {
        const payload = formPayloadUsuario(form, { modoCriacao: true });
        const criado = await api.createUsuarioSistema(payload);
        navigate(`/usuarios/${criado.id}`, { replace: true });
        return;
      }

      const payload = formPayloadUsuario(form);
      const atualizado = await api.updateUsuarioSistema(usuario.id, payload);

      let novoLoginAtual = form.loginAtual;

      if (temAlteracaoCredenciais(form, { podeAlterarLogin })) {
        const credPayload = payloadCredenciais(form, { podeAlterarLogin });
        const ehProprio = String(user?.id) === String(usuario.id);

        if (ehProprio && credPayload.senha && !credPayload.login) {
          await api.atualizarSenhaPropria(credPayload.senha);
        } else {
          const authAtualizado = await api.atualizarCredenciaisUsuario(
            usuario.id,
            credPayload,
          );
          if (authAtualizado?.login) {
            novoLoginAtual = authAtualizado.login;
          }
        }
      }

      setUsuario(atualizado);
      setForm({
        ...usuarioParaForm({ ...atualizado, loginAtual: novoLoginAtual }),
        novoLogin: "",
        novaSenha: "",
        confirmarSenha: "",
      });
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const alvoId = modoCriacao ? null : usuario?.id;
    if (!alvoId) {
      alert("Salve o usuário antes de enviar a foto de perfil.");
      return;
    }
    setUploadingFoto(true);
    try {
      const { fotoUrl: novaUrl } = await api.uploadFotoUsuario(alvoId, file);
      setFotoUrl(novaUrl);
      if (String(user?.id) === String(alvoId)) {
        updateUserFoto(novaUrl);
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Falha ao enviar foto.");
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadAssinatura = async (file) => {
    const alvoId = modoCriacao ? null : usuario?.id;
    if (!alvoId) {
      alert("Salve o usuário antes de enviar a assinatura.");
      return;
    }
    setUploadingAssinatura(true);
    try {
      const atualizado = await api.uploadAssinaturaUsuario(alvoId, file);
      setUsuario(atualizado);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Falha ao enviar assinatura.");
    } finally {
      setUploadingAssinatura(false);
    }
  };

  const handleRemoverAssinatura = async () => {
    if (!usuario?.id || !window.confirm("Remover a assinatura deste usuário?")) {
      return;
    }
    setUploadingAssinatura(true);
    try {
      const atualizado = await api.removerAssinaturaUsuario(usuario.id);
      setUsuario(atualizado);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Falha ao remover assinatura.");
    } finally {
      setUploadingAssinatura(false);
    }
  };

  if (!autorizado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        A redirecionar…
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingPainel
        titulo="Carregando usuário"
        descricao="Aguarde um momento."
      />
    );
  }

  if (erro && !modoCriacao) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-[5%] text-sm text-danger-primary">
        <p>{erro}</p>
        <BaseButton
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/usuarios")}
        >
          Voltar
        </BaseButton>
      </div>
    );
  }

  const titulo = modoCriacao ? "Novo usuário" : usuario?.nome || "Usuário";
  const subtitulo = modoCriacao
    ? "Cadastre login, perfil e permissões"
    : labelTipoUsuario(usuario?.tipo);

  const somenteLeitura =
    !modoCriacao &&
    usuario &&
    user &&
    !podeEditarUsuario(user, usuario);

  const avisoProtegido =
    !modoCriacao &&
    usuario &&
    usuarioProtegidoContraEdicaoExterna(usuario) &&
    String(user?.id) !== String(usuario.id);

  return (
    <div className="min-h-screen bg-bg-primary pb-12 font-montserrat text-text-primary">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadFoto}
        accept="image/*"
        className="hidden"
      />

      <header className="w-full border-b border-gray-200/90 bg-bg-primary shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full flex-col gap-4 px-[5%] py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(modoCriacao ? "/usuarios" : "/usuarios")
              }
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                {titulo}
              </h1>
              <p className="mt-0.5 truncate text-xs text-text-muted sm:text-sm">
                {subtitulo}
              </p>
            </div>
          </div>

          {podeEditar && !somenteLeitura ? (
            <BaseButton onClick={handleSalvar} isLoading={salvando}>
              {salvando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="mr-2 h-4 w-4" aria-hidden />
              )}
              {modoCriacao ? "Criar usuário" : "Salvar alterações"}
            </BaseButton>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex w-full flex-col gap-6 px-[5%] pt-6 lg:gap-8">
        {avisoProtegido ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Perfis de diretoria e gestor master só podem ser alterados pelo
            próprio usuário.
          </p>
        ) : null}

        {somenteLeitura ? (
          <p className="rounded-lg border border-border-primary/40 bg-bg-primary px-4 py-3 text-sm text-text-muted">
            Visualização somente leitura — você não pode editar este perfil.
          </p>
        ) : null}

        <section
          className={`relative rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.05)] transition-all duration-700 ease-out sm:p-8 ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {!modoCriacao ? (
              <div className="flex flex-col items-center gap-4 lg:min-w-[150px]">
                <button
                  type="button"
                  onClick={() =>
                    podeEditarFoto && !somenteLeitura
                      ? fileInputRef.current?.click()
                      : undefined
                  }
                  disabled={
                    !podeEditarFoto || somenteLeitura || uploadingFoto
                  }
                  className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-[3px] border-border-primary/30 bg-bg-primary shadow-sm ring-1 ring-slate-900/5 transition hover:border-accent-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Alterar foto de perfil"
                >
                  {uploadingFoto ? (
                    <Loader2
                      className="h-8 w-8 animate-spin text-accent-primary"
                      aria-hidden
                    />
                  ) : fotoUrl ? (
                    <>
                      <img
                        src={fotoUrl}
                        alt={usuario?.nome || "Foto do usuário"}
                        className="h-full w-full object-cover transition-opacity group-hover:opacity-50"
                      />
                      {podeEditarFoto && !somenteLeitura ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera className="h-8 w-8 text-white" aria-hidden />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <UserRound
                        className="h-12 w-12 text-text-muted transition-opacity group-hover:opacity-50"
                        aria-hidden
                      />
                      {podeEditarFoto && !somenteLeitura ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera
                            className="h-8 w-8 text-text-primary"
                            aria-hidden
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </button>

                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700 ring-1 ring-slate-100">
                  {labelTipoUsuario(usuario?.tipo)}
                </span>
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <UsuarioForm
                form={form}
                setField={setField}
                toggleSubclasse={toggleSubclasse}
                modoCriacao={modoCriacao}
                assinaturaUrl={usuario?.assinatura_url}
                onUploadAssinatura={handleUploadAssinatura}
                onRemoverAssinatura={handleRemoverAssinatura}
                uploadingAssinatura={uploadingAssinatura}
                podeEditarAssinatura={podeEditarAssinatura && !modoCriacao}
                podeAlterarLogin={podeAlterarLogin}
                podeAlterarCredenciais={podeAlterarCredenciais}
                disabled={somenteLeitura}
              />

              {modoCriacao ? (
                <p className="mt-4 text-xs text-text-muted">
                  Após criar o usuário, você poderá enviar a foto de perfil e a
                  assinatura digital nesta mesma tela.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
