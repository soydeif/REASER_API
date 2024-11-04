import { ContentGroup, StoreItem } from "./types";
import { client as dbPromise } from "./database";
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

    const feedtitle = result.rss.channel.title || "Untitled Feed";

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
        imagesource: this.extractImageSource(item.description || item.content),
        author: item["media:credit"] || item.author || "Unknown Author",
        publishedat: item.pubDate || "",
        favorite: false,
      };
    });

    return { title: feedtitle, items };
  }

  private parseAtomFeed(result: any): { title: string; items: any[] } {
    const feedtitle = result.feed.title;
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
        imagesource: this.extractImageSource(entry.content || entry.summary),
        author: entry.author ? entry.author.name : "Unknown Author",
        publishedat: entry.published || "",
      };
    });
    return { title: feedtitle, items };
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
    feedtitle: string
  ): Promise<StoreItem> {
    const db = await dbPromise;
    try {
      const result = await db.query(
        "INSERT INTO feeds (url, category, feedtitle) VALUES ($1, $2, $3) RETURNING id",
        [url, category, feedtitle]
      );

      const lastID = result.rows[0]?.id;

      if (!lastID) {
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
        const insertResult = await db.query(
          `INSERT INTO feed_items (feed_id, title, link, description, content, imagesource, author, publishedat, favorite) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [
            lastID,
            item.title || "",
            item.link || "",
            item.description || "",
            item.content || "",
            item.imagesource || null,
            item.author || null,
            item.publishedat || null,
            item.favorite || false,
          ]
        );

        contentGroup.push({
          id: insertResult.rows[0]?.id,
          title: item.title,
          link: item.link,
          description: item.description,
          content: item.content,
          imagesource: item.imagesource,
          author: item.author,
          publishedat: item.publishedat,
          favorite: false,
        });
      }

      return {
        id: lastID,
        url,
        category,
        feedtitle: parsedFeed.title,
        contentGroup,
      };
    } catch (error) {
      console.error("Error al agregar item:", error);
      throw new Error("No se pudo agregar el item.");
    }
  }

  async updateItem(
    id: number,
    url: string,
    category: string,
    feedtitle: string
  ): Promise<StoreItem | null> {
    const db = await dbPromise;
    try {
      const parsedFeed = await this.parseRSS(url);

      if (!feedtitle) {
        throw new Error("El título del feed no puede ser nulo o vacío.");
      }

      const result = await db.query(
        "UPDATE feeds SET url = $1, category = $2, feedtitle = $3 WHERE id = $4",
        [url, category, feedtitle, id]
      );

      if (result.rowCount === undefined || result.rowCount === 0) {
        return null;
      }

      return {
        id,
        url,
        category,
        feedtitle,
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
      const existingItemResult = await db.query(
        `SELECT * FROM feed_items WHERE feed_id = $1 AND id = $2`,
        [feedId, itemId]
      );
      const existingItem = existingItemResult.rows[0];

      if (!existingItem) {
        console.log(`No item found with feed_id: ${feedId} and id: ${itemId}`);
        return null;
      }

      const result = await db.query(
        `UPDATE feed_items SET favorite = $1 WHERE feed_id = $2 AND id = $3`,
        [favorite, feedId, itemId]
      );

      if (result.rowCount === 0) {
        console.log(`No changes made for feed_id: ${feedId} and id: ${itemId}`);
        return null;
      }

      const updatedItemResult = await db.query(
        `SELECT * FROM feed_items WHERE feed_id = $1 AND id = $2`,
        [feedId, itemId]
      );

      return updatedItemResult.rows[0];
    } catch (error) {
      console.error("Error updating favorite status:", error);
      throw error;
    }
  }

  async deleteItem(id: number): Promise<boolean | undefined> {
    const db = await dbPromise;
    try {
      const result = await db.query("DELETE FROM feeds WHERE id = $1", [id]);

      const wasDeleted = result.rowCount !== null && result.rowCount > 0;

      if (wasDeleted) {
        console.log("Item erased successfully.");
      } else {
        console.log("No item found to delete with the provided id.");
      }

      return wasDeleted;
    } catch (error) {
      console.error("Error in deleteItem:", error);

      return undefined;
    }
  }

  async getAllItems(): Promise<StoreItem[]> {
    const db = await dbPromise;

    const result = await db.query("SELECT * FROM feeds");
    const items = result.rows;

    const storeItems: StoreItem[] = await Promise.all(
      items.map(async (item: StoreItem) => {
        const feedItemsResult = await db.query(
          "SELECT * FROM feed_items WHERE feed_id = $1",
          [item.id]
        );

        const contentGroup = feedItemsResult.rows.map(
          (feedItem: ContentGroup) => {
            return {
              id: feedItem.id,
              title: feedItem.title,
              link: feedItem.link,
              description: feedItem.description,
              content: feedItem.content,
              imagesource: feedItem.imagesource,
              author: feedItem.author,
              publishedat: feedItem.publishedat,
              favorite: feedItem.favorite,
            };
          }
        );

        return {
          id: item.id,
          url: item.url,
          category: item.category,
          feedtitle: item.feedtitle,
          contentGroup,
        };
      })
    );

    return storeItems;
  }

  async getFavoriteItems(): Promise<StoreItem[]> {
    const db = await dbPromise;

    try {
      const feedsResult = await db.query("SELECT * FROM feeds");
      const feeds = feedsResult.rows;

      const favoriteItems = await Promise.all(
        feeds.map(async (feed: StoreItem) => {
          const itemsResult = await db.query(
            "SELECT * FROM feed_items WHERE feed_id = $1 AND favorite = $2",
            [feed.id, true]
          );
          const items = itemsResult.rows;

          return { ...feed, contentGroup: items };
        })
      );

      return favoriteItems.filter(
        (feed: { contentGroup: string | any[] }) => feed.contentGroup.length > 0
      );
    } catch (error) {
      console.error("Error retrieving favorite items:", error);
      throw new Error("Error retrieving favorite items");
    }
  }

  async filterItemsByCategory(category: string): Promise<StoreItem[]> {
    const db = await dbPromise;
    const result = await db.query("SELECT * FROM feeds WHERE category = $1", [
      category,
    ]);
    const items = result.rows;

    const storeItems: StoreItem[] = await Promise.all(
      items.map(async (item: StoreItem) => {
        const feedItemsResult = await db.query(
          "SELECT * FROM feed_items WHERE feed_id = $1",
          [item.id]
        );

        const contentGroup = feedItemsResult.rows.map(
          (feedItem: ContentGroup) => ({
            id: feedItem.id,
            title: feedItem.title,
            link: feedItem.link,
            description: feedItem.description,
            content: feedItem.content,
            imagesource: feedItem.imagesource,
            author: feedItem.author,
            publishedat: feedItem.publishedat,
            favorite: feedItem.favorite,
          })
        );

        return {
          id: item.id,
          url: item.url,
          category: item.category,
          feedtitle: item.feedtitle,
          contentGroup,
        };
      })
    );

    return storeItems;
  }
}

export const storeController = new StoreController();
