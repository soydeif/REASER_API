import express from "express";
import { storeController } from "./store";

const router = express.Router();

router.post("/addfeed", async (req, res) => {
  const { url, category, feedtitle } = req.body;
  try {
    const newItem = await storeController.addItem(url, category, feedtitle);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error in addfeed:", error);
    res.status(500).json({ error: "Error adding item" });
  }
});

router.get("/myfeeds", async (req, res) => {
  try {
    const items = await storeController.getAllItems();
    res.json(items);
  } catch (error) {
    console.error("Error in myfeeds:", error);
    res.status(500).json({ error: "Error fetching items" });
  }
});

router.put("/updatefeed/:id", async (req, res) => {
  const { id } = req.params;
  const { url, category, feedtitle } = req.body;
  try {
    const updatedItem = await storeController.updateItem(
      Number(id),
      url,
      category,
      feedtitle
    );
    if (updatedItem) {
      res.json(updatedItem);
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (error) {
    console.error("Error in updatefeed:", error);
    res.status(500).json({ error: "Error updating item" });
  }
});

router.patch(
  "/updatefeed/:feedId/contentgroup/:itemId/favorite",
  async (req, res) => {
    const { feedId, itemId } = req.params;
    const { favorite } = req.body;
    const isFavorite = favorite === 1;

    try {
      const updatedFeed = await storeController.updateFavoriteStatus(
        Number(feedId),
        Number(itemId),
        isFavorite
      );

      if (updatedFeed) {
        res.json(updatedFeed);
      } else {
        res.status(404).json({ error: "Item or feed not found" });
      }
    } catch (error) {
      console.error("Error updating favorite status:", error);
      res.status(500).json({ error: "Error updating favorite status" });
    }
  }
);

router.delete("/deletefeed/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const success = await storeController.deleteItem(Number(id));
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (error) {
    console.error("Error in deletefeed:", error);
    res.status(500).json({ error: "Error deleting item" });
  }
});

router.get("/myfeeds/filter", async (req, res) => {
  const { category } = req.query;
  if (typeof category === "string") {
    try {
      const filteredItems = await storeController.filterItemsByCategory(
        category
      );
      res.json(filteredItems);
    } catch (error) {
      console.error("Error in filter items:", error);
      res.status(500).json({ error: "Error filtering items" });
    }
  } else {
    res.status(400).json({ error: "Invalid category parameter" });
  }
});

router.get("/myfeeds/favorites", async (req, res) => {
  try {
    const favoriteItems = await storeController.getFavoriteItems();
    res.json(favoriteItems);
  } catch (error) {
    console.error("Error retrieving favorite items:", error);
    res.status(500).json({ error: "Error retrieving favorite items" });
  }
});

router.get("/update-feeds", async (req, res) => {
  try {
    console.log("Updating all feeds...");
    await storeController.updateAllFeeds();
    res.status(200).json({ message: "Feeds updated successfully" });
  } catch (error) {
    console.error("Error updating feeds:", error);
    res.status(500).json({ error: "Failed to update feeds" });
  }
});

export default router;
