import CardHome from "../../../components/cards/CardHome";
import { homeDictionary } from "../../../constants/dictionaries";
import {
  homeFooterClass,
  homeModuleGridClass,
  homeSectionHeaderClass,
  homeSectionTitleClass,
  homeSectionAccentLineClass,
} from "../homeUi";

export default function HomeModuleGrid({
  modulos,
  counts,
  loadingCounts = false,
  showStats = false,
}) {
  return (
    <section className="pb-2 pt-2">
      <div className={homeSectionHeaderClass}>
        <div>
          <h2 className={homeSectionTitleClass}>
            {homeDictionary.dashboard.modulesSection}
          </h2>
          <div className={homeSectionAccentLineClass} aria-hidden />
        </div>
      </div>

      <div className={`mt-3.5 ${homeModuleGridClass}`}>
        {modulos.map((modulo) => (
          <CardHome
            key={modulo.id}
            titulo={modulo.titulo}
            descricao={modulo.descricao}
            categoria={modulo.categoria}
            destaques={modulo.destaques}
            colorTheme={modulo.colorTheme}
            path={modulo.path}
            Icon={modulo.Icon}
            statKey={showStats ? modulo.statKey : undefined}
            statValue={
              showStats && modulo.statKey ? counts?.[modulo.statKey] : undefined
            }
            loadingStat={showStats && loadingCounts && Boolean(modulo.statKey)}
          />
        ))}
      </div>

      <p className={homeFooterClass}>{homeDictionary.footer}</p>
    </section>
  );
}
