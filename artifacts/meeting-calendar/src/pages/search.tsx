import { useState } from "react";
import { useListMeetings } from "@workspace/api-client-react";
import { MeetingCard } from "@/components/meeting-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search as SearchIcon } from "lucide-react";

export default function Search() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  
  const [searchParams, setSearchParams] = useState<{ from?: string, to?: string }>({});

  const { data: meetings, isLoading } = useListMeetings(searchParams, {
    query: {
      enabled: !!(searchParams.from || searchParams.to),
      queryKey: ["listMeetings", searchParams],
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ 
      from: from || undefined, 
      to: to || undefined 
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Поиск встреч</h1>
        <p className="text-muted-foreground font-mono mt-2">Фильтр по датам</p>
      </header>

      <div className="bg-card border rounded-xl p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Label htmlFor="from" className="mb-2 block">С (ГГГГ-ММ-ДД)</Label>
            <Input id="from" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="flex-1 w-full">
            <Label htmlFor="to" className="mb-2 block">По (ГГГГ-ММ-ДД)</Label>
            <Input id="to" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <Button type="submit" className="w-full sm:w-auto h-10">
            <SearchIcon className="w-4 h-4 mr-2" />
            Искать
          </Button>
        </form>
      </div>

      <div>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : meetings && meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : meetings && meetings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
            Ничего не найдено
          </div>
        ) : null}
      </div>
    </div>
  );
}