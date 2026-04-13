export function encodeBase64(text, urlSafe = false) {
  try {
    const encoded = btoa(unescape(encodeURIComponent(text)));
    if (urlSafe) {
      return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    return encoded;
  } catch {
    throw new Error('Failed to encode text');
  }
}

export function decodeBase64(base64, urlSafe = false) {
  try {
    let normalized = base64;
    if (urlSafe) {
      normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
      while (normalized.length % 4) {
        normalized += '=';
      }
    }
    return decodeURIComponent(escape(atob(normalized)));
  } catch {
    throw new Error('Invalid Base64 string');
  }
}

export function isBase64(str) {
  if (!str || str.trim() === '') return false;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str.replace(/\s/g, ''));
}