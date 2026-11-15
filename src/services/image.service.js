const sharp = require('sharp');
const crypto = require('crypto');
const r2Service = require('./r2.service');
const Product = require('../models/Product');
const User = require('../models/User');

// Configurable constants
const ALLOWED_FOLDERS = ['products', 'categories', 'banners', 'brands', 'avatars'];
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif'];

const IMAGE_CONFIG = {
  quality: parseInt(process.env.IMAGE_WEBP_QUALITY, 10) || 82,
  sizes: {
    thumbnail: parseInt(process.env.IMAGE_THUMBNAIL_WIDTH, 10) || 300,
    medium: parseInt(process.env.IMAGE_MEDIUM_WIDTH, 10) || 600,
    large: parseInt(process.env.IMAGE_LARGE_WIDTH, 10) || 1200,
    max: parseInt(process.env.IMAGE_MAX_WIDTH, 10) || 1920,
  },
};

class ImageService {
  /**
   * Validate and sanitize destination folder
   * @param {string} folder
   * @returns {string} Sanitized folder (e.g., 'products')
   */
  sanitizeFolder(folder) {
    if (!folder || typeof folder !== 'string') return 'products';
    const clean = folder.replace(/^\/+|\/+$/g, '').toLowerCase();
    return ALLOWED_FOLDERS.includes(clean) ? clean : 'products';
  }

  /**
   * Validate raw image buffer using Sharp metadata
   * @param {Buffer} buffer
   * @returns {Promise<sharp.Metadata>}
   */
  async validateImageBuffer(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new Error('Invalid or empty image buffer provided.');
    }

    try {
      const metadata = await sharp(buffer).metadata();

      if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format.toLowerCase())) {
        throw new Error(
          `Unsupported image format (${metadata.format || 'unknown'}). Allowed: JPEG, PNG, WebP, GIF, AVIF.`
        );
      }

      if (!metadata.width || !metadata.height) {
        throw new Error('Image file has invalid or corrupted dimensions.');
      }

      return metadata;
    } catch (err) {
      if (err.message.includes('Unsupported') || err.message.includes('dimensions')) {
        throw err;
      }
      throw new Error(`Failed to decode image: The file content is invalid or corrupted. Details: ${err.message}`);
    }
  }

  /**
   * Optimize a single image buffer and generate responsive WebP variants
   * @param {Buffer} buffer - Original image buffer
   * @param {Object} options
   * @param {string} [options.folder='products'] - Destination folder
   * @param {string} [options.originalName] - Original file name
   * @param {string} [options.alt] - Alt text
   * @returns {Promise<Object>} Image metadata and variant URLs
   */
  async processAndUploadImage(buffer, options = {}) {
    const originalMetadata = await this.validateImageBuffer(buffer);
    const folder = this.sanitizeFolder(options.folder);
    const uniqueId = crypto.randomUUID();
    const originalName = options.originalName || 'image';
    const alt = options.alt || originalName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const { quality, sizes } = IMAGE_CONFIG;

    // 1. Process master / original optimized WebP
    const masterBuffer = await sharp(buffer)
      .rotate() // auto-orient based on EXIF
      .resize({
        width: sizes.max,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality, effort: 4 })
      .toBuffer();

    const masterKey = `${folder}/${uniqueId}.webp`;

    // 2. Process variants (thumbnail 300px, medium 600px, large 1200px)
    const [thumbBuffer, mediumBuffer, largeBuffer] = await Promise.all([
      sharp(buffer)
        .rotate()
        .resize({ width: sizes.thumbnail, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality, effort: 4 })
        .toBuffer(),
      sharp(buffer)
        .rotate()
        .resize({ width: sizes.medium, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality, effort: 4 })
        .toBuffer(),
      sharp(buffer)
        .rotate()
        .resize({ width: sizes.large, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality, effort: 4 })
        .toBuffer(),
    ]);

    const thumbKey = `${folder}/${uniqueId}-${sizes.thumbnail}.webp`;
    const mediumKey = `${folder}/${uniqueId}-${sizes.medium}.webp`;
    const largeKey = `${folder}/${uniqueId}-${sizes.large}.webp`;

    // 3. Upload all variants to Cloudflare R2 concurrently
    const uploadTasks = [
      r2Service.uploadBuffer({
        buffer: masterBuffer,
        key: masterKey,
        contentType: 'image/webp',
        metadata: { originalName, width: String(originalMetadata.width), height: String(originalMetadata.height) },
      }),
      r2Service.uploadBuffer({
        buffer: thumbBuffer,
        key: thumbKey,
        contentType: 'image/webp',
      }),
      r2Service.uploadBuffer({
        buffer: mediumBuffer,
        key: mediumKey,
        contentType: 'image/webp',
      }),
      r2Service.uploadBuffer({
        buffer: largeBuffer,
        key: largeKey,
        contentType: 'image/webp',
      }),
    ];

    const [masterUpload, thumbUpload, mediumUpload, largeUpload] = await Promise.all(uploadTasks);

    const masterMeta = await sharp(masterBuffer).metadata();

    return {
      url: masterUpload.url,
      key: masterKey,
      fileId: masterKey, // Backwards compatible with ImageKit fileId
      name: `${uniqueId}.webp`,
      originalName: originalName,
      alt: alt,
      format: 'webp',
      width: masterMeta.width,
      height: masterMeta.height,
      size: masterBuffer.length,
      variants: {
        thumbnail: thumbUpload.url,
        medium: mediumUpload.url,
        large: largeUpload.url,
      },
      variantKeys: {
        thumbnail: thumbKey,
        medium: mediumKey,
        large: largeKey,
      },
      thumbnailUrl: thumbUpload.url, // Backwards compatible with ImageKit
    };
  }

  /**
   * Process multiple images concurrently
   * @param {Array<{ buffer: Buffer, originalname: string }>} files
   * @param {Object} options
   * @returns {Promise<Array<Object>>}
   */
  async processAndUploadMultiple(files, options = {}) {
    if (!Array.isArray(files) || files.length === 0) {
      return [];
    }

    const results = [];
    for (const file of files) {
      const result = await this.processAndUploadImage(file.buffer, {
        ...options,
        originalName: file.originalname,
      });
      results.push(result);
    }
    return results;
  }

  /**
   * Check if an image is referenced by any other product in MongoDB
   * @param {string} keyOrUrl
   * @param {string} [excludeProductId] - Optional product ID to exclude
   * @returns {Promise<boolean>}
   */
  async isImageReferenced(keyOrUrl, excludeProductId = null) {
    if (!keyOrUrl) return false;

    const key = r2Service.extractKeyFromUrl(keyOrUrl);
    const url = r2Service.getPublicUrl(key);

    const query = {
      $or: [
        { 'images.key': key },
        { 'images.url': url },
        { 'images.url': keyOrUrl },
      ],
    };

    if (excludeProductId) {
      query._id = { $ne: excludeProductId };
    }

    const count = await Product.countDocuments(query);
    if (count > 0) return true;

    // Check user avatar
    const userCount = await User.countDocuments({
      $or: [{ image: keyOrUrl }, { image: url }],
    });

    return userCount > 0;
  }

  /**
   * Delete an image and all its generated variants from R2
   * @param {string} keyOrUrl
   * @param {Object} [options]
   * @param {boolean} [options.force=false] - Force delete regardless of db references
   * @param {string} [options.excludeProductId]
   * @returns {Promise<{ success: boolean, message: string, deletedKeys: string[] }>}
   */
  async deleteImageWithVariants(keyOrUrl, options = {}) {
    if (!keyOrUrl) {
      return { success: false, message: 'No image key provided', deletedKeys: [] };
    }

    const key = r2Service.extractKeyFromUrl(keyOrUrl);

    // Security check: validate key format to prevent directory traversal or arbitrary deletion
    const parts = key.split('/');
    if (parts.length < 2 || !ALLOWED_FOLDERS.includes(parts[0].toLowerCase()) || key.includes('..')) {
      throw new Error(`Invalid or unauthorized storage key: "${key}"`);
    }

    // Check database reference unless force is true
    if (!options.force) {
      const referenced = await this.isImageReferenced(key, options.excludeProductId);
      if (referenced) {
        return {
          success: false,
          message: 'Image is still referenced by other products or users; skipping deletion from storage.',
          deletedKeys: [],
        };
      }
    }

    // Identify variant keys
    // e.g., if key is products/123.webp or products/123-300.webp
    const baseMatch = key.match(/^(.+?\/[0-9a-fA-F-]+?)(?:-\d+)?\.(webp|jpe?g|png|gif|avif)$/);
    const keysToDelete = [key];

    if (baseMatch) {
      const basePath = baseMatch[1];
      const ext = baseMatch[2];
      const { sizes } = IMAGE_CONFIG;

      keysToDelete.push(
        `${basePath}.${ext}`,
        `${basePath}-${sizes.thumbnail}.${ext}`,
        `${basePath}-${sizes.medium}.${ext}`,
        `${basePath}-${sizes.large}.${ext}`
      );
    }

    const uniqueKeys = [...new Set(keysToDelete)];
    await r2Service.deleteObjects(uniqueKeys);

    return {
      success: true,
      message: 'Image and variants deleted successfully from R2',
      deletedKeys: uniqueKeys,
    };
  }

  /**
   * Get public image configuration
   */
  getConfig() {
    return {
      publicUrl: r2Service.publicUrl,
      bucketName: r2Service.bucket,
      allowedFolders: ALLOWED_FOLDERS,
      allowedFormats: ALLOWED_FORMATS,
      sizes: IMAGE_CONFIG.sizes,
      quality: IMAGE_CONFIG.quality,
    };
  }
}

module.exports = new ImageService();
