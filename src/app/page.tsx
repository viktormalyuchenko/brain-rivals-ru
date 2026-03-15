import Link from "next/link";
import { Zap, Play, Trophy, Globe, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RotatingText from "@/components/RotatingText";
import { Metadata } from "next";
import { translateTestName } from "@/lib/translations";

// Функция-помощник: превращает код страны в эмодзи-флаг
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode === "OTHER") return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default async function Home() {
  // 1. Берем с запасом 100 лучших результатов
  const { data: rawScores } = await supabase
    .from("scores")
    .select("player_name, score, country, user_id")
    .eq("test_name", "Reaction Time")
    .order("score", { ascending: true })
    .limit(100);

  // 2. ФИЛЬТРУЕМ ДУБЛИКАТЫ (Оставляем только лучший результат каждого юзера)
  const uniquePlayersMap = new Map();
  if (rawScores) {
    rawScores.forEach((entry) => {
      // Т.к. данные уже отсортированы (лучшие сверху), мы просто берем первое совпадение
      if (!uniquePlayersMap.has(entry.user_id)) {
        uniquePlayersMap.set(entry.user_id, entry);
      }
    });
  }

  // 3. Берем только ТОП-8 из уникальных
  const top8Players = Array.from(uniquePlayersMap.values()).slice(0, 8);

  // 4. Считаем общее количество тестов
  const { count } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true });

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* ЛЕВАЯ ЧАСТЬ: Текст и кнопки */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-neon-green text-sm font-bold tracking-widest uppercase">
            <Zap className="w-4 h-4" fill="currentColor" />
            Измеряй. Соревнуйся. Побеждай.
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            ИЗМЕРЯЙ. <br />
            СОРЕВНУЙСЯ. <br />
            ПРОВЕРЬ
            <br />
            <RotatingText /> {/* <-- Вставили анимацию здесь */}
          </h1>

          <p className="text-text-muted text-lg max-w-md">
            Платформа когнитивных соревнований. Измерь свою скорость реакции,
            память, логику и поднимись в глобальной таблице лидеров.
          </p>

          <div className="flex flex-wrap gap-4 mt-4">
            <Link
              href="/tests"
              className="bg-neon-green text-black px-6 py-3 flex items-center gap-2 font-bold rounded-sm hover:bg-white transition duration-300"
            >
              <Play className="w-5 h-5" fill="currentColor" /> НАЧАТЬ ТЕСТ
            </Link>
            <Link
              href="/leaderboard"
              className="border border-surface-border bg-surface px-6 py-3 flex items-center gap-2 font-bold rounded-sm hover:border-text-muted transition duration-300"
            >
              <Trophy className="w-5 h-5" /> РЕЙТИНГИ
            </Link>
          </div>

          {/* Статистика */}
          <div className="flex gap-8 mt-8 border-t border-surface-border pt-8">
            <div>
              <div className="flex items-center gap-2 text-text-muted text-xs uppercase mb-1">
                <Activity className="w-3 h-3" /> Онлайн
              </div>
              <div className="text-2xl font-bold">
                {Math.floor(Math.random() * 50) + 10}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-text-muted text-xs uppercase mb-1">
                <Zap className="w-3 h-3" /> Результатов в базе
              </div>
              <div className="text-2xl font-bold">{count || 0}</div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: НАСТОЯЩАЯ Таблица лидеров */}
        <div className="bg-surface border border-surface-border rounded-lg p-6 lg:ml-auto w-full max-w-md shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-text-muted uppercase">
              <Globe className="w-4 h-4 text-neon-cyan" /> Топ 8 : Live
            </div>
            <div className="text-xs text-text-muted">
              {translateTestName("Reaction Time")}
            </div>
          </div>

          {/* Заголовки таблицы */}
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 text-xs text-text-muted font-bold uppercase mb-4 px-2 relative z-10">
            <div>Ранг</div>
            <div>Игрок</div>
            <div className="text-right">Счет</div>
          </div>

          {/* НАСТОЯЩИЙ Список игроков из БД */}
          <div className="flex flex-col gap-1 relative z-10">
            {top8Players.length === 0 ? (
              <div className="text-center text-sm text-text-muted py-8">
                Пока нет результатов. Станьте первым!
              </div>
            ) : (
              top8Players.map((player, index) => {
                const rank = (index + 1).toString().padStart(2, "0");
                const isTop3 = index < 3;

                return (
                  <div
                    key={index}
                    className={`grid grid-cols-[auto_1fr_auto] gap-4 items-center px-2 py-2 rounded-md ${index === 0 ? "bg-white/5 border border-white/10" : "hover:bg-white/5 transition"}`}
                  >
                    <div
                      className={`text-sm font-bold w-6 ${isTop3 ? "text-neon-green" : "text-text-muted"}`}
                    >
                      {rank}
                    </div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span>{getFlagEmoji(player.country)}</span>
                      {player.player_name || "Аноним"}
                    </div>
                    <div className="text-sm font-bold text-right text-text-muted">
                      {player.score}{" "}
                      <span className="text-[10px] font-normal">ms</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            href="/leaderboard"
            className="block text-center text-xs text-text-muted mt-6 hover:text-white transition relative z-10"
          >
            ПОКАЗАТЬ ПОЛНЫЙ РЕЙТИНГ →
          </Link>
        </div>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Brain Rivals | Онлайн тесты для мозга и реакции",
  description:
    "Сборник когнитивных тестов: скорость реакции, аим тренер, память, печать. Соревнуйся в глобальном рейтинге и отслеживай прогресс.",
  keywords: [
    "тренировка мозга",
    "развитие памяти",
    "тесты онлайн",
    "iq тесты",
    "brain training",
    "lumosity аналог",
  ],
};
