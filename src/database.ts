import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

export let client: Client;
let isConnected = false;
async function connectDatabase() {
  if (!client) {
    const connectionString =
      process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_PUBLIC_URL;

    if (!connectionString) {
      console.error(
        "DATABASE_PRIVATE_URL o DATABASE_PUBLIC_URL no están definidas."
      );
      throw new Error(
        "No se encontró una variable de conexión válida. Verifica que DATABASE_PRIVATE_URL o DATABASE_PUBLIC_URL estén definidas."
      );
    }

    try {
      const url = new URL(connectionString);
      console.log("Conectando a PostgreSQL en host:", url.hostname);
    } catch (err) {
      console.error("Error al parsear el connection string:", err);
    }

    client = new Client({
      connectionString,
      ssl:
        connectionString === process.env.DATABASE_PUBLIC_URL
          ? { rejectUnauthorized: false }
          : undefined,
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
  if (!client) {
    console.log("No hay conexión de base de datos activa para cerrar.");
    return;
  }

  try {
    await client.end();
    isConnected = false;
    console.log("Conexión a la base de datos cerrada.");
  } catch (error) {
    console.error("Error al cerrar la conexión a la base de datos:", error);
  }
}
