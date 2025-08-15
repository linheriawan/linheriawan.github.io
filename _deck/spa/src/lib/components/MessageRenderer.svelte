<script lang="ts">
	import { onMount } from 'svelte';
	import MarkdownRenderer from './renderers/MarkdownRenderer.svelte';
	import CodeRenderer from './renderers/CodeRenderer.svelte';
	import MermaidRenderer from './renderers/MermaidRenderer.svelte';
	import MathRenderer from './renderers/MathRenderer.svelte';
	import ImageRenderer from './renderers/ImageRenderer.svelte';
	import ChartRenderer from './renderers/ChartRenderer.svelte';
	import MarpRenderer from './renderers/MarpRenderer.svelte';

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
	let processedContent = $state<string>('');

	// Robust content analysis with safety checks
	function analyzeContent(text: string) {
		if (!text || typeof text !== 'string') {
			resetFlags();
			return;
		}

		// Safety: Limit analysis to reasonable content size
		const maxAnalysisSize = 50000; // 50KB
		const analysisText = text.length > maxAnalysisSize ? text.substring(0, maxAnalysisSize) : text;

		try {
			// Check for Marp presentations (check first!)
			hasMarp = /```marp[\s\S]*?```/i.test(analysisText) || /^---\s*marp:\s*true/m.test(analysisText) || analysisText.includes('<!-- theme:') || analysisText.includes('<!-- paginate:');

			// Check for Charts (check second!)
			hasChart = /```(?:chart|json)[\s\S]*?```/i.test(analysisText) || (/type:\s*(line|bar|pie|doughnut|radar|scatter|bubble)/i.test(analysisText) && /data:/.test(analysisText));

			// Check for Mermaid diagrams
			hasMermaid = /```mermaid[\s\S]*?```/i.test(analysisText);

			// Check for code blocks (but not mermaid, chart, or marp)
			hasCode = /```(?!mermaid|chart|json|marp)[\w]*[\s\S]*?```/i.test(analysisText);

			// Check for math formulas (LaTeX) - improved patterns
			hasMath = /\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}|\\[[\s\S]*?\\]|\\([^)]*\\)/.test(analysisText);

			// Check for image URLs or base64 - more robust
			const trimmedText = text.trim();
			hasImage = /^(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?[^\s]*)?|data:image\/[^;]+;base64,)/i.test(trimmedText);

			// Check for markdown (improved detection)
			hasMarkdown = /^#{1,6}\s|[\*_]{1,2}[^\*_]+[\*_]{1,2}|`[^`]+`|\[[^\]]*\]\([^)]*\)|^[-\*\+]\s|\d+\.\s/m.test(analysisText) && text.length > 5;

			// If it's only an image URL, don't treat it as other content types
			if (hasImage && /^(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?[^\s]*)?|data:image\/[^;]+;base64,)$/i.test(trimmedText)) {
				hasMarkdown = false;
				hasCode = false;
				hasMermaid = false;
				hasMath = false;
				hasChart = false;
				hasMarp = false;
			}

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
	{#if hasImage}
		<ImageRenderer {content} />
	{:else if hasMarp && !hasMarkdown && !hasMath && !hasCode && !hasMermaid && !hasChart}
		<!-- Pure Marp presentation content -->
		<MarpRenderer {content} />
	{:else if hasChart && !hasMarkdown && !hasMath && !hasCode && !hasMermaid && !hasMarp}
		<!-- Pure chart content -->
		<ChartRenderer {content} />
	{:else if hasMermaid && !hasMarkdown && !hasMath && !hasCode && !hasChart && !hasMarp}
		<!-- Pure mermaid content -->
		<MermaidRenderer {content} />
	{:else if hasCode && !hasMarkdown && !hasMath && !hasMermaid && !hasChart && !hasMarp}
		<!-- Pure code content -->
		<CodeRenderer {content} />
	{:else if hasMath && !hasMarkdown && !hasCode && !hasMermaid && !hasChart && !hasMarp}
		<!-- Pure math content -->
		<MathRenderer {content} />
	{:else if hasMarkdown || hasMermaid || hasMath || hasCode || hasChart || hasMarp}
		<!-- Mixed content or markdown - let MarkdownRenderer handle everything -->
		<MarkdownRenderer {content} />
	{:else}
		<!-- Plain text fallback -->
		<div class="text-content">
			{processedContent}
		</div>
	{/if}
	
	<!-- Debug info (remove in production) -->
	{#if import.meta.env.DEV}
		<div class="debug-info">
			Mermaid: {hasMermaid}, Math: {hasMath}, Code: {hasCode}, Markdown: {hasMarkdown}, Image: {hasImage}, Chart: {hasChart}, Marp: {hasMarp}
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

	.debug-info {
		font-size: 0.7rem;
		opacity: 0.6;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
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