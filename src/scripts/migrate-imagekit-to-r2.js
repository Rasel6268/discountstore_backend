#!/usr/bin/env node
/**
 * ImageKit to Cloudflare R2 Migration Utility
 *
 * Usage:
 *   node src/scripts/migrate-imagekit-to-r2.js [options]
 *
 * Options:
 *   --dry-run            Simulate migration without modifying MongoDB or Cloudflare R2
 *   --batch-size=N       Number of products to process per batch (default: 5)
 *   --limit=N            Process at most N products (useful for testing)
 *   --verbose            Print detailed output for each image
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('../models/Product');
const imageService = require('../services/image.service');
const r2Service = require('../services/r2.service');

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

const getArgValue = (prefix, defaultValue) => {
  const arg = args.find((a) => a.startsWith(prefix));
  if (arg) {
    const val = arg.split('=')[1];
    return val ? parseInt(val, 10) : defaultValue;
  }
  return defaultValue;
};

const batchSize = getArgValue('--batch-size', 5);
const maxLimit = getArgValue('--limit', null);

// Determine if a URL is an ImageKit URL
const isImageKitUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('ik.imagekit.io') || url.includes('imagekit.io');
};

// Determine if an image has already been migrated to R2
const isAlreadyMigrated = (image) => {
  if (!image) return false;
  // If key is set and points to an R2 object, or url matches R2 public URL
  if (image.key && !isImageKitUrl(image.url)) return true;
  if (r2Service.publicUrl && image.url && image.url.startsWith(r2Service.publicUrl)) return true;
  return false;
};

// Download image with retry logic
const downloadImage = async (url, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 25000,
        headers: {
          'User-Agent': 'DiscountStore-Migration-Agent/1.0',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      return Buffer.from(response.data);
    } catch (err) {
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts: ${err.message}`);
      }
      // Wait before retry (exponential backoff)
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
};

async function runMigration() {
  console.log('='.repeat(70));
  console.log(' CLOUDFLARE R2 IMAGE MIGRATION UTILITY');
  console.log('='.repeat(70));
  console.log(` Mode:        ${isDryRun ? 'DRY-RUN (No changes will be saved)' : 'LIVE EXECUTION'}`);
  console.log(` Batch Size:  ${batchSize}`);
  console.log(` Limit:       ${maxLimit || 'All products'}`);
  console.log(` R2 Bucket:   ${r2Service.bucket}`);
  console.log(` R2 CDN URL:  ${r2Service.publicUrl}`);
  console.log('='.repeat(70));

  // Connect to MongoDB
  if (!process.env.MONGO_URL) {
    console.error('ERROR: MONGO_URL not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL, {
    dbName: 'discount_mart_db',
  });
  console.log(' Connected to MongoDB database successfully.\n');

  // Statistics
  const stats = {
    totalProducts: 0,
    productsWithImages: 0,
    productsMigrated: 0,
    totalImages: 0,
    alreadyMigratedImages: 0,
    skippedNonImageKit: 0,
    successfullyMigrated: 0,
    failedMigrations: 0,
    remainingImageKitReferences: 0,
    failures: [],
  };

  try {
    // 1. Query products
    const query = Product.find({});
    if (maxLimit) {
      query.limit(maxLimit);
    }
    const products = await query.lean();

    stats.totalProducts = products.length;
    console.log(`Found ${products.length} products to evaluate for migration.`);

    // 2. Process products in batches
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`\n--- Processing Batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(products.length / batchSize)} ---`);

      for (const product of batch) {
        const productImages = product.images || [];
        stats.totalImages += productImages.length;

        if (productImages.length === 0) {
          continue;
        }

        stats.productsWithImages += 1;
        let productModified = false;
        const updatedImages = [];

        for (let imgIdx = 0; imgIdx < productImages.length; imgIdx++) {
          const img = productImages[imgIdx];
          const imgUrl = typeof img === 'string' ? img : img.url;
          const imgAlt = img.alt || product.name || 'Product Image';
          const isPrimary = typeof img.isPrimary === 'boolean' ? img.isPrimary : imgIdx === 0;

          // Check if already migrated
          if (isAlreadyMigrated(img)) {
            if (isVerbose) console.log(`  [SKIP] Image already on R2: ${imgUrl}`);
            stats.alreadyMigratedImages += 1;
            updatedImages.push(img);
            continue;
          }

          // Check if it is an ImageKit URL
          if (!isImageKitUrl(imgUrl)) {
            if (isVerbose) console.log(`  [SKIP] Non-ImageKit URL: ${imgUrl}`);
            stats.skippedNonImageKit += 1;
            updatedImages.push(img);
            continue;
          }

          // It is an unmigrated ImageKit URL: Migrate it!
          console.log(`  [MIGRATING] Product "${product.name}" image ${imgIdx + 1}/${productImages.length}: ${imgUrl}`);

          if (isDryRun) {
            stats.successfullyMigrated += 1;
            productModified = true;
            updatedImages.push({
              url: `${r2Service.publicUrl}/products/dryrun-migrated-${imgIdx}.webp`,
              key: `products/dryrun-migrated-${imgIdx}.webp`,
              alt: imgAlt,
              isPrimary,
              variants: {
                thumbnail: `${r2Service.publicUrl}/products/dryrun-migrated-${imgIdx}-300.webp`,
                medium: `${r2Service.publicUrl}/products/dryrun-migrated-${imgIdx}-600.webp`,
                large: `${r2Service.publicUrl}/products/dryrun-migrated-${imgIdx}-1200.webp`,
              },
            });
            continue;
          }

          try {
            // 3. Download image
            const buffer = await downloadImage(imgUrl);

            // 4 & 5 & 6. Validate, Optimize and Upload to R2
            const originalName = path.basename(new URL(imgUrl).pathname) || `product-${product._id}-${imgIdx}.jpg`;
            const uploadedMeta = await imageService.processAndUploadImage(buffer, {
              folder: 'products',
              originalName,
              alt: imgAlt,
            });

            // 7. Store new metadata
            updatedImages.push({
              url: uploadedMeta.url,
              key: uploadedMeta.key,
              fileId: uploadedMeta.key,
              alt: imgAlt,
              isPrimary,
              variants: uploadedMeta.variants,
            });

            stats.successfullyMigrated += 1;
            productModified = true;
            console.log(`    ✓ Migrated -> ${uploadedMeta.url}`);
          } catch (migrateErr) {
            console.error(`    ✗ Failed to migrate image: ${migrateErr.message}`);
            stats.failedMigrations += 1;
            stats.failures.push({
              productId: product._id,
              productName: product.name,
              imageUrl: imgUrl,
              error: migrateErr.message,
            });
            // Keep original image on failure so product is not corrupted!
            updatedImages.push(img);
          }
        }

        // 8. Update MongoDB document if modified and not in dry-run
        if (productModified && !isDryRun) {
          await Product.findByIdAndUpdate(product._id, {
            $set: { images: updatedImages },
          });
          stats.productsMigrated += 1;
          console.log(`  ✓ Updated product in MongoDB: ${product.name}`);
        } else if (productModified && isDryRun) {
          stats.productsMigrated += 1;
        }
      }
    }

    // 9. Count remaining ImageKit references across all products
    const remainingProductsWithIK = await Product.find({
      'images.url': { $regex: 'imagekit|ik.imagekit.io', $options: 'i' },
    }).lean();

    stats.remainingImageKitReferences = remainingProductsWithIK.reduce((acc, p) => {
      const ikImgs = (p.images || []).filter((i) => isImageKitUrl(i.url));
      return acc + ikImgs.length;
    }, 0);

  } catch (error) {
    console.error('Fatal Migration Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n Disconnected from MongoDB.');
  }

  // 10. Output Migration Summary Report
  console.log('\n' + '='.repeat(70));
  console.log(' MIGRATION REPORT');
  console.log('='.repeat(70));
  console.log(` Execution Mode:                    ${isDryRun ? 'DRY RUN' : 'LIVE COMPLETED'}`);
  console.log(` Total Products Scanned:            ${stats.totalProducts}`);
  console.log(` Products with Images:              ${stats.productsWithImages}`);
  console.log(` Products Migrated/Updated:         ${stats.productsMigrated}`);
  console.log(` Total Images Evaluated:            ${stats.totalImages}`);
  console.log(` Already on Cloudflare R2:          ${stats.alreadyMigratedImages}`);
  console.log(` Skipped (Non-ImageKit):            ${stats.skippedNonImageKit}`);
  console.log(` Successfully Migrated:             ${stats.successfullyMigrated}`);
  console.log(` Failed Migrations:                 ${stats.failedMigrations}`);
  console.log(` Remaining ImageKit References:     ${stats.remainingImageKitReferences}`);
  console.log('='.repeat(70));

  if (stats.failures.length > 0) {
    console.log('\nFAILED ITEMS LOG:');
    stats.failures.forEach((f, idx) => {
      console.log(` ${idx + 1}. [Product: ${f.productName} (${f.productId})]`);
      console.log(`    URL:   ${f.imageUrl}`);
      console.log(`    Error: ${f.error}`);
    });
    console.log('='.repeat(70));
  }
}

runMigration().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
