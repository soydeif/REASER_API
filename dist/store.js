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
exports.storeController = void 0;
const database_1 = require("./database");
const axios_1 = __importDefault(require("axios"));
const xml2js_1 = __importDefault(require("xml2js"));
class StoreController {
    parseRSS(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(url);
                const data = response.data;
                const parser = new xml2js_1.default.Parser({ explicitArray: false });
                const result = yield parser.parseStringPromise(data);
                if (result.rss && result.rss.channel) {
                    return this.parseRSSFeed(result);
                }
                else if (result.feed) {
                    return this.parseAtomFeed(result);
                }
                else {
                    throw new Error("Unsupported feed format.");
                }
            }
            catch (error) {
                console.error("Error parsing the feed from URL:", url);
                if (axios_1.default.isAxiosError(error)) {
                    console.error("Axios error details:", error.message);
                }
                else {
                    console.error("General error details:", error);
                }
                throw new Error("Failed to fetch or parse the feed.");
            }
        });
    }
    parseRSSFeed(result) {
        if (!result.rss || !result.rss.channel) {
            throw new Error("Invalid RSS structure: missing channel or RSS");
        }
        const feedTitle = result.rss.channel.title || "Untitled Feed";
        const itemsArray = Array.isArray(result.rss.channel.item)
            ? result.rss.channel.item
            : result.rss.channel.item
                ? [result.rss.channel.item]
                : [];
        const items = itemsArray.map((item) => {
            return {
                id: item.id || null,
                title: item.title || "No Title",
                description: this.extractFigcaptionEmContent(item.description || item.content) ||
                    item.description ||
                    item["media:description"] ||
                    "",
                content: this.extractFirstParagraphContent(item.description || item.content) ||
                    item["media:description"] ||
                    "",
                link: item.link || "",
                imageSource: this.extractImageSource(item.description || item.content),
                author: item["media:credit"] || item.author || "Unknown Author",
                publishedAt: item.pubDate || "",
                favorite: false,
            };
        });
        return { title: feedTitle, items };
    }
    parseAtomFeed(result) {
        const feedTitle = result.feed.title;
        const items = result.feed.entry.map((entry) => {
            return {
                title: entry.title,
                link: entry.link.$.href,
                description: this.extractFigcaptionEmContent(entry.summary || entry.content) ||
                    entry.summary ||
                    "",
                content: this.extractFirstParagraphContent(entry.content || entry.summary) ||
                    "",
                imageSource: this.extractImageSource(entry.content || entry.summary),
                author: entry.author ? entry.author.name : "Unknown Author",
                publishedAt: entry.published || "",
            };
        });
        return { title: feedTitle, items };
    }
    extractContentString(content) {
        if (content === undefined) {
            console.error("Content es undefined");
            return null;
        }
        if (typeof content === "object" && content !== null) {
            if (content._ && typeof content._ === "string") {
                return content._;
            }
            let textContent = "";
            if (Array.isArray(content.p)) {
                textContent += content.p.map((p) => p._ || "").join(" ");
            }
            else if (content.p && typeof content.p === "object") {
                textContent += content.p._ || "";
            }
            if (content.figcaption) {
                textContent += content.figcaption;
            }
            return textContent.trim() || null;
        }
        else if (typeof content === "string") {
            return content;
        }
        else {
            console.error("Content no es una cadena:", content);
            return null;
        }
    }
    extractImageSource(content) {
        const contentString = this.extractContentString(content);
        if (contentString === null) {
            return null;
        }
        const regex = /<img[^>]+src="([^">]+)"/;
        const match = contentString.match(regex);
        return match ? match[1] : null;
    }
    extractFigcaptionEmContent(content) {
        const contentString = this.extractContentString(content);
        if (contentString === null) {
            return null;
        }
        const figcaptionRegex = /<figcaption[^>]*>.*?<em>(.*?)<\/em>.*?<\/figcaption>/;
        const figcaptionMatch = contentString.match(figcaptionRegex);
        return figcaptionMatch ? figcaptionMatch[1].trim() : null;
    }
    extractFirstParagraphContent(content) {
        const contentString = this.extractContentString(content);
        if (contentString === null) {
            return null;
        }
        const paragraphRegex = /<p\b[^>]*>(.*?)<\/p>/;
        const paragraphMatch = contentString.match(paragraphRegex);
        return paragraphMatch ? paragraphMatch[1] : null;
    }
    addItem(url, category, feedTitle) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield database_1.dbPromise;
            try {
                const result = yield db.run("INSERT INTO feeds (url, category, feedTitle) VALUES (?, ?, ?)", [url, category, feedTitle]);
                if (result.lastID === undefined) {
                    throw new Error("Failed to insert new feed item");
                }
                const parsedFeed = yield this.parseRSS(url);
                if (!parsedFeed ||
                    !parsedFeed.items ||
                    !Array.isArray(parsedFeed.items)) {
                    throw new Error("No items found in parsed feed");
                }
                const contentGroup = [];
                for (const item of parsedFeed.items) {
                    const insertResult = yield db.run(`INSERT INTO feed_items (feed_id, title, link, description, content, imageSource, author, publishedAt, favorite) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        result.lastID,
                        item.title || "",
                        item.link || "",
                        item.description || "",
                        item.content || "",
                        item.imageSource || null,
                        item.author || null,
                        item.publishedAt || null,
                        item.favorite || false,
                    ]);
                    contentGroup.push({
                        id: insertResult.lastID,
                        title: item.title,
                        link: item.link,
                        description: item.description,
                        content: item.content,
                        imageSource: item.imageSource,
                        author: item.author,
                        publishedAt: item.publishedAt,
                        favorite: false,
                    });
                }
                return {
                    id: result.lastID,
                    url,
                    category,
                    feedTitle: parsedFeed.title,
                    contentGroup,
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Error al parsear el feed:", error.message);
                    throw new Error("No se pudo obtener o parsear el feed.");
                }
                else {
                    console.error("Error inesperado:", error);
                    throw new Error("Error inesperado al procesar el feed.");
                }
            }
        });
    }
    updateItem(id, url, category, feedTitle) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield database_1.dbPromise;
            try {
                const result = yield db.run("UPDATE feeds SET url = ?, category = ?, feedTitle = ? WHERE id = ?", [url, category, feedTitle, id]);
                if (result.changes === undefined || result.changes === 0) {
                    return null;
                }
                const parsedFeed = yield this.parseRSS(url);
                return {
                    id,
                    url,
                    category,
                    feedTitle: parsedFeed.title,
                    contentGroup: parsedFeed.items,
                };
            }
            catch (error) {
                console.error("Error in updateItem:", error);
                throw error;
            }
        });
    }
    updateFavoriteStatus(feedId, itemId, favorite) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield database_1.dbPromise;
            try {
                const existingItem = yield db.get(`SELECT * FROM feed_items WHERE feed_id = ? AND id = ?`, [feedId, itemId]);
                if (!existingItem) {
                    console.log(`No item found with feed_id: ${feedId} and id: ${itemId}`);
                    return null;
                }
                const result = yield db.run(`UPDATE feed_items SET favorite = ? WHERE feed_id = ? AND id = ?`, [favorite, feedId, itemId]);
                if (result.changes === 0) {
                    console.log(`No changes made for feed_id: ${feedId} and id: ${itemId}`);
                    return null;
                }
                const updatedItem = yield db.get(`SELECT * FROM feed_items WHERE feed_id = ? AND id = ?`, [feedId, itemId]);
                return updatedItem;
            }
            catch (error) {
                console.error("Error updating favorite status:", error);
                throw error;
            }
        });
    }
    deleteItem(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield database_1.dbPromise;
            try {
                const result = yield db.run("DELETE FROM feeds WHERE id = ?", id);
                if (result.changes === undefined) {
                    throw new Error("Failed to delete item");
                }
                return result.changes > 0;
            }
            catch (error) {
                console.error("Error in deleteItem:", error);
                throw error;
            }
        });
    }
    getAllItems() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield database_1.dbPromise;
            const items = yield db.all("SELECT * FROM feeds");
            const storeItems = yield Promise.all(items.map((item) => __awaiter(this, void 0, void 0, function* () {
                const parsedFeedItems = yield db.all("SELECT * FROM feed_items WHERE feed_id = ?", item.id);
                console.log({ item });
                const contentGroup = parsedFeedItems.map((feedItem) => ({
                    id: feedItem.id,
                    title: feedItem.title,
                    link: feedItem.link,
                    description: feedItem.description,
                    content: feedItem.content,
                    imageSource: feedItem.imageSource,
                    author: feedItem.author,
                    publishedAt: feedItem.publishedAt,
                    favorite: feedItem.favorite,
                }));
                return {
                    id: item.id,
                    url: item.url,
                    category: item.category,
                    feedTitle: item.feedTitle,
                    contentGroup,
                };
            })));
            return storeItems;
        });
    }
    getFavoriteItems() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield database_1.dbPromise;
            const feeds = yield db.all("SELECT * FROM feeds");
            const favoriteItems = yield Promise.all(feeds.map((feed) => __awaiter(this, void 0, void 0, function* () {
                const items = yield db.all("SELECT * FROM feed_items WHERE feed_id = ? AND favorite = ?", [feed.id, true]);
                return Object.assign(Object.assign({}, feed), { contentGroup: items });
            })));
            return favoriteItems.filter((feed) => feed.contentGroup.length > 0);
        });
    }
    filterItemsByCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield database_1.dbPromise;
            const items = yield db.all("SELECT * FROM feeds WHERE category = ?", category);
            const storeItems = yield Promise.all(items.map((item) => __awaiter(this, void 0, void 0, function* () {
                const parsedFeed = yield this.parseRSS(item.url);
                return {
                    id: item.id,
                    url: item.url,
                    category: item.category,
                    feedTitle: parsedFeed.title,
                    contentGroup: parsedFeed.items,
                };
            })));
            return storeItems;
        });
    }
}
exports.storeController = new StoreController();
