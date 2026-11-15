const multer = require('multer');

// Store files in memory buffer for Sharp processing & Cloudflare R2 upload
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WEBP, GIF, and AVIF.`
      ),
      false
    );
  }
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024; // Default 10 MB
const maxFileCount = parseInt(process.env.MAX_FILE_COUNT, 10) || 10; // Default 10 files

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSize,
    files: maxFileCount,
  },
  fileFilter: fileFilter,
});

module.exports = upload;
