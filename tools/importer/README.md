# runDisney Import Tools

This directory contains tools for importing content from the runDisney website.

## General Flow
rundisney.com does not get consumed by the AEM Importer as it's a SPA and they also probably have WAF/CSP blocking things. We use puppeteer with a local proxy server to pre-render pages that the importer can easily consume.

### Process Crawl Report

Automatically processes crawl report Excel files and generates bulk import URL lists.

**Usage:**
```bash
npm run process-crawl-report [input-file] [output-file]
```

**Arguments:**
- `input-file` - Path to crawl_report.xlsx file (default: `crawl_report.xlsx`)
- `output-file` - Path to output file (default: `bulk_import_urls.txt`)

**Examples:**
```bash
# Use default files (crawl_report.xlsx -> bulk_import_urls.txt)
npm run process-crawl-report

# Specify custom input file  
npm run process-crawl-report my-crawl-report.xlsx

# Specify both input and output files
npm run process-crawl-report crawl_report.xlsx output-urls.txt
```

### Proxy Server

Local proxy server that pre-renders runDisney pages and scrolls down to the bottom to make sure all lazy loaded assets are included.

The importer UI can then easily consume paths on the proxy server.

**Usage:**
```bash
npm run import-proxy-server
```

## Workflow
1. **Crawl the site** and download `crawl_report.xlsx` to `tools/importer/`
2. **Navigate to importer directory:**
   ```bash
   cd tools/importer
   npm install
   ```
3. **Process crawl report:**
   ```bash
   npm run process-crawl-report
   ```
4. **Start proxy server:**
   ```bash
   npm run import-proxy-server
   ```
5. **Use bulk import** with the generated `bulk_import_urls.txt`
