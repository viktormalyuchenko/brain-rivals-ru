import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog"; // <--- Импортируем функцию для чтения статей

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://brain.viktoor.ru";

  // Статические страницы
  const routes = [
    "",
    "/tests",
    "/leaderboard",
    "/login",
    "/signup",
    "/blog", // <--- Главная страница блога
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Страницы игр
  const games = [
    "/tests/reaction",
    "/tests/sequence",
    "/tests/aim",
    "/tests/number-memory",
    "/tests/verbal-memory",
    "/tests/chimp",
    "/tests/typing",
    "/tests/visual-memory",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1.0,
  }));

  // Динамические страницы статей блога
  const posts = getAllPosts();
  const blogPosts = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date), // Берем дату из файла статьи
    changeFrequency: "monthly" as const,
    priority: 0.7, // Статьям ставим приоритет чуть ниже главных страниц
  }));

  return [...routes, ...games, ...blogPosts];
}
