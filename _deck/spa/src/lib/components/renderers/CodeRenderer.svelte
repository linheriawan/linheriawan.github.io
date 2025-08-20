<script lang="ts">
	import hljs from 'highlight.js';
	import { onMount } from 'svelte';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();
	let highlightedCode = $state<string>('');
	let detectedLanguage = $state<string>('');
	let codeElement: HTMLElement;

	function extractCodeFromMarkdown(text: string) {
		// Extract language and code from ```language\ncode``` format
		const codeBlockMatch = text.match(/^```(\w+)?\n?([\s\S]*?)```$/m);
		if (codeBlockMatch) {
			const language = codeBlockMatch[1] || 'text';
			const code = codeBlockMatch[2].trim();
			return { language, code };
		}

		// Auto-detect JSON
		const trimmed = text.trim();
		if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
		    (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
			try {
				JSON.parse(trimmed);
				return { language: 'json', code: trimmed };
			} catch {
				// Not valid JSON, continue
			}
		}

		// Auto-detect XML
		if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
			return { language: 'xml', code: trimmed };
		}

		// Fallback to treating entire content as code
		return { language: 'text', code: text.trim() };
	}

	function highlightCode(code: string, language: string): string {
		try {
			if (language && language !== 'text' && hljs.getLanguage(language)) {
				const result = hljs.highlight(code, { language });
				detectedLanguage = language;
				return result.value;
			} else {
				// Auto-detect language
				const result = hljs.highlightAuto(code);
				detectedLanguage = result.language || 'text';
				return result.value;
			}
		} catch (error) {
			console.error('Code highlighting error:', error);
			detectedLanguage = 'text';
			return hljs.escapeHtml(code);
		}
	}

	function copyToClipboard() {
		const { code } = extractCodeFromMarkdown(content);
		navigator.clipboard.writeText(code).then(() => {
			// Could add a toast notification here
			// console.log('Code copied to clipboard');
		}).catch(err => {
			console.error('Failed to copy code:', err);
		});
	}

	onMount(() => {
		console.log('🚀 coderenderer is initialize');
		const { language, code } = extractCodeFromMarkdown(content);
		highlightedCode = highlightCode(code, language);
		console.log('✅ coderenderer done rendering');
	});

	// Re-highlight when content changes
	$effect(() => {
		const { language, code } = extractCodeFromMarkdown(content);
		highlightedCode = highlightCode(code, language);
		console.log('✅ coderenderer done rendering');
	});
</script>

<div class="code-renderer renderer-content">
	<div class="code-header">
		<span class="language-label">{detectedLanguage || 'text'}</span>
		<button 
			class="copy-button" 
			onclick={copyToClipboard}
			title="Copy code"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
				<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
			</svg>
		</button>
	</div>
	<pre bind:this={codeElement} class="code-block"><code>{@html highlightedCode}</code></pre>
</div>

<style>
	.code-renderer {
		margin: 0.5rem 0;
		border-radius: 8px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.code-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 0.8rem;
	}

	.language-label {
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

	.copy-button:active {
		transform: scale(0.95);
	}

	.code-block {
		margin: 0;
		padding: 1rem;
		background-color: transparent;
		overflow-x: auto;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
		line-height: 1.5;
		color: #f8f8f2;
	}

	.code-block code {
		background: none;
		padding: 0;
		border-radius: 0;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
	}

	/* Syntax highlighting theme - GitHub Dark */
	:global(.code-renderer .hljs-comment),
	:global(.code-renderer .hljs-quote) {
		color: #7c7c7c;
		font-style: italic;
	}

	:global(.code-renderer .hljs-keyword),
	:global(.code-renderer .hljs-selector-tag),
	:global(.code-renderer .hljs-literal),
	:global(.code-renderer .hljs-type) {
		color: #ff7b72;
	}

	:global(.code-renderer .hljs-string),
	:global(.code-renderer .hljs-title) {
		color: #a5d6ff;
	}

	:global(.code-renderer .hljs-number),
	:global(.code-renderer .hljs-symbol),
	:global(.code-renderer .hljs-bullet) {
		color: #79c0ff;
	}

	:global(.code-renderer .hljs-function),
	:global(.code-renderer .hljs-variable) {
		color: #d2a8ff;
	}

	:global(.code-renderer .hljs-attr),
	:global(.code-renderer .hljs-property) {
		color: #79c0ff;
	}

	:global(.code-renderer .hljs-built_in),
	:global(.code-renderer .hljs-class) {
		color: #ffa657;
	}

	:global(.code-renderer .hljs-tag) {
		color: #7ee787;
	}

	:global(.code-renderer .hljs-attribute) {
		color: #79c0ff;
	}

	:global(.code-renderer .hljs-deletion) {
		background-color: #490202;
		color: #ffdcd7;
	}

	:global(.code-renderer .hljs-addition) {
		background-color: #164620;
		color: #aff5b4;
	}

	:global(.code-renderer .hljs-link) {
		color: #a5d6ff;
		text-decoration: underline;
	}

	/* Scrollbar styling for code blocks */
	.code-block::-webkit-scrollbar {
		height: 8px;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.code-block::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.code-block::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.5);
	}
</style>