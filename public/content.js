console.log("Content script Loaded");

/**
 * Configuration object for scraping parameters
 */
const CONFIG = {
  SCROLL_INTERVAL: 900,
  SCROLL_DISTANCE: Math.ceil(window.innerHeight * 0.8),
  LOAD_DELAY: 1800,
  MAX_RETRIES: 15,
  DEFAULT_MAX_TIME: 300000,
};

/**
 * Simple logging function with different levels
 * @param {string} message - The message to log
 * @param {string} level - The log level (info, warn, error)
 */
function log(message, level = "info") {
  const prefix = `[FB Marketplace Scraper] [${level.toUpperCase()}]`;
  switch (level) {
    case "warn":
      console.warn(`${prefix} ${message}`);
      break;
    case "error":
      console.error(`${prefix} ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

let isScrapingActive = false;
let totalProductsScraped = 0;
let retryCount = 0;
let noNewProductsCount = 0;

function sendMessageWithRetry(message, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    function attemptSend(retriesLeft) {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            `Error sending message: ${chrome.runtime.lastError.message}`
          );
          if (retriesLeft > 0) {
            console.log(`Retrying... (${retriesLeft} attempts left)`);
            setTimeout(() => attemptSend(retriesLeft - 1), 1000);
          } else {
            reject(
              new Error(`Failed to send message after ${maxRetries} attempts`)
            );
          }
        } else {
          resolve(response);
        }
      });
    }
    attemptSend(maxRetries);
  });
}

chrome.storage.local.get("MAX_TIME", async (result) => {
  const MAX_TIME = result.MAX_TIME || CONFIG.DEFAULT_MAX_TIME;
  let startTime = Date.now();

  /**
   * Waits for the page to fully load
   * @returns {Promise<void>}
   */
  function waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener("load", resolve);
      }
    });
  }

  /**
   * Waits for elements matching the given selectors to appear in the DOM
   * @param {string[]} selectors - Array of CSS selectors to search for
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise<NodeListOf<Element>>}
   */
  function waitForElement(selectors, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      function checkElement() {
        if (!isScrapingActive) {
          reject(new Error("Scraping process stopped by user"));
          return;
        }

        for (let selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            log(`Items founded: ${selector}, amount: ${elements.length}`);
            resolve(elements);
            return;
          }
        }

        if (Date.now() - startTime > timeout) {
          log(`Timed out. Selectors tested: ${selectors.join(", ")}`, "warn");
          reject(
            new Error(
              `Elements ${selectors.join(", ")} not found after ${timeout}ms`
            )
          );
        } else {
          setTimeout(checkElement, 300);
        }
      }

      checkElement();
    });
  }

  /**
    Extracts product data from a given element
    @param {Element} productElement - The DOM element containing product information
    @returns {Object} - An object containing the product's id and link
   */
  function extractProductData(productElement) {
    try {
      const link =
        productElement.href || productElement.querySelector("a")?.href;
      const productId =
        link?.split("/item/")[1]?.split("/")[0] || "ID not available";

      if (!link || !productId) {
        log(`Invalid product element: ${productElement}`, "warn");
        return null;
      }

      return { id: productId, link };
    } catch (error) {
      log(`Error extracting product data: ${error.message}`, "error");
      return null;
    }
  }

  /**
   * Scrolls the page to load more content
   * @returns {Promise<void>}
   */
  function scrollPage() {
    return new Promise((resolve) => {
      let totalHeight = 0;
      const randomScrollInterval = CONFIG.SCROLL_INTERVAL + Math.random() * 500;
      let timer = setInterval(() => {
        if (!isScrapingActive) {
          log(`Scroll stopped. Current items: ${totalProductsScraped}`);
          clearInterval(timer);
          resolve();
          return;
        }

        let scrollHeight = document.documentElement.scrollHeight;
        window.scrollBy(0, CONFIG.SCROLL_DISTANCE);
        totalHeight += CONFIG.SCROLL_DISTANCE;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          setTimeout(resolve, CONFIG.LOAD_DELAY);
        }
      }, randomScrollInterval);
    });
  }

  //Main function to scrape the Facebook Marketplace

  async function scrapeMarketplace() {
    log("Waiting for page to fully load...");
    await waitForPageLoad();
    log("Page loaded. Starting data extraction from Marketplace...");

    let allProducts = [];
    const BATCH_SIZE = 10;
    let batchCounter = 0;

    try {
      while (isScrapingActive) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= MAX_TIME) {
          log("Time limit reached. Stopping scraping");
          break;
        }

        log("Scrolling page...");
        await scrollPage();
        log("Page scrolled, waiting for new products to load");

        if (!isScrapingActive) {
          throw new Error("Process stopped by user");
        }

        try {
          log("Waiting for product elements...");
          const productElements = await waitForElement([
            'a[href^="/marketplace/item/"]',
          ]);
          log(`Found ${productElements.length} product elements`);

          if (productElements.length === 0) {
            retryCount++;
            log(
              `No products found. Retry ${retryCount}/${CONFIG.MAX_RETRIES}`,
              "warn"
            );
            if (retryCount >= CONFIG.MAX_RETRIES) {
              log("Maximum retries reached. Stopping the process.", "warn");
              break;
            }
            continue;
          }

          retryCount = 0;

          const newProducts = Array.from(productElements)
            .map(extractProductData)
            .filter(
              (product) =>
                product && !allProducts.some((p) => p.id === product.id)
            );

          log(`New unique products found: ${newProducts.length}`);

          if (newProducts.length === 0) {
            noNewProductsCount++;
            log(
              `No new products found. Attempt ${noNewProductsCount}/${CONFIG.MAX_RETRIES}`,
              "warn"
            );
            if (noNewProductsCount >= CONFIG.MAX_RETRIES) {
              log(
                "No new products found after several attempts. Stopping the process.",
                "warn"
              );
              break;
            }
            continue;
          }

          noNewProductsCount = 0;
          allProducts = [...allProducts, ...newProducts];
          totalProductsScraped = allProducts.length;

          log(`Total products found: ${totalProductsScraped}`);

          try {
            await sendMessageWithRetry({
              action: "updateStatus",
              status: "inProcess",
              message: `processInProgress - Scraped ${totalProductsScraped} products`,
            });
            log("updateStatus message sent successfully");
          } catch (error) {
            log(
              `Error sending updateStatus message: ${error.message}`,
              "error"
            );
          }

          batchCounter += newProducts.length;
          if (batchCounter >= BATCH_SIZE) {
            log(
              `Sending batch of ${batchCounter} products to background script`
            );
            try {
              await sendMessageWithRetry({
                action: "updateScrapedData",
                payload: allProducts.slice(-batchCounter),
                totalScraped: totalProductsScraped,
              });
              log("updateScrapedData message sent successfully");
            } catch (error) {
              log(
                `Error sending updateScrapedData message: ${error.message}`,
                "error"
              );
            }
            batchCounter = 0;
          }
        } catch (error) {
          log(`Error while retrieving products: ${error.message}`, "error");
          retryCount++;
          if (retryCount >= CONFIG.MAX_RETRIES) {
            log("Maximum retries reached. Stopping scraping.", "warn");
            break;
          }
        }
      }

      // After the scraping loop
      log("Scraping completed. Sending final data to background script...");
      try {
        const response = await sendMessageWithRetry({
          action: "scrapeComplete",
          payload: allProducts,
          totalScraped: totalProductsScraped,
        });
        log("scrapeComplete message sent successfully");
        log("Response from background script:", response);
      } catch (error) {
        log(`Error sending scrapeComplete message: ${error.message}`, "error");
      }

      log(
        `Data extraction completed. Total products found: ${totalProductsScraped}`
      );
      if (allProducts.length > 0) {
        log(`Sample of extracted data: ${JSON.stringify(allProducts[0])}`);
      }

      try {
        await sendMessageWithRetry({
          action: "updateStatus",
          status: "start",
          message: `noExecution - Scraping completed. Total products: ${totalProductsScraped}`,
        });
        log("Final updateStatus message sent successfully");
      } catch (error) {
        log(
          `Error sending final updateStatus message: ${error.message}`,
          "error"
        );
      }
    } catch (error) {
      log(`Fatal error during the process: ${error.message}`, "error");
      try {
        await sendMessageWithRetry({
          action: "updateStatus",
          status: "start",
          message: "error",
          error: error.message,
          stack: error.stack,
        });
        log("Error updateStatus message sent successfully");
      } catch (sendError) {
        log(
          `Error sending error updateStatus message: ${sendError.message}`,
          "error"
        );
      }
    } finally {
      isScrapingActive = false;
      log("Scraping process finished");
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrape") {
      log("Starting scraping process");
      isScrapingActive = true;
      scrapeMarketplace()
        .then(() => {
          sendResponse({ status: "Scraping process completed" });
        })
        .catch((error) => {
          sendResponse({ status: "Error", error: error.message });
        });
      return true; // Indicates that the response is asynchronous
    } else if (message.action === "stopScrape") {
      log("Stopping the scraping process");
      isScrapingActive = false;
      sendResponse({ status: "Scraping process stopped" });
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "logScrapedData") {
      console.log("Received scraped data in content script:");
      console.log(JSON.stringify(message.data, null, 2));
      sendResponse({ status: "Data logged successfully" });
    } else if (message.action === "dataReceived") {
      console.log("Background script confirmed data reception");
      sendResponse({ status: "Confirmation received" });
    }
  });
});
