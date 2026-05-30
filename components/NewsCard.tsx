import Link from "next/link";
import { NewsArticle, getCategoryBadgeClass, formatDatePT } from "@/lib/mockData";

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  const { title, excerpt, category, date, imageGradient, imageEmoji, slug } = article;

  return (
    <article className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm card-hover flex flex-col">
      {/* Image placeholder */}
      <Link href={`/noticias/${slug}`} className="block relative overflow-hidden aspect-video">
        <div
          className={`w-full h-full bg-gradient-to-br ${imageGradient} flex items-center justify-center`}
        >
          <span className="text-5xl opacity-80 select-none group-hover:scale-110 transition-transform duration-300">
            {imageEmoji}
          </span>
        </div>
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
          dateTime={date}
          className="text-xs text-gray-400 font-medium mb-2 block"
        >
          {formatDatePT(date)}
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
