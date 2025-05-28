const NodeHelper = require("node_helper");
const https = require("https");

const FEED_URL = "https://cf.nascar.com/live/feeds/live-feed.json";

module.exports = NodeHelper.create({
  start: function () {
    console.log("Starting node_helper for MMM-NASCARLive...");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "FETCH_NASCAR_DATA") {
      const driverCount = payload && payload.driverCount ? payload.driverCount : 10;
      this.fetchNASCARLiveData(driverCount);
    }
  },

  fetchNASCARLiveData: function (driverCount) {
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

          // Get top N by running_position (as number)
          const drivers = json.vehicles
            .filter(
              (v) =>
                v &&
                typeof v.running_position === "number" &&
                !!v.full_name &&
                !!v.vehicle_number
            )
            .sort((a, b) => a.running_position - b.running_position)
            .slice(0, driverCount)
            .map((v) => ({
              running_position: v.running_position,
              vehicle_number: v.vehicle_number,
              full_name: v.full_name,
              delta: v.delta || "",
            }));

          // Determine if a race is currently active (basic check: vehicles exist)
          const raceActive = drivers.length > 0;
          const raceName = json.race_name || "NASCAR Live";

          self.sendSocketNotification("NASCAR_DATA", {
            drivers,
            raceActive,
            raceName,
          });
        } catch (error) {
          console.error("Error parsing NASCAR data:", error);
          self.sendSocketNotification("NASCAR_ERROR", error.message);
        }
      });
    }).on("error", (error) => {
      console.error("Error fetching NASCAR data:", error);
      self.sendSocketNotification("NASCAR_ERROR", error.message);
    });
  },
});
