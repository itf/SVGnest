import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
    // Main bundle
    {
        input: 'src/index.ts',
        output: {
            file: '../../dist/polygon-packer.js',
            format: 'umd',
            name: 'polygonPacker',
            sourcemap: true
        },
        plugins: [
            resolve({
                extensions: ['.ts', '.js']
            }),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                sourceMap: true,
                inlineSources: true
            }),
            terser({
                compress: {
                    passes: 2,
                    pure_getters: true,
                    unsafe: true
                },
                mangle: {
                    properties: {
                        regex: /^#/
                    }
                },
                format: {
                    comments: false
                }
            })
        ]
    },
    // Worker bundle
    {
        input: 'src/nest.worker.ts',
        output: {
            file: '../../dist/polygon-packer.calc.js',
            format: 'es',
            sourcemap: true
        },
        plugins: [
            resolve({
                extensions: ['.ts', '.js']
            }),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                sourceMap: true,
                inlineSources: true
            }),
            terser({
                compress: {
                    passes: 2,
                    pure_getters: true,
                    unsafe: true
                },
                mangle: {
                    properties: {
                        regex: /^#/
                    }
                },
                format: {
                    comments: false
                }
            })
        ]
    }
];
