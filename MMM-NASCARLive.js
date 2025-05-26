Module.register("MMM-NASCARLive", {
  defaults: {
    updateIntervalRaceDay: 60000 // 60 seconds when a race is active
  },

  start: function () {
    this.full_name = []; // Updated from drivers to full_name
    this.raceActive = false;
    this.raceName = "NASCAR Live Standings";
    this.currentTimeout = null;
    this.getData();
  },

  /**
   * Schedule the next data fetch.
   * If the race is active, update every 60 seconds.
   * In non–race periods, poll once at the next 6 AM.
   */
  scheduleNextFetch: function () {
    let interval;

    if (this.raceActive) {
      interval = this.config.updateIntervalRaceDay;
    } else {
      // Calculate the milliseconds until the next 6 AM local time.
      const now = new Date();
      const next6am = new Date();
      next6am.setHours(6, 0, 0, 0); // Set time to 6:00 AM today.

      // If it's already after 6 AM, schedule for tomorrow.
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

  /**
   * Send a socket notification to request data.
   */
  getData: function () {
    this.sendSocketNotification("FETCH_NASCAR_DATA");
  },

  /**
   * Receive updated data from node_helper and update the DOM.
   */
  socketNotificationReceived: function (notification, payload) {
    if (notification === "NASCAR_DATA") {
      this.full_name = payload.full_name; // Updated to full_name
      this.raceActive = payload.raceActive;
      this.raceName = payload.raceName || "No Active NASCAR Race";
      this.updateDom();
      this.scheduleNextFetch();
    } else {
      console.error("Unexpected socket notification received:", notification);
    }
  },

  /**
   * Build and return the module DOM.
   * If there's no active race, hide the module.
   */
  getDom: function () {
    let wrapper = document.createElement("div");

    if (!this.raceActive) {
      this.hide(1000);
      return wrapper;
    } else {
      this.show(1000);
    }

    wrapper.innerHTML = `<h2>🏁 ${this.raceName} 🏁</h2>`;

    if (this.full_name.length === 0) { // Updated from drivers to full_name
      wrapper.innerHTML += "<p>Loading...</p>";
      return wrapper;
    }

    let list = document.createElement("ul");
    this.full_name.forEach(driver => { // Updated loop variable
      let listItem = document.createElement("li");
      listItem.innerHTML = `#${driver.running_position}: <strong>${driver.full_name}</strong> (Car ${driver.vehicle_number})`;
      list.appendChild(listItem);
    });

    wrapper.appendChild(list);
    return wrapper;
  }
});
