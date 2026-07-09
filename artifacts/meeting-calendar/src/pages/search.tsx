import { useState, useEffect } from "react";
import { useListMeetings, useListEmployees } from "@workspace/api-client-react";
import { MeetingCard } from "@/components/meeting-card";
import { Input } from "@/components/ui/input";
import { Loader2, Search as SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListMeetingsParams, ListMeetingsStatus } from "@workspace/api-client-react";

type StatusFilter = "all" | "upcoming" | "completed";
type FormatFilter = "all" | "online" | "offline";

const statusLabels: Record<StatusFilter, string> = {
  all: "Все",
  upcoming: "Предстоящие",
  completed: "Завершённые",
};

const formatLabels: Record<FormatFilter, string> = {
  all: "Все форматы",
  online: "Онлайн",
  offline: "Оффлайн",
};

export default function SearchPage() {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [organizerId, setOrganizerId] = useState<number | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data: employees } = useListEmployees();

  const params: ListMeetingsParams = {};
  if (debouncedSearch) params.search = debouncedSearch;
  if (organizerId) params.organizerId = organizerId;
  if (status !== "all") params.status = status as ListMeetingsStatus;
  if (formatFilter === "online") params.isOnline = true;
  if (formatFilter === "offline") params.isOnline = false;
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;

  const hasAnyFilter = Object.keys(params).length > 0;

  const { data: meetings, isLoading } = useListMeetings(params, {
    query: { enabled: hasAnyFilter, queryKey: ["listMeetings", params] },
  });

  const clearSearch = () => {
    setSearchText("");
    setDebouncedSearch("");
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Поиск встреч</h1>
        <p className="text-muted-foreground font-mono mt-2">Найдите нужную встречу</p>
      </header>

      <div className="space-y-4 mb-8">
        {/* Search input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Поиск по названию или месту..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchText && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Organizer select */}
          <select
            value={organizerId ?? ""}
            onChange={(e) => setOrganizerId(e.target.value ? Number(e.target.value) : null)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Любой организатор</option>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          {/* Status pills */}
          <div className="flex gap-1">
            {(Object.keys(statusLabels) as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                  status === s
                    ? "bg-primary text-white border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>

          {/* Format pills */}
          <div className="flex gap-1">
            {(Object.keys(formatLabels) as FormatFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormatFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                  formatFilter === f
                    ? "bg-primary text-white border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {formatLabels[f]}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-mono">С</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-sm text-muted-foreground font-mono">По</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        {!hasAnyFilter ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
            <SearchIcon className="w-12 h-12 opacity-30" />
            <p className="text-base">Используйте фильтры для поиска встреч</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : meetings && meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
            Ничего не найдено
          </div>
        )}
      </div>
    </div>
  );
}
