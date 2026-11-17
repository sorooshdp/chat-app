import path from "path";
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const useSsl =
  process.env.DB_SSL === "true" ||
  DATABASE_URL.includes("sslmode=require");

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: useSsl
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

export interface Database {
  query<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
  connect(): Promise<PoolClient>;
  end(): Promise<void>;
}

export const db: Database = {
  query<T extends QueryResultRow = any>(text: string, params?: unknown[]) {
    return pool.query<T>(text, params);
  },
  connect() {
    return pool.connect();
  },
  end() {
    return pool.end();
  },
};

export default db;