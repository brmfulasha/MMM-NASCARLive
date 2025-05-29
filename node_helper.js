const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
  start: function () {
    console.log("Starting node_helper for MMM-NASCARLive...");
  },

  /**
   * Handles socket notifications from the frontend.
   * Expects "GET_NASCAR_DATA" and a payload (the data URL).
   */
  socketNotificationReceived: function (notification, payload) {
    console.log(`Socket notification received: ${notification}`);
    if (notification === "GET_NASCAR_DATA") {
      if (!payload) {
        console.error("No data URL provided for GET_NASCAR_DATA.");
        this.sendSocketNotification("NASCAR_ERROR", "No data URL provided.");
        return;
      }
      this.fetchData(payload);
    } else {
      console.log(`Unhandled notification: ${notification}`);
    }
  },

  /**
   * Fetches NASCAR data from the given URL using the native https module and sends it back to the frontend.
   * If the fetch fails, sends an error notification.
   */
  fetchData: function (jsonUrl) {
    const self = this;
    console.log("Initiating HTTPS GET request to:", jsonUrl);

    https.get(jsonUrl, (res) => {
      let data = "";

      // A chunk of data has been received.
      res.on("data", (chunk) => {
        data += chunk;
      });

      // The whole response has been received.
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Invalid NASCAR data received.");
          }
          self.sendSocketNotification("NASCAR_DATA", parsed);
        } catch (error) {
          console.error("Error parsing NASCAR data:", error.message);
          self.sendSocketNotification("NASCAR_ERROR", error.message);
        }
      });
    }).on("error", (error) => {
      console.error("Error fetching NASCAR data:", error.message);
      self.sendSocketNotification("NASCAR_ERROR", error.message);
    });
  }
});
