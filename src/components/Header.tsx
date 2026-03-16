"use client"; // Важно: теперь это клиентский компонент, т.к. есть состояние открытого меню

import { useState, useEffect } from "react";
import Link from "next/link";
import { Brain, Activity, Trophy, User, BookOpen, Menu, X } from "lucide-react";
import AuthNavigation from "./AuthNavigation";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname(); // Чтобы закрывать меню при переходе на новую страницу

  // Закрываем меню при смене страницы
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Запрещаем скролл фона, когда меню открыто
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: "ТЕСТЫ", href: "/tests", icon: Activity },
    { name: "ЛИДЕРЫ", href: "/leaderboard", icon: Trophy },
    { name: "ПРОФИЛЬ", href: "/profile", icon: User },
    { name: "БЛОГ", href: "/blog", icon: BookOpen },
  ];

  return (
    <header className="w-full border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between text-sm">
        {/* Логотип */}
        <Link
          href="/"
          className="flex items-center gap-2 text-neon-green font-bold text-lg hover:opacity-80 transition z-50"
        >
          <Brain className="w-6 h-6" />
          <span>BRAIN.VIKTOOR</span>
        </Link>

        {/* Навигация (Десктоп) */}
        <nav className="hidden md:flex items-center gap-8 text-text-muted font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:text-white transition flex items-center gap-2"
            >
              <link.icon className="w-4 h-4" /> {link.name}
            </Link>
          ))}
        </nav>

        {/* Правая часть: Авторизация + Кнопка мобильного меню */}
        <div className="flex items-center gap-4 z-50">
          <div className="hidden sm:block">
            <AuthNavigation />
          </div>

          {/* Гамбургер (только мобилки) */}
          <button
            className="md:hidden text-white p-2 -mr-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* МОБИЛЬНОЕ МЕНЮ (Полноэкранное) */}
      <div
        className={`fixed inset-0 z-40 flex flex-col pt-24 px-6 transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        } bg-[#050505]`} // УБРАЛИ ПОЛУПРОЗРАЧНОСТЬ, поставили глухой почти черный цвет
      >
        <nav className="flex flex-col gap-6 text-xl font-extrabold tracking-widest mb-12">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-4 text-white border-b border-white/10 pb-4"
            >
              <link.icon className="w-6 h-6 text-neon-green" /> {link.name}
            </Link>
          ))}
        </nav>

        {/* В мобильном меню блок авторизации выглядит как большие кнопки */}
        <div className="mt-auto mb-12">
          <h3 className="text-[10px] text-text-muted uppercase mb-4 tracking-widest">
            Ваш аккаунт
          </h3>
          <AuthNavigation />
        </div>
      </div>
    </header>
  );
}
