import request from "supertest";
import app from "../src/app";
import { dbPromise } from "../src/database";

describe("API Endpoints", () => {
  let feedId: number;

  beforeAll(async () => {
    await dbPromise;
  });

  beforeEach(async () => {
    const db = await dbPromise;
    await db.run("DELETE FROM feeds");
  });

  afterAll(async () => {
    const db = await dbPromise;
    await db.close();
  });

  it("should add a new feed", async () => {
    const res = await request(app)
      .post("/api/addfeed")
      .send({ url: "https://example.com/rss", category: "news" });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("url", "https://example.com/rss");

    feedId = res.body.id;
  });

  it("should get the list of feeds", async () => {
    await request(app)
      .post("/api/addfeed")
      .send({ url: "https://example.com/rss", category: "news" });

    const res = await request(app).get("/api/myfeeds");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should update the feed", async () => {
    const postRes = await request(app)
      .post("/api/addfeed")
      .send({ url: "https://example.com/rss", category: "news" });

    feedId = postRes.body.id;
    const res = await request(app).put(`/api/updatefeed/${feedId}`).send({
      url: "https://example.com/rss-updated",
      category: "updated-news",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("url", "https://example.com/rss-updated");
  });

  it("should delete the feed", async () => {
    const postRes = await request(app)
      .post("/api/addfeed")
      .send({ url: "https://example.com/rss", category: "news" });

    feedId = postRes.body.id;

    const res = await request(app).delete(`/api/deletefeed/${feedId}`);
    expect(res.statusCode).toEqual(204);
  });

  it("should not find the deleted feed", async () => {
    const postRes = await request(app)
      .post("/api/addfeed")
      .send({ url: "https://example.com/rss", category: "news" });

    feedId = postRes.body.id;
    await request(app).delete(`/api/deletefeed/${feedId}`);

    const res = await request(app).get("/api/myfeeds");
    expect(res.statusCode).toEqual(200);
    expect(res.body.some((feed: any) => feed.id === feedId)).toBe(false);
  });
});
