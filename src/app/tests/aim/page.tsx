import type { Metadata } from "next";
import AimTrainer from "./Game";

export const metadata: Metadata = {
  title: "Аим Тренер Онлайн | Тренировка меткости и реакции (FPS)",
  description:
    "Бесплатный Aim Trainer прямо в браузере. Улучши свой аим, скорость наведения и точность мыши для CS2, Valorant и других шутеров.",
  keywords: [
    "aim trainer",
    "аим тренер",
    "тренировка аима",
    "меткость",
    "fps тренировка",
    "кс го аим",
  ],
  openGraph: {
    title: "Прокачай свой АИМ онлайн",
    description:
      "Тренировка меткости для геймеров. Узнай свой TPS и скорость реакции.",
  },
};

export default function Page() {
  return <AimTrainer />;
}
