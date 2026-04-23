export default function ObraDetalheHeader({ navigate, obra, isReforma }) {
  return (
    <header className="h-auto border-b border-border-primary flex justify-center sticky top-0 z-60 w-full bg-bg-primary py-4 shadow-sm">
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
            <h1 className="text-[18px] md:text-[20px] font-bold uppercase tracking-[1px] md:tracking-[2px] text-text-primary leading-tight">
              {obra.local} - {obra.clientes?.nome || obra.cliente}{" "}
              {isReforma && "(Reforma)"}
            </h1>
            {obra.clientes?.rua_obra || obra.clientes?.rua ? (
              <span className="text-[11px] md:text-[12px] text-text-muted uppercase font-medium mt-1">
                {obra.clientes.rua_obra}
                {obra.clientes.numero_obra && `, ${obra.clientes.numero_obra}`}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
