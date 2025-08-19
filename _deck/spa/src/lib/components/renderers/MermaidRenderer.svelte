<script lang="ts">
	import mermaid from 'mermaid';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();
	let mermaidElement: HTMLDivElement;
	let renderedSvg = $state<string>('');
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');

	// Initialize Mermaid with dark theme
	let mermaidInitialized = false;

	function initializeMermaid() {
		if (!browser || mermaidInitialized) return;

		mermaid.initialize({
			theme: 'dark',
			themeVariables: {
				// Custom theme variables for chat UI
				darkMode: true,
				primaryColor: '#0b69a3',
				primaryTextColor: '#ffffff',
				primaryBorderColor: '#565869',
				lineColor: '#a0a0a0',
				sectionBkgColor: '#444654',
				altSectionBkgColor: '#343541',
				gridColor: '#565869',
				secondaryColor: '#565869',
				tertiaryColor: '#343541',
				background: 'transparent',
				mainBkg: 'transparent',
				secondBkg: '#444654',
				tertiaryBkg: '#343541'
			},
			fontFamily: 'inherit',
			fontSize: 14,
			flowchart: {
				useMaxWidth: true,
				htmlLabels: true,
				curve: 'basis'
			},
			sequence: {
				useMaxWidth: true,
				rightAngles: false,
				showSequenceNumbers: true
			},
			gantt: {
				useMaxWidth: true,
				leftPadding: 75,
				rightPadding: 20
			},
			er: {
				useMaxWidth: true
			},
			journey: {
				useMaxWidth: true
			},
			gitgraph: {
				useMaxWidth: true
			}
		});

		mermaidInitialized = true;
	}

	function extractMermaidCode(text: string): string {
		// Extract from ```mermaid code blocks
		const mermaidMatch = text.match(/```mermaid\s*\n([\s\S]*?)```/i);
		if (mermaidMatch) {
			return mermaidMatch[1].trim();
		}

		// Return as-is if it's already mermaid syntax
		return text.trim();
	}

	async function renderMermaid(mermaidCode: string) {
		if (!browser || !mermaidInitialized) return;

		try {
			isLoading = true;
			hasError = false;
			errorMessage = '';

			// Generate unique ID for this diagram
			const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			// Validate and render
			const { svg } = await mermaid.render(id, mermaidCode);
			
			renderedSvg = svg;
		} catch (error) {
			console.error('Mermaid rendering error:', error);
			hasError = true;
			errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			renderedSvg = '';
		} finally {
			isLoading = false;
		}
	}

	function downloadSvg() {
		if (!renderedSvg) return;

		const blob = new Blob([renderedSvg], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'mermaid-diagram.svg';
		a.click();
		URL.revokeObjectURL(url);
	}

	onMount(() => {
		if (browser) {
			initializeMermaid();
			const mermaidCode = extractMermaidCode(content);
			renderMermaid(mermaidCode);
		}
	});

	// Re-render when content changes
	$effect(() => {
		if (browser && mermaidInitialized) {
			const mermaidCode = extractMermaidCode(content);
			renderMermaid(mermaidCode);
		}
	});
</script>

<div class="mermaid-renderer renderer-content">
	{#if hasError}
		<div class="error-container">
			<div class="error-header">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				Mermaid Rendering Error
			</div>
			<div class="error-message">{errorMessage}</div>
			<details class="error-details">
				<summary>Mermaid Code</summary>
				<pre class="error-code">{extractMermaidCode(content)}</pre>
			</details>
		</div>
	{:else if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<span>Rendering diagram...</span>
		</div>
	{:else if renderedSvg}
		<div class="diagram-container">
			<div class="diagram-header">
				<span class="diagram-label">Mermaid Diagram</span>
				<button 
					class="download-button" 
					onclick={downloadSvg}
					title="Download SVG"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="7,10 12,15 17,10"></polyline>
						<line x1="12" y1="15" x2="12" y2="3"></line>
					</svg>
				</button>
			</div>
			<div class="diagram-content" bind:this={mermaidElement}>
				{@html renderedSvg}
			</div>
		</div>
	{/if}
</div>

<style>
	.mermaid-renderer {
		margin: 0;
		border-radius: 8px 8px 0 0;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.diagram-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.diagram-label {
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		text-transform: uppercase;
		font-weight: 600;
		font-size: 0.7rem;
		letter-spacing: 0.5px;
	}

	.download-button {
		background: none;
		border: none;
		color: #a0a0a0;
		cursor: pointer;
		padding: 0.3rem;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.download-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	.diagram-content {
		padding: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100px;
		overflow-x: auto;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		color: #a0a0a0;
		gap: 1rem;
	}

	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top: 2px solid #0b69a3;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-container {
		padding: 1rem;
		color: #ff7b72;
	}

	.error-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.error-message {
		background-color: rgba(255, 123, 114, 0.1);
		padding: 0.8rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 123, 114, 0.3);
		margin-bottom: 0.8rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.85rem;
	}

	.error-details {
		margin-top: 0.8rem;
	}

	.error-details summary {
		cursor: pointer;
		font-weight: 600;
		padding: 0.4rem 0;
		color: #a0a0a0;
	}

	.error-code {
		background-color: rgba(0, 0, 0, 0.4);
		padding: 0.8rem;
		border-radius: 6px;
		margin-top: 0.5rem;
		overflow-x: auto;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.8rem;
		color: #f8f8f2;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Style the rendered SVG */
	:global(.mermaid-renderer svg) {
		max-width: 100%;
		height: auto;
		background-color: transparent;
	}

	/* Ensure text in diagrams is visible */
	:global(.mermaid-renderer .nodeLabel),
	:global(.mermaid-renderer .edgeLabel),
	:global(.mermaid-renderer text) {
		fill: #ffffff !important;
		font-family: inherit;
	}

	/* Scrollbar styling */
	.diagram-content::-webkit-scrollbar {
		height: 8px;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.diagram-content::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.diagram-content::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.5);
	}
</style>