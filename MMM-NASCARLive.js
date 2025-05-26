getDom: function () {
    const wrapper = document.createElement("div");

    // Set default header text
    let headerText = "NASCAR Live Feed";

    if (this.data && this.data.series) {
        headerText = `${this.data.series[0].series_name} - ${this.data.race_name}`;
    }

    // Create header element
    const header = document.createElement("h2");
    header.className = "nascar-header";
    header.innerText = headerText;
    wrapper.appendChild(header);

    // Display race data
    const content = document.createElement("div");
    content.innerHTML = this.data ? `<pre>${JSON.stringify(this.data, null, 2)}</pre>` : "Loading NASCAR live data...";
    wrapper.appendChild(content);

    return wrapper;
},
