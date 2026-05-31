import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types";
import { getCategoryBadgeClass, formatDatePT } from "@/lib/mockData";

const categoryGradients: Record<string, string> = {
  "Grand Slam": "from-yellow-600 to-amber-800",
  "ATP": "from-blue-600 to-blue-900",
  "WTA": "from-pink-600 to-rose-800",
  "Brasil": "from-green-600 to-emerald-900",
  "Internacional": "from-purple-600 to-violet-900",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

export default function FeaturedNews({ article }: { article: Article }) {
  const { title, subtitle, body, category, publishedAt, mainImage, slug } = article;
  const excerpt = stripHtml(body).slice(0, 180) + "...";
  const gradient = categoryGradients[category] ?? "from-gray-700 to-gray-900";

  return (
    <article className="group relative w-full overflow-hidden rounded-2xl shadow-lg">
      {/* Background image or gradient */}
      <div className="relative w-full h-[340px] sm:h-[460px] lg:h-[540px]">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={title}
            fill
            priority
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 lg:p-10">
        {/* Category badge */}
        <div className="mb-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${getCategoryBadgeClass(category)}`}>
            {category}
          </span>
          <span className="ml-3 text-white/50 text-xs font-medium">
            {formatDatePT(publishedAt.split("T")[0])}
          </span>
        </div>

        {/* Title */}
        <Link href={`/noticias/${slug}`}>
          <h2 className="text-white font-black text-2xl sm:text-3xl lg:text-5xl leading-tight mb-3 hover:text-amber-300 transition-colors duration-150 line-clamp-3">
            {title}
          </h2>
        </Link>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-white/75 text-sm sm:text-base lg:text-lg mb-5 line-clamp-2 max-w-3xl">
            {subtitle}
          </p>
        )}

        {/* CTA */}
        <Link
          href={`/noticias/${slug}`}
          className="inline-flex items-center gap-2 self-start bg-white text-primary-DEFAULT font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-amber-300 transition-colors duration-200"
        >
          Leia a matéria completa
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
