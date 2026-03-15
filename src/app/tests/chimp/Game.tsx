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
  ListChecks,
  Activity,
  LinkIcon,
  Share2,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { saveScoreToDB } from "@/lib/saveScore";

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
  const [isCopied, setIsCopied] = useState(false);

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

        // СОХРАНЯЕМ (максимальный пройденный уровень)
        saveScoreToDB("Chimp Test", maxLevelReached);
      }
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
          className="flex items-center gap-2 text-text-muted hover:text-white transition w-fit mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к тестам
        </Link>

        {/* ШАПКА */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-16 h-16 rounded-full border border-surface-border bg-surface flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,255,136,0.1)]">
            <Brain className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Тест Шимпанзе
          </h1>
          <p className="text-text-muted text-lg max-w-xl mb-6">
            Сможете ли вы обыграть шимпанзе в игре на память? Цифры исчезают
            после первого взгляда.
          </p>
          <div className="flex gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
            <span>
              Сложность: <span className="text-white">Сложная</span>
            </span>
            <span>•</span>
            <span>
              Среднее: <span className="text-white">6 цифр</span>
            </span>
          </div>
        </div>

        {/* КАРТОЧКИ */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-surface border border-surface-border p-6 rounded-xl">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-3 uppercase text-sm tracking-widest">
              <HelpCircle className="w-4 h-4" /> Как это работает
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Нажмите на цифру 1. Как только вы это сделаете, остальные цифры
              станут невидимыми. Нажимайте на пустые квадраты по памяти в
              порядке возрастания (2, 3, 4...).
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-xl">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-3 uppercase text-sm tracking-widest">
              <MousePointer className="w-4 h-4" /> Управление
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Только клик мышью или нажатие на экран.
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

        {/* SEO БЛОК */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Метрика
              </div>
              <div className="font-bold text-white text-sm">Найдено цифр</div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Среднее
              </div>
              <div className="font-bold text-white text-sm">6 цифр</div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Сложность
              </div>
              <div className="font-bold text-white text-sm">Сложная</div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Сыграно
              </div>
              <div className="font-bold text-white text-sm">850K</div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-4 uppercase text-sm tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> В чем суть теста?
            </h2>
            <div className="text-text-muted text-sm leading-relaxed space-y-4">
              <p>
                Этот тест основан на знаменитом исследовании Университета Киото
                (Япония), которое показало, что молодые шимпанзе обладают
                феноменальной рабочей памятью. Они способны запоминать
                расположение чисел на экране за доли секунды и безошибочно
                воспроизводить их.
              </p>
              <p>
                Тест проверяет вашу{" "}
                <strong>фотографическую (эйдетическую) память</strong> и
                способность мгновенно захватывать визуальную информацию.
                Большинство людей начинают испытывать серьезные трудности после
                7-8 цифр.
              </p>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-3 uppercase text-sm tracking-widest flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Советы для улучшения
            </h2>
            <ol className="text-text-muted text-sm space-y-3 list-decimal list-inside marker:text-neon-green marker:font-bold">
              <li>
                <strong>Делайте мысленный "снимок":</strong> Не пытайтесь
                проговаривать цифры по порядку. Постарайтесь охватить взглядом
                весь экран целиком перед тем, как нажать на единицу.
              </li>
              <li>
                <strong>Фокус на шаблоне:</strong> Запоминайте относительное
                расположение цифр (например, "тройка под четверкой, пятерка
                слева").
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // --- ЭКРАН GAME OVER ---
  if (gameState === "gameover") {
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

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        <Trophy className="w-16 h-16 text-neon-green mb-4" />
        <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tight text-center">
          ТЕСТ ЗАВЕРШЕН!
        </h2>
        <p className="text-text-muted mb-8">Результаты: Тест Шимпанзе</p>

        <div className="w-full bg-surface border border-neon-green/30 rounded-xl p-8 text-center mb-6 relative overflow-hidden shadow-2xl">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <Brain className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">{maxLevelReached}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Ваш результат
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <BarChart3 className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
            <div className="text-2xl font-bold">6</div>
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
        <div className="w-full bg-gradient-to-r from-orange-900/20 to-amber-900/20 border border-white/5 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5 text-orange-400" /> Вызов для друзей
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Я запомнил {maxLevelReached} цифр с одного взгляда. Умнее ли твои
            друзья, чем обезьяна?
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `Я прошел Chimp Test до ${maxLevelReached} уровня! Сможешь лучше? ${window.location.origin}`,
              );
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className={`text-white px-8 py-2 rounded text-sm font-bold transition flex items-center gap-2 mx-auto ${isCopied ? "bg-green-600" : "bg-orange-600 hover:bg-orange-500"}`}
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
