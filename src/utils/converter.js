import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import markdownpdf from 'markdown-pdf';
import htmlPdf from 'html-pdf-node';
import puppeteer from 'puppeteer';

// Convert callback-based functions to Promise-based
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const mdToPdf = promisify(markdownpdf);

/**
 * Ensures the storage directory exists
 * @param {string} dir - Directory path
 */
async function ensureDirectory(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Convert plain text to PDF
 * @param {string} text - Plain text content
 * @param {string} outputPath - Output file path
 */
async function textToPdf(text, outputPath) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fax Document</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12pt;
          line-height: 1.5;
          white-space: pre-wrap;
          margin: 0.5in;
        }
      </style>
    </head>
    <body>${text}</body>
    </html>
  `);
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: false,
    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
  });
  
  await browser.close();
  return outputPath;
}

/**
 * Convert Markdown to PDF
 * @param {string} markdown - Markdown content
 * @param {string} outputPath - Output file path
 */
async function markdownToPdf(markdown, outputPath) {
  await mdToPdf()
    .from.string(markdown)
    .to(outputPath);
  
  return outputPath;
}

/**
 * Convert HTML to PDF
 * @param {string} html - HTML content
 * @param {string} outputPath - Output file path
 */
async function htmlToPdf(html, outputPath) {
  const options = { format: 'A4' };
  const file = { content: html };
  
  const buffer = await htmlPdf.generatePdf(file, options);
  await writeFile(outputPath, buffer);
  
  return outputPath;
}

/**
 * Convert content to a faxable format (PDF)
 * @param {Object} content - Content object with type and data
 * @param {string} jobId - Job ID for file naming
 * @param {string} storageDir - Directory to store converted files
 * @returns {Promise<string>} - Path to the converted file
 */
export async function convertToFaxableFormat(content, jobId, storageDir) {
  // Ensure the storage directory exists
  await ensureDirectory(storageDir);
  
  const outputPath = path.join(storageDir, `${jobId}.pdf`);
  
  switch (content.type) {
    case 'text':
      return textToPdf(content.data, outputPath);
      
    case 'markdown':
      return markdownToPdf(content.data, outputPath);
      
    case 'html':
      return htmlToPdf(content.data, outputPath);
      
    default:
      throw new Error(`Unsupported content type: ${content.type}`);
  }
}
