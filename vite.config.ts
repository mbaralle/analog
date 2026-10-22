import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Keep Svelte 4's runtime intact: bundling changes the lifecycle function text
	// used by SvelteKit to distinguish legacy components from Svelte 5 runes.
	ssr: { external: ['svelte'] }
});
