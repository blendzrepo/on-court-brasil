#!/usr/bin/env node
/**
 * Applies pending Payload migrations before the Next.js build.
 *
 * This is what creates the tables on a fresh database, so a deploy to a newly
 * provisioned Postgres works without anyone running commands by hand.
 *
 * It deliberately never fails the build. The public pages fall back to local
 * content when the database is unreachable, so a site that still serves its
 * articles is better than a deploy that is rejected outright — the failure is
 * logged loudly instead, and only the admin panel is affected.
 */

import { spawnSync } from 'node:child_process';

const connectionString =
  process.env.DATABASE_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.log(
    '[predeploy] No database connection string set — skipping migrations. ' +
      'The site will serve local fallback content and the admin panel will not work ' +
      'until DATABASE_URI (or Vercel\'s POSTGRES_URL) is configured.',
  );
  process.exit(0);
}

console.log('[predeploy] Applying Payload migrations...');

const result = spawnSync('npx', ['payload', 'migrate'], {
  stdio: 'inherit',
  env: process.env,
  // Payload's CLI is resolved through the shell on some hosts.
  shell: process.platform === 'win32',
});

if (result.error) {
  console.warn(`[predeploy] Could not run the migration command: ${result.error.message}`);
  console.warn('[predeploy] Continuing with the build; the admin panel may be unavailable.');
  process.exit(0);
}

if (result.status !== 0) {
  console.warn(`[predeploy] Migrations exited with code ${result.status}.`);
  console.warn(
    '[predeploy] Continuing with the build. Check that the database is reachable and ' +
      'that the connection string points at it; the public site keeps serving ' +
      'its fallback content meanwhile.',
  );
  process.exit(0);
}

console.log('[predeploy] Migrations applied.');
