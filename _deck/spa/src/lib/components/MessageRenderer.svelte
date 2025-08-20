<script lang="ts">
	import { onMount } from 'svelte';
	import MarkdownRenderer from './renderers/MarkdownRenderer.svelte';
	import CodeRenderer from './renderers/CodeRenderer.svelte';
	import MermaidRenderer from './renderers/MermaidRenderer.svelte';
	import MathRenderer from './renderers/MathRenderer.svelte';
	import ImageRenderer from './renderers/ImageRenderer.svelte';
	import ChartRenderer from './renderers/ChartRenderer.svelte';
	import TableRenderer from './renderers/TableRenderer.svelte';
	import PDFRenderer from './renderers/PDFRenderer.svelte';
	import TimelineRenderer from './renderers/TimelineRenderer.svelte';
	import MediaRenderer from './renderers/MediaRenderer.svelte';
	import URLPreviewRenderer from './renderers/URLPreviewRenderer.svelte';
	import FileRenderer from './renderers/FileRenderer.svelte';

	interface Props {
		content: string;
		sender: 'user' | 'ai';
		renderingStrategy?: 'realtime' | 'stream-finish';
	}

	let { content, sender, renderingStrategy = 'stream-finish' }: Props = $props();

	// Direct renderer detection - priority-based approach
	let selectedRenderer = $state<string>('text');
	let processedContent = $state<string>('');

	// Direct content detection with priority order
	function detectRenderer(text: string): string {
		if (!text || typeof text !== 'string') {
			return 'text';
		}

		// Safety: Limit analysis to reasonable content size
		const maxAnalysisSize = 50000; // 50KB
		const analysisText = text.length > maxAnalysisSize ? text.substring(0, maxAnalysisSize) : text;

		try {
			// Count different content types for mixed content detection
			const patterns = {
				marp: /```marp[\s\S]*?```/gi,
				chart: /```chart[\s\S]*?```/gi,
				table: /```(?:table|csv)[\s\S]*?```/gi,
				mermaid: /```mermaid[\s\S]*?```/gi,
				timeline: /```timeline[\s\S]*?```/gi,
				pdf: /```pdf[\s\S]*?```/gi,
				media: /```(?:video|audio)[\s\S]*?```/gi,
				file: /```file[\s\S]*?```/gi,
				url: /```url[\s\S]*?```/gi,
				image: /```image[\s\S]*?```/gi,
				code: /```(?!marp|chart|table|csv|mermaid|timeline|pdf|video|audio|file|url|image)[\w]*[\s\S]*?```/gi,
				math: /\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}|\\[[\s\S]*?\\]|\\([^)]*\\)/g
			};

			// Count matches for each pattern
			const counts = Object.fromEntries(
				Object.entries(patterns).map(([key, pattern]) => [
					key, 
					(analysisText.match(pattern) || []).length
				])
			);

			// Check for markdown patterns
			const hasMarkdown = /^#{1,6}\s|[\*_]{1,2}[^\*_]+[\*_]{1,2}|`[^`]+`|\[[^\]]*\]\([^)]*\)|^[-\*\+]\s|\d+\.\s/m.test(analysisText) && text.length > 5;

			// Calculate total special content blocks
			const specialContentCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
			
			// If multiple content types or markdown present, use MarkdownRenderer for mixed content
			if (specialContentCount > 1 || (specialContentCount >= 1 && hasMarkdown)) {
				return 'markdown';
			}

			// Priority-based single renderer selection (most specific first)
			if (counts.marp > 0) return 'marp';
			if (counts.chart > 0) return 'chart';
			if (counts.timeline > 0) return 'timeline';
			if (counts.mermaid > 0) return 'mermaid';
			if (counts.media > 0) return 'media';
			if (counts.image > 0) return 'image';
			if (counts.pdf > 0) return 'pdf';
			if (counts.file > 0) return 'file';
			if (counts.url > 0) return 'url';
			if (counts.table > 0) return 'table';
			if (counts.code > 0) return 'code';
			if (counts.math > 0) return 'math';

			// Check for pure markdown content
			if (hasMarkdown) return 'markdown';

			// Default to plain text
			return 'text';

		} catch (error) {
			console.error('Renderer detection error:', error);
			return 'text';
		}
	}

	onMount(() => {
		selectedRenderer = detectRenderer(content);
		processedContent = content;
	});

	// Update when content changes
	$effect(() => {
		selectedRenderer = detectRenderer(content);
		processedContent = content;
	});
</script>

<div class="message-renderer" class:user-message={sender === 'user'} class:ai-message={sender === 'ai'}>
	{#if selectedRenderer === 'image'}
		<ImageRenderer {content} />
	{:else if selectedRenderer === 'pdf'}
		<PDFRenderer {content} />
	{:else if selectedRenderer === 'media'}
		<MediaRenderer {content} />
	{:else if selectedRenderer === 'file'}
		<FileRenderer {content} />
	{:else if selectedRenderer === 'url'}
		<URLPreviewRenderer {content} />
	{:else if selectedRenderer === 'timeline'}
		<TimelineRenderer {content} />
	{:else if selectedRenderer === 'chart'}
		<ChartRenderer {content} />
	{:else if selectedRenderer === 'mermaid'}
		<MermaidRenderer {content} />
	{:else if selectedRenderer === 'code'}
		<CodeRenderer {content} />
	{:else if selectedRenderer === 'math'}
		<MathRenderer {content} />
	{:else if selectedRenderer === 'table'}
		<TableRenderer {content} />
	{:else if selectedRenderer === 'marp'}
		<MarkdownRenderer {content} {renderingStrategy} />
	{:else if selectedRenderer === 'markdown'}
		<MarkdownRenderer {content} {renderingStrategy} />
	{:else}
		<!-- Plain text fallback -->
		<div class="text-content">
			{processedContent}
		</div>
	{/if}
</div>

<style>
	.message-renderer {
		max-width: 80%;
		padding: 0.8rem 1rem;
		border-radius: 8px;
		line-height: 1.5;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	/* Make table renderers wider */
	.message-renderer:has(.table-renderer) {
		max-width: 95%;
	}

	.user-message {
		align-self: flex-end;
		background-color: #0b69a3;
		color: white;
		margin-left: auto;
	}

	.ai-message {
		align-self: flex-start;
		background-color: #444654;
		color: white;
		margin-right: auto;
	}

	.text-content {
		white-space: pre-wrap;
		font-family: inherit;
	}


	/* Global styles for all renderers */
	:global(.message-renderer .renderer-content) {
		max-width: 100%;
		overflow-x: auto;
	}

	:global(.message-renderer pre) {
		background-color: rgba(0, 0, 0, 0.3);
		padding: 1rem;
		border-radius: 6px;
		overflow-x: auto;
		margin: 0.5rem 0;
	}

	:global(.message-renderer code) {
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
	}

	:global(.message-renderer h1, .message-renderer h2, .message-renderer h3) {
		margin: 1rem 0 0.5rem 0;
		color: inherit;
	}

	:global(.message-renderer p) {
		margin: 0.5rem 0;
	}

	:global(.message-renderer ul, .message-renderer ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	:global(.message-renderer blockquote) {
		border-left: 3px solid rgba(255, 255, 255, 0.3);
		padding-left: 1rem;
		margin: 0.5rem 0;
		opacity: 0.8;
	}
</style>