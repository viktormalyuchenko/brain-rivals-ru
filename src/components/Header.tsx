import Link from "next/link";
import { Brain, Activity, Trophy, User } from "lucide-react";
import AuthNavigation from "./AuthNavigation"; // Импортируем наш новый компонент

export default function Header() {
  return (
    <header className="w-full border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between text-sm">
        {/* Логотип */}
        <Link
          href="/"
          className="flex items-center gap-2 text-neon-green font-bold text-lg hover:opacity-80 transition"
        >
          <Brain className="w-6 h-6" />
          <span>BRAIN.VIKTOOR</span>
        </Link>

        {/* Навигация (Центр) - Скрыта на мобильных */}
        <nav className="hidden md:flex items-center gap-8 text-text-muted font-medium">
          <Link
            href="/tests"
            className="hover:text-white transition flex items-center gap-2"
          >
            <Activity className="w-4 h-4" /> ТЕСТЫ
          </Link>
          <Link
            href="/leaderboard"
            className="hover:text-white transition flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" /> ЛИДЕРЫ
          </Link>
          <Link
            href="/profile"
            className="hover:text-white transition flex items-center gap-2"
          >
            <User className="w-4 h-4" /> ПРОФИЛЬ
          </Link>
        </nav>

        {/* Правая часть: Умные кнопки авторизации */}
        <div>
          <AuthNavigation />
        </div>
      </div>
    </header>
  );
}
