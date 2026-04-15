import CryptoJS from 'crypto-js';

export function md5Hash(text) {
  return CryptoJS.MD5(text).toString();
}

export function sha1Hash(text) {
  return CryptoJS.SHA1(text).toString();
}

export function sha256Hash(text) {
  return CryptoJS.SHA256(text).toString();
}

export function sha512Hash(text) {
  return CryptoJS.SHA512(text).toString();
}

export function sha3_256Hash(text) {
  return CryptoJS.SHA3(text, { outputLength: 256 }).toString();
}

export function sha3_512Hash(text) {
  return CryptoJS.SHA3(text, { outputLength: 512 }).toString();
}

export function ripemd160Hash(text) {
  return CryptoJS.RIPEMD160(text).toString();
}

export function generateAllHashes(text) {
  return {
    md5: md5Hash(text),
    sha1: sha1Hash(text),
    sha256: sha256Hash(text),
    sha512: sha512Hash(text),
    sha3_256: sha3_256Hash(text),
    sha3_512: sha3_512Hash(text),
    ripemd160: ripemd160Hash(text)
  };
}