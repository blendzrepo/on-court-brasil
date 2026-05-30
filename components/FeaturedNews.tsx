import Link from "next/link";
import { NewsArticle, getCategoryBadgeClass, formatDatePT } from "@/lib/mockData";

interface FeaturedNewsProps {
  article: NewsArticle;
}

export default function FeaturedNews({ article }: FeaturedNewsProps) {
  const { title, excerpt, category, date, imageGradient, imageEmoji, slug } = article;

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-md border border-gray-100 card-hover">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[360px]">
        {/* Image */}
        <Link
          href={`/noticias/${slug}`}
          className="relative overflow-hidden aspect-video lg:aspect-auto"
        >
          <div
            className={`w-full h-full min-h-[240px] bg-gradient-to-br ${imageGradient} flex items-center justify-center`}
          >
            <span className="text-8xl opacity-80 select-none group-hover:scale-110 transition-transform duration-500">
              {imageEmoji}
            </span>
          </div>
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
            <time dateTime={date} className="text-xs text-gray-400 font-medium">
              {formatDatePT(date)}
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
