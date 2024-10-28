import express from "express";
import router from "./routes";
import { initializeDatabase } from "./database";
import dotenv from "dotenv";
import { apiKeyMiddleware } from "./middleware"; // Importar el middleware de autenticación

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", apiKeyMiddleware); // Aplicar el middleware para verificar la clave API
app.use("/api", router); // Definir las rutas de la API

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error("Failed to initialize database:", err);
  });
