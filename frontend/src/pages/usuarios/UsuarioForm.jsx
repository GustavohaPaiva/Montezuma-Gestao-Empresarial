import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import BaseButton from "../../components/gerais/BaseButton";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import {
  ESCRITORIOS_OPCOES,
  SUBCLASSES_OS_OPCOES,
  TIPOS_USUARIO_SISTEMA,
} from "./usuariosUtils";

export default function UsuarioForm({
  form,
  setField,
  toggleSubclasse,
  modoCriacao = false,
  assinaturaUrl,
  onUploadAssinatura,
  onRemoverAssinatura,
  uploadingAssinatura = false,
  podeEditarAssinatura = true,
  podeAlterarLogin = false,
  podeAlterarCredenciais = true,
  disabled = false,
}) {
  const fileRef = useRef(null);
  const [previewLocal, setPreviewLocal] = useState(null);

  const preview = previewLocal || assinaturaUrl;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadAssinatura) return;
    setPreviewLocal(URL.createObjectURL(file));
    try {
      await onUploadAssinatura(file);
    } finally {
      setPreviewLocal(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {modoCriacao ? (
        <fieldset className="rounded-xl border border-border-primary/40 p-4">
          <legend className="px-1 text-sm font-semibold text-text-primary">
            Credenciais de acesso
          </legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Login
              </label>
              <BaseInput
                value={form.login}
                onChange={(e) => setField("login", e.target.value)}
                placeholder="usuario"
                disabled={disabled}
              />
              <p className="mt-1 text-xs text-text-muted">
                Acesso:{" "}
                {form.login ? `${form.login.trim()}@sistema.com` : "—"}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Senha inicial
              </label>
              <BaseInput
                type="password"
                value={form.senha}
                onChange={(e) => setField("senha", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={disabled}
              />
            </div>
          </div>
        </fieldset>
      ) : podeAlterarCredenciais ? (
        <fieldset className="rounded-xl border border-border-primary/40 p-4">
          <legend className="px-1 text-sm font-semibold text-text-primary">
            Credenciais de acesso
          </legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Login atual
              </label>
              <BaseInput
                value={
                  form.loginAtual
                    ? `${form.loginAtual}@sistema.com`
                    : "—"
                }
                disabled
                readOnly
              />
            </div>
            {podeAlterarLogin ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">
                  Novo login
                </label>
                <BaseInput
                  value={form.novoLogin}
                  onChange={(e) => setField("novoLogin", e.target.value)}
                  placeholder="Deixe em branco para manter"
                  disabled={disabled}
                />
                <p className="mt-1 text-xs text-text-muted">
                  {form.novoLogin
                    ? `Novo acesso: ${form.novoLogin.trim()}@sistema.com`
                    : "Somente gestores podem alterar o login."}
                </p>
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Nova senha
              </label>
              <BaseInput
                type="password"
                value={form.novaSenha}
                onChange={(e) => setField("novaSenha", e.target.value)}
                placeholder="Deixe em branco para manter"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Confirmar nova senha
              </label>
              <BaseInput
                type="password"
                value={form.confirmarSenha}
                onChange={(e) => setField("confirmarSenha", e.target.value)}
                placeholder="Repita a nova senha"
                disabled={disabled}
              />
            </div>
          </div>
        </fieldset>
      ) : null}

      <fieldset className="rounded-xl border border-border-primary/40 p-4">
        <legend className="px-1 text-sm font-semibold text-text-primary">
          Dados do perfil
        </legend>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Nome completo
            </label>
            <BaseInput
              value={form.nome}
              onChange={(e) => setField("nome", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Perfil
            </label>
            <BaseSelect
              value={form.tipo}
              onChange={(e) => setField("tipo", e.target.value)}
              disabled={disabled}
            >
              {TIPOS_USUARIO_SISTEMA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </BaseSelect>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Escritório
            </label>
            <BaseSelect
              value={form.escritorio_id}
              onChange={(e) => setField("escritorio_id", e.target.value)}
              disabled={disabled}
            >
              {ESCRITORIOS_OPCOES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </BaseSelect>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-border-primary/40 p-4">
        <legend className="px-1 text-sm font-semibold text-text-primary">
          Permissões de Ordem de Serviço
        </legend>
        <div className="mt-2 space-y-2">
          {SUBCLASSES_OS_OPCOES.map((op) => {
            const checked = (form.subclasses || []).includes(op.value);
            return (
              <label
                key={op.value}
                className="flex cursor-pointer items-center gap-2 text-sm text-text-primary"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleSubclasse(op.value)}
                  className="rounded border-border-primary text-accent-primary focus:ring-accent-primary"
                />
                {op.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {podeEditarAssinatura ? (
        <fieldset className="rounded-xl border border-border-primary/40 p-4">
          <legend className="px-1 text-sm font-semibold text-text-primary">
            Assinatura digital
          </legend>
          <p className="mb-4 text-xs text-text-muted">
            Imagem usada nos PDFs de Ordem de Serviço. Prefira fundo branco e
            assinatura horizontal.
          </p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || uploadingAssinatura}
              className="group relative flex h-24 w-48 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border-primary/50 bg-bg-primary transition hover:border-accent-primary/40"
            >
              {uploadingAssinatura ? (
                <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
              ) : preview ? (
                <img
                  src={preview}
                  alt="Assinatura"
                  className="max-h-full max-w-full object-contain p-2"
                />
              ) : (
                <Camera className="h-8 w-8 text-text-muted group-hover:text-accent-primary" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />
            {preview && onRemoverAssinatura ? (
              <BaseButton
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || uploadingAssinatura}
                onClick={onRemoverAssinatura}
              >
                <Trash2 className="mr-1 h-4 w-4" aria-hidden />
                Remover
              </BaseButton>
            ) : null}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
