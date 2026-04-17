import { useLocation } from "react-router-dom";
import { ID_VOGELKOP, ID_YBYOCA } from "../constants/escritorios";

/** Resolve o UUID do escritório a partir da URL (/escritorio/vogelkop|ybyoca/...). */
export function useEscritorioIdFromPath() {
  const { pathname } = useLocation();
  const p = pathname.toLowerCase();
  if (p.includes("vogelkop")) return ID_VOGELKOP;
  if (p.includes("ybyoca")) return ID_YBYOCA;
  return ID_YBYOCA;
}
