import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

async function testRunDisneyImport() {
  const url = 'https://www.rundisney.com/blog/2026-princess-half-theme-reveal/';
  
  console.log('🚀 Starting browser-based import...');
  console.log(`📄 URL: ${url}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set realistic browser headers
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('🌐 Navigating to page...');
    
    // Navigate and wait for network activity to settle
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('⏳ Waiting for content to load...');
    
    // Wait for any of these content indicators
    await Promise.race([
      page.waitForSelector('main', { timeout: 10000 }).catch(() => null),
      page.waitForSelector('#mainBody', { timeout: 10000 }).catch(() => null),
      page.waitForSelector('.content', { timeout: 10000 }).catch(() => null),
      page.waitForSelector('article', { timeout: 10000 }).catch(() => null),
    ]);

    // Give it a bit more time for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    const html = await page.content();
    const title = await page.title();
    
    console.log('✅ Content fetched!');
    console.log(`📋 Title: ${title}`);
    console.log(`📏 HTML length: ${html.length} characters`);
    
    // Save for inspection
    const filename = `rundisney-content-${Date.now()}.html`;
    writeFileSync(filename, html);
    console.log(`💾 Saved to: ${filename}`);
    
    // Quick content check
    if (html.includes('Skip to main content') && html.length < 10000) {
      console.log('⚠️  Warning: Might still be skeleton content');
    } else {
      console.log('🎉 Success: Got rich content!');
    }
    
    return { html, title, url: page.url() };
    
  } finally {
    await browser.close();
  }
}

// Run the test
testRunDisneyImport()
  .then(result => {
    console.log('\n🏁 Import completed successfully');
  })
  .catch(error => {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
  }); 