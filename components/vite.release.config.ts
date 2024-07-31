import { defineConfig } from 'vite';
import dtsPlugin from 'vite-plugin-dts';

import packageJson from './package.json';

export default defineConfig({
    build: {
        lib: {
            formats: ['es'],
            entry: {
                'dashboard-components': 'src/index.ts',
            },
        },
        sourcemap: true,
        minify: false,
        rollupOptions: {
            external: Object.keys(packageJson.dependencies),
        },
    },
    plugins: [dtsPlugin({ rollupTypes: true })],
});
