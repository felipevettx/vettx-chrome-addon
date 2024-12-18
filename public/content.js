console.log("Content script Loaded");

let isScrapingActive = false;
let totalProductsScraped = 0;

const SCROLL_INTERVAL = 1500;
const SCROLL_DISTANCE = Math.ceil(window.innerHeight * 0.7);
const LOAD_DELAY = 3000;
const MAX_RETRIES = 5;

let retryCount = 0;
let noNewProductsCount = 0;

chrome.storage.local.get("MAX_TIME", (result) => {
  const MAX_TIME = result.MAX_TIME || 280000;
  let startTime = Date.now();

  function waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener("load", resolve);
      }
    });
  }

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
            console.log(
              `Elementos encontrados: ${selector}, cantidad: ${elements.length}`
            );
            resolve(elements);
            return;
          }
        }

        if (Date.now() - startTime > timeout) {
          console.log(
            `Tiempo de espera agotado. Selectores probados: ${selectors.join(
              ", "
            )}`
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

  function extractProductData(productElement) {
    const link = productElement.href;
    const productId =
      link.split("/item/")[1]?.split("/")[0] || "ID no disponible";

    return {
      id: productId,
      link: link,
    };
  }

  function scrollPage() {
    return new Promise((resolve) => {
      let totalHeight = 0;
      const randomScrollInterval = SCROLL_INTERVAL + Math.random() * 500;
      let timer = setInterval(() => {
        if (!isScrapingActive) {
          console.log(
            `Scroll detenido. Elementos actuales: ${totalProductsScraped}`
          );
          clearInterval(timer);
          resolve();
          return;
        }

        let scrollHeight = document.documentElement.scrollHeight;
        window.scrollBy(0, SCROLL_DISTANCE);
        totalHeight += SCROLL_DISTANCE;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          setTimeout(resolve, LOAD_DELAY);
        }
      }, randomScrollInterval);
    });
  }

  async function scrapeMarketplace() {
    console.log("Esperando a que la página se cargue completamente...");
    await waitForPageLoad();
    console.log(
      "Página cargada. Iniciando extracción de datos del Marketplace..."
    );

    let allProducts = [];
    try {
      while (isScrapingActive) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= MAX_TIME) {
          console.log("Límite de tiempo alcanzado. Deteniendo el scraping");
          break;
        }

        await scrollPage();
        console.log(
          "Página desplazada, esperando a que se carguen nuevos productos"
        );

        if (!isScrapingActive) {
          throw new Error("Proceso detenido por el usuario");
        }

        try {
          const productElements = await waitForElement([
            'a[href^="/marketplace/item/"]',
          ]);
          console.log(
            `Encontrados ${productElements.length} elementos de producto`
          );

          if (productElements.length === 0) {
            retryCount++;
            if (retryCount >= MAX_RETRIES) {
              console.log(
                "Máximo de reintentos alcanzado. Deteniendo el proceso."
              );
              break;
            }
            console.log(
              `No se encontraron productos. Reintento ${retryCount}/${MAX_RETRIES}`
            );
            continue;
          }

          retryCount = 0;

          const newProducts = Array.from(productElements)
            .map(extractProductData)
            .filter((product) => !allProducts.some((p) => p.id === product.id));

          console.log(
            `Nuevos productos únicos encontrados: ${newProducts.length}`
          );

          if (newProducts.length === 0) {
            noNewProductsCount++;
            if (noNewProductsCount >= MAX_RETRIES) {
              console.log(
                "No se encontraron nuevos productos después de varios intentos. Deteniendo el proceso."
              );
              break;
            }
            console.log(
              `No se encontraron nuevos productos. Intento ${noNewProductsCount}/${MAX_RETRIES}`
            );
            continue;
          }

          noNewProductsCount = 0;
          allProducts = [...allProducts, ...newProducts];
          totalProductsScraped = allProducts.length;

          console.log(
            `Total de productos encontrados: ${totalProductsScraped}`
          );

          chrome.runtime.sendMessage({
            action: "updateStatus",
            status: "inProcess",
            message: `processInProgress - Scraped ${totalProductsScraped} products`,
          });
        } catch (error) {
          console.error("Error durante la extracción de productos:", error);
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            console.log(
              "Máximo de reintentos alcanzado. Deteniendo el scraping."
            );
            break;
          }
          console.log(
            `Ocurrió un error. Reintento ${retryCount}/${MAX_RETRIES}`
          );
        }
      }

      console.log(
        `Extracción de datos completada. Total de productos encontrados: ${totalProductsScraped}`
      );
      if (allProducts.length > 0) {
        console.log("Muestra de datos extraídos:", allProducts[0]);
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
      console.error("Error fatal durante el proceso:", error);
      chrome.runtime.sendMessage({
        action: "updateStatus",
        status: "start",
        message: "error",
        error: error.message,
        stack: error.stack,
      });
    } finally {
      isScrapingActive = false;
      console.log("Proceso de scraping finalizado");
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrape") {
      console.log("Iniciando proceso de scraping");
      isScrapingActive = true;
      scrapeMarketplace();
    } else if (message.action === "stopScrape") {
      console.log("Deteniendo el proceso de scraping");
      isScrapingActive = false;
    }
  });
});
