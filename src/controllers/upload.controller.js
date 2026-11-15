const imageService = require('../services/image.service');
const r2Service = require('../services/r2.service');

// Optional ImageKit fallback for legacy fileId deletion if credentials still exist
let legacyImageKit = null;
try {
  legacyImageKit = require('../config/imagekit');
} catch (e) {
  // ImageKit module might be unconfigured or removed later
}

class UploadController {
  /**
   * GET /upload/config or GET /api/images/config
   * Returns public configuration for uploads
   */
  async getConfig(req, res) {
    try {
      const config = imageService.getConfig();
      return res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error('[UploadController.getConfig] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve image configuration',
        error: error.message,
      });
    }
  }

  /**
   * POST /upload or POST /api/images/upload
   * Upload and optimize a single image to Cloudflare R2
   */
  async uploadSingle(req, res) {
    try {
      const file = req.file || (req.files && req.files[0]);

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided. Please attach an image file.',
        });
      }

      const folder = req.body.folder || 'products';
      const alt = req.body.alt || '';

      const uploadedImage = await imageService.processAndUploadImage(file.buffer, {
        folder,
        originalName: file.originalname,
        alt,
      });

      return res.status(200).json({
        success: true,
        message: 'Image processed, optimized, and uploaded to Cloudflare R2 successfully',
        data: uploadedImage,
        // Root-level fields for maximum client compatibility
        url: uploadedImage.url,
        key: uploadedImage.key,
        fileId: uploadedImage.fileId,
        variants: uploadedImage.variants,
        thumbnailUrl: uploadedImage.thumbnailUrl,
      });
    } catch (error) {
      console.error('[UploadController.uploadSingle] Error:', error);
      return res.status(error.message?.includes('Unsupported') || error.message?.includes('Invalid') ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to process and upload image',
        error: error.message,
      });
    }
  }

  /**
   * POST /upload/multiple or POST /api/images/upload-multiple
   * Upload and optimize multiple images to Cloudflare R2
   */
  async uploadMultiple(req, res) {
    try {
      const files = req.files;

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided. Please select at least one image.',
        });
      }

      const folder = req.body.folder || 'products';

      const uploadedList = await imageService.processAndUploadMultiple(files, {
        folder,
      });

      return res.status(200).json({
        success: true,
        message: `${uploadedList.length} image(s) processed and uploaded to Cloudflare R2 successfully`,
        data: uploadedList,
      });
    } catch (error) {
      console.error('[UploadController.uploadMultiple] Error:', error);
      return res.status(error.message?.includes('Unsupported') || error.message?.includes('Invalid') ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to upload images',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /upload/:fileId or DELETE /api/images/:key
   * Delete image and all its variants from Cloudflare R2
   */
  async deleteFile(req, res) {
    try {
      // Key can be in params (fileId or key or wildcard), query, or body
      let keyOrId = req.params.fileId || req.params.key || req.params[0] || req.query.key || req.body.key;

      if (!keyOrId) {
        return res.status(400).json({
          success: false,
          message: 'Image key or fileId is required for deletion',
        });
      }

      // If URL decoded is needed
      try {
        keyOrId = decodeURIComponent(keyOrId);
      } catch (e) {}

      // Check if it's an R2 key or URL
      const isR2 =
        keyOrId.includes('/') ||
        keyOrId.endsWith('.webp') ||
        (r2Service.publicUrl && keyOrId.includes(r2Service.publicUrl));

      if (isR2) {
        const force = req.query.force === 'true' || req.body.force === true;
        const result = await imageService.deleteImageWithVariants(keyOrId, { force });

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Image and associated variants deleted from Cloudflare R2',
          data: {
            deletedKeys: result.deletedKeys,
          },
        });
      }

      // Legacy ImageKit fallback if an ImageKit fileId was passed (e.g. 64-char ID without slashes)
      if (legacyImageKit && typeof legacyImageKit.deleteFile === 'function') {
        try {
          await legacyImageKit.deleteFile(keyOrId);
          return res.status(200).json({
            success: true,
            message: 'Image deleted from ImageKit (legacy)',
          });
        } catch (ikErr) {
          console.warn('[UploadController] ImageKit deletion error:', ikErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Image deletion handled successfully',
      });
    } catch (error) {
      console.error('[UploadController.deleteFile] Error:', error);
      return res.status(error.message?.includes('unauthorized') || error.message?.includes('Invalid') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to delete image',
        error: error.message,
      });
    }
  }

  /**
   * GET /upload/auth (Legacy compatibility)
   */
  async getAuthParams(req, res) {
    try {
      if (legacyImageKit && typeof legacyImageKit.getAuthenticationParameters === 'function') {
        const authenticationParameters = legacyImageKit.getAuthenticationParameters();
        return res.status(200).json({
          success: true,
          ...authenticationParameters,
          publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
          urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'R2 does not require client authentication parameters; uploads go through secure backend API.',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate authentication parameters',
        error: error.message,
      });
    }
  }
}

module.exports = new UploadController();
