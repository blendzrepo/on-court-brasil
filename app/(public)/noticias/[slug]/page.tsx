import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getArticles, getArticleBySlug } from "@/lib/db";
import { getCategoryBadgeClass, formatDatePT } from "@/lib/mockData";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const articles = getArticles();
  return articles
    .filter((a) => a.published)
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} | On Court Brasil`,
    description: article.subtitle,
  };
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug);

  if (!article || !article.published) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-primary-medium hover:text-primary-DEFAULT font-semibold mb-8 transition-colors duration-150"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </Link>

      {/* Article header */}
      <header className="mb-8">
        {/* Category badge */}
        <span
          className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4 ${getCategoryBadgeClass(article.category)}`}
        >
          {article.category}
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-lg text-gray-600 leading-relaxed mb-4">
            {article.subtitle}
          </p>
        )}

        <time
          dateTime={article.publishedAt}
          className="text-sm text-gray-400 font-medium"
        >
          {formatDatePT(article.publishedAt.split("T")[0])}
        </time>
      </header>

      {/* Main image */}
      {article.mainImage && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8">
          <Image
            src={article.mainImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Article body */}
      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: article.body }}
      />
    </div>
  );
}
