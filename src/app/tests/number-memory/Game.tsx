"use client";

import { useState, useEffect, useRef } from "react";
import {
  Hash,
  HelpCircle,
  RotateCcw,
  Trophy,
  Play,
  ArrowLeft,
  Keyboard,
  Brain,
  Save,
  Share2,
  Link as LinkIcon,
  BarChart3,
  AlertTriangle,
  Activity,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { saveScoreToDB } from "@/lib/saveScore";

type GameState = "intro" | "watching" | "input" | "feedback" | "gameover";

const AVERAGE_DIGITS = 7; // Число Миллера (среднее для человека)

export default function NumberMemory() {
  const router = useRouter();

  // Состояния
  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1); // Уровень = количество цифр
  const [currentNumber, setCurrentNumber] = useState("");
  const [userInput, setUserInput] = useState("");
  const [showTime, setShowTime] = useState(0); // Сколько мс показывать число
  const [progressWidth, setProgressWidth] = useState(100); // Для полоски таймера
  const [isCopied, setIsCopied] = useState(false); // Для кнопки шаринга

  // --- ЛОГИКА ---

  const startGame = () => {
    setLevel(1);
    startLevel(1);
  };

  const startLevel = (lvl: number) => {
    // Генерируем случайное число длины lvl
    let num = "";
    for (let i = 0; i < lvl; i++) {
      num += Math.floor(Math.random() * 10).toString();
    }
    setCurrentNumber(num);
    setUserInput("");

    // Время показа: 1000мс база + 500мс за каждую цифру (чтобы успеть прочитать длинные)
    const time = 1000 + lvl * 600;
    setShowTime(time);

    setGameState("watching");
    setProgressWidth(100);

    // Анимация таймера
    const interval = 10;
    const step = 100 / (time / interval);
    const timer = setInterval(() => {
      setProgressWidth((prev) => Math.max(0, prev - step));
    }, interval);

    // Переход к вводу
    setTimeout(() => {
      clearInterval(timer);
      setGameState("input");
    }, time);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (userInput === currentNumber) {
      // ПРАВИЛЬНО
      setGameState("feedback"); // Можно добавить экран "Верно!" на секунду
      setTimeout(() => {
        setLevel(level + 1);
        startLevel(level + 1);
      }, 500);
    } else {
      // ОШИБКА -> КОНЕЦ ИГРЫ
      setGameState("gameover");

      // СОХРАНЯЕМ (уровень минус 1, т.к. на текущем он ошибся)
      const finalScore = Math.max(1, level - 1);
      saveScoreToDB("Number Memory", finalScore);
    }
  };

  // --- РАСЧЕТ СТАТИСТИКИ ---
  const score = Math.max(1, level - 1); // Последний успешно пройденный уровень

  // Ранги для памяти (цифры)
  const getRankInfo = (val: number) => {
    if (val >= 16)
      return { name: "Элита", color: "bg-purple-500 text-white", next: null };
    if (val >= 13)
      return { name: "Алмаз", color: "bg-cyan-400 text-black", next: 16 };
    if (val >= 10)
      return { name: "Золото", color: "bg-yellow-500 text-black", next: 13 };
    if (val >= 8)
      return { name: "Серебро", color: "bg-gray-300 text-black", next: 10 };
    return { name: "Бронза", color: "bg-[#cd7f32] text-black", next: 8 };
  };

  const rank = getRankInfo(score);
  const percentile = Math.min(99, Math.floor((score / 14) * 100)); // Условный процентиль

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
            <Hash className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Запоминание чисел
          </h1>
          <p className="text-text-muted text-lg max-w-xl mb-6">
            Запоминайте числа. С каждым уровнем число становится длиннее на одну
            цифру. Как далеко вы сможете зайти?
          </p>
          <div className="flex gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
            <span>
              Сложность: <span className="text-white">Средняя</span>
            </span>
            <span>•</span>
            <span>
              Среднее: <span className="text-white">7 цифр</span>
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
              На экране на несколько секунд появится число. Запомните его. Когда
              оно исчезнет, введите это число в поле по памяти и нажмите Enter.
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-xl">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-3 uppercase text-sm tracking-widest">
              <Keyboard className="w-4 h-4" /> Управление
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Ввод с клавиатуры (цифры) или экранная клавиатура на мобильном
              телефоне.
            </p>
          </div>
        </div>

        {/* КНОПКА */}
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
              <div className="font-bold text-white text-sm">Кол-во цифр</div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Среднее
              </div>
              <div className="font-bold text-white text-sm">7 цифр</div>
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
              <div className="font-bold text-white text-sm">1.2M</div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-4 uppercase text-sm tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Что проверяет этот тест?
            </h2>
            <div className="text-text-muted text-sm leading-relaxed space-y-4">
              <p>
                Тест на прямой цифровой ряд (forward digit span) — это
                классический психологический инструмент для оценки{" "}
                <strong>объема рабочей (кратковременной) памяти</strong>{" "}
                человека.
              </p>
              <p>
                <strong>Сколько цифр может запомнить человек?</strong>
                <br />
                Согласно знаменитому закону Миллера ("Магическое число 7
                плюс-минус 2"), кратковременная память большинства взрослых
                людей способна удерживать в среднем <strong>7 элементов</strong>
                .
              </p>
              <p>
                Если вы смогли запомнить 7 или 8 цифр — это абсолютная
                среднестатистическая норма. Результат в 10-12 цифр говорит о
                превосходной рабочей памяти и отличной концентрации.
              </p>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-3 uppercase text-sm tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4" /> Техники запоминания (Мнемоника)
            </h2>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              Чтобы пробить "потолок" в 7-8 цифр, профессионалы используют
              техники группировки и мнемоники:
            </p>
            <ol className="text-text-muted text-sm space-y-3 list-decimal list-inside marker:text-neon-green marker:font-bold">
              <li>
                <strong>Чанкинг (Группировка):</strong> Наш мозг плохо
                воспринимает 10 отдельных цифр (1-9-8-4-0-2-2-4). Гораздо проще
                разбить их на группы, как номер телефона (198-40-224). Это
                превращает 8 элементов всего в 3 "куска".
              </li>
              <li>
                <strong>Проговаривание вслух:</strong> Аудиальная память часто
                работает лучше визуальной. Произнесите число шепотом.
              </li>
              <li>
                <strong>Создание паттернов:</strong> Ищите логику. Если видите
                "1945", запомните это как год, а не как четыре цифры.
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // --- ЕДИНЫЙ ЭКРАН РЕЗУЛЬТАТОВ (КАК В AIM TRAINER) ---
  if (gameState === "gameover") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center animate-in fade-in duration-500">
        <Trophy className="w-16 h-16 text-neon-green mb-4" />
        <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tight text-center">
          ТЕСТ ЗАВЕРШЕН!
        </h2>
        <p className="text-text-muted mb-8">Результаты: Запоминание чисел</p>

        {/* КАРТОЧКА */}
        <div className="w-full bg-surface border border-neon-green/30 rounded-xl p-8 text-center mb-6 relative overflow-hidden shadow-2xl">
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold px-4 py-1.5 rounded-b-md uppercase tracking-widest ${rank.color}`}
          >
            {rank.name}
          </div>
          <div className="text-7xl font-extrabold mt-6 mb-2 text-white">
            {score}{" "}
            <span className="text-2xl font-medium text-text-muted">цифр</span>
          </div>
          <p className="text-text-muted text-sm uppercase tracking-widest">
            Максимальная длина
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
                Запомните еще{" "}
                <span className="text-white font-bold">
                  {rank.next - score}
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

        {/* СЕТКА СТАТИСТИКИ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <Hash className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Результат
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <BarChart3 className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
            <div className="text-2xl font-bold">{AVERAGE_DIGITS}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Среднее в мире
            </div>
          </div>
        </div>

        {/* СРАВНЕНИЕ */}
        <div className="w-full bg-surface border border-surface-border p-6 rounded-xl mb-8">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-4">
            Сравнение
          </div>
          <div className="flex items-center justify-between text-sm mb-2 font-bold">
            <span className="text-neon-green">{score} Цифр</span>
            <span className="text-text-muted text-xs font-normal">VS</span>
            <span className="text-white">{AVERAGE_DIGITS} Цифр (AVG)</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden flex">
            <div
              style={{
                width: `${Math.min(100, (score / (score + AVERAGE_DIGITS)) * 100)}%`,
              }}
              className="bg-neon-green h-full"
            ></div>
            <div className="bg-surface-border h-full flex-grow"></div>
          </div>

          {/* ОШИБКА ПОЛЬЗОВАТЕЛЯ */}
          <div className="mt-6 p-4 bg-background rounded-lg border border-surface-border flex flex-col items-center">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-2">
              Детали ошибки
            </div>
            <p className="text-sm text-text-muted text-center">
              Правильный ответ:{" "}
              <span className="text-white font-mono font-bold tracking-widest text-lg ml-2">
                {currentNumber}
              </span>{" "}
              <br />
              Ваш ответ:{" "}
              <span className="text-red-400 font-mono font-bold tracking-widest text-lg line-through ml-2">
                {userInput}
              </span>
            </p>
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
        <div className="w-full bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-white/5 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5 text-blue-400" /> Брось вызов другу
          </h3>
          <p className="text-sm text-text-muted mb-4">
            У меня идеальная кратковременная память: я запомнил {score} цифр
            подряд!
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `Я запомнил ${score} цифр в тесте на память! Сможешь побить мой рекорд? ${window.location.origin}`,
              );
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className={`text-white px-8 py-2 rounded text-sm font-bold transition flex items-center gap-2 mx-auto ${isCopied ? "bg-green-600" : "bg-blue-600 hover:bg-blue-500"}`}
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0f3443] to-[#34e89e] select-none">
      {/* Шапка уровня */}
      <div className="absolute top-12 bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full text-white font-mono text-lg border border-white/10 shadow-xl">
        <span className="text-neon-green font-bold">{level}</span> digits
      </div>

      {gameState === "watching" && (
        <div className="text-center animate-in zoom-in duration-300">
          <h2 className="text-white text-6xl md:text-8xl font-mono font-bold tracking-widest drop-shadow-2xl">
            {currentNumber}
          </h2>
          {/* Полоска таймера */}
          <div className="w-64 h-2 bg-white/20 rounded-full mt-12 mx-auto overflow-hidden">
            <div
              style={{ width: `${progressWidth}%` }}
              className="h-full bg-white transition-all duration-75 ease-linear transition-timing-function: linear"
            ></div>
          </div>
        </div>
      )}

      {gameState === "input" && (
        <div className="text-center w-full max-w-md px-4">
          <p className="text-white/80 mb-6 text-lg">Какое было число?</p>
          <form onSubmit={handleSubmit}>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))} // Только цифры
              className="w-full bg-transparent border-2 border-white/20 rounded-lg py-4 text-center text-4xl md:text-5xl font-mono text-white focus:outline-none focus:border-neon-green focus:bg-white/5 transition mb-8 tracking-widest"
              placeholder="Введите число"
            />
            <button
              type="submit"
              className="bg-neon-green text-black px-12 py-3 rounded font-bold text-lg hover:bg-white transition w-full"
            >
              ОТПРАВИТЬ
            </button>
          </form>
          <div className="mt-4 text-white/40 text-xs uppercase tracking-widest">
            Нажмите Enter, чтобы отправить
          </div>
        </div>
      )}

      <button
        onClick={() => setGameState("intro")}
        className="absolute top-8 left-8 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition border border-white/10"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
    </div>
  );
}
