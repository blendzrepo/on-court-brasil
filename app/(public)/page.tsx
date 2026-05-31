import { getArticles } from "@/lib/db";
import FeaturedNews from "@/components/FeaturedNews";
import NewsCard from "@/components/NewsCard";
import AdBanner from "@/components/AdBanner";
import Link from "next/link";
import Image from "next/image";
import { getCategoryBadgeClass, formatDatePT } from "@/lib/mockData";

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

const miniGradients: Record<string, string> = {
  "Grand Slam": "from-yellow-500 to-amber-700",
  "ATP": "from-blue-500 to-blue-800",
  "WTA": "from-pink-500 to-rose-700",
  "Brasil": "from-green-500 to-emerald-700",
  "Internacional": "from-purple-500 to-violet-700",
};

export default function HomePage() {
  const allArticles = getArticles().filter((a) => a.published);
  const featured = allArticles.find((a) => a.featured) ?? allArticles[0];
  const rest = allArticles.filter((a) => a.id !== featured.id);
  const highlights = rest.slice(0, 3);
  const latest = rest.slice(3, 9);

  return (
    <>
      {/* Ad slot 1 — Leaderboard */}
      <div className="bg-gray-50 border-b border-gray-200 py-3">
        <AdBanner slot="leaderboard" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Featured */}
        <section className="mb-8">
          <FeaturedNews article={featured} />
        </section>

        {/* Secondary highlights row */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="block w-1 h-5 rounded-full bg-primary-DEFAULT" />
            <h2 className="text-base font-black text-gray-900 uppercase tracking-wide">Outros Destaques</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {highlights.map((article) => (
              <Link key={article.id} href={`/noticias/${article.slug}`} className="group relative overflow-hidden rounded-xl shadow-sm">
                <div className="relative h-44">
                  {article.mainImage ? (
                    <Image src={article.mainImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${miniGradients[article.category] ?? "from-gray-500 to-gray-700"}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full self-start mb-2 ${getCategoryBadgeClass(article.category)}`}>
                      {article.category}
                    </span>
                    <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Ad slot 2 — Rectangle */}
        <div className="flex justify-center mb-8">
          <AdBanner slot="rectangle" />
        </div>

        {/* Latest news */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide flex items-center gap-3">
              <span className="block w-1 h-6 rounded-full bg-primary-DEFAULT" />
              Últimas Notícias
            </h2>
            <Link href="/noticias" className="text-sm font-semibold text-primary-medium hover:text-primary-DEFAULT transition-colors">
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        {/* Ad slot 3 — Large rectangle */}
        <div className="flex justify-center mb-10">
          <AdBanner slot="large-rectangle" />
        </div>

        {/* CTA Calendar */}
        <section className="rounded-2xl bg-primary-DEFAULT text-white px-8 py-10 text-center">
          <h3 className="text-2xl font-black mb-2">Calendário de Torneios 2026</h3>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Confira as datas de todos os Grand Slams, torneios ATP e WTA da temporada e nunca perca uma partida.
          </p>
          <Link
            href="/calendario"
            className="inline-flex items-center gap-2 bg-white text-primary-DEFAULT font-bold px-6 py-3 rounded-lg hover:bg-amber-300 transition-colors"
          >
            Ver Calendário Completo →
          </Link>
        </section>
      </div>
    </>
  );
}
