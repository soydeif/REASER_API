import { ContentGroup, StoreItem } from "./types";
import { dbPromise } from "./database";
import axios from "axios";
import xml2js from "xml2js";

class StoreController {
  async parseRSS(url: string): Promise<{ title: string; items: any[] }> {
    try {
      const response = await axios.get(url);
      const data = response.data;

      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(data);

      if (result.rss && result.rss.channel) {
        return this.parseRSSFeed(result);
      } else if (result.feed) {
        return this.parseAtomFeed(result);
      } else {
        throw new Error("Unsupported feed format.");
      }
    } catch (error) {
      console.error("Error parsing the feed from URL:", url);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", error.message);
      } else {
        console.error("General error details:", error);
      }
      throw new Error("Failed to fetch or parse the feed.");
    }
  }

  private parseRSSFeed(result: any): { title: string; items: any[] } {
    if (!result.rss || !result.rss.channel) {
      throw new Error("Invalid RSS structure: missing channel or RSS");
    }

    const feedTitle = result.rss.channel.title || "Untitled Feed";

    const itemsArray = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : result.rss.channel.item
      ? [result.rss.channel.item]
      : [];

    const items = itemsArray.map((item: any) => {
      return {
        id: item.id || null,
        title: item.title || "No Title",
        description:
          this.extractFigcaptionEmContent(item.description || item.content) ||
          item.description ||
          item["media:description"] ||
          "",
        content:
          this.extractFirstParagraphContent(item.description || item.content) ||
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

  private parseAtomFeed(result: any): { title: string; items: any[] } {
    const feedTitle = result.feed.title;
    const items = result.feed.entry.map((entry: any) => {
      return {
        title: entry.title,
        link: entry.link.$.href,
        description:
          this.extractFigcaptionEmContent(entry.summary || entry.content) ||
          entry.summary ||
          "",
        content:
          this.extractFirstParagraphContent(entry.content || entry.summary) ||
          "",
        imageSource: this.extractImageSource(entry.content || entry.summary),
        author: entry.author ? entry.author.name : "Unknown Author",
        publishedAt: entry.published || "",
      };
    });
    return { title: feedTitle, items };
  }

  private extractContentString(content: any): string | null {
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
        textContent += content.p.map((p: any) => p._ || "").join(" ");
      } else if (content.p && typeof content.p === "object") {
        textContent += content.p._ || "";
      }

      if (content.figcaption) {
        textContent += content.figcaption;
      }

      return textContent.trim() || null;
    } else if (typeof content === "string") {
      return content;
    } else {
      console.error("Content no es una cadena:", content);
      return null;
    }
  }

  private extractImageSource(content: any): string | null {
    const contentString = this.extractContentString(content);
    if (contentString === null) {
      return null;
    }

    const regex = /<img[^>]+src="([^">]+)"/;
    const match = contentString.match(regex);
    return match ? match[1] : null;
  }

  private extractFigcaptionEmContent(content: any): string | null {
    const contentString = this.extractContentString(content);
    if (contentString === null) {
      return null;
    }

    const figcaptionRegex =
      /<figcaption[^>]*>.*?<em>(.*?)<\/em>.*?<\/figcaption>/;
    const figcaptionMatch = contentString.match(figcaptionRegex);
    return figcaptionMatch ? figcaptionMatch[1].trim() : null;
  }

  private extractFirstParagraphContent(content: any): string | null {
    const contentString = this.extractContentString(content);
    if (contentString === null) {
      return null;
    }

    const paragraphRegex = /<p\b[^>]*>(.*?)<\/p>/;
    const paragraphMatch = contentString.match(paragraphRegex);
    return paragraphMatch ? paragraphMatch[1] : null;
  }

  async addItem(
    url: string,
    category: string,
    feedTitle: string
  ): Promise<StoreItem> {
    const db = await dbPromise;
    try {
      const result = await db.run(
        "INSERT INTO feeds (url, category, feedTitle) VALUES (?, ?, ?)",
        [url, category, feedTitle]
      );

      if (result.lastID === undefined) {
        throw new Error("Failed to insert new feed item");
      }

      const parsedFeed = await this.parseRSS(url);

      if (
        !parsedFeed ||
        !parsedFeed.items ||
        !Array.isArray(parsedFeed.items)
      ) {
        throw new Error("No items found in parsed feed");
      }

      const contentGroup = [];
      for (const item of parsedFeed.items) {
        const insertResult = await db.run(
          `INSERT INTO feed_items (feed_id, title, link, description, content, imageSource, author, publishedAt, favorite) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            result.lastID,
            item.title || "",
            item.link || "",
            item.description || "",
            item.content || "",
            item.imageSource || null,
            item.author || null,
            item.publishedAt || null,
            item.favorite || false,
          ]
        );

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error al parsear el feed:", error.message);
        throw new Error("No se pudo obtener o parsear el feed.");
      } else {
        console.error("Error inesperado:", error);
        throw new Error("Error inesperado al procesar el feed.");
      }
    }
  }

  async updateItem(
    id: number,
    url: string,
    category: string,
    feedTitle: string
  ): Promise<StoreItem | null> {
    const db = await dbPromise;
    try {
      const result = await db.run(
        "UPDATE feeds SET url = ?, category = ?, feedTitle = ? WHERE id = ?",
        [url, category, feedTitle, id]
      );

      if (result.changes === undefined || result.changes === 0) {
        return null;
      }

      const parsedFeed = await this.parseRSS(url);

      return {
        id,
        url,
        category,
        feedTitle: parsedFeed.title,
        contentGroup: parsedFeed.items,
      };
    } catch (error) {
      console.error("Error in updateItem:", error);
      throw error;
    }
  }

  async updateFavoriteStatus(
    feedId: number,
    itemId: number,
    favorite: boolean
  ): Promise<StoreItem | null> {
    const db = await dbPromise;
    try {
      const existingItem = await db.get(
        `SELECT * FROM feed_items WHERE feed_id = ? AND id = ?`,
        [feedId, itemId]
      );

      if (!existingItem) {
        console.log(`No item found with feed_id: ${feedId} and id: ${itemId}`);
        return null;
      }

      const result = await db.run(
        `UPDATE feed_items SET favorite = ? WHERE feed_id = ? AND id = ?`,
        [favorite, feedId, itemId]
      );

      if (result.changes === 0) {
        console.log(`No changes made for feed_id: ${feedId} and id: ${itemId}`);
        return null;
      }

      const updatedItem = await db.get(
        `SELECT * FROM feed_items WHERE feed_id = ? AND id = ?`,
        [feedId, itemId]
      );

      return updatedItem;
    } catch (error) {
      console.error("Error updating favorite status:", error);
      throw error;
    }
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
    const items = await db.all("SELECT * FROM feeds");

    const storeItems: StoreItem[] = await Promise.all(
      items.map(async (item: StoreItem) => {
        const parsedFeedItems = await db.all(
          "SELECT * FROM feed_items WHERE feed_id = ?",
          item.id
        );

        const contentGroup = parsedFeedItems.map((feedItem: ContentGroup) => ({
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
      })
    );

    return storeItems;
  }

  async getFavoriteItems(): Promise<StoreItem[]> {
    const db = await dbPromise;
    const feeds = await db.all("SELECT * FROM feeds");

    const favoriteItems = await Promise.all(
      feeds.map(async (feed: StoreItem) => {
        const items = await db.all(
          "SELECT * FROM feed_items WHERE feed_id = ? AND favorite = ?",
          [feed.id, true]
        );
        return { ...feed, contentGroup: items };
      })
    );

    return favoriteItems.filter((feed) => feed.contentGroup.length > 0);
  }

  async filterItemsByCategory(category: string): Promise<StoreItem[]> {
    const db = await dbPromise;
    const items = await db.all(
      "SELECT * FROM feeds WHERE category = ?",
      category
    );

    const storeItems: StoreItem[] = await Promise.all(
      items.map(async (item: StoreItem) => {
        const parsedFeed = await this.parseRSS(item.url);
        return {
          id: item.id,
          url: item.url,
          category: item.category,
          feedTitle: parsedFeed.title,
          contentGroup: parsedFeed.items,
        };
      })
    );

    return storeItems;
  }
}

export const storeController = new StoreController();
