"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogIn, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthNavigation() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Проверяем текущего пользователя при загрузке
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    // 2. ПОДПИСЫВАЕМСЯ на изменения авторизации (Самая важная часть!)
    // Это сработает мгновенно, когда ты нажмешь "Вход" или "Выход"
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      router.refresh(); // Обновляем данные на текущей странице (например, лидерборд)
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Функция выхода
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Пока грузится - показываем спиннер, чтобы кнопки не дергались
  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-neon-green" />;
  }

  // --- ВАРИАНТ 1: ПОЛЬЗОВАТЕЛЬ АВТОРИЗОВАН ---
  if (user) {
    return (
      <div className="flex items-center gap-4">
        {/* Кнопка профиля с именем */}
        <Link
          href="/profile"
          className="flex items-center gap-2 text-sm font-bold hover:text-neon-green transition group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-surface-border flex items-center justify-center group-hover:border-neon-green transition">
            <User className="w-4 h-4 text-white group-hover:text-neon-green" />
          </div>
          <span className="hidden sm:block">
            {user.user_metadata?.full_name || "Игрок"}
          </span>
        </Link>

        {/* Кнопка выхода (только иконка для компактности) */}
        <button
          onClick={handleLogout}
          className="text-text-muted hover:text-white transition"
          title="Выйти"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // --- ВАРИАНТ 2: ГОСТЬ (Показываем Вход / Регистрацию) ---
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-text-muted hover:text-white transition flex items-center gap-2 text-sm font-bold"
      >
        <LogIn className="w-4 h-4" />{" "}
        <span className="hidden sm:inline">ВОЙТИ</span>
      </Link>
      <Link
        href="/signup"
        className="bg-white text-black px-4 py-2 rounded-sm text-sm font-bold hover:bg-neon-green transition"
      >
        РЕГИСТРАЦИЯ
      </Link>
    </div>
  );
}
