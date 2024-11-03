"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const database_1 = require("./database");
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "http://localhost:5173"],
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: "Too many requests. Try again later.",
});
app.use(express_1.default.json());
// app.use("/api", apiKeyMiddleware);
app.use("/api", limiter);
app.use("/api", routes_1.default);
app.set("trust proxy", 1);
let client;
(0, database_1.initializeDatabase)()
    .then(() => {
    if (process.env.NODE_ENV !== "test") {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
})
    .catch((err) => {
    console.error("Failed to initialize database:", err);
});
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV !== "test" && client) {
        yield client.end();
    }
    process.exit(0);
}));
exports.default = app;
