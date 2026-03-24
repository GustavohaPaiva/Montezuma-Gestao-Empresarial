import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="w-full min-h-screen">
      <div className="animate-page-transition w-full h-full origin-top">
        {children}
      </div>
    </div>
  );
}
