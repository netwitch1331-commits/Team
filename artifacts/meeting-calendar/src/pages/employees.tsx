import { useListEmployees } from "@workspace/api-client-react";
import { Avatar } from "@/components/avatar";
import { Loader2 } from "lucide-react";

export default function Employees() {
  const { data: employees, isLoading } = useListEmployees();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Команда</h1>
        <p className="text-muted-foreground font-mono mt-2">Сотрудники студии</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !employees || employees.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Нет сотрудников
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-card border rounded-lg p-4 flex items-center gap-4 hover-elevate transition-all">
              <Avatar initials={emp.avatarInitials} color={emp.color} className="w-12 h-12 text-lg shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate">{emp.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{emp.role}</p>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-secondary text-secondary-foreground">
                  {emp.department}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}