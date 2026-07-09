import { useRoute, Link } from "wouter";
import { useGetEmployee, useGetEmployeeMeetings } from "@workspace/api-client-react";
import { Avatar } from "@/components/avatar";
import { MeetingCard, MeetingCardSkeleton } from "@/components/meeting-card";
import { ArrowLeft, CalendarDays, Briefcase, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function EmployeeDetail() {
  const [, params] = useRoute("/employees/:id");
  const employeeId = params?.id ? Number(params.id) : null;

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const { data: employee, isLoading: empLoading } = useGetEmployee(employeeId!, {
    query: { enabled: !!employeeId, queryKey: ["getEmployee", employeeId] }
  });
  const { data: meetings, isLoading: meetingsLoading } = useGetEmployeeMeetings(employeeId!, { from: todayStr }, {
    query: { enabled: !!employeeId, queryKey: ["getEmployeeMeetings", employeeId, todayStr] }
  });

  if (empLoading) return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-24" />
      <div className="flex gap-5">
        <div className="w-20 h-20 rounded-full bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
      </div>
    </div>
  );

  if (!employee) return (
    <div className="p-10 text-center text-muted-foreground">Сотрудник не найден</div>
  );

  const now = new Date();
  const currentMeeting = (meetings ?? []).find(m =>
    new Date(m.startTime) <= now && new Date(m.endTime) > now
  );
  const busyUntil = currentMeeting ? new Date(currentMeeting.endTime) : null;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto pb-20">
      <Link href="/employees" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Назад
      </Link>

      {/* Profile header */}
      <div className="bg-card border rounded-2xl p-6 mb-6 flex items-start gap-5 shadow-sm">
        <Avatar initials={employee.avatarInitials} color={employee.color} className="w-20 h-20 text-2xl shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">{employee.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm">{employee.role}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-mono bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
              {employee.department}
            </span>
          </div>

          {busyUntil && (
            <div className="mt-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              Занят до {format(busyUntil, "HH:mm", { locale: ru })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming meetings */}
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        Предстоящие встречи
      </h2>
      {meetingsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <MeetingCardSkeleton key={i} />)}
        </div>
      ) : !meetings || meetings.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
          Нет предстоящих встреч
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      )}
    </div>
  );
}
