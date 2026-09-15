import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || process.env.PGPORT || 3306),
  user: process.env.DB_USER || process.env.PGUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'password123',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'certificates',
};

const adminConnection = await mysql.createConnection({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  multipleStatements: true,
});

try {
  const safeName = config.database.replace(/[`\\'";]/g, '');
  await adminConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${safeName}\``);
  console.log(`MySQL database is ready: ${config.database}`);
} finally {
  await adminConnection.end();
}

const connection = await mysql.createConnection({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  multipleStatements: true,
});

try {
  const schemaSql = await fs.readFile(path.resolve(process.cwd(), 'db', 'schema.sql'), 'utf8');
  await connection.query(schemaSql);

  const indexChecks = [
    { table: 'templates', index: 'idx_templates_status', ddl: 'CREATE INDEX idx_templates_status ON templates(status)' },
    { table: 'import_batches', index: 'idx_import_batches_created_at', ddl: 'CREATE INDEX idx_import_batches_created_at ON import_batches(created_at DESC)' },
    { table: 'documents', index: 'idx_documents_template_status', ddl: 'CREATE INDEX idx_documents_template_status ON documents(template_id, status)' },
    { table: 'documents', index: 'idx_documents_created_at', ddl: 'CREATE INDEX idx_documents_created_at ON documents(created_at DESC)' },
    { table: 'documents', index: 'idx_documents_verification_token', ddl: 'CREATE INDEX idx_documents_verification_token ON documents(verification_token)' },
    { table: 'audit_logs', index: 'idx_audit_logs_entity', ddl: 'CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id)' },
  ];

  for (const { table, index, ddl } of indexChecks) {
    const [rows] = await connection.query(
      'SELECT COUNT(*) AS count FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
      [table, index],
    ) as unknown as [{ count: number }[]];
    if (Number(rows[0]?.count || 0) === 0) {
      await connection.query(ddl);
    }
  }

  console.log('MySQL schema applied successfully.');
} finally {
  await connection.end();
}