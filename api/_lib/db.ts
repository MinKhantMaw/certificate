import pg, { type Pool, type PoolClient, type QueryResultRow } from 'pg';

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  pool = new pg.Pool(url ? { connectionString: url } : {
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'yse',
    max: 10,
  });
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, values: unknown[] = []): Promise<T[]> {
  let index = 0;
  const postgresSql = sql.replace(/\?/g, () => `$${++index}`);
  const result = await getPool().query<T>(postgresSql, values);
  return result.rows;
}

export async function transaction<T>(callback: (connection: PoolClient) => Promise<T>): Promise<T> {
  const connection = await getPool().connect();
  try {
    await connection.query('BEGIN');
    const result = await callback(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return value ? value as T : fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function serverError(error: unknown): string {
  return process.env.NODE_ENV === 'production' ? 'Internal server error.' : error instanceof Error ? error.message : String(error);
}