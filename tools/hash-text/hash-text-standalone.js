(function() {
  function computeHashes(text) {
    if (typeof CryptoJS === 'undefined') return;
    var hashes = {
      md5: CryptoJS.MD5(text).toString(),
      sha1: CryptoJS.SHA1(text).toString(),
      sha256: CryptoJS.SHA256(text).toString(),
      sha512: CryptoJS.SHA512(text).toString(),
      sha3_256: CryptoJS.SHA3(text, { outputLength: 256 }).toString(),
      sha3_512: CryptoJS.SHA3(text, { outputLength: 512 }).toString(),
      ripemd160: CryptoJS.RIPEMD160(text).toString()
    };
    var labels = {md5: 'MD5', sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512', sha3_256: 'SHA-3-256', sha3_512: 'SHA-3-512', ripemd160: 'RIPEMD-160'};
    var container = document.getElementById('hash-text-root');
    if (!container) return;
    var lang = container.getAttribute('data-lang') || 'en';
    var titles = {en: {label: 'Text to hash:', placeholder: 'Enter your text here...'}, 'zh-CN': {label: '要哈希的文本：', placeholder: '在此输入文本...'}, 'zh-TW': {label: '要雜湊的文字：', placeholder: '在此輸入文字...'}};
    var title = titles[lang] || titles.en;
    var html = '<div class="tool_main"><div class="input-group"><label for="hashInput">' + title.label + '</label><textarea id="hashInput" rows="4" placeholder="' + title.placeholder + '"></textarea></div><div class="output-grid">';
    for (var key in hashes) {
      html += '<div class="hash-result"><div class="hash-name">' + labels[key] + '</div><div class="hash-output" id="hash-' + key + '">' + hashes[key] + '</div></div>';
    }
    html += '</div></div>';
    container.innerHTML = html;

    document.getElementById('hashInput').addEventListener('input', function(e) {
      computeHashes(e.target.value);
    });
  }
  window.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('hash-text-root');
    if (container && container.getAttribute('data-hash-text')) {
      computeHashes('Hello World!');
    }
  });
})();