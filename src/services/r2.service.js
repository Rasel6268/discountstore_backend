const {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { r2Client, bucketName, publicUrl } = require('../config/r2');

class R2Service {
  constructor() {
    this.client = r2Client;
    this.bucket = bucketName;
    this.publicUrl = publicUrl;
  }

  /**
   * Upload a Buffer to Cloudflare R2
   * @param {Object} params
   * @param {Buffer} params.buffer - File buffer
   * @param {string} params.key - Destination key (e.g., 'products/123-abc.webp')
   * @param {string} params.contentType - Content-Type (e.g., 'image/webp')
   * @param {Object} [params.metadata] - Optional metadata object
   * @param {string} [params.cacheControl] - Cache-Control header
   * @returns {Promise<{ key: string, url: string, etag: string, size: number }>}
   */
  async uploadBuffer({
    buffer,
    key,
    contentType = 'image/webp',
    metadata = {},
    cacheControl = 'public, max-age=31536000, immutable',
  }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('A valid Buffer is required for R2 upload');
    }
    if (!key) {
      throw new Error('Object key is required for R2 upload');
    }

    // Clean key (remove leading slashes)
    const cleanKey = key.replace(/^\/+/, '');

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: metadata,
    });

    const response = await this.client.send(command);

    return {
      key: cleanKey,
      url: this.getPublicUrl(cleanKey),
      etag: response.ETag ? response.ETag.replace(/"/g, '') : null,
      size: buffer.length,
    };
  }

  /**
   * Delete a single object from Cloudflare R2
   * @param {string} key - Object key or full URL
   * @returns {Promise<boolean>}
   */
  async deleteObject(key) {
    if (!key) return false;

    const cleanKey = this.extractKeyFromUrl(key);
    if (!cleanKey) return false;

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      // If object doesn't exist, we consider deletion successful (idempotent)
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return true;
      }
      console.error(`[R2Service] Error deleting object "${cleanKey}":`, error.message);
      throw error;
    }
  }

  /**
   * Delete multiple objects from Cloudflare R2 in batch
   * @param {string[]} keys - Array of object keys or URLs
   * @returns {Promise<{ deleted: string[], errors: any[] }>}
   */
  async deleteObjects(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return { deleted: [], errors: [] };
    }

    const cleanKeys = keys
      .map((k) => this.extractKeyFromUrl(k))
      .filter((k) => Boolean(k));

    if (cleanKeys.length === 0) {
      return { deleted: [], errors: [] };
    }

    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: cleanKeys.map((Key) => ({ Key })),
          Quiet: false,
        },
      });

      const response = await this.client.send(command);
      const deleted = (response.Deleted || []).map((d) => d.Key);
      const errors = response.Errors || [];

      return { deleted, errors };
    } catch (error) {
      console.error('[R2Service] Batch delete error:', error.message);
      throw error;
    }
  }

  /**
   * Check if an object exists in Cloudflare R2
   * @param {string} key - Object key or full URL
   * @returns {Promise<boolean>}
   */
  async objectExists(key) {
    const cleanKey = this.extractKeyFromUrl(key);
    if (!cleanKey) return false;

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get public CDN URL for an object key
   * @param {string} key - Object key (e.g., 'products/123.webp')
   * @returns {string} Public URL
   */
  getPublicUrl(key) {
    if (!key) return '';
    const cleanKey = key.replace(/^\/+/, '');
    if (this.publicUrl) {
      return `${this.publicUrl}/${cleanKey}`;
    }
    // Fallback if publicUrl not configured
    return `https://${this.bucket}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${cleanKey}`;
  }

  /**
   * Extract object key from URL or return key if already a key
   * @param {string} keyOrUrl
   * @returns {string}
   */
  extractKeyFromUrl(keyOrUrl) {
    if (!keyOrUrl || typeof keyOrUrl !== 'string') return '';

    // If it's already a relative key like 'products/abc.webp'
    if (!keyOrUrl.startsWith('http://') && !keyOrUrl.startsWith('https://')) {
      return keyOrUrl.replace(/^\/+/, '');
    }

    try {
      const parsedUrl = new URL(keyOrUrl);
      // Remove leading slash
      return parsedUrl.pathname.replace(/^\/+/, '');
    } catch (e) {
      // If URL parsing fails, strip protocol and domain manually
      return keyOrUrl.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '');
    }
  }

  /**
   * Generate a presigned upload URL for direct client-to-R2 upload if required
   * @param {string} key
   * @param {string} contentType
   * @param {number} expiresIn
   * @returns {Promise<string>}
   */
  async getPresignedUploadUrl(key, contentType = 'image/webp', expiresIn = 3600) {
    const cleanKey = this.extractKeyFromUrl(key);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      ContentType: contentType,
    });
    return await getSignedUrl(this.client, command, { expiresIn });
  }
}

module.exports = new R2Service();
