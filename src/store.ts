import { Store, StoreItem } from "./types";

class StoreController {
  private store: Store = { items: [] };
  private idCounter: number = 0;

  addItem(url: string, category: string): StoreItem {
    const newItem: StoreItem = { id: this.idCounter++, url, category };
    this.store.items.push(newItem);
    return newItem;
  }

  updateItem(id: number, url: string, category: string): StoreItem | null {
    const item = this.store.items.find((item) => item.id === id);
    if (item) {
      item.url = url;
      item.category = category;
    }
    return item || null;
  }

  deleteItem(id: number): boolean {
    const index = this.store.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.store.items.splice(index, 1);
      return true;
    }
    return false;
  }

  getAllItems(): StoreItem[] {
    return this.store.items;
  }

  filterItemsByCategory(category: string): StoreItem[] {
    return this.store.items.filter((item) => item.category === category);
  }
}

export const storeController = new StoreController();
