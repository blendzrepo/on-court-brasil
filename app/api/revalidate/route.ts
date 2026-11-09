import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

import { CONTENT_TAG, SETTINGS_TAG } from '@/lib/revalidate';

/**
 * On-demand revalidation webhook, for manual purges.
 *
 * Payload's own `afterChange` / `afterDelete` hooks already purge the cache
 * in-process whenever an article, tournament or setting is saved, so nothing
 * depends on this route in normal operation. It stays because being able to
 * drop the `payload-content` / `payload-settings` caches from the outside —
 * after a direct database edit, say — is worth the few lines it costs.
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
    revalidateTag(CONTENT_TAG, { expire: 0 });
    revalidateTag(SETTINGS_TAG, { expire: 0 });
    revalidatePath('/');

    // `tournaments` is the Payload collection slug; `torneio` was the WordPress
    // post type and is still accepted so older callers keep working.
    if (type === 'tournaments' || type === 'torneio') {
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
