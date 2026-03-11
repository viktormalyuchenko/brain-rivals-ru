import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";

// Генерация статических страниц при билде
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Динамические SEO-теги
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params; // <--- ЖДЕМ ПАРАМЕТРЫ (Новое правило Next.js)
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) return {};

  return {
    title: `${post.title} | Блог Brain Rivals`,
    description: post.description,
  };
}

// САМА СТРАНИЦА (теперь она async)
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params; // <--- ЖДЕМ ПАРАМЕТРЫ
  const slug = resolvedParams.slug;

  console.log("ПЫТАЮСЬ ОТКРЫТЬ СТАТЬЮ:", slug); // Дебаг в терминал

  const post = getPostBySlug(slug);

  if (!post) {
    return notFound(); // Если файл не найден - 404
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка статьи */}
      <div className="border-b border-surface-border bg-surface/50 pt-16 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-text-muted hover:text-white transition text-sm mb-8 w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Назад в блог
          </Link>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-text-muted mb-6">
            <span className="text-neon-cyan border border-neon-cyan/30 px-2 py-1 rounded bg-neon-cyan/5 flex items-center gap-1">
              <Tag className="w-3 h-3" /> {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />{" "}
              {new Date(post.date).toLocaleDateString("ru-RU")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.readTime} чтения
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            {post.title}
          </h1>
          <p className="text-xl text-text-muted leading-relaxed">
            {post.description}
          </p>
        </div>
      </div>

      {/* Тело статьи (Markdown) */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-invert prose-lg prose-headings:text-white prose-a:text-neon-green hover:prose-a:text-white prose-strong:text-white max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </article>

        {/* Подвал статьи */}
        <div className="mt-16 pt-8 border-t border-surface-border flex justify-between items-center">
          <p className="text-text-muted text-sm">Команда Brain.Viktoor</p>
          <Link
            href="/tests"
            className="bg-neon-green text-black px-6 py-2 rounded font-bold hover:bg-white transition text-sm"
          >
            ПЕРЕЙТИ К ТЕСТАМ
          </Link>
        </div>
      </div>
    </div>
  );
}
