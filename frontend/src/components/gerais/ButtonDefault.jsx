export default function ButtonDefault({ children, className = "", onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#FFFFFF] border border-[#C4C4C9] rounded-[6px] h-[40px] text-[18px] text-[#464C54] transition-all active:scale-[0.98] cursor-pointer hover:bg-[#efefef] ${className}`}
    >
      {children}
    </button>
  );
}
