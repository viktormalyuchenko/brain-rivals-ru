import Link from "next/link";
import { BookOpen, ArrowRight, Calendar, Clock } from "lucide-react";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Блог | Статьи о когнитивных способностях и киберспорте",
  description:
    "Научные статьи, советы и руководства по улучшению скорости реакции, памяти и концентрации.",
};

export default function BlogCatalog() {
  const posts = getAllPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 min-h-screen">
      {/* Заголовок */}
      <div className="mb-12">
        <div className="flex items-center gap-3 text-neon-green mb-4">
          <BookOpen className="w-6 h-6" />
          <span className="font-bold tracking-widest uppercase text-sm">
            База знаний
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Учись и улучшайся
        </h1>
        <p className="text-text-muted text-lg max-w-2xl">
          Научно обоснованные руководства по психологии, когнитивным тренировкам
          и киберспортивным показателям.
        </p>
      </div>

      {/* Список статей */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            href={`/blog/${post.slug}`}
            key={post.slug}
            className="group flex flex-col h-full bg-surface border border-surface-border rounded-xl p-6 hover:border-neon-green/50 transition duration-300"
          >
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-muted mb-4 font-bold">
              <span className="text-neon-cyan bg-neon-cyan/10 px-2 py-1 rounded">
                {post.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />{" "}
                {new Date(post.date).toLocaleDateString("ru-RU")}
              </span>
            </div>

            <h2 className="text-2xl font-bold mb-3 group-hover:text-neon-green transition leading-tight">
              {post.title}
            </h2>
            <p className="text-text-muted text-sm line-clamp-3 mb-6 flex-grow">
              {post.description}
            </p>

            <div className="flex items-center justify-between text-xs font-bold mt-auto pt-4 border-t border-surface-border">
              <span className="flex items-center gap-1 text-text-muted">
                <Clock className="w-3 h-3" /> {post.readTime} чтения
              </span>
              <span className="text-neon-green flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Читать <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
