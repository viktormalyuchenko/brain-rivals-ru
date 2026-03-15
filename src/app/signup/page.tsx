"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Globe,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Наш клиент базы данных
import { trackGoal } from "@/lib/analytics";

export default function SignupPage() {
  const router = useRouter();

  // Состояния формы
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarStyle, setAvatarStyle] = useState<"Boy" | "Girl">("Boy");
  const [country, setCountry] = useState("RU");

  // Состояния загрузки и ошибок
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Создаем пользователя в Supabase Auth
      // Мы передаем дополнительные данные (имя, аватар, страну) в user_metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            avatar_style: avatarStyle,
            country: country,
          },
        },
      });

      if (signUpError) throw signUpError;
      trackGoal("signup_success");
      // Если регистрация успешна, перекидываем в профиль
      // (В реальном проекте тут нужно перенести данные из localStorage в настоящую базу, сделаем это позже)
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Логотип */}
      <Link
        href="/"
        className="flex items-center gap-2 text-neon-green font-bold text-2xl mb-8"
      >
        <User className="w-8 h-8" />
        <span>BRAIN.VIKTOOR</span>
      </Link>
      <p className="text-text-muted mb-8 text-center">
        Присоединяйтесь к соревнованиям. Отслеживайте свой прогресс.
      </p>

      {/* Карточка формы */}
      <div className="bg-surface border border-surface-border rounded-xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-extrabold text-center mb-8">
          Создать аккаунт
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          {/* Полное имя */}
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
              Полное имя
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full bg-background border border-surface-border rounded-md py-3 pl-10 pr-4 focus:outline-none focus:border-neon-green transition text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-background border border-surface-border rounded-md py-3 pl-10 pr-4 focus:outline-none focus:border-neon-green transition text-sm"
              />
            </div>
          </div>

          {/* Пароль */}
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full bg-background border border-surface-border rounded-md py-3 pl-10 pr-4 focus:outline-none focus:border-neon-green transition text-sm"
              />
            </div>
          </div>

          {/* Аватар (Пол) */}
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
              Стиль аватара
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAvatarStyle("Boy")}
                className={`flex items-center justify-center gap-2 py-3 rounded-md border text-sm transition ${avatarStyle === "Boy" ? "border-neon-green text-neon-green bg-neon-green/5" : "border-surface-border text-text-muted hover:border-gray-500"}`}
              >
                <User className="w-4 h-4" /> Boy
                {avatarStyle === "Boy" && <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setAvatarStyle("Girl")}
                className={`flex items-center justify-center gap-2 py-3 rounded-md border text-sm transition ${avatarStyle === "Girl" ? "border-neon-green text-neon-green bg-neon-green/5" : "border-surface-border text-text-muted hover:border-gray-500"}`}
              >
                <User className="w-4 h-4" /> Girl
                {avatarStyle === "Girl" && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Страна */}
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
              Страна
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-background border border-surface-border rounded-md py-3 pl-10 pr-4 focus:outline-none focus:border-neon-green transition text-sm appearance-none cursor-pointer"
              >
                <option value="RU">Россия</option>
                <option value="BY">Беларусь</option>
                <option value="KZ">Казахстан</option>
                <option value="UA">Украина</option>
                <option value="US">США</option>
                <option value="OTHER">Другая</option>
              </select>
            </div>
          </div>

          {/* Кнопка регистрации */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neon-green text-black font-bold py-3 rounded-sm mt-4 hover:bg-white transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "СОЗДАТЬ АККАУНТ"
            )}
          </button>

          <div className="text-center text-sm text-text-muted mt-4">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-neon-green hover:underline">
              Войти
            </Link>
          </div>
        </form>
      </div>

      <Link
        href="/"
        className="mt-8 text-text-muted hover:text-white transition text-sm flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> ВЕРНУТЬСЯ НА ГЛАВНУЮ
      </Link>
    </div>
  );
}
