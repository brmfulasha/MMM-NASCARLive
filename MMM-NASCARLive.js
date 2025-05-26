const Module = require("module");

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
            this.updateDom();
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        if (this.data) {
            wrapper.innerHTML = `<pre>${JSON.stringify(this.data, null, 2)}</pre>`;
        } else {
            wrapper.innerHTML = "Loading NASCAR live data...";
        }
        return wrapper;
    },

    getStyles: function () {
        return ["MMM-NASCARLive.css"];
    }
});
