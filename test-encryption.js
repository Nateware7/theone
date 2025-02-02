const { encrypt, decrypt } = require('./utils/encryption'); // Adjust the path as needed

// Test data
const testEmail = 'test@example.com';

// Step 1: Encrypt the data
const encrypted = encrypt(testEmail);
console.log('Encrypted:', encrypted);

// Step 2: Decrypt the data
const decrypted = decrypt(encrypted);
console.log('Decrypted:', decrypted);

// Step 3: Verify the result
if (decrypted === testEmail) {
  console.log('✅ Encryption and decryption working correctly!');
} else {
  console.log('❌ Encryption and decryption failed!');
}