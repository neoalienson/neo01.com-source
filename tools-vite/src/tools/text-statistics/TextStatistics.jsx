export function getTextStats(text) {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
  const lines = text.split('\n').length;
  const estimatedTokens = Math.ceil(charactersNoSpaces / 4);
  const readingTimeMinutes = Math.ceil(words / 200);
  const avgWordLength = words > 0 ? (charactersNoSpaces / words).toFixed(2) : '0';

  const wordMatches = text.match(/[a-zA-Z0-9]+/g);
  const longestWord = wordMatches && wordMatches.length > 0
    ? wordMatches.reduce((longest, word) => word.length > longest.length ? word : longest, '')
    : '';

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    estimatedTokens,
    readingTimeMinutes,
    avgWordLength,
    longestWord
  };
}