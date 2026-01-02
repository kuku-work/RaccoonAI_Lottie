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
 * Optimize JSON by removing unnecessary whitespace and precision
 */
function optimizeJSON(obj) {
  // Round floating point numbers to reduce precision
  function roundNumbers(val) {
    if (typeof val === 'number') {
      // Keep integers as is
      if (Number.isInteger(val)) return val;
      // Round floats to 3 decimal places
      return Math.round(val * 1000) / 1000;
    }
    if (Array.isArray(val)) {
      return val.map(roundNumbers);
    }
    if (typeof val === 'object' && val !== null) {
      const result = {};
      for (const key in val) {
        result[key] = roundNumbers(val[key]);
      }
      return result;
    }
    return val;
  }

  return roundNumbers(obj);
}

/**
 * Optimize a single animation
 */
function optimizeAnimation(animationDir) {
  const animationName = path.basename(animationDir);
  const animationFile = path.join(animationDir, 'animation.json');
  const distDir = path.join(__dirname, '..', 'dist', animationName);

  console.log(`${colors.blue}Optimizing: ${animationName}${colors.reset}`);

  if (!fs.existsSync(animationFile)) {
    console.error(`  ${colors.red}✗ animation.json not found${colors.reset}`);
    return false;
  }

  try {
    // Read original animation
    const originalContent = fs.readFileSync(animationFile, 'utf8');
    const animation = JSON.parse(originalContent);
    const originalSize = Buffer.byteLength(originalContent, 'utf8');

    // Optimize the animation
    const optimized = optimizeJSON(animation);

    // Create minified JSON (no whitespace)
    const minified = JSON.stringify(optimized);
    const minifiedSize = Buffer.byteLength(minified, 'utf8');

    // Ensure dist directory exists
    fs.ensureDirSync(distDir);

    // Write minified version
    const minPath = path.join(distDir, 'animation.min.json');
    fs.writeFileSync(minPath, minified);

    // Calculate savings
    const saved = originalSize - minifiedSize;
    const savedPercent = ((saved / originalSize) * 100).toFixed(1);

    console.log(`  ${colors.green}✓ Original size: ${(originalSize / 1024).toFixed(2)} KB${colors.reset}`);
    console.log(`  ${colors.green}✓ Optimized size: ${(minifiedSize / 1024).toFixed(2)} KB${colors.reset}`);
    console.log(`  ${colors.green}✓ Saved: ${(saved / 1024).toFixed(2)} KB (${savedPercent}%)${colors.reset}`);

    return true;
  } catch (e) {
    console.error(`  ${colors.red}✗ Error: ${e.message}${colors.reset}`);
    return false;
  }
}

/**
 * Optimize all animations
 */
function optimizeAll() {
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}  RaccoonAI Lottie Animation Optimizer${colors.reset}`);
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
  let totalOriginal = 0;
  let totalOptimized = 0;

  // Optimize each animation
  animationDirs.forEach(dir => {
    const animationFile = path.join(dir, 'animation.json');
    const animationName = path.basename(dir);
    const minPath = path.join(distDir, animationName, 'animation.min.json');

    if (optimizeAnimation(dir)) {
      successCount++;

      // Track total sizes
      const originalSize = fs.statSync(animationFile).size;
      const optimizedSize = fs.statSync(minPath).size;
      totalOriginal += originalSize;
      totalOptimized += optimizedSize;
    } else {
      failCount++;
    }
    console.log('');
  });

  // Summary
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`Total animations: ${animationDirs.length}`);
  console.log(`Optimized successfully: ${colors.green}${successCount}${colors.reset}`);

  if (successCount > 0) {
    const totalSaved = totalOriginal - totalOptimized;
    const savedPercent = ((totalSaved / totalOriginal) * 100).toFixed(1);
    console.log(`\nTotal original size: ${(totalOriginal / 1024).toFixed(2)} KB`);
    console.log(`Total optimized size: ${(totalOptimized / 1024).toFixed(2)} KB`);
    console.log(`Total saved: ${colors.green}${(totalSaved / 1024).toFixed(2)} KB (${savedPercent}%)${colors.reset}`);
  }

  if (failCount > 0) {
    console.log(`Failed: ${colors.red}${failCount}${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}All animations optimized successfully!${colors.reset}`);
  }
}

// Run optimizer
optimizeAll();