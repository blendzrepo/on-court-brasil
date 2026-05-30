import { newsArticles } from "@/lib/mockData";
import FeaturedNews from "@/components/FeaturedNews";
import NewsCard from "@/components/NewsCard";
import Link from "next/link";

export default function HomePage() {
  const featured = newsArticles.find((a) => a.featured) ?? newsArticles[0];
  const rest = newsArticles.filter((a) => a.id !== featured.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Featured */}
      <section className="mb-12">
        <FeaturedNews article={featured} />
      </section>

      {/* Latest news */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide flex items-center gap-3">
            <span className="block w-1 h-6 rounded-full bg-primary-DEFAULT" />
            Últimas Notícias
          </h2>
          <Link
            href="/noticias"
            className="text-sm font-semibold text-primary-medium hover:text-primary-DEFAULT transition-colors duration-150"
          >
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mt-14 rounded-2xl bg-primary-DEFAULT text-white px-8 py-10 text-center">
        <h3 className="text-2xl font-black mb-2">Calendário de Torneios 2025</h3>
        <p className="text-primary-pale mb-6 max-w-xl mx-auto">
          Confira as datas de todos os Grand Slams, torneios ATP e WTA da temporada e nunca perca uma partida.
        </p>
        <Link
          href="/calendario"
          className="inline-flex items-center gap-2 bg-white text-primary-DEFAULT font-bold px-6 py-3 rounded-lg hover:bg-green-light transition-colors duration-200"
        >
          Ver Calendário Completo →
        </Link>
      </section>
    </div>
  );
}
