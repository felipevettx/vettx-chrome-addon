console.log("Background script loaded");

const urlPage = {
  facebook:
    "https://www.facebook.com/marketplace/105496622817769/cars?minPrice=5000&maxPrice=26000&maxMileage=130000&maxYear=2021&minYear=2014&sortBy=creation_time_descend&exact=true&topLevelVehicleType=car_truck",
  vettx: "https://app.vettx.com/dashboard",
};

let scrapedData = [];
let isScrapingActive = false;
let interval;

const MAX_TIME = 280000; // set en 4 minutes y 40 seconds
chrome.storage.local.set({ MAX_TIME: MAX_TIME });

//logic for the icons state

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setIcon({ path: "icons/notEnable.png" });
});

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
        const existingTab = tabs.find(
          (tab) => tab.url && tab.url.startsWith(url)
        );
        if (existingTab) {
          if (url.includes("facebook.com")) {
            chrome.tabs.update(existingTab.id, { active: true }, async () => {
              loadCount++;
              if (loadCount === 2) {
                resolve();
              }
              index++;
              openNextTab();
            });
          } else {
            loadCount++;
            index++;
            openNextTab();
          }
        } else {
          chrome.tabs.create({ url }, async (newTab) => {
            await waitForPageToLoad(newTab.id);
            loadCount++;
            if (loadCount === 2) {
              resolve();
            }
            index++;
            openNextTab();
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
      openTabsInOrder([urlPage.vettx, urlPage.facebook]).then(async () => {
        console.log("Tabs opened. Checking login status...");
        const loggedIn = await checkIfLoggedIn();
        if (loggedIn) {
          console.log("User is logged in. Starting scraping process...");
          startScraping();
          sendResponse({ loggedIn: true });
        } else {
          console.log("User is not logged in.");
          sendResponse({ loggedIn: false });
        }
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

    default:
      console.log("Unknown action", message.action);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    processState: "start",
    message: "noExecution",
    isScrapingActive: false,
  });
});
