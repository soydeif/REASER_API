import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

export let client: Client;
let isConnected = false;
async function connectDatabase() {
  if (!client) {
    console.log("¡no es client");
    client = new Client({
      connectionString:
        process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_PUBLIC_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  if (!isConnected) {
    console.log("Intentando conectar a la base de datos...");
    try {
      await client.connect();
      isConnected = true;
      console.log("Conectado a la base de datos.");
    } catch (error) {
      console.error("Failed to connect to PostgreSQL:", error);
      throw error;
    }
  }

  return client;
}

export async function initializeDatabase() {
  const db = await connectDatabase();

  await db.query(`
    CREATE TABLE IF NOT EXISTS feeds (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        category TEXT NOT NULL,
        feedTitle TEXT NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS feed_items (
        id SERIAL PRIMARY KEY,
        feed_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        description TEXT,
        content TEXT,
        imagesource TEXT,
        author TEXT,
        publishedat TIMESTAMP,
        favorite BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE
    )
  `);

  console.log("Database initialized");
}

export async function initializeTestDatabase() {
  const db = await connectDatabase();

  await db.query(`
    CREATE TABLE IF NOT EXISTS test_feeds (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        category TEXT NOT NULL,
        feedTitle TEXT NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS test_feed_items (
        id SERIAL PRIMARY KEY,
        feed_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        description TEXT,
        content TEXT,
        imagesource TEXT,
        author TEXT,
        publishedat TIMESTAMP,
        favorite BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (feed_id) REFERENCES test_feeds (id) ON DELETE CASCADE
    )
  `);

  console.log("Test database initialized");
}

export async function clearTestDatabase() {
  const db = await connectDatabase();
  await db.query("DELETE FROM test_feed_items");
  await db.query("DELETE FROM test_feeds");
}

export async function closeDatabaseConnection() {
  await client.end();
  isConnected = false;
  console.log("Database connection closed.");
}
