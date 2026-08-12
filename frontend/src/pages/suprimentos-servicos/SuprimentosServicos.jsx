import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Handshake, Truck, Users } from "lucide-react";
import ModuleHub from "../../components/gerais/ModuleHub";
import { homeDictionary } from "../../constants/dictionaries";
import { api } from "../../services/api";

const d = homeDictionary;
const hub = d.suprimentosServicosHub;
const m = d.modulos;

export default function SuprimentosServicos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totais, setTotais] = useState({ fornecedores: 0, prestadores: 0 });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [fornecedores, prestadores] = await Promise.all([
        api.getFornecedores(),
        api.getPrestadores(),
      ]);
      setTotais({
        fornecedores: Array.isArray(fornecedores) ? fornecedores.length : 0,
        prestadores: Array.isArray(prestadores) ? prestadores.length : 0,
      });
    } catch (error) {
      console.error("[SuprimentosServicos] carregar:", error);
      setTotais({ fornecedores: 0, prestadores: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const resumo = useMemo(
    () => [
      {
        id: "fornecedores",
        label: hub.metricFornecedores,
        value: totais.fornecedores,
        icon: <Truck className="h-5 w-5" />,
        theme: "emerald",
      },
      {
        id: "prestadores",
        label: hub.metricPrestadores,
        value: totais.prestadores,
        icon: <Users className="h-5 w-5" />,
        theme: "pink",
      },
    ],
    [totais.fornecedores, totais.prestadores],
  );

  return (
    <ModuleHub
      eyebrow={hub.eyebrow}
      titulo={m.suprimentosServicos}
      subtitulo={hub.subtitulo}
      onVoltar={() => navigate("/")}
      resumo={resumo}
      resumoLoading={loading}
      loading={false}
      loadingIcon={<Handshake className="h-7 w-7" strokeWidth={2} />}
    />
  );
}
