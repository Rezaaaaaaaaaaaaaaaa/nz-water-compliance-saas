/**
 * Regulation Document Download Script
 *
 * Downloads and organizes NZ water compliance regulation documents
 * from official government sources.
 *
 * Usage: node scripts/download-regulations.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

// Configuration
const BASE_DOCS_PATH = path.join(__dirname, '..', 'docs');
const RATE_LIMIT_MS = 2000; // 2 seconds between requests to be respectful

// Sources to monitor
const SOURCES = [
  {
    name: 'Taumata Arowai',
    url: 'https://www.taumataarowai.govt.nz',
    folder: 'regulations/taumata-arowai',
    pages: [
      '/legislation-and-regulatory-requirements/',
      '/drinking-water/',
      '/compliance-monitoring-and-enforcement/'
    ]
  },
  {
    name: 'Department of Internal Affairs',
    url: 'https://www.dia.govt.nz',
    folder: 'regulations/local-water-done-well',
    pages: [
      '/local-water-done-well'
    ]
  },
  {
    name: 'Ministry of Health',
    url: 'https://www.health.govt.nz',
    folder: 'regulations/drinking-water-standards',
    pages: [
      '/our-work/environmental-health/drinking-water'
    ]
  }
];

// Utility: Sleep function for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Sanitize filename
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .substring(0, 100);
}

// Utility: Generate metadata
function generateMetadata(doc) {
  return {
    title: doc.title,
    source: doc.source,
    sourceUrl: doc.url,
    downloadDate: new Date().toISOString().split('T')[0],
    version: doc.version || 'Unknown',
    effectiveDate: doc.effectiveDate || null,
    summary: doc.summary || '',
    fileType: doc.fileType || 'pdf',
    relevantSections: doc.relevantSections || [],
    relatedDocuments: []
  };
}

// Download a file from URL
async function downloadFile(url, destinationPath) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    await pipeline(response.data, createWriteStream(destinationPath));
    console.log(`✓ Downloaded: ${path.basename(destinationPath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to download ${url}: ${error.message}`);
    return false;
  }
}

// Scrape page for document links
async function scrapePageForDocuments(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const documents = [];

    // Find all PDF links
    $('a[href$=".pdf"], a[href*=".pdf?"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();

      if (href && text) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        documents.push({
          title: text,
          url: fullUrl,
          fileType: 'pdf'
        });
      }
    });

    // Find all Word document links
    $('a[href$=".docx"], a[href$=".doc"], a[href*=".docx?"], a[href*=".doc?"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();

      if (href && text) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        const fileType = href.includes('.docx') ? 'docx' : 'doc';
        documents.push({
          title: text,
          url: fullUrl,
          fileType: fileType
        });
      }
    });

    console.log(`Found ${documents.length} documents on ${url}`);
    return documents;
  } catch (error) {
    console.error(`Error scraping ${url}: ${error.message}`);
    return [];
  }
}

// Process a source
async function processSource(source) {
  console.log(`\n=== Processing ${source.name} ===`);

  const folderPath = path.join(BASE_DOCS_PATH, source.folder);
  await fs.mkdir(folderPath, { recursive: true });

  const allDocuments = [];

  for (const page of source.pages) {
    const fullUrl = source.url + page;
    console.log(`Checking page: ${fullUrl}`);

    const documents = await scrapePageForDocuments(fullUrl);
    documents.forEach(doc => {
      doc.source = source.name;
    });

    allDocuments.push(...documents);
    await sleep(RATE_LIMIT_MS);
  }

  // Download documents
  for (const doc of allDocuments) {
    const date = new Date().toISOString().split('T')[0];
    const sanitizedTitle = sanitizeFilename(doc.title);
    const filename = `${date}-${sanitizedTitle}.${doc.fileType}`;
    const filePath = path.join(folderPath, filename);

    // Check if already downloaded
    try {
      await fs.access(filePath);
      console.log(`↷ Skipping (already exists): ${filename}`);
      continue;
    } catch {
      // File doesn't exist, proceed with download
    }

    const success = await downloadFile(doc.url, filePath);

    if (success) {
      // Save metadata
      const metadataPath = path.join(folderPath, `${filename}.metadata.json`);
      const metadata = generateMetadata(doc);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`Completed ${source.name}: ${allDocuments.length} documents processed`);
}

// Generate summary report
async function generateReport() {
  console.log('\n=== Generating Summary Report ===');

  const report = {
    generatedAt: new Date().toISOString(),
    sources: [],
    totalDocuments: 0
  };

  for (const source of SOURCES) {
    const folderPath = path.join(BASE_DOCS_PATH, source.folder);

    try {
      const files = await fs.readdir(folderPath);
      const documents = files.filter(f => f.endsWith('.pdf') || f.endsWith('.docx') || f.endsWith('.doc'));

      report.sources.push({
        name: source.name,
        documentCount: documents.length,
        documents: documents
      });

      report.totalDocuments += documents.length;
    } catch (error) {
      console.error(`Error reading ${source.name} folder: ${error.message}`);
    }
  }

  const reportPath = path.join(BASE_DOCS_PATH, 'download-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(`\nTotal documents downloaded: ${report.totalDocuments}`);
  console.log(`Report saved to: ${reportPath}`);

  return report;
}

// Update index.md with download information
async function updateIndex(report) {
  const indexPath = path.join(BASE_DOCS_PATH, 'index.md');

  let content = `# Regulatory Documents Index\n\nLast Updated: ${report.generatedAt.split('T')[0]}\n\n`;
  content += `## Document Inventory\n\n`;

  for (const source of report.sources) {
    content += `### ${source.name}\n`;
    content += `Total Documents: ${source.documentCount}\n\n`;

    if (source.documents.length > 0) {
      content += `| Document | Download Date | Status |\n`;
      content += `|----------|---------------|--------|\n`;

      for (const doc of source.documents.slice(0, 20)) { // Limit to 20 per source
        const downloadDate = doc.split('-')[0];
        content += `| ${doc} | ${downloadDate} | Downloaded |\n`;
      }

      if (source.documents.length > 20) {
        content += `| ... and ${source.documents.length - 20} more documents | | |\n`;
      }

      content += `\n`;
    }
  }

  content += `## Total Documents: ${report.totalDocuments}\n\n`;
  content += `## Next Actions\n\n`;
  content += `1. Review downloaded documents\n`;
  content += `2. Manually add documents requiring authentication\n`;
  content += `3. Extract compliance requirements\n`;
  content += `4. Map requirements to software features\n`;

  await fs.writeFile(indexPath, content);
  console.log(`Index updated: ${indexPath}`);
}

// Main execution
async function main() {
  console.log('NZ Water Compliance - Regulation Document Downloader');
  console.log('====================================================\n');

  console.log('⚠ IMPORTANT NOTES:');
  console.log('- Some documents may require manual download (authentication, paywalls)');
  console.log('- This script respects rate limits (2s between requests)');
  console.log('- Documents are saved with date prefix for version tracking');
  console.log('- Check download-report.json for summary\n');

  try {
    // Process each source
    for (const source of SOURCES) {
      await processSource(source);
    }

    // Generate report
    const report = await generateReport();
    await updateIndex(report);

    console.log('\n✓ Download process completed successfully!');
    console.log('\nManual Actions Required:');
    console.log('1. Review docs/download-report.json');
    console.log('2. Check for documents requiring authentication');
    console.log('3. Verify critical documents from checklist are present');
    console.log('4. Read through key regulatory documents');

  } catch (error) {
    console.error('\n✗ Error during download process:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { downloadFile, scrapePageForDocuments, generateMetadata };
