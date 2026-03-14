"use client";

import { useState, useEffect, useRef } from "react";
import {
  Target,
  HelpCircle,
  RotateCcw,
  Trophy,
  Play,
  ArrowLeft,
  MousePointer,
  Crosshair,
  Share2,
  Save,
  BarChart3,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { saveScoreToDB } from "@/lib/saveScore";

type GameState = "intro" | "playing" | "gameover";

const TOTAL_TARGETS = 30;
const AVERAGE_TPS = 3.2; // Средний показатель для сравнения

export default function AimTrainer() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("intro");
  const [targetsLeft, setTargetsLeft] = useState(TOTAL_TARGETS);
  const [position, setPosition] = useState({ top: "50%", left: "50%" });
  const [startTime, setStartTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // --- ЛОГИКА ---

  const startGame = () => {
    setGameState("playing");
    setTargetsLeft(TOTAL_TARGETS);
    moveTarget();
    setStartTime(0);
  };

  const moveTarget = () => {
    const top = Math.random() * 80 + 10;
    const left = Math.random() * 80 + 10;
    setPosition({ top: `${top}%`, left: `${left}%` });
  };

  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetsLeft === TOTAL_TARGETS) {
      setStartTime(performance.now());
    }

    const remaining = targetsLeft - 1;
    setTargetsLeft(remaining);

    if (remaining === 0) {
      const endTime = performance.now();
      const finalTime = endTime - startTime; // Считаем тут

      setTotalTime(finalTime);
      setGameState("gameover");

      // СОХРАНЯЕМ
      saveScoreToDB("Aim Trainer", Math.round(finalTime));
    } else {
      moveTarget();
    }
  };

  // --- РАСЧЕТ СТАТИСТИКИ И РАНГОВ ---

  const ms = Math.round(totalTime);
  const tpsRaw = totalTime > 0 ? TOTAL_TARGETS / (totalTime / 1000) : 0;
  const tps = parseFloat(tpsRaw.toFixed(2));

  // Определение ранга
  const getRankInfo = (val: number) => {
    if (val >= 6.0)
      return { name: "Элита", color: "bg-purple-500 text-white", next: null };
    if (val >= 5.0)
      return { name: "Алмаз", color: "bg-cyan-400 text-black", next: 6.0 };
    if (val >= 4.0)
      return { name: "Платина", color: "bg-teal-400 text-black", next: 5.0 };
    if (val >= 3.0)
      return { name: "Золото", color: "bg-yellow-500 text-black", next: 4.0 };
    if (val >= 2.0)
      return { name: "Серебро", color: "bg-gray-300 text-black", next: 3.0 };
    return { name: "Бронза", color: "bg-[#cd7f32] text-black", next: 2.0 };
  };

  const rank = getRankInfo(tps);

  // Расчет процентиля (фейковый для красоты, но логичный)
  const percentile = Math.min(99, Math.floor((tps / 7) * 100));

  // --- ЭКРАН ИНТРО ---
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
            <Target className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Aim Trainer
          </h1>
          <p className="text-text-muted text-lg max-w-xl">
            Поразите 30 мишеней как можно быстрее. Тест на точность и скорость
            реакции.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <HelpCircle className="w-4 h-4" /> Как это работает
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              На экране будут появляться мишени в случайных местах. Кликайте по
              ним максимально быстро. Ваша задача — уничтожить {TOTAL_TARGETS}{" "}
              штук за минимальное время.
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <Crosshair className="w-4 h-4" /> Советы
            </div>
            <ul className="text-text-muted text-sm space-y-2 list-disc list-inside">
              <li>Не напрягайте руку, движения должны быть плавными.</li>
              <li>Старайтесь не промахиваться.</li>
              <li>Настройте чувствительность мыши заранее.</li>
            </ul>
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

  // --- ЭКРАН GAME OVER (НОВЫЙ ДИЗАЙН) ---
  if (gameState === "gameover") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        <Trophy className="w-16 h-16 text-neon-green mb-4" />
        <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tight text-center">
          ТЕСТ ЗАВЕРШЕН!
        </h2>
        <p className="text-text-muted mb-8">Результаты Aim Trainer</p>

        {/* Главная карточка результата */}
        <div className="w-full bg-surface border border-neon-green/30 rounded-xl p-8 text-center mb-6 relative overflow-hidden">
          {/* Плашка ранга */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold px-4 py-1.5 rounded-b-md uppercase tracking-widest ${rank.color}`}
          >
            {rank.name}
          </div>

          <div className="text-7xl font-extrabold mt-6 mb-2 text-white">
            {tps}{" "}
            <span className="text-2xl font-medium text-text-muted">TPS</span>
          </div>
          <p className="text-text-muted text-sm uppercase tracking-widest">
            Мишеней в секунду
          </p>

          <div className="mt-6 inline-flex border border-surface-border bg-background px-4 py-2 rounded-full text-sm">
            <span className="text-text-muted">Топ</span>{" "}
            <span className="text-neon-green font-bold mx-1">
              {percentile}%
            </span>{" "}
            <span className="text-text-muted">в мире</span>
          </div>
        </div>

        {/* Блок "Почти у цели" (Если есть следующий ранг) */}
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
                  {(rank.next - tps).toFixed(2)} TPS
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

        {/* Сетка детальной статистики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <Target className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {ms}{" "}
              <span className="text-sm text-text-muted font-normal">ms</span>
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Время
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <BarChart3 className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {AVERAGE_TPS}{" "}
              <span className="text-sm text-text-muted font-normal">TPS</span>
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Среднее в мире
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <Crosshair className="w-5 h-5 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{TOTAL_TARGETS}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Попаданий
            </div>
          </div>
        </div>

        {/* Сравнение с другими */}
        <div className="w-full bg-surface border border-surface-border p-6 rounded-xl mb-8">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-4">
            Сравнение
          </div>
          <div className="flex items-center justify-between text-sm mb-2 font-bold">
            <span className="text-neon-green">{tps} TPS</span>
            <span className="text-text-muted text-xs font-normal">VS</span>
            <span className="text-white">{AVERAGE_TPS} TPS (AVG)</span>
          </div>
          {/* Прогресс бар сравнения */}
          <div className="h-2 bg-background rounded-full overflow-hidden flex">
            <div
              style={{ width: `${(tps / (tps + AVERAGE_TPS)) * 100}%` }}
              className="bg-neon-green h-full"
            ></div>
            <div className="bg-surface-border h-full flex-grow"></div>
          </div>
        </div>

        {/* Кнопки действий */}
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

        {/* Челлендж (Фейк, просто копирует ссылку) */}
        <div className="w-full bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/5 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" /> Брось вызов другу
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Думаешь, ты быстрый? Отправь свой результат другу и посмотри, сможет
            ли он тебя обойти!
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                "Я набил " +
                  tps +
                  " TPS в Aim Trainer! Попробуй обогнать меня на " +
                  window.location.origin,
              );
              alert("Ссылка скопирована!");
            }}
            className="bg-purple-600 text-white px-8 py-2 rounded text-sm font-bold hover:bg-purple-500 transition flex items-center gap-2 mx-auto"
          >
            <LinkIcon className="w-4 h-4" /> СКОПИРОВАТЬ ССЫЛКУ
          </button>
        </div>
      </div>
    );
  }

  // ... (Остальной код игры остался без изменений)
  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] cursor-crosshair select-none overflow-hidden">
      {/* Счетчик сверху */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-surface/80 backdrop-blur-sm border border-surface-border px-8 py-3 rounded-full shadow-xl z-10">
        <div className="text-2xl font-mono font-bold text-white tracking-widest">
          <span className="text-neon-green">{TOTAL_TARGETS - targetsLeft}</span>{" "}
          / {TOTAL_TARGETS}
        </div>
      </div>

      <button
        onClick={() => setGameState("intro")}
        className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition border border-white/10 z-20 cursor-pointer"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Мишень */}
      <div
        className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 group"
        style={{ top: position.top, left: position.left }}
        onMouseDown={handleTargetClick}
      >
        <div className="absolute inset-0 border-2 border-white/20 rounded-full group-hover:border-neon-green/50 transition-colors"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#ff4d4d] rounded-full shadow-[0_0_20px_rgba(255,77,77,0.4)] group-active:scale-90 transition-transform"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full bg-white/10 pointer-events-none"></div>
      </div>
    </div>
  );
}
