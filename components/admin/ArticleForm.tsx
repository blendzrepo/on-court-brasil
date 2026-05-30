"use client";

import { useState, useEffect, ChangeEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { Article, NewsCategory } from "@/lib/types";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-lg min-h-[400px] flex items-center justify-center text-gray-400 bg-gray-50">
      Carregando editor...
    </div>
  ),
});

const CATEGORIES: NewsCategory[] = ["Grand Slam", "ATP", "WTA", "Brasil", "Internacional"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[ñ]/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ArticleFormProps {
  initialData?: Partial<Article>;
  onSave: (data: Omit<Article, "id" | "updatedAt">) => Promise<void>;
  isSaving: boolean;
}

export default function ArticleForm({ initialData, onSave, isSaving }: ArticleFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle ?? "");
  const [category, setCategory] = useState<NewsCategory>(initialData?.category ?? "ATP");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [mainImage, setMainImage] = useState(initialData?.mainImage ?? "");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [body, setBody] = useState(initialData?.body ?? "");
  const [publishedAt, setPublishedAt] = useState(
    initialData?.publishedAt
      ? initialData.publishedAt.split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug from title unless manually overridden
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Falha ao fazer upload");
      const data = await res.json();
      setMainImage(data.url);
    } catch {
      alert("Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("O título é obrigatório.");
      return;
    }
    if (!slug.trim()) {
      setError("O slug é obrigatório.");
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim(),
        category,
        slug: slug.trim(),
        mainImage,
        featured,
        published,
        body,
        publishedAt: new Date(publishedAt + "T00:00:00.000Z").toISOString(),
      });
    } catch {
      setError("Erro ao salvar artigo. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Título da notícia"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent transition"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Subtítulo
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Uma frase descritiva sobre a notícia"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent transition"
        />
      </div>

      {/* Category + Date row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Categoria <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as NewsCategory)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent transition"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Data de publicação
          </label>
          <input
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          URL personalizada (slug)
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManual(true);
          }}
          placeholder="url-da-noticia"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent transition font-mono"
        />
        {slug && (
          <p className="text-xs text-gray-400 mt-1">
            Preview: <span className="text-primary-medium">oncourt.com.br/noticias/{slug}</span>
          </p>
        )}
        {slugManual && (
          <button
            type="button"
            onClick={() => {
              setSlugManual(false);
              setSlug(slugify(title));
            }}
            className="text-xs text-gray-400 hover:text-primary-medium mt-1 underline"
          >
            Gerar automaticamente do título
          </button>
        )}
      </div>

      {/* Main image */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Foto principal
        </label>
        <div className="flex items-start gap-4">
          {mainImage && (
            <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
              <Image src={mainImage} alt="Preview" fill className="object-cover" />
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-DEFAULT file:text-white hover:file:bg-primary-medium disabled:opacity-50"
            />
            {uploading && (
              <p className="text-xs text-gray-400 mt-1">Enviando imagem...</p>
            )}
            {mainImage && (
              <button
                type="button"
                onClick={() => setMainImage("")}
                className="text-xs text-red-500 hover:text-red-700 mt-1 underline"
              >
                Remover imagem
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-DEFAULT focus:ring-primary-DEFAULT"
          />
          <span className="text-sm font-medium text-gray-700">Marcar como destaque</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-DEFAULT focus:ring-primary-DEFAULT"
          />
          <span className="text-sm font-medium text-gray-700">
            Publicar{" "}
            <span className="text-gray-400 font-normal">(desmarcado = rascunho)</span>
          </span>
        </label>
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Corpo da notícia
        </label>
        <RichTextEditor value={body} onChange={setBody} />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-primary-DEFAULT hover:bg-primary-medium text-white font-bold px-8 py-2.5 rounded-lg transition-colors duration-200 disabled:opacity-60"
        >
          {isSaving ? "Salvando..." : "Salvar Notícia"}
        </button>
        <a
          href="/admin/artigos"
          className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors duration-150"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
