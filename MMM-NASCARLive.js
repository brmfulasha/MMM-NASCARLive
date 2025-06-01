Module.register("MMM-NASCARLive", {
  defaults: {
    updateIntervalRaceDay: 60000,
    dataUrl: "https://cf.nascar.com/live/feeds/live-feed.json",
    numberOfDrivers: 10 // Default number of drivers to show, configurable
  },

  start: function () {
    this.full_name = [];
    this.raceActive = false;
    this.raceName = "NASCAR Live Running Order";
    this.trackName = "";
    this.currentTimeout = null;
    this.loaded = false;
    this.series_id = "1"; // Default value
    this.lap_number = null;      // Track lap_number from JSON
    this.laps_in_race = null;    // Track laps_in_race from JSON
    this.getData();
  },

  scheduleNextFetch: function () {
    let interval;
    if (this.raceActive) {
      interval = this.config.updateIntervalRaceDay;
    } else {
      const now = new Date();
      const next6am = new Date();
      next6am.setHours(6, 0, 0, 0);
      if (now.getTime() >= next6am.getTime()) {
        next6am.setDate(next6am.getDate() + 1);
      }
      interval = next6am.getTime() - now.getTime();
      console.log(
        `Non–race day: Next poll scheduled in ${interval} ms (at ${next6am.toLocaleTimeString()}).`
      );
    }
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
    this.currentTimeout = setTimeout(() => {
      this.getData();
    }, interval);
  },

  getData: function () {
    this.sendSocketNotification("GET_NASCAR_DATA", this.config.dataUrl);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "NASCAR_DATA") {
      this.loaded = true;
      this.full_name = payload.drivers || [];
      this.raceActive = !!(payload.flag_state && payload.flag_state !== "FINISHED");
      this.raceName = payload.run_name ? payload.run_name : "No Active NASCAR Race";
      this.trackName = payload.track_name ? payload.track_name : "";
      this.series_id = payload.series_id || "1";
      this.lap_number = (typeof payload.lap_number !== "undefined") ? payload.lap_number : null;
      this.laps_in_race = (typeof payload.laps_in_race !== "undefined") ? payload.laps_in_race : null;
      this.updateDom();
      this.scheduleNextFetch();
    } else if (notification === "NASCAR_ERROR") {
      this.loaded = true;
      this.full_name = [];
      this.raceActive = false;
      this.raceName = "No Active NASCAR Race";
      this.trackName = "";
      this.series_id = "1";
      this.lap_number = null;
      this.laps_in_race = null;
      this.errorMsg = payload;
      this.updateDom();
      this.scheduleNextFetch();
    } else {
      console.error("Unexpected socket notification received:", notification);
    }
  },

  getDom: function () {
    let wrapper = document.createElement("div");

    if (!this.raceActive) {
      this.hide(1000);
      return wrapper; // empty
    } else {
      this.show(1000);
    }

    // Race name header
    wrapper.innerHTML = `
      <div class="nascar-title">${this.raceName}</div>
    `;
    // Track name underneath race name
    if (this.trackName) {
      wrapper.innerHTML += `
        <div class="nascar-track" style="font-size:1em;margin-bottom:4px;">
          ${this.trackName}
        </div>
      `;
    }

    // Lap number section (inserted between header and drivers)
    if (this.lap_number !== null && this.laps_in_race !== null) {
      wrapper.innerHTML += `
        <div class="nascar-lap" style="font-size:1.1em;margin-bottom:4px;">
          ${this.lap_number} / ${this.laps_in_race}
        </div>
      `;
    }

    if (!this.loaded) {
      wrapper.innerHTML += "<p>Loading...</p>";
      return wrapper;
    }

    if (this.full_name.length === 0) {
      wrapper.innerHTML += "<p>No Racing Currently.</p>";
      return wrapper;
    }

    let list = document.createElement("ol");
    const driversToShow = this.full_name.slice(0, this.config.numberOfDrivers);
    driversToShow.forEach((driver, idx) => {
      let listItem = document.createElement("li");
      const seriesId = this.series_id || "1";
      const imageUrl = `https://cf.nascar.com/data/images/carbadges/${seriesId}/${driver.vehicle_number}.png`;
      // Show driver full_name and delta (if present), but not for the first driver
      let driverText = `
        <img src="${imageUrl}" alt="Car ${driver.vehicle_number}" style="height:32px;vertical-align:middle;margin-right:8px;">
        ${driver.full_name}
      `;
      if (
        idx !== 0 &&
        typeof driver.delta !== "undefined" &&
        driver.delta !== null &&
        driver.delta !== ""
      ) {
        // Always put a "-" sign before the delta, regardless of the value
        let deltaStr = driver.delta.startsWith("-") ? driver.delta : `-${driver.delta}`;
        driverText += ` <span class="nascar-delta" style="font-size:0.95em;color:#ccc;">${deltaStr}</span>`;
      }
      listItem.innerHTML = driverText;
      list.appendChild(listItem);
    });
    wrapper.appendChild(list);
    return wrapper;
  }
});
