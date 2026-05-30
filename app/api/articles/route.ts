import { NextRequest, NextResponse } from 'next/server';
import { getArticles, saveArticle } from '@/lib/db';
import type { Article } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const articles = getArticles();
  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<Article, 'id' | 'updatedAt'>;
    const now = new Date().toISOString();

    const article: Article = {
      ...body,
      id: `art-${uuidv4().slice(0, 8)}`,
      publishedAt: body.publishedAt || now,
      updatedAt: now,
    };

    saveArticle(article);
    return NextResponse.json(article, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar artigo' }, { status: 500 });
  }
}
