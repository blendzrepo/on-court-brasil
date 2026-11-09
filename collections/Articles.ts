import { lexicalEditor } from '@payloadcms/richtext-lexical'

import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  FieldHook,
} from 'payload'

import { CONTENT_TAG, purgeContentCache } from '../lib/revalidate'

/**
 * Turns a headline into a URL-safe slug: lowercase, Portuguese accents stripped,
 * every run of non-alphanumerics folded into a single hyphen and no hyphen left
 * dangling at either end. "Alcaraz vence em Roland-Garros!" -> "alcaraz-vence-em-roland-garros".
 */
const slugify = (input: string): string =>
  input
    .normalize('NFD')
    // Combining marks left behind by NFD (the accents themselves).
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Fills the slug from the title whenever the editor left it empty, and keeps a
 * hand-written slug URL-safe. Runs on every create/update before validation so
 * the `required` + `unique` constraints see the final value.
 */
const formatSlug: FieldHook = ({ data, value }) => {
  if (typeof value === 'string' && value.trim() !== '') {
    return slugify(value)
  }

  const title = data?.title
  if (typeof title === 'string' && title.trim() !== '') {
    return slugify(title)
  }

  return value
}

/** `/categoria/<slug>` segment for an article's editoria. */
const categoryPath = (category: unknown): string | null =>
  typeof category === 'string' && category.trim() !== ''
    ? `/categoria/${slugify(category)}`
    : null

/**
 * Pages whose cached output mentions a given article. The tag purge already
 * drops the article data itself; these paths cover the prerendered shells.
 */
const articlePaths = (doc: Record<string, unknown>): string[] => {
  const paths = ['/', '/noticias']

  if (typeof doc.slug === 'string' && doc.slug !== '') {
    paths.push(`/noticias/${doc.slug}`)
  }

  const category = categoryPath(doc.category)
  if (category !== null) paths.push(category)

  return paths
}

/**
 * Publishing has to show up on the public site immediately, and Payload runs
 * inside the same Next process as the pages do — so the hook purges the cache
 * directly instead of POSTing to `/api/revalidate` and paying for a round trip
 * through its own server.
 *
 * `previousDoc` is purged too: renaming a slug or moving an article between
 * editorias leaves the old URL and the old category page stale otherwise.
 */
const revalidateArticle: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  const paths = new Set([
    ...articlePaths(doc ?? {}),
    ...(previousDoc ? articlePaths(previousDoc) : []),
  ])

  await purgeContentCache({ tags: [CONTENT_TAG], paths: [...paths] })

  return doc
}

const revalidateDeletedArticle: CollectionAfterDeleteHook = async ({ doc }) => {
  await purgeContentCache({ tags: [CONTENT_TAG], paths: articlePaths(doc ?? {}) })

  return doc
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'Notícia',
    plural: 'Notícias',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    group: 'Conteúdo',
  },
  access: {
    // Anonymous visitors only ever see published documents; the editorial team
    // sees drafts too.
    read: ({ req: { user } }) => {
      if (user) {
        return true
      }
      return {
        _status: {
          equals: 'published',
        },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
  hooks: {
    afterChange: [revalidateArticle],
    afterDelete: [revalidateDeletedArticle],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtítulo',
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug (URL)',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Gerado a partir do título quando deixado em branco.',
      },
      hooks: {
        beforeValidate: [formatSlug],
      },
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Texto',
      required: true,
      editor: lexicalEditor(),
    },
    {
      name: 'mainImage',
      type: 'upload',
      label: 'Foto principal',
      relationTo: 'media',
    },
    {
      name: 'category',
      type: 'select',
      label: 'Editoria',
      required: true,
      options: [
        { label: 'Grand Slam', value: 'Grand Slam' },
        { label: 'ATP', value: 'ATP' },
        { label: 'WTA', value: 'WTA' },
        { label: 'Brasil', value: 'Brasil' },
        { label: 'Internacional', value: 'Internacional' },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Destaque na home',
      defaultValue: false,
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Data de publicação',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
      },
    },
    {
      // Payload's `group` field cannot collapse, so the SEO block is a
      // `collapsible` - it keeps the editing form short while still grouping
      // the two search-engine fields under one "SEO" heading.
      type: 'collapsible',
      label: 'SEO',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'seoTitle',
          type: 'text',
          label: 'Título para buscadores',
        },
        {
          name: 'seoDescription',
          type: 'textarea',
          label: 'Descrição para buscadores',
        },
      ],
    },
  ],
}
