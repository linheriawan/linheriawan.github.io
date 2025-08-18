<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	interface Props {
		sessionId?: string;  // Optional - falls back to URL param
		scale?: number;      // Optional - for editor preview scaling
	}

	let { sessionId, scale = 1 }: Props = $props();
	let presentationHtml = $state<string>('');
	let marpSource = $state<string>('');
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');

	// Get session ID from prop or URL
	$effect(() => {
		if (browser) {
			const id = sessionId || $page.url.searchParams.get('id');
			if (id) {
				loadFromSession(id);
			}
		}
	});

	// Watch session storage for changes (seamless reactivity)
	$effect(() => {
		if (browser && sessionId) {
			const interval = setInterval(() => {
				const currentSource = sessionStorage.getItem(sessionId);
				if (currentSource && currentSource !== marpSource) {
					marpSource = currentSource;
					renderPresentation();
				}
			}, 1000); // Check every second

			return () => clearInterval(interval);
		}
	});

	async function loadFromSession(id: string) {
		try {
			isLoading = true;
			hasError = false;

			const source = sessionStorage.getItem(id);
			if (!source) {
				throw new Error('Presentation not found in session storage');
			}

			marpSource = source;
			await renderPresentation();
		} catch (error: any) {
			console.error('Load error:', error);
			hasError = true;
			errorMessage = error.message;
		} finally {
			isLoading = false;
		}
	}

	async function renderPresentation() {
		if (!browser || !marpSource.trim()) return;

		try {
			const { Marp } = await import('@marp-team/marp-core');
			const marp = new Marp({
				html: true,
				emoji: { shortcode: true, unicode: true },
				math: 'katex'
			});

			// Ensure proper Marp directives with default theme
			let processedSource = marpSource;
			if (!processedSource.includes('---') && !processedSource.includes('marp:')) {
				processedSource = `---
marp: true
theme: default
paginate: true
---

${processedSource}`;
			}

			const { html, css } = marp.render(processedSource);
			
			// Inject the CSS into the document head for proper styling
			const existingStyle = document.getElementById('marp-styles');
			if (existingStyle) {
				existingStyle.remove();
			}
			
			const styleElement = document.createElement('style');
			styleElement.id = 'marp-styles';
			styleElement.textContent = css;
			document.head.appendChild(styleElement);
			
			presentationHtml = html;

		} catch (error: any) {
			console.error('Render error:', error);
			hasError = true;
			errorMessage = error.message;
		}
	}
</script>

<div class="scroll-view" style="transform: scale({scale});">
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<span>Loading presentation...</span>
		</div>
	{:else if hasError}
		<div class="error-container">
			<h3>Presentation Error</h3>
			<p>{errorMessage}</p>
		</div>
	{:else}
		<div class="presentation-container">
			{@html presentationHtml}
		</div>
	{/if}
</div>

<style>
	.presentation-container :global(.marpit > svg) {
		margin: 2rem auto !important;
		display: block !important;
	}
	
	.presentation-container :global(.marpit) {
		padding: 1rem 0 !important;
	}
	.scroll-view {
		width: 100%;
		height: 100%;
		transform-origin: top center;
	}

	.presentation-container {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		scroll-behavior: smooth;
		/* Let Marp CSS handle background and colors */
	}

	.presentation-container :global(section) {
		/* Minimal override - let Marp themes control everything else */
		border-bottom: 1px solid rgba(128, 128, 128, 0.2);
		margin-bottom: 1rem;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #a0a0a0;
		gap: 1rem;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.2);
		border-top: 3px solid #0b69a3;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #ff7b72;
		text-align: center;
		padding: 2rem;
	}

	.error-container h3 {
		margin-bottom: 1rem;
	}
</style>