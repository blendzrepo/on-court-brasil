/**
 * Cache tags shared by the content layer, the Payload hooks and the manual
 * purge webhook.
 *
 * This module deliberately imports nothing from Payload (and loads `next/cache`
 * lazily): the collection hooks pull it in through `payload.config.ts`, which is
 * also loaded by `payload run` scripts and `payload generate:types` outside of
 * Next. Importing `next/cache` at module scope would break those.
 */

/** Everything that comes out of the `articles` / `tournaments` collections. */
export const CONTENT_TAG = 'payload-content';

/** The `site-settings` global. */
export const SETTINGS_TAG = 'payload-settings';

interface PurgeOptions {
  tags?: readonly string[];
  paths?: readonly string[];
}

/**
 * Drop cached content, best effort.
 *
 * Next's revalidation APIs only exist inside a request/render scope, so the
 * same hook that works when an editor hits Publish throws when it runs from a
 * seed script, a migration or the build step. Content written in those contexts
 * has no cache to purge yet, so swallowing the failure is correct rather than
 * merely convenient.
 */
export async function purgeContentCache(options: PurgeOptions): Promise<void> {
  try {
    const { revalidatePath, revalidateTag } = await import('next/cache');

    for (const tag of options.tags ?? []) {
      // Next 16 requires a cacheLife profile as the second argument.
      // `{ expire: 0 }` drops the entry immediately instead of serving it
      // stale while it revalidates, which is what a publish should do.
      revalidateTag(tag, { expire: 0 });
    }

    for (const path of options.paths ?? []) {
      revalidatePath(path);
    }
  } catch (error) {
    console.info(
      '[revalidate] cache purge unavailable in this context — skipping.',
      error instanceof Error ? error.message : error
    );
  }
}
