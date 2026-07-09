import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, CalendarDays, LayoutGrid, Search, Users, Menu, X, LogOut, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/react";
import { useTheme } from "@/hooks/useTheme";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, toggle } = useTheme();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.firstName?.[0] ?? "?").toUpperCase();

  const navItems = [
    { href: "/today", label: "Сегодня", icon: CalendarDays },
    { href: "/week", label: "Неделя", icon: LayoutGrid },
    { href: "/search", label: "Поиск", icon: Search },
    { href: "/employees", label: "Сотрудники", icon: Users },
  ];

  const closeMobile = () => setMobileOpen(false);

  const userBlock = (
    <div className="mt-auto pt-4 border-t border-border px-3">
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors">
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{user?.fullName ?? user?.username ?? "Пользователь"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
        <button
          onClick={toggle}
          title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          title="Выйти"
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

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

            <nav className="flex flex-col gap-2 flex-1">
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
            {userBlock}
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
        {userBlock}
      </div>

      <main className="flex-1 w-full max-w-full overflow-hidden pb-20 md:pb-0 overflow-y-auto">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-sidebar/95 backdrop-blur-sm border-t border-border md:hidden flex items-center justify-around px-2 py-2">
        <Link href="/today" className={cn("flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]",
          location === "/today" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-medium">Сегодня</span>
        </Link>

        <Link href="/week" className={cn("flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]",
          location === "/week" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-medium">Неделя</span>
        </Link>

        <Link href="/new" className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors -mt-4">
          <Plus className="w-6 h-6" />
        </Link>

        <Link href="/employees" className={cn("flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]",
          location === "/employees" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Команда</span>
        </Link>

        <Link href="/search" className={cn("flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]",
          location === "/search" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Поиск</span>
        </Link>
      </nav>
    </div>
  );
}
