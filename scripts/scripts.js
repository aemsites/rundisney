import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
  decorateBlock,
} from './aem.js';

// eslint-disable-next-line import/no-cycle
import { loadFragment } from '../blocks/fragment/fragment.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  if (!h1) {
    return;
  }

  const section = h1.closest('div');

  const picture = section.querySelector('picture');
  if (!picture) {
    return;
  }

  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const elems = [...section.children];
    const filtered = elems.filter((el) => !el.classList.contains('section-metadata') && !el.classList.contains('alert'));
    const block = buildBlock('hero', { elems: filtered });
    section.append(block);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
/**
 * Decorates links inside del tags to be disabled buttons
 * @param {Element} element The container element
 */
function decorateDisabledButtons(element) {
  element.querySelectorAll('del > a').forEach((a) => {
    const button = document.createElement('button');
    button.textContent = a.textContent;
    button.classList.add('button');
    button.setAttribute('disabled', '');
    button.setAttribute('aria-disabled', 'true');

    const del = a.parentElement;
    del.parentNode.replaceChild(button, del);
  });
}

/**
 * Replaces a paragraph with a built block.
 * @param link a link.
 * @param block a block.
 */
function replaceParagraphWithBlock(link, block) {
  const parent = link.parentElement;
  if (parent && parent.tagName === 'P') {
    parent.replaceWith(block);
  } else {
    link.replaceWith(block);
  }
}

/**
 * Builds a fragment given a link element.
 * @param link the link.
 */
export function buildFragment(link) {
  const block = buildBlock('fragment', link.cloneNode(true));
  replaceParagraphWithBlock(link, block);
  decorateBlock(block);
}

/**
 * Decorates all links on a given page as fragments if they contain /fragments/ in the path.
 * @param {Element} main
 */
function decorateFragmentLinks(main) {
  main.querySelectorAll('a').forEach((link) => {
    if (link.href.includes('/fragments/')) {
      loadFragment(buildFragment(link));
    }
  });
}

export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  decorateDisabledButtons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateFragmentLinks(main);
}

/**
 * Loads template specific CSS and CSS without placing all code in global styles/scripts.
 */
export async function loadTemplate(doc, templateName) {
  try {
    const templateNameLower = templateName.toLowerCase();
    const cssLoaded = new Promise((resolve) => {
      loadCSS(
        `${window.hlx.codeBasePath}/templates/${templateNameLower}/${templateNameLower}.css`,
      )
        .then(resolve)
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(
            `failed to load css module for ${templateNameLower}`,
            err.target.href,
          );
          resolve();
        });
    });
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(
            `../templates/${templateNameLower}/${templateNameLower}.js`
          );
          if (mod.default) {
            await mod.default(doc);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${templateNameLower}`, error);
        }
        resolve();
      })();
    });

    document.body.classList.add(`${templateNameLower}-template`);

    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load block ${templateName}`, error);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');

  if (main) {
    decorateMain(main);
    const templateName = getMetadata('template');

    if (templateName) {
      await loadTemplate(doc, templateName);
    }

    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());
