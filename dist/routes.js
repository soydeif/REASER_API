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
const store_1 = require("./store");
const router = express_1.default.Router();
router.post("/addfeed", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, category, feedTitle } = req.body;
    try {
        const newItem = yield store_1.storeController.addItem(url, category, feedTitle);
        res.status(201).json(newItem);
    }
    catch (error) {
        console.error("Error in addfeed:", error);
        res.status(500).json({ error: "Error adding item" });
    }
}));
router.get("/myfeeds", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield store_1.storeController.getAllItems();
        res.json(items);
    }
    catch (error) {
        console.error("Error in myfeeds:", error);
        res.status(500).json({ error: "Error fetching items" });
    }
}));
router.put("/updatefeed/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { url, category, feedTitle } = req.body;
    try {
        const updatedItem = yield store_1.storeController.updateItem(Number(id), url, category, feedTitle);
        if (updatedItem) {
            res.json(updatedItem);
        }
        else {
            res.status(404).json({ error: "Item not found" });
        }
    }
    catch (error) {
        console.error("Error in updatefeed:", error);
        res.status(500).json({ error: "Error updating item" });
    }
}));
router.patch("/updatefeed/:feedId/contentgroup/:itemId/favorite", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { feedId, itemId } = req.params;
    const { favorite } = req.body;
    const isFavorite = favorite === 1;
    try {
        const updatedFeed = yield store_1.storeController.updateFavoriteStatus(Number(feedId), Number(itemId), isFavorite);
        if (updatedFeed) {
            res.json(updatedFeed);
        }
        else {
            res.status(404).json({ error: "Item or feed not found" });
        }
    }
    catch (error) {
        console.error("Error updating favorite status:", error);
        res.status(500).json({ error: "Error updating favorite status" });
    }
}));
router.delete("/deletefeed/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const success = yield store_1.storeController.deleteItem(Number(id));
        if (success) {
            res.sendStatus(204);
        }
        else {
            res.status(404).json({ error: "Item not found" });
        }
    }
    catch (error) {
        console.error("Error in deletefeed:", error);
        res.status(500).json({ error: "Error deleting item" });
    }
}));
router.get("/myfeeds/filter", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { category } = req.query;
    if (typeof category === "string") {
        try {
            const filteredItems = yield store_1.storeController.filterItemsByCategory(category);
            res.json(filteredItems);
        }
        catch (error) {
            console.error("Error in filter items:", error);
            res.status(500).json({ error: "Error filtering items" });
        }
    }
    else {
        res.status(400).json({ error: "Invalid category parameter" });
    }
}));
router.get("/myfeeds/favorites", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const favoriteItems = yield store_1.storeController.getFavoriteItems();
        res.json(favoriteItems);
    }
    catch (error) {
        console.error("Error retrieving favorite items:", error);
        res.status(500).json({ error: "Error retrieving favorite items" });
    }
}));
exports.default = router;
