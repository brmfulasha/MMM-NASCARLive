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
            this.error = null; // Reset any previous error message
            this.updateDom();
        } else if (notification === "NASCAR_ERROR") {
            this.error = payload;
            this.data = null; // Clear any stale data in case of error
            this.updateDom();
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");

        // Determine header text based on available data
        let headerText = "NASCAR Live Feed";
        if (this.data && this.data.series && this.data.race_name) {
            headerText = `${this.data.series[0].series_name} - ${this.data.race_name}`;
        }

        // Create and append header
        const header = document.createElement("h2");
        header.className = "nascar-header";
        header.innerText = headerText;
        wrapper.appendChild(header);

        // Error handling: if an error exists, display it and return early
        if (this.error) {
            const errorDiv = document.createElement("div");
            errorDiv.className = "nascar-error";
            errorDiv.innerText = `⚠️ Error: ${this.error}`;
            wrapper.appendChild(errorDiv);
            return wrapper;
        }

        // Create content area to display data or a loading message
        const content = document.createElement("div");
        content.innerHTML = this.data
            ? `<pre>${JSON.stringify(this.data, null, 2)}</pre>`
            : "Loading NASCAR live data...";
        wrapper.appendChild(content);

        return wrapper;
    },

    getStyles: function () {
        return ["MMM-NASCARLive.css"];
    }
});
