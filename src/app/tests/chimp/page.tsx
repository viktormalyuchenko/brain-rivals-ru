"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  HelpCircle,
  RotateCcw,
  Trophy,
  Play,
  ArrowLeft,
  MousePointer,
  Save,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type GameState = "intro" | "playing" | "gameover";

const AVERAGE_SCORE = 9; // Средний результат человека

export default function ChimpTest() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(4); // Начинаем с 4 цифр
  const [lives, setLives] = useState(3); // 3 права на ошибку (страйки)
  const [tiles, setTiles] = useState<
    { id: number; top: string; left: string }[]
  >([]);
  const [nextNumber, setNextNumber] = useState(1); // Какую цифру ждем следующей
  const [isHidden, setIsHidden] = useState(false); // Скрыты ли цифры
  const [maxLevelReached, setMaxLevelReached] = useState(4);

  // --- ЛОГИКА ---

  const startGame = () => {
    setLevel(4);
    setLives(3);
    setMaxLevelReached(4);
    startLevel(4);
    setGameState("playing");
  };

  const startLevel = (lvl: number) => {
    setNextNumber(1);
    setIsHidden(false);

    // Генерация позиций без наложений (сетка 8x5 условно, или просто рандом с проверкой)
    // Упрощенный вариант: делим экран на ячейки и берем случайные
    const positions = [];
    const rows = 6;
    const cols = 10;
    const used = new Set();

    for (let i = 1; i <= lvl; i++) {
      let r, c, key;
      do {
        r = Math.floor(Math.random() * rows);
        c = Math.floor(Math.random() * cols);
        key = `${r}-${c}`;
      } while (used.has(key));

      used.add(key);

      // Переводим ячейку в проценты с небольшим смещением
      const top = r * (100 / rows) + 5 + Math.random() * 5;
      const left = c * (100 / cols) + 2 + Math.random() * 5;

      positions.push({ id: i, top: `${top}%`, left: `${left}%` });
    }
    setTiles(positions);
  };

  const handleTileClick = (id: number) => {
    if (id === nextNumber) {
      // ПРАВИЛЬНО
      if (id === 1) {
        setIsHidden(true); // Скрываем цифры после первого клика
      }

      setNextNumber((prev) => prev + 1);

      // Уровень пройден?
      if (id === level) {
        setMaxLevelReached(Math.max(maxLevelReached, level));
        const nextLvl = level + 1;
        setLevel(nextLvl);
        setTimeout(() => startLevel(nextLvl), 500); // Пауза перед следующим
      }
    } else {
      // ОШИБКА
      if (lives > 1) {
        setLives((prev) => prev - 1);
        startLevel(level); // Перезапускаем тот же уровень
      } else {
        setLives(0);
        setGameState("gameover");
      }
    }
  };

  const saveResult = async () => {
    try {
      const score = maxLevelReached;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const playerName = session.user.user_metadata?.full_name || "Аноним";
        const userCountry = session.user.user_metadata?.country || "RU";
        await supabase.from("scores").insert([
          {
            user_id: session.user.id,
            test_name: "Chimp Test",
            score: score,
            player_name: playerName,
            country: userCountry,
          },
        ]);
      } else {
        const newRecord = {
          test: "Chimp Test",
          score: score,
          date: new Date().toISOString(),
        };
        const existingHistory = JSON.parse(
          localStorage.getItem("guest_history") || "[]",
        );
        localStorage.setItem(
          "guest_history",
          JSON.stringify([newRecord, ...existingHistory]),
        );
      }
      router.push("/profile");
    } catch (err) {
      console.error(err);
    }
  };

  // Ранги
  const getRankInfo = (val: number) => {
    if (val >= 18)
      return { name: "Элита", color: "bg-purple-500 text-white", next: null };
    if (val >= 14)
      return { name: "Алмаз", color: "bg-cyan-400 text-black", next: 18 };
    if (val >= 10)
      return { name: "Золото", color: "bg-yellow-500 text-black", next: 14 };
    if (val >= 7)
      return { name: "Серебро", color: "bg-gray-300 text-black", next: 10 };
    return { name: "Бронза", color: "bg-[#cd7f32] text-black", next: 7 };
  };

  const rank = getRankInfo(maxLevelReached);
  const percentile = Math.min(99, Math.floor((maxLevelReached / 20) * 100));

  // --- РЕНДЕР ---

  if (gameState === "intro") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/tests"
          className="flex items-center gap-2 text-text-muted hover:text-white transition w-fit mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к тестам
        </Link>
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-16 h-16 rounded-full border border-surface-border bg-surface flex items-center justify-center mb-6">
            <Brain className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Chimp Test
          </h1>
          <p className="text-text-muted text-lg max-w-xl">
            Сможете ли вы превзойти шимпанзе? Запомните расположение цифр, затем
            нажмите на них в порядке возрастания. Цифры исчезнут после первого
            клика.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <HelpCircle className="w-4 h-4" /> Как это работает
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Нажмите на цифру 1. Все остальные цифры скроются. Ваша задача —
              продолжить нажимать на скрытые квадраты по порядку (2, 3, 4...).
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <MousePointer className="w-4 h-4" /> Правила
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              У вас есть 3 "страйка" (права на ошибку). Если ошиблись — уровень
              перезапускается, но цифры не уменьшаются.
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={startGame}
            className="bg-neon-green text-black px-12 py-4 rounded-sm font-extrabold text-lg flex items-center gap-2 hover:bg-white transition duration-300"
          >
            <Play className="w-5 h-5" fill="currentColor" /> НАЧАТЬ ТЕСТ
          </button>
        </div>
      </div>
    );
  }

  // --- ЭКРАН GAME OVER ---
  if (gameState === "gameover") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        <Trophy className="w-16 h-16 text-neon-green mb-4" />
        <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tight text-center">
          ТЕСТ ЗАВЕРШЕН!
        </h2>

        <div className="w-full bg-surface border border-neon-green/30 rounded-xl p-8 text-center mb-6 relative overflow-hidden">
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold px-4 py-1.5 rounded-b-md uppercase tracking-widest ${rank.color}`}
          >
            {rank.name}
          </div>
          <div className="text-7xl font-extrabold mt-6 mb-2 text-white">
            {maxLevelReached}{" "}
            <span className="text-2xl font-medium text-text-muted">цифр</span>
          </div>
          <p className="text-text-muted text-sm uppercase tracking-widest">
            Максимальный результат
          </p>
          <div className="mt-6 inline-flex border border-surface-border bg-background px-4 py-2 rounded-full text-sm">
            <span className="text-text-muted">Топ</span>{" "}
            <span className="text-neon-green font-bold mx-1">
              {percentile}%
            </span>{" "}
            <span className="text-text-muted">в мире</span>
          </div>
        </div>

        {rank.next && (
          <div className="w-full bg-[#3a2a1a] border border-yellow-600/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="mt-1">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-yellow-500 font-bold text-sm uppercase mb-1">
                Так близко!
              </div>
              <div className="text-sm text-yellow-100/80">
                Всего{" "}
                <span className="text-white font-bold">
                  {rank.next - maxLevelReached}
                </span>{" "}
                цифр до ранга{" "}
                <span className="font-bold text-white uppercase">
                  {getRankInfo(rank.next).name}
                </span>
                !
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <Brain className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">{maxLevelReached}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Результат
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <BarChart3 className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
            <div className="text-2xl font-bold">{AVERAGE_SCORE}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Среднее в мире
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 w-full mb-8">
          <button
            onClick={startGame}
            className="flex-1 min-w-[160px] bg-neon-green text-black px-6 py-3 font-bold rounded-sm hover:bg-white transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> ЕЩЁ РАЗ
          </button>
          <button
            onClick={saveResult}
            className="flex-1 min-w-[160px] border border-surface-border bg-surface px-6 py-3 font-bold rounded-sm hover:border-text-muted transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> СОХРАНИТЬ
          </button>
        </div>
      </div>
    );
  }

  // --- ИГРОВОЙ ПРОЦЕСС ---
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#3b1d1d] to-[#0a0a0a] select-none">
      {/* Шапка: Уровень и Страйки */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/40 px-6 py-3 rounded-full border border-white/10 z-20">
        <div className="text-white font-mono font-bold">
          Level: <span className="text-orange-400 text-xl">{level}</span>
        </div>
        <div className="w-px h-6 bg-white/20"></div>
        <div className="text-white font-mono font-bold">
          Strikes: <span className="text-red-400 text-xl">{3 - lives}/3</span>
        </div>
      </div>

      <button
        onClick={() => setGameState("intro")}
        className="absolute top-8 left-8 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition border border-white/10 z-20"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* ИГРОВОЕ ПОЛЕ (Отнсительное позиционирование) */}
      <div className="absolute inset-0 w-full h-full max-w-5xl mx-auto pt-32 pb-10 px-10">
        <div className="relative w-full h-full">
          {tiles.map((tile) => {
            // Если мы уже нажали на эту плитку - не рендерим её
            if (tile.id < nextNumber) return null;

            // Должны ли мы скрывать цифру?
            // Скрываем, если (скрытие включено) И (это не первая цифра, которую всегда видно пока не нажмешь)
            const showContent = !isHidden || tile.id === 1; // Баг в логике. Исправляем:

            // Логика оригинала: как только нажал "1", ВСЕ цифры (кроме той что нажал, она исчезает) становятся белыми квадратами.
            // Значит showContent = !isHidden.
            // Но в моей реализации я просто скрываю цифры CSS-ом или классом.

            return (
              <div
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                className={`
                  absolute w-14 h-14 md:w-20 md:h-20 rounded-lg border-2 border-white/20 
                  flex items-center justify-center text-3xl md:text-4xl font-bold cursor-pointer transition-all duration-100
                  active:scale-95 hover:border-white/50
                  ${isHidden ? "bg-white border-white hover:bg-white/90" : "bg-white/10 text-white"}
                `}
                style={{ top: tile.top, left: tile.left }}
              >
                {!isHidden && tile.id}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
