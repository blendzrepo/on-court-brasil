import type { GlobalConfig } from 'payload'

/**
 * Single-document settings: AdSense slots and the site identity used in
 * metadata. A global (not a collection) because there is exactly one of it.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Configurações do site',
  admin: {
    group: 'Administração',
  },
  access: {
    // The public layout reads the ad slots, so reads must be open.
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'ads',
      type: 'group',
      label: 'Publicidade',
      fields: [
        {
          name: 'leaderboard',
          type: 'group',
          label: 'Banner topo 728x90',
          fields: [
            { name: 'enabled', type: 'checkbox', label: 'Ativo', defaultValue: false },
            { name: 'code', type: 'textarea', label: 'Código do AdSense' },
          ],
        },
        {
          name: 'rectangle',
          type: 'group',
          label: 'Banner meio 300x250',
          fields: [
            { name: 'enabled', type: 'checkbox', label: 'Ativo', defaultValue: false },
            { name: 'code', type: 'textarea', label: 'Código do AdSense' },
          ],
        },
        {
          name: 'largeRectangle',
          type: 'group',
          label: 'Banner rodapé 336x280',
          fields: [
            { name: 'enabled', type: 'checkbox', label: 'Ativo', defaultValue: false },
            { name: 'code', type: 'textarea', label: 'Código do AdSense' },
          ],
        },
      ],
    },
    {
      name: 'site',
      type: 'group',
      label: 'Site',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Título',
          defaultValue: 'On Court Brasil',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Descrição',
        },
      ],
    },
  ],
}
