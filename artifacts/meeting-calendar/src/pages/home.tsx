import { useGetTodayMeetings } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MeetingCard } from "@/components/meeting-card";
import { Link } from "wouter";
import { CalendarPlus, Loader2 } from "lucide-react";

export default function Home() {
  const { data: meetings, isLoading } = useGetTodayMeetings();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Сегодня</h1>
        <p className="text-muted-foreground font-mono mt-2 capitalize">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !meetings || meetings.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center flex flex-col items-center justify-center border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CalendarPlus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">На сегодня встреч нет</h2>
          <p className="text-muted-foreground mb-6 max-w-md">Кажется, день свободен. Отличное время для сфокусированной работы или планирования новых задач.</p>
          <Link href="/new" className="inline-flex items-center justify-center h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors">
            Запланировать встречу
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}