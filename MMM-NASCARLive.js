Module.register("MMM-NASCARLive", {
  defaults: {
    updateIntervalRaceDay: 60000,
    dataUrl: "https://cf.nascar.com/live/feeds/live-feed.json"
  },

  start: function () {
    this.full_name = [];
    this.raceActive = false;
    this.raceName = "NASCAR Live Running Order";
    this.currentTimeout = null;
    this.loaded = false;
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
      this.raceActive = (payload.flag_state && payload.flag_state !== "FINISHED");
      this.raceName = (payload.race && payload.race.race_name) ? payload.race.race_name : "No Active NASCAR Race";
      this.updateDom();
      this.scheduleNextFetch();
    } else if (notification === "NASCAR_ERROR") {
      this.loaded = true;
      this.full_name = [];
      this.raceActive = false;
      this.raceName = "No Active NASCAR Race";
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

    wrapper.innerHTML = `<div class="nascar-title"> ${this.raceName} </div>`;

    if (!this.loaded) {
      wrapper.innerHTML += "<p>Loading...</p>";
      return wrapper;
    }

    if (this.full_name.length === 0) {
      wrapper.innerHTML += "<p>No Racing Currently.</p>";
      return wrapper;
    }

    let list = document.createElement("ul");
    this.full_name.forEach(driver => {
      let listItem = document.createElement("li");
      listItem.innerHTML = `#${driver.running_position}: <strong>${driver.full_name}</strong> (Car ${driver.vehicle_number})`;
      list.appendChild(listItem);
    });
    wrapper.appendChild(list);
    return wrapper;
  }
});
