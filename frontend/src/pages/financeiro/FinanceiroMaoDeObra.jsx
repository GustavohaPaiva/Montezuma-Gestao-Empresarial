import { useNavigate } from "react-router-dom";
import { Construction } from "lucide-react";
import ModuleHub from "../../components/gerais/ModuleHub";
import { homeDictionary } from "../../constants/dictionaries";

const hub = homeDictionary.financeiroHub;

export default function FinanceiroMaoDeObra() {
  const navigate = useNavigate();

  return (
    <ModuleHub
      eyebrow={hub.eyebrow}
      titulo={hub.maoObraTitulo}
      onVoltar={() => navigate("/financeiro")}
      acessos={[]}
      loading={false}
    >
      <div className="mx-auto mt-8 flex w-full max-w-lg flex-col items-center rounded-2xl border border-dashed border-border-primary/45 bg-white px-6 py-14 text-center shadow-sm">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
          <Construction className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">
          {hub.maoObraEmConstrucaoTitulo}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {hub.maoObraEmConstrucaoDescricao}
        </p>
      </div>
    </ModuleHub>
  );
}
