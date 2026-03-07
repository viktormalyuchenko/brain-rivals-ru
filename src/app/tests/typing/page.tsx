import type { Metadata } from "next";
import TypingTest from "./Game";

export const metadata: Metadata = {
  title: "Тест скорости печати (WPM) | Проверь, как быстро ты печатаешь",
  description:
    "Измерь скорость печати на русском языке за 60 секунд. Узнай свой WPM (слов в минуту) и точность набора.",
  keywords: [
    "скорость печати",
    "typing speed test",
    "слепая печать",
    "тест клавиатуры",
    "wpm тест",
  ],
  openGraph: {
    title: "Как быстро ты печатаешь?",
    description:
      "Пройди тест скорости печати за 1 минуту. Узнай свой результат!",
  },
};

export default function Page() {
  return <TypingTest />;
}
