import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import { pt } from '@payloadcms/translations/languages/pt'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Articles } from './collections/Articles'
import { Media } from './collections/Media'
import { Tournaments } from './collections/Tournaments'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Vercel's filesystem is ephemeral: anything the `media` collection writes to
// `public/media` disappears on the next deploy. The Blob adapter moves uploads
// to Vercel Blob, but only when there is a store to talk to - the token is
// absent in local development and during the Vercel build step that runs before
// the store is linked. `enabled: false` makes the plugin a no-op in that case,
// so Payload keeps using `upload.staticDir` (local disk) and nothing crashes.
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      title: 'Painel',
      // Payload joins title and suffix with a single space of its own.
      titleSuffix: '| On Court Brasil',
      description: 'Painel de administração do portal de tênis On Court Brasil.',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Articles, Tournaments, Media, Users],
  globals: [SiteSettings],
  // Default editor for every richText field that does not declare its own.
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      // Vercel's Neon integration injects POSTGRES_URL and DATABASE_URL rather
      // than DATABASE_URI, so accept those too and no env var has to be copied
      // by hand. The pooled URLs come first: serverless functions open a
      // connection per invocation and would exhaust a direct connection limit.
      connectionString:
        process.env.DATABASE_URI ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL ||
        '',
    },
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Required for the `media` image sizes to be generated.
  sharp,
  // `supportedLanguages` defaults to English only, so Portuguese has to be
  // listed explicitly for `fallbackLanguage` to take effect.
  i18n: {
    supportedLanguages: { pt, en },
    fallbackLanguage: 'pt',
  },
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(blobToken),
      collections: {
        media: true,
      },
      token: blobToken,
    }),
  ],
})
