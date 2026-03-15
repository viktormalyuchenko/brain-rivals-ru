"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Trophy,
  Globe,
  Loader2,
  Zap,
  Grid,
  Calendar,
  Target,
  Hash,
  Type,
  Brain,
  Eye,
  Check,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { translateTestName } from "@/lib/translations";

// Карта иконок для выпадающего списка
const TEST_ICONS: Record<string, any> = {
  "Reaction Time": Zap,
  "Sequence Memory": Grid,
  "Aim Trainer": Target,
  "Number Memory": Hash,
  "Verbal Memory": Brain,
  "Chimp Test": Brain,
  "Typing Speed": Type,
  "Visual Memory": Grid,
  "Visual Acuity": Eye,
};

const ALL_TESTS = Object.keys(TEST_ICONS);

type ScoreEntry = {
  player_name: string;
  score: number;
  country: string;
  created_at: string;
  user_id: string;
};

// Конфиг для определения рангов (дублируем логику из профиля для синхронности)
const getTier = (test: string, score: number) => {
  const isLowerBetter = test === "Reaction Time" || test === "Aim Trainer";

  const check = (threshold: number) =>
    isLowerBetter ? score <= threshold : score >= threshold;

  // Упрощенные пороги для примера
  if (test === "Reaction Time") {
    if (score < 180) return { name: "ELITE", color: "text-purple-500" };
    if (score < 220) return { name: "DIAMOND", color: "text-cyan-400" };
    if (score < 300) return { name: "GOLD", color: "text-yellow-500" };
    return { name: "SILVER", color: "text-gray-400" };
  }
  // Для остальных тестов (где чем больше, тем лучше)
  if (check(15)) return { name: "ELITE", color: "text-purple-500" };
  if (check(10)) return { name: "DIAMOND", color: "text-cyan-400" };
  if (check(5)) return { name: "GOLD", color: "text-yellow-500" };
  return { name: "SILVER", color: "text-gray-400" };
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
  const [timeRange, setTimeRange] = useState<"all" | "weekly">("all");
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояние выпадающего списка
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне списка
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    const isAscending =
      activeTest === "Reaction Time" || activeTest === "Aim Trainer";
    let query = supabase
      .from("scores")
      .select("player_name, score, country, created_at, user_id")
      .eq("test_name", activeTest);
    if (timeRange === "weekly") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte("created_at", sevenDaysAgo.toISOString());
    }
    const { data, error } = await query
      .order("score", { ascending: isAscending })
      .limit(200);
    if (!error && data) {
      const uniquePlayers = new Map();
      data.forEach((entry) => {
        if (!uniquePlayers.has(entry.user_id))
          uniquePlayers.set(entry.user_id, entry);
      });
      setScores(Array.from(uniquePlayers.values()));
    }
    setLoading(false);
  }, [activeTest, timeRange]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const ActiveIcon = TEST_ICONS[activeTest] || Zap;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-2 uppercase flex items-center justify-center gap-3 tracking-tighter text-white">
          <Trophy className="w-10 h-10 text-neon-green" /> Таблица Лидеров
        </h1>
        <p className="text-text-muted">Топ лучших результатов сообщества</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        {/* КАСТОМНЫЙ ВЫПАДАЮЩИЙ СПИСОК */}
        <div className="relative w-full md:w-72" ref={dropdownRef}>
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 mb-2 block">
            Выберите тест
          </label>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between bg-surface border ${isOpen ? "border-neon-green shadow-[0_0_15px_rgba(0,255,136,0.1)]" : "border-surface-border"} p-4 rounded-xl transition-all duration-200 group hover:border-gray-500`}
          >
            <div className="flex items-center gap-3">
              <ActiveIcon
                className={`w-5 h-5 ${isOpen ? "text-neon-green" : "text-text-muted group-hover:text-white"}`}
              />
              <span className="font-bold text-sm text-white">
                {translateTestName(activeTest)}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180 text-neon-green" : ""}`}
            />
          </button>

          {/* Выпадающее меню */}
          {isOpen && (
            <div className="absolute top-[110%] left-0 w-full bg-[#111] border border-surface-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="max-h-80 overflow-y-auto py-2 custom-scrollbar">
                {ALL_TESTS.map((testKey) => {
                  const Icon = TEST_ICONS[testKey];
                  const isSelected = activeTest === testKey;
                  return (
                    <button
                      key={testKey}
                      onClick={() => {
                        setActiveTest(testKey);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isSelected ? "bg-neon-green/10 text-neon-green" : "text-text-muted hover:bg-white/5 hover:text-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">
                          {translateTestName(testKey)}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ПЕРЕКЛЮЧАТЕЛЬ ВРЕМЕНИ (All / Weekly) */}
        <div className="flex flex-col items-end w-full md:w-auto">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mr-1 mb-2 block">
            Период
          </label>
          <div className="flex bg-surface border border-surface-border p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setTimeRange("all")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition ${timeRange === "all" ? "bg-white/10 text-white shadow-inner" : "text-text-muted hover:text-white"}`}
            >
              <Globe className="w-3.5 h-3.5" /> Весь мир
            </button>
            <button
              onClick={() => setTimeRange("weekly")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition ${timeRange === "weekly" ? "bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]" : "text-text-muted hover:text-white"}`}
            >
              <Calendar className="w-3.5 h-3.5" /> Неделя
            </button>
          </div>
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-[60px_1fr_100px_100px] gap-4 px-6 py-4 bg-black/40 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
          <div className="text-center">Ранг</div>
          <div>Игрок</div>
          <div className="text-right">Счет</div>
          <div className="text-right">Тир</div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
            <span className="text-xs text-text-muted animate-pulse">
              Загрузка данных...
            </span>
          </div>
        ) : scores.length === 0 ? (
          <div className="py-20 text-center text-text-muted flex flex-col items-center gap-3">
            <Target className="w-10 h-10 opacity-20" />
            <p>
              В этом периоде результатов еще нет.
              <br />
              Станьте первым!
            </p>
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
                  className={`grid grid-cols-[60px_1fr_100px_100px] gap-4 px-6 py-4 items-center hover:bg-white/5 transition duration-200 ${isTop3 ? "bg-white/[0.02]" : ""}`}
                >
                  <div className="flex justify-center font-mono font-bold text-sm">
                    {rank === 1 ? (
                      <span className="text-yellow-400 text-xl">🥇</span>
                    ) : rank === 2 ? (
                      <span className="text-gray-300 text-xl">🥈</span>
                    ) : rank === 3 ? (
                      <span className="text-[#cd7f32] text-xl">🥉</span>
                    ) : (
                      <span className="text-text-muted">{rank}</span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-bold text-sm truncate ${isTop3 ? "text-white" : "text-gray-300"}`}
                    >
                      {player.player_name || "Аноним"}
                    </span>
                    <span className="text-[10px] text-text-muted flex items-center gap-1 uppercase tracking-tighter">
                      {getFlagEmoji(player.country)} {player.country}
                    </span>
                  </div>

                  <div className="text-right font-mono font-bold text-white text-sm">
                    {activeTest === "Aim Trainer"
                      ? (30 / (player.score / 1000)).toFixed(2)
                      : player.score}
                    <span className="text-[9px] text-text-muted font-normal ml-1">
                      {activeTest === "Reaction Time"
                        ? "ms"
                        : activeTest === "Aim Trainer"
                          ? "tps"
                          : activeTest === "Typing Speed"
                            ? "wpm"
                            : "lvl"}
                    </span>
                  </div>

                  <div
                    className={`text-right text-[9px] font-black tracking-widest uppercase ${tier.color}`}
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
