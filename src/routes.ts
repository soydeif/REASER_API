import express from "express";
import { storeController } from "./store";

const router = express.Router();

router.post("/addfeed", (req, res) => {
  const { url, category } = req.body;
  const newItem = storeController.addItem(url, category);
  res.status(201).json(newItem);
});

router.get("/myfeeds", (req, res) => {
  const items = storeController.getAllItems();
  res.json(items);
});

router.put("/updatefeed/:id", (req, res) => {
  const { id } = req.params;
  const { url, category } = req.body;
  const updatedItem = storeController.updateItem(Number(id), url, category);
  if (updatedItem) {
    res.json(updatedItem);
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

router.delete("/deletefeed/:id", (req, res) => {
  const { id } = req.params;
  const success = storeController.deleteItem(Number(id));
  if (success) {
    res.sendStatus(204);
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

router.get("/myfeeds/filter", (req, res) => {
  const { category } = req.query;
  if (typeof category === "string") {
    const filteredItems = storeController.filterItemsByCategory(category);
    res.json(filteredItems);
  } else {
    res.status(400).json({ error: "Invalid category parameter" });
  }
});

export default router;
