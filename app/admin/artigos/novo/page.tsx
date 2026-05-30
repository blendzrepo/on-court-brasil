"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";
import type { Article } from "@/lib/types";

export default function NovoArtigoPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(data: Omit<Article, "id" | "updatedAt">) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Falha ao criar artigo");
      router.push("/admin/artigos");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Nova Notícia</h1>
        <p className="text-sm text-gray-500 mt-0.5">Crie um novo artigo para o site</p>
      </div>
      <ArticleForm onSave={handleSave} isSaving={isSaving} />
    </div>
  );
}
