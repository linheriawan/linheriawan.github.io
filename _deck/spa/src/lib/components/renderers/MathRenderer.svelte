<script lang="ts">
	import katex from 'katex';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();
	let mathElement: HTMLDivElement;
	let renderedMath = $state<string>('');
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');

	// KaTeX configuration
	const katexOptions = {
		displayMode: false, // Will be determined per formula
		throwOnError: false,
		output: 'html',
		trust: false,
		strict: false,
		macros: {
			'\\RR': '\\mathbb{R}',
			'\\NN': '\\mathbb{N}',
			'\\ZZ': '\\mathbb{Z}',
			'\\QQ': '\\mathbb{Q}',
			'\\CC': '\\mathbb{C}'
		}
	};

	interface MathBlock {
		type: 'display' | 'inline';
		content: string;
		original: string;
	}

	function extractMathBlocks(text: string): MathBlock[] {
		const blocks: MathBlock[] = [];
		
		// Display math: $$...$$
		const displayMatches = text.matchAll(/\$\$([\s\S]*?)\$\$/g);
		for (const match of displayMatches) {
			blocks.push({
				type: 'display',
				content: match[1].trim(),
				original: match[0]
			});
		}

		// LaTeX display: \[...\]
		const latexDisplayMatches = text.matchAll(/\\\[([\s\S]*?)\\\]/g);
		for (const match of latexDisplayMatches) {
			blocks.push({
				type: 'display',
				content: match[1].trim(),
				original: match[0]
			});
		}

		// Inline math: $...$
		const inlineMatches = text.matchAll(/\$([^$\n]+?)\$/g);
		for (const match of inlineMatches) {
			blocks.push({
				type: 'inline',
				content: match[1].trim(),
				original: match[0]
			});
		}

		// LaTeX inline: \(...\)
		const latexInlineMatches = text.matchAll(/\\\((.*?)\\\)/g);
		for (const match of latexInlineMatches) {
			blocks.push({
				type: 'inline',
				content: match[1].trim(),
				original: match[0]
			});
		}

		return blocks;
	}

	function renderMath(text: string): string {
		if (!browser) return text;

		try {
			hasError = false;
			errorMessage = '';

			const mathBlocks = extractMathBlocks(text);
			
			if (mathBlocks.length === 0) {
				// Treat entire content as display math
				const rendered = katex.renderToString(text, {
					...katexOptions,
					displayMode: true
				});
				return `<div class="math-display">${rendered}</div>`;
			}

			let result = text;
			
			// Sort by position (longest first to avoid replacement conflicts)
			mathBlocks.sort((a, b) => b.original.length - a.original.length);

			for (const block of mathBlocks) {
				try {
					const rendered = katex.renderToString(block.content, {
						...katexOptions,
						displayMode: block.type === 'display'
					});

					const wrapper = block.type === 'display' 
						? `<div class="math-display">${rendered}</div>`
						: `<span class="math-inline">${rendered}</span>`;

					result = result.replace(block.original, wrapper);
				} catch (blockError) {
					console.error(`Error rendering math block: ${block.content}`, blockError);
					const errorWrapper = block.type === 'display'
						? `<div class="math-error">Error: ${block.content}</div>`
						: `<span class="math-error">Error: ${block.content}</span>`;
					result = result.replace(block.original, errorWrapper);
				}
			}

			return result;
		} catch (error) {
			console.error('Math rendering error:', error);
			hasError = true;
			errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			return `<div class="math-error">Error rendering math: ${text}</div>`;
		}
	}

	function copyMathSource() {
		navigator.clipboard.writeText(content).then(() => {
			// console.log('Math source copied to clipboard');
		}).catch(err => {
			console.error('Failed to copy math source:', err);
		});
	}

	onMount(() => {
		if (browser) {
			renderedMath = renderMath(content);
		}
	});

	// Re-render when content changes
	$effect(() => {
		if (browser) {
			renderedMath = renderMath(content);
		}
	});
</script>

{#if hasError}
	<div class="math-renderer renderer-content error">
		<div class="error-header">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="15" y1="9" x2="9" y2="15"></line>
				<line x1="9" y1="9" x2="15" y2="15"></line>
			</svg>
			Math Rendering Error
		</div>
		<div class="error-message">{errorMessage}</div>
		<details class="error-details">
			<summary>LaTeX Source</summary>
			<pre class="error-code">{content}</pre>
		</details>
	</div>
{:else}
	<div class="math-renderer renderer-content">
		<div class="math-header">
			<span class="math-label">Mathematical Expression</span>
			<button 
				class="copy-button" 
				onclick={copyMathSource}
				title="Copy LaTeX source"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
				</svg>
			</button>
		</div>
		<div class="math-content" bind:this={mathElement}>
			{@html renderedMath}
		</div>
	</div>
{/if}

<style>
	.math-renderer {
		margin: 0.8rem 0;
		border-radius: 8px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.math-renderer.error {
		border-color: rgba(255, 123, 114, 0.3);
		background-color: rgba(255, 123, 114, 0.05);
	}

	.math-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.math-label {
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		text-transform: uppercase;
		font-weight: 600;
		font-size: 0.7rem;
		letter-spacing: 0.5px;
	}

	.copy-button {
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

	.copy-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	.math-content {
		padding: 1.5rem;
		text-align: center;
		overflow-x: auto;
	}

	.error-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
		color: #ff7b72;
		padding: 1rem 1rem 0 1rem;
	}

	.error-message {
		background-color: rgba(255, 123, 114, 0.1);
		padding: 0.8rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 123, 114, 0.3);
		margin: 0 1rem 0.8rem 1rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.85rem;
		color: #ff7b72;
	}

	.error-details {
		margin: 0 1rem 1rem 1rem;
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

	/* KaTeX styling for dark theme */
	:global(.math-renderer .katex) {
		color: #ffffff;
		font-size: 1.1em;
	}

	:global(.math-renderer .math-display) {
		margin: 1rem 0;
		padding: 0.5rem;
		border-radius: 6px;
		background-color: rgba(255, 255, 255, 0.02);
	}

	:global(.math-renderer .math-inline) {
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		background-color: rgba(255, 255, 255, 0.05);
		display: inline-block;
		margin: 0 0.1rem;
	}

	:global(.math-renderer .math-error) {
		color: #ff7b72;
		background-color: rgba(255, 123, 114, 0.1);
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
		border: 1px solid rgba(255, 123, 114, 0.3);
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
	}

	/* Override KaTeX colors for dark theme */
	:global(.math-renderer .katex .mord),
	:global(.math-renderer .katex .mop),
	:global(.math-renderer .katex .mbin),
	:global(.math-renderer .katex .mrel),
	:global(.math-renderer .katex .mopen),
	:global(.math-renderer .katex .mclose),
	:global(.math-renderer .katex .mpunct) {
		color: #ffffff;
	}

	:global(.math-renderer .katex .accent-body) {
		color: #79c0ff;
	}

	:global(.math-renderer .katex .frac-line) {
		border-bottom-color: #ffffff;
	}

	:global(.math-renderer .katex .sqrt > .sqrt-line) {
		border-top-color: #ffffff;
	}

	/* Scrollbar styling */
	.math-content::-webkit-scrollbar {
		height: 8px;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.math-content::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.math-content::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.5);
	}
</style>