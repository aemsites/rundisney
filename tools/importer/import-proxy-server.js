import puppeteer from 'puppeteer'; // eslint-disable-line import/no-extraneous-dependencies
import { createServer } from 'http';
import open from 'open'; // eslint-disable-line import/no-extraneous-dependencies
import { logger, colors } from './utils.js';

const PORT = 4001;
const CACHE_TTL = 5 * 60 * 1000;

const pageCache = {};

const COMMON_HEADERS = {
  CORS: {
    'Access-Control-Allow-Origin': '*',
  },
  CORS_PREFLIGHT: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
  },
  NO_CACHE: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  },
  HTML_CONTENT_TYPE: {
    'Content-Type': 'text/html; charset=utf-8',
  },
  JSON_CONTENT: {
    'Content-Type': 'application/json; charset=utf-8',
  },
};

const sendCachedResponse = (res, html) => {
  const headers = {
    ...COMMON_HEADERS.HTML_CONTENT_TYPE,
    ...COMMON_HEADERS.CORS,
    ...COMMON_HEADERS.NO_CACHE,
    'X-Rendered-By': 'rundisney-content-import-proxy-cache',
    'X-Cache-Hit': 'true',
  };
  res.writeHead(200, headers);
  res.end(html);
};

const sendErrorResponse = (res, error) => {
  const headers = {
    ...COMMON_HEADERS.JSON_CONTENT,
    ...COMMON_HEADERS.CORS,
  };
  res.writeHead(500, headers);
  res.end(JSON.stringify({
    error: 'Rendering failed',
    message: error.message,
    timestamp: new Date().toISOString(),
  }, null, 2));
};

const cacheAndServe = (cacheKey, result) => {
  pageCache[cacheKey] = {
    html: result.html,
    timestamp: Date.now(),
  };

  return {
    ...COMMON_HEADERS.HTML_CONTENT_TYPE,
    ...COMMON_HEADERS.CORS,
    ...COMMON_HEADERS.NO_CACHE,
    'X-Rendered-By': 'rundisney-content-import-proxy',
    'X-Original-Url': result.originalUrl,
    'X-Page-Title': result.title,
    'X-Content-Quality': result.isRichContent ? 'rich' : 'basic',
    'X-Cache-Hit': 'false',
  };
};

async function prerenderPage(targetUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await Promise.race([
      page.waitForSelector('main', { timeout: 15000 }).catch(() => null),
      page.waitForSelector('#mainBody', { timeout: 15000 }).catch(() => null),
      page.waitForSelector('.contentSection', { timeout: 15000 }).catch(() => null),
      page.waitForSelector('[ui-view="content"]', { timeout: 15000 }).catch(() => null),
      page.waitForSelector('article', { timeout: 15000 }).catch(() => null),
    ]);

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete || img.naturalHeight !== 0);
    }, { timeout: 10000 }).catch(() => {
      console.log('Some images may have failed to load.')
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });

    let html = await page.content();
    const title = await page.title();
    html = html.replace(/<base\s+href=["'][^"']*["']\s*\/?>/gi, '<!-- base href removed by proxy -->');

    const isRichContent = html.includes('ng-app="runSpa"') && html.length > 20000;

    logger.success('Rendering complete');

    return {
      html, title, originalUrl: targetUrl, isRichContent,
    };
  } finally {
    await browser.close();
  }
}

function normalizePathname(pathname) {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isAssetRequest(pathname) {
  const assetExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map'];
  return assetExtensions.some((ext) => pathname.toLowerCase().endsWith(ext));
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname: originalPathname } = requestUrl;
  const pathname = normalizePathname(originalPathname);

  if (!isAssetRequest(pathname)) {
    logger.request(req.method, pathname);
  }

  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, COMMON_HEADERS.CORS_PREFLIGHT);
      res.end();
      return;
    }

    if (isAssetRequest(pathname)) {
      const assetUrl = `https://www.rundisney.com${pathname}`;
      res.writeHead(302, { ...COMMON_HEADERS.CORS, Location: assetUrl });
      res.end();
      return;
    }

    const targetUrl = `https://www.rundisney.com${pathname}`;
    const cacheKey = targetUrl;

    if (pathname !== '/') {
      logger.info(`Rendering page: ${colors.highlight(pathname)}`);
    }

    const cached = pageCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      if (pathname !== '/') {
        logger.success(`✅ Served ${pathname} from cache`);
      }
      sendCachedResponse(res, cached.html);
      return;
    }

    const result = await prerenderPage(targetUrl);
    const headers = cacheAndServe(cacheKey, result);
    res.writeHead(200, headers);
    res.end(result.html);
  } catch (error) {
    logger.error(`Request failed: ${error.message}`);
    sendErrorResponse(res, error);
  }
});

server.listen(PORT, async () => {
  const serverMessage = `Server running on: ${colors.highlight(`http://localhost:${PORT}`)}`;
  logger.box('🎯 Import Proxy Server', serverMessage, { borderColor: 'green' });
  logger.warn('Press Ctrl+C to stop the server');

  try {
    await open(`http://localhost:${PORT}`);
  } catch (error) {
    logger.warn(`Could not open browser: ${error.message}`);
  }

  console.log('\n'); // eslint-disable-line no-console
});

process.on('SIGINT', () => {
  logger.error('Shutting down...'); // eslint-disable-line no-console
  process.exit(0);
});

export default server;
