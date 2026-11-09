import type { CollectionConfig } from 'payload'

/**
 * Admin panel accounts. `auth: true` turns this into the collection Payload uses
 * for login, so `admin.user` in payload.config.ts points here.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Usuário',
    plural: 'Usuários',
  },
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Administração',
  },
  access: {
    // Only administrators may add or remove accounts.
    create: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
    // Any logged in editor needs to see who else is in the team.
    read: ({ req: { user } }) => Boolean(user),
    // Administrators edit anyone; an editor may only edit their own profile.
    // Returning a `Where` (instead of a boolean) keeps this correct for the
    // list view and bulk updates as well, not just single-document saves.
    update: ({ req: { user } }) => {
      if (!user) {
        return false
      }
      if (user.role === 'admin') {
        return true
      }
      return {
        id: {
          equals: user.id,
        },
      }
    },
  },
  fields: [
    // `email` and the password fields are added by `auth: true`.
    {
      name: 'name',
      type: 'text',
      label: 'Nome',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      label: 'Função',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        // Editors must not be able to promote themselves.
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
}
