# chrome-ui-coverage
Track UI coverage in a Chrome browser.

> **Warning**
> 
> May slow down UI while running.

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
![Screenshot 2023-06-01 at 1 03 13 PM](https://github.com/codambro/chrome-ui-coverage/assets/87312005/be9401d1-6a4f-469f-8f2f-c955efa463b0)

## Shortcomings
- Currently, repeat elements per page are itemized individually. For example, a table with 100 entries, each with a checkbox, will have 100 individual elements tracked in the coverage data, one for each checkbox. Leads to many "false" misses.
- Elements that appear on every page, such as a top navigation bar, will be repeatedly itemized on every page in the tracking data.
- Tracked data is cleared between web domains or if the browser is closed.
