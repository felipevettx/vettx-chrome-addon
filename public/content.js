console.log("Content script Loaded");

/**
 * Configuration object for scraping parameters
 */
const CONFIG = {
  SCROLL_INTERVAL: 1500,
  SCROLL_DISTANCE: Math.ceil(window.innerHeight * 0.7),
  LOAD_DELAY: 3000,
  MAX_RETRIES: 5,
  DEFAULT_MAX_TIME: 280000,
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
          reject(new Error("Scraping detenido por el usuario"));
          return;
        }

        for (let selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            log(
              `Elementos encontrados: ${selector}, cantidad: ${elements.length}`
            );
            resolve(elements);
            return;
          }
        }

        if (Date.now() - startTime > timeout) {
          log(
            `Tiempo de espera agotado. Selectores probados: ${selectors.join(
              ", "
            )}`,
            "warn"
          );
          reject(
            new Error(
              `Elementos ${selectors.join(
                ", "
              )} no encontrados después de ${timeout}ms`
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
      link.split("/item/")[1]?.split("/")[0] || "ID no disponible";

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
          log(`Scroll detenido. Elementos actuales: ${totalProductsScraped}`);
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
    log("Esperando a que la página se cargue completamente...");
    await waitForPageLoad();
    log("Página cargada. Iniciando extracción de datos del Marketplace...");

    let allProducts = [];
    try {
      while (isScrapingActive) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= MAX_TIME) {
          log("Límite de tiempo alcanzado. Deteniendo el scraping");
          break;
        }

        await scrollPage();
        log("Página desplazada, esperando a que se carguen nuevos productos");

        if (!isScrapingActive) {
          throw new Error("Proceso detenido por el usuario");
        }

        try {
          const productElements = await waitForElement([
            'a[href^="/marketplace/item/"]',
          ]);
          log(`Encontrados ${productElements.length} elementos de producto`);

          if (productElements.length === 0) {
            retryCount++;
            if (retryCount >= CONFIG.MAX_RETRIES) {
              log(
                "Máximo de reintentos alcanzado. Deteniendo el proceso.",
                "warn"
              );
              break;
            }
            log(
              `No se encontraron productos. Reintento ${retryCount}/${CONFIG.MAX_RETRIES}`,
              "warn"
            );
            continue;
          }

          retryCount = 0;

          const newProducts = Array.from(productElements)
            .map(extractProductData)
            .filter((product) => !allProducts.some((p) => p.id === product.id));

          log(`Nuevos productos únicos encontrados: ${newProducts.length}`);

          if (newProducts.length === 0) {
            noNewProductsCount++;
            if (noNewProductsCount >= CONFIG.MAX_RETRIES) {
              log(
                "No se encontraron nuevos productos después de varios intentos. Deteniendo el proceso.",
                "warn"
              );
              break;
            }
            log(
              `No se encontraron nuevos productos. Intento ${noNewProductsCount}/${CONFIG.MAX_RETRIES}`,
              "warn"
            );
            continue;
          }

          noNewProductsCount = 0;
          allProducts = [...allProducts, ...newProducts];
          totalProductsScraped = allProducts.length;

          log(`Total de productos encontrados: ${totalProductsScraped}`);

          chrome.runtime.sendMessage({
            action: "updateStatus",
            status: "inProcess",
            message: `processInProgress - Scraped ${totalProductsScraped} products`,
          });
        } catch (error) {
          log(
            `Error durante la extracción de productos: ${error.message}`,
            "error"
          );
          retryCount++;
          if (retryCount >= CONFIG.MAX_RETRIES) {
            log(
              "Máximo de reintentos alcanzado. Deteniendo el scraping.",
              "warn"
            );
            break;
          }
          log(
            `Ocurrió un error. Reintento ${retryCount}/${CONFIG.MAX_RETRIES}`,
            "warn"
          );
        }
      }

      log(
        `Extracción de datos completada. Total de productos encontrados: ${totalProductsScraped}`
      );
      if (allProducts.length > 0) {
        log(`Muestra de datos extraídos: ${JSON.stringify(allProducts[0])}`);
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
      log(`Error fatal durante el proceso: ${error.message}`, "error");
      chrome.runtime.sendMessage({
        action: "updateStatus",
        status: "start",
        message: "error",
        error: error.message,
        stack: error.stack,
      });
    } finally {
      isScrapingActive = false;
      log("Proceso de scraping finalizado");
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrape") {
      log("Iniciando proceso de scraping");
      isScrapingActive = true;
      scrapeMarketplace();
    } else if (message.action === "stopScrape") {
      log("Deteniendo el proceso de scraping");
      isScrapingActive = false;
    }
  });
});
