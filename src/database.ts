import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Client } from "pg";

const isTest = process.env.NODE_ENV === "test";

export let dbPromise: Promise<any>;

if (isTest) {
  dbPromise = open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });
} else {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  dbPromise = (async () => {
    try {
      await client.connect();
      return client;
    } catch (error) {
      console.error("Failed to connect to PostgreSQL:", error);
      throw error;
    }
  })();
}

export async function initializeDatabase() {
  const db = await dbPromise;

  if (isTest) {
    await db.exec(`
            CREATE TABLE IF NOT EXISTS feeds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                category TEXT NOT NULL,
                feedTitle TEXT NOT NULL
            )
        `);

    await db.exec(`
            CREATE TABLE IF NOT EXISTS feed_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                feed_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                link TEXT NOT NULL,
                description TEXT,
                content TEXT,
                imageSource TEXT,
                author TEXT,
                publishedAt TEXT,
                favorite BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE
            )
        `);
  } else {
    const client = await dbPromise;
    await client.query(`
            CREATE TABLE IF NOT EXISTS feeds (
                id SERIAL PRIMARY KEY,
                url TEXT NOT NULL,
                category TEXT NOT NULL,
                feedTitle TEXT NOT NULL
            )
        `);

    await client.query(`
            CREATE TABLE IF NOT EXISTS feed_items (
                id SERIAL PRIMARY KEY,
                feed_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                link TEXT NOT NULL,
                description TEXT,
                content TEXT,
                imageSource TEXT,
                author TEXT,
                publishedAt TIMESTAMP,
                favorite BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE
            )
        `);
  }

  console.log("Database initialized");
}
