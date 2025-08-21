<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';
	
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
	
	// Reset state when content changes significantly
	$effect(() => {
		if (content.length < lastProcessedContent.length) {
			// Content has decreased (likely new message), reset all state
			specialBlocks.clear();
			renderedHtml = '';
			lastProcessedContent = '';
		}
	});

	// Helper function to escape HTML
	function escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

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
		
		// Marp is special - stays in markdown with presentation button
		if (lang === 'marp') {
			const base64Content = btoa(encodeURIComponent(code));
			return `<div class="marp-content" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #e9ecef;">
				<div class="marp-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
					<span style="font-size: 0.8rem; color: #666; font-weight: 600;">📊 Marp Presentation</span>
					<button onclick="window.open('/presentation?source=${base64Content}', '_blank')" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;">Open Presentation</button>
				</div>
				<pre style="background: #ffffff; padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: #333; border: 1px solid #ddd; overflow-x: auto; margin: 0;"><code>${escapeHtml(code)}</code></pre>
			</div>`;
		}
		
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
		
		// Default code rendering with syntax highlighting
		if (lang && hljs.getLanguage(lang)) {
			try {
				const highlighted = hljs.highlight(code, { language: lang }).value;
				return `<pre><code class="language-${lang} hljs">${highlighted}</code></pre>`;
			} catch (error) {
				console.warn('Syntax highlighting failed:', error);
			}
		}
		
		// Fallback to escaped code without highlighting
		return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
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
					/^(https?:\/\/|\/|\.\/|\.\.\/)?[^\s]+\.(jpg|jpeg|png|gif|bmp|svg|webp)(\?[^\s]*)?$/i.test(url.trim()) ||
					/^data:image\/[a-zA-Z]+;base64,/.test(url.trim())
				);
				
			case 'media':
				const mediaUrls = code.trim().split('\n').filter(line => line.trim());
				return mediaUrls.length > 0 && mediaUrls.every(url => 
					/^(https?:\/\/|\/|\.\/|\.\.\/)?.*\.(mp4|webm|mov|avi|mkv|m4v|mp3|wav|ogg|aac|m4a|flac)(\?.*)?$/i.test(url.trim()) ||
					/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.test(url.trim())
				);
				
			default:
				return code.length > 0;
		}
	}

	// Helper function to extract Marp blocks properly (handles nested code blocks)
	function extractMarpBlocks(text: string): { content: string; marpBlocks: Map<string, string> } {
		const marpBlocks = new Map<string, string>();
		let processedContent = text;
		
		// Manual parsing to handle nested code blocks properly
		let currentIndex = 0;
		
		while (true) {
			const marpStart = text.indexOf('```marp\n', currentIndex);
			if (marpStart === -1) break;
			
			// Find the matching closing ``` at the same nesting level
			let searchStart = marpStart + '```marp\n'.length;
			let nestedLevel = 0;
			let marpEnd = -1;
			
			while (searchStart < text.length) {
				const nextTripleBacktick = text.indexOf('```', searchStart);
				if (nextTripleBacktick === -1) break;
				
				// Check if this is a language-specific opening (like ```javascript)
				const restOfLine = text.substring(nextTripleBacktick + 3, text.indexOf('\n', nextTripleBacktick) + 1);
				const hasLanguage = /^[a-zA-Z]+\s*\n$/.test(restOfLine);
				
				if (hasLanguage) {
					// This is an opening ```language, increase nesting level
					nestedLevel++;
					searchStart = nextTripleBacktick + 3 + restOfLine.length;
				} else {
					// This is a closing ```
					if (nestedLevel === 0) {
						// This is the matching closing for our marp block
						marpEnd = nextTripleBacktick;
						break;
					} else {
						// This closes a nested block
						nestedLevel--;
						searchStart = nextTripleBacktick + 3;
					}
				}
			}
			
			if (marpEnd === -1) {
				// No matching closing found, skip this marp block
				currentIndex = marpStart + 1;
				continue;
			}
			
			// Extract the marp content
			const marpContent = text.substring(marpStart + '```marp\n'.length, marpEnd);
			const fullMatch = text.substring(marpStart, marpEnd + 3);
			
			// Create unique placeholder
			const blockId = `MARP_BLOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			
			// Store the marp content
			marpBlocks.set(blockId, marpContent);
			
			// Create the marp HTML
			const base64Content = btoa(encodeURIComponent(marpContent));
			const marpHtml = `<div class="marp-content" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #e9ecef;">
				<div class="marp-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
					<span style="font-size: 0.8rem; color: #666; font-weight: 600;">📊 Marp Presentation</span>
					<button onclick="window.open('/presentation?source=${base64Content}', '_blank')" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;">Open Presentation</button>
				</div>
				<pre style="background: #ffffff; padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: #333; border: 1px solid #ddd; overflow-x: auto; margin: 0;"><code>${escapeHtml(marpContent)}</code></pre>
			</div>`;
			
			// Replace the original block with the HTML
			processedContent = processedContent.replace(fullMatch, marpHtml);
			
			// Continue searching after this block
			currentIndex = marpStart + marpHtml.length;
		}
		
		return { content: processedContent, marpBlocks };
	}

	// Process the content as markdown and render special blocks
	async function processContent() {
		if (!browser) return;
		
		// For user messages, just render as simple markdown without special block processing
		if (sender === 'user') {
			try {
				const htmlContent = await marked.parse(content);
				renderedHtml = DOMPurify.sanitize(htmlContent, {
					ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'div', 'span', 'button'],
					ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'alt', 'src', 'class', 'onclick', 'style']
				});
			} catch (error) {
				console.error('Error processing user message:', error);
				renderedHtml = `<p>${escapeHtml(content)}</p>`;
			}
			return;
		}
		
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
			// Pre-process Marp blocks to handle nested code blocks properly
			const { content: processedContent, marpBlocks } = extractMarpBlocks(content);
			
			// Process markdown (this will register special blocks)
			const htmlContent = await marked.parse(processedContent);
			
			// Sanitize HTML
			renderedHtml = DOMPurify.sanitize(htmlContent, {
				ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'div', 'span', 'button'],
				ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'alt', 'src', 'class', 'data-block-id', 'onclick', 'style']
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
			
			// Skip if already mounted (placeholder has children)
			if (placeholder.children.length > 0) continue;
			
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
			if (sender === 'user') {
				console.log(`User message: "${content}"`);
			}
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