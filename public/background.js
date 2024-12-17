console.log("Background script loaded");

const urlPage = {
  facebook:
    "https://www.facebook.com/marketplace/105496622817769/cars?minPrice=5000&maxPrice=26000&maxMileage=130000&maxYear=2021&minYear=2014&sortBy=creation_time_descend&exact=true&topLevelVehicleType=car_truck",
  vettx: "https://app.vettx.com/dashboard",
};

// Open the facebook and vettx tabs
function openTabs(urls) {
  return new Promise((resolve) => {
    const openNextTab = (index) => {
      if (index >= urls.length) {
        resolve();
        return;
      }
      const url = urls[index];
      chrome.tabs.query({}, (tabs) => {
        const targetTab = tabs.find((tab) => tab.url && tab.url.includes(url));
        if (targetTab) {
          chrome.tabs.update(targetTab.id, { active: true }, () =>
            openNextTab(index + 1)
          );
        } else {
          chrome.tabs.create({ url }, () => openNextTab(index + 1));
        }
      });
    };
    openNextTab(0);
  });
}

// handle message from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);
  if (message.action === "openMultipleTabs") {
    Promise.all(urls.map((url) => openTabs(url))).then(() => {
      console.log("All tabs opened");
      sendResponse({ message: "Tabs opened." });
    });
    return true;
  }

  if (message.action === "checkLogin") {
    checkIfLoggedIn(sendResponse);
    return true;
  }

  if (message.action === "startScraping") {
    startScraping();
    sendResponse({ status: "Scraping started" });
  } else if (message.action === "stopScraping") {
    stopScraping();
    sendResponse({ status: "Scraping stopped" });
  }
});

// Check if the user is logged in vettx
function checkIfLoggedIn(callback) {
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
              if (vettxResults[0]?.result && fbResults[0]?.result) {
                callback({ loggedIn: true });
              } else {
                callback({ loggedIn: false });
              }
            }
          );
        }
      );
    } else {
      console.log("Vettx or Facebook tab not found");
      callback({ loggedIn: false });
    }
  });
}

let scrapedData = [];
let isScrapingActive = false;

function startScraping() {
  isScrapingActive = true;
  scrapedData = [];
  chrome.tabs.query({}, (tabs) => {
    const facebookTab = tabs.find(
      (tab) => tab.url && tab.url.includes("facebook.com/marketplace")
    );
    if (facebookTab) {
      console.log("Sending scrape message to Facebook tab");
      chrome.tabs.sendMessage(facebookTab.id, { action: "scrape" });
    } else {
      console.error("Facebook Marketplace tab not found");
    }
  });
}

function stopScraping() {
  isScrapingActive = false;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopScrape" });
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrapeComplete") {
    scrapedData = message.payload;
    console.log("Scraping completed. Total products:", scrapedData.length);
    // implementar la lógica para guardar o procesar los datos scrapeados
  }
});
