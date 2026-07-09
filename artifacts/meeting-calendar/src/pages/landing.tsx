import { Link } from "wouter";
import { CalendarDays, Search, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <CalendarDays className="w-4 h-4" />
            Командный календарь
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground tracking-tight mb-6 leading-tight">
            Studio{" "}
            <span className="text-primary">Sync</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-xl mx-auto">
            Умный календарь встреч для вашей команды
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center h-12 px-8 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-base shadow-sm"
            >
              Войти
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center h-12 px-8 bg-transparent border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors text-base"
            >
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-card/50 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-center text-foreground mb-12">
            Всё что нужно команде
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <CalendarDays className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Планируйте встречи
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Создавайте встречи, добавляйте участников и отслеживайте расписание на день, неделю или месяц.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Ищите и фильтруйте
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Быстро находите нужные встречи по названию, организатору, дате или формату проведения.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Управляйте командой
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Просматривайте сотрудников, их роли и отделы. Контролируйте занятость и избегайте конфликтов.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
