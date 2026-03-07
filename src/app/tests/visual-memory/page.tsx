"use client";

import { useState, useEffect } from "react";
import {
  Grid,
  HelpCircle,
  RotateCcw,
  Trophy,
  Play,
  ArrowLeft,
  MousePointer,
  Save,
  Heart,
  AlertTriangle,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

type GameState = "intro" | "showing" | "playing" | "gameover";

export default function VisualMemory() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [gridSize, setGridSize] = useState(3); // Размер сетки (3x3, 4x4...)

  // Логика плиток
  const [pattern, setPattern] = useState<number[]>([]); // Какие плитки горят (их ID)
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]); // Что выбрал юзер
  const [wrongTiles, setWrongTiles] = useState<number[]>([]); // Ошибочные клики

  // --- ЛОГИКА ---

  const startGame = () => {
    setLives(3);
    setLevel(1);
    setGridSize(3);
    startLevel(1, 3);
  };

  const startLevel = (lvl: number, size: number) => {
    setGameState("showing");
    setSelectedTiles([]);
    setWrongTiles([]);

    // Расчет количества плиток для запоминания
    // Формула: начинаем с 3, каждые пару уровней +1
    const tilesCount = 2 + lvl;

    // Генерируем уникальные позиции
    const totalCells = size * size;
    const newPattern = new Set<number>();
    while (newPattern.size < tilesCount) {
      newPattern.add(Math.floor(Math.random() * totalCells));
    }
    setPattern(Array.from(newPattern));

    // Показываем паттерн 1.5 секунды, потом даем играть
    setTimeout(() => {
      setGameState("playing");
    }, 1500);
  };

  const handleTileClick = (index: number) => {
    if (gameState !== "playing") return;

    // Если уже нажимали сюда - игнор
    if (selectedTiles.includes(index) || wrongTiles.includes(index)) return;

    if (pattern.includes(index)) {
      // ПРАВИЛЬНО
      const newSelected = [...selectedTiles, index];
      setSelectedTiles(newSelected);

      // Если нашли все плитки
      if (newSelected.length === pattern.length) {
        // Уровень пройден
        setTimeout(() => {
          const nextLvl = level + 1;
          setLevel(nextLvl);

          // Увеличиваем сетку, если плиток становится слишком много для текущей
          // (Если заполняем больше 40% поля)
          const tilesNext = 2 + nextLvl;
          let nextSize = gridSize;
          if (tilesNext > (gridSize * gridSize) / 2.5) {
            nextSize = gridSize + 1;
            setGridSize(nextSize);
          }

          startLevel(nextLvl, nextSize);
        }, 500);
      }
    } else {
      // ОШИБКА
      setWrongTiles([...wrongTiles, index]);

      if (lives > 1) {
        setLives((l) => l - 1);
      } else {
        setLives(0);
        // Показываем правильные ответы перед Game Over
        setGameState("intro"); // Хак чтобы перерисовать, но сразу gameover
        setTimeout(() => setGameState("gameover"), 500);
      }
    }
  };

  const saveResult = async () => {
    try {
      const score = level; // Результат - уровень
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const playerName = session.user.user_metadata?.full_name || "Аноним";
        const userCountry = session.user.user_metadata?.country || "RU";
        await supabase.from("scores").insert([
          {
            user_id: session.user.id,
            test_name: "Visual Memory",
            score: score,
            player_name: playerName,
            country: userCountry,
          },
        ]);
      } else {
        const newRecord = {
          test: "Visual Memory",
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
    if (val >= 20)
      return { name: "Элита", color: "bg-purple-500 text-white", next: null };
    if (val >= 15)
      return { name: "Алмаз", color: "bg-cyan-400 text-black", next: 20 };
    if (val >= 10)
      return { name: "Золото", color: "bg-yellow-500 text-black", next: 15 };
    if (val >= 5)
      return { name: "Серебро", color: "bg-gray-300 text-black", next: 10 };
    return { name: "Бронза", color: "bg-[#cd7f32] text-black", next: 5 };
  };

  const rank = getRankInfo(level);
  const percentile = Math.min(99, Math.floor((level / 20) * 100));

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
            <Grid className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Visual Memory
          </h1>
          <p className="text-text-muted text-lg max-w-xl">
            Запоминайте расположение подсвеченных квадратов. Сетка будет
            увеличиваться с каждым уровнем.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <HelpCircle className="w-4 h-4" /> Как это работает
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Несколько квадратов загорятся белым. Запомните их. Когда они
              погаснут, нажмите на них.
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <MousePointer className="w-4 h-4" /> Правила
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Каждая ошибка отнимает 1 жизнь. У вас всего 3 жизни. Постарайтесь
              пройти как можно дальше.
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
    // В этой игре Score обычно считается как Level
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
            {level}{" "}
            <span className="text-2xl font-medium text-text-muted">ур.</span>
          </div>
          <p className="text-text-muted text-sm uppercase tracking-widest">
            Достигнутый уровень
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
                  {rank.next - level}
                </span>{" "}
                уровней до ранга{" "}
                <span className="font-bold text-white uppercase">
                  {getRankInfo(rank.next).name}
                </span>
                !
              </div>
            </div>
          </div>
        )}

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] select-none">
      {/* Шапка */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/40 px-6 py-3 rounded-full border border-white/10 z-20">
        <div className="text-white font-mono font-bold">
          Level <span className="text-neon-green text-xl">{level}</span>
        </div>
        <div className="w-px h-6 bg-white/20"></div>
        <div className="flex gap-1">
          {[1, 2, 3].map((h) => (
            <Heart
              key={h}
              className={`w-5 h-5 ${h <= lives ? "text-red-500 fill-red-500" : "text-gray-600"}`}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => setGameState("intro")}
        className="absolute top-8 left-8 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition border border-white/10 z-20"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* СЕТКА */}
      <div className="relative">
        <div
          className="grid gap-2 bg-black/20 p-2 rounded-xl"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: "min(90vw, 500px)",
            height: "min(90vw, 500px)",
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            let bgColor = "bg-white/10 hover:bg-white/20"; // Обычная плитка

            // Если показываем паттерн
            if (gameState === "showing" && pattern.includes(index)) {
              bgColor = "bg-white shadow-[0_0_20px_white] scale-95";
            }

            // Если играем
            if (gameState === "playing") {
              if (selectedTiles.includes(index)) {
                bgColor =
                  "bg-neon-green shadow-[0_0_20px_rgba(0,255,136,0.6)] scale-95";
              }
              if (wrongTiles.includes(index)) {
                bgColor = "bg-[#1f2335] border-2 border-red-900"; // Ошибка - "провалилась"
              }
            }

            return (
              <div
                key={index}
                onClick={() => handleTileClick(index)}
                className={`
                  rounded-md cursor-pointer transition-all duration-200
                  ${bgColor}
                `}
              ></div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-white/50 text-sm font-medium">
        {gameState === "showing" ? "Запоминайте..." : "Повторите паттерн"}
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Визуальная память | Тест на запоминание образов",
  description:
    "Тренажер зрительной памяти. Запоминай расположение закрашенных клеток на сетке. С каждым уровнем сетка становится сложнее.",
  keywords: [
    "visual memory",
    "визуальная память",
    "зрительная память",
    "тренировка мозга",
    "grid memory",
  ],
  openGraph: {
    title: "Тренировка визуальной памяти",
    description:
      "Запоминай узоры и развивай мозг. До какого уровня дойдешь ты?",
  },
};
