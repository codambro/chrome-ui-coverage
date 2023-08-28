/**
 * This script will be directly injected into the client for every page.
 * It will do the following:
 *
 * - Find all elements on the page that have event listeners. Will also
 *   include elements that are interactive without listeners (a[href], button, input)
 * - Add an event listener to each of these elements of the same type. This
 *   event listener will update an internal tracker (localStorage) to mark
 *   that the element was interacted with.
 *
 * With this script injected, we can run tests and later query the localStorage
 * tracker to see what was interacted with and what was not.
 *
 * localStorage tracker will be JSON data of the following format:
 * {
 *   "pageURL_1" : {
 *     "elementSelector_1": {
 *       "eventType_1": false,      // i.e. "click"
 *       "eventType_2": true,       // i.e. "mouseover"
 *       ...,
 *     },
 *     ...
 *   },
 *   "pageURL_2" {
 *     ...
 *   },
 *   ...
 * }
 *
 * A value of "false" next to an event means the event was NOT triggered during testing.
 * A value of "true" next to an event means the event was triggered during testing.
 */

// add outlines to elements
let enableColors = localStorage.getItem("coverage-colors") == "true";

// Non-user triggered events
const ignoreEvents = ["popstate", "unhandledrejection", "error"];

// Assume these elements always have click events
const forceClickEvents = ["a", "button", "input"];

const localStorageName = "ui-coverage";

/* Get listeners on an individual element */
function myGetEventListeners(element) {
  const types = [];

  for (let ev in window) {
    if (/^on/.test(ev)) types[types.length] = ev;
  }

  let listeners = [];
  // Events defined in attributes
  for (let j = 0; j < types.length; j++) {
    if (typeof element[types[j]] === "function") {
      listeners.push(types[j]);
    }
  }

  // Events defined with addEventListener
  if (typeof element._getEventListeners === "function") {
    let evts = element._getEventListeners();
    if (Object.keys(evts).length > 0) {
      for (let evt of Object.keys(evts)) {
        for (k = 0; k < evts[evt].length; k++) {
          listeners.push(evt);
        }
      }
    }
  }

  // certain element types we always expect to be clickable
  if (!listeners.length) {
    for (const attr of forceClickEvents) {
      if (element.outerHTML.startsWith(`<${attr} `)) {
        listeners.push("click");
        break;
      }
    }
  }

  // If style turns cursor into pointer, assume clickable
  if (
    !listeners.includes("click") &&
    !listeners.includes("onclick") &&
    !(element.firstElementChild && element.firstElementChild.nodeName == "INPUT") && // skip labels around inputs
    window.getComputedStyle(element).cursor == "pointer" &&
    window.getComputedStyle(element.parentNode).cursor != "pointer"
  ) {
    listeners.push("click");
  }

  return [...new Set(listeners)].map(x => x.replace(/^(on)/, "")).filter(l => !ignoreEvents.includes(l));
}

/* get list of all triggerable elements and add listeners */
let needMouseMove = false;
function setup(setupEvent) {
  if (setupEvent.type == "mousemove" && !needMouseMove) {
    return;
  } else if (setupEvent.type != "mousemove") {
    needMouseMove = true;
  } else if (setupEvent.type == "mousemove") {
    needMouseMove = false;
  }
  console.log(`Coverage.Setup() - ${setupEvent.type} - ${setupEvent.target.outerHTML}`);
  const coverageStr = localStorage.getItem(localStorageName);
  const coverage = coverageStr ? JSON.parse(coverageStr) : {};
  let page = document.location.href
    .split("?")[0]
    .replace(/\/[0-9]+/g, "/[num]")
    .replace(/\/\//g, "/")
    .replace(/https:/g, "https:/");
  if (page.endsWith("/") || page.endsWith("#")) {
    page = page.slice(0, -1);
  }
  if (!(page in coverage)) {
    coverage[page] = {};
  }
  for (const selector of document.querySelectorAll("*")) {
    const eventListeners = myGetEventListeners(selector);
    if (eventListeners.length > 0) {
      let oHTML = selector.outerHTML.replace(/\s?coveragetracker_[a-z]+="true"/g, "");
      if (enableColors) {
        oHTML = oHTML.replace(/;?\s?outline: red solid 3px;?/g, "");
        oHTML = oHTML.replace(/;?\s?outline: green solid 3px;?/g, "");
        oHTML = oHTML.replace(/\s?style="\s?"/g, "");
      }
      //console.log(`${oHTML}: ${eventListeners}`);
      if (!(oHTML in coverage[page])) {
        coverage[page][oHTML] = {};
      }
      for (const eventType of eventListeners) {
        // element `selector` has one or more listeners for `eventType`
        //console.log(eventType);
        if (!(eventType in coverage[page][oHTML])) {
          coverage[page][oHTML][eventType] = false;
        }
        if (!selector.hasAttribute(`coveragetracker_${eventType}`)) {
          console.log(`Adding event listener on ${page} (${eventType}): ${oHTML}`);
          if (enableColors) {
            if (!coverage[page][oHTML][eventType]) {
              selector.style.outline = "red solid 3px";
            } else {
              selector.style.outline = "green solid 3px";
            }
          }
          // add our own listener as well
          selector.addEventListener(eventType, () => {
            let targetOuterHTML = selector.outerHTML.replaceAll(` coveragetracker_${eventType}="true"`, "");
            if (enableColors) {
              targetOuterHTML = targetOuterHTML.replace(/;?\s?outline: red solid 3px;?/g, "");
              targetOuterHTML = targetOuterHTML.replace(/;?\s?outline: green solid 3px;?/g, "");
              targetOuterHTML = targetOuterHTML.replace(/\s?style="\s?"/g, "");
              selector.style.outline = "green solid 3px";
            }
            console.log(`Event detected on ${page} (${eventType}): ${targetOuterHTML}`);
            let c = JSON.parse(localStorage.getItem(localStorageName));
            if (!(targetOuterHTML in c[page])) {
              // handle case where outerHTML changed on selector
              c[page][targetOuterHTML] = { [eventType]: true };
            } else {
              c[page][targetOuterHTML][eventType] = true;
            }
            localStorage.setItem(localStorageName, JSON.stringify(c));
            //console.log(`Event logged on ${page} (${eventType}): ${targetOuterHTML}`);
          });
          selector.setAttribute(`coveragetracker_${eventType}`, 'true');
        }
      }
    } else {
      //coverage[page][selector.outerHTML] = null;
    }
  }
  localStorage.setItem(localStorageName, JSON.stringify(coverage));
}

// When to get elements and add listeners.
// Definitely when page loads. Then on user interaction (click),
// a page may show new elements, so recalculate then as well.
window.addEventListener("load", setup);
window.addEventListener("click", setup);
window.addEventListener("mousemove", setup);

// Support downloading raw coverage report data
function getUICoverage() {
    return JSON.parse(localStorage.getItem(localStorageName) || "{}")
}

async function writeCoverageFile() {
   const downloadBtn = document.createElement("a");
   downloadBtn.style = "display: none";
   document.body.appendChild(downloadBtn);
   const blobData = new Blob([JSON.stringify(getUICoverage(), undefined, 2)], { type: "application/json"});
   downloadBtn.href = window.URL.createObjectURL(blobData);
   downloadBtn.download = "coverage.json";
   downloadBtn.click();
   window.URL.revokeObjectURL(downloadBtn.href);
   downloadBtn.remove();
}

// Communication with dropdown menu on extension
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.task == "download") {
      writeCoverageFile();
    } else if (request.task = "toggleColors") {
      const currentlyEnabled = localStorage.getItem("coverage-colors") == "true";
      localStorage.setItem("coverage-colors", currentlyEnabled ? "false" : "true");
      enableColors = !currentlyEnabled;
      window.location.reload();
    }
  }
)