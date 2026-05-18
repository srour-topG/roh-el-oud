const crypto = require("crypto");
const fs = require("fs");

const algorithm = "aes-256-gcm";
const password = process.env.IMAGE_PASSWORD;
if (!password) throw new Error("IMAGE_PASSWORD environment variable not set");

// Derive a 32-byte key from the password using scrypt
function getKey() {
  return crypto.scryptSync(password, "salt", 32);
}

/**
 * Encrypt a buffer and write to file
 * @param {Buffer} buffer - plaintext image data
 * @param {string} outputPath - full path to save encrypted file
 */
function encryptFile(buffer, outputPath) {
  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  fs.writeFileSync(outputPath, combined);
}

/**
 * Read and decrypt an encrypted file
 * @param {string} filePath - full path to encrypted file
 * @returns {Buffer} decrypted image buffer
 */
function decryptFile(filePath) {
  const data = fs.readFileSync(filePath);
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const key = getKey();
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

module.exports = { encryptFile, decryptFile };
