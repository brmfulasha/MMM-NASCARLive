function getFlagStateText(flag_state) {
  switch (String(flag_state)) {
    case "1": return "Green Flag";
    case "2": return "Caution Flag";
    case "3": return "Red Flag";
    case "4": return "Checkered Flag";
    case "5": return "White Flag";
    default: return `Flag: ${flag_state}`;
  }
}

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
    this.flag_state = null;      // Track flag_state from JSON
    this.getData();
  },

  scheduleNextFetch: function () {
    let interval;

    // If flag_state is 4 (race finished), schedule next update at midnight
    if (this.flag_state === 4 || this.flag_state === "4") {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0); // Set to midnight of next day
      if (now.getTime() >= nextMidnight.getTime()) {
        nextMidnight.setDate(nextMidnight.getDate() + 1);
      }
      interval = nextMidnight.getTime() - now.getTime();
      console.log(`Flag state is 4 (race finished): Next update scheduled at midnight in ${interval} ms (at ${nextMidnight.toLocaleTimeString()}).`);
    } else if (this.raceActive) {
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
      this.flag_state = typeof payload.flag_state !== "undefined" ? payload.flag_state : null;
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
      this.flag_state = null;
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

     // Hide if flag_state is 9 (number or string)
    if (this.flag_state === 9 || this.flag_state === "9") {
      this.hide(1000);
      return wrapper;
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
      // Show flag_state as descriptive text
      if (this.flag_state) {
        wrapper.innerHTML += `
          <div class="nascar-flagstate" style="font-size:1em;margin-bottom:4px;">
            ${getFlagStateText(this.flag_state)}
          </div>
        `;
      }
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
      // Determine manufacturer logo
      let manufacturerLogo = "";
      if (driver.vehicle_manufacturer) {
        const man = driver.vehicle_manufacturer.toLowerCase();
        if (man === "tyt") {
          manufacturerLogo = `<img src="https://www.nascar.com/wp-content/uploads/sites/7/2020/04/06/Toyota-35x35.png" alt="Toyota" style="height:18px;vertical-align:middle;margin-left:4px;">`;
        } else if (man === "frd") {
          manufacturerLogo = `<img src="https://www.nascar.com/wp-content/uploads/sites/7/2024/04/10/Ford-Logo-1-62x35.png" alt="Ford" style="height:18px;vertical-align:middle;margin-left:4px;">`;
        } else if (man === "chv") {
          manufacturerLogo = `<img src="https://www.nascar.com/wp-content/uploads/sites/7/2017/01/Chevy-Driver-Page-New-2-160x811-52x35.png" alt="Chevrolet" style="height:18px;vertical-align:middle;margin-left:4px;">`;
        } else {
          manufacturerLogo = ` <span class="nascar-manufacturer" style="font-size:0.95em;color:#8fc;">(${driver.vehicle_manufacturer})</span>`;
        }
      }
      // Show driver full_name, manufacturer logo, and delta (if present), but not for the first driver
      let driverText = `
        <img src="${imageUrl}" alt="Car ${driver.vehicle_number}" style="height:32px;vertical-align:middle;margin-right:8px;">
        ${driver.full_name}${manufacturerLogo}
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
