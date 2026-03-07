"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Grid,
  HelpCircle,
  RotateCcw,
  Trophy,
  Play,
  ArrowLeft,
  MousePointer,
  Keyboard,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type GameState =
  | "intro"
  | "countdown"
  | "watching"
  | "playing"
  | "success_wait"
  | "gameover";

export default function SequenceMemory() {
  const router = useRouter();

  // Состояния
  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [flashColor, setFlashColor] = useState<"white" | "red" | "green">(
    "white",
  );
  const [countdown, setCountdown] = useState(3); // Для таймера 3-2-1

  // Refs для доступа внутри таймеров/слушателей
  const stateRef = useRef(gameState);
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // --- ЛОГИКА ---

  const startCountdown = () => {
    setGameState("countdown");
    setCountdown(3);

    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        startNewGame();
      }
    }, 1000);
  };

  const startNewGame = () => {
    setLevel(1);
    const firstStep = Math.floor(Math.random() * 9) + 1;
    const newSeq = [firstStep];
    setSequence(newSeq);
    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    setGameState("watching");
    setUserStep(0);

    // Пауза перед показом
    await new Promise((r) => setTimeout(r, 800));

    for (let i = 0; i < seq.length; i++) {
      // Если игрок вышел во время показа, прерываем
      if (stateRef.current !== "watching") return;

      setActiveTile(seq[i]);
      setFlashColor("white");
      await new Promise((r) => setTimeout(r, 600));
      setActiveTile(null);
      await new Promise((r) => setTimeout(r, 200));
    }

    if (stateRef.current === "watching") {
      setGameState("playing");
    }
  };

  const handleTileClick = (tileNumber: number) => {
    if (gameState !== "playing") return;

    // Визуал нажатия
    setActiveTile(tileNumber);
    setFlashColor("white");
    setTimeout(() => setActiveTile(null), 200);

    // Проверка
    if (tileNumber === sequence[userStep]) {
      // ПРАВИЛЬНО
      if (userStep === sequence.length - 1) {
        // УРОВЕНЬ ПРОЙДЕН
        setGameState("success_wait"); // Показываем "ВЕРНО!"

        setTimeout(() => {
          const nextLevel = level + 1;
          setLevel(nextLevel);

          // Добавляем шаг
          const nextStep = Math.floor(Math.random() * 9) + 1;
          const newSeq = [...sequence, nextStep];
          setSequence(newSeq);

          playSequence(newSeq);
        }, 1200); // Пауза 1.2 сек перед следующим уровнем
      } else {
        setUserStep(userStep + 1);
      }
    } else {
      // ОШИБКА
      setFlashColor("red");
      setActiveTile(tileNumber);
      setTimeout(() => {
        setGameState("gameover");
        setActiveTile(null);
      }, 500);
    }
  };

  // Клавиатура 1-9
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current !== "playing") return;
      const key = parseInt(e.key);
      if (key >= 1 && key <= 9) {
        handleTileClick(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sequence, userStep]); // Зависимости обновляют замыкание

  const saveResult = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const playerName = session.user.user_metadata?.full_name || "Аноним";
        const userCountry = session.user.user_metadata?.country || "RU";
        await supabase.from("scores").insert([
          {
            user_id: session.user.id,
            test_name: "Sequence Memory",
            score: level,
            player_name: playerName,
            country: userCountry,
          },
        ]);
      } else {
        const newRecord = {
          test: "Sequence Memory",
          score: level,
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
            <Grid className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Sequence Memory
          </h1>
          <p className="text-text-muted text-lg max-w-xl">
            Запоминайте порядок загорающихся плиток. С каждым раундом
            последовательность становится длиннее.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={startCountdown}
            className="bg-neon-green text-black px-12 py-4 rounded-sm font-extrabold text-lg flex items-center gap-2 hover:bg-white transition duration-300"
          >
            <Play className="w-5 h-5" fill="currentColor" /> НАЧАТЬ ТЕСТ
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "gameover") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        <Trophy className="w-16 h-16 text-neon-green mb-6" />
        <h2 className="text-3xl font-extrabold mb-2 uppercase tracking-tight">
          Игра окончена
        </h2>
        <div className="w-full bg-surface border border-white/10 rounded-xl p-8 text-center mb-6 mt-8">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-2">
            Ваш уровень
          </div>
          <div className="text-7xl font-extrabold text-white">{level}</div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 w-full mt-4">
          <button
            onClick={startCountdown}
            className="flex-1 md:flex-none bg-surface border border-surface-border px-6 py-3 font-bold rounded-sm hover:border-text-muted transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> ЕЩЁ РАЗ
          </button>
          <button
            onClick={saveResult}
            className="flex-1 md:flex-none bg-neon-green text-black px-6 py-3 font-bold rounded-sm hover:bg-white transition flex items-center justify-center gap-2"
          >
            СОХРАНИТЬ
          </button>
        </div>
      </div>
    );
  }

  // ПОЛНОЭКРАННЫЙ РЕЖИМ
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#240b36] to-[#1a1a2e] select-none touch-none">
      {/* Шапка уровня */}
      <div className="absolute top-12 bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full text-white font-bold text-lg border border-white/10 shadow-xl">
        Уровень {level}
      </div>

      {/* Текстовые подсказки */}
      <div className="text-center mb-10 h-16 flex flex-col justify-end relative z-10">
        {gameState === "countdown" && (
          <h2 className="text-6xl md:text-8xl font-extrabold text-white animate-ping">
            {countdown}
          </h2>
        )}
        {gameState === "watching" && (
          <h2 className="text-3xl md:text-4xl font-extrabold text-white animate-pulse">
            ЗАПОМИНАЙ...
          </h2>
        )}
        {gameState === "playing" && (
          <>
            <h2 className="text-4xl md:text-5xl font-extrabold text-neon-green drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
              ТВОЯ ОЧЕРЕДЬ!
            </h2>
            <p className="text-white/60 mt-2 text-sm">
              Повтори последовательность
            </p>
          </>
        )}
        {gameState === "success_wait" && (
          <h2 className="text-4xl md:text-5xl font-extrabold text-white flex items-center justify-center gap-3">
            <CheckCircle className="w-10 h-10 text-neon-green" /> ВЕРНО!
          </h2>
        )}
      </div>

      {/* СЕТКА */}
      <div
        className={`grid grid-cols-3 gap-3 md:gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl transition-opacity duration-300 ${gameState === "countdown" ? "opacity-30" : "opacity-100"}`}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isActive = activeTile === num;
          let tileColor = "bg-white/10 border-white/10 hover:bg-white/20";

          if (isActive) {
            if (flashColor === "white")
              tileColor =
                "bg-white border-white shadow-[0_0_30px_white] scale-95";
            if (flashColor === "red")
              tileColor =
                "bg-red-500 border-red-500 shadow-[0_0_30px_red] scale-95";
          }

          return (
            <button
              key={num}
              onClick={() => handleTileClick(num)}
              className={`
                w-20 h-20 md:w-28 md:h-28 rounded-lg border-2 text-2xl font-bold transition-all duration-100 flex items-center justify-center
                ${tileColor}
                ${gameState === "playing" ? "cursor-pointer active:scale-95" : "cursor-default"}
              `}
            >
              <span
                className={`opacity-30 ${isActive ? "opacity-100 text-black" : "text-white"}`}
              >
                {num}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setGameState("intro")}
        className="absolute top-8 left-8 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition border border-white/10"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
    </div>
  );
}
