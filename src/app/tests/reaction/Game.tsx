"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Zap,
  AlertTriangle,
  RotateCcw,
  Trophy,
  Activity,
  Info,
  ListChecks,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { saveScoreToDB } from "@/lib/saveScore";

type GameState =
  | "intro"
  | "waiting"
  | "ready"
  | "early"
  | "round_result"
  | "results";

const TOTAL_ROUNDS = 5;

export default function ReactionTest() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>("intro");
  const [round, setRound] = useState(1);
  const [times, setTimes] = useState<number[]>([]);
  const [currentRoundTime, setCurrentRoundTime] = useState<number | null>(null);

  // Refs для доступа к актуальному state внутри слушателя клавиатуры
  const stateRef = useRef(gameState);
  const roundRef = useRef(round);
  const timesRef = useRef(times);

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Синхронизация state и refs
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    roundRef.current = round;
  }, [round]);
  useEffect(() => {
    timesRef.current = times;
  }, [times]);

  // ОЧИСТКА ТАЙМЕРА ПРИ РАЗМОНТИРОВАНИИ (исправляет баг с кнопкой назад)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startRoundTimeout = useCallback(() => {
    const randomDelay = Math.floor(Math.random() * 3000) + 1500;
    timeoutRef.current = setTimeout(() => {
      setGameState("ready");
      startTimeRef.current = performance.now();
    }, randomDelay);
  }, []);

  // Единый обработчик (Клик / Пробел)
  const handleAction = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState === "waiting") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState("early");
      return;
    }

    if (currentState === "early") {
      setGameState("waiting");
      startRoundTimeout();
      return;
    }

    if (currentState === "ready") {
      const endTime = performance.now();
      const reactionTime = Math.round(endTime - startTimeRef.current);

      setCurrentRoundTime(reactionTime);
      const newTimes = [...timesRef.current, reactionTime];
      setTimes(newTimes);
      setGameState("round_result");

      // Показ результата 1.5 сек -> следующий раунд
      setTimeout(() => {
        if (roundRef.current < TOTAL_ROUNDS) {
          setRound((prev) => prev + 1);
          setGameState("waiting");
          startRoundTimeout();
        } else {
          setGameState("results");

          // СЧИТАЕМ И СОХРАНЯЕМ
          const finalAverage = Math.round(
            newTimes.reduce((a, b) => a + b, 0) / newTimes.length,
          );
          saveScoreToDB("Reaction Time", finalAverage);
        }
      }, 1500);
    }
  }, [startRoundTimeout]);

  // Слушатель клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (["waiting", "ready", "early"].includes(stateRef.current)) {
          handleAction();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAction]);

  const startGame = () => {
    setGameState("waiting");
    startRoundTimeout();
  };

  const resetGame = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current); // Обязательная очистка таймера при сбросе
    setGameState("intro");
    setRound(1);
    setTimes([]);
    setCurrentRoundTime(null);
  };

  const averageTime =
    times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;
  const bestTime = times.length > 0 ? Math.min(...times) : 0;

  // --- 1. ЭКРАН ИНТРО (До старта) ---
  if (gameState === "intro") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-text-muted hover:text-white transition w-fit mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Назад на главную
        </Link>

        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-16 h-16 rounded-full border border-surface-border bg-surface flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Reaction Time
          </h1>
          <p className="text-text-muted text-lg max-w-xl">
            Измерьте, как быстро вы реагируете на визуальные стимулы. Кликните
            по экрану, когда его цвет изменится.
          </p>
          <div className="flex gap-4 mt-6 text-sm text-text-muted font-medium">
            <span>
              Сложность: <span className="text-white">Легкая</span>
            </span>
            <span>•</span>
            <span>
              Средний балл: <span className="text-white">245ms</span>
            </span>
          </div>
        </div>

        {/* ВОССТАНОВЛЕННЫЕ КАРТОЧКИ ОПИСАНИЯ */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <Info className="w-4 h-4" /> Как это работает
            </div>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              Экран меняет цвет с красного на зеленый через случайный промежуток
              времени.
            </p>
            <div className="text-xs font-mono bg-background p-2 rounded border border-surface-border">
              Управление: Клик мышью или ПРОБЕЛ
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <ListChecks className="w-4 h-4" /> Советы
            </div>
            <ul className="text-text-muted text-sm space-y-2 list-disc list-inside">
              <li>Фокусируйте взгляд в центре экрана.</li>
              <li>Держите палец на готове на кнопке мыши или пробеле.</li>
              <li>Не пытайтесь угадать время, ждите реальной смены цвета.</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={startGame}
            className="bg-neon-green text-black px-12 py-4 rounded-sm font-extrabold text-lg flex items-center gap-2 hover:bg-white transition duration-300"
          >
            <Zap className="w-5 h-5" fill="currentColor" /> НАЧАТЬ ТЕСТ
          </button>
        </div>
      </div>
    );
  }

  // --- 2. ЭКРАН РЕЗУЛЬТАТОВ (Финал) ---
  if (gameState === "results") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        <Trophy className="w-16 h-16 text-neon-green mb-6" />
        <h2 className="text-3xl font-extrabold mb-2 uppercase tracking-tight">
          Тест завершен!
        </h2>
        <p className="text-text-muted mb-10">Результаты теста на реакцию</p>

        <div className="w-full bg-surface border border-neon-green/30 rounded-xl p-8 text-center mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#cd7f32] text-black text-[10px] font-bold px-3 py-1 rounded-b-md uppercase tracking-widest">
            Бронза
          </div>
          <div className="text-6xl md:text-7xl font-extrabold mt-4 mb-2">
            {averageTime}{" "}
            <span className="text-2xl font-medium text-text-muted">ms</span>
          </div>
          <p className="text-text-muted">Ваше среднее время реакции</p>
        </div>

        {/* Статистика: Лучшее время и Раунды */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <div className="bg-surface border border-surface-border p-6 rounded-xl flex flex-col items-center justify-center">
            <Zap className="text-neon-green w-5 h-5 mb-2" />
            <div className="text-2xl font-bold">
              {bestTime}
              <span className="text-sm text-text-muted font-normal">ms</span>
            </div>
            <div className="text-xs text-text-muted uppercase tracking-widest mt-1">
              Лучшее время
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-xl flex flex-col items-center justify-center">
            <Activity className="text-neon-cyan w-5 h-5 mb-2" />
            <div className="text-2xl font-bold">{TOTAL_ROUNDS}</div>
            <div className="text-xs text-text-muted uppercase tracking-widest mt-1">
              Раундов
            </div>
          </div>
        </div>

        {/* Список всех попыток */}
        <div className="w-full bg-surface border border-surface-border p-4 rounded-xl mb-8 flex flex-wrap justify-center gap-2">
          {times.map((t, i) => (
            <div
              key={i}
              className="bg-background border border-surface-border px-3 py-1 rounded text-sm text-text-muted"
            >
              #{i + 1}: <span className="text-white font-medium">{t}ms</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 w-full mb-8">
          {/* Главная кнопка - рестарт */}
          <button
            onClick={resetGame}
            className="flex-1 min-w-[160px] bg-neon-green text-black px-6 py-3 font-bold rounded-sm hover:bg-white transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> ЕЩЁ РАЗ
          </button>

          {/* Второстепенная - назад в каталог */}
          <Link
            href="/tests"
            className="flex-1 min-w-[160px] border border-surface-border bg-surface px-6 py-3 font-bold rounded-sm hover:border-text-muted transition flex items-center justify-center gap-2 text-text-muted"
          >
            ДРУГИЕ ТЕСТЫ
          </Link>
        </div>
      </div>
    );
  }

  // --- 3. ПОЛНОЭКРАННЫЙ ИГРОВОЙ ПРОЦЕСС ---
  let screenColor = "bg-surface";
  if (gameState === "waiting") screenColor = "bg-[#e11d48]";
  if (gameState === "ready") screenColor = "bg-[#22c55e]";
  if (gameState === "round_result") screenColor = "bg-[#2563eb]"; // Синий для результата

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden touch-none transition-colors duration-100 ${screenColor}`}
      onMouseDown={handleAction}
    >
      <div className="absolute top-8 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full text-white/80 text-sm font-medium tracking-wide">
        Раунд <span className="font-bold text-white">{round}</span> из{" "}
        {TOTAL_ROUNDS}
      </div>

      <div className="text-center text-white">
        {gameState === "waiting" && (
          <>
            <h2 className="text-5xl md:text-7xl font-extrabold mb-4 uppercase tracking-tighter">
              Жди зеленый...
            </h2>
            {/* ВОССТАНОВЛЕННАЯ ПОДСКАЗКА */}
            <p className="text-xl md:text-2xl opacity-80">
              Кликни мышью или нажми ПРОБЕЛ, когда будешь готов
            </p>
          </>
        )}
        {gameState === "ready" && (
          <>
            <h2 className="text-6xl md:text-8xl font-extrabold mb-4 uppercase tracking-tighter">
              КЛИКАЙ!
            </h2>
            <p className="text-xl md:text-2xl opacity-80">Как можно быстрее!</p>
          </>
        )}
        {gameState === "early" && (
          <>
            <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-yellow-400" />
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 uppercase tracking-tighter">
              Слишком рано!
            </h2>
            <p className="text-xl md:text-2xl opacity-80">
              Кликни, чтобы попробовать снова.
            </p>
          </>
        )}
        {gameState === "round_result" && (
          <>
            <div className="text-xl opacity-80 mb-2 font-medium tracking-widest uppercase">
              Результат
            </div>
            <h2 className="text-6xl md:text-8xl font-extrabold mb-4">
              {currentRoundTime}{" "}
              <span className="text-4xl opacity-50 font-medium">ms</span>
            </h2>
          </>
        )}
      </div>

      {/* ВОССТАНОВЛЕННАЯ ИСТОРИЯ ПРОШЛЫХ РАУНДОВ */}
      {times.length > 0 &&
        gameState !== "early" &&
        gameState !== "round_result" && (
          <div className="absolute bottom-12 flex flex-col items-center">
            <div className="text-xs text-white/50 uppercase tracking-widest mb-3">
              Предыдущие результаты
            </div>
            <div className="flex gap-2">
              {times.map((t, i) => (
                <div
                  key={i}
                  className="bg-black/20 px-3 py-1 rounded text-sm text-white/90 font-medium border border-white/10"
                >
                  {t}ms
                </div>
              ))}
            </div>
          </div>
        )}

      {/* ИСПРАВЛЕННАЯ КНОПКА НАЗАД (Очищает таймер) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          resetGame();
        }}
        className="absolute top-8 left-8 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition z-50 border border-white/10"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
    </div>
  );
}
