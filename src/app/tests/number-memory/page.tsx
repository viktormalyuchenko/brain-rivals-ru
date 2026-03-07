import type { Metadata } from "next";
import SequenceMemory from "./Game";

export const metadata: Metadata = {
  title: "Запоминание чисел | Тест на объем памяти",
  description:
    "Проверь, сколько цифр ты сможешь удержать в голове. Тест на кратковременную память и числовой интеллект.",
  keywords: [
    "number memory",
    "запоминание чисел",
    "тест iq",
    "кратковременная память",
    "развитие памяти",
  ],
  openGraph: {
    title: "Сколько цифр ты сможешь запомнить?",
    description: "Средний человек запоминает 7 цифр. А ты сможешь больше?",
  },
};

export default function Page() {
  return <SequenceMemory />;
}
