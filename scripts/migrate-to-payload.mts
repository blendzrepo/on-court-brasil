/**
 * Importa o conteúdo que hoje vive em arquivos (data/articles.json,
 * lib/mockData.ts e os SVGs de public/images) para dentro do Payload CMS.
 *
 * Uso: npx payload run scripts/migrate-to-payload.mts [--dry-run]
 *
 * O script é idempotente: rodar duas vezes atualiza o que já existe em vez de
 * criar duplicatas (mídias pelo nome do arquivo, notícias pelo slug e torneios
 * pelo par nome + data de início).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { Window } from 'happy-dom'
import { getPayload } from 'payload'

import type { Payload } from 'payload'

import config from '../payload.config'
import { tournaments } from '../lib/mockData'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')

/* -------------------------------------------------------------------------- */
/* CLI                                                                         */
/* -------------------------------------------------------------------------- */

/**
 * `payload run` roda os argumentos por um `minimist` e repassa ao script apenas
 * os posicionais (payload/dist/bin/index.js), de modo que um `--dry-run`
 * digitado direto some antes de chegar aqui - e a migração rodaria para valer
 * sem avisar. Para que a flag funcione de qualquer jeito, a linha de comando
 * original é lida de volta em /proc (Linux, onde roda a migração) e somada ao
 * `process.argv` já filtrado. Em outros sistemas a leitura falha em silêncio e
 * valem as formas que o Payload preserva: `-- --dry-run` ou `DRY_RUN=1`.
 */
const invocationArgs = (): string[] => {
  const args = process.argv.slice(2)

  try {
    const raw = fs.readFileSync('/proc/self/cmdline', 'utf8')
    for (const token of raw.split('\0')) {
      if (token.startsWith('-') && !args.includes(token)) {
        args.push(token)
      }
    }
  } catch {
    // Sem /proc: resta o que o Payload repassou (e a variável de ambiente).
  }

  return args
}

const argv = invocationArgs()
const hasFlag = (...names: string[]): boolean => names.some((name) => argv.includes(name))

const dryRun =
  hasFlag('--dry-run', 'dry-run', '-n') || ['1', 'true'].includes(process.env.DRY_RUN ?? '')
const wantsHelp = hasFlag('--help', 'help', '-h')

const HELP = `
Importa o conteúdo dos arquivos locais para o Payload CMS.

Uso: npx payload run scripts/migrate-to-payload.mts [opções]
     npm run migrate:payload -- -- [opções]

Opções:
  --dry-run   Apenas relata o que seria feito, sem gravar nada no banco.
              Use sempre antes da migração real para conferir os números.
              Equivale a DRY_RUN=1 no ambiente.
  -h, --help  Mostra esta ajuda.

Atenção: o comando 'payload run' descarta as flags antes de repassá-las ao
script. Este script recupera a linha de comando original no Linux, mas a forma
garantida em qualquer sistema é separá-las com '--', por exemplo:
  npx payload run scripts/migrate-to-payload.mts -- --dry-run

O que é importado:
  - 5 imagens de capa (public/images/*.svg) para a coleção 'media'
  - 37 notícias (data/articles.json) para a coleção 'articles',
    com o corpo em HTML convertido para o rich text Lexical
  - 24 torneios (lib/mockData.ts) para a coleção 'tournaments'

A execução é idempotente: itens já existentes são atualizados, não duplicados.
`.trim()

if (wantsHelp) {
  console.log(HELP)
  process.exit(0)
}

/* -------------------------------------------------------------------------- */
/* HTML -> Lexical                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `convertHTMLToLexical` do @payloadcms/richtext-lexical pede um construtor com
 * a mesma forma do JSDOM (`new X(html).window.document`). O happy-dom já vem
 * instalado como dependência do @lexical/headless e é bem mais leve que o
 * jsdom, então basta embrulhá-lo nessa interface.
 */
class HappyDOMAdapter {
  window: { document: Document }

  constructor(html: string) {
    const window = new Window()
    window.document.write(html)
    this.window = window as unknown as { document: Document }
  }
}

/* -------------------------------------------------------------------------- */
/* Tipos das fontes                                                            */
/* -------------------------------------------------------------------------- */

interface SourceArticle {
  id: string
  title: string
  subtitle: string
  body: string
  mainImage: string
  category: 'Grand Slam' | 'ATP' | 'WTA' | 'Brasil' | 'Internacional'
  slug: string
  featured: boolean
  published: boolean
  publishedAt: string
  updatedAt: string
}

/** Capas das editorias, com o texto alternativo que vai para a acessibilidade. */
const MEDIA_SOURCES: { file: string; alt: string }[] = [
  {
    file: 'grand-slam.svg',
    alt: 'Capa da editoria Grand Slam: arte com a quadra e o troféu dos quatro maiores torneios do tênis',
  },
  {
    file: 'atp.svg',
    alt: 'Capa da editoria ATP: arte com a raquete e a bola do circuito masculino de tênis',
  },
  {
    file: 'wta.svg',
    alt: 'Capa da editoria WTA: arte com a raquete e a bola do circuito feminino de tênis',
  },
  {
    file: 'brasil.svg',
    alt: 'Capa da editoria Brasil: arte em verde e amarelo com a bola de tênis representando o tênis brasileiro',
  },
  {
    file: 'internacional.svg',
    alt: 'Capa da editoria Internacional: arte com o globo e a bola de tênis representando o circuito mundial',
  },
]

/* -------------------------------------------------------------------------- */
/* Relatório                                                                   */
/* -------------------------------------------------------------------------- */

type Outcome = 'created' | 'updated' | 'failed'

interface Stats {
  created: number
  updated: number
  failed: number
}

const stats: Record<'Mídias' | 'Notícias' | 'Torneios', Stats> = {
  'Mídias': { created: 0, updated: 0, failed: 0 },
  'Notícias': { created: 0, updated: 0, failed: 0 },
  'Torneios': { created: 0, updated: 0, failed: 0 },
}

const failures: string[] = []

const report = (
  kind: keyof typeof stats,
  outcome: Outcome,
  label: string,
  reason?: string,
): void => {
  stats[kind][outcome] += 1

  if (outcome === 'failed') {
    const line = `${label} — ${reason ?? 'motivo desconhecido'}`
    failures.push(`[${kind}] ${line}`)
    console.log(`  ⨯ falhou  ${line}`)
    return
  }

  const verb = outcome === 'created' ? '✓ criado   ' : '↻ atualizado'
  console.log(`  ${verb} ${label}`)
}

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Erros de validação do Payload trazem os campos em `data.errors`.
    const data = (error as { data?: { errors?: { message?: string; path?: string }[] } }).data
    const details = data?.errors
      ?.map((e) => [e.path, e.message].filter(Boolean).join(': '))
      .filter(Boolean)
      .join('; ')
    return details ? `${error.message} (${details})` : error.message
  }
  return String(error)
}

/* -------------------------------------------------------------------------- */
/* Etapas                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Sobe as capas e devolve o mapa nome-do-arquivo -> id da mídia. Reaproveita
 * documentos que já tenham o mesmo `filename` em vez de duplicar o upload.
 */
const migrateMedia = async (payload: Payload): Promise<Map<string, number>> => {
  console.log('\nMídias')
  const byFilename = new Map<string, number>()

  for (const { file, alt } of MEDIA_SOURCES) {
    try {
      const filePath = path.join(projectRoot, 'public', 'images', file)
      if (!fs.existsSync(filePath)) {
        report('Mídias', 'failed', file, `arquivo não encontrado em ${filePath}`)
        continue
      }

      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: file } },
        limit: 1,
        pagination: false,
      })
      const current = existing.docs[0]

      if (dryRun) {
        if (current) {
          byFilename.set(file, current.id)
          report('Mídias', 'updated', `${file} (alt)`)
        } else {
          report('Mídias', 'created', `${file} (upload)`)
        }
        continue
      }

      if (current) {
        const updated = await payload.update({
          collection: 'media',
          id: current.id,
          data: { alt },
        })
        byFilename.set(file, updated.id)
        report('Mídias', 'updated', `${file} (id ${updated.id})`)
        continue
      }

      const created = await payload.create({
        collection: 'media',
        filePath,
        data: { alt },
      })
      byFilename.set(file, created.id)
      report('Mídias', 'created', `${file} (id ${created.id})`)
    } catch (error) {
      report('Mídias', 'failed', file, errorMessage(error))
    }
  }

  return byFilename
}

const migrateArticles = async (
  payload: Payload,
  mediaByFilename: Map<string, number>,
): Promise<void> => {
  console.log('\nNotícias')

  const raw = fs.readFileSync(path.join(projectRoot, 'data', 'articles.json'), 'utf8')
  const sources = JSON.parse(raw) as SourceArticle[]

  // O config sanitizado do editor é o mesmo para todas as notícias, então é
  // montado uma única vez fora do laço.
  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  for (const source of sources) {
    try {
      const body = convertHTMLToLexical({
        editorConfig,
        html: source.body,
        JSDOM: HappyDOMAdapter as unknown as ConstructorParameters<
          typeof convertHTMLToLexical
        >[0]['JSDOM'],
      })

      const children = body?.root?.children ?? []
      if (children.length === 0) {
        throw new Error('a conversão do HTML para Lexical devolveu um corpo vazio')
      }

      // `mainImage` chega como caminho público ("/images/atp.svg"); o id vem do
      // mapa montado na etapa das mídias.
      const filename = source.mainImage ? path.basename(source.mainImage) : ''
      const mainImage = filename ? mediaByFilename.get(filename) : undefined
      if (filename && mainImage === undefined && !dryRun) {
        throw new Error(`mídia '${filename}' não foi encontrada (upload falhou?)`)
      }

      const data = {
        title: source.title,
        subtitle: source.subtitle,
        slug: source.slug,
        body,
        category: source.category,
        featured: source.featured,
        publishedAt: source.publishedAt,
        // seoTitle/seoDescription ficam em branco de propósito: serão escritos
        // à mão pela redação.
        ...(mainImage !== undefined ? { mainImage } : {}),
        _status: (source.published ? 'published' : 'draft') as 'draft' | 'published',
      }

      const existing = await payload.find({
        collection: 'articles',
        where: { slug: { equals: source.slug } },
        limit: 1,
        pagination: false,
        draft: true,
        overrideAccess: true,
      })
      const current = existing.docs[0]

      const label = `${source.slug} [${source.category}] ${children.length} blocos`

      if (dryRun) {
        report('Notícias', current ? 'updated' : 'created', label)
        continue
      }

      if (current) {
        await payload.update({
          collection: 'articles',
          id: current.id,
          data,
          draft: false,
          overrideAccess: true,
        })
        report('Notícias', 'updated', `${label} (id ${current.id})`)
        continue
      }

      const created = await payload.create({
        collection: 'articles',
        data,
        draft: false,
        overrideAccess: true,
      })
      report('Notícias', 'created', `${label} (id ${created.id})`)
    } catch (error) {
      report('Notícias', 'failed', source.slug, errorMessage(error))
    }
  }
}

/** "2026-01-13T00:00:00.000Z" e "2026-01-13" viram ambos "2026-01-13". */
const dayOf = (value: unknown): string =>
  typeof value === 'string'
    ? value.slice(0, 10)
    : value instanceof Date
      ? value.toISOString().slice(0, 10)
      : ''

const migrateTournaments = async (payload: Payload): Promise<void> => {
  console.log('\nTorneios')

  for (const source of tournaments) {
    try {
      const data = {
        name: source.name,
        location: source.location,
        country: source.country,
        startDate: source.startDate,
        endDate: source.endDate,
        surface: source.surface,
        category: source.category,
        ...(source.prize ? { prize: source.prize } : {}),
      }

      // A chave natural é nome + data de início: a mesma competição volta todo
      // ano, então o nome sozinho não identifica a edição.
      const existing = await payload.find({
        collection: 'tournaments',
        where: { name: { equals: source.name } },
        limit: 100,
        pagination: false,
        overrideAccess: true,
      })
      const current = existing.docs.find((doc) => dayOf(doc.startDate) === dayOf(source.startDate))

      const label = `${source.name} (${source.startDate})`

      if (dryRun) {
        report('Torneios', current ? 'updated' : 'created', label)
        continue
      }

      if (current) {
        await payload.update({
          collection: 'tournaments',
          id: current.id,
          data,
          overrideAccess: true,
        })
        report('Torneios', 'updated', `${label} (id ${current.id})`)
        continue
      }

      const created = await payload.create({
        collection: 'tournaments',
        data,
        overrideAccess: true,
      })
      report('Torneios', 'created', `${label} (id ${created.id})`)
    } catch (error) {
      report('Torneios', 'failed', source.name, errorMessage(error))
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Execução                                                                    */
/* -------------------------------------------------------------------------- */

const printSummary = (): void => {
  const kinds = Object.keys(stats) as (keyof typeof stats)[]
  const pad = (value: string | number, width: number) => String(value).padStart(width)

  console.log('\nResumo')
  console.log('  ┌──────────┬─────────┬────────────┬─────────┬───────┐')
  console.log('  │ Tipo     │ criados │ atualizados │ falhas │ total │')
  console.log('  ├──────────┼─────────┼────────────┼─────────┼───────┤')
  for (const kind of kinds) {
    const { created, updated, failed } = stats[kind]
    console.log(
      `  │ ${kind.padEnd(8)} │ ${pad(created, 7)} │ ${pad(updated, 10)}  │ ${pad(failed, 6)}  │ ${pad(created + updated + failed, 5)} │`,
    )
  }
  console.log('  └──────────┴─────────┴────────────┴─────────┴───────┘')

  if (failures.length > 0) {
    console.log('\nFalhas:')
    for (const line of failures) {
      console.log(`  - ${line}`)
    }
  }
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  console.log(
    dryRun
      ? '\n=== SIMULAÇÃO (--dry-run): nada será gravado no banco ==='
      : '\n=== Migração para o Payload CMS ===',
  )

  const mediaByFilename = await migrateMedia(payload)
  await migrateArticles(payload, mediaByFilename)
  await migrateTournaments(payload)

  printSummary()

  const totalFailed = Object.values(stats).reduce((sum, s) => sum + s.failed, 0)
  if (totalFailed > 0) {
    console.log(`\n${totalFailed} item(ns) falharam.`)
    process.exit(1)
  }

  console.log(dryRun ? '\nSimulação concluída. Nada foi gravado.' : '\nMigração concluída.')
  process.exit(0)
}

await run()
