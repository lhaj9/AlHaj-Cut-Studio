import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      exclude: [
        '@imgly/background-removal',
        '@huggingface/transformers',
        'onnxruntime-web',
        '@gradio/client',
      ],
    },
    build: {
      target: 'es2022',
      cssCodeSplit: false,
      assetsInlineLimit: 0,
      rollupOptions: {
        external: [
          '@imgly/background-removal',
          '@huggingface/transformers',
          'onnxruntime-web',
          '@gradio/client',
        ],
        output: {
          format: 'iife',
          entryFileNames: 'assets/js/app.js',
          chunkFileNames: 'assets/js/[name].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] || assetInfo.name || '';
            if (name.endsWith('.css')) {
              return 'assets/css/app.css';
            }
            if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) {
              return 'assets/fonts/[name][extname]';
            }
            if (/\.(png|jpe?g|webp|avif|gif)$/i.test(name)) {
              return 'assets/images/[name][extname]';
            }
            if (/\.svg$/i.test(name)) {
              return 'assets/icons/[name][extname]';
            }
            return 'assets/[name][extname]';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
  };
});
