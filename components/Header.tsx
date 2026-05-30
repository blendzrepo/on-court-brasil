"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Notícias" },
  { href: "/calendario", label: "Calendário" },
  { href: "/atp", label: "ATP" },
  { href: "/wta", label: "WTA" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-t-4 border-primary-DEFAULT">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-DEFAULT group-hover:bg-primary-medium transition-colors duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
                aria-hidden="true"
              >
                {/* Tennis ball SVG */}
                <circle cx="12" cy="12" r="10" fill="#ffffff" />
                <path
                  d="M12 2C9.5 2 7.2 3 5.5 4.7C7 6.5 8 9.1 8 12s-1 5.5-2.5 7.3C7.2 21 9.5 22 12 22s4.8-1 6.5-2.7C17 17.5 16 14.9 16 12s1-5.5 2.5-7.3C16.8 3 14.5 2 12 2Z"
                  fill="#D8F3DC"
                  opacity="0.7"
                />
                <path
                  d="M5.5 4.7C3.9 6.5 3 8.8 3 11.3c0 .2 0 .5 0 .7 1.5 0 2.8-.3 4-.8C7.5 9.6 6.7 7 5.5 4.7Z"
                  fill="#40916C"
                />
                <path
                  d="M18.5 4.7C17.3 7 16.5 9.6 17 11.2c1.2.5 2.5.8 4 .8 0-.2 0-.5 0-.7 0-2.5-.9-4.8-2.5-6.6Z"
                  fill="#40916C"
                />
                <path
                  d="M3 12.7c0 2.5.9 4.8 2.5 6.6C6.7 17 7.5 14.4 7 12.8c-1.2-.5-2.5-.8-4-.8 0 .2 0 .5 0 .7Z"
                  fill="#40916C"
                />
                <path
                  d="M18.5 19.3C20.1 17.5 21 15.2 21 12.7c0-.2 0-.5 0-.7-1.5 0-2.8.3-4 .8.5 1.6 1.3 4.2-.5 6.5Z"
                  fill="#40916C"
                />
              </svg>
            </span>
            <div className="leading-tight">
              <span className="block text-primary-DEFAULT font-black text-sm tracking-widest uppercase">
                On Court
              </span>
              <span className="block text-primary-light font-bold text-xs tracking-widest uppercase -mt-0.5">
                Brasil
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? "bg-primary-DEFAULT text-white"
                      : "text-gray-700 hover:bg-green-light hover:text-primary-DEFAULT"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            <span
              className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 origin-center ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-gray-700 transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 origin-center ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 pb-4">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-colors duration-150 ${
                      isActive
                        ? "bg-primary-DEFAULT text-white"
                        : "text-gray-700 hover:bg-green-light hover:text-primary-DEFAULT"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
