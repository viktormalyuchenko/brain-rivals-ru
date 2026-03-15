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
  ListChecks,
  Activity,
  BarChart3,
  AlertTriangle,
  Share2,
  Check,
  LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { saveScoreToDB } from "@/lib/saveScore";

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
  const [isCopied, setIsCopied] = useState(false);

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

        // СОХРАНЯЕМ (результат — текущий уровень)
        saveScoreToDB("Sequence Memory", level);
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

  // --- РЕНДЕР ---

  if (gameState === "intro") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/tests"
          className="flex items-center gap-2 text-text-muted hover:text-white transition w-fit mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к тестам
        </Link>

        {/* ШАПКА */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-16 h-16 rounded-full border border-surface-border bg-surface flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,255,136,0.1)]">
            <Grid className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Запоминание последовательностей
          </h1>
          <p className="text-text-muted text-lg max-w-xl mb-6">
            Запоминайте и повторяйте всё более сложные последовательности. Как
            долго вы сможете продержаться?
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
              Смотрите, как загораются плитки, а затем повторите этот узор. С
              каждым пройденным уровнем добавляется одна новая плитка.
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-xl">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-3 uppercase text-sm tracking-widest">
              <MousePointer className="w-4 h-4" /> Управление
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Клик мышью по плиткам.
              <br />
              <span className="text-xs opacity-70 mt-1 block">
                Или используйте цифры 1-9 на клавиатуре для быстрого ввода.
              </span>
            </p>
          </div>
        </div>

        {/* КНОПКА СТАРТА */}
        <div className="flex flex-col items-center justify-center mb-16 border-b border-surface-border pb-16">
          <button
            onClick={startCountdown} // <-- Здесь вызываем startCountdown
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
              <div className="font-bold text-white text-sm">Уровень</div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Среднее
              </div>
              <div className="font-bold text-white text-sm">8 уровень</div>
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
              <div className="font-bold text-white text-sm">1.8M</div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-4 uppercase text-sm tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Что проверяет этот тест?
            </h2>
            <div className="text-text-muted text-sm leading-relaxed space-y-4">
              <p>
                Этот тренажер (также известный как игра "Саймон говорит")
                измеряет вашу <strong>кратковременную визуальную память</strong>{" "}
                и способность к распознаванию пространственных паттернов.
              </p>
              <p>
                Запоминание последовательностей онлайн — отличный способ
                проверить объем своей рабочей памяти. Способность удерживать в
                уме визуальную информацию критически важна для навигации,
                обучения и решения многоступенчатых задач.
              </p>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-3 uppercase text-sm tracking-widest flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Как улучшить результат
            </h2>
            <ol className="text-text-muted text-sm space-y-3 list-decimal list-inside marker:text-neon-green marker:font-bold">
              <li>
                <strong>Визуализируйте узор:</strong> Не пытайтесь запомнить
                отдельные квадраты. Запоминайте "путь" или геометрическую
                фигуру, которую они рисуют (например: "зигзаг", "треугольник").
              </li>
              <li>
                <strong>Проговаривайте вслух:</strong> Присвойте каждой кнопке
                цифру (от 1 до 9) и проговаривайте последовательность про себя.
              </li>
              <li>
                <strong>Группировка:</strong> Разбивайте длинные
                последовательности на короткие "чанки" по 3-4 шага.
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "gameover") {
    const getRankInfo = (val: number) => {
      if (val >= 15)
        return { name: "Элита", color: "bg-purple-500 text-white", next: null };
      if (val >= 10)
        return { name: "Алмаз", color: "bg-cyan-400 text-black", next: 15 };
      if (val >= 7)
        return { name: "Золото", color: "bg-yellow-500 text-black", next: 10 };
      if (val >= 4)
        return { name: "Серебро", color: "bg-gray-300 text-black", next: 7 };
      return { name: "Бронза", color: "bg-[#cd7f32] text-black", next: 4 };
    };

    const rank = getRankInfo(level);
    const percentile = Math.min(99, Math.floor((level / 20) * 100));

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center animate-in fade-in duration-500">
        <Trophy className="w-16 h-16 text-neon-green mb-4" />
        <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tight text-center">
          ТЕСТ ЗАВЕРШЕН!
        </h2>
        <p className="text-text-muted mb-8">Результаты: Sequence Memory</p>

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
            Пройдено шагов
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
                Пройдите еще{" "}
                <span className="text-white font-bold">
                  {rank.next - level} шагов
                </span>{" "}
                до ранга{" "}
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
            <Grid className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Ваш счет
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
            onClick={startCountdown}
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
        <div className="w-full bg-gradient-to-r from-purple-900/20 to-fuchsia-900/20 border border-white/5 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" /> Брось вызов другу
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Моя память не подвела меня до {level} уровня! А сколько запомнишь
            ты?
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `Я дошел до ${level} уровня в тесте на последовательность! Сможешь лучше? ${window.location.origin}`,
              );
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className={`text-white px-8 py-2 rounded text-sm font-bold transition flex items-center gap-2 mx-auto ${isCopied ? "bg-green-600" : "bg-purple-600 hover:bg-purple-500"}`}
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
