import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-DEFAULT">
                <span className="text-white text-sm">🎾</span>
              </div>
              <div className="leading-tight">
                <span className="block text-white font-black text-sm tracking-widest uppercase">
                  On Court
                </span>
                <span className="block text-primary-lighter font-bold text-xs tracking-widest uppercase -mt-0.5">
                  Brasil
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              O melhor do tênis mundial em português. Notícias, resultados,
              rankings e calendário de torneios.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold uppercase tracking-wider text-xs mb-4">
              Navegação
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Notícias" },
                { href: "/calendario", label: "Calendário de Torneios" },
                { href: "/atp", label: "Circuit ATP" },
                { href: "/wta", label: "Circuit WTA" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-primary-lighter transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold uppercase tracking-wider text-xs mb-4">
              Categorias
            </h3>
            <ul className="space-y-2">
              {["Grand Slam", "ATP", "WTA", "Brasil", "Internacional"].map(
                (cat) => (
                  <li key={cat}>
                    <span className="text-sm text-gray-400">{cat}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            &copy; {year} On Court Brasil. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-600">
            Feito com paixão pelo tênis 🎾
          </p>
        </div>
      </div>
    </footer>
  );
}
