import type { Metadata } from "next";
import ChimpTest from "./Game";

export const metadata: Metadata = {
  title: "Тест Шимпанзе | Проверка рабочей памяти",
  description:
    "Сможешь ли ты переиграть шимпанзе? Тест на фотографическую память и пространственное мышление. Запоминай цифры за доли секунды.",
  keywords: [
    "chimp test",
    "тест шимпанзе",
    "фотографическая память",
    "рабочая память",
    "мозг",
  ],
  openGraph: {
    title: "Ты умнее шимпанзе?",
    description:
      "Знаменитый когнитивный тест. Попробуй запомнить расположение скрытых цифр.",
  },
};

export default function Page() {
  return <ChimpTest />;
}
