## Encryption Implementation

- Algorithm: AES-256-CBC
- Key Management:
  - 256-bit encryption key stored in ENCRYPTION_KEY
  - 128-bit IV stored in IV
  - Keys rotated quarterly
- Password Handling:
  - Encrypted at rest
  - Decrypted only during purchase transaction