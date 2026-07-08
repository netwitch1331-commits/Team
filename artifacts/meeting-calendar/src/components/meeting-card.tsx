import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { type Meeting } from "@workspace/api-client-react";
import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";

interface MeetingCardProps {
  meeting: Meeting;
  compact?: boolean;
  className?: string;
}

export function MeetingCard({ meeting, compact, className }: MeetingCardProps) {
  const startTime = parseISO(meeting.startTime);
  const endTime = parseISO(meeting.endTime);

  return (
    <Link href={`/meetings/${meeting.id}`} className={cn("block group", className)}>
      <div className={cn(
        "bg-card rounded-lg border border-border p-4 transition-all duration-200 hover-elevate hover:border-primary/50 relative flex flex-col h-full",
        compact ? "p-3 text-sm" : ""
      )}>
        <div className="flex justify-between items-start mb-2">
          <h3 className={cn("font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2", compact ? "text-sm" : "text-base")}>
            {meeting.title}
          </h3>
        </div>
        
        <div className={cn("flex flex-col text-muted-foreground font-mono mb-3 space-y-1.5", compact ? "text-[11px]" : "text-xs")}>
          <div className="flex items-center text-foreground font-medium">
            <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            <span>{format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}</span>
          </div>
          {meeting.location && (
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-70" />
              <span className="truncate">{meeting.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <div className="flex -space-x-2 overflow-hidden">
            {meeting.participants?.map((p: { id: number; avatarInitials: string; color: string }) => (
              <Avatar 
                key={p.id} 
                initials={p.avatarInitials} 
                color={p.color} 
                className={cn("ring-2 ring-card shrink-0", compact ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-xs")}
              />
            ))}
          </div>
          
          <div className="text-xs text-muted-foreground ml-2 truncate max-w-[40%]">
            {meeting.organizer?.name}
          </div>
        </div>
      </div>
    </Link>
  );
}