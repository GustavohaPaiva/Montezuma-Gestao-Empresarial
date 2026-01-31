export default function ObraCard({ nome, client, status }) {
  const isAndamento = status.toLowerCase().includes("andamento");

  const bgColor = isAndamento ? "bg-[#FFF4E5]" : "bg-[#E6F4EA]";
  const textColor = isAndamento ? "text-[#B95000]" : "text-[#1E8E3E]";

  return (
    <div
      onClick={() => console.log(`Clicou na ${nome}`)}
      className="bg-[#FAFAFA] rounded-[8px] w-full h-[200px] flex flex-col justify-between p-[20px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] max-w-[350px] box-border transition-transform hover:scale-[1.02] cursor-pointer"
    >
      <div>
        <h2 className="text-[22px] font-bold leading-tight mb-1">{nome}</h2>
        <p className="text-[16px] text-gray-600">
          <span className="font-semibold">Cliente:</span> {client}
        </p>
      </div>

      <div
        className={`text-sm ${bgColor} ${textColor} w-[50%] px-4 rounded-[8px] h-[35px] flex font-bold pl-[5px] box-border`}
      >
        <span className="flex items-center gap-2">
          <img
            width="25"
            height="25"
            src="https://img.icons8.com/ios-glyphs/30/full-stop--v1.png"
            alt="full-stop--v1"
            style={{
              filter: isAndamento
                ? "invert(37%) sepia(93%) saturate(1200%) hue-rotate(10deg)"
                : "invert(36%) sepia(85%) saturate(450%) hue-rotate(95deg)",
            }}
          />
          {status}
        </span>
      </div>
    </div>
  );
}
