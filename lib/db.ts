import fs from 'fs';
import path from 'path';
import type { Article } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'articles.json');

function readDb(): Article[] {
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw) as Article[];
}

function writeDb(articles: Article[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(articles, null, 2), 'utf-8');
}

export function getArticles(): Article[] {
  const articles = readDb();
  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getArticleBySlug(slug: string): Article | null {
  const articles = readDb();
  return articles.find((a) => a.slug === slug) ?? null;
}

export function getArticleById(id: string): Article | null {
  const articles = readDb();
  return articles.find((a) => a.id === id) ?? null;
}

export function saveArticle(article: Article): void {
  const articles = readDb();
  const index = articles.findIndex((a) => a.id === article.id);
  if (index >= 0) {
    articles[index] = article;
  } else {
    articles.push(article);
  }
  writeDb(articles);
}

export function deleteArticle(id: string): void {
  const articles = readDb();
  const filtered = articles.filter((a) => a.id !== id);
  writeDb(filtered);
}
