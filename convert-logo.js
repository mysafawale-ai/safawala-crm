const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function convertSvgToPng() {
  try {
    // Read SVG file
    const svgContent = fs.readFileSync('./public/safalogo.svg', 'utf8');
    
    // Create a high-resolution canvas
    const width = 1200; // High resolution for quality
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Convert SVG to data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    // Load and draw the SVG
    const img = await loadImage(svgDataUrl);
    ctx.drawImage(img, 0, 0, width, height);
    
    // Save as PNG with high quality
    const buffer = canvas.toBuffer('image/png', { compressionLevel: 3, quality: 1 });
    fs.writeFileSync('./public/safalogo.png', buffer);
    
    console.log('✅ Logo converted to PNG successfully: safalogo.png');
    console.log(`📐 Size: ${width}x${height}px`);
  } catch (error) {
    console.error('❌ Error converting logo:', error.message);
  }
}

convertSvgToPng();
