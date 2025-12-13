// const AWS = require('aws-sdk'); // Commented out until DigitalOcean Spaces is implemented

// DigitalOcean Spaces configuration
const spacesConfig = {
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  endpoint: process.env.DO_SPACES_ENDPOINT || 'syd1.digitaloceanspaces.com',
  bucketName: process.env.DO_SPACES_BUCKET || 'weighbuddy-storage',
  originEndpoint: 'https://weighbuddy-storage.syd1.digitaloceanspaces.com'
};

// Configure AWS SDK for DigitalOcean Spaces (commented out until implementation)
// const spacesEndpoint = new AWS.Endpoint(spacesConfig.endpoint);
// const s3 = new AWS.S3({
//   endpoint: spacesEndpoint,
//   accessKeyId: spacesConfig.accessKeyId,
//   secretAccessKey: spacesConfig.secretAccessKey,
//   region: 'syd1',
//   s3ForcePathStyle: false,
//   signatureVersion: 'v4'
// });

// Helper function to generate unique filename
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = originalName.split('.').pop();
  return `compliance-plates/compliance-${timestamp}-${random}.${extension}`;
};

// Helper function to get public URL
const getPublicUrl = (fileName) => {
  return `${spacesConfig.originEndpoint}/${fileName}`;
};

// Upload file to DigitalOcean Spaces (commented out until implementation)
// const uploadToSpaces = (file, fileName) => {
//   return new Promise((resolve, reject) => {
//     const uploadParams = {
//       Bucket: spacesConfig.bucketName,
//       Key: fileName,
//       Body: file.buffer,
//       ContentType: file.mimetype,
//       ACL: 'public-read' // Make the file publicly accessible
//     };

//     s3.upload(uploadParams, (err, data) => {
//       if (err) {
//         console.error('Error uploading to DigitalOcean Spaces:', err);
//         reject(err);
//       } else {
//         console.log('Successfully uploaded to DigitalOcean Spaces:', data.Location);
//         resolve(data);
//       }
//     });
//   });
// };

// Delete file from DigitalOcean Spaces (commented out until implementation)
// const deleteFromSpaces = (fileName) => {
//   return new Promise((resolve, reject) => {
//     const deleteParams = {
//       Bucket: spacesConfig.bucketName,
//       Key: fileName
//     };

//     s3.deleteObject(deleteParams, (err, data) => {
//       if (err) {
//         console.error('Error deleting from DigitalOcean Spaces:', err);
//         reject(err);
//       } else {
//         console.log('Successfully deleted from DigitalOcean Spaces:', fileName);
//         resolve(data);
//       }
//     });
//   });
// };

module.exports = {
  // s3, // Commented out until AWS SDK is available
  spacesConfig,
  generateFileName,
  getPublicUrl
  // uploadToSpaces, // Commented out until DigitalOcean Spaces is implemented
  // deleteFromSpaces // Commented out until DigitalOcean Spaces is implemented
};
