import express from "express";
import router from "./routes";
import { initializeDatabase } from "./database";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: "Too many request. Try again later.",
});

app.use(express.json());

// app.use("/api", apiKeyMiddleware);

app.use("/api", limiter);
app.use("/api", router);

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error("Failed to initialize database:", err);
  });
