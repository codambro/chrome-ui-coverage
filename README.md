# chrome-ui-coverage
Track UI coverage in a chrome browser

## Setup
This is still in development, so extension needs to be ran in developer mode.

- Clone repo locally
- In chrome browser, click three buttons in top right, then Extensions > Manage Extensions.
- In top left, enable "Developer mode"
- In top right, click "Load unpacked"
- Select the location to this repo (chrome-ui-coverage)

## Retrieving tracking data
After enabling extension, tracking data will be updated automatically. To retrieve data, open the chrome console by right-clicking the page, selecting "Inspect", then choose "Console" in the top tab.
Run the command `JSON.parse(localStorage.getItem("ui-coverage") || "{}")` to get the current coverage report.

Will be formatted as follows:
```
{
  "webpage1": {       // Webpage in domain, i.e. "https://weather.com"
    "element1": {     // DOM element that can be interacted with, i.e "<button>PressMe</button>"
      "event1": bool  // i.e "click" or "hover". will be 'false' if not interacted with, or 'true' if it has been.
    },
  }
}
```
