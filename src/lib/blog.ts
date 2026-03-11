import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Папка, где лежат статьи
const postsDirectory = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  readTime: string;
  content: string;
}

// Получить все статьи (для страницы /blog)
export function getAllPosts(): BlogPost[] {
  // Проверяем, существует ли папка
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, ""); // Убираем .md для ссылки
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    // Парсим frontmatter (мета-данные)
    const matterResult = matter(fileContents);

    return {
      slug,
      content: matterResult.content,
      ...(matterResult.data as Omit<BlogPost, "slug" | "content">),
    };
  });

  // Сортируем по дате (свежие сверху)
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Получить одну статью по slug (для страницы /blog/[slug])
export function getPostBySlug(slug: string): BlogPost | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  return {
    slug,
    content: matterResult.content,
    ...(matterResult.data as Omit<BlogPost, "slug" | "content">),
  };
}
