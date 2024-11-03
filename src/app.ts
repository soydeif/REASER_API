import express from "express";
import router from "./routes";
import { initializeDatabase } from "./database";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { Client } from "pg";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: "Too many requests. Try again later.",
});
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
  })
);

// app.use("/api", apiKeyMiddleware);
app.use("/api", limiter);
app.use("/api", router);
app.set("trust proxy", 1);

let client: Client;
initializeDatabase()
  .then(() => {
    if (process.env.NODE_ENV !== "test") {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  })
  .catch((err: any) => {
    console.error("Failed to initialize database:", err);
  });

process.on("SIGINT", async () => {
  if (process.env.NODE_ENV !== "test" && client) {
    await client.end();
  }
  process.exit(0);
});
export default app;
