// afriX_backend/src/services/r2Service.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types"); // npm install mime-types
const { v4: uuidv4 } = require("uuid");

const r2Client = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ||
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const uploadToR2 = async (fileBuffer, originalName, folder) => {
  const ext = originalName.split(".").pop();
  const mimeType = mime.lookup(originalName) || "application/octet-stream";
  const key = `${folder}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    // ContentType: `image/${ext}`,
    ContentType: mimeType,
    ACL: "public-read",
  });

  await r2Client.send(command);

  return `${process.env.R2_PUBLIC_URL}/${key}`;
};

module.exports = { uploadToR2 };
