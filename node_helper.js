const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

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
        fetch(jsonUrl)
            .then(response => response.json())
            .then(data => {
                self.sendSocketNotification("NASCAR_DATA", data);
            })
            .catch(error => console.error("Error fetching NASCAR data:", error));
    }
});
