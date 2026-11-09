import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import { pt } from '@payloadcms/translations/languages/pt'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Articles } from './collections/Articles'
import { Media } from './collections/Media'
import { Tournaments } from './collections/Tournaments'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
      connectionString: process.env.DATABASE_URI || '',
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
  plugins: [],
})
