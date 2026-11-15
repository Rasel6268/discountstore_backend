const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");

async function seedWalletProduct() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  console.log("==================================================");
  console.log("🚀 Starting Seed: Premium Men's Leather Wallet");
  console.log("==================================================");

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB successfully.");

    // 1. Ensure Category "fashion" exists
    let category = await Category.findOne({
      $or: [{ slug: "fashion" }, { name: "fashion" }],
    });

    if (!category) {
      console.log("📦 Creating Category 'fashion'...");
      category = await Category.create({
        name: "fashion",
        slug: "fashion",
        description: "Fashion, wallets, and lifestyle accessories",
        isActive: true,
      });
      console.log(`✅ Category created: ${category.name} (${category._id})`);
    } else {
      console.log(`ℹ️ Existing Category found: ${category.name} (${category._id})`);
    }

    // 2. Ensure Brand "local leather bd" exists
    let brand = await Brand.findOne({
      $or: [{ slug: "local-leather-bd" }, { name: "local leather bd" }],
    });

    if (!brand) {
      console.log("🏷️ Creating Brand 'local leather bd'...");
      brand = await Brand.create({
        name: "local leather bd",
        slug: "local-leather-bd",
      });
      console.log(`✅ Brand created: ${brand.name} (${brand._id})`);
    } else {
      console.log(`ℹ️ Existing Brand found: ${brand.name} (${brand._id})`);
    }

    // 3. Prepare Image details
    const imageFilename = "1794648858981-IMG-20261110-WA0008_PaHLeMqco";
    const r2BaseUrl = process.env.R2_PUBLIC_URL || "https://cdn.discountstorebd.com";

    // Formulate R2 CDN and fallback ImageKit URLs
    const productImages = [
      {
        url: `${r2BaseUrl}/products/${imageFilename}.webp`,
        key: `products/${imageFilename}.webp`,
        fileId: imageFilename,
        alt: "Premium Men's genuine leather Textured Bifold Wallet",
        isPrimary: true,
        variants: {
          thumbnail: `${r2BaseUrl}/products/${imageFilename}-300.webp`,
          medium: `${r2BaseUrl}/products/${imageFilename}-600.webp`,
          large: `${r2BaseUrl}/products/${imageFilename}-1200.webp`,
        },
      },
    ];

    // Description formatted as structured HTML for rich rendering
    const htmlDescription = `
<div class="product-description-content">
  <p class="font-semibold text-lg text-gray-800 mb-3">Premium Men's Textured Bifold Wallet</p>
  <p class="text-gray-600 mb-4 leading-relaxed">
    Upgrade your everyday style with our Premium Men's Textured Bifold Wallet. Designed with an elegant textured finish, practical card storage and a stylish look.
  </p>
  <div class="my-4">
    <h4 class="font-bold text-gray-800 mb-2">Key Features:</h4>
    <ul class="list-disc pl-5 space-y-1.5 text-gray-600">
      <li>Premium textured exterior</li>
      <li>Classic bifold design</li>
      <li>Multiple card slots</li>
      <li>Zipper pocket on the brown variant</li>
      <li>Available in Black & Brown</li>
    </ul>
  </div>
  <p class="font-medium text-amber-700 mt-4">
    <strong>Discount Store BD – Style Meets Affordability!</strong>
  </p>
</div>
`.trim();

    const shortDescription =
      "Upgrade your everyday style with our Premium Men's Textured Bifold Wallet. Designed with an elegant textured finish, practical card storage and a stylish look.";

    // 4. Upsert Product
    const sku = "DSB-WLT-590-01";
    const slug = "premium-men-s-genuine-leather-textured-bifold-wallet";

    const productPayload = {
      name: "Premium Men's genuine leather Textured Bifold Wallet.",
      slug: slug,
      sku: sku,
      shortDescription: shortDescription,
      description: htmlDescription,
      regularPrice: 790.0,
      discountPrice: 590.0,
      category: category._id,
      brand: brand._id,
      quantity: 100,
      trackInventory: true,
      lowStockThreshold: 10,
      hasSizes: false,
      sizes: [],
      hasColors: true,
      colors: [{ name: "Black" }, { name: "Brown" }],
      images: productImages,
      isActive: true,
      isFeatured: true,
      isPublished: true,
      isPremium: true,
      isFreeShipping: false,
      status: "active",
    };

    let product = await Product.findOne({ $or: [{ sku: sku }, { slug: slug }] });

    if (product) {
      console.log(`🔄 Updating existing product (ID: ${product._id})...`);
      Object.assign(product, productPayload);
      await product.save();
      console.log(`✅ Product updated successfully: ${product.name}`);
    } else {
      console.log("✨ Creating new product...");
      product = await Product.create(productPayload);
      console.log(`✅ Product created successfully: ${product.name} (ID: ${product._id})`);
    }

    console.log("--------------------------------------------------");
    console.log("📋 Verified Product Details in Database:");
    console.log(`- Name:           ${product.name}`);
    console.log(`- SKU:            ${product.sku}`);
    console.log(`- Slug:           ${product.slug}`);
    console.log(`- Status:         ${product.status}`);
    console.log(`- Featured:       ${product.isFeatured}`);
    console.log(`- Premium:        ${product.isPremium}`);
    console.log(`- Published:      ${product.isPublished}`);
    console.log(`- Regular Price:  ৳${product.regularPrice} BDT`);
    console.log(`- Discount Price: ৳${product.discountPrice} BDT`);
    console.log(`- Discount %:     ${product.discountPercentage}%`);
    console.log(`- Category:       ${category.name} (${category.slug})`);
    console.log(`- Brand:          ${brand.name} (${brand.slug})`);
    console.log(`- Quantity:       ${product.quantity}`);
    console.log(`- Free Shipping:  ${product.isFreeShipping ? "Yes" : "No"}`);
    console.log(`- Colors:         ${product.colors.map((c) => c.name).join(", ")}`);
    console.log(`- Main Image:     ${product.images[0]?.url}`);
    console.log(`- Thumbnail:      ${product.images[0]?.variants?.thumbnail}`);
    console.log("==================================================");

    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding product:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  seedWalletProduct();
}

module.exports = { seedWalletProduct };
