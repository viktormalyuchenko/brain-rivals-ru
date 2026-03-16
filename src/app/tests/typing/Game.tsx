"use client";

import { useState, useEffect, useRef } from "react";
import {
  Type,
  HelpCircle,
  RotateCcw,
  Trophy,
  Play,
  ArrowLeft,
  Keyboard,
  Save,
  BarChart3,
  AlertTriangle,
  Timer,
  AlertCircle,
  Activity,
  Check,
  LinkIcon,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { saveScoreToDB } from "@/lib/saveScore";

type GameState = "intro" | "playing" | "gameover";

// База текстов на русском
const TEXTS = [
  "В лесу родилась елочка, в лесу она росла. Зимой и летом стройная, зеленая была. Метель ей пела песенку: спи, елочка, бай-бай! Мороз снежком укутывал: смотри, не замерзай!",
  "Я помню чудное мгновенье: Передо мной явилась ты, Как мимолетное виденье, Как гений чистой красоты. В томленьях грусти безнадежной, В тревогах шумной суеты...",
  "Мороз и солнце; день чудесный! Еще ты дремлешь, друг прелестный - Пора, красавица, проснись: Открой сомкнуты негой взоры Навстречу северной Авроры...",
  "Наука есть ясное познание истины, просвещение разума, непорочное увеселение жизни, похвала юности, старости подпора, строительница градов, полков, крепость успеха в несчастии...",
  "Вечером, когда пили чай, кухарка подала к столу полную тарелку крыжовника. Не купленного, а своего собственного, собранного в первый раз с тех пор, как были посажены кусты.",
  "Быть знаменитым некрасиво. Не это подымает ввысь. Не надо заводить архива, Над рукописями трястись. Цель творчества - самоотдача, А не шумиха, не успех.",
];

const GAME_DURATION = 60; // 60 секунд
const AVG_WPM = 52; // Среднее в мире

export default function TypingSpeed() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("intro");

  // Игровые данные
  const [targetText, setTargetText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [errors, setErrors] = useState(0);

  const [isCopied, setIsCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // --- ЛОГИКА ---

  const startGame = () => {
    // Выбираем случайный текст
    const randomText = TEXTS[Math.floor(Math.random() * TEXTS.length)];
    setTargetText(randomText);
    setUserInput("");
    setTimeLeft(GAME_DURATION);
    setIsActive(false); // Таймер запустится при первом нажатии
    setErrors(0);
    setWpm(0);
    setGameState("playing");

    // Фокус на инпут после рендера
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Старт таймера при первом символе
    if (!isActive && val.length === 1) {
      setIsActive(true);
    }

    // Считаем ошибки (простая логика: если символ не совпадает)
    // (Более сложная логика требует отслеживания backspace, но для MVP хватит сравнения длин)
    // Здесь мы просто обновляем инпут, ошибки посчитаем в рендере или real-time

    // Если пользователь удаляет, не увеличиваем ошибки, но если печатает неверно - увеличиваем
    if (val.length > userInput.length) {
      const charIndex = val.length - 1;
      if (val[charIndex] !== targetText[charIndex]) {
        setErrors((prev) => prev + 1);
      }
    }

    setUserInput(val);

    // Рассчитываем WPM на лету
    // Формула: (Кол-во символов / 5) / (Прошедшее время в минутах)
    const timeElapsed = GAME_DURATION - timeLeft;
    if (timeElapsed > 0) {
      const words = val.length / 5;
      const minutes = timeElapsed / 60;
      setWpm(Math.round(words / minutes));
    }

    // Если текст закончился
    if (val.length >= targetText.length) {
      finishGame();
    }
  };

  // Таймер
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      finishGame();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const finishGame = () => {
    setIsActive(false);

    const timeSpent = GAME_DURATION - timeLeft;
    const finalTime = timeSpent === 0 ? 60 : timeSpent;
    const words = userInput.length / 5;
    const minutes = finalTime / 60;
    const finalWpm = Math.round(words / minutes);

    setWpm(finalWpm);
    setGameState("gameover");

    // СОХРАНЯЕМ
    saveScoreToDB("Typing Speed", finalWpm);
  };

  // Ранги
  const getRankInfo = (val: number) => {
    if (val >= 100)
      return { name: "Элита", color: "bg-purple-500 text-white", next: null };
    if (val >= 80)
      return { name: "Алмаз", color: "bg-cyan-400 text-black", next: 100 };
    if (val >= 60)
      return { name: "Золото", color: "bg-yellow-500 text-black", next: 80 };
    if (val >= 40)
      return { name: "Серебро", color: "bg-gray-300 text-black", next: 60 };
    return { name: "Бронза", color: "bg-[#cd7f32] text-black", next: 40 };
  };

  const rank = getRankInfo(wpm);
  const percentile = Math.min(99, Math.floor((wpm / 120) * 100));

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
            <Type className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Скорость печати
          </h1>
          <p className="text-text-muted text-lg max-w-xl mb-6">
            Напечатайте как можно больше слов за 60 секунд. Проверьте свою
            скорость и точность слепого набора.
          </p>
          <div className="flex gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
            <span>
              Сложность: <span className="text-white">Средняя</span>
            </span>
            <span>•</span>
            <span>
              Среднее: <span className="text-white">52 WPM</span>
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
              На экране появится текст. Как только вы нажмете первую клавишу,
              запустится таймер на 60 секунд. Печатайте быстро и без ошибок.
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-xl">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-3 uppercase text-sm tracking-widest">
              <Keyboard className="w-4 h-4" /> Управление
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Физическая клавиатура (рекомендуется).
              <br />
              <span className="text-xs opacity-70 mt-1 block">
                Тест поддерживает ввод с мобильных устройств, но результаты
                будут ниже.
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
          <span className="text-xs text-text-muted uppercase tracking-widest">
            Нажмите пробел для старта
          </span>
        </div>

        {/* НИЖНИЙ SEO БЛОК */}
        <div className="flex flex-col gap-4">
          {/* Сетка характеристик */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Метрика
              </div>
              <div className="font-bold text-white text-sm">WPM (Слов/мин)</div>
            </div>
            <div className="bg-black/20 border border-surface-border p-4 rounded-lg text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                Среднее
              </div>
              <div className="font-bold text-white text-sm">52 WPM</div>
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
              <div className="font-bold text-white text-sm">720K</div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-4 uppercase text-sm tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Что такое WPM и какая норма?
            </h2>
            <div className="text-text-muted text-sm leading-relaxed space-y-4">
              <p>
                <strong>WPM (Words Per Minute)</strong> - это международный
                стандарт измерения скорости печати. Он показывает, сколько
                условных слов вы набираете за одну минуту. Одно "слово" в тестах
                всегда равно 5 символам (включая пробелы).
              </p>
              <ul className="space-y-2 list-disc list-inside mt-2">
                <li>
                  <strong>20-30 WPM:</strong> Начинающий уровень. Человек ищет
                  буквы на клавиатуре двумя пальцами.
                </li>
                <li>
                  <strong>40-50 WPM:</strong> Нормальная скорость. Хороший
                  результат для большинства людей. Вполне достаточно для работы
                  в чатах и повседневных задач.
                </li>
                <li>
                  <strong>60-70 WPM:</strong> Высокий уровень. Обычно
                  достигается при использовании слепого десятипальцевого метода.
                  Средняя скорость программистов и копирайтеров.
                </li>
                <li>
                  <strong>80-100+ WPM:</strong> Профессиональная печать. Элита.
                </li>
              </ul>
              <p>
                Если ваша скорость составляет 41-50 WPM - это крепкая норма, вы
                печатаете быстрее 40% пользователей интернета.
              </p>
            </div>
          </div>

          <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-xl">
            <h2 className="text-neon-green font-bold mb-3 uppercase text-sm tracking-widest flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Как улучшить скорость печатания
            </h2>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              Главный секрет быстрой скорости - мышечная память. Ваша задача
              довести навык до автоматизма, чтобы пальцы сами находили нужные
              клавиши без участия сознания.
            </p>
            <ol className="text-text-muted text-sm space-y-3 list-decimal list-inside marker:text-neon-green marker:font-bold">
              <li>
                <strong>Освойте слепую печать:</strong> Изучите стартовую
                позицию пальцев (ФЫВА ОЛДЖ) и не смотрите на клавиатуру.
              </li>
              <li>
                <strong>Точность важнее скорости:</strong> Сначала научитесь
                печатать без ошибок. Скорость придет сама по мере закрепления
                мышечной памяти.
              </li>
              <li>
                <strong>Исправляйте опечатки сразу:</strong> Мозг лучше
                запоминает правильные паттерны, если вы мгновенно реагируете на
                ошибку (Backspace).
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
      if (val >= 100)
        return { name: "Элита", color: "bg-purple-500 text-white", next: null };
      if (val >= 80)
        return { name: "Алмаз", color: "bg-cyan-400 text-black", next: 100 };
      if (val >= 60)
        return { name: "Золото", color: "bg-yellow-500 text-black", next: 80 };
      if (val >= 40)
        return { name: "Серебро", color: "bg-gray-300 text-black", next: 60 };
      return { name: "Бронза", color: "bg-[#cd7f32] text-black", next: 40 };
    };

    const rank = getRankInfo(wpm);
    const percentile = Math.min(99, Math.floor((wpm / 120) * 100));

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        <Trophy className="w-16 h-16 text-neon-green mb-4" />
        <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tight text-center">
          ТЕСТ ЗАВЕРШЕН!
        </h2>
        <p className="text-text-muted mb-8">Результаты: Скорость печати</p>

        <div className="w-full bg-surface border border-neon-green/30 rounded-xl p-8 text-center mb-6 relative overflow-hidden">
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold px-4 py-1.5 rounded-b-md uppercase tracking-widest ${rank.color}`}
          >
            {rank.name}
          </div>
          <div className="text-7xl font-extrabold mt-6 mb-2 text-white">
            {wpm}{" "}
            <span className="text-2xl font-medium text-text-muted">WPM</span>
          </div>
          <p className="text-text-muted text-sm uppercase tracking-widest">
            Слов в минуту
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
                Напечатайте еще{" "}
                <span className="text-white font-bold">
                  {rank.next - wpm} WPM
                </span>{" "}
                для ранга{" "}
                <span className="font-bold text-white uppercase">
                  {getRankInfo(rank.next).name}
                </span>
                !
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <Type className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">{wpm}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Скорость
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{errors}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Ошибки
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <BarChart3 className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
            <div className="text-2xl font-bold">52</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Среднее в мире
            </div>
          </div>
        </div>

        {/* СРАВНЕНИЕ (Прогресс бар) */}
        <div className="w-full bg-surface border border-surface-border p-6 rounded-xl mb-8">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-4">
            Сравнение
          </div>
          <div className="flex items-center justify-between text-sm mb-2 font-bold">
            <span className="text-neon-green">{wpm} WPM</span>
            <span className="text-text-muted text-xs font-normal">VS</span>
            <span className="text-white">52 WPM (AVG)</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden flex">
            <div
              style={{ width: `${Math.min(100, (wpm / 120) * 100)}%` }}
              className="bg-neon-green h-full"
            ></div>
            <div className="bg-surface-border h-full flex-grow"></div>
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
        <div className="w-full bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-white/5 rounded-xl p-6 text-center mt-8">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" /> Вызов для друзей
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Моя скорость печати {wpm} слов в минуту! Сможешь набрать быстрее?
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `Моя скорость печати ${wpm} WPM! Попробуй набрать быстрее на ${window.location.origin}`,
              );
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className={`text-white px-8 py-2 rounded text-sm font-bold transition flex items-center gap-2 mx-auto ${isCopied ? "bg-green-600" : "bg-cyan-600 hover:bg-cyan-500"}`}
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
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Статистика в реальном времени */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white font-mono font-bold flex items-center gap-2">
          <span className="text-text-muted uppercase text-xs">WPM:</span>{" "}
          <span className="text-neon-green text-xl">{wpm}</span>
        </div>
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white font-mono font-bold flex items-center gap-2">
          <Timer className="w-4 h-4 text-text-muted" />{" "}
          <span className="text-xl">{timeLeft}s</span>
        </div>
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white font-mono font-bold flex items-center gap-2">
          <span className="text-text-muted uppercase text-xs">Errors:</span>{" "}
          <span className="text-red-400 text-xl">{errors}</span>
        </div>
      </div>

      <button
        onClick={() => setGameState("intro")}
        className="absolute top-8 left-8 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition border border-white/10 z-20"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* ТЕКСТОВОЕ ПОЛЕ */}
      <div className="w-full max-w-4xl px-8 relative">
        {/* Невидимый инпут для захвата ввода */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInput}
          className="opacity-0 absolute inset-0 w-full h-full cursor-default z-20"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {/* Отображение текста */}
        <div className="bg-black/30 border border-white/10 rounded-xl p-8 md:p-12 text-2xl md:text-3xl font-mono leading-relaxed relative min-h-[200px] shadow-2xl">
          {targetText.split("").map((char, index) => {
            let color = "text-text-muted"; // Будущий текст
            let bg = "bg-transparent";

            // Прошедший или текущий текст
            if (index < userInput.length) {
              // Если совпадает
              if (userInput[index] === char) {
                color = "text-neon-green";
              } else {
                color = "text-red-500";
                bg = "bg-red-500/10";
              }
            }

            // Курсор
            const isCursor = index === userInput.length;

            return (
              <span
                key={index}
                className={`relative ${color} ${bg} transition-colors duration-75`}
              >
                {isCursor && (
                  <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-neon-green animate-pulse"></span>
                )}
                {char}
              </span>
            );
          })}
        </div>

        {/* Инструкция снизу */}
        <div className="text-center mt-8 text-white/30 text-xs uppercase tracking-widest font-medium">
          Начните печатать, чтобы запустить таймер
        </div>

        {/* Прогресс бар */}
        <div className="w-full h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
          <div
            style={{
              width: `${(userInput.length / targetText.length) * 100}%`,
            }}
            className="h-full bg-neon-green transition-all duration-200"
          ></div>
        </div>
      </div>
    </div>
  );
}
