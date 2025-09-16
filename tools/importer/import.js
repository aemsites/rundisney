/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

const handleCards = (main) => {
  // standard cards with icon and content
  const cardsSections = main.querySelectorAll('ul.tileList');

  [...cardsSections].forEach((cardSection) => {
    const cards = cardSection.querySelectorAll('li');
    
    if (cards.length > 0) {
      const cells = [];
      
      [...cards].forEach((card) => {
        const panelBody = card.querySelector('.panel-body');

        if (panelBody) {
          const icon = card.querySelector('.headerIcon');
          const img = card.querySelector('img');
          const link = card.querySelector('a');
          const leftCol = icon ? icon.outerHTML : (img ? img.outerHTML : '');

          if (link) {
            panelBody.innerHTML += link.outerHTML;
          }
          
          panelBody.querySelectorAll('.headerIcon, img').forEach(el => el.remove());
          cells.push([leftCol, panelBody.innerHTML]);
        }
      });
      
      const blockTable = WebImporter.Blocks.createBlock(document, {
        name: 'Cards',
        cells,
      });

      cardSection.replaceWith(blockTable);
    }
  });

  // storyCards
  const storyCardsSections = main.querySelectorAll('ul.storyCard');

  [...storyCardsSections].forEach((storyCardsSection) => {
    const cards = storyCardsSection.querySelectorAll('li');
    const cells = [];

    [...cards].forEach((card) => {
      let contentCol = '';
      let imageCol = '';

      const media = card.querySelector('.media');
      const link = card.querySelector('a');
      console.log(link);

      if (media) {
        const img = media.querySelector('img');
        const mediaBody = media.querySelector('.media-body');
        imageCol = img ? img.outerHTML : '';
        contentCol = mediaBody ? mediaBody.innerHTML : '';
      }

      if (link) {
        contentCol += link.outerHTML;
      }

      if (imageCol || contentCol) {
        cells.push([imageCol, contentCol]);
      }
    });

    if (cells.length > 0) {
      const blockTable = WebImporter.Blocks.createBlock(document, {
        name: 'Cards (Overlay)',
        cells,
      });

      storyCardsSection.replaceWith(blockTable);
    }
  });
};

const handleBlogPosts = (main, metadata) => {
  if (!main.querySelector('#blogDetail')) {
    return;
  }

  const blogFilter = main.querySelector('.filterBlog');

  if (blogFilter) {
    const blogFilterBlock = WebImporter.Blocks.createBlock(document, {
      name: 'Blog Filter',
      cells: [],
    });

    const featuredBlogsBlock = WebImporter.Blocks.createBlock(document, {
      name: 'Featured Blogs',
      cells: [],
    });

    blogFilter.before(document.createElement('hr'));
    blogFilter.replaceWith(featuredBlogsBlock);
    const hr = document.createElement('hr');
    featuredBlogsBlock.after(hr);
    hr.after(blogFilterBlock);
  }

  const heroImg = main.querySelector('.blogDetailCoverPhoto');
  if (heroImg) {
    heroImg.after(document.createElement('hr'));
  }

  const author = main.querySelector('.authorName').textContent.trim();
  const authorName = author.replace('by ', '');
  const date = main.querySelector('.authorDescription .date').textContent;
  const categories = [...main.querySelectorAll('.categories .media-body a')]
    .map((a) => a.textContent.trim().replace(/\s*,\s*$/, ''))
    .filter((cat) => cat.length > 0)
    .map((cat) => cat.toLowerCase().replace(/\s+/g, '-'));

  metadata.author = authorName;
  metadata.date = date;
  metadata.categories = categories;

  const metadataTable = main.querySelector(':scope > table');

  const metadataTableRows = [
    ['Author', `authors/${authorName}`],
    ['Date', date],
    ['Tags', categories.map((cat) => `categories/${cat}`).join(', ')],
    ['Template', 'blog-post']
  ];

  metadataTableRows.forEach((row) => {
    const rowEl = document.createElement('tr');
    const labelTd = document.createElement('td');
    labelTd.textContent = row[0];
    rowEl.appendChild(labelTd);
    const valueTd = document.createElement('td');
    valueTd.textContent = row[1];
    rowEl.appendChild(valueTd);

    metadataTable.appendChild(rowEl);
  });
};

const handleLinks = (main) => {
  const links = main.querySelectorAll('a');

  links.forEach((link) => {
    const originalHref = link.href;
    const newHref = originalHref
      .replace(/^https?:\/\/(www\.)?rundisney\.com(.*)/, 'https://main--rundisney--da-pilot.aem.page$2')
      .replace(/\/$/, '');
    link.href = newHref;

    if (link.textContent.trim() === originalHref) {
      link.textContent = newHref;
    }
  });
};

const handleIcons = (main) => {
  const icons = main.querySelectorAll('[class*="icon__"]');
  icons.forEach((icon) => {
    const iconClass = [...icon.classList].find((cls) => cls.startsWith('icon__'));
    const iconName = iconClass ? iconClass.replace('icon__', '') : '';
    icon.replaceWith(`:${iconName}:`);
  });
};

export const handleSections = (main) => {
  const sections = main.querySelectorAll('.contentGroupItem:not(:has(.cssOverride))');

  sections.forEach((section) => {
    if (section !== sections[sections.length - 1]) {

      const firstDiv = section.querySelector('div');
      // add more below later - there are many shades of slighly different gray colors being used as background colors and borders.
      if (firstDiv && firstDiv.classList.contains('featuredEventsContainer')) {
        const metadataTable = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: [['Style', 'Gray Background']],
        });
        section.after(metadataTable); metadataTable.after(document.createElement('hr'));
      } else {
        section.after(document.createElement('hr'));
      }
    }
  });
};

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */

  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.querySelector('#mainBody > div > section#page-content .contentSection')
      || document.querySelector('main')
      || document.body;
    // attempt to remove non-content elements
    WebImporter.DOMUtils.remove(main, [
      'iframe',
      'noscript',
    ]);

    const hasPreFooterSubscriptionBanner = document.querySelector('.contactInfo');

    const metadata = WebImporter.Blocks.getMetadata(document);
    metadata.Newsletter = hasPreFooterSubscriptionBanner ? 'true' : 'false';
    
    const metadataBlock = WebImporter.Blocks.getMetadataBlock(document, metadata);
    main.append(metadataBlock);
    
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

    handleBlogPosts(main, metadata);
    handleCards(main);

    WebImporter.DOMUtils.remove(main, [
      '.blogDetailStayConnected',
      '.blogDetailByline',
      '#blogDetail .asTileFeaturedList',
      '.categories',
      '.carouselContainer', //temporary
      [...(hasPreFooterSubscriptionBanner ? ['.contactInfo'] : [])],
    ]);

    handleIcons(main);
    handleSections(main);
    handleLinks(main);

    const ret = [];

    const path = ((u) => {
      let p = new URL(u).pathname;
      if (p.endsWith('/')) {
        p = `${p}index`;
      }
      return decodeURIComponent(p)
        .toLowerCase()
        .replace(/\.html$/, '')
        .replace(/[^a-z0-9/]/gm, '-');
    })(url);

    ret.push({
      element: main,
      path,
    });

    return ret;
  },
};
