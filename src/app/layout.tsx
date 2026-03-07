import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Script from "next/script"; // <--- Импортируем Script

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Brain Tests | Проверь свои рефлексы и память",
  description:
    "Онлайн тренажеры для мозга: тест на реакцию, запоминание чисел, аим трейнер. Соревнуйся с друзьями и улучшай когнитивные способности.",
  verification: {
    yandex: "3af9283d8b2ebd88",
    google: "Ihz5Cd5vkNkVuh36pZjbyhECtbKBY5oZu7pMs4t5kXU",
  },
  // Open Graph картинка (для красивых ссылок в ТикТоке/Телеграме)
  openGraph: {
    images: ["/og-image.jpg"], // Нужно будет добавить картинку в папку public
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        {/* Яндекс.Метрика */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(107196044, "init", {
              ssr: true, // Включаем поддержку SSR
              webvisor: true,
              clickmap: true,
              trackLinks: true,
              accurateTrackBounce: true
            });
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
        {/* Ноускрипт для метрики */}
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/107196044"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
