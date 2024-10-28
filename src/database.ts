import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const dbPromise = open({
  filename: process.env.DATABASE_URL || "./database.db",
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
