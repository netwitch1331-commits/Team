import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  color?: string | null;
  className?: string;
}

export function Avatar({ initials, color, className }: AvatarProps) {
  return (
    <div 
      className={cn("flex items-center justify-center rounded-full text-white font-medium bg-muted", className)}
      style={color ? { backgroundColor: color } : undefined}
    >
      {initials}
    </div>
  );
}