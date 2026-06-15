import {
  Calendar,
  CalendarDays,
  FileBarChart,
  FileText,
  FolderOpen,
  HardHat,
  MapPin,
  Ruler,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { homeDictionary } from "../../../constants/dictionaries";
import { WEEKLY_AGENDA_DAYS } from "../homeWeeklyAgenda";
import {
  HOME_MODULE_THEMES,
  homeWeeklyAgendaClass,
  homeWeeklyAgendaPanelClass,
  homeWeeklyAgendaTrackClass,
  homeWeeklyDayColumnClass,
  homeWeeklyDayColumnActiveClass,
  homeWeeklyDayTopBarClass,
  homeWeeklyDayHeaderClass,
  homeWeeklyDayLabelClass,
  homeWeeklyDayLabelActiveClass,
  homeWeeklyTodayBadgeClass,
  homeWeeklyTodayBadgeActiveClass,
  homeWeeklyTaskListClass,
  homeWeeklyTaskChipClass,
  homeWeeklyTaskChipActiveClass,
  homeWeeklyTaskListSpacerClass,
  homeWeeklyTaskIconWrapClass,
  homeWeeklyTaskIconWrapActiveClass,
  homeWeeklyTaskIconClass,
  homeWeeklyTaskIconActiveClass,
  homeSectionLabelAccentClass,
  homeSectionTitleClass,
  homeSectionAccentLineClass,
  getDiaSemanaAgendaIndex,
} from "../homeUi";

const TASK_ICONS = {
  wallet: Wallet,
  fileText: FileText,
  hardHat: HardHat,
  mapPin: MapPin,
  folderOpen: FolderOpen,
  shoppingCart: ShoppingCart,
  trendingUp: TrendingUp,
  ruler: Ruler,
  fileBarChart: FileBarChart,
  calendar: Calendar,
  users: Users,
};

function WeeklyDayCard({ day, isToday, todayBadge }) {
  const theme = HOME_MODULE_THEMES[day.accent] || HOME_MODULE_THEMES.primary;

  return (
    <article
      className={`${homeWeeklyDayColumnClass} ${
        isToday ? homeWeeklyDayColumnActiveClass : ""
      }`}
      aria-current={isToday ? "date" : undefined}
      aria-label={day.labelFull}
    >
      <span
        className={`${homeWeeklyDayTopBarClass} ${theme.topBar}`}
        aria-hidden
      />

      <div className={homeWeeklyDayHeaderClass}>
        <p
          className={`${homeWeeklyDayLabelClass} ${
            isToday ? homeWeeklyDayLabelActiveClass : ""
          }`}
          title={day.labelFull}
        >
          {day.labelShort}
        </p>
        {isToday ? (
          <span
            className={`${homeWeeklyTodayBadgeClass} ${homeWeeklyTodayBadgeActiveClass}`}
          >
            {todayBadge}
          </span>
        ) : null}
      </div>

      <ul className={homeWeeklyTaskListClass}>
        {day.tasks.map((task) => {
          const Icon = TASK_ICONS[task.icon] || CalendarDays;

          return (
            <li
              key={task.label}
              className={`${homeWeeklyTaskChipClass} ${
                isToday ? homeWeeklyTaskChipActiveClass : ""
              }`}
            >
              <span
                className={`${homeWeeklyTaskIconWrapClass} ${
                  isToday ? homeWeeklyTaskIconWrapActiveClass : ""
                } ${theme.softBg} ${theme.strongText}`}
              >
                <Icon
                  className={
                    isToday
                      ? homeWeeklyTaskIconActiveClass
                      : homeWeeklyTaskIconClass
                  }
                  strokeWidth={2.25}
                />
              </span>
              <span className="min-w-0 flex-1 line-clamp-2 break-words">
                {task.label}
              </span>
            </li>
          );
        })}
        <li
          className={homeWeeklyTaskListSpacerClass}
          aria-hidden="true"
        />
      </ul>
    </article>
  );
}

export default function HomeWeeklyAgenda() {
  const todayIndex = getDiaSemanaAgendaIndex();
  const { sectionLabel, sectionTitle, todayBadge } =
    homeDictionary.weeklyAgenda;

  return (
    <section className={homeWeeklyAgendaClass} aria-label={sectionTitle}>
      <div className={homeWeeklyAgendaPanelClass}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_0%_0%,rgba(220,59,11,0.08),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-accent-primary/10 blur-[70px]"
          aria-hidden
        />
        <CalendarDays
          className="pointer-events-none absolute -bottom-4 -right-1 h-20 w-20 text-accent-primary/[0.07] md:h-24 md:w-24"
          strokeWidth={1}
          aria-hidden
        />

        <div className="relative z-10">
          <div className="mb-4 md:mb-5">
            <span className={homeSectionLabelAccentClass}>{sectionLabel}</span>
            <h2 className={`${homeSectionTitleClass} mt-2 text-lg md:text-xl`}>
              {sectionTitle}
            </h2>
            <div className={homeSectionAccentLineClass} aria-hidden />
          </div>

          <div className={homeWeeklyAgendaTrackClass}>
            {WEEKLY_AGENDA_DAYS.map((day, index) => (
              <WeeklyDayCard
                key={day.id}
                day={day}
                isToday={index === todayIndex}
                todayBadge={todayBadge}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
