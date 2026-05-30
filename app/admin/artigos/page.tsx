"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const categoryColors: Record<string, string> = {
  "Grand Slam": "bg-yellow-100 text-yellow-800",
  "ATP": "bg-blue-100 text-blue-800",
  "WTA": "bg-pink-100 text-pink-800",
  "Brasil": "bg-green-100 text-green-800",
  "Internacional": "bg-purple-100 text-purple-800",
};

export default function AdminArtigosPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles");
      if (!res.ok) throw new Error("Falha ao buscar artigos");
      const data = await res.json();
      setArticles(data);
    } catch {
      setError("Erro ao carregar artigos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Tem certeza que deseja excluir "${title}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Erro ao excluir artigo.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePublished(article: Article) {
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !article.published }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar");
      const updated = await res.json();
      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch {
      alert("Erro ao atualizar status.");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Notícias</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {articles.length} artigo{articles.length !== 1 ? "s" : ""} no total
          </p>
        </div>
        <Link
          href="/admin/artigos/novo"
          className="inline-flex items-center gap-2 bg-primary-DEFAULT hover:bg-primary-medium text-white font-bold px-5 py-2.5 rounded-lg transition-colors duration-200 text-sm"
        >
          + Nova Notícia
        </Link>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center text-gray-400 py-16">Carregando...</div>
      ) : articles.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-lg mb-4">Nenhum artigo encontrado.</p>
          <Link
            href="/admin/artigos/novo"
            className="inline-flex items-center gap-2 bg-primary-DEFAULT text-white font-bold px-5 py-2.5 rounded-lg text-sm"
          >
            Criar primeiro artigo
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Título
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Categoria
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Data
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors duration-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {article.featured && (
                        <span className="text-yellow-500 text-sm" title="Destaque">★</span>
                      )}
                      <span className="font-medium text-gray-900 text-sm line-clamp-2 max-w-xs">
                        {article.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        categoryColors[article.category] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {article.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-gray-500">
                      {formatDate(article.publishedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleTogglePublished(article)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors duration-150 ${
                        article.published
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={article.published ? "Clique para despublicar" : "Clique para publicar"}
                    >
                      {article.published ? "Publicado" : "Rascunho"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/artigos/${article.id}`}
                        className="text-sm font-medium text-primary-medium hover:text-primary-DEFAULT transition-colors duration-150"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id, article.title)}
                        disabled={deletingId === article.id}
                        className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors duration-150 disabled:opacity-50"
                      >
                        {deletingId === article.id ? "..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
