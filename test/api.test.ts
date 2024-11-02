import request from "supertest";
import app from "../src/app";
import { dbPromise, initializeDatabase } from "../src/database";
import nock from "nock";
import fs from "fs/promises";

describe("API Endpoints", () => {
  let feedId;

  beforeAll(async () => {
    const db = await dbPromise;
    await initializeDatabase();

    const documentStructure = await fs.readFile(
      "test/testStructure.xml",
      "utf-8"
    );

    nock("https://www.theverge.com")
      .get("/rss/index.xml")
      .reply(200, documentStructure);

    await clearDatabase(db);
  });

  afterEach(async () => {
    const db = await dbPromise;
    await clearDatabase(db);
    nock.cleanAll();
  });

  afterAll(async () => {
    const db = await dbPromise;
    await db.close();
  });

  const clearDatabase = async (db) => {
    await db.exec("DELETE FROM feeds");
    await db.exec("DELETE FROM feed_items");
  };

  const createFeed = async (
    url = "https://www.theverge.com/rss/index.xml",
    category = "news",
    feedTitle = "The Verge"
  ) => {
    const res = await request(app)
      .post("/api/addfeed")
      .send({ url, category, feedTitle });
    return res.body;
  };

  const expectFeedResponse = (res, url, category, feedTitle) => {
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("url", url);
    if (category) {
      expect(res.body).toHaveProperty("category", category);
    } else if (feedTitle) {
      expect(res.body).toHaveProperty("feedTitle", feedTitle);
    }
  };

  it("should add a new feed", async () => {
    const feedData = {
      url: "https://www.theverge.com/rss/index.xml",
      category: "news",
      feedTitle: "The Verge",
    };
    const res = await request(app).post("/api/addfeed").send(feedData);

    expectFeedResponse(
      res,
      feedData.url,
      feedData.category,
      feedData.feedTitle
    );
    feedId = res.body.id;
  });

  it("should get the list of feeds", async () => {
    await createFeed();
    const res = await request(app).get("/api/myfeeds");

    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should update the feed", async () => {
    const feed = await createFeed();
    feedId = feed.id;

    const updatedData = {
      url: "https://www.theverge.com/rss/index.xml",
      category: "updated-news",
      feedTitle: "The VERGE",
    };
    const res = await request(app)
      .put(`/api/updatefeed/${feedId}`)
      .send(updatedData);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("url", updatedData.url);
  });

  it("should update favorite status of a feed item", async () => {
    const feed = await createFeed();
    feedId = feed.id;
    const itemId = feed.contentGroup[0].id;

    const res = await request(app)
      .patch(`/api/updatefeed/${feedId}/contentgroup/${itemId}/favorite`)
      .send({ favorite: 1 });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("favorite", 1);
  });

  it("should retrieve favorite items", async () => {
    const feed = await createFeed();
    feedId = feed.id;
    const itemId = feed.contentGroup[0].id;

    await request(app)
      .patch(`/api/updatefeed/${feedId}/contentgroup/${itemId}/favorite`)
      .send({ favorite: 1 });

    const res = await request(app).get("/api/myfeeds/favorites");

    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].contentGroup.some((item) => item.favorite)).toBe(true);
  });

  it("should filter feeds by category", async () => {
    await createFeed();
    await createFeed("https://www.theverge.com/rss/index.xml", "sports");

    const res = await request(app).get("/api/myfeeds/filter?category=news");

    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((feed) => feed.category === "news")).toBe(true);
  });

  it("should delete the feed", async () => {
    const feed = await createFeed();
    feedId = feed.id;

    const res = await request(app).delete(`/api/deletefeed/${feedId}`);
    expect(res.statusCode).toEqual(204);
  });

  it("should not find the deleted feed", async () => {
    const feed = await createFeed();
    feedId = feed.id;
    await request(app).delete(`/api/deletefeed/${feedId}`);

    const res = await request(app).get("/api/myfeeds");

    expect(res.statusCode).toEqual(200);
    expect(res.body.some((feed) => feed.id === feedId)).toBe(false);
  });
});
