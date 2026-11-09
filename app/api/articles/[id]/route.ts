import { NextRequest, NextResponse } from 'next/server';
import { getArticleById, saveArticle, deleteArticle } from '@/lib/db';
import type { Article } from '@/lib/types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, props: Params) {
  const params = await props.params;
  const article = getArticleById(params.id);
  if (!article) {
    return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
  }
  return NextResponse.json(article);
}

export async function PUT(request: NextRequest, props: Params) {
  const params = await props.params;
  try {
    const existing = getArticleById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    }

    const body = await request.json() as Partial<Article>;
    const updated: Article = {
      ...existing,
      ...body,
      id: params.id,
      updatedAt: new Date().toISOString(),
    };

    saveArticle(updated);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar artigo' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, props: Params) {
  const params = await props.params;
  const existing = getArticleById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
  }
  deleteArticle(params.id);
  return new NextResponse(null, { status: 204 });
}
