"use client";

import { useEffect, useState } from "react";
import { Trophy, Globe, Filter, Loader2, Zap, Grid } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { translateTestName } from "@/lib/translations";

type ScoreEntry = {
  rank?: number;
  player_name: string;
  score: number;
  country: string;
  created_at: string;
};

// Функция для рангов (как на скрине)
const getTier = (test: string, score: number) => {
  if (test === "Reaction Time") {
    if (score < 180) return { name: "ELITE", color: "text-purple-500" };
    if (score < 220) return { name: "DIAMOND", color: "text-cyan-400" };
    if (score < 300) return { name: "GOLD", color: "text-yellow-500" };
    return { name: "SILVER", color: "text-gray-400" };
  } else {
    // Sequence Memory (чем больше, тем лучше)
    if (score >= 15) return { name: "ELITE", color: "text-purple-500" };
    if (score >= 10) return { name: "DIAMOND", color: "text-cyan-400" };
    if (score >= 5) return { name: "GOLD", color: "text-yellow-500" };
    return { name: "SILVER", color: "text-gray-400" };
  }
};

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode === "OTHER") return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function LeaderboardPage() {
  const [activeTest, setActiveTest] = useState("Reaction Time");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores(activeTest);
  }, [activeTest]);

  const fetchScores = async (testName: string) => {
    setLoading(true);

    // Определяем сортировку: для реакции меньше=лучше (asc), для памяти больше=лучше (desc)
    const isAscending = testName === "Reaction Time";

    const { data, error } = await supabase
      .from("scores")
      .select("player_name, score, country, created_at, user_id")
      .eq("test_name", testName)
      .order("score", { ascending: isAscending })
      .limit(300); // Берем с запасом, чтобы отфильтровать дубли

    if (!error && data) {
      // ФИЛЬТРАЦИЯ ДУБЛИКАТОВ (Оставляем лучший результат игрока)
      const uniquePlayers = new Map();

      data.forEach((entry) => {
        // Если игрока еще нет в мапе, добавляем
        if (!uniquePlayers.has(entry.user_id)) {
          uniquePlayers.set(entry.user_id, entry);
        }
        // (Т.к. мы уже отсортировали запрос, первый результат юзера и есть его лучший)
      });

      setScores(Array.from(uniquePlayers.values()));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
      {/* Заголовок */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-2 uppercase flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10 text-neon-green" /> Таблица Лидеров
        </h1>
        <p className="text-text-muted">
          Топ игроков по всем когнитивным испытаниям
        </p>
      </div>

      {/* Фильтры и Табы */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-surface border border-surface-border p-2 rounded-lg">
        {/* Выбор теста (Dropdown style) */}
        <div className="flex flex-wrap gap-2 p-1 bg-black/20 rounded">
          {[
            "Reaction Time",
            "Sequence Memory",
            "Aim Trainer",
            "Number Memory",
            "Verbal Memory",
            "Chimp Test",
            "Typing Speed",
            "Visual Memory",
          ].map((testKey) => (
            <button
              key={testKey}
              onClick={() => setActiveTest(testKey)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition whitespace-nowrap ${
                activeTest === testKey
                  ? "bg-neon-green text-black"
                  : "text-text-muted hover:text-white"
              }`}
            >
              {translateTestName(testKey)}
            </button>
          ))}
        </div>

        {/* Переключатель Global / Weekly (Пока визуал) */}
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-neon-green/10 text-neon-green text-xs font-bold rounded border border-neon-green/20 uppercase">
            <Globe className="w-3 h-3 inline mr-1" /> Global
          </button>
          <button
            className="px-3 py-1 text-text-muted text-xs font-bold rounded hover:bg-white/5 uppercase"
            disabled
          >
            Weekly
          </button>
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden shadow-2xl">
        {/* Заголовок таблицы */}
        <div className="grid grid-cols-[60px_1fr_100px_100px] gap-4 px-6 py-4 bg-black/20 text-xs font-bold text-text-muted uppercase tracking-wider">
          <div className="text-center">#</div>
          <div>Игрок</div>
          <div className="text-right">Счет</div>
          <div className="text-right">Ранг</div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
          </div>
        ) : scores.length === 0 ? (
          <div className="py-20 text-center text-text-muted">
            Нет результатов для этого теста.
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {scores.map((player, index) => {
              const rank = index + 1;
              const tier = getTier(activeTest, player.score);
              const isTop3 = rank <= 3;

              return (
                <div
                  key={index}
                  className="grid grid-cols-[60px_1fr_100px_100px] gap-4 px-6 py-4 items-center hover:bg-white/5 transition duration-200"
                >
                  {/* Ранг */}
                  <div className="flex justify-center">
                    {rank === 1 && (
                      <span className="text-yellow-400 text-lg">♛</span>
                    )}
                    {rank === 2 && (
                      <span className="text-gray-300 text-lg">♛</span>
                    )}
                    {rank === 3 && (
                      <span className="text-[#cd7f32] text-lg">♛</span>
                    )}
                    {rank > 3 && (
                      <span className="text-text-muted font-bold text-sm">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Игрок */}
                  <div className="flex flex-col">
                    <span
                      className={`font-bold text-sm ${isTop3 ? "text-white" : "text-gray-300"}`}
                    >
                      {player.player_name}
                    </span>
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      {getFlagEmoji(player.country)} {player.country}
                    </span>
                  </div>

                  {/* Счет */}
                  <div className="text-right font-bold text-white">
                    {player.score}
                    <span className="text-[10px] text-text-muted font-normal ml-1">
                      {activeTest === "Reaction Time" ? "ms" : "lvl"}
                    </span>
                  </div>

                  {/* Тир (Elite/Gold...) */}
                  <div
                    className={`text-right text-[10px] font-bold tracking-widest uppercase ${tier.color}`}
                  >
                    {tier.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
