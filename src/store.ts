import { StoreItem } from "./types";
import { dbPromise } from "./database";

class StoreController {
  async addItem(url: string, category: string): Promise<StoreItem> {
    const db = await dbPromise;
    try {
      const result = await db.run(
        "INSERT INTO feeds (url, category) VALUES (?, ?)",
        [url, category]
      );
      if (result.lastID === undefined) {
        throw new Error("Failed to insert new item");
      }
      return { id: result.lastID, url, category };
    } catch (error) {
      console.error("Error in addItem:", error);
      throw error;
    }
  }

  async updateItem(
    id: number,
    url: string,
    category: string
  ): Promise<StoreItem | null> {
    const db = await dbPromise;
    const result = await db.run(
      "UPDATE feeds SET url = ?, category = ? WHERE id = ?",
      [url, category, id]
    );
    if (result.changes === undefined) {
      throw new Error("Failed to update item");
    }
    return result.changes > 0 ? { id, url, category } : null;
  }

  async deleteItem(id: number): Promise<boolean> {
    const db = await dbPromise;
    try {
      const result = await db.run("DELETE FROM feeds WHERE id = ?", id);
      if (result.changes === undefined) {
        throw new Error("Failed to delete item");
      }
      return result.changes > 0;
    } catch (error) {
      console.error("Error in deleteItem:", error);
      throw error;
    }
  }

  async getAllItems(): Promise<StoreItem[]> {
    const db = await dbPromise;
    return await db.all("SELECT * FROM feeds");
  }

  async filterItemsByCategory(category: string): Promise<StoreItem[]> {
    const db = await dbPromise;
    return await db.all("SELECT * FROM feeds WHERE category = ?", category);
  }
}

export const storeController = new StoreController();
