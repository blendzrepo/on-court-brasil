import { getArticles } from "@/lib/db";
import NewsCard from "@/components/NewsCard";
import type { NewsCategory } from "@/lib/types";
import { notFound } from "next/navigation";

const CATEGORIES: Record<string, { name: NewsCategory; title: string; description: string }> = {
  "grand-slam": {
    name: "Grand Slam",
    title: "Grand Slams",
    description: "Tudo sobre os quatro maiores torneios do tênis: Australian Open, Roland Garros, Wimbledon e US Open.",
  },
  atp: {
    name: "ATP",
    title: "ATP Tour",
    description: "Notícias do circuito masculino: Masters 1000, ATP 500, ATP 250 e rankings.",
  },
  wta: {
    name: "WTA",
    title: "WTA Tour",
    description: "Notícias do circuito feminino: WTA 1000, WTA 500, WTA 250 e rankings.",
  },
  brasil: {
    name: "Brasil",
    title: "Tênis Brasileiro",
    description: "Acompanhe os brasileiros no circuito mundial de tênis.",
  },
  internacional: {
    name: "Internacional",
    title: "Internacional",
    description: "Notícias e bastidores do tênis mundial.",
  },
};

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((categoria) => ({ categoria }));
}

export function generateMetadata({ params }: { params: { categoria: string } }) {
  const cat = CATEGORIES[params.categoria];
  if (!cat) return { title: "Categoria | On Court Brasil" };
  return {
    title: `${cat.title} | On Court Brasil`,
    description: cat.description,
  };
}

export default function CategoriaPage({ params }: { params: { categoria: string } }) {
  const cat = CATEGORIES[params.categoria];
  if (!cat) notFound();

  const articles = getArticles().filter(
    (a) => a.published && a.category === cat.name
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">{cat.title}</h1>
        <p className="text-gray-500">{cat.description}</p>
      </div>

      {articles.length === 0 ? (
        <p className="text-center text-gray-400 py-16">
          Nenhuma notícia encontrada nesta categoria.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
