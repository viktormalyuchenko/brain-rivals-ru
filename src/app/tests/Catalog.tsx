"use client";

import { useState } from "react";
import {
  Search,
  Zap,
  Grid,
  Target,
  Hash,
  Type,
  Activity,
  Eye,
  Brain,
  Lock,
} from "lucide-react";
import Link from "next/link";

// Типы для тестов
type Category =
  | "ВСЕ"
  | "СКОРОСТЬ РЕАКЦИИ"
  | "ПАМЯТЬ"
  | "ТОЧНОСТЬ"
  | "ВОСПРИЯТИЕ";

interface TestCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: Category;
  plays: string;
  avgScore: string;
  link: string;
  active: boolean; // Доступен ли тест сейчас
  input: string; // Mouse, Keyboard и т.д.
}

// Список тестов (Пока активен только один)
const TESTS: TestCard[] = [
  {
    id: "reaction",
    title: "Скорость реакции",
    description:
      "Измерьте скорость реакции на визуальные стимулы. Кликайте, когда экран меняет цвет.",
    icon: Zap,
    category: "СКОРОСТЬ РЕАКЦИИ",
    plays: "2.4M",
    avgScore: "245мс",
    link: "/tests/reaction",
    active: true,
    input: "Клик или Пробел",
  },
  {
    id: "sequence",
    title: "Последовательность",
    description:
      "Запоминайте и повторяйте последовательность загорающихся кнопок.",
    icon: Grid,
    category: "ПАМЯТЬ",
    plays: "1.8M",
    avgScore: "Ур. 8",
    link: "/tests/sequence",
    active: true,
    input: "Клик мышью",
  },
  {
    id: "aim",
    title: "Тренировка меткости",
    description:
      "Поражайте мишени как можно быстрее. Тест на точность и скорость наведения.",
    icon: Target,
    category: "ТОЧНОСТЬ",
    plays: "1.5M",
    avgScore: "3.2 цели/сек",
    link: "/tests/aim",
    active: true,
    input: "Мышь",
  },
  {
    id: "number-memory",
    title: "Запоминание чисел",
    description: "Запоминайте числа, длина которых постоянно увеличивается.",
    icon: Hash,
    category: "ПАМЯТЬ",
    plays: "1.2M",
    avgScore: "9 цифр",
    link: "/tests/number-memory",
    active: true,
    input: "Клавиатура",
  },
  {
    id: "verbal",
    title: "Вербальная память",
    description:
      "Вам будут показаны слова по одному. Если видели слово ранее — жмите ВИДЕЛ, если нет — НОВОЕ.",
    icon: Type, // Или Brain, если там иконка мозга
    category: "ПАМЯТЬ",
    plays: "980K",
    avgScore: "42 слова",
    link: "/tests/verbal-memory", // Ссылка
    active: true, // <--- ВКЛЮЧАЕМ
    input: "Клик или Стрелки",
  },
  {
    id: "chimp",
    title: "Тест Шимпанзе",
    description:
      "Сможете ли вы переиграть шимпанзе? Запомните расположение цифр, пока они не исчезли.",
    icon: Brain, // Или другую иконку, если есть подходящая
    category: "ПАМЯТЬ",
    plays: "850K",
    avgScore: "6 цифр",
    link: "/tests/chimp", // Ссылка
    active: true, // <--- ВКЛЮЧАЕМ
    input: "Клик мышью",
  },
  {
    id: "typing",
    title: "Скорость печати", // Перевели заголовок
    description:
      "Наберите как можно больше слов за 60 секунд. Важна и скорость, и точность.",
    icon: Type,
    category: "ТОЧНОСТЬ", // Или оставить PRECISION, это подходит
    plays: "720K",
    avgScore: "52 слова/мин",
    link: "/tests/typing", // Ссылка
    active: true, // <--- ВКЛЮЧАЕМ
    input: "Клавиатура",
  },
  {
    id: "visual",
    title: "Визуальная память",
    description:
      "Запоминайте расположение закрашенных квадратов. Сетка увеличивается с каждым уровнем.",
    icon: Grid, // Иконка сетки
    category: "ПАМЯТЬ", // Или MEMORY, если не хотим русифицировать категорию
    plays: "520K",
    avgScore: "Ур. 9",
    link: "/tests/visual-memory", // Ссылка
    active: true, // <--- ВКЛЮЧАЕМ
    input: "Клик мышью",
  },
];

export default function TestsCatalog() {
  const [activeTab, setActiveTab] = useState<Category>("ВСЕ");
  const [searchQuery, setSearchQuery] = useState("");

  // Фильтрация тестов
  const filteredTests = TESTS.filter((test) => {
    const matchesCategory = activeTab === "ВСЕ" || test.category === activeTab;
    const matchesSearch = test.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 uppercase tracking-tight">
          Все тесты
        </h1>
        <p className="text-text-muted">
          Выберите когнитивное испытание для тренировки
        </p>
      </div>

      {/* Поиск и Фильтры */}
      <div className="flex flex-col md:flex-row gap-6 mb-10 justify-between items-start md:items-center">
        {/* Поиск */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Найти тест..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-green transition"
          />
        </div>

        {/* Табы */}
        <div className="flex flex-wrap gap-2">
          {["ВСЕ", "СКОРОСТЬ РЕАКЦИИ", "ПАМЯТЬ", "ТОЧНОСТЬ"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Category)}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition ${
                activeTab === tab
                  ? "bg-neon-green text-black"
                  : "bg-surface border border-surface-border text-text-muted hover:text-white hover:border-white/50"
              }`}
            >
              {tab === "ВСЕ" ? "Все тесты" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className="bg-surface border border-surface-border rounded-xl p-6 flex flex-col hover:border-neon-green/50 transition duration-300 group relative overflow-hidden"
          >
            {/* Иконка и Категория */}
            <div className="flex justify-between items-start mb-6">
              <test.icon
                className={`w-8 h-8 ${test.active ? "text-neon-green" : "text-text-muted"}`}
              />
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted border border-surface-border px-2 py-1 rounded bg-background">
                {test.category}
              </div>
            </div>

            {/* Текст */}
            <h3 className="text-xl font-bold mb-2 group-hover:text-neon-green transition">
              {test.title}
            </h3>
            <p className="text-sm text-text-muted mb-8 line-clamp-2 flex-grow">
              {test.description}
            </p>

            {/* Статистика (фейковая пока, для красоты) */}
            <div className="flex items-center gap-4 text-xs text-text-muted mb-6 font-mono">
              <div>
                <span className="block text-white font-bold">{test.plays}</span>
                Сыграли
              </div>
              <div className="w-px h-6 bg-surface-border"></div>
              <div>
                <span className="block text-white font-bold">
                  {test.avgScore}
                </span>
                Средний результат
              </div>
            </div>

            {/* Футер карточки: Устройство и Кнопка */}
            <div className="mt-auto">
              <div className="flex items-center gap-2 text-[10px] text-text-muted uppercase tracking-wider mb-4">
                <Activity className="w-3 h-3" /> {test.input}
              </div>

              {test.active ? (
                <Link
                  href={test.link}
                  className="w-full bg-neon-green text-black font-bold py-3 rounded-sm flex items-center justify-center gap-2 hover:bg-white transition"
                >
                  <Zap className="w-4 h-4 fill-black" /> НАЧАТЬ ТЕСТ
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full bg-surface-border text-text-muted font-bold py-3 rounded-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                >
                  <Lock className="w-4 h-4" /> СКОРО
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          Ничего не найдено по запросу "{searchQuery}"
        </div>
      )}
    </div>
  );
}
