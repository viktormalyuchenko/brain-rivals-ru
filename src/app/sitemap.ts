import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://brain.viktoor.ru";

  // Статические страницы
  const routes = ["", "/tests", "/leaderboard", "/login", "/signup"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }),
  );

  // Страницы игр (самые важные!)
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
    priority: 1.0, // Высший приоритет
  }));

  return [...routes, ...games];
}
