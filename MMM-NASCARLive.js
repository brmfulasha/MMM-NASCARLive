/*
* MMM-NASCARLive - MagicMirror² Frontend Module (NO require calls!)
* All data fetching is done in node_helper.js
* This file only requests and displays the data!
*/

Module.register("MMM-NASCARLive", {
  defaults: {
    header: "NASCAR Standings",
    driverCount: 10 // New config option, default 10
  },

  start: function () {
    this.drivers = [];
    this.raceActive = false;
    this.raceName = "";
    this.loaded = false;
    this.sendSocketNotification("FETCH_NASCAR_DATA", { driverCount: this.config.driverCount });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "NASCAR_DATA") {
      this.drivers = payload.drivers || [];
      this.raceActive = payload.raceActive;
      this.raceName = payload.raceName || this.config.header;
      this.loaded = true;
      this.updateDom();
    }
    if (notification === "NASCAR_ERROR") {
      this.raceName = "NASCAR Data Error";
      this.drivers = [];
      this.loaded = true;
      this.updateDom();
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "nascar-top10-container";

    // Header
    const header = document.createElement("div");
    header.className = "nascar-top10-header";
    header.innerText = this.raceName || this.config.header;
    wrapper.appendChild(header);

    // Loading/Error
    if (!this.loaded) {
      wrapper.innerHTML += "<p>Loading...</p>";
      return wrapper;
    }
    if (!this.raceActive) {
      wrapper.innerHTML += "<p>No active race.</p>";
      return wrapper;
    }

    // Driver List
    const list = document.createElement("ul");
    list.className = "nascar-top10-list";
    this.drivers.forEach(driver => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="nascar-pos">${driver.running_position}</span>
        <span class="nascar-driver-name">${driver.full_name}</span>
        <span class="nascar-car-num">#${driver.vehicle_number}</span>
        <span class="nascar-driver-delta">${driver.delta ? driver.delta : ""}</span>
      `;
      list.appendChild(li);
    });
    wrapper.appendChild(list);
    return wrapper;
  },

  getStyles: function () {
    return ["MMM-NASCARLive.css"];
  }
});
