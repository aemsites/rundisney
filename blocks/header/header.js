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

/**
 * Handles keyboard interactions for opening nav dropdowns
 * @param {Event} e The keyboard event
 */
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

/**
 * Closes all open nested dropdowns
 */
function closeAllNestedDropdowns() {
  document.querySelectorAll('.nav-nested-drop[aria-expanded="true"]').forEach((dropdown) => {
    dropdown.setAttribute('aria-expanded', 'false');
    const icon = dropdown.querySelector('i');
    if (icon) {
      icon.className = 'icon icon__norgie-closed';
    }
  });
}

/**
 * Handles clicks outside the navigation to close dropdowns
 * @param {Event} event The click event
 */
function handleOutsideClick(event) {
  const navElement = document.querySelector('nav');
  if (navElement && !navElement.contains(event.target)) {
    document.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((section) => {
      section.setAttribute('aria-expanded', 'false');
    });
    closeAllNestedDropdowns();
  }
}

/**
 * Handles escape key press to close all dropdowns
 * @param {Event} event The keyboard event
 */
function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    document.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((section) => {
      section.setAttribute('aria-expanded', 'false');
    });
    closeAllNestedDropdowns();
  }
}

/**
 * Sets up keyboard navigation for focused nav sections
 */
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
  const span = button.querySelector('span');

  if (span) {
    span.classList.toggle('icon__menu-global-nav', expanded);
    span.classList.toggle('icon__close-button', !expanded);
  }

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
}

let isInteractingWithNested = false;

/**
 * Checks if mouse is outside the dropdown area
 * @param {Element} navSection The nav section element
 * @param {Event} event The mouse event
 * @returns {Boolean} True if mouse is genuinely outside
 */
function isMouseOutsideDropdown(navSection, event) {
  if (isInteractingWithNested) {
    return false;
  }

  const rect = navSection.getBoundingClientRect();
  const dropdown = navSection.querySelector('ul');

  if (!dropdown) return true;

  const dropdownRect = dropdown.getBoundingClientRect();

  const combinedRect = {
    left: Math.min(rect.left, dropdownRect.left),
    right: Math.max(rect.right, dropdownRect.right),
    top: Math.min(rect.top, dropdownRect.top),
    bottom: Math.max(rect.bottom, dropdownRect.bottom),
  };

  const mouseX = event.clientX;
  const mouseY = event.clientY;

  return mouseX < combinedRect.left
    || mouseX > combinedRect.right
    || mouseY < combinedRect.top
    || mouseY > combinedRect.bottom;
}

/**
 * Handles hover interactions for main nav dropdowns
 * @param {Element} navSection The nav section element
 * @param {Boolean} shouldOpen Whether to open or close the dropdown
 * @param {Event} event The mouse event (optional, for mouseleave)
 */
function handleDropdownHover(navSection, shouldOpen, event = null) {
  if (!isDesktop.matches) return;

  if (shouldOpen) {
    const navSections = navSection.closest('.nav-sections');
    navSections.querySelectorAll('.nav-drop').forEach((section) => {
      if (section !== navSection) {
        section.setAttribute('aria-expanded', 'false');
      }
    });

    navSection.setAttribute('aria-expanded', 'true');

    const hasOpenNested = navSection.querySelector('.nav-nested-drop[aria-expanded="true"]');
    if (!hasOpenNested) {
      const firstNested = navSection.querySelector('.nav-nested-drop');
      if (firstNested) {
        navSection.querySelectorAll('.nav-nested-drop').forEach((dropdown) => {
          dropdown.setAttribute('aria-expanded', 'false');
          const icon = dropdown.querySelector('i');
          if (icon) {
            icon.className = 'icon icon__norgie-closed';
          }
        });

        firstNested.setAttribute('aria-expanded', 'true');
        const icon = firstNested.querySelector('i');
        if (icon) {
          icon.className = 'icon icon__norgie-opened';
        }
      }
    }
  } else if (!event || isMouseOutsideDropdown(navSection, event)) {
    navSection.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Handles click and keyboard interactions for nested dropdownsn
 * @param {Event} event The click or keyboard event
 */
function handleNestedToggle(event) {
  const { target } = event;
  const { currentTarget } = event;

  if (target.tagName === 'A') {
    return;
  }

  if (target.closest('.nav-nested-list') && target.closest('.nav-nested-list') !== currentTarget.querySelector('.nav-nested-list')) {
    return;
  }

  if (target.closest('a')) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  isInteractingWithNested = true;

  setTimeout(() => {
    isInteractingWithNested = false;
  }, 50);

  const isExpanded = currentTarget.getAttribute('aria-expanded') === 'true';
  const parentNav = currentTarget.closest('.nav-drop');

  if (parentNav) {
    parentNav.querySelectorAll('.nav-nested-drop').forEach((dropdown) => {
      if (dropdown !== currentTarget) {
        dropdown.setAttribute('aria-expanded', 'false');
        const icon = dropdown.querySelector('i');
        if (icon) {
          icon.className = 'icon icon__norgie-closed';
        }
      }
    });
  }

  currentTarget.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
  const icon = currentTarget.querySelector('i');
  if (icon) {
    icon.className = isExpanded ? 'icon icon__norgie-closed' : 'icon icon__norgie-opened';
  }
}

/**
 * Decorates nested dropdowns within a nav section
 * @param {Element} navSection The nav section containing nested dropdowns
 */
function decorateNestedDropdowns(navSection) {
  const subList = navSection.querySelector('ul');
  if (!subList) return;

  if (!isDesktop.matches) {
    subList.classList.add('hidden');
    const topLevelLink = navSection.querySelector(':scope > a') || navSection.querySelector(':scope > span');

    if (topLevelLink) {
      topLevelLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isHidden = subList.classList.contains('hidden');
        const allParentDropdowns = navSection.closest('.nav-sections').querySelectorAll('.nav-drop');
        allParentDropdowns.forEach((dropdown) => {
          dropdown.setAttribute('aria-expanded', 'false');
          const sub = dropdown.querySelector('ul');
          if (sub) {
            sub.classList.add('hidden');
          }
        });

        if (isHidden) {
          subList.classList.remove('hidden');
        } else {
          subList.classList.add('hidden');
        }
      });
    }
  }

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
          const listItem = a.closest('li');
          const img = listItem.querySelector('img');
          listItem.innerHTML = '';

          const dateMatch = a.textContent.match(/\([^)]+\)/);
          let dateText;

          if (dateMatch) {
            [dateText] = dateMatch;
            a.textContent = a.textContent.replace(dateText, '');
          }

          const anchor = createElement(
            'a',
            {
              href: a.href,
              ...(dateText ? {} : { class: 'no-date' }),
            },
            [
              img,
              createElement('div', { class: 'label-date-wrapper' }, [
                createElement('span', { class: 'label' }, a.textContent),
                ...(dateText ? [createElement('span', { class: 'date' }, [dateText])] : []),
              ]),
            ],
          );

          listItem.append(anchor);
        });

        item.addEventListener('click', handleNestedToggle);

        const hasDirectChildLink = item.querySelector(':scope > a');
        if (!hasDirectChildLink) {
          item.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' || e.code === 'Space') {
              const focusedElement = document.activeElement;
              if (focusedElement && focusedElement.tagName === 'A') {
                return;
              }

              handleNestedToggle(e);
            }
          });
        }
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

  block.innerHTML = '';
  const nav = createElement('nav', { id: 'nav' });
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
      const paragraphTags = navSection.querySelectorAll(':scope p');
      paragraphTags.forEach((p) => {
        const directAnchor = p.querySelector(':scope > a');
        if (directAnchor) {
          p.replaceWith(directAnchor);
        } else if (p.querySelector(':scope > picture')) {
          const img = p.querySelector(':scope img');
          p.replaceWith(img);
        } else {
          const span = createElement('span', {}, p.textContent);
          p.replaceWith(span);
        }
      });

      const hasSubmenu = navSection.querySelector('ul');
      if (hasSubmenu) {
        navSection.classList.add('nav-drop');
        navSection.setAttribute('tabindex', '-1');
        navSection.setAttribute('aria-expanded', 'false');

        decorateNestedDropdowns(navSection);

        navSection.addEventListener('mouseenter', (e) => handleDropdownHover(navSection, true, e));
        navSection.addEventListener('mouseleave', (e) => handleDropdownHover(navSection, false, e));

        navSection.addEventListener('keydown', (e) => {
          if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            const isExpanded = navSection.getAttribute('aria-expanded') === 'true';
            if (!isExpanded) {
              handleDropdownHover(navSection, true);
            }
          }
        });

        const handleFocusIn = () => {
          navSections.querySelectorAll('.nav-drop').forEach((section) => {
            if (section !== navSection && section.getAttribute('aria-expanded') === 'true') {
              section.setAttribute('aria-expanded', 'false');
            }
          });
        };

        navSection.addEventListener('focus', handleFocusIn);
        navSection.addEventListener('focusin', handleFocusIn);
      } else {
        navSection.removeAttribute('aria-expanded');
        navSection.classList.add('no-submenu');
      }
    });
  }

  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="icon size-l icon__menu-global-nav"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleEscapeKey);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
