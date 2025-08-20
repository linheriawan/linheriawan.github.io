<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import mermaid from 'mermaid';
	import hljs from 'highlight.js';
	import katex from 'katex';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		content: string;
		renderingStrategy?: 'realtime' | 'stream-finish';
	}

	let { content, renderingStrategy = 'stream-finish' }: Props = $props();
	let renderedHtml = $state<string>('');
	let containerElement: HTMLDivElement;

	// Child Renderer Registry System
	interface ChildRenderer {
		id: string;
		type: 'timeline' | 'chart' | 'mermaid' | 'media' | 'image' | 'pdf' | 'file' | 'url' | 'table';
		code: string;
		containerId: string;
		isComplete: boolean;
		isInitialized: boolean;
		component?: any;
	}
	
	let childRenderers = $state<Map<string, ChildRenderer>>(new Map());
	let mermaidInitialized = false;
	let isProcessing = false;

	// Configure marked for better security and formatting
	marked.setOptions({
		breaks: true, // Convert \n to <br>
		gfm: true, // GitHub Flavored Markdown
		silent: true // Don't throw on error
	});

	// Custom renderer for better chat styling
	const renderer = new marked.Renderer();
	
	// Check if a code block is complete by looking for closing ```
	function isCodeBlockComplete(fullContent: string, codeBlockMatch: RegExpMatchArray): boolean {
		if (!codeBlockMatch) return false;
		
		const beforeCodeBlock = fullContent.substring(0, codeBlockMatch.index || 0);
		const codeBlockStart = codeBlockMatch[0];
		const afterCodeBlockStart = fullContent.substring((codeBlockMatch.index || 0) + codeBlockStart.length);
		
		// Count opening ``` (including the one we found)
		const openingBlocks = (beforeCodeBlock.match(/```/g) || []).length + 1;
		// Count closing ``` after our code block
		const closingBlocks = (afterCodeBlockStart.match(/```/g) || []).length;
		
		// Code block is complete if we have a matching closing ```
		return closingBlocks >= 1 && afterCodeBlockStart.includes('```');
	}

	// Helper function to register child renderer
	function registerChildRenderer(type: ChildRenderer['type'], code: string): string {
		const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const containerId = `${id}-container`;
		
		// Check if the code block is complete in the full content
		// Look for complete code blocks: ```type\n[content]\n```
		const codeBlockPattern = new RegExp(`\`\`\`${type}\\s*([\\s\\S]*?)\`\`\``, 'gi');
		const matches = [...content.matchAll(codeBlockPattern)];
		const isBlockComplete = matches.some(match => {
			const matchContent = match[1].trim();
			return matchContent === code.trim();
		});
		
		const codeComplete = isCodeComplete(type, code);
		const isComplete = isBlockComplete && codeComplete;
		
		console.log(`Registering ${type} renderer:`, {
			id,
			type,
			codeLength: code.length,
			isBlockComplete,
			codeComplete,
			isComplete
		});
		
		// Register in our system
		childRenderers.set(id, {
			id,
			type,
			code,
			containerId,
			isComplete,
			isInitialized: false
		});
		
		// Return placeholder HTML
		return `<div class="renderer-wrapper">
			<div class="${type}-container" id="${containerId}"></div>
			<div class="renderer-note">🔧 ${getRendererName(type)} ${isComplete ? '✅' : '⏳'}</div>
		</div>`;
	}

	// Check if code is complete for a given type
	function isCodeComplete(type: ChildRenderer['type'], code: string): boolean {
		if (!code.trim()) return false;
		
		switch (type) {
			case 'timeline':
			case 'chart':
				// For JSON, try to parse - always strict
				if (code.startsWith('{') || code.startsWith('[')) {
					try {
						const parsed = JSON.parse(code);
						if (type === 'chart') {
							return parsed.type && parsed.data;
						}
						if (type === 'timeline') {
							return Array.isArray(parsed) || (parsed.items && Array.isArray(parsed.items));
						}
						return true;
					} catch {
						return false; // Never initialize with incomplete JSON
					}
				}
				// For simple text format, require reasonable length
				return code.length > 10 && !code.endsWith(',') && !code.endsWith('{');
			case 'media':
				// Check for valid media URLs - can be multiple URLs on separate lines
				const mediaUrls = code.trim().split('\n').map(url => url.trim()).filter(url => url);
				const isValid = mediaUrls.length > 0 && mediaUrls.every(url => 
					/^https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv|m4v|mp3|wav|ogg|aac|m4a|flac)(\?[^\s]*)?$/i.test(url) ||
					/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.test(url)
				);
				console.log('Media completion check:', { code, mediaUrls, isValid });
				return isValid;
			case 'image':
				// Check for valid image URLs - can be multiple URLs on separate lines
				const imageUrls = code.trim().split('\n').map(url => url.trim()).filter(url => url);
				return imageUrls.length > 0 && imageUrls.every(url => 
					/^https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|bmp|svg|webp)(\?[^\s]*)?$/i.test(url) ||
					/^data:image\/[a-zA-Z]+;base64,/.test(url)
				);
			case 'table':
				// Check for valid table/CSV data - must have header and at least one data row
				const lines = code.trim().split('\n').filter(line => line.trim());
				if (lines.length < 2) return false; // Need at least header + 1 data row
				
				// Check if it looks like CSV (comma-separated) or table (any delimiter)
				const hasCommas = lines[0].includes(',');
				const hasDelimiters = lines[0].includes(',') || lines[0].includes('\t') || lines[0].includes('|');
				return hasDelimiters && lines.every(line => line.trim().length > 0);
			case 'mermaid':
				// Strict completion check - must have complete structure
				const hasBasicStructure = code.includes('graph') || code.includes('flowchart') || code.includes('sequenceDiagram');
				const hasConnections = code.includes('-->') || code.includes('->');
				const notIncomplete = !code.endsWith('->') && !code.endsWith('-') && !code.endsWith('{') && !code.endsWith('[');
				
				// Must have both structure keywords and connections, and not end incompletely
				return code.length > 10 && hasBasicStructure && hasConnections && notIncomplete;
			default:
				return code.length > 0;
		}
	}

	// Get renderer display name
	function getRendererName(type: ChildRenderer['type']): string {
		const names = {
			timeline: 'TimelineRenderer',
			chart: 'ChartRenderer', 
			mermaid: 'MermaidRenderer',
			media: 'MediaRenderer',
			image: 'ImageRenderer',
			pdf: 'PDFRenderer',
			file: 'FileRenderer',
			url: 'URLPreviewRenderer',
			table: 'TableRenderer'
		};
		return names[type] || 'Renderer';
	}

	// Override code block rendering with registry system
	renderer.code = function(code: string, language?: string) {
		const lang = (language || 'text').toLowerCase();
		
		// Special renderers using registry system
		if (lang === 'mermaid') return registerChildRenderer('mermaid', code);
		if (lang === 'chart') return registerChildRenderer('chart', code);
		if (lang === 'audio' || lang === 'video') return registerChildRenderer('media', code);
		if (lang === 'timeline') return registerChildRenderer('timeline', code);
		if (lang === 'table') return registerChildRenderer('table', code);
		if (lang === 'csv') return registerChildRenderer('table', code); // CSV uses table renderer
		if (lang === 'image') return registerChildRenderer('image', code);
		if (lang === 'pdf') return registerChildRenderer('pdf', code);
		if (lang === 'file') return registerChildRenderer('file', code);
		if (lang === 'url') return registerChildRenderer('url', code);

		// Marp is special - stays in markdown  
		if (lang === 'marp') {
			return `<div class="marp-content" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
				<div class="marp-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
					<span style="font-size: 0.8rem; color: #666;">📊 Marp Presentation</span>
					<button onclick="alert('Marp functionality not implemented yet')" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">Open Presentation</button>
				</div>
				<pre style="margin: 0; font-size: 0.8rem; color: #666; white-space: pre-wrap; overflow-x: auto;">${code}</pre>
			</div>`;
		}
		
		// Default: Syntax highlighting for code blocks (CodeRenderer)
		let highlightedCode = code;
		try {
			if (lang && lang !== 'text' && hljs.getLanguage(lang)) {
				highlightedCode = hljs.highlight(code, { language: lang }).value;
			} else {
				highlightedCode = hljs.highlightAuto(code).value;
			}
		} catch (error) {
			console.error('Highlight error:', error);
			highlightedCode = hljs.escapeHtml(code);
		}
		
		// Add renderer note for code blocks
		const codeRendererNote = `<div class="renderer-note">🔧 CodeRenderer (${lang || 'auto-detect'})</div>`;
		return `<div class="code-block-wrapper"><pre class="code-block"><code class="language-${lang}">${highlightedCode}</code></pre>${codeRendererNote}</div>`;
	};

	// Override inline code rendering
	renderer.codespan = function(code: string) {
		return `<code class="inline-code">${code}</code>`;
	};

	// Registry Processing System - Clean Implementation
	async function processChildRenderers() {
		if (!browser || !containerElement || isProcessing) return;
		
		console.log('Processing child renderers...', {
			rendererCount: childRenderers.size,
			containerElement: !!containerElement
		});
		
		isProcessing = true;
		try {
			// Import components once
			const components = await importRendererComponents();
			if (!components) {
				console.error('Failed to import components, aborting renderer processing');
				return;
			}

			// Process each registered child renderer
			for (const [id, renderer] of childRenderers.entries()) {
				console.log(`Processing renderer ${id}:`, {
					type: renderer.type,
					isInitialized: renderer.isInitialized,
					isComplete: renderer.isComplete,
					containerId: renderer.containerId
				});
				
				// Skip if already initialized
				if (renderer.isInitialized) continue;
				
				// Re-check completion status for streaming content
				if (!renderer.isComplete) {
					// Check if the code block is now complete in the full content
					const codeBlockPattern = new RegExp(`\`\`\`${renderer.type}\\s*([\\s\\S]*?)\`\`\``, 'gi');
					const matches = [...content.matchAll(codeBlockPattern)];
					const isBlockComplete = matches.some(match => {
						const matchContent = match[1].trim();
						return matchContent === renderer.code.trim();
					});
					
					const codeComplete = isCodeComplete(renderer.type, renderer.code);
					renderer.isComplete = isBlockComplete && codeComplete;
					
					console.log(`Re-checked completion for ${id}:`, {
						isBlockComplete,
						codeComplete,
						isComplete: renderer.isComplete
					});
					
					if (!renderer.isComplete) continue;
				}

				// Find the container
				const container = containerElement.querySelector(`#${renderer.containerId}`);
				console.log(`Looking for container ${renderer.containerId}:`, !!container);
				if (!container) continue;

				// Initialize the renderer
				try {
					const { mount } = await import('svelte');
					const componentClass = getRendererComponent(components, renderer.type);
					
					console.log(`Mounting ${renderer.type} component:`, !!componentClass);
					
					if (componentClass && !renderer.component) {
						const formattedContent = formatContentForRenderer(renderer);
						
						console.log(`Formatted content for ${renderer.type}:`, formattedContent);
						
						renderer.component = mount(componentClass, {
							target: container,
							props: {
								content: formattedContent,
								renderingStrategy
							}
						});
						
						// Mark as initialized
						renderer.isInitialized = true;
						console.log(`Successfully mounted ${renderer.type} renderer`);
					}
				} catch (error) {
					console.error(`Error initializing ${renderer.type} renderer:`, error);
				}
			}
		} finally {
			isProcessing = false;
		}
	}


	// Get the appropriate renderer component
	function getRendererComponent(components: any, type: ChildRenderer['type']) {
		const componentMap = {
			timeline: components.TimelineRenderer,
			chart: components.ChartRenderer,
			mermaid: components.MermaidRenderer,
			media: components.MediaRenderer,
			image: components.ImageRenderer,
			pdf: components.PDFRenderer,
			file: components.FileRenderer,
			url: components.URLPreviewRenderer,
			table: components.TableRenderer
		};
		return componentMap[type];
	}

	// Format content for specific renderer
	function formatContentForRenderer(renderer: ChildRenderer): string {
		switch (renderer.type) {
			case 'timeline':
				return `\`\`\`timeline\n${renderer.code}\n\`\`\``;
			case 'chart':
				return `\`\`\`chart\n${renderer.code}\n\`\`\``;
			case 'media':
				// Detect if it's audio or video based on URL/extension
				const isAudio = /\.(mp3|wav|ogg|aac|m4a|flac)(\?[^\s]*)?$/i.test(renderer.code.trim());
				const mediaType = isAudio ? 'audio' : 'video';
				return `\`\`\`${mediaType}\n${renderer.code}\n\`\`\``;
			case 'mermaid':
				return `\`\`\`mermaid\n${renderer.code}\n\`\`\``;
			case 'table':
				// For table renderer, check if original was CSV and preserve that
				const hasCommas = renderer.code.includes(',');
				const originalType = hasCommas ? 'csv' : 'table';
				return `\`\`\`${originalType}\n${renderer.code}\n\`\`\``;
			default:
				return `\`\`\`${renderer.type}\n${renderer.code}\n\`\`\``;
		}
	}

	// Override link rendering for security
	renderer.link = function(href: string, title: string | null, text: string) {
		const titleAttr = title ? ` title="${title}"` : '';
		return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
	};

	marked.use({ renderer });

	// Process math formulas
	function processMathFormulas(text: string): string {
		if (!browser) return text;

		try {
			// Process display math: $$...$$
			text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
				try {
					const rendered = katex.renderToString(formula.trim(), {
						displayMode: true,
						throwOnError: false,
						output: 'html',
						trust: false,
						strict: false
					});
					return `<div class="math-display">${rendered}</div>`;
				} catch (error) {
					console.error('Display math error:', error);
					return match;
				}
			});

			// Process inline math: $...$
			text = text.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
				try {
					const rendered = katex.renderToString(formula.trim(), {
						displayMode: false,
						throwOnError: false,
						output: 'html',
						trust: false,
						strict: false
					});
					return `<span class="math-inline">${rendered}</span>`;
				} catch (error) {
					console.error('Inline math error:', error);
					return match;
				}
			});

			return text;
		} catch (error) {
			console.error('Math processing error:', error);
			return text;
		}
	}

	// Initialize Mermaid
	function initializeMermaid() {
		if (!browser || mermaidInitialized) return;

		mermaid.initialize({
			theme: 'dark',
			themeVariables: {
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
			flowchart: { useMaxWidth: true, htmlLabels: true },
			sequence: { useMaxWidth: true },
			gantt: { useMaxWidth: true }
		});

		mermaidInitialized = true;
	}

	// Import renderer components dynamically
	async function importRendererComponents() {
		try {
			console.log('Importing renderer components...');
			const components = await Promise.all([
				import('./TimelineRenderer.svelte'),
				import('./ChartRenderer.svelte'), 
				import('./MermaidRenderer.svelte'),
				import('./MediaRenderer.svelte'),
				import('./ImageRenderer.svelte'),
				import('./PDFRenderer.svelte'),
				import('./FileRenderer.svelte'),
				import('./URLPreviewRenderer.svelte'),
				import('./TableRenderer.svelte')
			]);

			console.log('Components imported successfully:', components);
			return {
				TimelineRenderer: components[0].default,
				ChartRenderer: components[1].default,
				MermaidRenderer: components[2].default,
				MediaRenderer: components[3].default,
				ImageRenderer: components[4].default,
				PDFRenderer: components[5].default,
				FileRenderer: components[6].default,
				URLPreviewRenderer: components[7].default,
				TableRenderer: components[8].default
			};
		} catch (error) {
			console.error('Failed to import renderer components:', error);
			return null;
		}
	}

	// Clean markdown rendering with registry system
	async function renderMarkdown(text: string): Promise<string> {
		try {
			// First, process math formulas
			const textWithMath = processMathFormulas(text);
			
			// Parse markdown to HTML (this will register child renderers)
			const html = await marked.parse(textWithMath);
			
			// Sanitize HTML to prevent XSS
			const cleanHtml = DOMPurify.sanitize(html, {
				ALLOWED_TAGS: [
					'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
					'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
					'ul', 'ol', 'li', 'blockquote',
					'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
					'hr', 'div', 'span', 'math', 'semantics', 'mrow', 'mi', 'mn', 'mo',
					'button' // For Marp presentation buttons
				],
				ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'alt', 'src', 'class', 'id', 'style', 'onclick'],
				ALLOWED_SCHEMES: ['http', 'https', 'data']
			});
			
			return cleanHtml;
		} catch (error) {
			console.error('Error parsing markdown:', error);
			return `<p>Error rendering markdown: ${text}</p>`;
		}
	}

	let isRendering = false;
	let lastContent = '';

	// New clean render function using registry system
	async function renderContent() {
		if (!browser || isRendering) return;
		
		// For streaming content, don't reset registry on every change
		// Only reset if content is significantly different (new conversation)
		if (content !== lastContent) {
			const isNewContent = lastContent === '' || 
								 content.length < lastContent.length || 
								 !content.startsWith(lastContent.substring(0, Math.min(50, lastContent.length)));
			
			if (isNewContent) {
				// Clear registry and force re-render for new content
				childRenderers.clear();
				isProcessing = false;
				renderedHtml = '';
			}
		}
		
		if (content === lastContent) return;
		
		isRendering = true;
		lastContent = content;
		
		try {
			// Render markdown (which registers child renderers)
			renderedHtml = await renderMarkdown(content);
			
			// Wait for DOM update
			await new Promise(resolve => setTimeout(resolve, 10));
			
			// Process registered child renderers
			await processChildRenderers();
			
		} catch (error) {
			console.error('Render error:', error);
		} finally {
			isRendering = false;
		}
	}

	onMount(() => {
		if (browser) {
			renderContent();
		}
	});

	// Re-render when content changes
	$effect(() => {
		if (browser && content) {
			renderContent();
		}
	});
</script>

<div 
	bind:this={containerElement}
	class="markdown-renderer renderer-content"
>
	{@html renderedHtml}
</div>

<style>
	.markdown-renderer {
		font-family: inherit;
		line-height: 1.6;
		color: inherit;
	}

	/* Enhanced code block styling */
	:global(.markdown-renderer .code-block) {
		background-color: rgba(0, 0, 0, 0.4) !important;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 1rem;
		margin: 0.8rem 0;
		overflow-x: auto;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
		line-height: 1.4;
	}

	:global(.markdown-renderer .inline-code) {
		background-color: rgba(0, 0, 0, 0.3) !important;
		color: #f8f8f2;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
	}

	/* Typography improvements */
	:global(.markdown-renderer h1) {
		font-size: 1.8em;
		font-weight: 600;
		margin: 1.2rem 0 0.8rem 0;
		border-bottom: 2px solid rgba(255, 255, 255, 0.2);
		padding-bottom: 0.3rem;
	}

	:global(.markdown-renderer h2) {
		font-size: 1.5em;
		font-weight: 600;
		margin: 1rem 0 0.6rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 0.2rem;
	}

	:global(.markdown-renderer h3) {
		font-size: 1.3em;
		font-weight: 600;
		margin: 0.8rem 0 0.4rem 0;
	}

	:global(.markdown-renderer p) {
		margin: 0.6rem 0;
		text-align: left;
	}

	:global(.markdown-renderer ul, .markdown-renderer ol) {
		margin: 0.6rem 0;
		padding-left: 1.8rem;
	}

	:global(.markdown-renderer li) {
		margin: 0.3rem 0;
	}

	:global(.markdown-renderer blockquote) {
		border-left: 4px solid rgba(255, 255, 255, 0.3);
		padding-left: 1rem;
		margin: 0.8rem 0;
		font-style: italic;
		opacity: 0.9;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 0 4px 4px 0;
	}

	:global(.markdown-renderer table) {
		border-collapse: collapse;
		width: 100%;
		margin: 0.8rem 0;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	:global(.markdown-renderer th, .markdown-renderer td) {
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.6rem 0.8rem;
		text-align: left;
	}

	:global(.markdown-renderer th) {
		background-color: rgba(255, 255, 255, 0.1);
		font-weight: 600;
	}

	:global(.markdown-renderer a) {
		color: #66b3ff;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color 0.2s ease;
	}

	:global(.markdown-renderer a:hover) {
		border-bottom-color: #66b3ff;
	}

	:global(.markdown-renderer hr) {
		border: none;
		height: 1px;
		background-color: rgba(255, 255, 255, 0.2);
		margin: 1.5rem 0;
	}

	:global(.markdown-renderer img) {
		max-width: 100%;
		height: auto;
		border-radius: 6px;
		margin: 0.5rem 0;
	}

	/* Strong and emphasis */
	:global(.markdown-renderer strong) {
		font-weight: 700;
		color: #ffffff;
	}

	:global(.markdown-renderer em) {
		font-style: italic;
		color: #e8e8e8;
	}

	/* Math formula styling */
	:global(.markdown-renderer .math-display) {
		margin: 1rem 0;
		text-align: center;
		padding: 0.8rem;
		background-color: rgba(255, 255, 255, 0.02);
		border-radius: 6px;
		overflow-x: auto;
	}

	:global(.markdown-renderer .math-inline) {
		padding: 0.2rem 0.4rem;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
		display: inline-block;
		margin: 0 0.1rem;
	}

	/* Mermaid container styling */
	:global(.markdown-renderer .mermaid-container) {
		margin: 0;
		padding: 1rem;
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 8px 8px 0 0;
		text-align: center;
		min-height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.markdown-renderer .mermaid-container svg) {
		max-width: 100%;
		height: auto;
	}

	/* Override KaTeX colors for dark theme */
	:global(.markdown-renderer .katex) {
		color: #ffffff;
		font-size: 1.1em;
	}

	/* Wrapper styles for consistent layout */
	:global(.markdown-renderer .renderer-wrapper),
	:global(.markdown-renderer .code-block-wrapper) {
		position: relative;
		margin: 0.5rem 0;
	}

	/* Renderer notes styling - positioned at bottom with no gap */
	:global(.markdown-renderer .renderer-note) {
		font-size: 0.7rem;
		color: #888;
		background-color: rgba(0, 0, 0, 0.3);
		padding: 0 0.5rem;
		border-radius: 0 0 4px 4px;
		margin: 0;
		border-top: 1px solid #0b69a3;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		display: block;
	}

	/* Ensure pre tags have no bottom margin when in wrapper */
	:global(.markdown-renderer .code-block-wrapper pre) {
		margin-bottom: 0 !important;
		border-radius: 6px 6px 0 0;
	}
</style>