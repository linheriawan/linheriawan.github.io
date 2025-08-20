<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	
	// Import all renderer components directly
	import TableRenderer from './renderers/TableRenderer.svelte';
	import ChartRenderer from './renderers/ChartRenderer.svelte';
	import MermaidRenderer from './renderers/MermaidRenderer.svelte';
	import TimelineRenderer from './renderers/TimelineRenderer.svelte';
	import ImageRenderer from './renderers/ImageRenderer.svelte';
	import MediaRenderer from './renderers/MediaRenderer.svelte';
	import PDFRenderer from './renderers/PDFRenderer.svelte';
	import FileRenderer from './renderers/FileRenderer.svelte';
	import URLPreviewRenderer from './renderers/URLPreviewRenderer.svelte';

	interface Props {
		content: string;
		sender: 'user' | 'ai';
	}

	let { content, sender }: Props = $props();
	
	// Registry for special code blocks that need custom renderers
	interface SpecialBlock {
		id: string;
		type: 'table' | 'chart' | 'mermaid' | 'timeline' | 'image' | 'media' | 'pdf' | 'file' | 'url';
		content: string;
		isComplete: boolean;
	}
	
	let specialBlocks = $state<Map<string, SpecialBlock>>(new Map());
	let renderedHtml = $state<string>('');
	let containerElement: HTMLDivElement;
	let lastProcessedContent = $state<string>('');

	// Configure marked for markdown processing
	marked.setOptions({
		breaks: true,
		gfm: true,
		silent: true
	});

	// Custom renderer to detect and handle special code blocks
	const renderer = new marked.Renderer();
	
	renderer.code = function(code: string, language?: string) {
		const lang = (language || '').toLowerCase();
		
		// Special renderers - register them for later processing
		const specialTypes = ['csv', 'table', 'chart', 'mermaid', 'timeline', 'image', 'video', 'audio', 'pdf', 'file', 'url'];
		
		if (specialTypes.includes(lang) || (lang === 'csv' || lang === 'table')) {
			const blockType = lang === 'csv' ? 'table' : (lang === 'video' || lang === 'audio' ? 'media' : lang) as SpecialBlock['type'];
			const blockId = `${blockType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			
			// Check if this code block is complete
			const isComplete = isCodeBlockComplete(blockType, code);
			
			if (isComplete) {
				console.log(`🔧 Registering ${blockType} renderer`);
				
				// Register the special block
				specialBlocks.set(blockId, {
					id: blockId,
					type: blockType,
					content: code,
					isComplete: true
				});
				
				// Return placeholder that will be replaced with actual component
				return `<div class="special-block-container" data-block-id="${blockId}"></div>`;
			}
		}
		
		// Default code rendering (including marp which stays as code)
		return `<pre><code class="language-${lang}">${code}</code></pre>`;
	};

	marked.use({ renderer });

	// Check if a code block is complete and valid
	function isCodeBlockComplete(type: SpecialBlock['type'], code: string): boolean {
		if (!code.trim()) return false;
		
		switch (type) {
			case 'table':
				// Check for valid CSV/table data
				const lines = code.trim().split('\n').filter(line => line.trim());
				return lines.length >= 2 && lines[0].includes(',');
				
			case 'chart':
				// Check for valid JSON
				if (code.startsWith('{')) {
					try {
						const parsed = JSON.parse(code);
						return parsed.type && parsed.data;
					} catch {
						return false;
					}
				}
				return false;
				
			case 'timeline':
				// Check for valid JSON array
				if (code.startsWith('[')) {
					try {
						const parsed = JSON.parse(code);
						return Array.isArray(parsed);
					} catch {
						return false;
					}
				}
				return false;
				
			case 'mermaid':
				return code.includes('graph') || code.includes('flowchart') || code.includes('sequenceDiagram');
				
			case 'image':
				const imageUrls = code.trim().split('\n').filter(line => line.trim());
				return imageUrls.length > 0 && imageUrls.every(url => 
					/^https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|bmp|svg|webp)(\?[^\s]*)?$/i.test(url.trim()) ||
					/^data:image\/[a-zA-Z]+;base64,/.test(url.trim())
				);
				
			case 'media':
				const mediaUrls = code.trim().split('\n').filter(line => line.trim());
				return mediaUrls.length > 0 && mediaUrls.every(url => 
					/^https?:\/\/.*\.(mp4|webm|mov|avi|mkv|m4v|mp3|wav|ogg|aac|m4a|flac)(\?.*)?$/i.test(url.trim()) ||
					/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.test(url.trim())
				);
				
			default:
				return code.length > 0;
		}
	}

	// Process the content as markdown and render special blocks
	async function processContent() {
		if (!browser) return;
		
		// Skip if content hasn't meaningfully changed
		if (content === lastProcessedContent) return;
		
		// For streaming content, only reprocess if it's a significant change
		const isStreaming = content.length > lastProcessedContent.length && 
			content.startsWith(lastProcessedContent.substring(0, Math.min(100, lastProcessedContent.length)));
		
		// If it's just streaming (content got longer), only process if we have new complete blocks
		if (isStreaming && !hasNewCompleteBlocks(lastProcessedContent, content)) {
			return;
		}
		
		// If content got shorter or completely different, clear everything
		if (content.length < lastProcessedContent.length || !isStreaming) {
			specialBlocks.clear();
		}
		
		lastProcessedContent = content;
		
		try {
			// Process markdown (this will register special blocks)
			const htmlContent = await marked.parse(content);
			
			// Sanitize HTML
			renderedHtml = DOMPurify.sanitize(htmlContent, {
				ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'div', 'span'],
				ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'alt', 'src', 'class', 'data-block-id']
			});
			
			// Wait for DOM update, then mount special components
			setTimeout(() => mountSpecialComponents(), 10);
			
		} catch (error) {
			console.error('Error processing content:', error);
			renderedHtml = `<p>Error processing content</p>`;
		}
	}
	
	// Check if there are new complete code blocks in the content
	function hasNewCompleteBlocks(oldContent: string, newContent: string): boolean {
		const oldBlocks = (oldContent.match(/```\w+[\s\S]*?```/g) || []).length;
		const newBlocks = (newContent.match(/```\w+[\s\S]*?```/g) || []).length;
		return newBlocks > oldBlocks;
	}

	// Mount special renderer components
	async function mountSpecialComponents() {
		if (!containerElement) return;
		
		for (const [blockId, block] of specialBlocks.entries()) {
			const placeholder = containerElement.querySelector(`[data-block-id="${blockId}"]`);
			if (!placeholder || !block.isComplete) continue;
			
			try {
				console.log(`🚀 ${block.type}renderer is initialize`);
				
				// Create component based on type
				const { mount } = await import('svelte');
				let component;
				let formattedContent = `\`\`\`${block.type}\n${block.content}\n\`\`\``;
				
				switch (block.type) {
					case 'table':
						component = mount(TableRenderer, {
							target: placeholder,
							props: { content: formattedContent }
						});
						break;
					case 'chart':
						component = mount(ChartRenderer, {
							target: placeholder,
							props: { content: formattedContent }
						});
						break;
					case 'mermaid':
						component = mount(MermaidRenderer, {
							target: placeholder,
							props: { content: formattedContent }
						});
						break;
					case 'timeline':
						component = mount(TimelineRenderer, {
							target: placeholder,
							props: { content: formattedContent }
						});
						break;
					case 'image':
						component = mount(ImageRenderer, {
							target: placeholder,
							props: { content: formattedContent }
						});
						break;
					case 'media':
						component = mount(MediaRenderer, {
							target: placeholder,
							props: { content: formattedContent }
						});
						break;
					case 'pdf':
						component = mount(PDFRenderer, {
							target: placeholder,
							props: { content: formattedContent }
						});
						break;
					case 'file':
						component = mount(FileRenderer, {
							target: placeholder,
							props: { content: formattedContent }
						});
						break;
					case 'url':
						component = mount(URLPreviewRenderer, {
							target: placeholder,
							props: { content: formattedContent }
						});
						break;
				}
				
				console.log(`✅ ${block.type} renderer initialized`);
				
			} catch (error) {
				console.error(`Error mounting ${block.type} renderer:`, error);
			}
		}
	}

	// Process content when it changes
	$effect(() => {
		if (browser && content) {
			processContent();
		}
	});
</script>

<div class="message-renderer" class:user-message={sender === 'user'} class:ai-message={sender === 'ai'}>
	<div bind:this={containerElement} class="content">
		{@html renderedHtml}
	</div>
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

	.content {
		width: 100%;
	}

	/* Style for special block containers */
	:global(.special-block-container) {
		margin: 0.5rem 0;
		display: block;
	}

	/* Global styles for markdown content */
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
</style>