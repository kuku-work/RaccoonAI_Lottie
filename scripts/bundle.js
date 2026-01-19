#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

/**
 * Convert image to base64 data URI
 */
function imageToBase64(imagePath) {
  const imageData = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase().replace('.', '');
  const mimeType = ext === 'jpg' ? 'jpeg' : ext;
  return `data:image/${mimeType};base64,${imageData.toString('base64')}`;
}

/**
 * Bundle a single animation with embedded images
 */
function bundleAnimation(animationDir) {
  const animationName = path.basename(animationDir);
  const animationFile = path.join(animationDir, 'animation.json');
  const imagesDir = path.join(animationDir, 'images');
  const distDir = path.join(__dirname, '..', 'dist', animationName);

  console.log(`${colors.blue}Bundling: ${animationName}${colors.reset}`);

  // Check if animation file exists
  if (!fs.existsSync(animationFile)) {
    console.error(`  ${colors.red}✗ animation.json not found${colors.reset}`);
    return false;
  }

  try {
    // Read animation JSON
    const animation = JSON.parse(fs.readFileSync(animationFile, 'utf8'));
    let hasImages = false;
    let imagesSizeTotal = 0;
    let imagesConverted = 0;

    // Process assets
    if (animation.assets && animation.assets.length > 0) {
      animation.assets.forEach(asset => {
        // Check if asset is an external image
        if (asset.p && asset.u === 'images/' && !asset.e) {
          hasImages = true;
          const imagePath = path.join(imagesDir, asset.p);

          if (fs.existsSync(imagePath)) {
            // Convert image to base64
            const base64Data = imageToBase64(imagePath);
            imagesSizeTotal += fs.statSync(imagePath).size;
            imagesConverted++;

            // Update asset to embedded format
            asset.e = 1; // Mark as embedded
            asset.p = base64Data; // Replace path with base64 data
            delete asset.u; // Remove URL prefix
          } else {
            console.warn(`  ${colors.yellow}⚠ Image not found: ${asset.p}${colors.reset}`);
          }
        }
      });
    }

    // Create dist directory
    fs.ensureDirSync(distDir);

    // Write bundled JSON
    const bundlePath = path.join(distDir, 'bundle.json');
    fs.writeFileSync(bundlePath, JSON.stringify(animation));

    const bundleSize = fs.statSync(bundlePath).size;

    // Log results
    if (hasImages) {
      console.log(`  ${colors.green}✓ Converted ${imagesConverted} images to base64${colors.reset}`);
      console.log(`  ${colors.green}✓ Original images size: ${(imagesSizeTotal / 1024).toFixed(2)} KB${colors.reset}`);
      console.log(`  ${colors.green}✓ Bundle size: ${(bundleSize / 1024).toFixed(2)} KB${colors.reset}`);
      const ratio = ((bundleSize / imagesSizeTotal - 1) * 100).toFixed(1);
      if (ratio > 0) {
        console.log(`  ${colors.yellow}  Size increased by ${ratio}% (due to base64 encoding)${colors.reset}`);
      }
    } else {
      console.log(`  ${colors.green}✓ No images to bundle${colors.reset}`);
      console.log(`  ${colors.green}✓ Bundle size: ${(bundleSize / 1024).toFixed(2)} KB${colors.reset}`);
    }

    return true;
  } catch (e) {
    console.error(`  ${colors.red}✗ Error: ${e.message}${colors.reset}`);
    return false;
  }
}

/**
 * Bundle all animations
 */
function bundleAll() {
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}   RaccoonAI Lottie Animation Bundler${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  const animationsDir = path.join(__dirname, '..', 'animations');
  const distDir = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(animationsDir)) {
    console.error(`${colors.red}Error: animations/ directory not found${colors.reset}`);
    process.exit(1);
  }

  // Ensure dist directory exists
  fs.ensureDirSync(distDir);

  // Find all animation directories
  const animationDirs = fs.readdirSync(animationsDir)
    .map(dir => path.join(animationsDir, dir))
    .filter(dir => fs.statSync(dir).isDirectory());

  if (animationDirs.length === 0) {
    console.log(`${colors.yellow}No animations found in animations/ directory${colors.reset}`);
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // Bundle each animation
  animationDirs.forEach(dir => {
    if (bundleAnimation(dir)) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('');
  });

  // Summary
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`Total animations: ${animationDirs.length}`);
  console.log(`Bundled successfully: ${colors.green}${successCount}${colors.reset}`);
  if (failCount > 0) {
    console.log(`Failed: ${colors.red}${failCount}${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}All animations bundled successfully!${colors.reset}`);
  }
}

// Run bundler
bundleAll();