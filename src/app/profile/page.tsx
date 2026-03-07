"use client";

import { useEffect, useState } from "react";
import {
  User,
  Trophy,
  Calendar,
  Zap,
  ArrowRight,
  LogOut,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Подключаем базу
import { translateTestName } from "@/lib/translations";

interface HistoryItem {
  test: string;
  score: number;
  date: string;
}

const getUnit = (testName: string) => {
  if (testName === "Reaction Time") return "мс";
  if (testName === "Aim Trainer") return "мс";
  if (testName === "Sequence Memory") return "ур";
  if (testName === "Number Memory") return "цифр";
  if (testName === "Verbal Memory") return "слов";
  if (testName === "Chimp Test") return "цифр";
  if (testName === "Typing Speed") return "WPM";
  if (testName === "Visual Memory") return "lvl";
  return "";
};

export default function ProfilePage() {
  const router = useRouter();

  // Состояния
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<any>(null); // Храним данные пользователя из Supabase
  const [loading, setLoading] = useState(true); // Состояние загрузки (чтобы не моргало)

  useEffect(() => {
    const fetchProfileData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        console.log("Ищем очки для юзера:", user.id); // Дебаг

        // Пробуем достать данные (убрал order, чтобы исключить ошибку сортировки)
        const { data: scoresData, error } = await supabase
          .from("scores")
          .select("*")
          .eq("user_id", user.id);

        console.log("Ответ от базы данных:", scoresData); // Дебаг
        console.log("Ошибка (если есть):", error); // Дебаг

        if (error) {
          console.error("Ошибка при чтении из БД:", error.message);
        } else if (scoresData && scoresData.length > 0) {
          // Если данные есть, преобразуем их
          const formattedHistory = scoresData.map((item) => ({
            test: item.test_name,
            score: item.score,
            date: item.created_at || new Date().toISOString(), // Если created_at нет, ставим текущую дату
          }));

          // Сортируем уже в JavaScript на всякий случай
          formattedHistory.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

          setHistory(formattedHistory);
        }
      } else {
        // Логика для гостя
        const saved = localStorage.getItem("guest_history");
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      }

      setLoading(false);
    };

    fetchProfileData();
  }, []);

  // Функция выхода из аккаунта
  const handleLogout = async () => {
    await supabase.auth.signOut(); // Удаляем токен из браузера
    setUser(null); // Сбрасываем состояние
    router.refresh(); // Обновляем страницу
  };

  // Пока проверяем авторизацию, показываем лоадер
  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
      </div>
    );
  }

  // Данные для отображения (если юзер есть - берем его данные, иначе дефолтные)
  const displayName = user ? user.user_metadata?.full_name : "Гость";
  const avatarStyle = user ? user.user_metadata?.avatar_style : "Local";
  const userCountry = user ? user.user_metadata?.country : "";
  const joinDate = user
    ? new Date(user.created_at).toLocaleDateString("ru-RU")
    : "Сегодня";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Шапка профиля */}
      <div className="bg-surface border border-surface-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative overflow-hidden">
        {/* Декоративное свечение, если юзер залогинен */}
        {user && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 blur-3xl rounded-full pointer-events-none"></div>
        )}

        <div className="flex items-center gap-6 text-center md:text-left z-10">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center border-2 ${user ? "bg-background border-neon-green" : "bg-gradient-to-br from-gray-700 to-gray-900 border-surface-border"}`}
          >
            <User
              className={`w-10 h-10 ${user ? "text-neon-green" : "text-text-muted"}`}
            />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-extrabold">{displayName}</h1>

              {/* Бейджик: LOCAL или ONLINE */}
              {user ? (
                <span className="bg-neon-green/10 text-neon-green border border-neon-green/30 text-[10px] px-2 py-1 rounded-sm uppercase tracking-widest font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>{" "}
                  Online
                </span>
              ) : (
                <span className="bg-gray-800 text-text-muted border border-surface-border text-[10px] px-2 py-1 rounded-sm uppercase tracking-widest font-bold">
                  Local
                </span>
              )}

              {userCountry && (
                <span className="text-sm bg-background border border-surface-border px-2 py-1 rounded">
                  {userCountry}
                </span>
              )}
            </div>

            <p className="text-text-muted text-sm flex items-center justify-center md:justify-start gap-2">
              <Calendar className="w-4 h-4" /> В игре с: {joinDate}
            </p>
          </div>
        </div>

        {/* Правый блок: Призыв к регистрации ИЛИ кнопка выхода */}
        <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right z-10">
          {!user ? (
            <>
              <Link
                href="/signup"
                className="bg-neon-green text-black px-6 py-3 rounded-sm font-bold flex items-center gap-2 hover:bg-white transition"
              >
                СОЗДАТЬ АККАУНТ <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-text-muted max-w-[250px]">
                Синхронизируйте прогресс между устройствами и соревнуйтесь
                глобально
              </p>
            </>
          ) : (
            <>
              <button
                onClick={handleLogout}
                className="border border-surface-border bg-background text-text-muted px-4 py-2 rounded-sm text-sm font-bold flex items-center gap-2 hover:text-white hover:border-gray-500 transition"
              >
                <LogOut className="w-4 h-4" /> ВЫЙТИ
              </button>
            </>
          )}
        </div>
      </div>

      {/* Статистика (Карточки) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-surface border border-surface-border p-6 rounded-xl text-center">
          <Trophy className="w-6 h-6 text-neon-green mx-auto mb-2" />
          <div className="text-3xl font-bold">{history.length}</div>
          <div className="text-xs text-text-muted uppercase tracking-widest mt-1">
            Тестов пройдено
          </div>
        </div>
        {/* Можешь добавить сюда еще карточки (Лучший ранг, Дней подряд и тд) */}
      </div>

      {/* История игр */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Zap className="text-neon-green" /> Последняя активность
        </h2>

        {history.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-surface-border rounded-xl text-text-muted">
            Вы еще не прошли ни одного теста.
            <br />
            <Link
              href="/tests/reaction"
              className="text-neon-green hover:underline mt-2 inline-block"
            >
              Перейти к тестам
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((item, index) => (
              <div
                key={index}
                className="bg-surface border border-surface-border p-5 rounded-lg flex items-center justify-between hover:border-text-muted transition"
              >
                <div>
                  <div className="font-bold text-lg">
                    {translateTestName(item.test)}
                  </div>
                  <div className="text-sm text-text-muted">
                    {new Date(item.date).toLocaleString("ru-RU")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-neon-green">
                    {item.score}{" "}
                    <span className="text-sm font-normal text-text-muted">
                      {getUnit(item.test)}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#cd7f32] uppercase tracking-widest bg-[#cd7f32]/10 inline-block px-2 py-1 rounded mt-1">
                    Bronze
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
