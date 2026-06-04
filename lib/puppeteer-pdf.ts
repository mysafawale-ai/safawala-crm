import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export async function htmlToPdfBuffer(htmlContent: string): Promise<Buffer> {
  const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;

  let executablePath;
  if (isLocal) {
    // Local Mac Chrome path for dev
    executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else {
    // Vercel serverless environment (x64)
    // Download and extract the chromium binary at runtime to bypass 50MB function limits
    executablePath = await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar'
    );
  }

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
