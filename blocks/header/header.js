import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { createElement, createIcon } from '../../utils/dom.js';

const isDesktop = window.matchMedia('(min-width: 1024px)');

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
    section.querySelectorAll('.nav-nested-drop').forEach((nested) => {
      nested.setAttribute('aria-expanded', false);
    });
  });
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.classList.contains('nav-drop') || focused.classList.contains('nav-nested-drop');
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    e.preventDefault();
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    if (focused.classList.contains('nav-drop')) {
      toggleAllNavSections(focused.closest('.nav-sections'));
      focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
    } else if (focused.classList.contains('nav-nested-drop')) {
      focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
    }
  }
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  const navDrops = navSections.querySelectorAll('.nav-drop, .nav-nested-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

function handleDropdownHover(navSection, shouldOpen) {
  if (!isDesktop.matches) return;

  if (shouldOpen) {
    toggleAllNavSections(navSection.closest('.nav-sections'));
    navSection.setAttribute('aria-expanded', 'true');

    const nestedDropdowns = navSection.querySelectorAll('.nav-nested-drop');

    navSection.querySelectorAll('i').forEach((i) => {
      i.classList.add('icon__norgie-closed');
      i.classList.remove('icon__norgie-opened');
    });

    nestedDropdowns.forEach((dropdown, index) => {
      if (index === 0) {
        dropdown.setAttribute('aria-expanded', 'true');
        dropdown.querySelector('i').classList.add('icon__norgie-opened');
      }
    });
  } else {
    navSection.setAttribute('aria-expanded', 'false');
  }
}

function handleDropdownToggle(e, item, subList) {
  if (e.type === 'click' || e.code === 'Enter' || e.code === 'Space') {
    if (e.target.tagName !== 'A') {
      e.preventDefault();
      e.stopPropagation();
    }

    const parentDropdown = item.closest('[aria-expanded="true"]');
    if (parentDropdown) {
      parentDropdown.querySelectorAll('.nav-nested-drop[aria-expanded="true"]').forEach((drop) => {
        if (drop !== item) {
          drop.setAttribute('aria-expanded', 'false');
        }
      });
    }

    const expanded = item.getAttribute('aria-expanded') === 'true';
    item.setAttribute('aria-expanded', expanded ? 'false' : 'true');

    subList.querySelectorAll('i').forEach((i) => {
      i.classList.add('icon__norgie-closed');
      i.classList.remove('icon__norgie-opened');
    });

    item.querySelector('i').classList.toggle('icon__norgie-opened', !expanded);
  }
}

function decorateNestedDropdowns(navSection) {
  const subList = navSection.querySelector('ul');
  if (!subList) return;

  subList.querySelectorAll('li').forEach((item) => {
    const nestedList = item.querySelector('ul');
    const hasDirectLink = item.querySelector(':scope > a');

    if (nestedList) {
      nestedList.classList.add('nav-nested-list');

      if (!hasDirectLink) {
        item.classList.add('nav-nested-drop');
        item.setAttribute('aria-expanded', 'false');
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.prepend(createIcon('norgie-closed'));

        nestedList.querySelectorAll('a').forEach((a) => {
          const dateMatch = a.textContent.match(/\([^)]+\)/);
          if (dateMatch) {
            const dateText = dateMatch[0];
            const dateSpan = createElement('span', { class: 'date' }, dateText);
            a.innerHTML = a.innerHTML.replace(dateText, '');
            a.append(dateSpan);
          }
        });

        item.addEventListener('click', (e) => handleDropdownToggle(e, item, subList));
        item.addEventListener('keydown', (e) => handleDropdownToggle(e, item, subList));
      }
    }
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      const buttonContainers = navSection.querySelectorAll('.button-container');

      buttonContainers.forEach((buttonContainer) => {
        const button = buttonContainer.querySelector('a');
        if (button) {
          button.classList.remove('button');
          buttonContainer.parentNode.replaceChild(button, buttonContainer);
        }
      });

      navSection.querySelectorAll('p').forEach((p) => {
        const span = createElement('span', {}, p.textContent);
        p.replaceWith(span);
      });

      const hasSubmenu = navSection.querySelector('ul');
      if (hasSubmenu) {
        navSection.classList.add('nav-drop');
        navSection.setAttribute('tabindex', '-1');
        navSection.setAttribute('aria-expanded', 'false');

        decorateNestedDropdowns(navSection);

        navSection.addEventListener('mouseenter', () => handleDropdownHover(navSection, true));
        navSection.addEventListener('mouseleave', () => handleDropdownHover(navSection, false));

        navSection.addEventListener('click', () => {
          if (!isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });

        navSection.addEventListener('keydown', (e) => {
          if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      } else {
        navSection.removeAttribute('aria-expanded');
        navSection.classList.add('no-submenu');
      }
    });
  }

  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
