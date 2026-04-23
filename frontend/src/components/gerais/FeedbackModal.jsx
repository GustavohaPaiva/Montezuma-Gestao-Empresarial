import BaseModal from "./BaseModal";
import ButtonDefault from "./ButtonDefault";

const variantToAccent = {
  error: "border-danger-primary/30 bg-danger-soft/30 text-text-primary",
  success: "border-success-primary/30 bg-success-soft/40 text-text-primary",
  info: "border-accent-primary/30 bg-surface-alt text-text-primary",
};

/**
 * Feedback genérico (substitui `alert`); título padrão conforme `variant`.
 */
export default function FeedbackModal({
  isOpen,
  onClose,
  message = "",
  variant = "error",
  title: titleProp,
  size = "md",
}) {
  const title =
    titleProp ??
    (variant === "success"
      ? "Sucesso"
      : variant === "info"
        ? "Informação"
        : "Atenção");
  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      contentPaddingClass="p-6 sm:p-8"
    >
      <p
        className={[
          "rounded-lg border p-4 text-sm leading-relaxed",
          variantToAccent[variant] || variantToAccent.error,
        ].join(" ")}
      >
        {message}
      </p>
      <div className="mt-6 flex justify-end">
        <ButtonDefault type="button" onClick={onClose} className="!px-6 !py-2">
          OK
        </ButtonDefault>
      </div>
    </BaseModal>
  );
}
