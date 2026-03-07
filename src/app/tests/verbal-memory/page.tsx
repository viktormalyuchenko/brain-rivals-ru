"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  HelpCircle,
  RotateCcw,
  Trophy,
  Play,
  ArrowLeft,
  Keyboard,
  Heart,
  Save,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

type GameState = "intro" | "playing" | "gameover";

const WORD_BANK = [
  "Дом",
  "Кот",
  "Мир",
  "Лес",
  "Мяч",
  "Сон",
  "Дым",
  "Зуб",
  "Час",
  "Щит",
  "Гром",
  "Друг",
  "Брат",
  "Снег",
  "Флаг",
  "Стол",
  "Стул",
  "Ключ",
  "Звон",
  "Круг",
  "Мост",
  "Парк",
  "Врач",
  "Глаз",
  "Рука",
  "Нога",
  "Лицо",
  "Свет",
  "Цвет",
  "Вкус",
  "Звук",
  "Хлеб",
  "Соль",
  "Вода",
  "Река",
  "Море",
  "Гора",
  "Небо",
  "Звезды",
  "Луна",
  "День",
  "Ночь",
  "Утро",
  "Лето",
  "Зима",
  "Осень",
  "Весна",
  "Ветер",
  "Дождь",
  "Гроза",
  "Книга",
  "Ручка",
  "Бумага",
  "Слово",
  "Мысль",
  "Душа",
  "Сердце",
  "Любовь",
  "Жизнь",
  "Смерть",
  "Время",
  "Место",
  "Город",
  "Улица",
  "Поезд",
  "Машина",
  "Самолет",
  "Корабль",
  "Дорога",
  "Путь",
  "Окно",
  "Дверь",
  "Стена",
  "Пол",
  "Крыша",
  "Сад",
  "Цветок",
  "Дерево",
  "Птица",
  "Рыба",
  "Зверь",
  "Человек",
  "Ребенок",
  "Семья",
  "Работа",
  "Деньги",
  "Успех",
  "Сила",
  "Власть",
  "Закон",
];

const AVERAGE_SCORE = 35;

export default function VerbalMemory() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("intro");
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);

  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [currentWord, setCurrentWord] = useState("");
  const [isNewWord, setIsNewWord] = useState(true);

  // Состояние для визуального фидбека (null, верно, ошибка)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  // --- ЛОГИКА ---

  const startGame = () => {
    setLives(3);
    setScore(0);
    setSeenWords(new Set());
    nextTurn(new Set());
    setGameState("playing");
    setFeedback(null);
  };

  const nextTurn = (currentSeen: Set<string>) => {
    const chanceOfSeen = Math.min(0.5, currentSeen.size * 0.05);
    const showSeen = Math.random() < chanceOfSeen && currentSeen.size > 0;

    if (showSeen) {
      const seenArray = Array.from(currentSeen);
      const randomWord =
        seenArray[Math.floor(Math.random() * seenArray.length)];
      setCurrentWord(randomWord);
      setIsNewWord(false);
    } else {
      let newWord = "";
      do {
        newWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
      } while (currentSeen.has(newWord));

      setCurrentWord(newWord);
      setIsNewWord(true);
    }
  };

  const handleAnswer = (choice: "new" | "seen") => {
    // Блокируем нажатия, пока показывается анимация ответа
    if (feedback !== null) return;

    const isCorrect =
      (choice === "new" && isNewWord) || (choice === "seen" && !isNewWord);

    if (isCorrect) {
      // 1. Показываем зеленый фидбек
      setFeedback("correct");

      // 2. Через 300мс переключаем слово
      setTimeout(() => {
        setScore((s) => s + 1);
        const newSeen = new Set(seenWords);
        if (isNewWord) {
          newSeen.add(currentWord);
          setSeenWords(newSeen);
        }
        nextTurn(newSeen);
        setFeedback(null); // Сбрасываем фидбек
      }, 300);
    } else {
      // 1. Показываем красный фидбек
      setFeedback("wrong");

      // 2. Через 300мс снимаем жизнь или заканчиваем игру
      setTimeout(() => {
        if (lives > 1) {
          setLives((l) => l - 1);
          // При ошибке логика обновления базы слов сохраняется
          const newSeen = new Set(seenWords);
          if (isNewWord) {
            newSeen.add(currentWord);
            setSeenWords(newSeen);
          }
          nextTurn(newSeen);
          setFeedback(null);
        } else {
          setLives(0);
          setGameState("gameover");
          setFeedback(null);
        }
      }, 500); // При ошибке задержка чуть дольше, чтобы понять
    }
  };

  // Клавиатура
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (feedback !== null) return; // Блокируем клавиатуру во время анимации

      if (e.key === "ArrowLeft") handleAnswer("new");
      if (e.key === "ArrowRight") handleAnswer("seen");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, currentWord, isNewWord, seenWords, lives, feedback]);

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
            test_name: "Verbal Memory",
            score: score,
            player_name: playerName,
            country: userCountry,
          },
        ]);
      } else {
        const newRecord = {
          test: "Verbal Memory",
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
    if (val >= 100)
      return { name: "Элита", color: "bg-purple-500 text-white", next: null };
    if (val >= 60)
      return { name: "Алмаз", color: "bg-cyan-400 text-black", next: 100 };
    if (val >= 40)
      return { name: "Золото", color: "bg-yellow-500 text-black", next: 60 };
    if (val >= 20)
      return { name: "Серебро", color: "bg-gray-300 text-black", next: 40 };
    return { name: "Бронза", color: "bg-[#cd7f32] text-black", next: 20 };
  };

  const rank = getRankInfo(score);
  const percentile = Math.min(99, Math.floor((score / 60) * 100));

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
            <Brain className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Verbal Memory
          </h1>
          <p className="text-text-muted text-lg max-w-xl">
            Вам будут показаны слова. Если вы видите слово впервые — нажмите
            НОВОЕ. Если слово уже встречалось в этом тесте — нажмите ВИДЕЛ.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <HelpCircle className="w-4 h-4" /> Как это работает
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Тест проверяет словесную память. Список слов будет постоянно
              расти. У вас есть 3 права на ошибку.
            </p>
          </div>
          <div className="bg-surface border border-surface-border p-6 rounded-lg">
            <div className="flex items-center gap-2 text-neon-green font-bold mb-4 uppercase text-sm">
              <Keyboard className="w-4 h-4" /> Управление
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Используйте кнопки на экране или стрелки клавиатуры: <br />
              <span className="text-white font-bold">← Влево</span> для НОВОЕ,{" "}
              <span className="text-white font-bold">Вправо →</span> для ВИДЕЛ.
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
    // Считаем количество уникальных слов, которые были в игре
    const uniqueWordsCount = seenWords.size;

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        <Trophy className="w-16 h-16 text-neon-green mb-4" />
        <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tight text-center">
          ТЕСТ ЗАВЕРШЕН!
        </h2>

        {/* Главная карточка - СЧЕТ (SCORE) */}
        <div className="w-full bg-surface border border-neon-green/30 rounded-xl p-8 text-center mb-6 relative overflow-hidden">
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold px-4 py-1.5 rounded-b-md uppercase tracking-widest ${rank.color}`}
          >
            {rank.name}
          </div>
          <div className="text-7xl font-extrabold mt-6 mb-2 text-white">
            {score}{" "}
            <span className="text-2xl font-medium text-text-muted">очков</span>
          </div>
          <p className="text-text-muted text-sm uppercase tracking-widest">
            Итоговый счет
          </p>

          <div className="mt-6 inline-flex border border-surface-border bg-background px-4 py-2 rounded-full text-sm">
            <span className="text-text-muted">Топ</span>{" "}
            <span className="text-neon-green font-bold mx-1">
              {percentile}%
            </span>{" "}
            <span className="text-text-muted">в мире</span>
          </div>
        </div>

        {/* Блок "Почти у цели" */}
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
                  {rank.next - score}
                </span>{" "}
                очков до ранга{" "}
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
            <Brain className="w-5 h-5 text-neon-green mx-auto mb-2" />
            <div className="text-2xl font-bold">{uniqueWordsCount}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Уникальных слов
            </div>
          </div>
          <div className="bg-surface border border-surface-border p-5 text-center rounded-xl">
            <RotateCcw className="w-5 h-5 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
              Всего ходов
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

  // Определяем цвет карточки в зависимости от фидбека
  let cardStyle = "text-white";
  if (feedback === "correct")
    cardStyle =
      "text-green-400 scale-110 drop-shadow-[0_0_35px_rgba(74,222,128,0.5)]";
  if (feedback === "wrong")
    cardStyle = "text-red-500 shake drop-shadow-[0_0_35px_rgba(239,68,68,0.5)]";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a0b2e] to-[#2d1b4e] select-none">
      {/* Шапка */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start max-w-4xl mx-auto left-1/2 -translate-x-1/2">
        <div className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
          <span className="text-text-muted text-sm font-bold uppercase mr-2">
            Score
          </span>
          <span className="text-white text-xl font-bold">{score}</span>
        </div>
        <div className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-2">
          <span className="text-text-muted text-sm font-bold uppercase mr-2">
            Lives
          </span>
          {[1, 2, 3].map((h) => (
            <Heart
              key={h}
              className={`w-5 h-5 ${h <= lives ? "text-red-500 fill-red-500" : "text-gray-600"}`}
            />
          ))}
        </div>
      </div>

      {/* СЛОВО (Карточка) */}
      <div className="text-center mb-16 relative">
        <div className="text-text-muted text-sm mb-4">Вы видели это слово?</div>
        <h2
          className={`text-6xl md:text-8xl font-bold tracking-wide transition-all duration-200 ${cardStyle}`}
        >
          {currentWord}
        </h2>

        {/* Иконка результата поверх */}
        {feedback === "correct" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500 opacity-20">
            <CheckCircle className="w-32 h-32" />
          </div>
        )}
        {feedback === "wrong" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 opacity-20">
            <XCircle className="w-32 h-32" />
          </div>
        )}
      </div>

      {/* КНОПКИ */}
      <div className="flex gap-6 w-full max-w-lg px-4">
        <button
          onClick={() => handleAnswer("new")}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg text-lg transition shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
        >
          НОВОЕ
        </button>
        <button
          onClick={() => handleAnswer("seen")}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg text-lg transition shadow-[0_0_20px_rgba(22,163,74,0.3)] active:scale-95 border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
        >
          ВИДЕЛ
        </button>
      </div>

      <div className="mt-8 text-white/30 text-xs uppercase tracking-widest font-medium">
        <span className="mr-4">← Для НОВОЕ</span>
        <span>→ Для ВИДЕЛ</span>
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

export const metadata: Metadata = {
  title: "Вербальная память | Тест на запоминание слов",
  description:
    "Тест на словесную память. Определяй, видел ли ты это слово раньше или оно новое. Тренировка внимания и памяти.",
  keywords: [
    "verbal memory",
    "вербальная память",
    "запоминание слов",
    "тест на память",
    "когнитивные способности",
  ],
  openGraph: {
    title: "Тест: Как много слов ты запомнишь?",
    description:
      "Проверь свою вербальную память. Новое слово или ты его уже видел?",
  },
};
