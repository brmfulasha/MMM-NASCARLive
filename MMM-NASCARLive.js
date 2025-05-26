const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
    start: function () {
        console.log("Starting node_helper for MMM-NASCARLive...");
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "GET_NASCAR_DATA") {
            this.fetchData(payload);
        }
    },

    fetchData: function (jsonUrl) {
        const self = this;
        axios
            .get(jsonUrl)
            .then(response => {
                if (!response.data || Object.keys(response.data).length === 0) {
                    throw new Error("Invalid NASCAR data received.");
                }
                self.sendSocketNotification("NASCAR_DATA", response.data);
            })
            .catch(error => {
                console.error("Error fetching NASCAR data:", error);
                self.sendSocketNotification("NASCAR_ERROR", error.message);
            });
    }
});
