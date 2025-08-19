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
	}

	let { content, sender }: Props = $props();

	// Content analysis for mixed content support
	let hasMarkdown = $state<boolean>(false);
	let hasMermaid = $state<boolean>(false);
	let hasMath = $state<boolean>(false);
	let hasCode = $state<boolean>(false);
	let hasImage = $state<boolean>(false);
	let hasChart = $state<boolean>(false);
	let hasMarp = $state<boolean>(false);
	let hasTable = $state<boolean>(false);
	let hasPDF = $state<boolean>(false);
	let hasTimeline = $state<boolean>(false);
	let hasMedia = $state<boolean>(false);
	let hasUrlPreview = $state<boolean>(false);
	let hasFile = $state<boolean>(false);
	let processedContent = $state<string>('');

	// Simplified content analysis - only check for ```[keyword] patterns
	function analyzeContent(text: string) {
		if (!text || typeof text !== 'string') {
			resetFlags();
			return;
		}

		// Safety: Limit analysis to reasonable content size
		const maxAnalysisSize = 50000; // 50KB
		const analysisText = text.length > maxAnalysisSize ? text.substring(0, maxAnalysisSize) : text;

		try {
			// Check for code block patterns only
			hasMarp = /```marp[\s\S]*?```/i.test(analysisText);
			hasChart = /```chart[\s\S]*?```/i.test(analysisText);
			hasTable = /```(?:table|csv)[\s\S]*?```/i.test(analysisText);
			hasMermaid = /```mermaid[\s\S]*?```/i.test(analysisText);
			hasTimeline = /```timeline[\s\S]*?```/i.test(analysisText);
			hasPDF = /```pdf[\s\S]*?```/i.test(analysisText);
			hasMedia = /```(?:video|audio)[\s\S]*?```/i.test(analysisText);
			hasFile = /```file[\s\S]*?```/i.test(analysisText);
			hasUrlPreview = /```url[\s\S]*?```/i.test(analysisText);
			hasImage = /```image[\s\S]*?```/i.test(analysisText);

			// Check for code blocks (excluding special keywords)
			hasCode = /```(?!marp|chart|table|csv|mermaid|timeline|pdf|video|audio|file|url|image)[\w]*[\s\S]*?```/i.test(analysisText);

			// Check for math formulas (LaTeX) - keep this as it uses different syntax
			hasMath = /\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}|\\[[\s\S]*?\\]|\\([^)]*\\)/.test(analysisText);

			// Check for markdown (improved detection) - keep for mixed content
			hasMarkdown = /^#{1,6}\s|[\*_]{1,2}[^\*_]+[\*_]{1,2}|`[^`]+`|\[[^\]]*\]\([^)]*\)|^[-\*\+]\s|\d+\.\s/m.test(analysisText) && text.length > 5;

		} catch (error) {
			console.error('Content analysis error:', error);
			resetFlags();
		}
	}

	function resetFlags() {
		hasMarkdown = false;
		hasMermaid = false;
		hasMath = false;
		hasCode = false;
		hasImage = false;
		hasChart = false;
		hasMarp = false;
		hasTable = false;
		hasPDF = false;
		hasTimeline = false;
		hasMedia = false;
		hasUrlPreview = false;
		hasFile = false;
	}

	onMount(() => {
		analyzeContent(content);
		processedContent = content;
	});

	// Update when content changes
	$effect(() => {
		analyzeContent(content);
		processedContent = content;
	});
</script>

<div class="message-renderer" class:user-message={sender === 'user'} class:ai-message={sender === 'ai'}>
	{#if hasImage && !hasMarkdown && !hasMath && !hasCode && !hasMermaid && !hasChart && !hasMarp && !hasTable && !hasTimeline && !hasMedia && !hasFile && !hasUrlPreview && !hasPDF}
		<!-- Pure image content only -->
		<ImageRenderer {content} />
	{:else if hasPDF && !hasMarkdown && !hasMath && !hasCode && !hasMermaid && !hasChart && !hasMarp && !hasTable && !hasTimeline && !hasMedia && !hasFile && !hasUrlPreview && !hasImage}
		<!-- Pure PDF content only -->
		<PDFRenderer {content} />
	{:else if hasMedia && !hasMarkdown && !hasMath && !hasCode && !hasMermaid && !hasChart && !hasMarp && !hasTable && !hasTimeline && !hasFile && !hasUrlPreview && !hasImage && !hasPDF}
		<!-- Pure media content only -->
		<MediaRenderer {content} />
	{:else if hasFile && !hasMarkdown && !hasMath && !hasCode && !hasMermaid && !hasChart && !hasMarp && !hasTable && !hasTimeline && !hasMedia && !hasUrlPreview && !hasImage && !hasPDF}
		<!-- Pure file content only -->
		<FileRenderer {content} />
	{:else if hasUrlPreview && !hasMarkdown && !hasMath && !hasCode && !hasMermaid && !hasChart && !hasMarp && !hasTable && !hasTimeline && !hasMedia && !hasFile && !hasImage && !hasPDF}
		<!-- Pure URL preview content only -->
		<URLPreviewRenderer {content} />
	{:else if hasTimeline && !hasMarkdown && !hasMath && !hasCode && !hasMermaid && !hasChart && !hasMarp && !hasTable && !hasMedia && !hasFile && !hasUrlPreview && !hasImage && !hasPDF}
		<!-- Pure timeline content only -->
		<TimelineRenderer {content} />
	{:else if hasChart && !hasMarkdown && !hasMath && !hasCode && !hasMermaid && !hasMarp && !hasTable && !hasTimeline && !hasMedia && !hasFile && !hasUrlPreview && !hasImage && !hasPDF}
		<!-- Pure chart content only -->
		<ChartRenderer {content} />
	{:else if hasMermaid && !hasMarkdown && !hasMath && !hasCode && !hasChart && !hasMarp && !hasTable && !hasTimeline && !hasMedia && !hasFile && !hasUrlPreview && !hasImage && !hasPDF}
		<!-- Pure mermaid content only -->
		<MermaidRenderer {content} />
	{:else if hasCode && !hasMarkdown && !hasMath && !hasMermaid && !hasChart && !hasMarp && !hasTable && !hasTimeline && !hasMedia && !hasFile && !hasUrlPreview && !hasImage && !hasPDF}
		<!-- Pure code content only -->
		<CodeRenderer {content} />
	{:else if hasMath && !hasMarkdown && !hasCode && !hasMermaid && !hasChart && !hasMarp && !hasTable && !hasTimeline && !hasMedia && !hasFile && !hasUrlPreview && !hasImage && !hasPDF}
		<!-- Pure math content only -->
		<MathRenderer {content} />
	{:else if hasTable && !hasMath && !hasCode && !hasMermaid && !hasChart && !hasMarp && !hasTimeline && !hasMedia && !hasFile && !hasUrlPreview && !hasImage && !hasPDF}
		<!-- Pure table content only (allow with markdown for mixed content) -->
		<TableRenderer {content} />
	{:else if hasMarkdown || hasMermaid || hasMath || hasCode || hasChart || hasMarp || hasTable || hasPDF || hasTimeline || hasMedia || hasFile || hasUrlPreview || hasImage}
		<!-- Mixed content or markdown - let MarkdownRenderer handle everything -->
		<MarkdownRenderer {content} />
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