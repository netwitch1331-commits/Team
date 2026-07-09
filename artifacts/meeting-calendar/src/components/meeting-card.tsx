import { Link } from "wouter";
import { format, parseISO, differenceInMinutes, isAfter, isBefore } from "date-fns";
import { type Meeting } from "@workspace/api-client-react";
import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";
import { MapPin, Clock, Video, Building2 } from "lucide-react";

interface MeetingCardProps {
  meeting: Meeting;
  compact?: boolean;
  className?: string;
}

function getMeetingStatus(startTime: Date, endTime: Date): { label: string; cls: string } | null {
  const now = new Date();
  if (isAfter(now, startTime) && isBefore(now, endTime)) {
    return { label: "Сейчас", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" };
  }
  if (isAfter(startTime, now) && differenceInMinutes(startTime, now) <= 60) {
    return { label: "Скоро", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" };
  }
  if (isAfter(now, endTime)) {
    return { label: "Завершена", cls: "bg-muted text-muted-foreground" };
  }
  return null;
}

export function MeetingCard({ meeting, compact, className }: MeetingCardProps) {
  const startTime = parseISO(meeting.startTime);
  const endTime = parseISO(meeting.endTime);
  const status = getMeetingStatus(startTime, endTime);
  const accentColor = meeting.organizer?.color ?? "#e85d2f";

  return (
    <Link href={"/meetings/" + meeting.id} className={cn("block group", className)}>
      <div className={cn(
        "bg-card rounded-xl border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative flex flex-col h-full overflow-hidden",
        compact ? "text-sm" : ""
      )}>
        {/* colored left strip */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ backgroundColor: accentColor }} />

        <div className={cn("pl-5 pr-4 pt-4 pb-4 flex flex-col h-full", compact ? "pl-4 pt-3 pb-3" : "")}>
          {/* Top row: title + badges */}
          <div className="flex justify-between items-start gap-2 mb-3">
            <h3 className={cn(
              "font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1",
              compact ? "text-sm" : "text-base"
            )}>
              {meeting.title}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {meeting.isOnline
                ? <Video className="w-3.5 h-3.5 text-blue-500" />
                : <Building2 className="w-3.5 h-3.5 text-muted-foreground" />}
              {status && (
                <span className={"text-[10px] font-medium px-1.5 py-0.5 rounded-full font-mono " + status.cls}>
                  {status.label}
                </span>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className={cn("flex flex-col text-muted-foreground font-mono mb-3 space-y-1", compact ? "text-[11px]" : "text-xs")}>
            <div className="flex items-center text-foreground font-medium">
              <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70 shrink-0" />
              <span>{format(startTime, "HH:mm")} — {format(endTime, "HH:mm")}</span>
            </div>
            {meeting.location && (
              <div className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-70 shrink-0" />
                <span className="truncate">{meeting.location}</span>
              </div>
            )}
          </div>

          {/* Footer: participants + organizer name */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
            <div className="flex -space-x-2 overflow-hidden">
              {meeting.participants?.slice(0, 5).map((p: { id: number; avatarInitials: string; color: string }) => (
                <Avatar
                  key={p.id}
                  initials={p.avatarInitials}
                  color={p.color}
                  className={cn("ring-2 ring-card shrink-0", compact ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-xs")}
                />
              ))}
              {(meeting.participants?.length ?? 0) > 5 && (
                <div className={cn(
                  "ring-2 ring-card bg-muted text-muted-foreground flex items-center justify-center font-mono shrink-0",
                  compact ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[10px]"
                )}>
                  +{(meeting.participants?.length ?? 0) - 5}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground ml-2 truncate max-w-[40%]">
              {meeting.organizer?.name}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MeetingCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border overflow-hidden animate-pulse flex flex-col relative",
      compact ? "h-28" : "h-44"
    )}>
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-muted" />
      <div className="pl-5 pr-4 pt-4 pb-4 flex flex-col h-full">
        <div className="flex justify-between mb-3">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 w-4 bg-muted rounded" />
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="mt-auto flex gap-1.5">
          <div className="w-7 h-7 rounded-full bg-muted" />
          <div className="w-7 h-7 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
