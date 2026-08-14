import { ESCRITORIO_BRAND_POR_ID, ID_ARRUDA } from "../../constants/escritorios";

export default function LogoArruda({
  showSlogan = false,
  className = "",
  imgClassName = "h-16 w-auto object-contain",
}) {
  const brand = ESCRITORIO_BRAND_POR_ID[ID_ARRUDA];
  const slogan = brand?.slogan;
  const logo = brand?.logo;

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {logo ? (
        <img src={logo} alt="Arruda Arquitetura" className={imgClassName} />
      ) : null}
      {showSlogan && slogan ? (
        <p className="mt-3 max-w-xs text-[10px] font-normal uppercase tracking-[0.18em] text-esc-destaque">
          {slogan}
        </p>
      ) : null}
    </div>
  );
}
