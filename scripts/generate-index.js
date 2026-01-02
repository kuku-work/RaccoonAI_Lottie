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
 * Get file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Calculate directory size
 */
function getDirectorySize(dir) {
  let totalSize = 0;

  if (!fs.existsSync(dir)) return 0;

  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      totalSize += stat.size;
    } else if (stat.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    }
  });

  return totalSize;
}

/**
 * Generate index for all animations
 */
function generateIndex() {
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}  RaccoonAI Lottie Index Generator${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  const animationsDir = path.join(__dirname, '..', 'animations');
  const distDir = path.join(__dirname, '..', 'dist');
  const indexPath = path.join(__dirname, '..', 'index.json');

  if (!fs.existsSync(animationsDir)) {
    console.error(`${colors.red}Error: animations/ directory not found${colors.reset}`);
    process.exit(1);
  }

  // Base CDN URL
  const cdnBase = 'https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main';

  // Initialize index structure
  const index = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalAnimations: 0,
    categories: {},
    animations: {}
  };

  // Find all animation directories
  const animationDirs = fs.readdirSync(animationsDir)
    .map(dir => path.join(animationsDir, dir))
    .filter(dir => fs.statSync(dir).isDirectory());

  console.log(`Found ${animationDirs.length} animation(s)\n`);

  // Process each animation
  animationDirs.forEach(dir => {
    const animationName = path.basename(dir);
    const animationFile = path.join(dir, 'animation.json');
    const metadataFile = path.join(dir, 'metadata.json');
    const imagesDir = path.join(dir, 'images');
    const bundleFile = path.join(distDir, animationName, 'bundle.json');

    console.log(`${colors.blue}Processing: ${animationName}${colors.reset}`);

    if (!fs.existsSync(animationFile)) {
      console.log(`  ${colors.red}✗ animation.json not found, skipping${colors.reset}\n`);
      return;
    }

    try {
      // Read animation data
      const animation = JSON.parse(fs.readFileSync(animationFile, 'utf8'));

      // Read metadata if exists
      let metadata = {
        name: animationName,
        id: animationName,
        category: 'uncategorized',
        tags: [],
        description: ''
      };

      if (fs.existsSync(metadataFile)) {
        metadata = { ...metadata, ...JSON.parse(fs.readFileSync(metadataFile, 'utf8')) };
      }

      // Calculate sizes
      const animationSize = fs.statSync(animationFile).size;
      const imagesSize = fs.existsSync(imagesDir) ? getDirectorySize(imagesDir) : 0;
      const bundleSize = fs.existsSync(bundleFile) ? fs.statSync(bundleFile).size : 0;

      // Check for images
      let hasImages = false;
      let imageCount = 0;
      if (animation.assets) {
        animation.assets.forEach(asset => {
          if (asset.p && asset.u === 'images/') {
            hasImages = true;
            imageCount++;
          }
        });
      }

      // Build animation entry
      const animationEntry = {
        name: metadata.name,
        category: metadata.category,
        description: metadata.description,
        hasImages: hasImages,
        imageCount: imageCount,
        urls: {
          original: `${cdnBase}/animations/${animationName}/animation.json`,
          metadata: `${cdnBase}/animations/${animationName}/metadata.json`
        },
        properties: {
          version: animation.v || 'unknown',
          frameRate: animation.fr || 30,
          frames: animation.op || 0,
          duration: animation.op && animation.fr ? (animation.op / animation.fr).toFixed(2) + 's' : 'unknown',
          dimensions: `${animation.w || 0}x${animation.h || 0}`
        },
        fileSize: {
          animation: formatFileSize(animationSize),
          images: formatFileSize(imagesSize),
          total: formatFileSize(animationSize + imagesSize)
        },
        tags: metadata.tags || []
      };

      // Add bundle URL if exists
      if (fs.existsSync(bundleFile)) {
        animationEntry.urls.bundle = `${cdnBase}/dist/${animationName}/bundle.json`;
        animationEntry.fileSize.bundle = formatFileSize(bundleSize);
      }

      // Add preview URLs (if they exist in the future)
      const previewGif = path.join(__dirname, '..', 'previews', `${animationName}.gif`);
      if (fs.existsSync(previewGif)) {
        animationEntry.urls.preview_gif = `${cdnBase}/previews/${animationName}.gif`;
      }

      // Update categories
      if (!index.categories[metadata.category]) {
        index.categories[metadata.category] = [];
      }
      index.categories[metadata.category].push(animationName);

      // Add to index
      index.animations[animationName] = animationEntry;
      index.totalAnimations++;

      console.log(`  ${colors.green}✓ Added to index${colors.reset}`);
      console.log(`  Category: ${metadata.category}`);
      console.log(`  Size: ${animationEntry.fileSize.total}`);
      if (hasImages) {
        console.log(`  Images: ${imageCount} files`);
      }
      console.log('');

    } catch (e) {
      console.error(`  ${colors.red}✗ Error: ${e.message}${colors.reset}\n`);
    }
  });

  // Write index file
  try {
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    const indexSize = fs.statSync(indexPath).size;

    console.log(`${colors.blue}========================================${colors.reset}`);
    console.log(`${colors.green}✓ Index generated successfully!${colors.reset}`);
    console.log(`  Total animations: ${index.totalAnimations}`);
    console.log(`  Categories: ${Object.keys(index.categories).length}`);
    console.log(`  Index size: ${formatFileSize(indexSize)}`);
    console.log(`  Output: index.json`);
    console.log(`\n${colors.blue}CDN Base URL:${colors.reset}`);
    console.log(`${cdnBase}`);

  } catch (e) {
    console.error(`${colors.red}Error writing index file: ${e.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run generator
generateIndex();