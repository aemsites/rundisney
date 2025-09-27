import { createElement, createIcon } from '../../utils/dom.js';

/**
 * Fetches the results index with caching
 * @returns {Promise<Array>} - The results index data
 */
async function fetchResultsIndex() {
  if (window.resultsIndex) {
    return window.resultsIndex;
  }
  const response = await fetch('/result-index.json');
  if (!response.ok) throw new Error('Failed to load results index');
  const json = await response.json();
  const { data = [] } = json;
  window.resultsIndex = data;
  return data;
}

/**
 * Extracts event data from results index
 * @param {Array} resultsIndex - The results index data
 * @returns {Object} - Object with events and their available years
 */
function extractEventData(resultsIndex) {
  const eventMap = {};

  resultsIndex.forEach((item) => {
    if (item.path && item.path.includes('/results/')) {
      const pathParts = item.path.split('/').filter((part) => part);
      const resultsIndexInPath = pathParts.indexOf('results');

      if (resultsIndexInPath !== -1 && pathParts.length > resultsIndexInPath + 1) {
        const eventSlug = pathParts[resultsIndexInPath + 1];
        const year = pathParts.length > resultsIndexInPath + 2
          ? pathParts[resultsIndexInPath + 2]
          : null;

        const defaultEventName = eventSlug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const eventName = item.label || defaultEventName;

        if (!eventMap[eventSlug]) {
          eventMap[eventSlug] = {
            name: eventName,
            slug: eventSlug,
            years: {},
          };
        } else if (item.label) {
          eventMap[eventSlug].name = eventName;
        }

        if (year && /^\d{4}$/.test(year)) {
          eventMap[eventSlug].years[year] = true;
        }
      }
    }
  });

  Object.values(eventMap).forEach((event) => {
    event.years = Object.keys(event.years).map(Number).sort((a, b) => b - a);
  });

  return eventMap;
}

/**
 * Gets all menu options from a dropdown menu
 * @param {HTMLElement} menu - The menu element
 * @returns {NodeList} - All custom select option elements
 */
function getMenuOptions(menu) {
  return menu.querySelectorAll('.custom-select-option');
}

/**
 * Clamps an index value within the bounds of menu options
 * @param {number} index - The index to clamp
 * @param {number} maxLength - Maximum length (menuOptions.length)
 * @returns {number} - Clamped index value
 */
function clampIndex(index, maxLength) {
  return Math.max(0, Math.min(maxLength - 1, index));
}

/**
 * Creates a keydown event handler for dropdown navigation
 * @param {Object} dropdown - The dropdown object with all necessary methods and state
 * @param {boolean} isMenuHandler - Whether this is for menu navigation (vs trigger)
 * @returns {Function} - Event handler function
 */
function createKeydownHandler(dropdown, isMenuHandler = false) {
  return (e) => {
    const {
      openDropdown,
      closeDropdown,
      selectOption,
      updateSelectedOption,
      menu,
    } = dropdown;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        e.stopPropagation();
        const menuOptions = getMenuOptions(menu);
        const direction = e.key === 'ArrowDown' ? 1 : -1;

        if (isMenuHandler) {
          const newIndex = clampIndex(dropdown.selectedIndex + direction, menuOptions.length);
          dropdown.selectedIndex = newIndex;
          updateSelectedOption();
        } else if (!dropdown.isOpen()) {
          openDropdown();
        } else {
          const newIndex = clampIndex(dropdown.selectedIndex + direction, menuOptions.length);
          dropdown.selectedIndex = newIndex;
          updateSelectedOption();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        e.stopPropagation();
        if (isMenuHandler) {
          selectOption(dropdown.selectedIndex);
        } else if (!dropdown.isOpen()) {
          openDropdown();
        } else if (dropdown.selectedIndex >= 0) {
          selectOption(dropdown.selectedIndex);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        e.stopPropagation();
        if (dropdown.isOpen()) {
          closeDropdown();
        }
        break;
      }
      case 'Tab': {
        if (dropdown.isOpen()) {
          closeDropdown();
        }
        break;
      }
      default:
        break;
    }
  };
}

/**
 * Creates a custom dropdown element similar to blog-filter
 * @param {string} id - Element ID
 * @param {string} title - Title text
 * @param {string} placeholder - Placeholder text
 * @param {Array} options - Array of option objects with value and text
 * @returns {Object} - Object with root, trigger, menu, title, summary elements
 */
function createCustomDropdown(id, title, placeholder, options) {
  const container = createElement('div', { class: 'results-filter-dropdown' });
  const root = createElement('div', { class: 'custom-select' });
  const trigger = createElement('button', {
    type: 'button',
    class: 'custom-select-trigger',
    'aria-label': title,
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
    'aria-activedescendant': '',
    'aria-describedby': `${id}-summary`,
    'data-id': id,
  });
  const text = createElement('div', { class: 'custom-select-text' });
  const titleEl = createElement('span', { class: 'custom-select-title' }, title);
  const summary = createElement('span', {
    class: 'custom-select-summary',
    id: `${id}-summary`,
  }, placeholder);
  const caret = createIcon('norgie-opened');

  text.append(titleEl, summary);
  trigger.append(text, caret);

  const menu = createElement('div', {
    class: 'custom-select-menu',
    role: 'listbox',
    'aria-label': `${title} options`,
  });

  options.forEach((option, index) => {
    const optionId = `${id}-option-${index}`;
    const optionEl = createElement('div', {
      class: 'custom-select-option',
      'data-value': option.value,
      role: 'option',
      'aria-selected': 'false',
      id: optionId,
      tabindex: '-1',
    }, option.text);
    menu.append(optionEl);
  });

  root.append(trigger, menu);
  container.append(root);

  let selectedIndex = -1;
  let isOpen = false; // eslint-disable-line no-unused-vars

  function updateSelectedOption() {
    const menuOptions = getMenuOptions(menu);
    menuOptions.forEach((option, index) => {
      option.setAttribute('aria-selected', index === selectedIndex ? 'true' : 'false');
      option.classList.toggle('selected', index === selectedIndex);
    });

    if (selectedIndex >= 0 && selectedIndex < menuOptions.length && isOpen) {
      const activeOption = menuOptions[selectedIndex];
      trigger.setAttribute('aria-activedescendant', activeOption.id);
      activeOption.focus();
    } else {
      trigger.setAttribute('aria-activedescendant', '');
    }
  }

  function openDropdown() {
    root.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    isOpen = true;

    const menuOptions = getMenuOptions(menu);
    if (menuOptions.length > 0) {
      const currentSummary = summary.textContent;
      const isPlaceholder = currentSummary === 'Select Event' || currentSummary === 'Select Year';

      selectedIndex = -1;

      if (!isPlaceholder) {
        for (let i = 0; i < menuOptions.length; i += 1) {
          if (menuOptions[i].textContent === currentSummary) {
            selectedIndex = i;
            break;
          }
        }
      }

      if (selectedIndex === -1) {
        selectedIndex = 0;
      }

      updateSelectedOption();
    }
  }

  function closeDropdown(shouldFocus = true) {
    root.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-activedescendant', '');
    isOpen = false;
    if (shouldFocus) {
      trigger.focus();
    }
  }

  function selectOption(index) {
    const menuOptions = getMenuOptions(menu);
    if (index >= 0 && index < menuOptions.length) {
      const option = menuOptions[index];
      const { value } = option.dataset;
      const optionText = option.textContent;

      summary.textContent = optionText;

      closeDropdown();

      const changeEvent = new CustomEvent('change', {
        detail: { value, text: optionText, index },
      });
      root.dispatchEvent(changeEvent);
    }
  }

  trigger.addEventListener('click', () => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  trigger.addEventListener('keydown', createKeydownHandler({
    isOpen: () => isOpen,
    openDropdown,
    closeDropdown,
    selectOption,
    updateSelectedOption,
    menu,
    get selectedIndex() { return selectedIndex; },
    set selectedIndex(value) { selectedIndex = value; },
  }, false));

  menu.addEventListener('click', (e) => {
    const option = e.target.closest('.custom-select-option');
    if (option) {
      const index = [...getMenuOptions(menu)].indexOf(option);
      selectOption(index);
    }
  });

  menu.addEventListener('keydown', createKeydownHandler({
    isOpen: () => isOpen,
    openDropdown,
    closeDropdown,
    selectOption,
    updateSelectedOption,
    menu,
    get selectedIndex() { return selectedIndex; },
    set selectedIndex(value) { selectedIndex = value; },
  }, true));

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) {
      closeDropdown(false);
    }
  });

  function setSelectedValue(value) {
    const menuOptions = getMenuOptions(menu);
    for (let i = 0; i < menuOptions.length; i += 1) {
      if (menuOptions[i].dataset.value === value) {
        selectedIndex = i;
        const currentSelectedIndex = selectedIndex;
        menuOptions.forEach((option, index) => {
          option.setAttribute('aria-selected', index === currentSelectedIndex ? 'true' : 'false');
          option.classList.toggle('selected', index === currentSelectedIndex);
        });

        if (selectedIndex >= 0 && selectedIndex < menuOptions.length) {
          const activeOption = menuOptions[selectedIndex];
          trigger.setAttribute('aria-activedescendant', activeOption.id);
        } else {
          trigger.setAttribute('aria-activedescendant', '');
        }
        break;
      }
    }
  }

  function resetSelection() {
    selectedIndex = -1;
  }

  return {
    container,
    root,
    trigger,
    menu,
    title: titleEl,
    summary,
    openDropdown,
    closeDropdown,
    selectOption,
    setSelectedValue,
    resetSelection,
  };
}

/**
 * Extracts event and year from current URL
 * @returns {Object} - Object with eventSlug and year
 */
function getUrlParams() {
  const pathParts = window.location.pathname.split('/').filter((part) => part);
  const resultsIndex = pathParts.indexOf('results');

  if (resultsIndex !== -1 && pathParts.length > resultsIndex + 2) {
    const eventSlug = pathParts[resultsIndex + 1];
    const year = pathParts[resultsIndex + 2];

    return {
      eventSlug: /^\d{4}$/.test(year) ? eventSlug : null,
      year: /^\d{4}$/.test(year) ? year : null,
    };
  }

  return { eventSlug: null, year: null };
}

/**
 * Creates the get results button
 * @returns {HTMLElement} - The button element
 */
function createGetResultsButton() {
  return createElement('button', {
    type: 'button',
    class: ['results-filter-button', 'button'],
    disabled: true,
  }, 'Get Results');
}

/**
 * Updates the year dropdown based on selected event
 * @param {Object} yearDropdown - The year dropdown object
 * @param {Array} years - Available years for the selected event
 */
function updateYearDropdown(yearDropdown, years) {
  yearDropdown.menu.innerHTML = '';
  yearDropdown.resetSelection();

  years.forEach((year, index) => {
    const optionId = `year-select-option-${index}`;
    const optionEl = createElement('div', {
      class: 'custom-select-option',
      'data-value': year,
      role: 'option',
      'aria-selected': 'false',
      id: optionId,
      tabindex: '-1',
    }, year);
    yearDropdown.menu.append(optionEl);
  });
}

/**
 * Updates button state based on selections
 * @param {HTMLElement} button - The button element
 * @param {string} selectedEvent - Selected event
 * @param {string} selectedYear - Selected year
 */
function updateButtonState(button, selectedEvent, selectedYear) {
  const isEnabled = selectedEvent && selectedYear;
  button.disabled = !isEnabled;
  button.classList.toggle('disabled', !isEnabled);
}

/**
 * Handles navigation to results page
 * @param {string} eventSlug - Event slug
 * @param {string} year - Selected year
 */
function navigateToResults(eventSlug, year) {
  const resultsUrl = `/results/${eventSlug}/${year}`;
  window.location.href = resultsUrl;
}

/**
 * Results filter block that provides event and year filtering functionality
 */
export default async function decorate(block) {
  try {
    const resultsIndex = await fetchResultsIndex();
    if (!resultsIndex || resultsIndex.length === 0) {
      block.innerHTML = '<p>No results data available.</p>';
      return;
    }

    const eventMap = extractEventData(resultsIndex);
    const events = Object.values(eventMap).sort((a, b) => a.name.localeCompare(b.name));

    if (events.length === 0) {
      block.innerHTML = '<p>No events found in results data.</p>';
      return;
    }

    const urlParams = getUrlParams();

    const filterContainer = createElement('div', { class: 'results-filter-container' });

    const eventOptions = events.map((event) => ({
      value: event.slug,
      text: event.name,
    }));
    const eventDropdown = createCustomDropdown('event-select', 'Event', 'Select Event', eventOptions);

    const yearDropdown = createCustomDropdown('year-select', 'Year', 'Select Year', []);

    const getResultsButton = createGetResultsButton();

    filterContainer.append(eventDropdown.container, yearDropdown.container, getResultsButton);

    block.innerHTML = '';
    block.append(filterContainer);

    let selectedEventSlug = '';
    let selectedYear = '';

    if (urlParams.eventSlug && urlParams.year) {
      const selectedEvent = events.find((event) => event.slug === urlParams.eventSlug);
      if (selectedEvent) {
        selectedEventSlug = urlParams.eventSlug;
        eventDropdown.summary.textContent = selectedEvent.name;
        eventDropdown.setSelectedValue(urlParams.eventSlug);

        updateYearDropdown(yearDropdown, selectedEvent.years);

        if (selectedEvent.years.includes(parseInt(urlParams.year, 10))) {
          selectedYear = urlParams.year;
          yearDropdown.summary.textContent = urlParams.year;
          setTimeout(() => {
            yearDropdown.setSelectedValue(urlParams.year);
          }, 0);
        }

        updateButtonState(getResultsButton, selectedEventSlug, selectedYear);
      }
    }

    eventDropdown.root.addEventListener('change', (e) => {
      const { value, text } = e.detail;
      selectedEventSlug = value;
      eventDropdown.summary.textContent = text;

      if (selectedEventSlug) {
        const selectedEvent = events.find((event) => event.slug === selectedEventSlug);
        if (selectedEvent) {
          updateYearDropdown(yearDropdown, selectedEvent.years);

          if (selectedEvent.years.length > 0) {
            const latestYear = selectedEvent.years[0].toString();
            selectedYear = latestYear;
            yearDropdown.summary.textContent = latestYear;
            yearDropdown.setSelectedValue(latestYear);
          } else {
            selectedYear = '';
            yearDropdown.summary.textContent = 'Select Year';
          }
        }
      } else {
        updateYearDropdown(yearDropdown, []);
        selectedYear = '';
        yearDropdown.summary.textContent = 'Select Year';
      }

      updateButtonState(getResultsButton, selectedEventSlug, selectedYear);
    });

    yearDropdown.root.addEventListener('change', (e) => {
      const { value, text } = e.detail;
      selectedYear = value;
      yearDropdown.summary.textContent = text;
      updateButtonState(getResultsButton, selectedEventSlug, selectedYear);
    });

    getResultsButton.addEventListener('click', () => {
      if (selectedEventSlug && selectedYear) {
        navigateToResults(selectedEventSlug, selectedYear);
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading results filter:', error);
    block.innerHTML = '<p>Error loading results filter. Please try again later.</p>';
  }
}
