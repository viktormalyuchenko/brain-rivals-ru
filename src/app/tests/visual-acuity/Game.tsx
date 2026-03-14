"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  HelpCircle,
  RotateCcw,
  Trophy,
  Play,
  ArrowLeft,
  Keyboard,
  Save,
  BarChart3,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowL,
  ArrowRight as ArrowR,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { saveScoreToDB } from "@/lib/saveScore";

type GameState = "intro" | "playing" | "gameover";
type Direction = "up" | "right" | "down" | "left";

const DIRECTIONS: Direction[] = ["up", "right", "down", "left"];
const AVERAGE_SCORE = 8;

export default function VisualAcuityGame() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1);
  const [strikes, setStrikes] = useState(0);
  const [correctInRow, setCorrectInRow] = useState(0);

  const [currentDirection, setCurrentDirection] = useState<Direction>("up");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  // НОВОЕ СОСТОЯНИЕ: управляет "морганием" черного экрана между попытками
  const [isBlinking, setIsBlinking] = useState(false);

  // --- ЛОГИКА ---

  const startGame = () => {
    setLevel(1);
    setStrikes(0);
    setCorrectInRow(0);
    setFeedback(null);
    setIsBlinking(false);
    generateNextRound();
    setGameState("playing");
  };

  const generateNextRound = useCallback(() => {
    const randomDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    setCurrentDirection(randomDir);
  }, []);

  const handleAnswer = useCallback(
    (answer: Direction) => {
      // Блокируем нажатия, если идет анимация фидбека или "моргание"
      if (gameState !== "playing" || feedback !== null || isBlinking) return;

      if (answer === currentDirection) {
        // ПРАВИЛЬНО
        setFeedback("correct");

        setTimeout(() => {
          const newCorrect = correctInRow + 1;
          if (newCorrect >= 3) {
            setLevel((l) => l + 1);
            setCorrectInRow(0);
          } else {
            setCorrectInRow(newCorrect);
          }

          setFeedback(null);

          // Запускаем МОРГАНИЕ перед показом нового кольца
          setIsBlinking(true);
          setTimeout(() => {
            generateNextRound();
            setIsBlinking(false); // Снимаем черную пелену, кольцо уже повернуто
          }, 50); // Черный экран держится 150мс
        }, 150); // Задержка зеленого свечения
      } else {
        setFeedback("wrong");
        setTimeout(() => {
          const newStrikes = strikes + 1;
          if (newStrikes >= 3) {
            setGameState("gameover");

            // СОХРАНЯЕМ
            saveScoreToDB("Visual Acuity", level);
          } else {
            // ...
          }
        }, 250);
      }
    },
    [
      gameState,
      feedback,
      isBlinking,
      currentDirection,
      correctInRow,
      strikes,
      generateNextRound,
    ],
  );

  // Блокировка скролла страницы при открытой игре
  useEffect(() => {
    if (gameState === "playing") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [gameState]);

  // Клавиатура
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleAnswer("up");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleAnswer("right");
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleAnswer("down");
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleAnswer("left");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAnswer]);

  const saveResult = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("scores").insert([
          {
            user_id: session.user.id,
            test_name: "Visual Acuity",
            score: level,
            player_name: session.user.user_metadata?.full_name || "Аноним",
            country: session.user.user_metadata?.country || "RU",
          },
        ]);
      } else {
        const newRecord = {
          test: "Visual Acuity",
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

  const getRankInfo = (val: number) => {
    if (val >= 12)
      return { name: "Элита", color: "bg-purple-500 text-white", next: null };
    if (val >= 10)
      return { name: "Алмаз", color: "bg-cyan-400 text-black", next: 12 };
    if (val >= 7)
      return { name: "Золото", color: "bg-yellow-500 text-black", next: 10 };
    if (val >= 4)
      return { name: "Серебро", color: "bg-gray-300 text-black", next: 7 };
    return { name: "Бронза", color: "bg-[#cd7f32] text-black", next: 4 };
  };

  const rank = getRankInfo(level);
  const percentile = Math.min(99, Math.floor((level / 14) * 100));

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
            <Eye className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Острота зрения
          </h1>
          <p className="text-text-muted text-lg max-w-xl">
            Определите направление разрыва в кольце. С каждым уровнем фигура
            становится всё меньше.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <HelpCircle className="w-4 h-4" /> Как это работает
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Это аналог таблицы окулиста. Чтобы пройти уровень, нужно дать 3
              правильных ответа. У вас есть право на 3 ошибки за всю игру.
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <Keyboard className="w-4 h-4" /> Управление
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Используйте стрелки на клавиатуре (↑ ↓ ← →) или нажимайте на
              кнопки на экране, чтобы указать, где находится разрыв в кольце.
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
            {level}{" "}
            <span className="text-2xl font-medium text-text-muted">ур.</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <Eye className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">{level}</div>
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
          {/* Главная кнопка - рестарт */}
          <button
            onClick={startGame}
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

  // --- ИГРОВОЙ ПРОЦЕСС ---

  // Расчет кольца: База 140px. Умножаем на 0.75 с каждым уровнем.
  const sizePx = Math.max(1, 140 * Math.pow(0.75, level - 1));

  const rotations = {
    up: "0deg",
    right: "90deg",
    down: "180deg",
    left: "-90deg",
  };

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0a0a0a] select-none overscroll-none touch-none">
      <button
        onClick={() => setGameState("intro")}
        className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-20"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="absolute top-6 flex flex-col items-center gap-2 z-20">
        <div className="bg-surface border border-surface-border px-6 py-2 rounded-full flex items-center gap-4 shadow-lg">
          <span className="text-white font-mono text-sm font-bold">
            Level <span className="text-neon-cyan text-lg ml-1">{level}</span>
          </span>
          <div className="w-px h-4 bg-white/20"></div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${step <= correctInRow ? "bg-neon-green shadow-[0_0_8px_#00ff88]" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((strike) => (
            <div
              key={strike}
              className={`text-xl font-bold transition-colors ${strike <= strikes ? "text-red-500 drop-shadow-[0_0_5px_red]" : "text-white/10"}`}
            >
              X
            </div>
          ))}
        </div>
      </div>

      {/* Белый квадрат-контейнер */}
      <div
        className={`bg-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl relative overflow-hidden ${feedback === "correct" ? "bg-green-100 scale-105" : feedback === "wrong" ? "bg-red-100 shake" : ""}`}
        style={{ width: "280px", height: "280px" }}
      >
        {/* Кольцо Ландольта */}
        <div
          className="relative"
          style={{
            width: `${sizePx}px`,
            height: `${sizePx}px`,
            transform: `rotate(${rotations[currentDirection]})`,
            // Если моргаем - делаем кольцо невидимым (оно все равно перекроется черным, но для надежности)
            opacity: isBlinking ? 0 : 1,
          }}
        >
          <div className="absolute inset-0 bg-black rounded-full"></div>
          <div
            className="absolute bg-white rounded-full"
            style={{ width: "60%", height: "60%", top: "20%", left: "20%" }}
          ></div>
          <div
            className="absolute bg-white"
            style={{ width: "20%", height: "22%", top: "-1%", left: "40%" }}
          ></div>
        </div>

        {/* Эффект моргания: Черная пелена перекрывает весь белый квадрат */}
        {isBlinking && (
          <div className="absolute inset-0 bg-[#0a0a0a] z-10"></div>
        )}
      </div>

      <div className="mt-12 text-white/50 text-sm mb-6 uppercase tracking-widest font-bold">
        Где разрыв?
      </div>

      {/* Джойстик */}
      <div className="grid grid-cols-3 gap-2 w-[200px]">
        <div />
        <button
          onClick={() => handleAnswer("up")}
          className="bg-surface border border-surface-border aspect-square rounded-xl flex items-center justify-center hover:bg-white/10 active:bg-white/20 active:scale-95 transition"
        >
          <ArrowUp className="w-8 h-8 text-white" />
        </button>
        <div />
        <button
          onClick={() => handleAnswer("left")}
          className="bg-surface border border-surface-border aspect-square rounded-xl flex items-center justify-center hover:bg-white/10 active:bg-white/20 active:scale-95 transition"
        >
          <ArrowL className="w-8 h-8 text-white" />
        </button>
        <div className="flex items-center justify-center text-[10px] text-text-muted uppercase text-center leading-tight">
          или
          <br />
          клавиши
        </div>
        <button
          onClick={() => handleAnswer("right")}
          className="bg-surface border border-surface-border aspect-square rounded-xl flex items-center justify-center hover:bg-white/10 active:bg-white/20 active:scale-95 transition"
        >
          <ArrowR className="w-8 h-8 text-white" />
        </button>
        <div />
        <button
          onClick={() => handleAnswer("down")}
          className="bg-surface border border-surface-border aspect-square rounded-xl flex items-center justify-center hover:bg-white/10 active:bg-white/20 active:scale-95 transition"
        >
          <ArrowDown className="w-8 h-8 text-white" />
        </button>
        <div />
      </div>
    </div>
  );
}
