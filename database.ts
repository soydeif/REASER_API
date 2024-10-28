import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Crear la conexión a la base de datos
const dbPromise = open({
  filename: "./database.db",
  driver: sqlite3.Database,
});

export default dbPromise;
