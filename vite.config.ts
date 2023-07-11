import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	plugins: [
		sveltekit(),
		nodePolyfills({
			globals: {
				Buffer: true, // can also be 'build', 'dev', or false
				global: true,
				process: true
			},
			protocolImports: true
		})
	]
});
