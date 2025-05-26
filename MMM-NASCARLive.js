Module.register("MMM-NASCARLive", {
    defaults: {
        jsonUrl: "https://cf.nascar.com/live/feeds/live-feed.json"
    },

    start: function () {
        this.sendSocketNotification("GET_NASCAR_DATA", this.config.jsonUrl);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "NASCAR_DATA") {
            this.data = payload;
            this.error = null; // Clear any previous error
            this.updateDom();
        } else if (notification === "NASCAR_ERROR") {
            this.error = payload;
            this.data = null; // Clear any stale data in case of error
            this.updateDom();
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");

        // Create the header using available race data:
        let headerText = "NASCAR Live Feed";
        if (this.data && this.data.series && this.data.race_name) {
            headerText = `${this.data.series[0].series_name} - ${this.data.race_name}`;
        }
        const header = document.createElement("h2");
        header.className = "nascar-header";
        header.innerText = headerText;
        wrapper.appendChild(header);

        // If an error occurred, display the error message and exit early:
        if (this.error) {
        }
    }
}
