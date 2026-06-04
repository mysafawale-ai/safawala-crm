import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export async function htmlToPdfBuffer(htmlContent: string): Promise<Buffer> {
  // Use Sparticuz Chromium for Vercel/serverless compatibility
  const executablePath = await chromium.executablePath();
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: executablePath || undefined,
    headless: chromium.headless === true ? true : (chromium.headless === 'new' ? 'new' : true),
  });
  
  const page = await browser.newPage();
  
  // Set content and wait for network to be idle
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Emulate print media type to ensure print styles are applied
  await page.emulateMediaType('print');
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });
  
  await browser.close();
  
  return Buffer.from(pdfBuffer);
}
