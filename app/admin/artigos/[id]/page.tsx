"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";
import type { Article } from "@/lib/types";

export default function EditarArtigoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/articles/${params.id}`);
        if (!res.ok) throw new Error("Artigo não encontrado");
        const data = await res.json();
        setArticle(data);
      } catch {
        setError("Artigo não encontrado.");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchArticle();
  }, [params.id]);

  async function handleSave(data: Omit<Article, "id" | "updatedAt">) {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/articles/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Falha ao atualizar artigo");
      router.push("/admin/artigos");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-16">Carregando...</div>;
  }

  if (error || !article) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error || "Artigo não encontrado."}</p>
        <button
          onClick={() => router.push("/admin/artigos")}
          className="text-primary-medium font-semibold hover:underline"
        >
          Voltar para Notícias
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Editar Notícia</h1>
        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{article.title}</p>
      </div>
      <ArticleForm initialData={article} onSave={handleSave} isSaving={isSaving} />
    </div>
  );
}
