import { readFile } from 'node:fs/promises';
import pg from 'pg';

const connection = new pg.Client(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || '', database: process.env.PGDATABASE || 'yse',
});
await connection.connect();

try {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await connection.query(schema);
  console.log('PostgreSQL schema migrated successfully.');
} finally {
  await connection.end();
}