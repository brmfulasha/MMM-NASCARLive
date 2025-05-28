const https = require("https");

/**
 * Fetches live NASCAR data from the official endpoint and logs the results.
 */
function fetchNASCARLiveData() {
  const url = "https://cf.nascar.com/live/feeds/live-feed.json";

  https.get(url, (res) => {
    let data = "";

    // A chunk of data has been received.
    res.on("data", (chunk) => {
      data += chunk;
    });

    // The whole response has been received.
    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        console.log("NASCAR Live Data:", json);
        // You can process or export the JSON here as needed.
      } catch (err) {
        console.error("Error parsing NASCAR Live JSON:", err);
      }
    });
  }).on("error", (err) => {
    console.error("Error fetching NASCAR Live feed:", err);
  });
}

// Example usage:
fetchNASCARLiveData();

module.exports = {
  fetchNASCARLiveData
};
