const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { S3Client } = require('@aws-sdk/client-s3');

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'discountstore-media';
const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.warn(
    '[WARN] Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are not fully set in .env'
  );
}

// Initialize AWS S3 Client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

module.exports = {
  r2Client,
  bucketName,
  publicUrl,
  accountId,
};
