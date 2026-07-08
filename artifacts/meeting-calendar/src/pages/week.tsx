import { useGetWeekMeetings } from "@workspace/api-client-react";
import { format, parseISO, startOfWeek, addDays, differenceInMinutes } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Week() {
  const { data: meetings, isLoading } = useGetWeekMeetings();
  
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 13 }).map((_, i) => i + 8); // 8 to 20

  const HOUR_HEIGHT = 60; // px
  const START_HOUR = 8;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-6 border-b shrink-0 bg-sidebar/50">
        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Неделя</h1>
        <p className="text-muted-foreground font-mono mt-1 capitalize">
          {format(weekStart, 'd MMM', { locale: ru })} - {format(days[6], 'd MMM yyyy', { locale: ru })}
        </p>
      </header>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="min-w-[800px] h-full flex flex-col">
            <div className="flex border-b sticky top-0 bg-background z-20">
              <div className="w-16 shrink-0 border-r" />
              {days.map((day) => (
                <div key={day.toISOString()} className="flex-1 py-3 text-center border-r last:border-r-0">
                  <div className="text-sm font-semibold capitalize">{format(day, 'EEEE', { locale: ru })}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">{format(day, 'd.MM')}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-1 relative pb-8">
              <div className="w-16 shrink-0 border-r bg-background flex flex-col relative z-10">
                {hours.map(hour => (
                  <div key={hour} className="text-xs text-muted-foreground font-mono text-right pr-2 -mt-2" style={{ height: HOUR_HEIGHT }}>
                    {hour}:00
                  </div>
                ))}
              </div>

              <div className="flex flex-1 relative">
                <div className="absolute inset-0 pointer-events-none">
                  {hours.map((_, i) => (
                    <div key={i} className="border-t border-border/50 w-full" style={{ height: HOUR_HEIGHT }} />
                  ))}
                </div>

                {days.map((day, dayIndex) => {
                  const dayMeetings = meetings?.filter(m => {
                    const mDate = parseISO(m.startTime);
                    return mDate.toDateString() === day.toDateString() || 
                           (mDate.getFullYear() === day.getFullYear() && mDate.getMonth() === day.getMonth() && mDate.getDate() === day.getDate());
                  }) || [];

                  return (
                    <div key={dayIndex} className="flex-1 border-r last:border-r-0 relative min-h-[780px]">
                      {dayMeetings.map(meeting => {
                        const start = parseISO(meeting.startTime);
                        const end = parseISO(meeting.endTime);
                        
                        const startMins = start.getHours() * 60 + start.getMinutes() - (START_HOUR * 60);
                        const durationMins = differenceInMinutes(end, start);
                        
                        const top = Math.max(0, (startMins / 60) * HOUR_HEIGHT);
                        const height = Math.max(20, (durationMins / 60) * HOUR_HEIGHT);

                        return (
                          <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                            <div 
                              className="absolute left-1 right-1 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-colors p-2 overflow-hidden shadow-sm z-10"
                              style={{ top: `${top}px`, height: `${height}px` }}
                            >
                              <div className="font-semibold text-primary text-xs leading-tight line-clamp-2">{meeting.title}</div>
                              {height >= 40 && (
                                <div className="text-[10px] text-primary/70 font-mono mt-1">
                                  {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}