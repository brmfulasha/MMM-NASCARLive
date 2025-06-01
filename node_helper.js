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
            let flag_state = typeof json["flag_state"] !== "undefined" ? json["flag_state"] : null;
            let run_name = json["run_name"] || "";
            let track_name = json["track_name"] || "";
            let series_id = json["series_id"] || "1";
            let lap_number = typeof json["lap_number"] !== "undefined" ? json["lap_number"] : null;
            let laps_in_race = typeof json["laps_in_race"] !== "undefined" ? json["laps_in_race"] : null;

            let drivers = Array.isArray(json["vehicles"])
              ? json["vehicles"].map((car) => ({
                  running_position: car.running_position,
                  full_name: car.driver.full_name,
                  vehicle_number: car.vehicle_number,
                  vehicle_manufacturer: car.vehicle_manufacturer || "", // ensure this field is present
                  delta:
                    typeof car.delta !== "undefined" && car.delta !== null
                      ? car.delta.toString()
                      : ""
                }))
              : [];

            this.sendSocketNotification("NASCAR_DATA", {
              flag_state,
              run_name,
              track_name,
              series_id,
              lap_number,
              laps_in_race,
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
