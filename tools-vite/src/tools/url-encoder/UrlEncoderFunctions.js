export function encodeText(text) {
  return encodeURIComponent(text);
}

export function decodeText(text) {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    return null;
  }
}