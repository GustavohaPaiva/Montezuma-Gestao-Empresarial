export default function Navbar() {
  return (
    <header className="w-[90%] border-b border-[#DBDADE]">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">Obras</h1>

        <button className="bg-[#F7F7F8] border border-[#C4C4C9] rounded-[6px] w-[150px] h-[40px] text-[18px] text-[#464C54]">
          + Nova Obra
        </button>
      </div>
    </header>
  );
}
