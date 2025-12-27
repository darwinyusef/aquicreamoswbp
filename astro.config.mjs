// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    // Habilitar SSR para APIs con SQLite
    output: 'server',
    adapter: node({
        mode: 'standalone'
    }),
    vite: {
        plugins: [tailwindcss()],
    },
    markdown: {
        shikiConfig: {
            theme: 'github-dark',
            wrap: true
        },
        remarkPlugins: [],
        rehypePlugins: [],
    },
});
