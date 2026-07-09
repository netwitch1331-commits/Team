import { useState } from "react";
import { useGetTodayMeetings, useGetWeekMeetings, useListMeetings } from "@workspace/api-client-react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isToday, parseISO, differenceInMinutes, isAfter } from "date-fns";
import { ru } from "date-fns/locale";
import { MeetingCard, MeetingCardSkeleton } from "@/components/meeting-card";
import { Link } from "wouter";
import { CalendarPlus, List, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Meeting } from "@workspace/api-client-react";

type FilterType = "today" | "tomorrow" | "week" | "upcoming" | "completed" | "online" | "offline";
type ViewType = "list" | "calendar";

const filterLabels: Record<FilterType, string> = {
  today: "Сегодня",
  tomorrow: "Завтра",
  week: "Эта неделя",
  upcoming: "Предстоящие",
  completed: "Завершённые",
  online: "Онлайн",
  offline: "Оффлайн",
};

const DAY_HEADERS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function useTodayData() {
  return useGetTodayMeetings();
}
function useTomorrowData() {
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");
  return useListMeetings({ from: tomorrowStr, to: tomorrowStr });
}
function useWeekData() {
  return useGetWeekMeetings();
}
function useUpcomingData() {
  return useListMeetings({ status: "upcoming" });
}
function useCompletedData() {
  return useListMeetings({ status: "completed" });
}
function useOnlineData() {
  return useListMeetings({ isOnline: true });
}
function useOfflineData() {
  return useListMeetings({ isOnline: false });
}

function FilteredMeetings({ filter }: { filter: FilterType }) {
  const today = useTodayData();
  const tomorrow = useTomorrowData();
  const week = useWeekData();
  const upcoming = useUpcomingData();
  const completed = useCompletedData();
  const online = useOnlineData();
  const offline = useOfflineData();

  const sources: Record<FilterType, { data: Meeting[] | undefined; isLoading: boolean }> = {
    today,
    tomorrow,
    week,
    upcoming,
    completed,
    online,
    offline,
  };

  return sources[filter];
}

export default function TodayPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("today");
  const [view, setView] = useState<ViewType>("list");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = format(startOfMonth(calendarMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(calendarMonth), "yyyy-MM-dd");

  const { data: monthMeetings } = useListMeetings({ from: monthStart, to: monthEnd });
  const { data: todayMeetings } = useGetTodayMeetings();

  const { data: meetings, isLoading } = FilteredMeetings({ filter: activeFilter });

  const now = new Date();
  const nextMeeting = (todayMeetings ?? [])
    .filter(m => isAfter(parseISO(m.startTime), now))
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())[0];

  const minutesToNext = nextMeeting ? differenceInMinutes(parseISO(nextMeeting.startTime), now) : null;

  const calendarDisplayMeetings = (() => {
    if (view !== "calendar") return meetings;
    if (selectedDay) {
      return (monthMeetings ?? []).filter((m) => isSameDay(new Date(m.startTime), selectedDay));
    }
    return (monthMeetings ?? []).filter((m) => isSameDay(new Date(m.startTime), new Date()));
  })();

  // Build calendar grid
  const monthStartDate = startOfMonth(calendarMonth);
  const monthEndDate = endOfMonth(calendarMonth);
  const gridStart = startOfWeek(monthStartDate, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEndDate, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const hasMeetingsOnDay = (day: Date) => {
    return (monthMeetings ?? []).some((m) => isSameDay(new Date(m.startTime), day));
  };

  const displayMeetings = view === "calendar" ? calendarDisplayMeetings : meetings;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Сегодня</h1>
          <p className="text-muted-foreground font-mono mt-2 capitalize">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: ru })}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-secondary/40 rounded-lg p-1 self-start">
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-2 rounded-md transition-colors",
              view === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="Список"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "p-2 rounded-md transition-colors",
              view === "calendar" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="Календарь"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-5 bg-card border rounded-xl px-5 py-3 shadow-sm">
        <div>
          <p className="text-2xl font-bold font-serif text-foreground">{todayMeetings?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground font-mono">встреч сегодня</p>
        </div>
        {minutesToNext !== null && (
          <>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {minutesToNext < 60
                  ? `через ${minutesToNext} мин`
                  : `через ${Math.floor(minutesToNext / 60)} ч ${minutesToNext % 60} мин`}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {nextMeeting?.title}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {(Object.keys(filterLabels) as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
              activeFilter === f
                ? "bg-primary text-white border-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            )}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Calendar view */}
      {view === "calendar" && (
        <div className="mb-6 bg-card border rounded-xl p-5 shadow-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-semibold text-sm uppercase tracking-wider">
              {format(calendarMonth, "LLLL yyyy", { locale: ru })}
            </span>
            <button
              onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-xs font-mono text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day) => {
              const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
              const todayDay = isToday(day);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const hasMeetings = hasMeetingsOnDay(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(-1)) ? null : day)}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-9 w-full rounded-md transition-colors",
                    !isCurrentMonth && "opacity-30",
                    todayDay && !isSelected && "font-bold",
                    isSelected && "ring-2 ring-primary ring-offset-1",
                    "hover:bg-secondary/60"
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-sm w-7 h-7 flex items-center justify-center rounded-full",
                      todayDay && "bg-primary text-white"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {hasMeetings && (
                    <span
                      className={cn(
                        "absolute bottom-0.5 w-1 h-1 rounded-full bg-primary",
                        todayDay && "bg-white"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Meeting list */}
      {isLoading && view === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <MeetingCardSkeleton key={i} />)}
        </div>
      ) : !displayMeetings || displayMeetings.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center flex flex-col items-center justify-center border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CalendarPlus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Встреч нет</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {view === "calendar" && selectedDay
              ? `Нет встреч на ${format(selectedDay, "d MMMM", { locale: ru })}`
              : "По выбранному фильтру встреч не найдено"}
          </p>
          <Link
            href="/new"
            className="inline-flex items-center justify-center h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors"
          >
            Запланировать встречу
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
