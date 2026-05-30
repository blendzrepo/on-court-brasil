import { getArticles } from "@/lib/db";
import NewsCard from "@/components/NewsCard";

export const metadata = {
  title: "Todas as Notícias | On Court Brasil",
  description: "Todas as notícias de tênis do mundo em português.",
};

export default function NoticiasPage() {
  const articles = getArticles().filter((a) => a.published);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Todas as Notícias</h1>
        <p className="text-gray-500">
          Acompanhe todas as notícias do tênis mundial em português.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="text-center text-gray-400 py-16">Nenhuma notícia encontrada.</p>
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
