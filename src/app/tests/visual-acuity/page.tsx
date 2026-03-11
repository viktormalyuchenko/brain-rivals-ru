import type { Metadata } from "next";
import Game from "./Game";

export const metadata: Metadata = {
  title: "Тест на остроту зрения | Кольца Ландольта онлайн",
  description:
    "Проверьте свое зрение онлайн. Определите направление разрыва в кольце, которое постоянно уменьшается.",
  keywords: [
    "зрение",
    "тест на зрение",
    "визуальная острота",
    "кольца ландольта",
  ],
};

export default function Page() {
  return <Game />;
}
