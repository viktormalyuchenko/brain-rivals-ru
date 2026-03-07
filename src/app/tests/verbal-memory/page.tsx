import type { Metadata } from "next";
import VerbalMemory from "./Game";

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

export default function Page() {
  return <VerbalMemory />;
}
