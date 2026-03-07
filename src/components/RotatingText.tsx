"use client";

import { useState, useEffect } from "react";

const WORDS = ["РЕФЛЕКСЫ", "ПАМЯТЬ", "ФОКУС", "СКОРОСТЬ", "ПРЕДЕЛЫ"];

export default function RotatingText() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // Начинаем скрывать текст
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % WORDS.length); // Меняем слово
        setFade(true); // Показываем новое
      }, 500); // Половина секунды на анимацию
    }, 3000); // Каждые 3 секунды

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan transition-opacity duration-500 inline-block min-w-[300px] ${fade ? "opacity-100" : "opacity-0"}`}
    >
      {WORDS[index]}.
    </span>
  );
}
