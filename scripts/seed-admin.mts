/**
 * Cria o primeiro usuário administrador do painel Payload.
 * Uso: npx payload run scripts/seed-admin.mts
 */
import { getPayload } from 'payload'

import config from '../payload.config'

const EMAIL = 'admin@oncourt.com.br'

const run = async () => {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: EMAIL } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    payload.logger.info(`Usuário ${EMAIL} já existe (id ${existing.docs[0]!.id}).`)
    return
  }

  const user = await payload.create({
    collection: 'users',
    data: {
      email: EMAIL,
      password: 'oncourt2026',
      name: 'Administrador',
      role: 'admin',
    },
  })

  payload.logger.info(`Usuário administrador criado: ${user.email} (id ${user.id}).`)
}

await run()
process.exit(0)
