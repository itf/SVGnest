import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    root: path.resolve(__dirname, '../..'),
    publicDir: 'assets',
    define: {
        'process.env': {},
        'process.env.NODE_ENV': JSON.stringify('production')
    },
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        cssCodeSplit: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false,
                drop_debugger: true,
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        },
        lib: {
            entry: path.resolve(__dirname, 'src/index.tsx'),
            name: 'webInterface',
            formats: ['umd'],
            fileName: () => 'web-interface.js'
        },
        rollupOptions: {
            external: ['polygon-packer', 'svg-parser'],
            output: {
                globals: {
                    'polygon-packer': 'polygonPacker',
                    'svg-parser': 'svgParser'
                }
            }
        },
        sourcemap: true
    },
    css: {
        preprocessorOptions: {
            scss: {
                // Add any SCSS options if needed
            }
        }
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    }
});
