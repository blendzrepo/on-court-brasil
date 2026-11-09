import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import config from '@payload-config';

import type {
  Article as PayloadArticle,
  Tournament as PayloadTournament,
} from '@/payload-types';
import type { Article, SiteSettings } from './types';
import { CONTENT_TAG, SETTINGS_TAG } from './revalidate';
import { tournaments as localTournaments, type Tournament } from './mockData';
import { getArticleBySlug as getLocalArticleBySlug, getArticles as getLocalArticles } from './db';

/* -------------------------------------------------------------------------- */
/* View models                                                                 */
/* -------------------------------------------------------------------------- */

/** The Lexical editor state Payload stores in `articles.body`. */
export type ArticleBody = PayloadArticle['body'];

/**
 * The single article shape every page renders, whatever the backing store is.
 * Keeping Payload and the legacy JSON store behind one type is what lets the
 * site fall back without any page knowing which source answered.
 */
export interface ContentArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  /**
   * Lexical rich text, set only for `source: 'payload'` articles. Rendered with
   * `<RichText>` from `@payloadcms/richtext-lexical/react`.
   */
  body: ArticleBody | null;
  /**
   * HTML, set only for `source: 'local'` articles (the JSON fallback store,
   * which predates Payload and has no Lexical equivalent).
   */
  bodyHtml?: string;
  excerpt: string; // plain text
  mainImage: string;
  category: string;
  featured: boolean;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  source: 'payload' | 'local';
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
  source: 'payload' | 'local';
}

/** Every ad slot disabled and the built-in site identity. */
const DEFAULT_SETTINGS: SiteSettings = {
  ads: {
    leaderboard: { enabled: false, code: '' },
    rectangle: { enabled: false, code: '' },
    large_rectangle: { enabled: false, code: '' },
  },
  site: {
    title: 'On Court Brasil',
    description: '',
  },
};

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

/** Cut `text` to at most `max` characters, on no particular boundary. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

/** Plain-text excerpt of at most `max` characters, from an HTML body. */
function excerptFromHtml(html: string, max = 200): string {
  return truncate(stripHtml(html), max);
}

/**
 * Concatenate the `text` of one Lexical node and everything below it.
 *
 * Inline runs (bold, links, plain text) are joined with nothing so
 * "muito" + "importante" does not gain a space it never had; separating the
 * blocks is left to the caller.
 */
function nodeToText(node: unknown): string {
  if (node === null || typeof node !== 'object') return '';

  const record = node as Record<string, unknown>;

  if (typeof record.text === 'string') return record.text;

  if (Array.isArray(record.children)) {
    return record.children.map(nodeToText).join('');
  }

  return '';
}

/** Plain-text excerpt of at most `max` characters, from a Lexical body. */
function excerptFromLexical(body: unknown, max = 200): string {
  if (body === null || typeof body !== 'object') return '';

  const root = (body as Record<string, unknown>).root;
  if (root === null || typeof root !== 'object') return '';

  const children = (root as Record<string, unknown>).children;
  const blocks = Array.isArray(children) ? children : [];

  const text = blocks
    .map(nodeToText)
    .filter((block) => block.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return truncate(text, max);
}

/**
 * The `YYYY-MM-DD` part of a date.
 *
 * `ContentTournament` dates have always been date-only, and `formatDateRangePT`
 * relies on it — it appends `T00:00:00` to read them as local midnight, which
 * turns Payload's full `2026-02-09T00:00:00.000Z` into an Invalid Date. The
 * `dayOnly` picker stores midnight UTC, so the UTC date part is the day the
 * editor chose.
 */
function toDateOnly(value: unknown): string {
  if (typeof value !== 'string' || value === '') return '';
  return value.slice(0, 10);
}

/**
 * The URL of an `upload` field, which Payload returns either as a bare id or as
 * the populated document depending on the query `depth`. Every read here uses
 * `depth: 1`, so the object branch is the expected one; the id branch only
 * guards against a relationship pointing at a deleted file.
 */
function uploadUrl(value: unknown): string {
  if (value === null || typeof value !== 'object') return '';
  const url = (value as Record<string, unknown>).url;
  return typeof url === 'string' ? url : '';
}

/** Why the local store is being used instead of Payload. Logged once per call. */
function logFallback(what: string, error?: unknown): void {
  const reason = error instanceof Error ? ` (${error.message})` : '';
  console.info(`[content] Payload returned no ${what} — falling back to local data.${reason}`);
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
    body: null,
    bodyHtml: article.body,
    excerpt: excerptFromHtml(article.body, 200),
    mainImage: article.mainImage,
    category: article.category,
    featured: article.featured,
    publishedAt: article.publishedAt,
    seoTitle: '',
    seoDescription: '',
    source: 'local',
  };
}

function fromPayloadArticle(article: PayloadArticle): ContentArticle {
  return {
    id: String(article.id),
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle ?? '',
    body: article.body ?? null,
    excerpt: excerptFromLexical(article.body, 200),
    mainImage: uploadUrl(article.mainImage),
    category: article.category,
    featured: article.featured ?? false,
    publishedAt: article.publishedAt,
    seoTitle: article.seoTitle ?? '',
    seoDescription: article.seoDescription ?? '',
    source: 'payload',
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

function fromPayloadTournament(tournament: PayloadTournament): ContentTournament {
  return {
    id: String(tournament.id),
    name: tournament.name,
    location: tournament.location,
    country: tournament.country,
    startDate: toDateOnly(tournament.startDate),
    endDate: toDateOnly(tournament.endDate),
    surface: tournament.surface,
    category: tournament.category,
    prize: tournament.prize ?? '',
    source: 'payload',
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

function localTournamentList(): ContentTournament[] {
  return localTournaments.map(fromLocalTournament).sort(byStartDateAscending);
}

/* -------------------------------------------------------------------------- */
/* Payload reads                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Only published documents reach the public site.
 *
 * `draft: false` is NOT what does this. With `versions.drafts` enabled, the
 * collection table holds the latest saved document — draft included — and
 * `draft: false` only stops Payload merging the newest draft *version* over it.
 * Access control would filter drafts out, but the Local API defaults to
 * `overrideAccess: true`, so it never runs. The explicit `where` below is
 * therefore the one thing standing between an unpublished draft and the
 * homepage.
 */
const PUBLISHED_ONLY = { _status: { equals: 'published' } } as const;

/**
 * `depth: 1` populates `mainImage` so the mapper can read its `url`; anything
 * deeper would pull in relationships no page renders.
 */
const DEPTH = 1;

const loadArticles = unstable_cache(
  async (): Promise<ContentArticle[]> => {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'articles',
      where: PUBLISHED_ONLY,
      depth: DEPTH,
      // Payload caps `limit` at 10 by default; 0 disables paging entirely.
      limit: 0,
      pagination: false,
      sort: '-publishedAt',
    });

    return result.docs.map(fromPayloadArticle).sort(byNewestFirst);
  },
  ['payload-articles'],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

const loadArticleBySlug = unstable_cache(
  async (slug: string): Promise<ContentArticle | null> => {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'articles',
      where: {
        and: [PUBLISHED_ONLY, { slug: { equals: slug } }],
      },
      depth: DEPTH,
      limit: 1,
      pagination: false,
    });

    const doc = result.docs[0];
    return doc ? fromPayloadArticle(doc) : null;
  },
  ['payload-article-by-slug'],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

const loadTournaments = unstable_cache(
  async (): Promise<ContentTournament[]> => {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'tournaments',
      depth: 0,
      limit: 0,
      pagination: false,
      sort: 'startDate',
    });

    return result.docs.map(fromPayloadTournament).sort(byStartDateAscending);
  },
  ['payload-tournaments'],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

const loadSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const payload = await getPayload({ config });
    const global = await payload.findGlobal({ slug: 'site-settings', depth: 0 });

    const ads = global?.ads;

    return {
      ads: {
        leaderboard: {
          enabled: ads?.leaderboard?.enabled ?? false,
          code: ads?.leaderboard?.code ?? '',
        },
        rectangle: {
          enabled: ads?.rectangle?.enabled ?? false,
          code: ads?.rectangle?.code ?? '',
        },
        // The global names this slot `largeRectangle`; the front-end type has
        // used `large_rectangle` since the JSON days. Mapped, not renamed, so
        // the ad components stay untouched.
        large_rectangle: {
          enabled: ads?.largeRectangle?.enabled ?? false,
          code: ads?.largeRectangle?.code ?? '',
        },
      },
      site: {
        title: global?.site?.title || DEFAULT_SETTINGS.site.title,
        description: global?.site?.description ?? '',
      },
    };
  },
  ['payload-settings'],
  { tags: [SETTINGS_TAG], revalidate: 300 }
);

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Published articles, newest first.
 *
 * An unreachable or empty Payload falls back to the local JSON store rather
 * than blanking the site. None of these functions throw: a database outage
 * degrades the site to its last-known-good content instead of 500-ing.
 */
export async function getContentArticles(limit?: number): Promise<ContentArticle[]> {
  try {
    const articles = await loadArticles();
    if (articles.length === 0) {
      logFallback('articles');
      return localArticles(limit);
    }
    return typeof limit === 'number' && limit > 0 ? articles.slice(0, limit) : articles;
  } catch (error) {
    logFallback('articles', error);
    return localArticles(limit);
  }
}

/** A single published article, or `null` when it exists in neither source. */
export async function getContentArticleBySlug(slug: string): Promise<ContentArticle | null> {
  const fromLocal = (): ContentArticle | null => {
    const article = getLocalArticleBySlug(slug);
    if (!article || !article.published) return null;
    return fromLocalArticle(article);
  };

  try {
    const article = await loadArticleBySlug(slug);
    if (article === null) {
      // Absent from Payload is not the same as Payload being down, but the
      // local store is the only other place the article could live.
      return fromLocal();
    }
    return article;
  } catch (error) {
    logFallback(`article "${slug}"`, error);
    return fromLocal();
  }
}

/** Published articles in one category, matched case-insensitively, newest first. */
export async function getContentArticlesByCategory(
  categoryName: string
): Promise<ContentArticle[]> {
  const wanted = typeof categoryName === 'string' ? categoryName.trim().toLowerCase() : '';
  const matches = (article: ContentArticle) => article.category.trim().toLowerCase() === wanted;

  try {
    const articles = await loadArticles();
    if (articles.length === 0) {
      logFallback('articles');
      return localArticles().filter(matches);
    }
    return articles.filter(matches);
  } catch (error) {
    logFallback('articles', error);
    return localArticles().filter(matches);
  }
}

/** Tournaments ordered by start date, ascending. */
export async function getContentTournaments(): Promise<ContentTournament[]> {
  try {
    const tournaments = await loadTournaments();
    if (tournaments.length === 0) {
      logFallback('tournaments');
      return localTournamentList();
    }
    return tournaments;
  } catch (error) {
    logFallback('tournaments', error);
    return localTournamentList();
  }
}

/**
 * Site settings from the `site-settings` global. There is no local equivalent,
 * so an unreachable Payload yields the built-in defaults (every ad slot
 * disabled), which is the safe state: a missing ad is invisible, a broken one
 * is not.
 */
export async function getContentSettings(): Promise<SiteSettings> {
  try {
    return await loadSettings();
  } catch (error) {
    logFallback('settings', error);
    return DEFAULT_SETTINGS;
  }
}
