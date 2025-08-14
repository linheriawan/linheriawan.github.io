import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		prerender: {
			entries: ['*'] // prerender all pages
		},
		// Disable server-side rendering for SPA behavior
		ssr: false
	}
};

export default config;
