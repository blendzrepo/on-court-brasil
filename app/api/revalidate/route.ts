import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * On-demand revalidation webhook.
 *
 * The `on-court-cms` WordPress plugin POSTs here whenever a post, tournament or
 * setting is published, updated or deleted, so the cached CMS responses in
 * `lib/wp.ts` (tagged `wp-content` / `wp-settings`) are dropped immediately
 * instead of waiting out the 5-minute ISR window.
 */

interface RevalidateBody {
  type?: string;
  slug?: string;
}

/** Parse the JSON body, treating anything malformed or empty as `{}`. */
async function readBody(request: Request): Promise<RevalidateBody> {
  try {
    const parsed: unknown = await request.json();
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const { type, slug } = parsed as RevalidateBody;
    return {
      type: typeof type === 'string' ? type : undefined,
      slug: typeof slug === 'string' ? slug : undefined,
    };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const expected = process.env.REVALIDATE_SECRET;
    const provided = new URL(request.url).searchParams.get('secret');

    // An unset env var is treated exactly like a wrong secret, so the response
    // never reveals whether the site is missing its configuration.
    if (typeof expected !== 'string' || expected.length === 0 || provided !== expected) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    const { type, slug } = await readBody(request);

    // Next 16 requires a cacheLife profile as the second argument. `{ expire: 0 }`
    // keeps the Next 14 behaviour of this webhook: the tagged entries expire
    // immediately instead of being served stale while they revalidate.
    revalidateTag('wp-content', { expire: 0 });
    revalidateTag('wp-settings', { expire: 0 });
    revalidatePath('/');

    if (type === 'torneio') {
      revalidatePath('/calendario');
    } else if (typeof slug === 'string' && slug.length > 0) {
      revalidatePath(`/noticias/${slug}`);
    }

    return NextResponse.json({
      revalidated: true,
      type,
      slug,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[revalidate] unexpected failure', error);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
