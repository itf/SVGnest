import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
    {
        input: 'src/index.ts',
        output: {
            file: 'dist-debug/polygon-packer.js',
            format: 'umd',
            name: 'polygonPacker',
            sourcemap: true
        },
        plugins: [
            resolve({ extensions: ['.ts', '.js'] }),
            commonjs(),
            typescript({ tsconfig: './tsconfig.json', sourceMap: true, inlineSources: true })
        ]
    },
    {
        input: 'src/nest.worker.ts',
        output: {
            file: 'dist-debug/polygon-packer.calc.js',
            format: 'es',
            sourcemap: true
        },
        plugins: [
            resolve({ extensions: ['.ts', '.js'] }),
            commonjs(),
            typescript({ tsconfig: './tsconfig.json', sourceMap: true, inlineSources: true })
        ]
    }
];
