const axios = require('axios');

async function getAllFeeds() {
  try {
    const response = await axios.get("https://reaserapi-production.up.railway.app/api/myfeeds");
    return response.data; 
  } catch (error) {
    console.error("Failed to fetch feeds:", error.response ? error.response.data : error.message);
    return [];
  }
}

async function deleteFeed(id) {
  try {
    await axios.delete(`https://reaserapi-production.up.railway.app/api/deletefeed/${id}`);
    console.log(`Deleted feed with ID: ${id}`);
  } catch (error) {
    console.error(`Failed to delete feed with ID: ${id}`, error.response ? error.response.data : error.message);
  }
}

async function deleteAllFeeds() {
  const feeds = await getAllFeeds(); 
  for (const feed of feeds) {
    await deleteFeed(feed.id); 
  }
  console.log("All feeds deleted successfully.");
}

deleteAllFeeds();
