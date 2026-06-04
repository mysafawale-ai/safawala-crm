import puppeteer from 'puppeteer';

export async function htmlToPdfBuffer(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
