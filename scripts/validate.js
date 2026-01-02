#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

/**
 * Validate a single animation directory
 */
function validateAnimation(animationDir) {
  const animationName = path.basename(animationDir);
  const errors = [];
  const warnings = [];

  console.log(`${colors.blue}Validating: ${animationName}${colors.reset}`);

  // Check for required files
  const animationFile = path.join(animationDir, 'animation.json');
  const metadataFile = path.join(animationDir, 'metadata.json');
  const imagesDir = path.join(animationDir, 'images');

  // Check animation.json exists
  if (!fs.existsSync(animationFile)) {
    errors.push(`Missing animation.json in ${animationName}`);
    return { errors, warnings };
  }

  // Check metadata.json exists
  if (!fs.existsSync(metadataFile)) {
    warnings.push(`Missing metadata.json in ${animationName}`);
  }

  // Validate animation.json structure
  try {
    const animation = JSON.parse(fs.readFileSync(animationFile, 'utf8'));

    // Check basic Lottie structure
    if (!animation.v) {
      errors.push(`Missing version field in ${animationName}/animation.json`);
    }
    if (!animation.fr) {
      errors.push(`Missing frame rate in ${animationName}/animation.json`);
    }
    if (!animation.w || !animation.h) {
      errors.push(`Missing dimensions in ${animationName}/animation.json`);
    }

    // Check for image assets
    if (animation.assets && animation.assets.length > 0) {
      let imageCount = 0;

      animation.assets.forEach(asset => {
        if (asset.p && asset.u === 'images/') {
          imageCount++;
          const imagePath = path.join(imagesDir, asset.p);

          // Check if image file exists
          if (!fs.existsSync(imagePath)) {
            errors.push(`Missing image: ${asset.p} in ${animationName}`);
          }
        }
      });

      if (imageCount > 0 && !fs.existsSync(imagesDir)) {
        errors.push(`Images directory missing in ${animationName}`);
      }

      // Check for orphaned images
      if (fs.existsSync(imagesDir)) {
        const imageFiles = fs.readdirSync(imagesDir)
          .filter(file => !file.startsWith('._')); // Ignore macOS metadata files

        const referencedImages = animation.assets
          .filter(asset => asset.p && asset.u === 'images/')
          .map(asset => asset.p);

        imageFiles.forEach(file => {
          if (!referencedImages.includes(file)) {
            warnings.push(`Unreferenced image: ${file} in ${animationName}`);
          }
        });
      }
    }

    // Validate metadata if exists
    if (fs.existsSync(metadataFile)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));

        // Check required metadata fields
        if (!metadata.id) {
          warnings.push(`Missing id in ${animationName}/metadata.json`);
        }
        if (!metadata.name) {
          warnings.push(`Missing name in ${animationName}/metadata.json`);
        }
        if (metadata.id !== animationName) {
          warnings.push(`Metadata id (${metadata.id}) doesn't match folder name (${animationName})`);
        }
      } catch (e) {
        errors.push(`Invalid JSON in ${animationName}/metadata.json: ${e.message}`);
      }
    }

  } catch (e) {
    errors.push(`Invalid JSON in ${animationName}/animation.json: ${e.message}`);
  }

  return { errors, warnings };
}

/**
 * Main validation function
 */
function validateAll() {
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}   RaccoonAI Lottie Animation Validator${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  const animationsDir = path.join(__dirname, '..', 'animations');

  if (!fs.existsSync(animationsDir)) {
    console.error(`${colors.red}Error: animations/ directory not found${colors.reset}`);
    process.exit(1);
  }

  // Find all animation directories
  const animationDirs = fs.readdirSync(animationsDir)
    .map(dir => path.join(animationsDir, dir))
    .filter(dir => fs.statSync(dir).isDirectory());

  if (animationDirs.length === 0) {
    console.log(`${colors.yellow}No animations found in animations/ directory${colors.reset}`);
    return;
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  const results = [];

  // Validate each animation
  animationDirs.forEach(dir => {
    const result = validateAnimation(dir);
    results.push({
      name: path.basename(dir),
      ...result
    });
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  });

  // Print results
  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}              RESULTS${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  results.forEach(result => {
    console.log(`${colors.blue}${result.name}:${colors.reset}`);

    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        console.log(`  ${colors.red}✗ ${error}${colors.reset}`);
      });
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`  ${colors.yellow}⚠ ${warning}${colors.reset}`);
      });
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`  ${colors.green}✓ All checks passed${colors.reset}`);
    }

    console.log('');
  });

  // Summary
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`Total animations: ${animationDirs.length}`);
  console.log(`Errors: ${totalErrors > 0 ? colors.red : colors.green}${totalErrors}${colors.reset}`);
  console.log(`Warnings: ${totalWarnings > 0 ? colors.yellow : colors.green}${totalWarnings}${colors.reset}`);

  if (totalErrors > 0) {
    console.log(`\n${colors.red}Validation failed with ${totalErrors} error(s)${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}Validation passed!${colors.reset}`);
  }
}

// Run validation
validateAll();