import type { Metadata } from "next";
import SequenceMemory from "./Game";

export const metadata: Metadata = {
  title: "Запоминание последовательности | Sequence Memory Test",
  description:
    "Тренажер визуальной памяти. Запоминай и повторяй последовательность загорающихся плиток. Аналог игры Саймон говорит.",
  keywords: [
    "sequence memory",
    "тест памяти",
    "запоминание последовательности",
    "тренировка памяти",
    "когнитивный тест",
  ],
  openGraph: {
    title: "Насколько хороша твоя память?",
    description:
      "Попробуй запомнить последовательность. С каждым уровнем становится сложнее!",
  },
};

export default function Page() {
  return <SequenceMemory />;
}
