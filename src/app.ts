import express from "express";
import router from "./routes";
import {
  initializeDatabase,
  initializeTestDatabase,
  clearTestDatabase,
  closeDatabaseConnection,
} from "./database";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
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
    origin: "*",
  })
);

app.use("/api", limiter);
app.use("/api", router);
app.set("trust proxy", 1);

(async () => {
  try {
    if (process.env.NODE_ENV === "test") {
      await initializeTestDatabase();
    } else {
      await initializeDatabase();
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
})();

process.on("SIGINT", async () => {
  if (process.env.NODE_ENV === "test") {
    await clearTestDatabase();
  } else {
    await closeDatabaseConnection();
  }
  process.exit(0);
});

export default app;
