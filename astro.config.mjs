// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
    // Static site generation - todas las APIs están en el backend
    output: 'static',
    site: 'https://aquicreamos.com',
    trailingSlash: 'ignore',
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
