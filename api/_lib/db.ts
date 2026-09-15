import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';

export function getDbConfig() {
  const url = process.env.DATABASE_URL;

  if (url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname || process.env.DB_HOST || '127.0.0.1',
        port: Number(parsed.port || process.env.DB_PORT || 3306),
        user: parsed.username || process.env.DB_USER || 'root',
        password: parsed.password || process.env.DB_PASSWORD || 'password123',
        database: parsed.pathname.replace(/^\/+/, '') || process.env.DB_NAME || 'certificates',
      };
    } catch {
      // Fall through to explicit env-based config if the URL is invalid.
    }
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'certificates',
  };
}

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  pool = mysql.createPool({
    ...getDbConfig(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
  });
  return pool;
}

export async function query<T = Record<string, unknown>>(sql: string, values: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().execute(sql, values as any[]);
  return rows as T[];
}

export async function transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
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