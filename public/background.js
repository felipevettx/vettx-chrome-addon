console.log("Background script loaded");

const urlPage = {
  facebook:
    "https://www.facebook.com/marketplace/105496622817769/cars?minPrice=5000&maxPrice=26000&maxMileage=130000&maxYear=2021&minYear=2014&sortBy=creation_time_descend&exact=true&topLevelVehicleType=car_truck",
  vettx: "https://app.vettx.com/dashboard",
};

let scrapedData = [];
let isScrapingActive = false;
let interval;
let isProcessRunning = false;

const MAX_TIME = 280000; // 4 minutes and 40 seconds
chrome.storage.local.set({ MAX_TIME: MAX_TIME });

function updateIcon(status) {
  switch (status) {
    case "running":
      chrome.action.setIcon({ path: "icons/syncing.png" });
      break;
    case "error":
      chrome.action.setIcon({ path: "icons/error.png" });
      break;
    default:
      chrome.action.setIcon({ path: "icons/notEnable.png" });
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.isToggleActive) {
    const isToggleActive = changes.isToggleActive.newValue;
    if (isToggleActive) {
      console.log("Toggle activated. Starting full process...");
      chrome.storage.local.set({
        activeTimer: true,
        remaining: MAX_TIME / 1000,
      });
      startFullProcess();
    } else {
      console.log("Toggle deactivated. Stopping scraping process...");
      stopScraping();
    }
  }
});

function resetIconToDefault() {
  setTimeout(() => {
    updateIcon("default");
  }, 10000);
}

function startScrapingTimer() {
  interval = setInterval(() => {
    chrome.storage.local.get("remaining", (result) => {
      let remainingTime = result.remaining || 0;

      if (remainingTime > 0) {
        remainingTime--;
        chrome.storage.local.set({ remaining: remainingTime });
      } else {
        clearInterval(interval);
        console.log("Timer finished.");
        stopScraping();
      }
    });
  }, 1000);
}

function waitForPageToLoad(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function onTabUpdated(
      updatedTabId,
      changeInfo
    ) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onTabUpdated);
        resolve();
      }
    });
  });
}

function openTabsInOrder(urls) {
  return new Promise((resolve) => {
    let index = 0;
    let loadCount = 0;

    function openNextTab() {
      if (index >= urls.length) {
        resolve();
        return;
      }

      const url = urls[index];
      chrome.tabs.query({}, (tabs) => {
        const existingTabs = tabs.filter(
          (tab) => tab.url && tab.url.startsWith(url)
        );
        if (existingTabs.length > 0) {
          console.log(`Tab for ${url} already exists. Activating it.`);
          chrome.tabs.update(existingTabs[0].id, { active: true }, () => {
            loadCount++;
            if (loadCount === urls.length) {
              resolve();
            } else {
              index++;
              openNextTab();
            }
          });
        } else {
          chrome.tabs.create({ url }, async (newTab) => {
            await waitForPageToLoad(newTab.id);
            loadCount++;
            if (loadCount === urls.length) {
              resolve();
            } else {
              index++;
              openNextTab();
            }
          });
        }
      });
    }

    openNextTab();
  });
}

function checkIfLoggedIn() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      const vettxTab = tabs.find(
        (tab) => tab.url && tab.url.includes("vettx.com")
      );
      const facebookTab = tabs.find(
        (tab) => tab.url && tab.url.includes("facebook.com")
      );

      if (vettxTab && facebookTab) {
        chrome.scripting.executeScript(
          {
            target: { tabId: vettxTab.id },
            func: () => localStorage.getItem("ba") !== null,
          },
          (vettxResults) => {
            chrome.scripting.executeScript(
              {
                target: { tabId: facebookTab.id },
                func: () => document.cookie.includes("c_user"),
              },
              (fbResults) => {
                const isLoggedIn =
                  vettxResults[0]?.result && fbResults[0]?.result;
                resolve(isLoggedIn);
              }
            );
          }
        );
      } else {
        console.log("VETTX or Facebook tab not found.");
        resolve(false);
      }
    });
  });
}

function startScraping() {
  updateIcon("running");
  chrome.storage.local.set({
    activeTimer: true,
    remaining: MAX_TIME / 1000,
    isScrapingActive: true,
  });
  startScrapingTimer();
  console.log("Scraping started");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "scrape" });
    }
  });
}

function stopScraping() {
  updateIcon("error");
  clearInterval(interval);
  chrome.storage.local.set({ activeTimer: false, isScrapingActive: false });
  console.log("Scraping stopped");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopScrape" });
    }
  });
  resetIconToDefault();
  isProcessRunning = false;
}

async function startFullProcess() {
  if (isProcessRunning) {
    console.log("Process is already running. Ignoring new request.");
    chrome.storage.local.set({ messageState: "processInProgress" });
    return { success: false, error: "processAlreadyRunning" };
  }

  isProcessRunning = true;
  try {
    await openTabsInOrder([urlPage.vettx, urlPage.facebook]);
    console.log("Tabs opened. Checking login status...");
    const loggedIn = await checkIfLoggedIn();
    if (loggedIn) {
      console.log("User is logged in. Starting scraping process...");
      startScraping();
      chrome.storage.local.set({ messageState: "processInProgress" });
      return { success: true };
    } else {
      console.log("User is not logged in.");
      isProcessRunning = false;
      chrome.storage.local.set({ messageState: "loginRequired" });
      return { success: false, error: "loginRequired" };
    }
  } catch (error) {
    console.error("Error in startFullProcess:", error);
    isProcessRunning = false;
    chrome.storage.local.set({ messageState: "error" });
    return { success: false, error: error.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "startScraping":
      startScraping();
      sendResponse({ status: "Scraping started." });
      break;

    case "stopScraping":
      stopScraping();
      sendResponse({ status: "Scraping stopped." });
      break;

    case "openMultipleTabs":
      startFullProcess().then(() => {
        sendResponse({ status: "Process completed" });
      });
      return true;

    case "scrapeComplete":
      scrapedData = message.payload;
      chrome.storage.local.set({ scrapedCount: scrapedData.length });
      console.log("Scraping completed. Total products:", scrapedData.length);
      console.log("Scraped Data:", JSON.stringify(scrapedData, null, 2));
      stopScraping();
      break;

    case "updateStatus":
      chrome.storage.local.set({
        processState: message.status,
        message: message.message,
      });
      break;

    case "checkToggle":
      chrome.storage.local.get("isToggleActive", (result) => {
        if (result.isToggleActive) {
          console.log("Toggle is active. Starting full process...");
          startFullProcess();
        }
      });
      break;

    case "toggleStateChanged":
      if (!message.isToggleActive && isScrapingActive) {
        console.log("Toggle deactivated. Stopping current process...");
        stopScraping();
      } else if (message.isToggleActive) {
        console.log(
          "Toggle activated. Process will start on popup load if needed."
        );
      }
      chrome.storage.local.set({ isToggleActive: message.isToggleActive });
      break;

    case "startFullProcess":
      console.log("Received startFullProcess action");
      if (isProcessRunning) {
        console.log("Process is already running. Ignoring new request.");
        chrome.storage.local.set({ messageState: "processInProgress" });
        sendResponse({ success: false, error: "processAlreadyRunning" });
      } else {
        startFullProcess()
          .then((result) => {
            sendResponse(result);
          })
          .catch((error) => {
            console.error("Error in startFullProcess:", error);
            isProcessRunning = false;
            chrome.storage.local.set({ messageState: "error" });
            sendResponse({ success: false, error: error.message });
          });
      }
      return true;

    default:
      console.log("Unknown action", message.action);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    processState: "start",
    message: "noExecution",
    isScrapingActive: false,
    isToggleActive: false,
  });
});
