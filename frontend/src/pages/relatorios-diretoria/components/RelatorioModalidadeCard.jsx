import {
  modalidadeCardBaseClass,
  modalidadeCardResponsiveClass,
  themeModalidade,
} from "../relatoriosDiretoriaUi";

export default function RelatorioModalidadeCard({
  modalidade,
  quantidade = 0,
  onClick,
}) {
  const theme = themeModalidade(modalidade.colorTheme);
  const Icon = modalidade.Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${modalidadeCardBaseClass} ${theme.border}`}
    >
      <div className={modalidadeCardResponsiveClass}>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${theme.icon}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-xs font-semibold text-text-primary sm:text-sm">
              {modalidade.label}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${theme.badge}`}
            >
              {quantidade} no mês
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-text-muted sm:text-xs">
            {modalidade.descricao}
          </p>
        </div>
      </div>
    </button>
  );
}
