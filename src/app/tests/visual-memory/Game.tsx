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
  ListChecks,
  Activity,
  BarChart3,
  Share2,
  LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { saveScoreToDB } from "@/lib/saveScore";

type GameState = "intro" | "showing" | "playing" | "gameover";

export default function VisualMemory() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [gridSize, setGridSize] = useState(3); // Размер сетки (3x3, 4x4...)
  const [isCopied, setIsCopied] = useState(false);

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
        saveScoreToDB("Visual Memory", level);
      }
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
            Визуальная память
          </h1>
          <p className="text-text-muted text-lg max-w-xl mb-6">
            Запоминайте расположение закрашенных квадратов. С каждым уровнем
            сетка увеличивается.
          </p>
          <div className="flex gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
            <span>
              Сложность: <span className="text-white">Средняя</span>
            </span>
            <span>•</span>
            <span>
              Среднее: <span className="text-white">Сетка 5x5</span>
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
              Несколько квадратов на короткое время загорятся белым светом.
              Запомните их расположение и кликните по ним после того, как они
              погаснут.
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-xl">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-3 uppercase text-sm tracking-widest">
              <MousePointer className="w-4 h-4" /> Управление
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Только клик мышью или нажатие на экран.
              <br />
              <span className="text-xs opacity-70 mt-1 block">
                У вас есть 3 жизни на всю игру.
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
              <div className="font-bold text-white text-sm">Уровень сетки</div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Среднее
              </div>
              <div className="font-bold text-white text-sm">Сетка 5x5</div>
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
              <div className="font-bold text-white text-sm">520K</div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-4 uppercase text-sm tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Что проверяет тест визуальной
              памяти?
            </h2>
            <div className="text-text-muted text-sm leading-relaxed space-y-4">
              <p>
                Тест измеряет вашу <strong>пространственную память</strong> и
                способность к распознаванию визуальных паттернов. Это навык
                удержания в уме информации о расположении объектов в
                пространстве.
              </p>
              <p>
                Визуальная память критически важна для повседневной жизни:
                навигации в городе без карты, узнавания лиц в толпе и
                запоминания сложных планировок (например, интерфейсов программ
                или карт в видеоиграх).
              </p>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-3 uppercase text-sm tracking-widest flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Как запоминать лучше
            </h2>
            <ol className="text-text-muted text-sm space-y-3 list-decimal list-inside marker:text-neon-green marker:font-bold">
              <li>
                <strong>Ищите формы:</strong> Не пытайтесь запомнить каждый
                квадрат отдельно. Ищите в подсвеченных клетках геометрические
                фигуры (буква Г, крест, квадрат).
              </li>
              <li>
                <strong>Систематизируйте:</strong> Начинайте сканировать сетку с
                левого верхнего угла, как при чтении книги.
              </li>
              <li>
                <strong>Группируйте (Чанкинг):</strong> Разбейте большую сетку
                на логические зоны (левая часть, центр, правый нижний угол) и
                запоминайте их как отдельные блоки.
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // --- ЭКРАН GAME OVER ---
  if (gameState === "gameover") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center animate-in fade-in duration-500">
        <Trophy className="w-16 h-16 text-neon-green mb-4" />
        <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tight text-center">
          ТЕСТ ЗАВЕРШЕН!
        </h2>
        <p className="text-text-muted mb-8">Результаты: Визуальная память</p>

        {/* ГЛАВНАЯ КАРТОЧКА */}
        <div className="w-full bg-surface border border-neon-green/30 rounded-xl p-8 text-center mb-6 relative overflow-hidden shadow-2xl">
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

        {/* ТАК БЛИЗКО */}
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

        {/* СЕТКА СТАТИСТИКИ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <Grid className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Результат
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <BarChart3 className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
            <div className="text-2xl font-bold">9</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Среднее в мире
            </div>
          </div>
        </div>

        {/* КНОПКИ */}
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
        <div className="w-full bg-gradient-to-r from-blue-900/20 to-teal-900/20 border border-white/5 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5 text-teal-400" /> Брось вызов другу
          </h3>
          <p className="text-sm text-text-muted mb-4">
            У меня идеальная зрительная память: уровень {level}! Сможешь
            повторить?
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `Я дошел до ${level} уровня в тесте на визуальную память! Сможешь лучше? ${window.location.origin}`,
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
