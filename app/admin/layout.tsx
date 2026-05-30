"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navLinks = [
  { href: "/admin/artigos", label: "Notícias", icon: "📰" },
  { href: "/admin/calendario", label: "Calendário", icon: "📅" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/admin/artigos" className="block">
            <span className="block text-primary-DEFAULT font-black text-sm tracking-widest uppercase">
              On Court Brasil
            </span>
            <span className="block text-primary-light font-semibold text-xs tracking-widest uppercase mt-0.5">
              Área Admin
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                  isActive
                    ? "bg-primary-DEFAULT text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-primary-DEFAULT"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors duration-150"
          >
            <span>🌐</span>
            Ver site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors duration-150"
          >
            <span>🚪</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/admin/artigos" className="font-black text-primary-DEFAULT text-sm uppercase tracking-widest">
          OCB Admin
        </Link>
        <div className="flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors duration-150 ${
                pathname.startsWith(link.href)
                  ? "bg-primary-DEFAULT text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:p-8 pt-16 md:pt-8 p-4 overflow-auto">
        {children}
      </main>
    </div>
  );
}
