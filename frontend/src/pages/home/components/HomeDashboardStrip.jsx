import { HardHat, FolderOpen, Wallet, LineChart } from "lucide-react";
import BaseCard from "../../../components/cards/BaseCard";
import { homeDictionary } from "../../../constants/dictionaries";
import {
  homeKpiGridClass,
  homeKpiWrapClass,
  homeSectionHeaderClass,
  homeSectionTitleClass,
  homeSectionAccentLineClass,
  buildHomeKpiHint,
} from "../homeUi";

const KPI_CONFIG = [
  {
    key: "obrasAtivas",
    labelKey: "obrasAtivas",
    icon: HardHat,
    colorTheme: "amber",
  },
  {
    key: "processos",
    labelKey: "processos",
    icon: FolderOpen,
    colorTheme: "blue",
  },
  {
    key: "pendencias",
    labelKey: "pendencias",
    icon: Wallet,
    colorTheme: "primary",
    alertWhenPositive: true,
  },
  {
    key: "tarefas",
    labelKey: "tarefas",
    icon: LineChart,
    colorTheme: "purple",
  },
];

export default function HomeDashboardStrip({ counts, loading }) {
  const { kpis } = homeDictionary.dashboard;

  return (
    <section className="mb-8">
      <div className={homeSectionHeaderClass}>
        <div>
          <h2 className={homeSectionTitleClass}>
            {homeDictionary.dashboard.sectionTitle}
          </h2>
          <div className={homeSectionAccentLineClass} aria-hidden />
        </div>
      </div>

      <div className={homeKpiGridClass}>
        {KPI_CONFIG.map((kpi) => {
          const { key, labelKey, colorTheme, alertWhenPositive } = kpi;
          const Icon = kpi.icon;
          const value = counts?.[key];
          const hasAlert = alertWhenPositive && (value ?? 0) > 0;
          const hint = loading ? null : buildHomeKpiHint(key, counts, homeDictionary);

          return (
            <div key={key} className={homeKpiWrapClass}>
              <BaseCard
                variant="metric"
                title={kpis[labelKey]}
                value={
                  loading ? (
                    <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-surface-muted" />
                  ) : (
                    String(value ?? 0)
                  )
                }
                hint={
                  loading ? (
                    <span className="inline-block h-3 w-28 animate-pulse rounded bg-surface-muted" />
                  ) : (
                    hint
                  )
                }
                colorTheme={hasAlert ? "primary" : colorTheme}
                icon={<Icon className="h-5 w-5" />}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
