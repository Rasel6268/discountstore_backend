const assert = require("assert");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const Brand = require("../src/models/Brand");
const slugify = require("../src/utils/slugify");

async function runWalletProductTests() {
  console.log("=".repeat(60));
  console.log(" RUNNING WALLET PRODUCT VALIDATION TESTS");
  console.log("=".repeat(60));

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // TEST 1: Slugification matches user requirement
  test("Slugify correctly formats the wallet product name", () => {
    const rawName = "Premium Men's genuine leather Textured Bifold Wallet.";
    const expectedSlug = "premium-men-s-genuine-leather-textured-bifold-wallet";
    const generatedSlug = slugify(rawName);
    assert.strictEqual(generatedSlug, expectedSlug);
  });

  // TEST 2: Discount calculation logic
  test("Discount percentage is 25% for regular: 790 and discount: 590", () => {
    const regularPrice = 790;
    const discountPrice = 590;
    const discountPct = Math.round(((regularPrice - discountPrice) / regularPrice) * 100);
    assert.strictEqual(discountPct, 25);
  });

  // TEST 3: Product document schema validation
  test("Product Schema accepts complete wallet payload with R2 image metadata", () => {
    const dummyCategoryId = new mongoose.Types.ObjectId();
    const dummyBrandId = new mongoose.Types.ObjectId();
    const imageFilename = "1794648858981-IMG-20261110-WA0008_PaHLeMqco";

    const product = new Product({
      name: "Premium Men's genuine leather Textured Bifold Wallet.",
      slug: "premium-men-s-genuine-leather-textured-bifold-wallet",
      sku: "DSB-WLT-590-01",
      description: "Upgrade your everyday style with our Premium Men's Textured Bifold Wallet.",
      regularPrice: 790.0,
      discountPrice: 590.0,
      category: dummyCategoryId,
      brand: dummyBrandId,
      quantity: 100,
      trackInventory: true,
      hasSizes: false,
      sizes: [],
      hasColors: true,
      colors: [{ name: "Black" }, { name: "Brown" }],
      images: [
        {
          url: `https://cdn.discountstorebd.com/products/${imageFilename}.webp`,
          key: `products/${imageFilename}.webp`,
          fileId: imageFilename,
          alt: "Premium Men's genuine leather Textured Bifold Wallet",
          isPrimary: true,
          variants: {
            thumbnail: `https://cdn.discountstorebd.com/products/${imageFilename}-300.webp`,
            medium: `https://cdn.discountstorebd.com/products/${imageFilename}-600.webp`,
            large: `https://cdn.discountstorebd.com/products/${imageFilename}-1200.webp`,
          },
        },
      ],
      isActive: true,
      isFeatured: true,
      isPublished: true,
      isPremium: true,
      isFreeShipping: false,
      status: "active",
    });

    const validationError = product.validateSync();
    assert.strictEqual(validationError, undefined);
    assert.strictEqual(product.inStock, true);
    assert.strictEqual(product.isLowStock, false);
    assert.strictEqual(product.images[0].variants.thumbnail.includes("-300.webp"), true);
  });

  // TEST 4: Category and Brand schemas validate fashion and local leather bd
  test("Category and Brand schemas accept 'fashion' and 'local leather bd'", () => {
    const cat = new Category({
      name: "fashion",
      slug: "fashion",
      description: "Fashion & accessories",
    });
    assert.strictEqual(cat.validateSync(), undefined);

    const brand = new Brand({
      name: "local leather bd",
      slug: "local-leather-bd",
    });
    assert.strictEqual(brand.validateSync(), undefined);
  });

  console.log("=".repeat(60));
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=".repeat(60));

  if (failed > 0) process.exit(1);
}

runWalletProductTests();
