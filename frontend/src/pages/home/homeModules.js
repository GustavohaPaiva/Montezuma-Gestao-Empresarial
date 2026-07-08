import {
  Building2,
  FolderOpen,
  HardHat,
  Wallet,
  Handshake,
  ShoppingCart,
  LineChart,
  ClipboardList,
  Users,
} from "lucide-react";
import { ID_VOGELKOP, ID_YBYOCA } from "../../constants/escritorios";
import { homeDictionary } from "../../constants/dictionaries";
import { isGestorPedidos } from "../../constants/pedidos";
import { podeAcessarModuloOrdemServico } from "../../utils/ordemServicoPermissions";
import { podeGerenciarUsuarios } from "../../utils/usuarioPermissions";

const m = homeDictionary.modulos;
const d = homeDictionary.modulos.descricoes;

const c = homeDictionary.modulos.categorias;
const dest = homeDictionary.modulos.destaques;

export const MODULOS_HOME = [
  {
    id: 1,
    titulo: m.meuEscritorio,
    descricao: d.meuEscritorio,
    categoria: c.escritorio,
    destaques: dest.meuEscritorio,
    colorTheme: "blue",
    Icon: Building2,
    path: null,
    meuEscritorio: true,
  },
  {
    id: 2,
    titulo: m.processos,
    descricao: d.processos,
    categoria: c.administrativo,
    destaques: dest.processos,
    colorTheme: "indigo",
    statKey: "processos",
    Icon: FolderOpen,
    path: "/processos",
    roles: ["gestor_master", "diretoria", "secretaria", "suporte_ti"],
  },
  {
    id: 3,
    titulo: m.obras,
    descricao: d.obras,
    categoria: c.operacional,
    destaques: dest.obras,
    colorTheme: "amber",
    statKey: "obrasAtivas",
    Icon: HardHat,
    path: "/obras",
    roles: ["gestor_master", "diretoria", "secretaria", "suporte_ti", "encarregado"],
  },
  {
    id: 4,
    titulo: m.financeiro,
    descricao: d.financeiro,
    categoria: c.financeiro,
    destaques: dest.financeiro,
    colorTheme: "primary",
    statKey: "pendencias",
    Icon: Wallet,
    path: "/financeiro",
    roles: ["gestor_master", "diretoria", "secretaria", "suporte_ti"],
  },
  {
    id: 5,
    titulo: m.suprimentosServicos,
    descricao: d.suprimentosServicos,
    categoria: c.cadastro,
    destaques: dest.suprimentosServicos,
    colorTheme: "emerald",
    Icon: Handshake,
    path: "/suprimentos-servicos",
    roles: ["gestor_master", "diretoria", "suporte_ti"],
  },
  {
    id: 7,
    titulo: m.pedidos,
    descricao: d.pedidos,
    categoria: c.compras,
    destaques: dest.pedidos,
    colorTheme: "primary",
    Icon: ShoppingCart,
    path: "/pedidos",
    gestorPedidos: true,
  },
  {
    id: 8,
    titulo: m.projecoes,
    descricao: d.projecoes,
    categoria: c.analise,
    destaques: dest.projecoes,
    colorTheme: "purple",
    statKey: "tarefas",
    Icon: LineChart,
    path: "/projecoes",
    roles: ["gestor_master", "diretoria", "suporte_ti"],
  },
  {
    id: 9,
    titulo: m.ordensServico,
    descricao: d.ordensServico,
    categoria: c.administrativo,
    destaques: dest.ordensServico,
    colorTheme: "indigo",
    Icon: ClipboardList,
    path: "/ordens-servico",
    ordemServico: true,
  },
  {
    id: 10,
    titulo: m.usuariosSistema,
    descricao: d.usuariosSistema,
    categoria: c.cadastro,
    destaques: dest.usuariosSistema,
    colorTheme: "blue",
    Icon: Users,
    path: "/usuarios",
    gestaoUsuarios: true,
  },
];

export function getModulosPermitidos(user) {
  return MODULOS_HOME.filter((modulo) => {
    if (modulo.gestorPedidos) {
      return isGestorPedidos(user);
    }
    if (modulo.ordemServico) {
      return podeAcessarModuloOrdemServico(user);
    }
    if (modulo.gestaoUsuarios) {
      return podeGerenciarUsuarios(user);
    }
    if (modulo.meuEscritorio) {
      return (
        (user?.tipo === "diretoria" || user?.tipo === "gestor_master") &&
        (user?.escritorio_id === ID_VOGELKOP ||
          user?.escritorio_id === ID_YBYOCA)
      );
    }
    return modulo.roles?.includes(user?.tipo);
  }).map((modulo) => {
    if (modulo.meuEscritorio) {
      const path =
        user?.escritorio_id === ID_VOGELKOP
          ? "/escritorio/vogelkop"
          : "/escritorio/ybyoca";
      return { ...modulo, path };
    }
    return modulo;
  });
}
