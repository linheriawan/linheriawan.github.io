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
		}
	}
};

export default config;
