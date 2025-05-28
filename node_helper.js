const NodeHelper = require("node_helper");
const https = require("https");

const FEED_URL = "https://cf.nascar.com/live/feeds/live-feed.json";

module.exports = NodeHelper.create({
  start: function () {
    console.log("Starting node_helper for MMM-NASCARLive...");
    this.scheduleDailyFetch();
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "FETCH_NASCAR_DATA") {
      this.fetchNASCARLiveData();
    }
  },

  /**
   * Schedules the NASCAR data fetch to run once a day at 6:00 AM server time.
   */
  scheduleDailyFetch: function () {
    const now = new Date();
    const next6am = new Date(now);
    next6am.setHours(6, 0, 0, 0);
    if (now >= next6am) {
      next6am.setDate(next6am.getDate() + 1); // Next day
    }
    const msUntil6am = next6am - now;
    setTimeout(() => {
      this.fetchNASCARLiveData();
      setInterval(() => this.fetchNASCARLiveData(), 24 * 60 * 60 * 1000); // Repeat every 24 hours
    }, msUntil6am);
  },

  fetchNASCARLiveData: function () {
    const self = this;
    https.get(FEED_URL, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          // Vehicles array with running_position, vehicle_number, full_name, delta
          if (!json.vehicles || !Array.isArray(json.vehicles)) {
            throw new Error("No vehicles data in NASCAR feed.");
          }

          // Get top 10 by running_position (as number)
          const top10 = json.vehicles
            .filter(
              (v) =>
                v &&
                typeof v.running_position === "number" &&
                !!v.full_name &&
                !!v.vehicle_number
            )
            .sort((a, b) => a.running_position - b.running_position)
            .slice(0, 10)
            .map((v) => ({
              running_position: v.running_position,
              vehicle_number: v.vehicle_number,
              full_name: v.full_name,
              delta: v.delta,
            }));

          self.sendSocketNotification("NASCAR_DATA", {
            top10,
            raceActive: !!json.race_id,
            raceName: json.track_name || "NASCAR Race",
          });
        } catch (err) {
          console.error("Error parsing NASCAR Live JSON:", err);
          self.sendSocketNotification("NASCAR_ERROR", err.message);
        }
      });
    }).on("error", (err) => {
      console.error("Error fetching NASCAR Live feed:", err);
      self.sendSocketNotification("NASCAR_ERROR", err.message);
    });
  },
});
