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

interface NewsCardProps {
  article: Article;
}

export default function NewsCard({ article }: NewsCardProps) {
  const { title, body, category, publishedAt, mainImage, slug } = article;
  const excerpt = stripHtml(body).slice(0, 150) + (stripHtml(body).length > 150 ? "..." : "");
  const gradient = categoryGradients[category] ?? "from-gray-400 to-gray-600";
  const emoji = categoryEmoji[category] ?? "🎾";

  return (
    <article className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm card-hover flex flex-col">
      {/* Image */}
      <Link href={`/noticias/${slug}`} className="block relative overflow-hidden aspect-video">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <span className="text-5xl opacity-80 select-none group-hover:scale-110 transition-transform duration-300">
              {emoji}
            </span>
          </div>
        )}
        {/* Category badge overlay */}
        <span
          className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${getCategoryBadgeClass(category)}`}
        >
          {category}
        </span>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <time
          dateTime={publishedAt}
          className="text-xs text-gray-400 font-medium mb-2 block"
        >
          {formatDatePT(publishedAt.split("T")[0])}
        </time>

        <Link href={`/noticias/${slug}`} className="group/title flex-1">
          <h2 className="text-gray-900 font-bold text-base leading-snug mb-2 group-hover/title:text-primary-medium transition-colors duration-150 line-clamp-3">
            {title}
          </h2>
        </Link>

        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
          {excerpt}
        </p>

        <Link
          href={`/noticias/${slug}`}
          className="inline-flex items-center gap-1 text-primary-medium font-semibold text-sm hover:text-primary-DEFAULT transition-colors duration-150 mt-auto"
        >
          Leia mais
          <svg
            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150"
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
    </article>
  );
}
