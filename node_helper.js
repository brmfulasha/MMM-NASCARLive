const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-NASCARLive helper started...");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_NASCAR_DATA") {
      this.getNascarData(payload);
    }
  },

  getNascarData: function (url) {
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);

            // Top-level fields
            let flag_state = json["flag_state"] || "";
            let run_name = json["run_name"] || "";
            let series_id = json["series_id"] || "1"; // in case you want this, fallback for image URLs

            let drivers = Array.isArray(json["vehicles"])
              ? json["vehicles"].map((car) => ({
                  running_position: car.running_position,
                  full_name: car.driver.full_name,
                  vehicle_number: car.vehicle_number,
                }))
              : [];

            this.sendSocketNotification("NASCAR_DATA", {
              flag_state,
              run_name,
              series_id,
              drivers,
            });
          } catch (e) {
            console.error("MMM-NASCARLive: Error parsing NASCAR data", e);
            this.sendSocketNotification(
              "NASCAR_ERROR",
              "Error parsing NASCAR live data."
            );
          }
        });
      })
      .on("error", (err) => {
        console.error("MMM-NASCARLive: Unable to retrieve data", err);
        this.sendSocketNotification(
          "NASCAR_ERROR",
          "Unable to retrieve NASCAR live data."
        );
      });
  },
});
