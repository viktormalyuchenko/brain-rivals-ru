"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  LogIn,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  // Состояния
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UX состояния (загрузка, ошибка)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Проверка: если пользователь уже вошел, сразу редиректим его в профиль
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/profile"); // Используем replace, чтобы нельзя было вернуться назад
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Попытка входа
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    // 2. Если есть ошибка - обрабатываем её
    if (signInError) {
      setLoading(false);

      // Проверяем текст ошибки от Supabase и переводим на русский
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Неверный email или пароль.");
        return;
      }
      if (signInError.message.includes("Email not confirmed")) {
        setError("Email не подтвержден. Проверьте почту.");
        return;
      }

      // Любая другая ошибка
      setError("Ошибка входа. Попробуйте еще раз.");
      return;
    }

    // 3. Если ошибки нет - редирект
    router.refresh();
    router.push("/profile");
    // setLoading(false) здесь не нужен, так как мы уходим со страницы
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Логотип */}
      <Link
        href="/"
        className="flex items-center gap-2 text-neon-green font-bold text-2xl mb-8 hover:opacity-80 transition"
      >
        <LogIn className="w-8 h-8" />
        <span>BRAIN.VIKTOOR</span>
      </Link>

      <p className="text-text-muted mb-8 text-center max-w-sm">
        Войдите, чтобы сохранить свой прогресс и соревноваться в глобальном
        рейтинге.
      </p>

      {/* Карточка входа */}
      <div className="bg-surface border border-surface-border rounded-xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Декоративная подсветка */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-50"></div>

        <h1 className="text-2xl font-extrabold text-center mb-8">
          Вход в аккаунт
        </h1>

        {/* Блок ошибки */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-md mb-6 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Email */}
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-bold ml-1">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-neon-green transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-background border border-surface-border rounded-md py-3 pl-10 pr-4 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition text-sm text-white placeholder:text-text-muted/50"
              />
            </div>
          </div>

          {/* Пароль */}
          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="block text-xs text-text-muted uppercase tracking-wider font-bold">
                Пароль
              </label>
              {/* Ссылка "Забыли пароль?" пока ведет на заглушку или главную, потом можно сделать сброс */}
              <a
                href="#"
                className="text-xs text-neon-green hover:underline opacity-80 hover:opacity-100 transition"
              >
                Забыли пароль?
              </a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-neon-green transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ваш пароль"
                className="w-full bg-background border border-surface-border rounded-md py-3 pl-10 pr-4 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition text-sm text-white placeholder:text-text-muted/50"
              />
            </div>
          </div>

          {/* Кнопка входа */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neon-green text-black font-extrabold py-3.5 rounded-sm mt-2 hover:bg-white hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_0_15px_-3px_rgba(0,255,136,0.3)] hover:shadow-[0_0_20px_-3px_rgba(0,255,136,0.5)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ВОЙТИ"}
          </button>

          <div className="text-center text-sm text-text-muted mt-4 pt-4 border-t border-surface-border">
            Нет аккаунта?{" "}
            <Link
              href="/signup"
              className="text-neon-green font-bold hover:underline ml-1"
            >
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>

      <Link
        href="/"
        className="mt-8 text-text-muted hover:text-white transition text-sm flex items-center gap-2 opacity-60 hover:opacity-100"
      >
        <ArrowLeft className="w-4 h-4" /> ВЕРНУТЬСЯ НА ГЛАВНУЮ
      </Link>
    </div>
  );
}
