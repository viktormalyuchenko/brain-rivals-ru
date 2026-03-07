import type { Metadata } from "next";
import TestsCatalog from "./Catalog";

export const metadata: Metadata = {
  title: "Каталог тестов | Все тренажеры для мозга",
  description:
    "Выберите тест для тренировки: Реакция, Память, Точность, Внимание. 8 профессиональных когнитивных тренажеров.",
};

export default function Page() {
  return <TestsCatalog />;
}
