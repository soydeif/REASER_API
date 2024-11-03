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
exports.dbPromise = void 0;
exports.initializeDatabase = initializeDatabase;
const pg_1 = require("pg");
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const isTest = process.env.NODE_ENV === "test";
let dbPromise;
if (isTest) {
    exports.dbPromise = dbPromise = (0, sqlite_1.open)({
        filename: ":memory:",
        driver: sqlite3_1.default.Database,
    });
}
else {
    const client = new pg_1.Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });
    exports.dbPromise = dbPromise = (() => __awaiter(void 0, void 0, void 0, function* () {
        yield client.connect();
        return client;
    }))();
}
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield dbPromise;
        if (isTest) {
            yield db.exec(`
            CREATE TABLE IF NOT EXISTS feeds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                category TEXT NOT NULL,
                feedTitle TEXT NOT NULL
            )
        `);
            yield db.exec(`
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
        }
        else {
            yield db.query(`
            CREATE TABLE IF NOT EXISTS feeds (
                id SERIAL PRIMARY KEY,
                url TEXT NOT NULL,
                category TEXT NOT NULL,
                feedTitle TEXT NOT NULL
            )
        `);
            yield db.query(`
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
    });
}
