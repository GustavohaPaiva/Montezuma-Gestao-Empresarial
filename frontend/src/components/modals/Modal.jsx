export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#FFFFFF] w-[90%] max-w-[500px] rounded-[12px] shadow-2xl overflow-hidden">
        {/* Header do Modal */}
        <div className="flex justify-between items-center p-[20px] border-b border-[#DBDADE] bg-[#FBFBFC]">
          <h2 className="text-[20px] font-bold text-[#464C54] uppercase tracking-wide">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-black transition-colors text-[24px]"
          >
            &times;
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-[20px]">{children}</div>
      </div>
    </div>
  );
}
