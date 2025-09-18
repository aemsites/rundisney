import { createOptimizedPicture } from '../../scripts/aem.js';
import { createElement } from '../../utils/dom.js';

const PAGE_SIZE = 10;
const state = {
  allItems: [],
  filteredItems: [],
  renderedCount: 0,
  observer: null,
  totalCount: 0,
};

/**
 * Formats a tag string like "categories/walt-disney-world-resort" to a readable label.
 * @param {string} tag
 * @returns {string}
 */
function formatCategoryLabel(tag) {
  if (!tag) return '';
  const last = tag.split('/').pop();
  return last
    .replace(/-/g, ' ')
    .replace(/\s*&\s*/g, ' & ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Formats a unix epoch seconds date to "Month D, YYYY".
 * @param {number} epochSeconds
 * @returns {string}
 */
function formatDate(epochSeconds) {
  const date = new Date(epochSeconds * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Returns key like "YYYY-MM" for month grouping.
 * @param {number} epochSeconds
 * @returns {string}
 */
function getMonthKey(epochSeconds) {
  const d = new Date(epochSeconds * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Creates a custom multi-select dropdown wrapper with a trigger and menu.
 * The trigger contains a title (e.g., "Category") and a summary (e.g., "All Categories").
 * @param {string} titleText
 * @param {string} placeholder
 * @returns {{
 * root:HTMLElement,
 * trigger:HTMLElement,
 * menu:HTMLElement,
 * title:HTMLElement,
 * summary:HTMLElement
 * }}
 */
function createMultiSelect(titleText, placeholder) {
  const root = createElement('div', { class: 'multi-select' });
  const trigger = createElement('button', { type: 'button', class: 'multi-select-trigger', 'aria-label': titleText });
  const text = createElement('div', { class: 'multi-select-text' });
  const title = createElement('span', { class: 'multi-select-title' }, titleText);
  const summary = createElement('span', { class: 'multi-select-summary' }, placeholder);
  const caret = createElement('i', { class: 'multi-select-caret' });
  text.append(title, summary);
  trigger.append(text, caret);
  const menu = createElement('div', { class: 'multi-select-menu' });
  root.append(trigger, menu);
  // toggle open/close
  trigger.addEventListener('click', () => root.classList.toggle('open'));
  // close on outside click
  document.addEventListener('click', (e) => { if (!root.contains(e.target)) root.classList.remove('open'); });
  // close on escape key
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') root.classList.remove('open'); });
  return {
    root,
    trigger,
    menu,
    title,
    summary,
  };
}

/**
 * Builds a post card element.
 * @param {object} item
 * @returns {HTMLElement}
 */
function buildPostCard(item) {
  const {
    path,
    title,
    description,
    image,
    date,
  } = item;
  const article = createElement('article', { class: 'blog-home-card' });
  const link = createElement('a', { href: path, 'aria-label': title });

  if (image) {
    const picture = createOptimizedPicture(
      image,
      title,
      false,
      [
        {
          media: '(min-width: 900px)',
          width: '1200',
        },
        {
          media: '(min-width: 600px)',
          width: '900',
        },
        {
          width: '600',
        },
      ],
    );
    picture.classList.add('blog-home-card-image');
    link.append(picture);
  }

  const body = createElement('div', { class: 'blog-home-card-body' });
  const h3 = createElement('h3', { class: 'blog-home-card-title' }, title || '');
  const meta = createElement('p', { class: 'blog-home-card-date' }, date ? formatDate(date) : '');
  const desc = createElement('p', { class: 'blog-home-card-desc' }, description || '');
  body.append(h3, meta, desc);
  link.append(body);
  article.append(link);

  return article;
}

/**
 * Fetches the full blog index data.
 * @returns {Promise<Array<object>>}
 */
async function fetchBlogIndex() {
  const url = new URL('/blog-index.json', window.location.origin);
  // fetch plenty to cover all entries
  url.searchParams.set('limit', '100');
  url.searchParams.set('offset', '0');

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to load blog index');
  const json = await response.json();
  const { data = [] } = json;
  state.totalCount = json.total;
  // normalize entries
  const normalized = data
    .filter((row) => row && row.path && row.template === 'blog-post')
    .map((row) => ({
      path: row.path,
      title: row.title,
      description: row.description,
      image: row.image,
      tags: Array.isArray(row.tags) ? row.tags : [],
      date: typeof row.date === 'number' ? row.date : 0,
      author: row.author,
      robots: row.robots || '',
    }))
    .filter((row) => !String(row.robots).includes('noindex'));

  // sort desc by publish date
  normalized.sort((a, b) => (b.date || 0) - (a.date || 0));
  return normalized;
}

/**
 * Builds unique category list from tags.
 * @param {Array<object>} items
 * @returns {Array<{value: string, label: string}>}
 */
function buildCategoryOptions(items) {
  const set = new Set();
  items.forEach((it) => (it.tags || []).forEach((t) => { if (t && t.startsWith('categories/')) set.add(t); }));
  const values = Array.from(set);
  values.sort((a, b) => formatCategoryLabel(a).localeCompare(formatCategoryLabel(b)));
  return values.map((v) => ({
    value: v,
    label: formatCategoryLabel(v),
  }));
}

/**
 * Builds a map of years to available months (1-12) from items.
 * @param {Array<object>} items
 * @returns {Map<number, Set<number>>}
 */
function buildYearMonthMap(items) {
  const map = new Map();
  items.forEach((it) => {
    if (!it.date) return;
    const d = new Date(it.date * 1000);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1; // 1-12
    if (!map.has(year)) map.set(year, new Set());
    map.get(year).add(month);
  });
  return map;
}

/**
 * Populates the month select with optgroups by year, including "All YYYY" and month options.
 * Values use prefixes: "year:YYYY" and "month:YYYY-MM".
 * @param {HTMLSelectElement} selectEl
 * @param {Map<number, Set<number>>} yearMonthMap
 */
function populateMonthSelect(selectEl, yearMonthMap) {
  selectEl.innerHTML = '';
  const all = createElement('option', { value: 'all' }, 'All Months');
  selectEl.append(all);

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1; // 1-12

  const yearsFromData = Array.from(yearMonthMap.keys());
  const minYear = yearsFromData.length ? Math.min(...yearsFromData) : currentYear;

  for (let year = currentYear; year >= minYear; year -= 1) {
    const optgroup = createElement('optgroup', { label: String(year) });
    const allYear = createElement('option', { value: `year:${year}` }, String(year));
    optgroup.append(allYear);

    const lastMonth = year === currentYear ? currentMonth : 12;
    for (let monthNum = 1; monthNum <= lastMonth; monthNum += 1) {
      const mm = String(monthNum).padStart(2, '0');
      const monthDate = new Date(Date.UTC(year, monthNum, 1));
      const option = createElement('option', { value: `month:${year}-${mm}` }, monthDate.toLocaleDateString('en-US', { month: 'long' }));
      optgroup.append(option);
    }

    selectEl.append(optgroup);
  }
}

/**
 * Returns an array of selected option values, excluding 'all'.
 * @param {HTMLSelectElement} selectEl
 * @returns {string[]}
 */
function getSelectedValues(selectEl) {
  const values = Array.from(selectEl.selectedOptions).map((o) => o.value);
  return values.filter((v) => v !== 'all');
}

/**
 * Applies current filters to items (OR within a group, AND across groups).
 * @param {Array<object>} items
 * @param {string[]} selectedCategories
 * @param {string[]} selectedMonths
 * @returns {Array<object>}
 */
function applyFilters(items, selectedCategories, selectedMonths) {
  let result = items;

  if (selectedCategories && selectedCategories.length > 0) {
    const catSet = new Set(selectedCategories);
    result = result.filter((it) => Array.isArray(it.tags) && it.tags.some((t) => catSet.has(t)));
  }

  if (selectedMonths && selectedMonths.length > 0) {
    const monthSet = new Set(selectedMonths);
    result = result.filter((it) => {
      const d = new Date(it.date * 1000);
      const y = d.getUTCFullYear();
      const ym = getMonthKey(it.date);
      return monthSet.has(`year:${y}`) || monthSet.has(`month:${ym}`);
    });
  }

  return result;
}

/**
 * Renders the select element with options.
 * @param {HTMLSelectElement} selectEl
 * @param {Array<{value: string, label: string}>} options
 * @param {string} allLabel
 */
function populateSelect(selectEl, options, allLabel) {
  selectEl.innerHTML = '';
  const all = createElement('option', { value: 'all' }, allLabel);
  selectEl.append(all);
  options.forEach((opt) => {
    const o = createElement('option', { value: opt.value }, opt.label);
    selectEl.append(o);
  });
}

/**
 * Creates a checkbox option element.
 * @param {string} value
 * @param {string} label
 * @param {(checked: boolean, value: string) => void} onChange
 * @returns {HTMLElement}
 */
function createCheckboxItem(value, label, onChange) {
  const item = createElement('label', { class: 'multi-select-item' });
  const input = createElement('input', { type: 'checkbox', value });
  const span = createElement('span', {}, label);
  item.append(input, span);
  input.addEventListener('change', () => onChange(input.checked, value));
  return item;
}

/**
 * Builds checkbox groups for months by year.
 * @param {HTMLElement} menu
 * @param {Map<number, Set<number>>} yearMonthMap
 * @param {(checked: boolean, value: string) => void} onChange
 */
function buildMonthCheckboxes(menu, yearMonthMap, onChange) {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const years = Array.from(yearMonthMap.keys()).sort((a, b) => b - a);

  years.forEach((year) => {
    const group = createElement('div', { class: 'multi-select-group' });

    const header = createElement('div', { class: 'multi-select-group-header' });
    const yearCheckbox = createElement('input', { type: 'checkbox', value: `year:${year}` });
    const yearLabel = createElement('span', {}, String(year));
    header.append(yearCheckbox, yearLabel);

    const items = createElement('div', { class: 'multi-select-group-items' });

    const lastMonth = year === currentYear ? currentMonth : 12;
    for (let m = 1; m <= lastMonth; m += 1) {
      const mm = String(m).padStart(2, '0');
      const monthDate = new Date(Date.UTC(year, m, 1));
      const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long' });
      const item = createCheckboxItem(`month:${year}-${mm}`, monthLabel, onChange);
      items.append(item);
    }

    // Toggle all for year
    yearCheckbox.addEventListener('change', () => {
      items.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.checked = yearCheckbox.checked;
        onChange(cb.checked, cb.value);
      });
      onChange(yearCheckbox.checked, yearCheckbox.value);
    });

    group.append(header, items);
    menu.append(group);
  });
}

export default async function decorate(block) {
  // structure
  block.classList.add('blog-home');
  const filters = createElement('div', { class: 'blog-home-filters' });

  const categoryWrap = createElement('label', { class: 'blog-home-filter' }, '');
  const categorySelect = createElement('select', { class: 'blog-home-select', multiple: true });
  categoryWrap.append(categorySelect);

  const monthWrap = createElement('label', { class: 'blog-home-filter' }, '');
  const monthSelect = createElement('select', { class: 'blog-home-select', multiple: true });
  monthWrap.append(monthSelect);

  // Custom dropdowns with checkboxes (labels inside trigger)
  const catMulti = createMultiSelect('Category', 'All Categories');
  const monthMulti = createMultiSelect('Month', 'All Months');
  categoryWrap.append(catMulti.root);
  monthWrap.append(monthMulti.root);

  filters.append(categoryWrap, monthWrap);

  const totalResults = createElement('div', { class: 'blog-home-total-results' }, `${state.filteredItems.length} results`);
  const results = createElement('div', { class: 'blog-home-results' });
  const noResults = createElement('p', { class: 'blog-home-no-results' }, 'No articles found.');
  noResults.style.display = 'none';
  const sentinel = createElement('div', { class: 'blog-home-sentinel' });

  block.innerHTML = '';
  block.append(filters, totalResults, results, noResults, sentinel);

  // helpers
  const clearResults = () => {
    results.innerHTML = '';
    state.renderedCount = 0;
  };

  const renderNextPage = () => {
    const start = state.renderedCount;
    const end = Math.min(start + PAGE_SIZE, state.filteredItems.length);
    if (start >= end) return;
    const fragment = document.createDocumentFragment();
    for (let i = start; i < end; i += 1) fragment.append(buildPostCard(state.filteredItems[i]));
    results.append(fragment);
    state.renderedCount = end;
  };

  const updateNoResultsVisibility = () => { noResults.style.display = state.filteredItems.length === 0 ? '' : 'none'; };

  const reapplyFilters = () => {
    const selectedCategories = getSelectedValues(categorySelect);
    const selectedMonths = getSelectedValues(monthSelect);
    state.filteredItems = applyFilters(state.allItems, selectedCategories, selectedMonths);
    totalResults.textContent = `${state.filteredItems.length} results`;
    clearResults();
    updateNoResultsVisibility();
    renderNextPage();
  };

  const setupInfiniteScroll = () => {
    if (state.observer) state.observer.disconnect();
    state.observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting) return;
      renderNextPage();
      if (state.renderedCount >= state.filteredItems.length) state.observer.disconnect();
    }, { rootMargin: '250px 0px' });
    state.observer.observe(sentinel);
  };

  // load data
  try {
    state.allItems = await fetchBlogIndex();
    totalResults.textContent = `${state.totalCount} results`;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    noResults.textContent = 'Failed to load blog posts.';
    noResults.style.display = '';
    return;
  }

  // initialize filters (native selects for state; custom menus for UI)
  populateSelect(categorySelect, buildCategoryOptions(state.allItems), 'All Categories');
  populateMonthSelect(monthSelect, buildYearMonthMap(state.allItems));

  // Build category checkbox menu
  const categoryOptions = Array.from(categorySelect.options).map(
    (o) => ({ value: o.value, label: o.textContent }),
  );
  categoryOptions.forEach((opt) => {
    if (opt.value === 'all') return;
    const item = createCheckboxItem(opt.value, opt.label, (checked, value) => {
      const optionEl = Array.from(categorySelect.options).find((o) => o.value === value);
      if (optionEl) optionEl.selected = checked;
      const selected = getSelectedValues(categorySelect);
      catMulti.summary.textContent = selected.length ? `${selected.length} selected` : 'All Categories';
      reapplyFilters();
    });
    catMulti.menu.append(item);
  });
  if (!catMulti.menu.children.length) catMulti.menu.append(createElement('div', { class: 'multi-select-empty' }, 'No categories available'));

  // Build month checkbox menu (grouped by year)
  buildMonthCheckboxes(monthMulti.menu, buildYearMonthMap(state.allItems), (checked, value) => {
    const optionEl = Array.from(monthSelect.options).find((o) => o.value === value);
    if (optionEl) optionEl.selected = checked;
    const selected = getSelectedValues(monthSelect);
    monthMulti.summary.textContent = selected.length ? `${selected.length} selected` : 'All Months';
    reapplyFilters();
  });

  // native change hooks (if any manual changes occur)
  categorySelect.addEventListener('change', () => {
    const selected = getSelectedValues(categorySelect);
    catMulti.summary.textContent = selected.length ? `${selected.length} selected` : 'All Categories';
    reapplyFilters();
    setupInfiniteScroll();
  });
  monthSelect.addEventListener('change', () => {
    const selected = getSelectedValues(monthSelect);
    monthMulti.summary.textContent = selected.length ? `${selected.length} selected` : 'All Months';
    reapplyFilters();
    setupInfiniteScroll();
  });

  // initial render
  state.filteredItems = state.allItems.slice();
  renderNextPage();
  setupInfiniteScroll();
}
