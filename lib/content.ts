import type { Article, SiteSettings, WPArticle, WPTournament } from './types';
import {
  DEFAULT_SETTINGS,
  getWPArticleBySlug,
  getWPArticles,
  getWPSettings,
  getWPTournaments,
  isWordPressConfigured,
} from './wp';
import { tournaments as localTournaments, type Tournament } from './mockData';
import { getArticleBySlug as getLocalArticleBySlug, getArticles as getLocalArticles } from './db';

/* -------------------------------------------------------------------------- */
/* View models                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The single article shape every page renders, whatever the backing store is.
 * Keeping WordPress and the legacy JSON store behind one type is what lets the
 * site fall back without any page knowing which source answered.
 */
export interface ContentArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  body: string; // HTML
  excerpt: string; // plain text
  mainImage: string;
  category: string;
  featured: boolean;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  source: 'wordpress' | 'local';
}

/** The single tournament shape the calendar renders. */
export interface ContentTournament {
  id: string;
  name: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  surface: string;
  category: string;
  prize: string;
  source: 'wordpress' | 'local';
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Remove HTML tags and collapse whitespace, for excerpts built from a body. */
function stripHtml(html: string): string {
  if (typeof html !== 'string' || html.length === 0) return '';
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain-text excerpt of at most `max` characters. */
function excerptFrom(html: string, max = 200): string {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

/** Why the local store is being used instead of the CMS. Logged once per call. */
function logFallback(what: string): void {
  console.info(`[content] WordPress returned no ${what} — falling back to local data.`);
}

function byNewestFirst(a: ContentArticle, b: ContentArticle): number {
  const left = Date.parse(a.publishedAt);
  const right = Date.parse(b.publishedAt);
  const leftValid = Number.isFinite(left);
  const rightValid = Number.isFinite(right);
  if (!leftValid && !rightValid) return 0;
  if (!leftValid) return 1;
  if (!rightValid) return -1;
  return right - left;
}

function byStartDateAscending(a: ContentTournament, b: ContentTournament): number {
  const left = Date.parse(a.startDate);
  const right = Date.parse(b.startDate);
  const leftValid = Number.isFinite(left);
  const rightValid = Number.isFinite(right);
  if (!leftValid && !rightValid) return 0;
  if (!leftValid) return 1;
  if (!rightValid) return -1;
  return left - right;
}

/* -------------------------------------------------------------------------- */
/* Mappers                                                                     */
/* -------------------------------------------------------------------------- */

function fromLocalArticle(article: Article): ContentArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    body: article.body,
    excerpt: excerptFrom(article.body, 200),
    mainImage: article.mainImage,
    category: article.category,
    featured: article.featured,
    publishedAt: article.publishedAt,
    seoTitle: '',
    seoDescription: '',
    source: 'local',
  };
}

function fromWPArticle(article: WPArticle): ContentArticle {
  return {
    id: String(article.id),
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    body: article.body,
    excerpt: article.excerpt,
    mainImage: article.mainImage,
    category: article.category,
    featured: article.featured,
    publishedAt: article.publishedAt,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    source: 'wordpress',
  };
}

function fromLocalTournament(tournament: Tournament): ContentTournament {
  return {
    id: tournament.id,
    name: tournament.name,
    location: tournament.location,
    country: tournament.country,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    surface: tournament.surface,
    category: tournament.category,
    prize: tournament.prize ?? '',
    source: 'local',
  };
}

function fromWPTournament(tournament: WPTournament): ContentTournament {
  return {
    id: String(tournament.id),
    name: tournament.name,
    location: tournament.location,
    country: tournament.country,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    surface: tournament.surface,
    category: tournament.category,
    prize: tournament.prize,
    source: 'wordpress',
  };
}

/* -------------------------------------------------------------------------- */
/* Local sources                                                               */
/* -------------------------------------------------------------------------- */

function localArticles(limit?: number): ContentArticle[] {
  const articles = getLocalArticles()
    .filter((article) => article.published)
    .map(fromLocalArticle)
    .sort(byNewestFirst);
  return typeof limit === 'number' && limit > 0 ? articles.slice(0, limit) : articles;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Published articles, newest first.
 *
 * A configured-but-empty CMS (freshly installed, nothing published) falls back
 * to the local store rather than blanking the site.
 */
export async function getContentArticles(limit?: number): Promise<ContentArticle[]> {
  if (!isWordPressConfigured()) return localArticles(limit);

  const wpArticles = await getWPArticles(limit);
  if (wpArticles.length === 0) {
    logFallback('articles');
    return localArticles(limit);
  }

  return wpArticles.map(fromWPArticle).sort(byNewestFirst);
}

/** A single published article, or `null` when it exists in neither source. */
export async function getContentArticleBySlug(slug: string): Promise<ContentArticle | null> {
  const fromLocal = (): ContentArticle | null => {
    const article = getLocalArticleBySlug(slug);
    if (!article || !article.published) return null;
    return fromLocalArticle(article);
  };

  if (!isWordPressConfigured()) return fromLocal();

  const wpArticle = await getWPArticleBySlug(slug);
  if (wpArticle === null) {
    logFallback(`article "${slug}"`);
    return fromLocal();
  }

  return fromWPArticle(wpArticle);
}

/** Published articles in one category, matched case-insensitively, newest first. */
export async function getContentArticlesByCategory(
  categoryName: string
): Promise<ContentArticle[]> {
  const wanted = typeof categoryName === 'string' ? categoryName.trim().toLowerCase() : '';
  const matches = (article: ContentArticle) => article.category.trim().toLowerCase() === wanted;

  if (!isWordPressConfigured()) return localArticles().filter(matches);

  const wpArticles = await getWPArticles();
  if (wpArticles.length === 0) {
    logFallback('articles');
    return localArticles().filter(matches);
  }

  return wpArticles.map(fromWPArticle).filter(matches).sort(byNewestFirst);
}

/** Tournaments ordered by start date, ascending. */
export async function getContentTournaments(): Promise<ContentTournament[]> {
  const fromLocal = () => localTournaments.map(fromLocalTournament).sort(byStartDateAscending);

  if (!isWordPressConfigured()) return fromLocal();

  const wpTournaments = await getWPTournaments();
  if (wpTournaments.length === 0) {
    logFallback('tournaments');
    return fromLocal();
  }

  return wpTournaments.map(fromWPTournament).sort(byStartDateAscending);
}

/**
 * Site settings. There is no local equivalent, so an unconfigured or
 * unreachable CMS yields the built-in defaults (every ad slot disabled).
 */
export async function getContentSettings(): Promise<SiteSettings> {
  if (!isWordPressConfigured()) return DEFAULT_SETTINGS;
  return getWPSettings();
}
