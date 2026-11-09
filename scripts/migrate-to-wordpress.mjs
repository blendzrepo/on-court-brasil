#!/usr/bin/env node
/**
 * Migração de conteúdo do site Next.js (On Court Brasil) para o WordPress.
 *
 * Envia, via REST API:
 *   - as categorias das notícias;
 *   - as imagens usadas pelas notícias (biblioteca de mídia);
 *   - as 37 notícias de data/articles.json (post padrão + metadados occ_*);
 *   - os 25 torneios de lib/mockData.ts (CPT `torneio` + metadados occ_*).
 *
 * Rode sempre `--dry-run` antes do envio real.
 * Requisitos: Node 18+ (usa fetch nativo). Nenhuma dependência externa.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTICLES_FILE = path.join(ROOT, 'data', 'articles.json');
const MOCKDATA_FILE = path.join(ROOT, 'lib', 'mockData.ts');
const PUBLIC_DIR = path.join(ROOT, 'public');

/** Categorias de notícia usadas pelo site. */
const NEWS_CATEGORIES = ['Grand Slam', 'ATP', 'WTA', 'Brasil', 'Internacional'];

/** Pausa entre requisições de escrita, em ms (evita throttle/429 em hospedagem compartilhada). */
const WRITE_DELAY_MS = 150;

/* -------------------------------------------------------------------------- */
/* Ajuda                                                                      */
/* -------------------------------------------------------------------------- */

const HELP = `
Migração de conteúdo do On Court Brasil para o WordPress (REST API)

USO
  node scripts/migrate-to-wordpress.mjs --dry-run      (comece sempre por aqui)
  node scripts/migrate-to-wordpress.mjs
  npm run migrate:wp -- --dry-run

OPÇÕES
  --dry-run            Simula a migração: mostra exatamente o que SERIA criado ou
                       atualizado e não altera nada no WordPress. Use primeiro.
  --only=posts         Migra apenas as notícias (inclui categorias e imagens, das
                       quais as notícias dependem).
  --only=categories    Migra apenas as categorias das notícias.
  --only=tournaments   Migra apenas os torneios (CPT "torneio").
  --help, -h           Mostra esta ajuda.

VARIÁVEIS DE AMBIENTE (obrigatórias)
  WP_URL               URL base do WordPress, sem barra no final.
                       Ex.: https://cms.oncourt.com.br
  WP_USER              Usuário do WordPress (login, não o e-mail).
  WP_APP_PASSWORD      Senha de aplicativo criada em
                       Usuários -> Perfil -> Senhas de aplicativo.

EXEMPLOS
  WP_URL=https://cms.oncourt.com.br \\
  WP_USER=admin \\
  WP_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx" \\
  node scripts/migrate-to-wordpress.mjs --dry-run

  WP_URL=https://cms.oncourt.com.br WP_USER=admin WP_APP_PASSWORD="..." \\
  node scripts/migrate-to-wordpress.mjs --only=tournaments

OBSERVAÇÕES
  A migração é idempotente: itens já existentes (mesmo slug) são atualizados,
  nunca duplicados. Rodar o script duas vezes é seguro.

  Se o servidor responder 401 mesmo com a senha correta, o Apache provavelmente
  está removendo o cabeçalho Authorization. Veja scripts/README-migracao.txt.
`.trimStart();

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                 */
/* -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Trunca um texto para caber numa linha de relatório. */
function short(value, max = 58) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Converte uma data ISO (UTC) nos campos que o WordPress espera.
 * `date` é a data no fuso do site e `date_gmt` a mesma data em UTC.
 */
function wpDates(isoString, gmtOffsetHours = 0) {
  const parsed = new Date(isoString);
  if (!isoString || Number.isNaN(parsed.getTime())) return {};
  const gmt = parsed.toISOString().slice(0, 19);
  const local = new Date(parsed.getTime() + gmtOffsetHours * 3600 * 1000)
    .toISOString()
    .slice(0, 19);
  return { date: local, date_gmt: gmt };
}

const MIME_BY_EXT = {
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

/* -------------------------------------------------------------------------- */
/* Argumentos e configuração                                                  */
/* -------------------------------------------------------------------------- */

function parseArgs(argv) {
  const options = { dryRun: false, only: null, help: false };
  const unknown = [];

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--dry-run' || arg === '--dryrun') options.dryRun = true;
    else if (arg.startsWith('--only=')) options.only = arg.slice('--only='.length).trim();
    else unknown.push(arg);
  }

  return { options, unknown };
}

function loadConfig() {
  const missing = [];
  const wpUrl = (process.env.WP_URL || '').trim().replace(/\/+$/, '');
  const wpUser = (process.env.WP_USER || '').trim();
  const wpAppPassword = (process.env.WP_APP_PASSWORD || '').trim();

  if (!wpUrl) missing.push('WP_URL             URL base do WordPress, ex.: https://cms.oncourt.com.br');
  if (!wpUser) missing.push('WP_USER            usuário do WordPress (login)');
  if (!wpAppPassword) missing.push('WP_APP_PASSWORD    senha de aplicativo (Usuários -> Perfil -> Senhas de aplicativo)');

  if (missing.length > 0) {
    console.error('\n⨯ Configuração incompleta. Defina as variáveis de ambiente abaixo:\n');
    for (const line of missing) console.error(`   - ${line}`);
    console.error('\nExemplo:\n');
    console.error('   WP_URL=https://cms.oncourt.com.br \\');
    console.error('   WP_USER=admin \\');
    console.error('   WP_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx" \\');
    console.error('   node scripts/migrate-to-wordpress.mjs --dry-run\n');
    console.error('Use --help para ver todas as opções.\n');
    process.exit(1);
  }

  if (!/^https?:\/\//i.test(wpUrl)) {
    console.error(`\n⨯ WP_URL precisa começar com http:// ou https:// (recebido: "${wpUrl}").\n`);
    process.exit(1);
  }

  return {
    wpUrl,
    wpUser,
    wpAppPassword,
    authHeader: `Basic ${Buffer.from(`${wpUser}:${wpAppPassword}`).toString('base64')}`,
  };
}

/* -------------------------------------------------------------------------- */
/* Cliente HTTP                                                               */
/* -------------------------------------------------------------------------- */

let config = null;

/**
 * Faz uma requisição à REST API do WordPress.
 * Nunca lança por causa do status: devolve sempre { ok, status, body, text }.
 */
async function wpRequest(endpoint, { method = 'GET', json, body, headers = {}, auth = true } = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${config.wpUrl}${endpoint}`;
  const requestHeaders = { Accept: 'application/json', ...headers };

  // Autenticação por Senha de Aplicativo (Authorization: Basic) — é o que
  // funciona em hospedagem real. Ver README-migracao.txt caso o servidor
  // remova este cabeçalho antes de entregá-lo ao PHP.
  if (auth) requestHeaders.Authorization = config.authHeader;

  let payload = body;
  if (json !== undefined) {
    payload = JSON.stringify(json);
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, { method, headers: requestHeaders, body: payload, redirect: 'follow' });
  } catch (error) {
    return { ok: false, status: 0, body: null, text: '', networkError: error, url };
  }

  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    body: parsed,
    text,
    url,
  };
}

/** Monta uma mensagem de erro legível a partir de uma resposta da API. */
function describeError(result) {
  if (result.networkError) {
    return `não foi possível conectar em ${result.url} (${result.networkError.message})`;
  }
  const code = result.body?.code;
  const message = result.body?.message;
  if (code || message) {
    return `HTTP ${result.status} ${code ? `[${code}] ` : ''}${message || ''}`.trim();
  }
  const snippet = short(result.text.replace(/<[^>]*>/g, ' '), 120);
  return `HTTP ${result.status}${snippet ? ` — ${snippet}` : ''}`;
}

/** 401/403 cujo código indica que o WordPress não viu credencial nenhuma. */
function looksLikeStrippedAuth(result) {
  if (result.status !== 401 && result.status !== 403) return false;
  const code = result.body?.code || '';
  return code === 'rest_not_logged_in' || code === 'rest_forbidden' || code === 'rest_cookie_invalid_nonce';
}

/** 401 cujo código indica credencial recebida porém inválida. */
function looksLikeBadCredentials(result) {
  const code = result.body?.code || '';
  return (
    code === 'incorrect_password' ||
    code === 'invalid_username' ||
    code === 'invalid_email' ||
    code === 'application_passwords_disabled' ||
    code === 'application_passwords_disabled_for_user' ||
    code.startsWith('invalid_application')
  );
}

function printStrippedAuthError({ fatal }) {
  const marker = fatal ? '⨯' : '⚠';
  console.error('');
  console.error(`${marker} A autenticação não chegou ao PHP.`);
  console.error('');
  console.error('  O WordPress respondeu 401 "rest_not_logged_in" mesmo com o cabeçalho');
  console.error('  Authorization sendo enviado. Na prática isso quer dizer que o Apache está');
  console.error('  removendo o cabeçalho Authorization antes de repassá-lo ao PHP, então a');
  console.error('  Senha de Aplicativo nunca chega a ser verificada — não adianta trocar a senha.');
  console.error('');
  console.error('  COMO CORRIGIR: adicione a linha abaixo ao arquivo .htaccess na raiz do');
  console.error('  WordPress, logo acima do bloco "# BEGIN WordPress":');
  console.error('');
  console.error('      SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1');
  console.error('');
  console.error('  Em Nginx + PHP-FPM, o equivalente é:');
  console.error('      fastcgi_param HTTP_AUTHORIZATION $http_authorization;');
  console.error('');
  console.error('  Depois disso, rode novamente com --dry-run para confirmar.');
  console.error('');
}

/* -------------------------------------------------------------------------- */
/* Leitura das fontes de dados                                                */
/* -------------------------------------------------------------------------- */

function loadArticles() {
  const raw = fs.readFileSync(ARTICLES_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : parsed.articles || parsed.data || [];
  if (!Array.isArray(list)) {
    throw new Error(`Formato inesperado em ${ARTICLES_FILE}: esperava um array de notícias.`);
  }
  return list;
}

/**
 * Extrai o array `tournaments` de lib/mockData.ts.
 *
 * mockData.ts é TypeScript e não pode ser importado por um .mjs, então o array
 * literal é lido como texto: localizamos a declaração, delimitamos o array por
 * contagem de colchetes, separamos cada objeto por contagem de chaves e lemos
 * os pares `chave: "valor"`. Todos os campos de Tournament são strings, o que
 * torna essa leitura previsível.
 */
function loadTournaments() {
  const source = fs.readFileSync(MOCKDATA_FILE, 'utf8');
  const declaration = /export\s+const\s+tournaments\s*(?::[^=]*?)?=\s*\[/.exec(source);
  if (!declaration) {
    throw new Error(`Não encontrei "export const tournaments" em ${MOCKDATA_FILE}.`);
  }

  // Delimita o array a partir do "[" da declaração (ignorando o "[]" do tipo).
  const arrayStart = declaration.index + declaration[0].length - 1;
  let depth = 0;
  let arrayEnd = -1;
  for (let i = arrayStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === '[') depth += 1;
    else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }
  if (arrayEnd === -1) {
    throw new Error(`O array "tournaments" em ${MOCKDATA_FILE} parece não estar fechado.`);
  }

  // Separa os objetos de primeiro nível.
  const arrayBody = source.slice(arrayStart + 1, arrayEnd);
  const blocks = [];
  let braceDepth = 0;
  let blockStart = -1;
  for (let i = 0; i < arrayBody.length; i += 1) {
    const char = arrayBody[i];
    if (char === '{') {
      if (braceDepth === 0) blockStart = i;
      braceDepth += 1;
    } else if (char === '}') {
      braceDepth -= 1;
      if (braceDepth === 0 && blockStart !== -1) {
        blocks.push(arrayBody.slice(blockStart + 1, i));
        blockStart = -1;
      }
    }
  }

  const pairPattern = /([A-Za-z_$][\w$]*)\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  return blocks.map((block) => {
    const entry = {};
    pairPattern.lastIndex = 0;
    let match;
    while ((match = pairPattern.exec(block)) !== null) {
      entry[match[1]] = match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    return entry;
  });
}

/* -------------------------------------------------------------------------- */
/* Relatório                                                                  */
/* -------------------------------------------------------------------------- */

const report = {
  categories: { created: 0, updated: 0, failed: 0 },
  media: { created: 0, updated: 0, failed: 0 },
  posts: { created: 0, updated: 0, failed: 0 },
  tournaments: { created: 0, updated: 0, failed: 0 },
};
const failures = [];

const LABELS = {
  categories: 'Categorias',
  media: 'Imagens',
  posts: 'Notícias',
  tournaments: 'Torneios',
};

/** Rótulo de status com largura fixa, para as colunas ficarem alinhadas. */
function statusTag(symbol, word) {
  return `${symbol} ${word.padEnd(11)}`;
}

function recordCreated(kind, label, dryRun) {
  report[kind].created += 1;
  console.log(`  ${dryRun ? statusTag('→', 'criaria') : statusTag('✓', 'criado')} ${label}`);
}

function recordUpdated(kind, label, dryRun) {
  report[kind].updated += 1;
  console.log(`  ${dryRun ? statusTag('→', 'atualizaria') : statusTag('↻', 'atualizado')} ${label}`);
}

function recordFailed(kind, label, reason) {
  report[kind].failed += 1;
  failures.push({ kind, label, reason });
  console.log(`  ${statusTag('⨯', 'falhou')} ${label} — ${reason}`);
}

function printSummary(dryRun) {
  const kinds = Object.keys(report).filter(
    (kind) => report[kind].created || report[kind].updated || report[kind].failed,
  );

  console.log('');
  console.log(dryRun ? 'RESUMO DA SIMULAÇÃO (nada foi alterado)' : 'RESUMO DA MIGRAÇÃO');
  console.log('─'.repeat(56));
  console.log(
    `${'Tipo'.padEnd(16)}${(dryRun ? 'criaria' : 'criados').padStart(12)}${(dryRun ? 'atualizaria' : 'atualizados').padStart(13)}${'falhas'.padStart(10)}`,
  );
  console.log('─'.repeat(56));
  for (const kind of kinds) {
    const row = report[kind];
    console.log(
      `${LABELS[kind].padEnd(16)}${String(row.created).padStart(12)}${String(row.updated).padStart(13)}${String(row.failed).padStart(10)}`,
    );
  }
  console.log('─'.repeat(56));

  if (failures.length > 0) {
    console.log('');
    console.log(`Falhas (${failures.length}):`);
    for (const failure of failures) {
      console.log(`  - [${LABELS[failure.kind]}] ${failure.label}: ${failure.reason}`);
    }
  }
  console.log('');
}

/* -------------------------------------------------------------------------- */
/* Preflight                                                                  */
/* -------------------------------------------------------------------------- */

async function preflight(dryRun) {
  const state = { gmtOffset: 0, authenticated: false, authStripped: false, pluginActive: false };

  console.log('PREFLIGHT');

  // 1. A REST API responde JSON?
  const root = await wpRequest('/wp-json/', { auth: false });
  if (root.networkError) {
    console.error(`  ⨯ ${describeError(root)}`);
    console.error('');
    console.error('  Verifique se WP_URL está correta e se o site está no ar.');
    console.error('');
    return { ...state, fatal: true };
  }

  const looksHtml = root.contentType.includes('text/html') || root.text.trimStart().startsWith('<');
  if (!root.body || looksHtml) {
    console.error(`  ⨯ ${config.wpUrl}/wp-json/ não devolveu JSON (HTTP ${root.status}).`);
    console.error('');
    console.error('  A resposta veio em HTML. Isso acontece quando os links permanentes do');
    console.error('  WordPress estão como "Simples" (plain) — nesse modo a rota /wp-json/ não');
    console.error('  existe.');
    console.error('');
    console.error('  COMO CORRIGIR: no painel do WordPress, vá em Configurações -> Links');
    console.error('  permanentes e selecione "Nome do post". Salve e rode o script de novo.');
    console.error('');
    return { ...state, fatal: true };
  }

  const siteName = root.body.name || '(sem nome)';
  state.gmtOffset = Number(root.body.gmt_offset ?? 0) || 0;
  console.log(`  ✓ REST API respondendo — "${siteName}" (fuso GMT${state.gmtOffset >= 0 ? '+' : ''}${state.gmtOffset})`);

  // 2. O plugin on-court-cms está ativo?
  const namespaces = Array.isArray(root.body.namespaces) ? root.body.namespaces : [];
  if (namespaces.includes('occ/v1')) {
    state.pluginActive = true;
  }
  const settings = await wpRequest('/wp-json/occ/v1/settings', { auth: false });
  if (settings.ok && settings.body) {
    state.pluginActive = true;
    console.log('  ✓ Plugin on-court-cms ativo (rota occ/v1/settings encontrada)');
  } else {
    console.warn('  ⚠ Rota occ/v1/settings NÃO encontrada — o plugin "On Court CMS" parece');
    console.warn('    estar desativado ou não instalado. Sem ele, o tipo de conteúdo');
    console.warn('    "torneio" e os campos occ_* não existem e a migração vai falhar.');
    console.warn('    Ative o plugin em Plugins -> Plugins instalados antes de continuar.');
  }

  // 3. A autenticação funciona?
  const me = await wpRequest('/wp-json/wp/v2/users/me');
  if (me.ok && me.body) {
    state.authenticated = true;
    console.log(`  ✓ Autenticado como "${me.body.slug || me.body.name || config.wpUser}"`);
  } else if (looksLikeBadCredentials(me)) {
    console.error(`  ⨯ Autenticação recusada: ${describeError(me)}`);
    console.error('');
    console.error('    O servidor recebeu as credenciais e as rejeitou. Confira WP_USER (é o');
    console.error('    login, não o e-mail) e gere uma nova Senha de Aplicativo em');
    console.error('    Usuários -> Perfil -> Senhas de aplicativo.');
    console.error('');
    return { ...state, fatal: !dryRun };
  } else if (looksLikeStrippedAuth(me)) {
    state.authStripped = true;
    printStrippedAuthError({ fatal: !dryRun });
    return { ...state, fatal: !dryRun };
  } else {
    console.error(`  ⨯ Não foi possível verificar a autenticação: ${describeError(me)}`);
    console.error('');
    return { ...state, fatal: !dryRun };
  }

  return { ...state, fatal: false };
}

/* -------------------------------------------------------------------------- */
/* Etapa: categorias                                                          */
/* -------------------------------------------------------------------------- */

async function migrateCategories({ dryRun, canQuery }) {
  console.log('');
  console.log(`CATEGORIAS (${NEWS_CATEGORIES.length})`);

  const map = new Map();

  for (const name of NEWS_CATEGORIES) {
    const slug = slugify(name);
    try {
      let existing = null;

      if (canQuery) {
        const search = await wpRequest(
          `/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}&per_page=10`,
        );
        if (!search.ok) throw new Error(describeError(search));
        existing = Array.isArray(search.body) && search.body.length > 0 ? search.body[0] : null;
      }

      if (existing) {
        map.set(name, existing.id);
        recordUpdated('categories', `${name} (já existe, id ${existing.id})`, dryRun);
        continue;
      }

      if (dryRun) {
        // `null` = seria criada agora; o mapa continua conhecendo o nome, para
        // que as notícias não sejam reportadas como "sem categoria".
        map.set(name, null);
        recordCreated('categories', `${name} (slug: ${slug})`, true);
        continue;
      }

      await sleep(WRITE_DELAY_MS);
      const created = await wpRequest('/wp-json/wp/v2/categories', {
        method: 'POST',
        json: { name, slug },
      });

      // Corrida/termo já existente: o WordPress devolve o id no erro.
      if (!created.ok && created.body?.code === 'term_exists') {
        const existingId = created.body?.data?.term_id ?? created.body?.additional_data?.[0]?.term_id;
        if (existingId) {
          map.set(name, Number(existingId));
          recordUpdated('categories', `${name} (já existe, id ${existingId})`, false);
          continue;
        }
      }

      if (!created.ok) throw new Error(describeError(created));

      map.set(name, created.body.id);
      recordCreated('categories', `${name} (id ${created.body.id})`, false);
    } catch (error) {
      recordFailed('categories', name, error.message);
    }
  }

  return map;
}

/* -------------------------------------------------------------------------- */
/* Etapa: mídia                                                               */
/* -------------------------------------------------------------------------- */

async function migrateMedia(articles, { dryRun, canQuery }) {
  const imagePaths = [...new Set(articles.map((a) => a.mainImage).filter(Boolean))].sort();

  console.log('');
  console.log(`IMAGENS (${imagePaths.length} distintas)`);

  const map = new Map();

  for (const imagePath of imagePaths) {
    const relative = imagePath.replace(/^\/+/, '');
    const absolute = path.join(PUBLIC_DIR, relative);
    const filename = path.basename(relative);
    const extension = path.extname(filename).toLowerCase();
    const mimeType = MIME_BY_EXT[extension] || 'application/octet-stream';
    const baseSlug = slugify(path.basename(filename, extension));

    try {
      if (!fs.existsSync(absolute)) {
        throw new Error(`arquivo não encontrado em public${imagePath}`);
      }

      let existing = null;
      if (canQuery) {
        const slugs = [baseSlug, `${baseSlug}-${extension.replace('.', '')}`].join(',');
        const search = await wpRequest(
          `/wp-json/wp/v2/media?slug=${encodeURIComponent(slugs)}&per_page=10`,
        );
        if (search.ok && Array.isArray(search.body) && search.body.length > 0) {
          existing = search.body[0];
        }
      }

      if (existing) {
        map.set(imagePath, existing.id);
        recordUpdated('media', `${filename} (já na biblioteca, id ${existing.id})`, dryRun);
        continue;
      }

      const sizeKb = (fs.statSync(absolute).size / 1024).toFixed(1);

      if (dryRun) {
        // `null` = seria enviada agora (ver comentário em migrateCategories).
        map.set(imagePath, null);
        recordCreated('media', `${filename} (${mimeType}, ${sizeKb} kB)`, true);
        if (extension === '.svg') {
          console.log('              ↳ atenção: o WordPress bloqueia SVG por padrão; libere o');
          console.log('                envio de SVG ou converta as imagens antes da migração real.');
        }
        continue;
      }

      await sleep(WRITE_DELAY_MS);
      const upload = await wpRequest('/wp-json/wp/v2/media', {
        method: 'POST',
        body: fs.readFileSync(absolute),
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });

      if (!upload.ok) {
        let reason = describeError(upload);
        if (extension === '.svg' && /file type|mime|not permitted|não é permitido/i.test(reason)) {
          reason += ' — o WordPress bloqueia SVG por padrão; libere o tipo image/svg+xml ou converta a imagem';
        }
        throw new Error(reason);
      }

      map.set(imagePath, upload.body.id);
      recordCreated('media', `${filename} (id ${upload.body.id})`, false);
    } catch (error) {
      recordFailed('media', filename, error.message);
    }
  }

  return map;
}

/* -------------------------------------------------------------------------- */
/* Busca por slug (idempotência)                                              */
/* -------------------------------------------------------------------------- */

/**
 * Procura um post/CPT pelo slug. Devolve { found, item, checked }.
 * `checked: false` significa que não foi possível consultar (sem autenticação),
 * e não que o item não exista.
 */
async function findBySlug(restBase, slug, canQuery) {
  if (!canQuery) return { found: false, item: null, checked: false };

  const query = `/wp-json/wp/v2/${restBase}?slug=${encodeURIComponent(slug)}&status=any&per_page=10`;
  let search = await wpRequest(query);

  // status=any exige autenticação; sem ela, consulta só o que é público.
  if (!search.ok && (search.status === 401 || search.status === 400)) {
    search = await wpRequest(`/wp-json/wp/v2/${restBase}?slug=${encodeURIComponent(slug)}&per_page=10`);
  }

  if (!search.ok) return { found: false, item: null, checked: false, error: describeError(search) };

  const item = Array.isArray(search.body) && search.body.length > 0 ? search.body[0] : null;
  return { found: Boolean(item), item, checked: true };
}

/* -------------------------------------------------------------------------- */
/* Etapa: notícias                                                            */
/* -------------------------------------------------------------------------- */

async function migratePosts(articles, { dryRun, canQuery, categoryMap, mediaMap, gmtOffset }) {
  console.log('');
  console.log(`NOTÍCIAS (${articles.length})`);

  for (const article of articles) {
    const slug = article.slug || slugify(article.title);
    const label = `${short(article.title)} [${article.category}]`;

    try {
      const categoryId = categoryMap.get(article.category);
      const featuredMedia = mediaMap.get(article.mainImage);

      const payload = {
        title: article.title,
        content: article.body || '',
        slug,
        status: article.published ? 'publish' : 'draft',
        ...wpDates(article.publishedAt, gmtOffset),
        meta: {
          occ_subtitle: article.subtitle || '',
          occ_seo_title: '',
          occ_seo_description: '',
          occ_featured: article.featured ? '1' : '0',
        },
      };
      if (categoryId) payload.categories = [categoryId];
      if (featuredMedia) payload.featured_media = featuredMedia;

      const notes = [];
      if (!categoryMap.has(article.category)) {
        notes.push(`sem categoria mapeada: "${article.category}"`);
      }
      if (article.mainImage && !mediaMap.has(article.mainImage)) {
        notes.push('sem imagem destacada');
      }
      if (!article.published) notes.push('rascunho');

      const existing = await findBySlug('posts', slug, canQuery);
      const suffix = `${notes.length > 0 ? ` (${notes.join('; ')})` : ''}`;

      if (existing.found) {
        if (dryRun) {
          recordUpdated('posts', `${label} → id ${existing.item.id}${suffix}`, true);
          continue;
        }
        await sleep(WRITE_DELAY_MS);
        const updated = await wpRequest(`/wp-json/wp/v2/posts/${existing.item.id}`, {
          method: 'POST',
          json: payload,
        });
        if (!updated.ok) throw new Error(describeError(updated));
        recordUpdated('posts', `${label} (id ${existing.item.id})${suffix}`, false);
        continue;
      }

      const unchecked = existing.checked ? '' : ' [duplicata não verificada]';

      if (dryRun) {
        recordCreated('posts', `${label}${suffix}${unchecked}`, true);
        continue;
      }

      await sleep(WRITE_DELAY_MS);
      const created = await wpRequest('/wp-json/wp/v2/posts', { method: 'POST', json: payload });
      if (!created.ok) throw new Error(describeError(created));
      recordCreated('posts', `${label} (id ${created.body.id})${suffix}`, false);
    } catch (error) {
      recordFailed('posts', label, error.message);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Etapa: torneios                                                            */
/* -------------------------------------------------------------------------- */

async function migrateTournaments(tournaments, { dryRun, canQuery }) {
  console.log('');
  console.log(`TORNEIOS (${tournaments.length})`);

  // Dois torneios com o mesmo nome viram o mesmo slug e, portanto, o mesmo
  // post — o segundo sobrescreve o primeiro. Avisa antes de escrever.
  const slugCount = new Map();
  for (const tournament of tournaments) {
    const slug = slugify(tournament.name || '');
    slugCount.set(slug, (slugCount.get(slug) || 0) + 1);
  }
  for (const [slug, count] of slugCount) {
    if (count > 1) {
      console.warn(
        `  ⚠ ${count} torneios em lib/mockData.ts geram o mesmo slug "${slug}" — eles`,
      );
      console.warn('    serão gravados no MESMO post (o último vence). Renomeie no arquivo de');
      console.warn('    origem se os dois precisarem existir no WordPress.');
    }
  }

  for (const tournament of tournaments) {
    const name = tournament.name || '';
    const slug = slugify(name);
    const label = `${short(name, 34).padEnd(34)} ${short(
      `${tournament.location}/${tournament.country} · ${tournament.startDate}→${tournament.endDate} · ${tournament.surface} · ${tournament.category} · ${tournament.prize}`,
      90,
    )}`;

    try {
      if (!name) throw new Error('torneio sem "name" em lib/mockData.ts');
      if (!slug) throw new Error(`não foi possível derivar um slug de "${name}"`);

      const payload = {
        title: name,
        slug,
        status: 'publish',
        content: '',
        meta: {
          occ_location: tournament.location || '',
          occ_country: tournament.country || '',
          occ_start_date: tournament.startDate || '',
          occ_end_date: tournament.endDate || '',
          occ_surface: tournament.surface || '',
          occ_category: tournament.category || '',
          occ_prize: tournament.prize || '',
        },
      };

      const existing = await findBySlug('torneio', slug, canQuery);

      if (existing.found) {
        if (dryRun) {
          recordUpdated('tournaments', `${label} → id ${existing.item.id}`, true);
          continue;
        }
        await sleep(WRITE_DELAY_MS);
        const updated = await wpRequest(`/wp-json/wp/v2/torneio/${existing.item.id}`, {
          method: 'POST',
          json: payload,
        });
        if (!updated.ok) throw new Error(describeError(updated));
        recordUpdated('tournaments', `${label} (id ${existing.item.id})`, false);
        continue;
      }

      const unchecked = existing.checked ? '' : ' [duplicata não verificada]';

      if (dryRun) {
        recordCreated('tournaments', `${label}${unchecked}`, true);
        continue;
      }

      await sleep(WRITE_DELAY_MS);
      const created = await wpRequest('/wp-json/wp/v2/torneio', { method: 'POST', json: payload });
      if (!created.ok) throw new Error(describeError(created));
      recordCreated('tournaments', `${label} (id ${created.body.id})`, false);
    } catch (error) {
      recordFailed('tournaments', short(name) || '(sem nome)', error.message);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  const { options, unknown } = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(HELP);
    return 0;
  }

  if (unknown.length > 0) {
    console.error(`\n⨯ Opção desconhecida: ${unknown.join(', ')}`);
    console.error('  Use --help para ver as opções disponíveis.\n');
    return 1;
  }

  const validOnly = ['posts', 'tournaments', 'categories'];
  if (options.only !== null && !validOnly.includes(options.only)) {
    console.error(`\n⨯ Valor inválido para --only: "${options.only}".`);
    console.error(`  Valores aceitos: ${validOnly.join(', ')}.\n`);
    return 1;
  }

  config = loadConfig();

  const { dryRun, only } = options;
  const doCategories = only === null || only === 'categories' || only === 'posts';
  const doMedia = only === null || only === 'posts';
  const doPosts = only === null || only === 'posts';
  const doTournaments = only === null || only === 'tournaments';

  console.log('');
  console.log('On Court Brasil → WordPress');
  console.log(`  Destino: ${config.wpUrl}`);
  console.log(`  Usuário: ${config.wpUser}`);
  console.log(`  Modo:    ${dryRun ? 'SIMULAÇÃO (--dry-run) — nada será alterado' : 'ENVIO REAL'}`);
  if (only) console.log(`  Escopo:  --only=${only}`);
  console.log('');

  // Fontes de dados — lidas antes de qualquer requisição.
  let articles = [];
  let tournaments = [];
  try {
    if (doPosts || doMedia) articles = loadArticles();
    if (doTournaments) tournaments = loadTournaments();
  } catch (error) {
    console.error(`\n⨯ Falha ao ler os dados de origem: ${error.message}\n`);
    return 1;
  }

  if (doPosts) console.log(`Lidas ${articles.length} notícias de data/articles.json`);
  if (doTournaments) console.log(`Lidos ${tournaments.length} torneios de lib/mockData.ts`);
  console.log('');

  const state = await preflight(dryRun);
  if (state.fatal) {
    console.error('⨯ Preflight falhou. Nada foi migrado.\n');
    return 1;
  }

  if (!state.authenticated && dryRun) {
    console.warn('');
    console.warn('⚠ A simulação continua apenas para listar o que seria migrado.');
    console.warn('  Com a autenticação nesse estado, o ENVIO REAL vai falhar — corrija o');
    console.warn('  problema acima antes de rodar sem --dry-run.');
  }

  const canQuery = state.authenticated;
  const context = { dryRun, canQuery, gmtOffset: state.gmtOffset };

  let categoryMap = new Map();
  let mediaMap = new Map();

  if (doCategories) categoryMap = await migrateCategories(context);
  if (doMedia) mediaMap = await migrateMedia(articles, context);
  if (doPosts) await migratePosts(articles, { ...context, categoryMap, mediaMap });
  if (doTournaments) await migrateTournaments(tournaments, context);

  printSummary(dryRun);

  const hasFailures = failures.length > 0;
  if (hasFailures) {
    console.log('Houve falhas — veja a lista acima. Rodar o script de novo é seguro:');
    console.log('itens já migrados são atualizados, não duplicados.\n');
  } else if (dryRun) {
    console.log('Simulação concluída. Nada foi alterado no WordPress.');
    if (state.authenticated) {
      console.log('Para migrar de verdade, rode o mesmo comando sem --dry-run.\n');
    } else {
      console.log('ATENÇÃO: a autenticação não funcionou (veja o aviso acima). Corrija isso');
      console.log('antes de rodar sem --dry-run, senão nenhum item será gravado.\n');
    }
  } else {
    console.log('Migração concluída sem falhas.\n');
  }

  if (!state.authenticated) return 1;
  return hasFailures ? 1 : 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`\n⨯ Erro inesperado: ${error?.stack || error}\n`);
    process.exitCode = 1;
  });
