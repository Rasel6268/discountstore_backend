const imagekit = require('../config/imagekit');

class UploadController {
  // Generate authentication parameters for client-side uploads if needed
  async getAuthParams(req, res) {
    try {
      const authenticationParameters = imagekit.getAuthenticationParameters();
      res.status(200).json({
        success: true,
        ...authenticationParameters,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      });
    } catch (error) {
      console.error('Error getting ImageKit auth params:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate authentication parameters',
        error: error.message,
      });
    }
  }

  // Upload a single image
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      const folder = req.body.folder || '/products';
      const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;

      const response = await imagekit.upload({
        file: req.file.buffer.toString('base64'),
        fileName: fileName,
        folder: folder,
        useUniqueFileName: true,
      });

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: response.url,
          fileId: response.fileId,
          name: response.name,
          size: response.size,
          filePath: response.filePath,
          thumbnailUrl: response.thumbnailUrl,
        },
      });
    } catch (error) {
      console.error('Error uploading image to ImageKit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error.message,
      });
    }
  }

  // Upload multiple images
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided',
        });
      }

      const folder = req.body.folder || '/products';

      const uploadPromises = req.files.map((file) => {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        return imagekit.upload({
          file: file.buffer.toString('base64'),
          fileName: fileName,
          folder: folder,
          useUniqueFileName: true,
        });
      });

      const responses = await Promise.all(uploadPromises);

      const uploadedData = responses.map((resItem) => ({
        url: resItem.url,
        fileId: resItem.fileId,
        name: resItem.name,
        size: resItem.size,
        filePath: resItem.filePath,
        thumbnailUrl: resItem.thumbnailUrl,
      }));

      res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        data: uploadedData,
      });
    } catch (error) {
      console.error('Error uploading multiple images to ImageKit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: error.message,
      });
    }
  }

  // Delete image by fileId
  async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'fileId is required',
        });
      }

      await imagekit.deleteFile(fileId);

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting image from ImageKit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image',
        error: error.message,
      });
    }
  }
}

module.exports = new UploadController();
