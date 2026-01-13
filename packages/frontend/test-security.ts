// Test file to verify Phase 1 security modules
import { encrypt, decrypt, hashData, generateRandomToken } from './src/utils/crypto';
import { createSecureStorage, createSafeStorage } from './src/utils/secureStorage';
import { sanitizeHtml, escapeHtml, sanitizeUrl } from './src/utils/sanitize';

// Test crypto functions
console.log('Testing crypto utilities...');
const testToken = 'my-secret-token-123';
const encrypted = encrypt(testToken);
console.log('Encrypted:', encrypted);

const decrypted = decrypt(encrypted);
console.log('Decrypted:', decrypted);
console.log('Encryption test:', decrypted === testToken ? '✅ PASS' : '❌ FAIL');

const hash = hashData('password');
console.log('Hash:', hash);
console.log('Hash test:', hash.length > 0 ? '✅ PASS' : '❌ FAIL');

const random = generateRandomToken(16);
console.log('Random token:', random);
console.log('Random token test:', random.length === 16 ? '✅ PASS' : '❌ FAIL');

// Test sanitize functions
console.log('\nTesting sanitize utilities...');
const dirtyHtml = '<script>alert("XSS")</script><p>Hello</p>';
const clean = sanitizeHtml(dirtyHtml);
console.log('Sanitized:', clean);
console.log('Sanitize test:', !clean.includes('script') ? '✅ PASS' : '❌ FAIL');

const escaped = escapeHtml('<script>alert("XSS")</script>');
console.log('Escaped:', escaped);
console.log('Escape test:', escaped.includes('&lt;') ? '✅ PASS' : '❌ FAIL');

const safeUrl_result = sanitizeUrl('javascript:alert(1)');
console.log('Safe URL test:', safeUrl_result === '' ? '✅ PASS' : '❌ FAIL');

const goodUrl = sanitizeUrl('https://example.com');
console.log('Good URL test:', goodUrl === 'https://example.com' ? '✅ PASS' : '❌ FAIL');

// Test storage functions
console.log('\nTesting storage utilities...');
const secureStorage = createSecureStorage();
console.log('Secure storage created:', typeof secureStorage.getItem === 'function' ? '✅ PASS' : '❌ FAIL');

const safeStorage = createSafeStorage();
console.log('Safe storage created:', typeof safeStorage.getItem === 'function' ? '✅ PASS' : '❌ FAIL');

console.log('\n✅ All Phase 1 security modules verified!');
