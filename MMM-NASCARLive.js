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
    this.currentTimeout = null;
    this.loaded = false;
    this.series_id = "1"; // Default value
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
      // Use run_name at top-level, not inside race
      this.raceName = payload.run_name ? payload.run_name : "No Active NASCAR Race";
      // Store series_id for image URL construction (fallback to "1" for legacy support)
      this.series_id = payload.series_id || "1";
      this.updateDom();
      this.scheduleNextFetch();
    } else if (notification === "NASCAR_ERROR") {
      this.loaded = true;
      this.full_name = [];
      this.raceActive = false;
      this.raceName = "No Active NASCAR Race";
      this.series_id = "1";
      this.errorMsg = payload;
      this.updateDom();
      this.scheduleNextFetch();
    } else {
      console.error("Unexpected socket notification received:", notification);
    }
  },

  getDom: function () {
    let wrapper = document.createElement("div");

    // Hide if not race day
    if (!this.raceActive) {
      this.hide(1000);
      return wrapper; // empty
    } else {
      this.show(1000);
    }

    // Show series_id above run_name header
    wrapper.innerHTML = `
      <div class="nascar-series-id" style="font-size:1.1em;font-weight:bold;margin-bottom:2px;">
        Series ID: ${this.series_id}
      </div>
      <div class="nascar-title">${this.raceName}</div>
    `;

    if (!this.loaded) {
      wrapper.innerHTML += "<p>Loading...</p>";
      return wrapper;
    }

    if (this.full_name.length === 0) {
      wrapper.innerHTML += "<p>No Racing Currently.</p>";
      return wrapper;
    }

    // Numbered list (ordered list) of drivers
    let list = document.createElement("ol");
    // Limit the number of displayed drivers based on config
    const driversToShow = this.full_name.slice(0, this.config.numberOfDrivers);
    driversToShow.forEach(driver => {
      let listItem = document.createElement("li");
      const seriesId = this.series_id || "1";
      const imageUrl = `https://cf.nascar.com/data/images/carbadges/${seriesId}/${driver.vehicle_number}.png`;
      listItem.innerHTML = `
        <img src="${imageUrl}" alt="Car ${driver.vehicle_number}" style="height:32px;vertical-align:middle;margin-right:8px;">
        ${driver.full_name}
      `;
      list.appendChild(listItem);
    });
    wrapper.appendChild(list);
    return wrapper;
  }
});
