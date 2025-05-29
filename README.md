# MMM-NASCARLive

A [MagicMirror²](https://magicmirror.builders/) module to display live NASCAR race standings.  
The module automatically hides itself when there is no active race.

## Features

- Shows current NASCAR race standings from the official NASCAR live feed.
- Automatically hides when there is no active race and reappears on race day.
- Updates automatically during an active race.

## Installation

1. Clone this repository into your MagicMirror `modules` directory:

   ```sh
   cd ~/MagicMirror/modules
   git clone https://github.com/brmfulasha/MMM-NASCARLive.git
   ```

2. No extra dependencies are required; the module uses Node.js built-in modules only.

## Configuration

Add the module to the `modules` array in your `config.js`:

```javascript
{
  module: "MMM-NASCARLive",
  position: "top_left", // Or any other region
  config: {
    updateIntervalRaceDay: 60000, // Update interval in ms during race
    dataUrl: "https://cf.nascar.com/live/feeds/live-feed.json"
  }
},
```

## How It Works

- On race days, the module fetches live data from the NASCAR feed and displays the standings.
- When there is no active race, the module hides itself automatically.

## Customization

- You can adjust `updateIntervalRaceDay` in the config to change how often the data updates during a race.
- You may style the module via custom CSS (`MMM-NASCARLive.css`).

## Troubleshooting

- If the module does not appear, ensure MagicMirror is running and your config is valid.
- Check your internet connection to ensure access to the NASCAR live feed.

## License

MIT

---

**Enjoy live NASCAR standings on your MagicMirror!**
