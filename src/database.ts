import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Exportar el dbPromise para usarlo en StoreController
export const dbPromise = open({
  filename: process.env.DATABASE_URL || "./database.db", // Usar la variable de entorno
  driver: sqlite3.Database,
});

// Función para inicializar la base de datos
export async function initializeDatabase() {
  const db = await dbPromise;

  // Crea la tabla "feeds" si no existe
  await db.exec(`
    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      category TEXT NOT NULL
    )
  `);
}
