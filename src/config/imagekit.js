const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_kKqKQD4iGLdWfVxYOgi1C7bQrV4=',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_ZyjcwBnXOO2bpjyI33wHe2qbv+g=',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/Soclav',
});

module.exports = imagekit;
