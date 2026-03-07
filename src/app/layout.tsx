import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header"; // Подключаем шапку

const inter = Inter({ subsets: ["latin", "cyrillic"] }); // Добавил кириллицу для русского языка

export const metadata: Metadata = {
  title: "Brain Tests | Проверь свои рефлексы",
  description:
    "Измерь свою скорость реакции, память и логику. Поднимись в таблице лидеров.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
