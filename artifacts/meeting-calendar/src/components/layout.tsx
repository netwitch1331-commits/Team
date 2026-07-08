import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, CalendarDays, LayoutGrid, Search, Users, Menu, X } from "lucide-react";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Сегодня", icon: CalendarDays },
    { href: "/week", label: "Неделя", icon: LayoutGrid },
    { href: "/search", label: "Поиск", icon: Search },
    { href: "/employees", label: "Сотрудники", icon: Users },
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-sidebar">
        <div className="font-serif font-bold text-lg text-primary tracking-tight">Studio Sync</div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={closeMobile}>
          <div className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r p-6 shadow-lg flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="font-serif font-bold text-xl text-primary tracking-tight">Studio Sync</div>
              <Button variant="ghost" size="icon" onClick={closeMobile}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <Link href="/new" onClick={closeMobile} className={cn(buttonVariants({ variant: "default" }), "w-full justify-start gap-2 shadow-sm font-medium mb-6")}>
              <Plus className="w-4 h-4" />
              Новая встреча
            </Link>

            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeMobile} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  location === item.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r bg-sidebar p-6 h-screen sticky top-0 shrink-0">
        <div className="font-serif font-bold text-2xl text-primary tracking-tight mb-8 px-2">Studio Sync</div>
        
        <Link href="/new" className={cn(buttonVariants({ variant: "default" }), "w-full justify-start gap-2 shadow-sm font-medium mb-8 transition-transform hover:scale-[1.02]")}>
          <Plus className="w-4 h-4" />
          Новая встреча
        </Link>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium group",
              location === item.href 
                ? "bg-primary/10 text-primary" 
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}>
              <item.icon className={cn("w-4.5 h-4.5 transition-colors", location === item.href ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 w-full max-w-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}