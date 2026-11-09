import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Uploads. With `BLOB_READ_WRITE_TOKEN` set, the Vercel Blob plugin in
 * payload.config.ts takes over `staticDir` and stores the files in the Blob
 * store, which is what makes them survive a deploy. Without the token the
 * plugin is a no-op and files land in `public/media`, so Next serves them
 * straight from the static folder. Either way Payload exposes them at
 * `/api/media`.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Mídia',
    plural: 'Mídias',
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Conteúdo',
  },
  access: {
    // Images are rendered on the public site, so reads must be open.
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  upload: {
    staticDir: path.resolve(dirname, '../public/media'),
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 225,
        crop: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 800,
        height: 450,
        crop: 'centre',
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      {
        name: 'hero',
        width: 1600,
        height: 900,
        crop: 'centre',
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texto alternativo',
      required: true,
      admin: {
        description: 'Descreva a imagem para leitores de tela (acessibilidade).',
      },
    },
    {
      name: 'credit',
      type: 'text',
      label: 'Crédito da foto',
    },
  ],
}
