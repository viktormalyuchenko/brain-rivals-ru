"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  ListChecks,
  Activity,
  Check,
  LinkIcon,
  Share2,
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
  const [isBlinking, setIsBlinking] = useState(false);

  const [isCopied, setIsCopied] = useState(false);

  // ИСПОЛЬЗУЕМ REF ДЛЯ БЛОКИРОВКИ (Это надежнее, чем стейт для быстрых кликов)
  const isProcessingRef = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]); // Храним все активные таймеры

  // Функция для очистки всех таймеров (предотвращает утечки и зависания)
  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    // Очищаем таймеры при размонтировании компонента
    return clearAllTimers;
  }, []);

  // --- ЛОГИКА ---

  const startGame = () => {
    clearAllTimers();
    isProcessingRef.current = false;
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
      // ЖЕЛЕЗОБЕТОННАЯ БЛОКИРОВКА: Если игра не идет ИЛИ сейчас обрабатывается клик - игнорируем
      if (gameState !== "playing" || isProcessingRef.current) return;

      isProcessingRef.current = true; // Блокируем новые клики

      if (answer === currentDirection) {
        setFeedback("correct");

        const timer1 = setTimeout(() => {
          const newCorrect = correctInRow + 1;
          if (newCorrect >= 3) {
            setLevel((l) => l + 1);
            setCorrectInRow(0);
          } else {
            setCorrectInRow(newCorrect);
          }

          setFeedback(null);
          setIsBlinking(true);

          const timer2 = setTimeout(() => {
            generateNextRound();
            setIsBlinking(false);
            isProcessingRef.current = false; // Разблокируем клики ТОЛЬКО здесь
          }, 50);
          timersRef.current.push(timer2);
        }, 150);
        timersRef.current.push(timer1);
      } else {
        setFeedback("wrong");

        const timer1 = setTimeout(() => {
          const newStrikes = strikes + 1;
          if (newStrikes >= 3) {
            setGameState("gameover");
            saveScoreToDB("Visual Acuity", level);
            isProcessingRef.current = false; // Разблокируем (хоть игра и окончена)
          } else {
            setStrikes(newStrikes);
            setCorrectInRow(0);
            setFeedback(null);

            setIsBlinking(true);
            const timer2 = setTimeout(() => {
              generateNextRound();
              setIsBlinking(false);
              isProcessingRef.current = false; // Разблокируем клики
            }, 50);
            timersRef.current.push(timer2);
          }
        }, 250);
        timersRef.current.push(timer1);
      }
    },
    [
      gameState,
      currentDirection,
      correctInRow,
      strikes,
      level,
      generateNextRound,
    ],
  );

  // Скролл
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
        {/* ИНТРО ТАКОЕ ЖЕ */}
        <Link
          href="/tests"
          className="flex items-center gap-2 text-text-muted hover:text-white transition w-fit mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к тестам
        </Link>

        {/* ШАПКА */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-16 h-16 rounded-full border border-surface-border bg-surface flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,255,136,0.1)]">
            <Eye className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Острота зрения
          </h1>
          <p className="text-text-muted text-lg max-w-xl mb-6">
            Определите направление разрыва в кольце. С каждым уровнем фигура
            становится всё меньше.
          </p>
          <div className="flex gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
            <span>
              Сложность: <span className="text-white">Средняя</span>
            </span>
            <span>•</span>
            <span>
              Среднее: <span className="text-white">Уровень 8</span>
            </span>
          </div>
        </div>

        {/* КАРТОЧКИ УПРАВЛЕНИЯ */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-surface border border-surface-border p-6 rounded-xl">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-3 uppercase text-sm tracking-widest">
              <HelpCircle className="w-4 h-4" /> Как это работает
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              На экране появится круг с небольшим разрывом (Кольцо Ландольта).
              Вам нужно указать, в какую сторону направлен разрыв: вверх, вниз,
              влево или вправо.
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-xl">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-3 uppercase text-sm tracking-widest">
              <Keyboard className="w-4 h-4" /> Управление
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Используйте стрелки на клавиатуре (↑ ↓ ← →) или нажимайте на
              кнопки направления на экране.
              <br />
              <span className="text-xs opacity-70 mt-1 block">
                3 правильных ответа = следующий уровень.
              </span>
            </p>
          </div>
        </div>

        {/* КНОПКА СТАРТА */}
        <div className="flex flex-col items-center justify-center mb-16 border-b border-surface-border pb-16">
          <button
            onClick={startGame}
            className="bg-neon-green text-black px-16 py-5 rounded-sm font-extrabold text-xl flex items-center gap-2 hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)] mb-4"
          >
            <Play className="w-6 h-6" fill="currentColor" /> НАЧАТЬ ТЕСТ
          </button>
        </div>

        {/* НИЖНИЙ SEO БЛОК */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Метрика
              </div>
              <div className="font-bold text-white text-sm">
                Уровень (Размер)
              </div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Среднее
              </div>
              <div className="font-bold text-white text-sm">Уровень 8</div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Сложность
              </div>
              <div className="font-bold text-white text-sm">Средняя</div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Сыграно
              </div>
              <div className="font-bold text-white text-sm">580K</div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-4 uppercase text-sm tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Что такое Кольца Ландольта?
            </h2>
            <div className="text-text-muted text-sm leading-relaxed space-y-4">
              <p>
                Оптометрическая таблица с кольцами Ландольта (разработанная
                швейцарским офтальмологом Эдмундом Ландольтом) — это
                международный стандарт для проверки{" "}
                <strong>остроты зрения</strong>.
              </p>
              <p>
                В отличие от привычной таблицы Сивцева с буквами "Ш Б", кольца
                исключают фактор узнавания (когда пациент угадывает букву по её
                общим очертаниям). Здесь проверяется чистая разрешающая
                способность глаза — способность различить две точки, находящиеся
                на минимальном расстоянии друг от друга (ширину разрыва).
              </p>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-3 uppercase text-sm tracking-widest flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Как пройти тест правильно
            </h2>
            <ol className="text-text-muted text-sm space-y-3 list-decimal list-inside marker:text-neon-green marker:font-bold">
              <li>
                <strong>Сядьте комфортно:</strong> Результат зависит от
                расстояния до монитора. Для честного теста находитесь на
                расстоянии вытянутой руки от экрана.
              </li>
              <li>
                <strong>Освещение:</strong> Убедитесь, что на экране нет бликов
                от солнца или ламп. Избегайте полной темноты в комнате.
              </li>
              <li>
                <strong>Очки:</strong> Если вы носите очки или контактные линзы
                для дали или работы за компьютером, проходите тест в них.
              </li>
              <li>
                <strong>Моргайте:</strong> Регулярно моргайте, чтобы увлажнять
                роговицу — сухость глаз сильно снижает остроту зрения.
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "gameover") {
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

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        <Trophy className="w-16 h-16 text-neon-green mb-4" />
        <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tight text-center">
          ТЕСТ ЗАВЕРШЕН!
        </h2>
        <p className="text-text-muted mb-8">Результаты: Острота зрения</p>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <Eye className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Результат
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <BarChart3 className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
            <div className="text-2xl font-bold">8</div>
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
          <Link
            href="/tests"
            className="flex-1 min-w-[160px] border border-surface-border bg-surface px-6 py-3 font-bold rounded-sm hover:border-text-muted transition flex items-center justify-center gap-2 text-text-muted"
          >
            ДРУГИЕ ТЕСТЫ
          </Link>
        </div>

        {/* ШАРИНГ */}
        <div className="w-full bg-gradient-to-r from-teal-900/20 to-emerald-900/20 border border-white/5 rounded-xl p-6 text-center mt-8">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5 text-teal-400" /> Проверь друзей
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Моё зрение как у орла! Я прошел до {level} уровня. Сможешь
            разглядеть разрыв?
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `У меня ${level} уровень в тесте на остроту зрения! Проверь свои глаза на ${window.location.origin}`,
              );
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className={`text-white px-8 py-2 rounded text-sm font-bold transition flex items-center gap-2 mx-auto ${isCopied ? "bg-green-600" : "bg-teal-600 hover:bg-teal-500"}`}
          >
            {isCopied ? (
              <Check className="w-4 h-4" />
            ) : (
              <LinkIcon className="w-4 h-4" />
            )}
            {isCopied ? "СКОПИРОВАНО!" : "СКОПИРОВАТЬ ССЫЛКУ"}
          </button>
        </div>
      </div>
    );
  }

  // --- ИГРОВОЙ ПРОЦЕСС ---

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
        onClick={() => {
          clearAllTimers();
          setGameState("intro");
        }}
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

      <div
        className={`bg-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl relative overflow-hidden ${feedback === "correct" ? "bg-green-100 scale-105" : feedback === "wrong" ? "bg-red-100 shake" : ""}`}
        style={{ width: "280px", height: "280px" }}
      >
        <div
          className="relative"
          style={{
            width: `${sizePx}px`,
            height: `${sizePx}px`,
            transform: `rotate(${rotations[currentDirection]})`,
            opacity: isBlinking ? 0 : 1,
          }}
        >
          <div className="absolute inset-0 bg-black rounded-full"></div>
          <div
            className="absolute bg-white rounded-full"
            style={{ width: "60%", height: "60%", top: "20%", left: "20%" }}
          ></div>
          {/* ИСПРАВЛЕНИЕ АРТЕФАКТОВ: Сделали вырез чуть шире (22%) и сильно длиннее (30%), вынесли выше центра (-5%) */}
          <div
            className="absolute bg-white"
            style={{ width: "22%", height: "30%", top: "-5%", left: "39%" }}
          ></div>
        </div>

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
