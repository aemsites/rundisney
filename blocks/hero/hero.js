import { buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';

export default async function decorate(block) {
  if (block.closest('.section').classList.contains('results-filter')) {
    const resultsFilterBlock = buildBlock('results-filter', []);
    const h1 = block.querySelector('h1');
    if (h1) {
      h1.parentNode.insertBefore(resultsFilterBlock, h1);
    } else {
      block.prepend(resultsFilterBlock);
    }
    decorateBlock(resultsFilterBlock);
    await loadBlock(resultsFilterBlock);
  }
}
