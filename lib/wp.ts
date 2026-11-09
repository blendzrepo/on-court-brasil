import type {
  AdSlotConfig,
  SiteSettings,
  WPArticle,
  WPTournament,
} from './types';

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

/** How long (seconds) Next.js may serve a cached WordPress response. */
const REVALIDATE_SECONDS = 300;

/** Cache tag applied to every WordPress request, for on-demand revalidation. */
const CONTENT_TAG = 'wp-content';

/** Extra cache tag applied to the settings request. */
const SETTINGS_TAG = 'wp-settings';

/** WordPress caps `per_page` at 100. */
const MAX_PER_PAGE = 100;

/** Returned by `getWPSettings()` whenever WordPress cannot be reached. */
export const DEFAULT_SETTINGS: SiteSettings = {
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

/** Base URL of the WordPress install, without a trailing slash. */
function getBaseUrl(): string {
  const raw = process.env.WORDPRESS_API_URL;
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\/+$/, '');
}

/** True when `WORDPRESS_API_URL` is set to a non-empty string. */
export function isWordPressConfigured(): boolean {
  return getBaseUrl().length > 0;
}

/* -------------------------------------------------------------------------- */
/* HTML helpers                                                               */
/* -------------------------------------------------------------------------- */

/** The entities WordPress emits most often in titles and excerpts. */
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&#39;': "'",
  '&apos;': "'",
  '&#8216;': '‘',
  '&#8217;': '’',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8211;': '–',
  '&#8212;': '—',
  '&nbsp;': ' ',
  '&hellip;': '…',
};

const ENTITY_PATTERN = new RegExp(
  Object.keys(HTML_ENTITIES).join('|'),
  'g'
);

function decodeOnce(input: string): string {
  return input.replace(ENTITY_PATTERN, (match) => HTML_ENTITIES[match] ?? match);
}

/**
 * Decode the common WordPress HTML entities.
 *
 * WordPress frequently double-encodes titles (`&amp;#8217;`), so the decode runs
 * up to two passes, stopping as soon as the string stops changing.
 */
export function decodeEntities(input: string): string {
  if (typeof input !== 'string' || input.length === 0) return '';
  let out = input;
  for (let pass = 0; pass < 2; pass += 1) {
    const next = decodeOnce(out);
    if (next === out) break;
    out = next;
  }
  return out;
}

/** Remove HTML tags, decode entities and collapse whitespace. */
export function stripHtml(html: string): string {
  if (typeof html !== 'string' || html.length === 0) return '';
  const withoutTags = html
    // Drop the *contents* of script/style blocks, not just their tags.
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    // Turn block boundaries into spaces so words do not get glued together.
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '');
  return decodeEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

/** Truncate to at most `max` characters (ellipsis included), on a word boundary. */
function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

/* -------------------------------------------------------------------------- */
/* Loose shapes of the WordPress payloads                                     */
/* -------------------------------------------------------------------------- */

interface WPRendered {
  rendered?: string | null;
}

interface WPEmbeddedTerm {
  id?: number | null;
  name?: string | null;
  slug?: string | null;
}

interface WPPost {
  id?: number | null;
  slug?: string | null;
  date?: string | null;
  modified?: string | null;
  title?: WPRendered | null;
  content?: WPRendered | null;
  excerpt?: WPRendered | null;
  categories?: number[] | null;
  occ_meta?: {
    subtitle?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    featured?: boolean | number | string | null;
  } | null;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string | null } | null> | null;
    'wp:term'?: Array<Array<WPEmbeddedTerm | null> | null> | null;
  } | null;
}

interface WPTournamentPost {
  id?: number | null;
  title?: WPRendered | null;
  occ_tournament?: {
    location?: string | null;
    country?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    surface?: string | null;
    category?: string | null;
    prize?: string | null;
  } | null;
}

interface WPCategory {
  id?: number | null;
  name?: string | null;
  slug?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Coercion helpers — the plugin may not be installed yet, so nothing is safe  */
/* -------------------------------------------------------------------------- */

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function bool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    return normalised === '1' || normalised === 'true' || normalised === 'yes';
  }
  return false;
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/* -------------------------------------------------------------------------- */
/* Fetching                                                                   */
/* -------------------------------------------------------------------------- */

type JsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'network' | 'status' | 'not-json'; reason: string };

/** A single GET returning parsed JSON, or a structured description of the failure. */
async function requestJson<T>(url: string, tags: string[]): Promise<JsonResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS, tags },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, kind: 'network', reason };
  }

  if (!response.ok) {
    return {
      ok: false,
      kind: 'status',
      reason: `responded ${response.status} ${response.statusText}`,
    };
  }

  let body: string;
  try {
    body = await response.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, kind: 'network', reason: `could not read body: ${reason}` };
  }

  try {
    return { ok: true, data: JSON.parse(body) as T };
  } catch {
    return {
      ok: false,
      kind: 'not-json',
      reason: `did not return JSON (first 80 chars: ${JSON.stringify(body.slice(0, 80))})`,
    };
  }
}

/**
 * Perform a GET against the WordPress REST API.
 *
 * Never throws: on a missing configuration, a network failure, a non-2xx status
 * or a malformed body it logs a concise warning and resolves to `null`. This is
 * what keeps `next build` working when WordPress is unreachable (Vercel builds
 * the site without access to the CMS box).
 *
 * `path` is a route plus optional query string, e.g. `wp/v2/posts?_embed=1`.
 */
async function wpFetch<T>(path: string, tags: string[] = [CONTENT_TAG]): Promise<T | null> {
  const base = getBaseUrl();
  if (!base) {
    console.warn(`[wp] WORDPRESS_API_URL is not set — skipping request to "${path}".`);
    return null;
  }

  const normalised = path.replace(/^\/+/, '');
  const queryStart = normalised.indexOf('?');
  const route = queryStart === -1 ? normalised : normalised.slice(0, queryStart);
  const query = queryStart === -1 ? '' : normalised.slice(queryStart + 1);

  const url = `${base}/wp-json/${route}${query ? `?${query}` : ''}`;
  const primary = await requestJson<T>(url, tags);
  if (primary.ok) return primary.data;

  // A WordPress install left on "plain" permalinks serves the HTML home page on
  // /wp-json/... instead of JSON. The query-string form of the same route always
  // works, so retry there once rather than rendering an empty site.
  if (primary.kind === 'not-json') {
    const fallbackUrl = `${base}/?rest_route=/${route}${query ? `&${query}` : ''}`;
    const fallback = await requestJson<T>(fallbackUrl, tags);
    if (fallback.ok) {
      console.warn(
        `[wp] ${url} ${primary.reason} — served by ${fallbackUrl} instead. ` +
          'Set WordPress → Settings → Permalinks to "Post name" so the /wp-json/ routes work.'
      );
      return fallback.data;
    }
    console.warn(`[wp] ${url} ${primary.reason}; ${fallbackUrl} also failed: ${fallback.reason}`);
    return null;
  }

  console.warn(`[wp] ${url} ${primary.reason}`);
  return null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/* -------------------------------------------------------------------------- */
/* Mappers                                                                    */
/* -------------------------------------------------------------------------- */

function mapArticle(post: WPPost): WPArticle {
  const rawContent = str(post?.content?.rendered);
  const rawExcerpt = str(post?.excerpt?.rendered);

  const excerptText = stripHtml(rawExcerpt);
  const excerpt = truncate(excerptText.length > 0 ? excerptText : stripHtml(rawContent), 200);

  const term = post?._embedded?.['wp:term']?.[0]?.[0] ?? null;
  const meta = post?.occ_meta ?? null;

  return {
    id: num(post?.id),
    slug: str(post?.slug),
    title: decodeEntities(str(post?.title?.rendered)),
    subtitle: str(meta?.subtitle),
    body: rawContent, // trusted HTML straight from the CMS
    excerpt,
    mainImage: str(post?._embedded?.['wp:featuredmedia']?.[0]?.source_url),
    category: decodeEntities(str(term?.name)),
    categorySlug: str(term?.slug),
    featured: bool(meta?.featured),
    publishedAt: str(post?.date),
    updatedAt: str(post?.modified),
    seoTitle: str(meta?.seo_title),
    seoDescription: str(meta?.seo_description),
  };
}

function mapTournament(post: WPTournamentPost): WPTournament {
  const data = post?.occ_tournament ?? null;
  return {
    id: num(post?.id),
    name: decodeEntities(str(post?.title?.rendered)),
    location: str(data?.location),
    country: str(data?.country),
    startDate: str(data?.start_date),
    endDate: str(data?.end_date),
    surface: str(data?.surface),
    category: str(data?.category),
    prize: str(data?.prize),
  };
}

function mapAdSlot(value: unknown): AdSlotConfig {
  const slot = (value ?? {}) as { enabled?: unknown; code?: unknown };
  return {
    enabled: bool(slot?.enabled),
    code: str(slot?.code),
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** Published articles, newest first. Returns `[]` on any failure. */
export async function getWPArticles(limit?: number): Promise<WPArticle[]> {
  const perPage =
    typeof limit === 'number' && Number.isFinite(limit) && limit > 0
      ? Math.min(Math.ceil(limit), MAX_PER_PAGE)
      : MAX_PER_PAGE;

  const data = await wpFetch<unknown>(
    `wp/v2/posts?_embed=1&per_page=${perPage}&status=publish`
  );
  if (data === null) return [];

  const articles = asArray<WPPost>(data)
    .map(mapArticle)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  return typeof limit === 'number' && limit > 0 ? articles.slice(0, limit) : articles;
}

/** A single published article, or `null` when missing / unreachable. */
export async function getWPArticleBySlug(slug: string): Promise<WPArticle | null> {
  if (typeof slug !== 'string' || slug.trim().length === 0) return null;

  const data = await wpFetch<unknown>(
    `wp/v2/posts?slug=${encodeURIComponent(slug.trim())}&_embed=1`
  );
  if (data === null) return null;

  const first = asArray<WPPost>(data)[0];
  return first ? mapArticle(first) : null;
}

/** Tournaments, ordered by start date ascending. Returns `[]` on any failure. */
export async function getWPTournaments(): Promise<WPTournament[]> {
  const data = await wpFetch<unknown>(`wp/v2/torneio?per_page=${MAX_PER_PAGE}`);
  if (data === null) return [];

  return asArray<WPTournamentPost>(data)
    .map(mapTournament)
    .sort((a, b) => {
      // Tournaments without a start date sort last instead of to the front.
      const left = Date.parse(a.startDate);
      const right = Date.parse(b.startDate);
      const leftValid = Number.isFinite(left);
      const rightValid = Number.isFinite(right);
      if (!leftValid && !rightValid) return 0;
      if (!leftValid) return 1;
      if (!rightValid) return -1;
      return left - right;
    });
}

/** Site settings, falling back to `DEFAULT_SETTINGS` on any failure. */
export async function getWPSettings(): Promise<SiteSettings> {
  const data = await wpFetch<unknown>('occ/v1/settings', [CONTENT_TAG, SETTINGS_TAG]);
  if (data === null || typeof data !== 'object') return DEFAULT_SETTINGS;

  const payload = data as {
    ads?: Record<string, unknown> | null;
    site?: { title?: unknown; description?: unknown } | null;
  };

  return {
    ads: {
      leaderboard: mapAdSlot(payload?.ads?.leaderboard),
      rectangle: mapAdSlot(payload?.ads?.rectangle),
      large_rectangle: mapAdSlot(payload?.ads?.large_rectangle),
    },
    site: {
      title: str(payload?.site?.title) || DEFAULT_SETTINGS.site.title,
      description: str(payload?.site?.description),
    },
  };
}

/** Post categories. Returns `[]` on any failure. */
export async function getWPCategories(): Promise<
  { id: number; name: string; slug: string }[]
> {
  const data = await wpFetch<unknown>(`wp/v2/categories?per_page=${MAX_PER_PAGE}`);
  if (data === null) return [];

  return asArray<WPCategory>(data).map((category) => ({
    id: num(category?.id),
    name: decodeEntities(str(category?.name)),
    slug: str(category?.slug),
  }));
}
