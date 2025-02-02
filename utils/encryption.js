const crypto = require('crypto');

module.exports = {
  encrypt : (text) => {
    const iv = crypto.randomBytes(16); // Generate a 16-byte IV
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`; // Store IV with ciphertext
  },

  decrypt : (encryptedText) => {
    try {
      const [ivHex, cipherText] = encryptedText.split(':');
      if (!ivHex || !cipherText) {
        throw new Error('Invalid encrypted text format');
      }
  
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
        iv
      );
      let decrypted = decipher.update(cipherText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('Decryption error:', err);
      throw new Error('Failed to decrypt data');
    }
  },
};