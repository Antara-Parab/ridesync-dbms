import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.MYSQL_HOST || '127.0.0.1';
    const port = Number(process.env.MYSQL_PORT) || 3306;
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD ?? '';
    const database = process.env.MYSQL_DATABASE || 'ridesync_db';
    const sslRequired = process.env.MYSQL_SSL === 'true' || process.env.MYSQL_SSL === '1';

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      dateStrings: true,
      ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const pool = getDbPool();
  const [rows] = await pool.query(sql, params);
  return rows as T;
}
