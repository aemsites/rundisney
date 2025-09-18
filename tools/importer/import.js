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

const handleStoryCards = (main) => {
  // standard cards - with icons or image
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

          const isClickableCardsBlock = link && link.textContent === link.href;

          if (link && isClickableCardsBlock) {
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

  /**
   * pretty much everything on this site is a story card, check for the wrapper class name
   * to determine if it should map to columns, cards or whatever else
   */

  if (storyCardsSections.length > 0) {
    [...storyCardsSections].forEach((storyCardsSection) => {
      const wrapper = storyCardsSection.closest('.storyCardWrapper');
      const cardBlockClasses = ['square-card', 'normal-card', 'two-column-card'];
      const isCardsBlock = wrapper && cardBlockClasses.some(cls => wrapper.classList.contains(cls));
      const isColumnsBlock = wrapper && (wrapper.classList.contains('stamp-cards') || wrapper.querySelector('.media.full-width.single') || storyCardsSection.querySelector('.event-card.single'));
      const isIconListBlock = wrapper && (wrapper.classList.contains('storyCardBadge'));
      const isCalloutBlock = storyCardsSection.querySelector('.storyCardIcon') && !wrapper.classList.contains('storyCardBadge')

      const checklist = storyCardsSection.querySelectorAll('.check-list');

      if (checklist.length > 0) {
        checklist.forEach((checklist) => {
          checklist.querySelectorAll('.pepicon').forEach((icon) => {
            icon.remove();
          });
        });
      }

      if (isCardsBlock) {
        const cards = storyCardsSection.querySelectorAll(':scope > li');
        const cells = [];

        [...cards].forEach((card) => {
          let contentCol = '';
          let imageCol = '';

          const media = card.querySelector('.media');
          const link = card.querySelector('a');

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

        let blockName = 'Cards';
        const isClickableCardsBlock = storyCardsSection.querySelector('a') && storyCardsSection.querySelector('a').textContent === storyCardsSection.querySelector('a').href;

        if (isClickableCardsBlock) {
          blockName = 'Cards (Clickable)';
        }

        if (cells.length > 0) {
          const blockTable = WebImporter.Blocks.createBlock(document, {
            name: blockName,
            cells,
          });

          storyCardsSection.replaceWith(blockTable);
        }
      } else if (isColumnsBlock) {
        const hasIcon = storyCardsSection.querySelector('.pepicon');
        const blockName = hasIcon ? 'Columns (Icon Separator)' : 'Columns';

        const cards = storyCardsSection.querySelectorAll(':scope > li');
        const cells = [];

        [...cards].forEach((card) => {
          let leftCol = '';
          let rightCol = '';

          const media = card.querySelector('.media');
          if (media) {
            const mediaLeft = media.querySelector('.media-left');
            const mediaBody = media.querySelector('.media-body');
            leftCol = mediaLeft ? mediaLeft.outerHTML : '';
            rightCol = mediaBody ? mediaBody.outerHTML : '';
          } else {
            rightCol = card.innerHTML;
          }

          if (leftCol || rightCol) {
            cells.push([leftCol, rightCol]);
          }
        });

        if (cells.length > 0) {
          storyCardsSection.replaceWith(WebImporter.Blocks.createBlock(document, {
            name: blockName,
            cells,
          }));
        }
      } else if (isCalloutBlock) {
        const rows = storyCardsSection.querySelectorAll('li');
        const cells = [];
        [...rows].forEach((row) => {
          const rightMedia = row.querySelector('.media-right');

          if (rightMedia) {
            rightMedia.remove();
          }
          cells.push([row.innerHTML]);
        });
        storyCardsSection.replaceWith(WebImporter.Blocks.createBlock(document, {
          name: 'Callout',
          cells,
        }));
      } else if (isIconListBlock) {
        const rows = storyCardsSection.querySelectorAll(':scope > li');
        const cells = [];
        [...rows].forEach((row) => {
          const mediaLeft = row.querySelector('.media-left');
          const mediaBody = row.querySelector('.media-body');
          const leftCol = mediaLeft ? mediaLeft.outerHTML : '';
          const rightCol = mediaBody ? mediaBody.outerHTML : '';
          if (leftCol.trim() !== '' || rightCol.trim() !== '') {
            cells.push([leftCol, rightCol]);
          }
        });

        storyCardsSection.replaceWith(WebImporter.Blocks.createBlock(document, {
          name: 'Icon List',
          cells,
        }));
      }
    });
  }
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
    ['Author', authorName],
    ['Date', date],
    ['Tags', categories.map((cat) => `${cat}`).join(', ')],
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
    let newHref = originalHref;
    
    newHref = newHref.replace(/^https?:\/\/(www\.)?rundisney\.com(.*)/, 'https://main--rundisney--da-pilot.aem.page$2');
    
    if (originalHref.startsWith('http://localhost:3001/')) {
      newHref = originalHref.replace('http://localhost:3001/', 'https://main--rundisney--da-pilot.aem.page/');
    } else if (originalHref.startsWith('/')) {
      newHref = `https://main--rundisney--da-pilot.aem.page${originalHref}`;
    }

    if (newHref.includes('?host=http%3A%2F%2Flocalhost%3A4001')) {
      newHref = newHref.replace('?host=http%3A%2F%2Flocalhost%3A4001', '');
    }

    // handle sampe page links
    if (link.classList.contains('same.page.link')) {
      newHref = newHref.replace(newHref, '#');
    }

    newHref = newHref.replace(/\/$/, '');
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
  const sections = main.querySelectorAll('.contentGroupItem:not(:has(.cssOverride)):not(:has(.heroImage))');

  sections.forEach((section) => {
    if (section !== sections[sections.length - 1]) {

      // handle sections that have no content at all - there are many of these on many pages.
      if (section.innerHTML.trim() === '') {
        section.remove();
      }

      const firstDiv = section.querySelector('div');
      // add more below later - there are many shades of slighly different gray colors being used as background colors and borders.
      const grayBackgroundSections = ['featuredEventsContainer'];
      const isGrayBackgroundSection = firstDiv && grayBackgroundSections.some((cls) => firstDiv.classList.contains(cls));
      const isIconFramedSection = firstDiv && firstDiv.classList.contains('storyCardBadge');
      const isPrimaryIntro = section.classList.contains('primaryContentIntro');

      if (isGrayBackgroundSection) {
        const metadataTable = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: [['Style', 'Gray Background']],
        });
        section.after(metadataTable);
        metadataTable.after(document.createElement('hr'));
      } else if (isIconFramedSection) {
        const icon = firstDiv.querySelector('.iconBorder');
        const iconName = icon.textContent.trim().replace(/^:|:$/g, '');
        icon.remove();

        const metadataTable = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: [
            ['Style', 'Icon Frame'],
            ['icon', iconName],
          ],
        });
        section.after(metadataTable);
        metadataTable.after(document.createElement('hr'));
      } else if (isPrimaryIntro) {
        const metadataTable = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: [['Style', 'Primary Intro']],
        });
        section.after(metadataTable);
        metadataTable.after(document.createElement('hr'));
      } else {
        section.after(document.createElement('hr'));
      }
    }

    const hiddenStuff = section.querySelectorAll('.hidden, [aria-hidden="true"]');

    hiddenStuff.forEach((hidden) => {
      hidden.remove();
    });
  });
};

const handleHeroes = (main) => {
  let heroImage = main.querySelector('.heroImage');
  let h1 = main.querySelector('h1');
  let heroTitle = main.querySelector('.heroImageTitle');

  if (heroImage && heroTitle && h1) {
    if (heroTitle.tagName !== 'H1') {
      const newH1 = document.createElement('h1');
      newH1.className = heroTitle.className;
      newH1.innerHTML = heroTitle.innerHTML;
      heroTitle.replaceWith(newH1);
      const newH2 = document.createElement('h2');
      newH2.className = h1.className;
      newH2.innerHTML = h1.innerHTML;
      h1.replaceWith(newH2);

      heroImage.after(newH1);
      newH1.after(document.createElement('hr'));
    }

  } else if (heroImage && h1) {
    h1.after(document.createElement('hr'));
  }
  else if (!h1) {
    const h2 = main.querySelector('h2');
    if (h2) {
      const newH1 = document.createElement('h1');
      newH1.className = h2.className;
      newH1.innerHTML = h2.innerHTML;
      h2.replaceWith(newH1);
      newH1.after(document.createElement('hr'));
    }
  }
};

/** for some pages where headings are styled not as a heading element */
const handleNonHeadingTitles = (main) => {
  const titles = main.querySelectorAll('.title');
  titles.forEach((title) => {
    const h3 = document.createElement('h3');
    h3.innerHTML = title.innerHTML;
    title.replaceWith(h3);
  });
};

const handleButtons = (main) => {
  const buttons = main.querySelectorAll('.btn');
  buttons.forEach((button) => {
    if (button.classList.contains('btn-outline-primary')) {
      const em = document.createElement('em');
      const link = document.createElement('a');
      link.href = button.href;
      link.innerHTML = button.innerHTML;
      em.appendChild(link);
      button.replaceWith(em);
    } else {
      const link = document.createElement('a');
      link.href = button.href;
      link.innerHTML = button.innerHTML;
      const strong = document.createElement('strong');
      strong.appendChild(link);
      button.replaceWith(strong);
    }
  });
};

const handleAccordions = (main) => {
  const accordions = main.querySelectorAll('.panel-group .panel-body .panel-group');

  accordions.forEach((accordion) => {
    const panels = accordion.querySelectorAll('.panel');
    const cells = [];

    panels.forEach((panel) => {
      const heading = panel.querySelector('.panel-heading');
      heading.querySelectorAll('.pepicon').forEach(icon => icon.remove());
      const body = panel.querySelector('.panel-body');

      if (heading && body) {
        cells.push([heading.innerHTML, body.innerHTML]);
      }
    });

    if (cells.length > 0) {
      const accordionBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Accordion',
        cells,
      });
      accordion.replaceWith(accordionBlock);
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

    const hasPreFooterSubscriptionBanner = main.querySelector('.contactInfo');

    const metadata = WebImporter.Blocks.getMetadata(document);
    metadata['Footer Contact'] = hasPreFooterSubscriptionBanner ? 'true' : 'false';

    const metadataBlock = WebImporter.Blocks.getMetadataBlock(document, metadata);
    main.append(metadataBlock);

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

    handleBlogPosts(main, metadata);
    handleStoryCards(main);
    handleHeroes(main);
    handleAccordions(main);

    WebImporter.DOMUtils.remove(main, [
      '.blogDetailStayConnected',
      '.blogDetailByline',
      '#blogDetail .asTileFeaturedList',
      '.categories',
      '.carouselContainer', //temporary
      '.expanded-drawer.collapse',
      '.contactInfo',
    ]);

    handleIcons(main);
    handleSections(main);
    handleNonHeadingTitles(main);
    handleButtons(main);
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
