import express from "express";
import { storeController } from "./store";

const router = express.Router();

// Endpoint para agregar un nuevo feed
router.post("/addfeed", async (req, res) => {
  const { url, category } = req.body;
  try {
    const newItem = await storeController.addItem(url, category);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error in addfeed:", error); // Manejo de errores
    res.status(500).json({ error: "Error adding item" });
  }
});

// Endpoint para obtener todos los feeds
router.get("/myfeeds", async (req, res) => {
  try {
    const items = await storeController.getAllItems();
    res.json(items);
  } catch (error) {
    console.error("Error in myfeeds:", error); // Manejo de errores
    res.status(500).json({ error: "Error fetching items" });
  }
});

// Endpoint para actualizar un feed existente
router.put("/updatefeed/:id", async (req, res) => {
  const { id } = req.params;
  const { url, category } = req.body;
  try {
    const updatedItem = await storeController.updateItem(
      Number(id),
      url,
      category
    );
    if (updatedItem) {
      res.json(updatedItem);
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (error) {
    console.error("Error in updatefeed:", error); // Manejo de errores
    res.status(500).json({ error: "Error updating item" });
  }
});

// Endpoint para eliminar un feed
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
    console.error("Error in deletefeed:", error); // Manejo de errores
    res.status(500).json({ error: "Error deleting item" });
  }
});

// Endpoint para filtrar feeds por categoría
router.get("/myfeeds/filter", async (req, res) => {
  const { category } = req.query;
  if (typeof category === "string") {
    try {
      const filteredItems = await storeController.filterItemsByCategory(
        category
      );
      res.json(filteredItems);
    } catch (error) {
      console.error("Error in filter items:", error); // Manejo de errores
      res.status(500).json({ error: "Error filtering items" });
    }
  } else {
    res.status(400).json({ error: "Invalid category parameter" });
  }
});

export default router;
