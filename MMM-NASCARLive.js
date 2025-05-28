Module.register("MMM-NASCARLive", {
  defaults: {
    updateIntervalRaceDay: 60000, // 60 seconds when a race is active
    showHeaderLogo: true,         // <--- Make logo header configurable
    headerLogoPath: "logo.png"    // <--- Allow custom logo path if desired
  },

  start: function () {
    this.full_name = [];
    this.raceActive = false;
    this.raceName = "NASCAR Live Standings";
    this.currentTimeout = null;
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
    this.sendSocketNotification("FETCH_NASCAR_DATA");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "NASCAR_DATA") {
      this.full_name = payload.full_name;
      this.raceActive = payload.raceActive;
      this.raceName = payload.raceName || "No Active NASCAR Race";
      this.updateDom();
      this.scheduleNextFetch();
    } else {
      console.error("Unexpected socket notification received:", notification);
    }
  },

  getDom: function () {
    let wrapper = document.createElement("div");

    // Header logo (configurable)
    if (this.config.showHeaderLogo) {
      const header = document.createElement("div");
      header.className = "nascar-header";
      const logo = document.createElement("div");
      logo.className = "nascar-header-logo";
      // Dynamically set background image from config
      logo.style.backgroundImage = `url('${this.file(this.config.headerLogoPath)}')`;
      header.appendChild(logo);
      wrapper.appendChild(header);
    }

    if (!this.raceActive) {
      this.hide(1000);
      return wrapper;
    } else {
      this.show(1000);
    }

    wrapper.innerHTML += `<div class="nascar-title">🏁 ${this.raceName} 🏁</div>`;

    if (this.full_name.length === 0) {
      wrapper.innerHTML += "<p>Loading...</p>";
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
