import ButtonDefault from "../../../../components/gerais/ButtonDefault";

export default function ObraDetalheHeader({
  navigate,
  obra,
  isReforma,
  isMobile,
  onOpenEtapas,
  onOpenMateriais,
  onOpenMaoDeObra,
}) {
  return (
    <header className="h-[auto] min-h-[82px] border-b border-[#DBDADE] flex justify-center top-0 z-10 w-full bg-[#EEEDF0] py-4">
      <div className="w-[90%] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-[16px] w-full md:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="border-none bg-transparent cursor-pointer flex items-center shrink-0"
          >
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/ios/50/back--v1.png"
              alt="voltar"
            />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[18px] md:text-[20px] font-bold uppercase tracking-[1px] md:tracking-[2px] text-[#464C54] leading-tight">
              {obra.local} - {obra.clientes?.nome || obra.cliente}{" "}
              {isReforma && "(Reforma)"}
            </h1>
            {obra.clientes?.rua_obra || obra.clientes?.rua ? (
              <span className="text-[11px] md:text-[12px] text-[#71717A] uppercase font-medium mt-1">
                {obra.clientes.rua_obra}
                {obra.clientes.numero_obra &&
                  `, ${obra.clientes.numero_obra}`}
              </span>
            ) : null}
          </div>
        </div>
        {!isMobile && (
          <div className="flex gap-[16px]">
            <ButtonDefault className="w-[135px]" onClick={onOpenEtapas}>
              + Etapas
            </ButtonDefault>
            <ButtonDefault className="w-[135px]" onClick={onOpenMateriais}>
              + Materiais
            </ButtonDefault>
            <ButtonDefault className="w-[150px]" onClick={onOpenMaoDeObra}>
              + Mão de Obra
            </ButtonDefault>
          </div>
        )}
      </div>
    </header>
  );
}
