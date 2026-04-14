import { useLocation } from "react-router-dom";
import { ID_VOGELKOP, ID_YBYOCA } from "../constants/escritorios";

/** Resolve o UUID do escritório a partir da URL (/escritorio/vogelkop|ybyoca/...). */
export function useEscritorioIdFromPath() {
  const { pathname } = useLocation();
  return pathname.includes("vogelkop") ? ID_VOGELKOP : ID_YBYOCA;
}
