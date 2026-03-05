export default function ButtonDefault({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`flex items-center justify-center bg-white border border-gray-300 rounded-md h-10 px-4 text-base font-medium text-gray-700 transition-all active:scale-95 cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
