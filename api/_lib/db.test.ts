import { afterEach, describe, expect, it } from 'vitest';
import { getDbConfig } from './db';

afterEach(() => {
  delete process.env.DATABASE_URL;
  delete process.env.DB_HOST;
  delete process.env.DB_PORT;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;
  delete process.env.DB_NAME;
});

describe('getDbConfig', () => {
  it('reads the MySQL connection details from the configured environment', () => {
    process.env.DATABASE_URL = 'mysql://root:password123@127.0.0.1:3306/certificates';

    expect(getDbConfig()).toMatchObject({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'password123',
      database: 'certificates',
    });
  });

  it('supports the DB_* variables when no DATABASE_URL is set', () => {
    process.env.DB_HOST = '127.0.0.1';
    process.env.DB_PORT = '3306';
    process.env.DB_USER = 'root';
    process.env.DB_PASSWORD = 'password123';
    process.env.DB_NAME = 'certificates';

    expect(getDbConfig()).toMatchObject({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'password123',
      database: 'certificates',
    });
  });
});
