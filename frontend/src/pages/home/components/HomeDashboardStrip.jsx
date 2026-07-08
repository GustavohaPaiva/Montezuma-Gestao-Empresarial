import { HardHat, FolderOpen, Wallet, LineChart } from "lucide-react";
import BaseCard from "../../../components/cards/BaseCard";
import { homeDictionary } from "../../../constants/dictionaries";
import {
  homeKpiGridClass,
  homeKpiWrapClass,
  homeSectionHeaderClass,
  homeSectionTitleClass,
  homeSectionAccentLineClass,
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
    <section className="mb-6">
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

          return (
            <div key={key} className={homeKpiWrapClass}>
              <BaseCard
                variant="metricCompact"
                title={kpis[labelKey]}
                value={
                  loading ? (
                    <span className="inline-block h-6 w-10 animate-pulse rounded-lg bg-surface-muted" />
                  ) : (
                    String(value ?? 0)
                  )
                }
                colorTheme={hasAlert ? "primary" : colorTheme}
                icon={<Icon className="h-4 w-4" />}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
