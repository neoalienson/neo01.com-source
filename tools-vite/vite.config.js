import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function generateHtmlPlugin() {
  return {
    name: 'generate-html',
    closeBundle() {
      const outDir = resolve(__dirname, '../../neo01.com/hexo-blog/public/tools/case-converter');
      const templates = [
        { name: 'index', lang: 'en', title: 'Case Converter' },
        { name: 'index.zh-CN', lang: 'zh-CN', title: '命名转换器' },
        { name: 'index.zh-TW', lang: 'zh-TW', title: '命名轉換器' },
      ];

      templates.forEach(({ name, lang, title }) => {
        const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/css/tools-common.css">
  <link rel="stylesheet" href="/tools/case-converter/style.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/tools/case-converter/assets/${name}.js"></script>
</body>
</html>`;
        fs.writeFileSync(resolve(outDir, `${name}.html`), html);
      });
    }
  };
}

export default defineConfig({
  plugins: [
    mdx({
      providerImportSource: '@mdx-js/react',
    }),
    react(),
    generateHtmlPlugin(),
  ],

  build: {
    outDir: resolve(__dirname, '../../neo01.com/hexo-blog/public/tools/case-converter'),
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },

    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/main.jsx'),
        'index.zh-CN': resolve(__dirname, 'src/main.zh-CN.jsx'),
        'index.zh-TW': resolve(__dirname, 'src/main.zh-TW.jsx'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        hoistTransitiveImports: false,
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});