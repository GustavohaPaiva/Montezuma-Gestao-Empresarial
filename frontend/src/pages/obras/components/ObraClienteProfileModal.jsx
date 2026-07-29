import { useRef, useState } from "react";
import { Camera, LogOut, Hourglass, X, UserRound } from "lucide-react";
import ModalPortal from "../../../components/gerais/ModalPortal";

function userInitial(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function ProfileAction({ icon: Icon, label, onClick, disabled = false, tone = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors disabled:opacity-50",
        tone === "danger"
          ? "text-red-600 hover:bg-red-50"
          : "text-text-primary hover:bg-[#FAFAFA]",
      ].join(" ")}
    >
      <span
        className={[
          "flex size-8 shrink-0 items-center justify-center rounded-xl",
          tone === "danger"
            ? "bg-red-50 text-red-600"
            : "bg-[#FAFAFA] text-text-muted",
        ].join(" ")}
      >
        <Icon className="size-4" />
      </span>
      {label}
    </button>
  );
}

export default function ObraClienteProfileModal({
  open,
  onClose,
  displayName,
  email,
  roleLabel = "Cliente",
  avatarUrl,
  uploading = false,
  onUploadPhoto,
  onSignOut,
}) {
  const fileRef = useRef(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  if (!open) return null;

  const handleClose = () => {
    if (uploading) return;
    setError(null);
    setNotice(null);
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setNotice(null);
    try {
      await onUploadPhoto(file);
      setNotice("Foto atualizada.");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Falha ao salvar a foto.");
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          aria-label="Fechar"
          onClick={handleClose}
          disabled={uploading}
        />
        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-primary/30 bg-white p-5 shadow-xl ring-1 ring-black/[0.04] sm:p-6">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 text-text-muted transition-colors hover:text-text-primary"
            disabled={uploading}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>

          <h2 className="pr-8 text-lg font-bold tracking-tight text-text-primary">
            Minha conta
          </h2>

          <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-border-primary/25 bg-[#FAFAFA]/80 px-4 py-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-11 shrink-0 rounded-full object-cover ring-1 ring-border-primary/40"
              />
            ) : (
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-primary text-sm font-semibold text-white"
                aria-hidden
              >
                {userInitial(displayName) !== "?" ? (
                  userInitial(displayName)
                ) : (
                  <UserRound className="size-5" />
                )}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-semibold text-text-primary"
                title={displayName}
              >
                {displayName || "Cliente"}
              </p>
              {email ? (
                <p className="truncate text-xs text-text-muted" title={email}>
                  {email}
                </p>
              ) : null}
              <p className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent-primary">
                {roleLabel}
              </p>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="mt-5">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Foto de perfil
            </p>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border-primary/45 bg-white px-3 text-sm font-semibold text-text-primary shadow-sm transition-colors hover:bg-[#FAFAFA] disabled:opacity-50"
            >
              {uploading ? (
                <Hourglass className="size-4 animate-spin text-accent-primary" />
              ) : (
                <Camera className="size-4 text-accent-primary" />
              )}
              {avatarUrl ? "Alterar foto" : "Enviar foto"}
            </button>
          </div>

          <div className="mt-5 border-t border-border-primary/25 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Sessão
            </p>
            <ProfileAction
              icon={LogOut}
              label="Sair do sistema"
              onClick={onSignOut}
              disabled={uploading}
              tone="danger"
            />
          </div>

          {error ? (
            <p
              className="mt-4 rounded-2xl border border-red-200/90 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p
              className="mt-4 rounded-2xl border border-emerald-200/90 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800"
              role="status"
            >
              {notice}
            </p>
          ) : null}
        </div>
      </div>
    </ModalPortal>
  );
}
