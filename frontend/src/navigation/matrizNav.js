import { Building2, Home, Truck, Users } from "lucide-react";
import { homeDictionary } from "../constants/dictionaries";
import {
  getAcessoEscritorio,
  getModulosPermitidos,
} from "../pages/home/homeModules";

const SUPRIMENTOS_PATH = "/suprimentos-servicos";

/**
 * Match de rota para item de nav (prefixo, exceto Home).
 */
export function pathMatchesItem(pathname, to) {
  if (pathname === to) return true;
  if (to === "/") return false;
  return pathname.startsWith(`${to}/`);
}

export function sectionContainsPath(section, pathname) {
  if (section.basePath && pathMatchesItem(pathname, section.basePath)) {
    return true;
  }
  return section.items.some((item) => pathMatchesItem(pathname, item.to));
}

/**
 * Seções da sidebar da matriz: Home flat, módulos (Suprimentos em accordion),
 * e link de escritório quando aplicável. Financeiro permanece flat.
 */
export function buildMatrizNavSections(user) {
  const modulos = getModulosPermitidos(user);
  const m = homeDictionary.modulos;
  const sections = [
    {
      items: [
        {
          to: "/",
          label: "Início",
          icon: Home,
          end: true,
        },
      ],
    },
  ];

  const flatBuffer = [];

  const flushFlat = () => {
    if (flatBuffer.length === 0) return;
    sections.push({ items: [...flatBuffer] });
    flatBuffer.length = 0;
  };

  for (const modulo of modulos) {
    if (modulo.path === SUPRIMENTOS_PATH) {
      flushFlat();
      sections.push({
        id: "suprimentos-servicos",
        label: modulo.titulo,
        icon: modulo.Icon,
        basePath: SUPRIMENTOS_PATH,
        items: [
          { to: "/fornecedores", label: m.fornecedores, icon: Truck },
          { to: "/prestadores", label: m.prestadores, icon: Users },
        ],
      });
      continue;
    }

    flatBuffer.push({
      to: modulo.path,
      label: modulo.titulo,
      icon: modulo.Icon,
    });
  }

  flushFlat();

  const escritorio = getAcessoEscritorio(user);
  if (escritorio) {
    sections.push({
      items: [
        {
          to: escritorio.path,
          label: escritorio.nome,
          icon: Building2,
        },
      ],
    });
  }

  return sections;
}
