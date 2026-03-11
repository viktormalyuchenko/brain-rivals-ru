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
  Activity,
  Brain,
  Target,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { translateTestName } from "@/lib/translations";

interface HistoryItem {
  test: string;
  score: number;
  date: string;
}

// --- КОНФИГУРАЦИЯ ТЕСТОВ (Для умной аналитики) ---
const TEST_CONFIG: Record<
  string,
  {
    category: string;
    unit: string;
    isLowerBetter: boolean;
    tiers: { elite: number; diamond: number; gold: number; silver: number };
  }
> = {
  "Reaction Time": {
    category: "Реакция",
    unit: "ms",
    isLowerBetter: true,
    tiers: { elite: 180, diamond: 220, gold: 300, silver: 400 },
  },
  "Aim Trainer": {
    category: "Точность",
    unit: "ms",
    isLowerBetter: true,
    tiers: { elite: 5000, diamond: 6000, gold: 7500, silver: 10000 },
  }, // В базе хранятся мс
  "Sequence Memory": {
    category: "Память",
    unit: "ур.",
    isLowerBetter: false,
    tiers: { elite: 15, diamond: 10, gold: 7, silver: 4 },
  },
  "Number Memory": {
    category: "Память",
    unit: "цифр",
    isLowerBetter: false,
    tiers: { elite: 14, diamond: 11, gold: 8, silver: 5 },
  },
  "Verbal Memory": {
    category: "Память",
    unit: "очков",
    isLowerBetter: false,
    tiers: { elite: 100, diamond: 60, gold: 30, silver: 15 },
  },
  "Chimp Test": {
    category: "Память",
    unit: "цифр",
    isLowerBetter: false,
    tiers: { elite: 18, diamond: 14, gold: 10, silver: 6 },
  },
  "Typing Speed": {
    category: "Точность",
    unit: "WPM",
    isLowerBetter: false,
    tiers: { elite: 100, diamond: 80, gold: 60, silver: 40 },
  },
  "Visual Memory": {
    category: "Память",
    unit: "ур.",
    isLowerBetter: false,
    tiers: { elite: 18, diamond: 14, gold: 9, silver: 5 },
  },
  "Visual Acuity": {
    category: "Восприятие",
    unit: "ур.",
    isLowerBetter: false,
    tiers: { elite: 12, diamond: 10, gold: 7, silver: 4 },
  },
};

const ALL_GAMES_LIST = Object.keys(TEST_CONFIG);

// Вспомогательная функция для расчета ранга
const calculateTier = (testName: string, score: number) => {
  const config = TEST_CONFIG[testName];
  if (!config)
    return {
      name: "BRONZE",
      val: 1,
      color: "bg-[#cd7f32]/20 text-[#cd7f32] border-[#cd7f32]/30",
    };

  const { isLowerBetter, tiers } = config;
  const check = (threshold: number) =>
    isLowerBetter ? score <= threshold : score >= threshold;

  if (check(tiers.elite))
    return {
      name: "ELITE",
      val: 5,
      color: "bg-purple-900/40 text-purple-400 border-purple-500/50",
    };
  if (check(tiers.diamond))
    return {
      name: "DIAMOND",
      val: 4,
      color: "bg-cyan-900/40 text-cyan-400 border-cyan-500/50",
    };
  if (check(tiers.gold))
    return {
      name: "GOLD",
      val: 3,
      color: "bg-yellow-900/40 text-yellow-400 border-yellow-500/50",
    };
  if (check(tiers.silver))
    return {
      name: "SILVER",
      val: 2,
      color: "bg-gray-800 text-gray-300 border-gray-600",
    };
  return {
    name: "BRONZE",
    val: 1,
    color: "bg-[#cd7f32]/20 text-[#cd7f32] border-[#cd7f32]/30",
  };
};

// Функция форматирования очков (для Aim Trainer переводим мс в TPS для красивого отображения)
const formatScore = (testName: string, score: number) => {
  if (testName === "Aim Trainer") {
    return (30 / (score / 1000)).toFixed(2) + " TPS";
  }
  return `${score} ${TEST_CONFIG[testName]?.unit || ""}`;
};

export default function ProfilePage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: scoresData } = await supabase
          .from("scores")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (scoresData) {
          setHistory(
            scoresData.map((item) => ({
              test: item.test_name,
              score: item.score,
              date: item.created_at,
            })),
          );
        }
      } else {
        const saved = localStorage.getItem("guest_history");
        if (saved) setHistory(JSON.parse(saved));
      }
      setLoading(false);
    };
    fetchProfileData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
      </div>
    );
  }

  // --- АНАЛИТИКА ДАННЫХ ---

  // 1. Лучшие результаты по каждой игре
  const bestScores = new Map<string, number>();
  history.forEach((item) => {
    const isLowerBetter = TEST_CONFIG[item.test]?.isLowerBetter ?? false;
    const currentBest = bestScores.get(item.test);

    if (currentBest === undefined) {
      bestScores.set(item.test, item.score);
    } else {
      if (isLowerBetter) {
        if (item.score < currentBest) bestScores.set(item.test, item.score);
      } else {
        if (item.score > currentBest) bestScores.set(item.test, item.score);
      }
    }
  });

  // 2. Глобальный лучший ранг
  let highestTier = {
    name: "НЕТ",
    val: 0,
    color: "bg-surface border-surface-border text-text-muted",
  };
  bestScores.forEach((score, test) => {
    const tier = calculateTier(test, score);
    if (tier.val > highestTier.val) highestTier = tier;
  });

  // 3. Микс активности (какие категории играл)
  const categoryCounts: Record<string, number> = {
    Реакция: 0,
    Память: 0,
    Точность: 0,
    Восприятие: 0,
  };
  let totalValidTests = 0;
  history.forEach((item) => {
    const cat = TEST_CONFIG[item.test]?.category as keyof typeof categoryCounts;
    if (cat) {
      categoryCounts[cat]++;
      totalValidTests++;
    }
  });

  // 4. Сортировка для списка "Лучшие тесты"
  const bestTestsList = Array.from(bestScores.entries())
    .map(([test, score]) => ({
      test,
      score,
      tier: calculateTier(test, score),
    }))
    .sort((a, b) => b.tier.val - a.tier.val)
    .slice(0, 3); // Топ 3

  // Данные юзера
  const displayName = user ? user.user_metadata?.full_name : "Гость";
  const joinDate = user
    ? new Date(user.created_at).toLocaleDateString("ru-RU")
    : "Сегодня";

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* 1. ГЛАВНАЯ ШАПКА */}
      <div className="bg-surface border border-surface-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative overflow-hidden">
        {user && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 blur-3xl rounded-full pointer-events-none"></div>
        )}

        <div className="flex items-center gap-6 z-10 w-full md:w-auto">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-surface-border flex items-center justify-center shrink-0">
            <User className="w-10 h-10 text-text-muted" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold">
                {displayName}
              </h1>

              <span
                className={`text-[10px] px-2 py-1 rounded-sm uppercase tracking-widest font-bold border ${user ? "bg-neon-green/10 text-neon-green border-neon-green/30" : "bg-gray-800 text-text-muted border-surface-border"}`}
              >
                {user ? "Online" : "Local"}
              </span>

              {/* Бейдж лучшего ранга прямо в шапке */}
              {highestTier.val > 0 && (
                <span
                  className={`text-[10px] px-2 py-1 rounded-sm uppercase tracking-widest font-bold border ${highestTier.color}`}
                >
                  {highestTier.name}
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm flex items-center gap-2">
              В игре с: {joinDate} <span className="hidden md:inline">•</span>{" "}
              {history.length} результатов
            </p>
          </div>
        </div>

        {/* Кнопки справа */}
        <div className="flex flex-col md:items-end w-full md:w-auto z-10 border-t md:border-t-0 border-surface-border pt-6 md:pt-0 mt-4 md:mt-0">
          {!user ? (
            <div className="bg-black/50 p-4 rounded-xl border border-white/5 w-full md:w-auto">
              <p className="text-xs text-text-muted mb-3 text-center md:text-right">
                Сохраните прогресс навсегда
              </p>
              <Link
                href="/signup"
                className="w-full bg-neon-green text-black px-6 py-2.5 rounded-sm font-bold flex items-center justify-center gap-2 hover:bg-white transition"
              >
                <User className="w-4 h-4" /> СОЗДАТЬ АККАУНТ
              </Link>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="border border-surface-border bg-background text-text-muted px-4 py-2 rounded-sm text-sm font-bold flex items-center justify-center gap-2 hover:text-white hover:border-gray-500 transition w-full md:w-auto"
            >
              <LogOut className="w-4 h-4" /> ВЫЙТИ
            </button>
          )}
        </div>
      </div>

      {/* 2. BENTO СЕТКА АНАЛИТИКИ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* КАРТОЧКА: ОБЩИЙ ПРОГРЕСС (Занимает 7 колонок) */}
        <div className="col-span-1 md:col-span-7 bg-surface border border-surface-border rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-neon-green font-bold text-sm tracking-widest uppercase mb-6">
            <Target className="w-4 h-4" /> Ваш прогресс
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-background border border-surface-border p-4 rounded-xl">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Пройдено тестов
              </div>
              <div className="text-2xl md:text-3xl font-bold">
                {history.length}
              </div>
            </div>
            <div className="bg-background border border-surface-border p-4 rounded-xl">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Разных игр
              </div>
              <div className="text-2xl md:text-3xl font-bold">
                {bestScores.size}
              </div>
            </div>
            <div className="bg-background border border-surface-border p-4 rounded-xl">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Лучший ранг
              </div>
              <div
                className={`inline-block mt-1 text-[10px] px-2 py-1 rounded-sm uppercase tracking-widest font-bold border ${highestTier.color}`}
              >
                {highestTier.name}
              </div>
            </div>
          </div>
          <p className="text-sm text-text-muted">
            {user
              ? "Вся статистика синхронизирована с глобальным рейтингом."
              : "Прогресс сохранен только на этом устройстве. Зарегистрируйтесь, чтобы не потерять его."}
          </p>
        </div>

        {/* КАРТОЧКА: АКТИВНОСТЬ ПО КАТЕГОРИЯМ (Занимает 5 колонок) */}
        <div className="col-span-1 md:col-span-5 bg-surface border border-surface-border rounded-2xl p-6">
          <div className="flex items-center gap-2 text-neon-cyan font-bold text-sm tracking-widest uppercase mb-6">
            <Activity className="w-4 h-4" /> Активность
          </div>

          <div className="flex flex-col gap-5">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const percentage =
                totalValidTests > 0 ? (count / totalValidTests) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-white">{cat}</span>
                    <span className="text-text-muted">{count} тестов</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-neon-cyan transition-all duration-500"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. СРЕДНЯЯ СЕКЦИЯ: ЛУЧШИЕ РЕЗУЛЬТАТЫ И ИСТОРИЯ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ЛУЧШИЕ ТЕСТЫ */}
        <div className="bg-surface border border-surface-border rounded-2xl p-6">
          <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm tracking-widest uppercase mb-6">
            <Trophy className="w-4 h-4" /> Лучшие результаты
          </div>

          {bestTestsList.length === 0 ? (
            <div className="text-text-muted text-sm p-4 bg-background rounded-lg border border-surface-border">
              Нет данных
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bestTestsList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-background border border-surface-border rounded-xl"
                >
                  <div>
                    <div className="font-bold text-white mb-1">
                      {translateTestName(item.test)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {TEST_CONFIG[item.test]?.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-[10px] px-2 py-1 rounded-sm uppercase tracking-widest font-bold border ${item.tier.color}`}
                    >
                      {item.tier.name}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatScore(item.test, item.score)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* НЕДАВНЯЯ ИСТОРИЯ (Компактный вид) */}
        <div className="bg-surface border border-surface-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-white font-bold text-sm tracking-widest uppercase">
              <Calendar className="w-4 h-4" /> Последние игры
            </div>
            <span className="text-xs text-text-muted">
              Показано {Math.min(5, history.length)} из {history.length}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-surface-border rounded-xl text-text-muted">
              Вы еще не прошли ни одного теста.
              <br />
              <Link
                href="/tests"
                className="text-neon-green hover:underline mt-2 inline-block"
              >
                Перейти к тестам
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {history.slice(0, 5).map((item, index) => {
                const tier = calculateTier(item.test, item.score);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition border border-transparent hover:border-surface-border group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-widest font-bold border ${tier.color} w-16 text-center`}
                      >
                        {tier.name}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">
                          {translateTestName(item.test)}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {new Date(item.date).toLocaleString("ru-RU", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-sm">
                      {formatScore(item.test, item.score)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. ТАБЛИЦА "ВСЕ ИГРЫ" */}
      <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-border">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-neon-green" /> Сводка по всем тестам
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Лучшие локальные результаты для каждой доступной игры
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-xs text-text-muted uppercase tracking-wider">
                <th className="p-4 font-bold">Тест</th>
                <th className="p-4 font-bold">Категория</th>
                <th className="p-4 font-bold text-right">Счет</th>
                <th className="p-4 font-bold text-center">Ранг</th>
                <th className="p-4 font-bold text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-sm">
              {ALL_GAMES_LIST.map((testKey) => {
                const config = TEST_CONFIG[testKey];
                const bestScore = bestScores.get(testKey);
                const hasPlayed = bestScore !== undefined;
                const tier = hasPlayed
                  ? calculateTier(testKey, bestScore)
                  : null;

                // Генерируем ссылку (переводим "Reaction Time" в "/tests/reaction" и тд)
                const linkMap: Record<string, string> = {
                  "Reaction Time": "reaction",
                  "Aim Trainer": "aim",
                  "Sequence Memory": "sequence",
                  "Number Memory": "number-memory",
                  "Verbal Memory": "verbal-memory",
                  "Chimp Test": "chimp",
                  "Typing Speed": "typing",
                  "Visual Memory": "visual-memory",
                  "Visual Acuity": "visual-acuity",
                };
                const href = `/tests/${linkMap[testKey] || ""}`;

                return (
                  <tr key={testKey} className="hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="font-bold text-white">
                        {translateTestName(testKey)}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {config.unit}
                      </div>
                    </td>
                    <td className="p-4 text-text-muted">{config.category}</td>
                    <td className="p-4 text-right font-mono font-bold text-white">
                      {hasPlayed ? formatScore(testKey, bestScore) : "—"}
                    </td>
                    <td className="p-4 text-center">
                      {hasPlayed && tier ? (
                        <span
                          className={`inline-block text-[10px] px-2 py-1 rounded-sm uppercase tracking-widest font-bold border ${tier.color}`}
                        >
                          {tier.name}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={href}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded transition ${hasPlayed ? "border border-surface-border bg-background text-white hover:border-gray-500" : "bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green hover:text-black"}`}
                      >
                        {hasPlayed ? "СНОВА" : "ИГРАТЬ"}{" "}
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
