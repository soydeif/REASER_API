import request from "supertest";
import app from "../src/app";
import { storeController } from "../src/store";
import { closeDatabaseConnection } from "../src/database";

jest.mock("../src/store");

describe("API Routes", () => {
  const mockItem = {
    id: 1,
    url: "https://www.example.com/rss",
    category: "news",
    feedtitle: "Example Feed",
    contentGroup: [],
  };

  const mockFeedItems = [
    { id: 1, title: "Article 1", link: "https://link1.com", favorite: false },
    { id: 2, title: "Article 2", link: "https://link2.com", favorite: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it("should add a new feed", async () => {
    const feedData = {
      url: "https://www.example.com/rss",
      category: "news",
      feedtitle: "Example Feed",
    };

    (storeController.addItem as jest.Mock).mockResolvedValue({
      ...mockItem,
      contentGroup: mockFeedItems,
    });

    const res = await request(app).post("/api/addfeed").send(feedData);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({ ...mockItem, contentGroup: mockFeedItems })
    );
    expect(storeController.addItem).toHaveBeenCalledWith(
      feedData.url,
      feedData.category,
      feedData.feedtitle
    );
  });

  it("should get all feeds", async () => {
    (storeController.getAllItems as jest.Mock).mockResolvedValue([mockItem]);

    const res = await request(app).get("/api/myfeeds");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([mockItem]);
    expect(storeController.getAllItems).toHaveBeenCalled();
  });

  it("should update a feed by ID", async () => {
    const updatedFeed = {
      ...mockItem,
      url: "https://www.updated.com/rss",
      category: "updated-category",
    };

    (storeController.updateItem as jest.Mock).mockResolvedValue(updatedFeed);

    const res = await request(app)
      .put(`/api/updatefeed/${mockItem.id}`)
      .send(updatedFeed);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedFeed);
    expect(storeController.updateItem).toHaveBeenCalledWith(
      mockItem.id,
      updatedFeed.url,
      updatedFeed.category,
      updatedFeed.feedtitle
    );
  });

  it("should update the favorite status of a feed item", async () => {
    const initialFavoriteStatus = mockFeedItems[1].favorite;
    const favoriteStatus = { favorite: !initialFavoriteStatus };
    const updatedItem = {
      ...mockFeedItems[1],
      favorite: favoriteStatus.favorite,
    };

    (storeController.updateFavoriteStatus as jest.Mock).mockImplementation(
      (feedId, itemId, favorite) =>
        Promise.resolve({ ...updatedItem, favorite: !initialFavoriteStatus })
    );

    const res = await request(app)
      .patch(
        `/api/updatefeed/${mockItem.id}/contentgroup/${updatedItem.id}/favorite`
      )
      .send(favoriteStatus);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ...updatedItem,
      favorite: favoriteStatus.favorite,
    });
    expect(storeController.updateFavoriteStatus).toHaveBeenCalledTimes(1);
    expect(storeController.updateFavoriteStatus).toHaveBeenCalledWith(
      mockItem.id,
      updatedItem.id,
      favoriteStatus.favorite
    );
  });

  it("should delete a feed by ID", async () => {
    (storeController.deleteItem as jest.Mock).mockResolvedValue(true);

    const res = await request(app).delete(`/api/deletefeed/${mockItem.id}`);

    expect(res.status).toBe(204);
    expect(storeController.deleteItem).toHaveBeenCalledWith(mockItem.id);
  });

  it("should filter feeds by category", async () => {
    (storeController.filterItemsByCategory as jest.Mock).mockResolvedValue([
      mockItem,
    ]);

    const res = await request(app)
      .get("/api/myfeeds/filter")
      .query({ category: mockItem.category });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([mockItem]);
    expect(storeController.filterItemsByCategory).toHaveBeenCalledWith(
      mockItem.category
    );
  });

  it("should get favorite items", async () => {
    (storeController.getFavoriteItems as jest.Mock).mockResolvedValue([
      mockItem,
    ]);

    const res = await request(app).get("/api/myfeeds/favorites");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([mockItem]);
    expect(storeController.getFavoriteItems).toHaveBeenCalled();
  });
});
