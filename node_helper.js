const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
    start: function () {
        console.log("Starting node_helper for MMM-NASCARLive...");
    },

    socketNotificationReceived: function (notification, payload) {
        console.log(`Socket notification received: ${notification}`);
        if (notification === "GET_NASCAR_DATA") {
            console.log("Received GET_NASCAR_DATA with URL:", payload);
            this.fetchData(payload);
        } else {
            console.log(`Unhandled notification: ${notification}`);
        }
    },

    fetchData: function (jsonUrl) {
        const self = this;
        console.log("Initiating HTTP GET request to:", jsonUrl);
        axios
            .get(jsonUrl)
            .then(response => {
                console.log("HTTP GET request successful.");
                if (!response.data || Object.keys(response.data).length === 0) {
                    throw new Error("Invalid NASCAR data received.");
                }
                console.log("Data fetched successfully from NASCAR API.");
                self.sendSocketNotification("NASCAR_DATA", response.data);
            })
            .catch(error => {
                console.error("Error fetching NASCAR data:", error);
                self.sendSocketNotification("NASCAR_ERROR", error.message);
            });
    }
});
