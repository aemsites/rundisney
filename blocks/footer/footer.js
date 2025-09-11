import { getMetadata, decorateIcons, decorateButtons } from '../../scripts/aem.js';
import { createElement, createIcon } from '../../utils/dom.js';

/**
 * Add mobile toggle functionality to footer columns
 * @param {Element} columnsContainer The columns container element
 */
function addMobileToggle(columnsContainer) {
  const toggleButton = createElement('button', {
    class: 'footer-mobile-toggle',
    'aria-expanded': 'false',
    'aria-label': 'Toggle footer links visibility',
  }, [
    createIcon('norgie-closed'),
    createElement('span', {}, 'Show more links'),
  ]);

  toggleButton.addEventListener('click', () => {
    const isExpanded = columnsContainer.classList.contains('expanded');
    const span = toggleButton.querySelector('span');
    const icon = toggleButton.querySelector('i');

    if (isExpanded) {
      columnsContainer.classList.remove('expanded');
      span.textContent = 'Show more links';
      toggleButton.setAttribute('aria-expanded', 'false');
      icon.className = 'icon icon__norgie-closed';
    } else {
      columnsContainer.classList.add('expanded');
      span.textContent = 'Show fewer links';
      toggleButton.setAttribute('aria-expanded', 'true');
      icon.className = 'icon icon__norgie-opened';
    }
  });

  const mobileQuery = window.matchMedia('(max-width: 1024px)');

  function handleMobileToggle() {
    if (mobileQuery.matches) {
      if (!columnsContainer.parentNode.contains(toggleButton)) {
        columnsContainer.parentNode.insertBefore(toggleButton, columnsContainer);
      }
    } else {
      if (columnsContainer.parentNode.contains(toggleButton)) {
        columnsContainer.parentNode.removeChild(toggleButton);
      }
      columnsContainer.classList.remove('expanded');
    }
  }

  handleMobileToggle();
  mobileQuery.addEventListener('change', handleMobileToggle);
}

/**
 * Process the footer-links div and convert to responsive column layout
 * @param {Element} footerLinks The footer-links div element
 */
function processFooterLinks(footerLinks) {
  const columnsContainer = footerLinks.querySelector('div > div');
  if (!columnsContainer) return;

  columnsContainer.className = 'footer-columns';
  const columns = columnsContainer.children;

  [...columns].forEach((column) => {
    const heading = column.querySelectorAll('p strong');
    if (heading.length > 0) {
      heading.forEach((h) => {
        const title = document.createElement('h6');
        title.textContent = h.textContent;

        const pElement = h.closest('p');
        pElement.parentNode.replaceChild(title, pElement);
      });
    }
  });

  addMobileToggle(columnsContainer);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  const resp = await fetch(
    `${footerPath}.plain.html`,
    window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {},
  );

  if (resp.ok) {
    const html = await resp.text();
    const footer = createElement('div', {}, html);

    const footerLinks = footer.querySelector('.footer-links');
    const shouldShowNewsletter = getMetadata('newsletter').toLowerCase() === 'true';

    if (shouldShowNewsletter) {
      block.classList.add('show-newsletter');
    }

    if (footerLinks) {
      processFooterLinks(footerLinks);
    }
    decorateIcons(footer);
    decorateButtons(footer);
    block.append(footer);
  }
}
