import type { Metadata } from "next";
import VisualMemory from "./Game";

export const metadata: Metadata = {
  title: "Визуальная память | Тест на запоминание образов",
  description:
    "Тренажер зрительной памяти. Запоминай расположение закрашенных клеток на сетке. С каждым уровнем сетка становится сложнее.",
  keywords: [
    "visual memory",
    "визуальная память",
    "зрительная память",
    "тренировка мозга",
    "grid memory",
  ],
  openGraph: {
    title: "Тренировка визуальной памяти",
    description:
      "Запоминай узоры и развивай мозг. До какого уровня дойдешь ты?",
  },
};

export default function Page() {
  return <VisualMemory />;
}
