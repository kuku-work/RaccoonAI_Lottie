#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Extract Base64 images from bundle JSON and create standard structure
function extractImages(inputFile, outputDir) {
  console.log(`Reading ${inputFile}...`);

  // Read the bundle JSON
  const data = fs.readFileSync(inputFile, 'utf8');
  const animation = JSON.parse(data);

  // Create output directories
  const imagesDir = path.join(outputDir, 'images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  let imageCount = 0;

  // Process assets
  if (animation.assets && Array.isArray(animation.assets)) {
    animation.assets = animation.assets.map((asset, index) => {
      if (asset.p && asset.p.startsWith('data:image/')) {
        // Extract Base64 image
        const matches = asset.p.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const extension = matches[1] === 'svg+xml' ? 'svg' : matches[1];
          const base64Data = matches[2];
          const fileName = `img_${imageCount}.${extension}`;
          const filePath = path.join(imagesDir, fileName);

          // Write image file
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(filePath, buffer);
          console.log(`  Extracted: ${fileName} (${(buffer.length / 1024).toFixed(2)} KB)`);

          // Update asset to use external path
          asset.u = 'images/';
          asset.p = fileName;
          imageCount++;
        }
      }
      return asset;
    });
  }

  // Write updated animation.json
  const animationPath = path.join(outputDir, 'animation.json');
  fs.writeFileSync(animationPath, JSON.stringify(animation, null, 2));
  console.log(`\nCreated animation.json with ${imageCount} external images`);

  return {
    imageCount,
    width: animation.w,
    height: animation.h,
    frameRate: animation.fr,
    frames: animation.op,
    duration: Math.round(animation.op / animation.fr)
  };
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node extract-images.js <input-json> <output-dir>');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputDir = args[1];

  try {
    const info = extractImages(inputFile, outputDir);
    console.log('\nExtraction complete:');
    console.log(`  Images: ${info.imageCount}`);
    console.log(`  Dimensions: ${info.width}x${info.height}`);
    console.log(`  Frame Rate: ${info.frameRate} fps`);
    console.log(`  Duration: ${info.duration}s`);
    console.log(`  Frames: ${info.frames}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { extractImages };
