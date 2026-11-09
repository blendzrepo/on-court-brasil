import type { CollectionConfig } from 'payload'

/** The season calendar rendered on /calendario. */
export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
  labels: {
    singular: 'Torneio',
    plural: 'Torneios',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'surface', 'startDate'],
    group: 'Conteúdo',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nome',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'location',
          type: 'text',
          label: 'Cidade',
          required: true,
        },
        {
          name: 'country',
          type: 'text',
          label: 'País',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: 'Início',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
              displayFormat: 'dd/MM/yyyy',
            },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'Término',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
              displayFormat: 'dd/MM/yyyy',
            },
          },
        },
      ],
    },
    {
      name: 'surface',
      type: 'select',
      label: 'Piso',
      required: true,
      options: [
        { label: 'Saibro', value: 'Saibro' },
        { label: 'Duro', value: 'Duro' },
        { label: 'Grama', value: 'Grama' },
        { label: 'Carpete', value: 'Carpete' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      label: 'Categoria',
      required: true,
      options: [
        { label: 'Grand Slam', value: 'Grand Slam' },
        { label: 'ATP Masters 1000', value: 'ATP Masters 1000' },
        { label: 'ATP 500', value: 'ATP 500' },
        { label: 'ATP 250', value: 'ATP 250' },
        { label: 'WTA 1000', value: 'WTA 1000' },
        { label: 'WTA 500', value: 'WTA 500' },
        { label: 'WTA 250', value: 'WTA 250' },
        { label: 'Davis Cup', value: 'Davis Cup' },
        { label: 'Copa Billie Jean King', value: 'Copa Billie Jean King' },
      ],
    },
    {
      name: 'prize',
      type: 'text',
      label: 'Premiação',
    },
  ],
}
