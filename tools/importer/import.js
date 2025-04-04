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
    // const HOSTNAME = new URL(params.originalURL).origin;
    // define the main element: the one that will be transformed to Markdown
    const main = document.body.querySelector('#mainBody > div > section#page-content .contentSection');
    console.log(main);
    // attempt to remove non-content elements
    WebImporter.DOMUtils.remove(main, [
      'section.page-header',
      '.header',
      'nav',
      '.nav',
      'footer',
      '.footer',
      'iframe',
      'noscript',
    ]);

    const metadata = WebImporter.rules.createMetadata(main, document);
    console.log(metadata);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

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

    // multi output import

    // first, the main content
    ret.push({
      element: main,
      path,
      report: {
        title: document.title,
        description: metadata.description,
        keywords: metadata.keywords,
        type: metadata['og:type'],
        image: metadata['og:image'],
      },
    });

    main.querySelectorAll('img').forEach((img) => {
      console.log(img.outerHTML);
      const { src } = img;
      if (src) {
        const u = new URL(src);
        // then, all images
        ret.push({
          from: src,
          path: u.pathname,
        });
        // adjust the src to be relative to the current page
        img.src = `./${u.pathname.substring(u.pathname.lastIndexOf('/') + 1)}`;
      }
    });

    return ret;
  },
};
