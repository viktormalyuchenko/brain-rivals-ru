import type { Metadata } from "next";
import ReactionTest from "./Game";

export const metadata: Metadata = {
  title: "Тест на реакцию (мс) | Проверь скорость реакции онлайн",
  description:
    "Бесплатный тренажер скорости реакции. Узнай, за сколько миллисекунд твой мозг реагирует на смену цвета. Сравни результат с киберспортсменами.",
  keywords: [
    "тест на реакцию",
    "reaction time test",
    "скорость реакции",
    "тренажер реакции",
    "киберспорт",
    "benchmark",
  ],
  openGraph: {
    title: "Моя реакция быстрее твоей? Проверь себя!",
    description:
      "Тест на скорость реакции в миллисекундах. Попробуй попасть в топ лидерборда.",
  },
};

export default function Page() {
  return <ReactionTest />;
}
