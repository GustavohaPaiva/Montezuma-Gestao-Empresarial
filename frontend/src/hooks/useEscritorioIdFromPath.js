import { useLocation } from "react-router-dom";
import { escritorioIdFromPathname } from "../constants/escritorios";

export function useEscritorioIdFromPath() {
  const { pathname } = useLocation();
  return escritorioIdFromPathname(pathname);
}
