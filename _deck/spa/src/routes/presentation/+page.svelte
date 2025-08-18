<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import SlideView from '$lib/components/presentation/SlideView.svelte';
	import ScrollView from '$lib/components/presentation/ScrollView.svelte';
	import EditorView from '$lib/components/presentation/EditorView.svelte';

	let viewMode = $state<'slide' | 'scroll' | 'editor'>('slide');
	let sessionId = $state<string>('');
	let marpSource = $state<string>('');
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');

	onMount(async () => {
		if (!browser) return;

		try {
			// Get session ID from URL
			const idParam = $page.url.searchParams.get('id');
			const sourceParam = $page.url.searchParams.get('source');
			
			if (idParam) {
				sessionId = idParam;
				// Verify session storage has content
				const source = sessionStorage.getItem(idParam);
				if (!source) {
					throw new Error('Presentation not found in session storage');
				}
				marpSource = source;
			} else if (sourceParam) {
				// Fallback: decode from URL (for backward compatibility) 
				marpSource = decodeURIComponent(atob(sourceParam));
				// Store in session storage for component consistency
				sessionId = `marp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
				sessionStorage.setItem(sessionId, marpSource);
			} else {
				throw new Error('No presentation source provided');
			}

			isLoading = false;

		} catch (error: any) {
			console.error('Presentation error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to load presentation';
			isLoading = false;
		}
	});

	function downloadMarkdown() {
		if (!browser || !marpSource.trim()) return;
		
		try {
			// Ensure proper Marp directives
			let processedSource = marpSource;
			if (!processedSource.includes('---') && !processedSource.includes('marp:')) {
				processedSource = `---
marp: true
theme: default
paginate: true
---

${processedSource}`;
			}

			// Download the markdown file
			const blob = new Blob([processedSource], { type: 'text/markdown' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `presentation-${Date.now()}.md`;
			link.click();
			URL.revokeObjectURL(url);
			
		} catch (error: any) {
			console.error('Download error:', error);
			alert(`Error downloading presentation: ${error.message}`);
		}
	}
</script>

<svelte:head>
	<title>Marp Presentation</title>
</svelte:head>

<div class="presentation-app">
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<span>Loading presentation...</span>
		</div>
	{:else if hasError}
		<div class="error-container">
			<h1>Presentation Error</h1>
			<p>{errorMessage}</p>
			<button onclick={() => window.close()}>Close</button>
		</div>
	{:else}
		<!-- View Mode Buttons -->
		<div class="view-mode-buttons">
			<button 
				class="view-button" 
				class:active={viewMode === 'slide'}
				onclick={() => viewMode = 'slide'}
				title="Slide view"
			>
				📋
			</button>
			<button 
				class="view-button" 
				class:active={viewMode === 'scroll'}
				onclick={() => viewMode = 'scroll'}
				title="Scroll view"
			>
				📜
			</button>
			<button 
				class="view-button" 
				class:active={viewMode === 'editor'}
				onclick={() => viewMode = 'editor'}
				title="Split editor view"
			>
				📝
			</button>
		</div>

		<!-- Download Button -->
		<div class="download-actions">
			<button class="download-button" onclick={downloadMarkdown} title="Download Markdown file">
				⬇️ Download .md
			</button>
			<div class="cli-info">
				Convert to PDF/PPTX: <code>marp presentation.md -o output.pdf</code>
			</div>
		</div>

		<!-- Presentation Content -->
		<div class="presentation-content">
			{#if viewMode === 'slide'}
				<SlideView sessionId={sessionId} />
			{:else if viewMode === 'scroll'}
				<ScrollView sessionId={sessionId} />
			{:else if viewMode === 'editor'}
				<EditorView sessionId={sessionId} />
			{/if}
		</div>
	{/if}
</div>

<style>
	.presentation-app {
		width: 100vw;
		height: 100vh;
		background: #1a1a1a;
		color: white;
		overflow: hidden;
		position: relative;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.loading-container, .error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
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

	.presentation-content {
		width: 100%;
		height: 100%;
		position: relative;
	}

	/* Download Actions */
	.download-actions {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 999;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.download-button {
		background: #0b69a3;
		border: none;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 500;
		transition: background 0.2s ease;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.download-button:hover {
		background: #085a8a;
	}

	.cli-info {
		background: rgba(0, 0, 0, 0.8);
		padding: 0.4rem 0.6rem;
		border-radius: 4px;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		max-width: 200px;
		text-align: center;
		line-height: 1.3;
	}

	.cli-info code {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.1rem 0.3rem;
		border-radius: 2px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.6rem;
		color: #a5d6ff;
	}

	.error-container button {
		background: #0b69a3;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
	}

	.error-container button:hover {
		background: #085a8a;
	}

	/* View Mode Buttons */
	.view-mode-buttons {
		position: fixed;
		top: 1rem;
		left: 1rem;
		display: flex;
		flex-direction: row;
		gap: 0;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.8);
		border-radius: 12px;
		padding: 0.5rem;
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.view-button {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.1rem;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		height: 40px;
	}

	.view-button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		transform: scale(1.05);
	}

	.view-button.active {
		background: #0b69a3;
		color: white;
		box-shadow: 0 0 8px rgba(11, 105, 163, 0.4);
	}

</style>