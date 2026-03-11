import Link from "next/link";
import { Brain, Twitter, Github, Send } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-surface-border bg-surface/50 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Логотип и описание */}
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-neon-green font-bold text-xl mb-4 hover:opacity-80 transition w-fit"
            >
              <Brain className="w-8 h-8" />
              <span>BRAIN.VIKTOOR</span>
            </Link>
            <p className="text-text-muted text-sm max-w-sm leading-relaxed">
              Платформа для измерения и тренировки когнитивных способностей.
              Проверь свои пределы. Обойди весь мир.
            </p>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-xs mb-6">
              Навигация
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-text-muted">
              <li>
                <Link
                  href="/tests"
                  className="hover:text-neon-green transition"
                >
                  Все тесты
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="hover:text-neon-green transition"
                >
                  Таблица лидеров
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="hover:text-neon-green transition"
                >
                  Профиль
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-neon-green transition">
                  Блог
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-xs mb-6">
              Контакты
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-text-muted">
              <li>
                <a
                  href="mailto:hello@viktoor.ru"
                  className="hover:text-neon-green transition flex items-center gap-2"
                >
                  hello@viktoor.ru
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Нижняя часть подвала */}
        <div className="border-t border-surface-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {currentYear} Brain.Viktoor. Все права защищены.</p>

          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Условия использования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
