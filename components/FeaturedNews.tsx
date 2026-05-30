import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types";
import { getCategoryBadgeClass, formatDatePT } from "@/lib/mockData";

const categoryGradients: Record<string, string> = {
  "Grand Slam": "from-yellow-400 to-amber-500",
  "ATP": "from-blue-400 to-blue-600",
  "WTA": "from-pink-400 to-rose-500",
  "Brasil": "from-green-400 to-emerald-600",
  "Internacional": "from-purple-400 to-violet-600",
};

const categoryEmoji: Record<string, string> = {
  "Grand Slam": "🏆",
  "ATP": "🎾",
  "WTA": "🎾",
  "Brasil": "🇧🇷",
  "Internacional": "🌎",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

interface FeaturedNewsProps {
  article: Article;
}

export default function FeaturedNews({ article }: FeaturedNewsProps) {
  const { title, body, category, publishedAt, mainImage, slug } = article;
  const excerpt = stripHtml(body).slice(0, 200) + (stripHtml(body).length > 200 ? "..." : "");
  const gradient = categoryGradients[category] ?? "from-gray-400 to-gray-600";
  const emoji = categoryEmoji[category] ?? "🎾";

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-md border border-gray-100 card-hover">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[360px]">
        {/* Image */}
        <Link
          href={`/noticias/${slug}`}
          className="relative overflow-hidden aspect-video lg:aspect-auto"
        >
          {mainImage ? (
            <Image
              src={mainImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className={`w-full h-full min-h-[240px] bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <span className="text-8xl opacity-80 select-none group-hover:scale-110 transition-transform duration-500">
                {emoji}
              </span>
            </div>
          )}
          {/* Category badge */}
          <span
            className={`absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full ${getCategoryBadgeClass(category)}`}
          >
            {category}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20 hidden lg:block" />
        </Link>

        {/* Content */}
        <div className="flex flex-col justify-center p-6 lg:p-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-medium">
              Destaque
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <time dateTime={publishedAt} className="text-xs text-gray-400 font-medium">
              {formatDatePT(publishedAt.split("T")[0])}
            </time>
          </div>

          <Link href={`/noticias/${slug}`}>
            <h2 className="text-gray-900 font-black text-2xl lg:text-3xl leading-tight mb-4 hover:text-primary-medium transition-colors duration-150">
              {title}
            </h2>
          </Link>

          <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
            {excerpt}
          </p>

          <Link
            href={`/noticias/${slug}`}
            className="inline-flex items-center gap-2 self-start bg-primary-DEFAULT hover:bg-primary-medium text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors duration-200"
          >
            Leia a matéria completa
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
