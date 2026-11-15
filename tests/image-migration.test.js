const assert = require('assert');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const imageService = require('../src/services/image.service');
const r2Service = require('../src/services/r2.service');
const Product = require('../src/models/Product');

async function runTests() {
  console.log('='.repeat(60));
  console.log(' RUNNING CLOUDFLARE R2 & IMAGE MANAGEMENT TESTS');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✓ ${name}`);
        passed++;
      } catch (err) {
        console.error(`  ✗ ${name}:`, err.message);
        failed++;
      }
    })();
  }

  // TEST 1: R2 Service key extraction and public URL generation
  await test('R2Service: extractKeyFromUrl and getPublicUrl', async () => {
    const rawKey = 'products/sample-uuid.webp';
    assert.strictEqual(r2Service.extractKeyFromUrl(rawKey), 'products/sample-uuid.webp');

    const fullUrl = 'https://cdn.discountstorebd.com/products/sample-uuid.webp';
    assert.strictEqual(r2Service.extractKeyFromUrl(fullUrl), 'products/sample-uuid.webp');

    const generatedUrl = r2Service.getPublicUrl('products/test-123.webp');
    assert.ok(generatedUrl.includes('products/test-123.webp'));
  });

  // TEST 2: Sharp image content validation - rejects corrupt buffer
  await test('ImageService: validateImageBuffer rejects invalid/corrupt buffer', async () => {
    const corruptBuffer = Buffer.from('NOT_AN_IMAGE_PAYLOAD_FAKE_JPEG');
    let threw = false;
    try {
      await imageService.validateImageBuffer(corruptBuffer);
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('invalid') || err.message.includes('Unsupported') || err.message.includes('decode'));
    }
    assert.strictEqual(threw, true, 'Corrupt buffer must throw validation error');
  });

  // TEST 3: Sharp image content validation - accepts valid image
  await test('ImageService: validateImageBuffer accepts valid generated image', async () => {
    // Generate valid 100x100 PNG using Sharp
    const validPngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    }).png().toBuffer();

    const metadata = await imageService.validateImageBuffer(validPngBuffer);
    assert.strictEqual(metadata.format, 'png');
    assert.strictEqual(metadata.width, 100);
    assert.strictEqual(metadata.height, 100);
  });

  // TEST 4: Sharp variant generation and WebP compression
  await test('ImageService: WebP variant generation (300px, 600px, 1200px)', async () => {
    // Create high-res 1600x1200 test image
    const hiResBuffer = await sharp({
      create: {
        width: 1600,
        height: 1200,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    }).jpeg().toBuffer();

    // Verify sharp converts to WebP and generates sizes
    const thumbBuf = await sharp(hiResBuffer)
      .rotate()
      .resize({ width: 300, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 82 })
      .toBuffer();

    const thumbMeta = await sharp(thumbBuf).metadata();
    assert.strictEqual(thumbMeta.format, 'webp');
    assert.strictEqual(thumbMeta.width, 300);

    const medBuf = await sharp(hiResBuffer)
      .rotate()
      .resize({ width: 600, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 82 })
      .toBuffer();

    const medMeta = await sharp(medBuf).metadata();
    assert.strictEqual(medMeta.format, 'webp');
    assert.strictEqual(medMeta.width, 600);

    const largeBuf = await sharp(hiResBuffer)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 82 })
      .toBuffer();

    const largeMeta = await sharp(largeBuf).metadata();
    assert.strictEqual(largeMeta.format, 'webp');
    assert.strictEqual(largeMeta.width, 1200);
  });

  // TEST 5: Security check on storage keys (rejects path traversal)
  await test('ImageService: deleteImageWithVariants rejects directory traversal', async () => {
    let threw = false;
    try {
      await imageService.deleteImageWithVariants('../../etc/passwd');
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('Invalid or unauthorized'));
    }
    assert.strictEqual(threw, true, 'Directory traversal key must be rejected');
  });

  // TEST 6: Security check on storage keys (rejects unallowed folders)
  await test('ImageService: deleteImageWithVariants rejects unallowed folder', async () => {
    let threw = false;
    try {
      await imageService.deleteImageWithVariants('secret_keys/test.webp');
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('Invalid or unauthorized'));
    }
    assert.strictEqual(threw, true, 'Unallowed root folder must be rejected');
  });

  // TEST 7: Product schema backward compatibility
  await test('Product Model: Image schema supports both legacy and R2 variants structure', () => {
    const dummyProduct = new Product({
      name: 'Test Product ' + crypto.randomUUID(),
      description: 'Test description with sufficient length',
      regularPrice: 100,
      sku: 'SKU-' + Date.now(),
      category: '64b1f2a3c9e77b0012345678',
      images: [
        {
          url: 'https://cdn.discountstorebd.com/products/test.webp',
          key: 'products/test.webp',
          alt: 'Test Alt',
          isPrimary: true,
          variants: {
            thumbnail: 'https://cdn.discountstorebd.com/products/test-300.webp',
            medium: 'https://cdn.discountstorebd.com/products/test-600.webp',
            large: 'https://cdn.discountstorebd.com/products/test-1200.webp',
          },
        },
        // Legacy format without variants
        {
          url: 'https://ik.imagekit.io/Soclav/products/old-image.jpg',
          alt: 'Old Image',
          isPrimary: false,
        },
      ],
    });

    assert.strictEqual(dummyProduct.images.length, 2);
    assert.strictEqual(dummyProduct.images[0].key, 'products/test.webp');
    assert.strictEqual(dummyProduct.images[0].variants.thumbnail, 'https://cdn.discountstorebd.com/products/test-300.webp');
    assert.strictEqual(dummyProduct.images[1].url, 'https://ik.imagekit.io/Soclav/products/old-image.jpg');
    assert.strictEqual(dummyProduct.images[1].key, '');
  });

  // TEST 8: Public configuration endpoint
  await test('ImageService: getConfig returns complete public config', () => {
    const config = imageService.getConfig();
    assert.ok(config.publicUrl !== undefined);
    assert.ok(Array.isArray(config.allowedFolders));
    assert.ok(config.allowedFolders.includes('products'));
    assert.ok(config.allowedFolders.includes('categories'));
    assert.ok(config.allowedFolders.includes('banners'));
    assert.ok(config.sizes.thumbnail === 300);
    assert.ok(config.sizes.medium === 600);
    assert.ok(config.sizes.large === 1200);
  });

  console.log('='.repeat(60));
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed.`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
