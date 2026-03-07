export const TEST_NAMES: Record<string, string> = {
  "Reaction Time": "Скорость реакции",
  "Sequence Memory": "Тест памяти",
  "Aim Trainer": "Аим Тренер",
  "Number Memory": "Запоминание чисел",
  "Verbal Memory": "Вербальная память",
  "Chimp Test": "Тест Шимпанзе",
  "Typing Speed": "Скорость печати",
  "Visual Memory": "Визуальная память",
};

// Функция-помощник: если перевода нет, вернет оригинал
export const translateTestName = (englishName: string) => {
  return TEST_NAMES[englishName] || englishName;
};
