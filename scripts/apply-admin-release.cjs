'use strict';

// One-time, explicitly invoked release migration. Never run from npm start.
// Usage (from an authorized Render shell/job with DATABASE_URL already configured):
//   node scripts/apply-admin-release.cjs --apply
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const files = [
  '20261122-admin-business-access.sql',
  '20261122-business-complaints.sql',
  '20261122-business-moderation.sql'
];
const expectedTables = [
  'admin_business_audit',
  'business_complaints',
  'business_moderation_decisions',
  'business_moderation_appeals'
];
const expectedColumns = [
  'moderation_status',
  'moderation_until',
  'moderation_decision_id'
];

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== '--apply') {
    console.error('No changes made. Explicit --apply flag required.');
    process.exitCode = 2;
    return;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. No changes made.');
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });
  await client.connect();
  let inTransaction = false;
  try {
    const identity = await client.query('SELECT current_database() AS db, current_user AS username');
    console.log('Connected to database:', identity.rows[0].db);
    await client.query('BEGIN');
    inTransaction = true;
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '60s'");
    // Prevent concurrent executions of this one-time migration.
    await client.query('SELECT pg_advisory_xact_lock(20261122, 1)');

    for (const filename of files) {
      const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', filename), 'utf8')
        .replace(/^\s*BEGIN\s*;\s*/i, '')
        .replace(/\s*COMMIT\s*;\s*$/i, '');
      if (!sql.trim()) throw new Error('Empty migration: ' + filename);
      await client.query(sql);
      console.log('Applied:', filename);
    }

    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
      [expectedTables]
    );
    const columns = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_profiles' AND column_name = ANY($1::text[])",
      [expectedColumns]
    );
    const foundTables = new Set(tables.rows.map(row => row.table_name));
    const foundColumns = new Set(columns.rows.map(row => row.column_name));
    for (const name of expectedTables) {
      if (!foundTables.has(name)) throw new Error('Missing table: ' + name);
    }
    for (const name of expectedColumns) {
      if (!foundColumns.has(name)) throw new Error('Missing column: ' + name);
    }

    await client.query('COMMIT');
    inTransaction = false;
    console.log('Release schema verified. Migration committed.');
  } catch (error) {
    if (inTransaction) {
      try { await client.query('ROLLBACK'); } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(error => {
  // Do not print DATABASE_URL or credentials.
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
