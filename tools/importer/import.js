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

const handleSectionMetadata = (main) => {
  const sectionMetadata = main.querySelectorAll('.featuredEventsContainer');
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

  WebImporter.DOMUtils.remove(main, [
    '.blogDetailStayConnected',
    '.blogDetailByline',
    '#blogDetail .asTileFeaturedList',
    '.categories',
  ]);
};

const handleLinks = (main) => {
  const links = main.querySelectorAll('a');

  links.forEach((link) => {
    link.href = link.href
      .replace(/^https?:\/\/(www\.)?rundisney\.com(.*)/, 'https://main--rundisney--da-pilot.aem.page$2')
      .replace(/\/$/, '');
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

    const metadata = WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

    handleBlogPosts(main, metadata);
    handleLinks(main);
    handleSectionMetadata(main);

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
