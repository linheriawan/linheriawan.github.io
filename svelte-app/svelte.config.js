import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-static is used for GitHub Pages deployment
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),
		paths: {
			// Leave base empty for username.github.io repos
			// For project repos, use: base: '/repo-name'
			base: ''
		},
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore 404s for links to files that don't exist yet
				if (path.startsWith('/project/') ||
					path.startsWith('/pdf/') ||
					path.endsWith('.txt') ||
					path.endsWith('.pdf')) {
					return;
				}
				throw new Error(message);
			},
			handleMissingId: 'ignore'
		}
	}
};

export default config;
