console.log("Content script Loaded");

/**
 * Configuration object for scraping parameters
 */
const CONFIG = {
  SCROLL_INTERVAL: 1500,
  SCROLL_DISTANCE: Math.ceil(window.innerHeight * 0.7),
  LOAD_DELAY: 3000,
  MAX_RETRIES: 5,
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
   * Extracts product data from a given element
   * @param {Element} productElement - The DOM element containing product information
   * @returns {Object} - An object containing the product's id and link
   */
  function extractProductData(productElement) {
    const link = productElement.href;
    const productId =
      link.split("/item/")[1]?.split("/")[0] || "ID not available";

    return {
      id: productId,
      link: link,
    };
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

  /**
   * Main function to scrape the Facebook Marketplace
   */
  async function scrapeMarketplace() {
    log("Waiting for page to fully load...");
    await waitForPageLoad();
    log("Page loaded. Starting data extraction from Marketplace...");

    let allProducts = [];
    try {
      while (isScrapingActive) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= MAX_TIME) {
          log("Time limit reached. Stopping scraping");
          break;
        }

        await scrollPage();
        log("Page scrolled, waiting for new products to load");

        if (!isScrapingActive) {
          throw new Error("Process stopped by user");
        }

        try {
          const productElements = await waitForElement([
            'a[href^="/marketplace/item/"]',
          ]);
          log(`Found ${productElements.length} product elements`);

          if (productElements.length === 0) {
            retryCount++;
            if (retryCount >= CONFIG.MAX_RETRIES) {
              log("Maximum retries reached. Stopping the process.", "warn");
              break;
            }
            log(
              `No products found. Retry ${retryCount}/${CONFIG.MAX_RETRIES}`,
              "warn"
            );
            continue;
          }

          retryCount = 0;

          const newProducts = Array.from(productElements)
            .map(extractProductData)
            .filter((product) => !allProducts.some((p) => p.id === product.id));

          log(`New unique products found: ${newProducts.length}`);

          if (newProducts.length === 0) {
            noNewProductsCount++;
            if (noNewProductsCount >= CONFIG.MAX_RETRIES) {
              log(
                "No new products found after several attempts. Stopping the process.",
                "warn"
              );
              break;
            }
            log(
              `No new products found. Attempt ${noNewProductsCount}/${CONFIG.MAX_RETRIES}`,
              "warn"
            );
            continue;
          }

          noNewProductsCount = 0;
          allProducts = [...allProducts, ...newProducts];
          totalProductsScraped = allProducts.length;

          log(`Total products found: ${totalProductsScraped}`);

          chrome.runtime.sendMessage({
            action: "updateStatus",
            status: "inProcess",
            message: `processInProgress - Scraped ${totalProductsScraped} products`,
          });
        } catch (error) {
          log(`Error while retrieving products: ${error.message}`, "error");
          retryCount++;
          if (retryCount >= CONFIG.MAX_RETRIES) {
            log("Maximum retries reached. Stopping scraping.", "warn");
            break;
          }
          log(
            `An error occurred. Please retry. ${retryCount}/${CONFIG.MAX_RETRIES}`,
            "warn"
          );
        }
      }

      log(
        `Data extraction completed. Total products found: ${totalProductsScraped}`
      );
      if (allProducts.length > 0) {
        log(`Sample of extracted data: ${JSON.stringify(allProducts[0])}`);
      }

      chrome.runtime.sendMessage({
        action: "scrapeComplete",
        payload: allProducts,
      });

      chrome.runtime.sendMessage({
        action: "updateStatus",
        status: "start",
        message: `noExecution - Scraping completed. Total products: ${totalProductsScraped}`,
      });
    } catch (error) {
      log(`Fatal error during the process: ${error.message}`, "error");
      chrome.runtime.sendMessage({
        action: "updateStatus",
        status: "start",
        message: "error",
        error: error.message,
        stack: error.stack,
      });
    } finally {
      isScrapingActive = false;
      log("Scraping process finished");
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrape") {
      log("Starting scraping process");
      isScrapingActive = true;
      scrapeMarketplace();
    } else if (message.action === "stopScrape") {
      log("Stopping the scraping process");
      isScrapingActive = false;
    }
  });
});
