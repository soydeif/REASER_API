import sqlite3 from "sqlite3";
import { open } from "sqlite";

const isTest = process.env.NODE_ENV === "test";

export const dbPromise = open({
  filename: isTest ? ":memory:" : process.env.DATABASE_URL || "./database.db",
  driver: sqlite3.Database,
});

export async function initializeDatabase() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      category TEXT NOT NULL
    )
  `);
}
