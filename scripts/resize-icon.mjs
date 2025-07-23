import { createCanvas, loadImage } from 'canvas';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, '../src/assets/icons/kilo-dark.png');
const outputPath = join(__dirname, '../src/assets/icons/icon-128.png');

async function resizeIcon() {
  try {
    // Load the original image
    const image = await loadImage(inputPath);
    
    // Create a new canvas with the desired dimensions
    const canvas = createCanvas(128, 128);
    const ctx = canvas.getContext('2d');
    
    // Draw the image onto the canvas, scaling it to fit
    ctx.drawImage(image, 0, 0, 128, 128);
    
    // Save the resized image
    const buffer = canvas.toBuffer('image/png');
    await writeFile(outputPath, buffer);
    
    console.log('Icon resized successfully!');
  } catch (error) {
    console.error('Error resizing icon:', error);
    process.exit(1);
  }
}

resizeIcon();
