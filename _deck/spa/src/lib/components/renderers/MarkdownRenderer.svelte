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
	}

	let { content }: Props = $props();
	let renderedHtml = $state<string>('');
	let containerElement: HTMLDivElement;
	let mermaidInitialized = false;

	// Configure marked for better security and formatting
	marked.setOptions({
		breaks: true, // Convert \n to <br>
		gfm: true, // GitHub Flavored Markdown
		silent: true // Don't throw on error
	});

	// Custom renderer for better chat styling
	const renderer = new marked.Renderer();
	
	// Override code block rendering
	renderer.code = function(code: string, language?: string) {
		const lang = (language || 'text').toLowerCase();
		
		// Helper function to create renderer note
		function createRendererNote(rendererName: string): string {
			return `<div class="renderer-note">🔧 ${rendererName}</div>`;
		}
		
		// Special handling for Mermaid diagrams
		if (lang === 'mermaid') {
			const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="mermaid-container" data-mermaid-code="${encodeURIComponent(code)}" id="${id}"></div>${createRendererNote('MermaidRenderer')}</div>`;
		}

		// Special handling for Charts
		if (lang === 'chart') {
			const id = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="chart-container" data-chart-code="${encodeURIComponent(code)}" id="${id}"></div>${createRendererNote('ChartRenderer')}</div>`;
		}

		// Special handling for Marp presentations - show as markdown with button
		if (lang === 'marp') {
			const id = `marp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="marp-simple-container" data-marp-code="${encodeURIComponent(code)}" id="${id}"></div>${createRendererNote('MarpRenderer (Presentation)')}</div>`;
		}

		// Special handling for Media (audio/video)
		if (lang === 'audio' || lang === 'video') {
			const id = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="media-container" data-media-code="${encodeURIComponent(code)}" data-media-type="${lang}" id="${id}"></div>${createRendererNote('MediaRenderer (' + lang.charAt(0).toUpperCase() + lang.slice(1) + ')')}</div>`;
		}

		// Special handling for Timeline
		if (lang === 'timeline') {
			const id = `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="timeline-container" data-timeline-code="${encodeURIComponent(code)}" id="${id}"></div>${createRendererNote('TimelineRenderer')}</div>`;
		}

		// Special handling for Tables
		if (lang === 'table' || lang === 'csv') {
			const id = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="table-container" data-table-code="${encodeURIComponent(code)}" id="${id}"></div>${createRendererNote('TableRenderer')}</div>`;
		}

		// Special handling for Images
		if (lang === 'image') {
			const id = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="image-container" data-image-code="${encodeURIComponent(code)}" id="${id}"></div>${createRendererNote('ImageRenderer')}</div>`;
		}

		// Special handling for PDF
		if (lang === 'pdf') {
			const id = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="pdf-container" data-pdf-code="${encodeURIComponent(code)}" id="${id}"></div>${createRendererNote('PDFRenderer')}</div>`;
		}

		// Special handling for Files
		if (lang === 'file') {
			const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="file-container" data-file-code="${encodeURIComponent(code)}" id="${id}"></div>${createRendererNote('FileRenderer')}</div>`;
		}

		// Special handling for URL Preview
		if (lang === 'url') {
			const id = `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			return `<div class="renderer-wrapper"><div class="url-container" data-url-code="${encodeURIComponent(code)}" id="${id}"></div>${createRendererNote('URLPreviewRenderer')}</div>`;
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
		const codeRendererNote = createRendererNote(`CodeRenderer (${lang || 'auto-detect'})`);
		return `<div class="code-block-wrapper"><pre class="code-block"><code class="language-${lang}">${highlightedCode}</code></pre>${codeRendererNote}</div>`;
	};

	// Override inline code rendering
	renderer.codespan = function(code: string) {
		return `<code class="inline-code">${code}</code>`;
	};

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

	// Render mermaid diagrams in the DOM - only when complete
	async function renderMermaidDiagrams() {
		if (!browser || !containerElement) return;

		const mermaidContainers = containerElement.querySelectorAll('.mermaid-container:not([data-processed])');
		
		for (const container of mermaidContainers) {
			const mermaidCode = decodeURIComponent(container.getAttribute('data-mermaid-code') || '');
			const id = container.id;

			if (!mermaidCode.trim()) continue;

			// Check if the mermaid code block is complete (avoid streaming issues)
			const parentText = containerElement.textContent || '';
			const codeBlockStart = parentText.indexOf('```mermaid');
			const codeBlockEnd = parentText.indexOf('```', codeBlockStart + 10);
			
			// Only process if we have a complete code block
			if (codeBlockStart === -1 || codeBlockEnd === -1) {
				continue;
			}

			try {
				// Mark as being processed
				container.setAttribute('data-processed', 'true');
				
				// Generate unique ID for mermaid render to avoid conflicts
				const renderID = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
				const { svg } = await mermaid.render(renderID, mermaidCode);
				
				// Set the SVG content and prevent further processing
				container.innerHTML = svg;
				container.removeAttribute('data-mermaid-code'); // Prevent re-processing
				
				// Apply styling
				container.style.textAlign = 'center';
				container.style.padding = '1rem';
				container.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
				container.style.borderRadius = '8px 8px 0 0';
				container.style.margin = '0';
			} catch (error) {
				console.error('Mermaid rendering error:', error);
				container.innerHTML = `<div style="color: #ff7b72; padding: 1rem; background: rgba(255,123,114,0.1); border-radius: 6px;">
					<strong>Mermaid Error:</strong><br>
					<pre style="margin: 0.5rem 0; font-size: 0.8rem;">${mermaidCode}</pre>
				</div>`;
			}
		}
	}

	// Render chart containers in the DOM
	async function renderChartContainers() {
		if (!browser || !containerElement) return;

		const chartContainers = containerElement.querySelectorAll('.chart-container');
		
		for (const container of chartContainers) {
			const chartCode = decodeURIComponent(container.getAttribute('data-chart-code') || '');
			
			if (!chartCode.trim()) continue;

			try {
				// Parse chart data
				const cleanCode = chartCode.replace(/```chart\s*\n?|\n?```$/g, '').trim();
				let chartConfig: any;
				
				try {
					chartConfig = JSON.parse(cleanCode);
				} catch {
					// Try simple format
					const lines = cleanCode.split('\n').filter(line => line.trim());
					if (lines.length < 2) throw new Error('Invalid chart format');
					
					const typeMatch = lines[0].match(/^type:\s*(\w+)/i);
					if (!typeMatch) throw new Error('Chart type not specified');
					
					const type = typeMatch[1].toLowerCase();
					const labels: string[] = [];
					const values: number[] = [];
					
					for (const line of lines.slice(1)) {
						const match = line.match(/^([^:]+):\s*(.+)$/);
						if (match) {
							labels.push(match[1].trim());
							const value = parseFloat(match[2].trim());
							if (!isNaN(value)) values.push(value);
						}
					}
					
					chartConfig = {
						type,
						data: {
							labels,
							datasets: [{
								label: 'Data',
								data: values,
								backgroundColor: [
									'rgba(255, 99, 132, 0.6)',
									'rgba(54, 162, 235, 0.6)',
									'rgba(255, 205, 86, 0.6)',
									'rgba(75, 192, 192, 0.6)',
									'rgba(153, 102, 255, 0.6)'
								]
							}]
						}
					};
				}

				// Create canvas and render chart
				const canvas = document.createElement('canvas');
				canvas.style.width = '100%';
				canvas.style.height = '300px';
				
				container.innerHTML = '';
				container.appendChild(canvas);
				container.style.padding = '1rem';
				container.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
				container.style.borderRadius = '8px 8px 0 0';
				container.style.margin = '0';

				// Import Chart.js dynamically with all necessary components
				const chartJS = await import('chart.js');
				const { Chart, registerables } = chartJS;
				
				// Register all Chart.js components
				Chart.register(...registerables);
				
				const chart = new Chart(canvas, {
					type: chartConfig.type || 'bar',
					data: chartConfig.data,
					options: {
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: { labels: { color: '#ffffff' } },
							title: { color: '#ffffff' }
						},
						scales: chartConfig.type === 'pie' || chartConfig.type === 'doughnut' ? {} : {
							x: {
								ticks: { color: '#ffffff' },
								grid: { color: 'rgba(255, 255, 255, 0.1)' }
							},
							y: {
								ticks: { color: '#ffffff' },
								grid: { color: 'rgba(255, 255, 255, 0.1)' }
							}
						}
					}
				});
				
			} catch (error) {
				console.error('Chart rendering error:', error);
				container.innerHTML = `<div style="color: #ff7b72; padding: 1rem; background: rgba(255,123,114,0.1); border-radius: 6px;">
					<strong>Chart Error:</strong> ${error.message}<br>
					<pre style="margin: 0.5rem 0; font-size: 0.8rem;">${chartCode}</pre>
				</div>`;
			}
		}
	}

	// Simple Marp containers - render as markdown with "Show as Marp" button
	async function renderMarpContainers() {
		if (!browser || !containerElement) return;

		const marpContainers = containerElement.querySelectorAll('.marp-simple-container');
		
		for (const container of marpContainers) {
			const marpCode = decodeURIComponent(container.getAttribute('data-marp-code') || '');
			
			if (!marpCode.trim()) continue;

			try {
				// Clean the Marp code and remove directives for markdown display
				let cleanCode = marpCode.replace(/```marp\s*\n?|\n?```$/g, '').trim();
				cleanCode = cleanCode.replace(/^---[\s\S]*?---\s*/m, ''); // Remove frontmatter
				
				// Render as markdown
				const markdownHtml = await renderMarkdown(cleanCode);
				
				// Create simple container with markdown preview and button
				container.innerHTML = `
					<div class="marp-simple-preview" style="
						border: 1px solid rgba(255, 255, 255, 0.2);
						border-radius: 8px 8px 0 0;
						overflow: hidden;
						background: rgba(0, 0, 0, 0.1);
						margin: 0;
					">
						<!-- Header with Marp label and button -->
						<div class="marp-header" style="
							display: flex;
							justify-content: space-between;
							align-items: center;
							padding: 0.6rem 0.8rem;
							background-color: rgba(0, 0, 0, 0.3);
							border-bottom: 1px solid rgba(255, 255, 255, 0.1);
						">
							<span style="
								color: #a0a0a0;
								font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
								text-transform: uppercase;
								font-weight: 600;
								font-size: 0.7rem;
								letter-spacing: 0.5px;
							">Marp Presentation</span>
							<button onclick="openMarpPresentation('${container.id}')" style="
								background: #0b69a3;
								border: none;
								color: white;
								cursor: pointer;
								padding: 0.5rem 1rem;
								border-radius: 4px;
								font-size: 0.8rem;
								font-weight: 500;
								transition: background 0.2s ease;
							" title="Open presentation in fullscreen" onmouseover="this.style.backgroundColor='#085a8a'" onmouseout="this.style.backgroundColor='#0b69a3'">
								📽️ Show as Marp
							</button>
						</div>
						
						<!-- Markdown Preview -->
						<div class="marp-markdown-preview" style="
							padding: 1rem;
							max-height: 200px;
							overflow-y: auto;
						">
							${markdownHtml}
						</div>
					</div>
				`;
				
				// Store the original source code for the button
				container.setAttribute('data-marp-source', encodeURIComponent(marpCode));
				
			} catch (error) {
				console.error('Marp preview error:', error);
				container.innerHTML = `<div style="color: #ff7b72; padding: 1rem; background: rgba(255,123,114,0.1); border-radius: 6px;">
					<strong>Marp Preview Error:</strong> ${error.message}<br>
					<pre style="margin: 0.5rem 0; font-size: 0.8rem;">${marpCode}</pre>
				</div>`;
			}
		}
	}

	// Import renderer components dynamically
	async function importRendererComponents() {
		if (browser) {
			const [
				{ default: MediaRenderer },
				{ default: TimelineRenderer },
				{ default: TableRenderer },
				{ default: ImageRenderer },
				{ default: PDFRenderer },
				{ default: FileRenderer },
				{ default: URLPreviewRenderer }
			] = await Promise.all([
				import('./MediaRenderer.svelte'),
				import('./TimelineRenderer.svelte'),
				import('./TableRenderer.svelte'),
				import('./ImageRenderer.svelte'),
				import('./PDFRenderer.svelte'),
				import('./FileRenderer.svelte'),
				import('./URLPreviewRenderer.svelte')
			]);
			
			return {
				MediaRenderer,
				TimelineRenderer,
				TableRenderer,
				ImageRenderer,
				PDFRenderer,
				FileRenderer,
				URLPreviewRenderer
			};
		}
		return null;
	}

	// Check if a code block is complete during streaming
	function isCodeBlockComplete(containerElement: Element, blockType: string): boolean {
		const parentText = containerElement.textContent || '';
		const blockStart = parentText.indexOf(`\`\`\`${blockType}`);
		const blockEnd = parentText.indexOf('```', blockStart + blockType.length + 3);
		return blockStart !== -1 && blockEnd !== -1;
	}

	// Render media containers (audio/video) in the DOM - only when complete
	async function renderMediaContainers() {
		if (!browser || !containerElement) return;

		const mediaContainers = containerElement.querySelectorAll('.media-container:not([data-processed])');
		
		if (mediaContainers.length === 0) return;
		
		try {
			const components = await importRendererComponents();
			if (!components) return;
			
			for (const container of mediaContainers) {
				const mediaCode = decodeURIComponent(container.getAttribute('data-media-code') || '');
				const mediaType = container.getAttribute('data-media-type') || '';
				
				if (!mediaCode.trim()) continue;

				// Only process complete code blocks
				if (!isCodeBlockComplete(containerElement, mediaType)) {
					continue;
				}
				
				// Mark as processed
				container.setAttribute('data-processed', 'true');
				
				// Create Svelte component instance using Svelte 5 mount
				const { mount: mountMedia } = await import('svelte');
				mountMedia(components.MediaRenderer, {
					target: container,
					props: {
						content: `\`\`\`${mediaType}\n${mediaCode}\n\`\`\``
					}
				});
				
				container.removeAttribute('data-media-code');
			}
		} catch (error) {
			console.error('Media rendering error:', error);
		}
	}

	// Render timeline containers in the DOM - only when complete
	async function renderTimelineContainers() {
		if (!browser || !containerElement) return;

		const timelineContainers = containerElement.querySelectorAll('.timeline-container:not([data-processed])');
		
		if (timelineContainers.length === 0) return;
		
		try {
			const components = await importRendererComponents();
			if (!components) return;
			
			for (const container of timelineContainers) {
				const timelineCode = decodeURIComponent(container.getAttribute('data-timeline-code') || '');
				
				if (!timelineCode.trim()) continue;

				// Debug: Check if timeline code is available
				console.log('Processing timeline with code:', timelineCode.substring(0, 50) + '...');
				
				// Re-enabled timeline processing with improved initialization logic
				console.log('Timeline processing enabled - testing improved initialization');
				
				// Mark as processed
				container.setAttribute('data-processed', 'true');
				
				// Create Svelte component instance using Svelte 5 mount
				const { mount } = await import('svelte');
				mount(components.TimelineRenderer, {
					target: container,
					props: {
						content: `\`\`\`timeline\n${timelineCode}\n\`\`\``
					}
				});
				
				container.removeAttribute('data-timeline-code');
			}
		} catch (error) {
			console.error('Timeline rendering error:', error);
		}
	}

	// Render table containers in the DOM - only when complete
	async function renderTableContainers() {
		if (!browser || !containerElement) return;

		const tableContainers = containerElement.querySelectorAll('.table-container:not([data-processed])');
		
		if (tableContainers.length === 0) return;
		
		try {
			const components = await importRendererComponents();
			if (!components) return;
			
			for (const container of tableContainers) {
				const tableCode = decodeURIComponent(container.getAttribute('data-table-code') || '');
				
				if (!tableCode.trim()) continue;

				// Only process complete code blocks
				if (!isCodeBlockComplete(containerElement, 'table') && !isCodeBlockComplete(containerElement, 'csv')) {
					continue;
				}
				
				// Mark as processed
				container.setAttribute('data-processed', 'true');
				
				// Create Svelte component instance using Svelte 5 mount
				const { mount: mountTable } = await import('svelte');
				mountTable(components.TableRenderer, {
					target: container,
					props: {
						content: `\`\`\`csv\n${tableCode}\n\`\`\``
					}
				});
				
				container.removeAttribute('data-table-code');
			}
		} catch (error) {
			console.error('Table rendering error:', error);
		}
	}

	// Render image containers in the DOM - only when complete
	async function renderImageContainers() {
		if (!browser || !containerElement) return;

		const imageContainers = containerElement.querySelectorAll('.image-container:not([data-processed])');
		
		if (imageContainers.length === 0) return;
		
		try {
			const components = await importRendererComponents();
			if (!components) return;
			
			for (const container of imageContainers) {
				const imageCode = decodeURIComponent(container.getAttribute('data-image-code') || '');
				
				if (!imageCode.trim()) continue;

				// Only process complete code blocks
				if (!isCodeBlockComplete(containerElement, 'image')) {
					continue;
				}
				
				// Mark as processed
				container.setAttribute('data-processed', 'true');
				
				// Create Svelte component instance using Svelte 5 mount
				const { mount: mountImage } = await import('svelte');
				mountImage(components.ImageRenderer, {
					target: container,
					props: {
						content: `\`\`\`image\n${imageCode}\n\`\`\``
					}
				});
				
				container.removeAttribute('data-image-code');
			}
		} catch (error) {
			console.error('Image rendering error:', error);
		}
	}

	// Render PDF containers in the DOM - only when complete
	async function renderPDFContainers() {
		if (!browser || !containerElement) return;

		const pdfContainers = containerElement.querySelectorAll('.pdf-container:not([data-processed])');
		
		if (pdfContainers.length === 0) return;
		
		try {
			const components = await importRendererComponents();
			if (!components) return;
			
			for (const container of pdfContainers) {
				const pdfCode = decodeURIComponent(container.getAttribute('data-pdf-code') || '');
				
				if (!pdfCode.trim()) continue;

				// Only process complete code blocks
				if (!isCodeBlockComplete(containerElement, 'pdf')) {
					continue;
				}
				
				// Mark as processed
				container.setAttribute('data-processed', 'true');
				
				// Create Svelte component instance using Svelte 5 mount
				const { mount: mountPDF } = await import('svelte');
				mountPDF(components.PDFRenderer, {
					target: container,
					props: {
						content: `\`\`\`pdf\n${pdfCode}\n\`\`\``
					}
				});
				
				container.removeAttribute('data-pdf-code');
			}
		} catch (error) {
			console.error('PDF rendering error:', error);
		}
	}

	// Render file containers in the DOM - only when complete
	async function renderFileContainers() {
		if (!browser || !containerElement) return;

		const fileContainers = containerElement.querySelectorAll('.file-container:not([data-processed])');
		
		if (fileContainers.length === 0) return;
		
		try {
			const components = await importRendererComponents();
			if (!components) return;
			
			for (const container of fileContainers) {
				const fileCode = decodeURIComponent(container.getAttribute('data-file-code') || '');
				
				if (!fileCode.trim()) continue;

				// Only process complete code blocks
				if (!isCodeBlockComplete(containerElement, 'file')) {
					continue;
				}
				
				// Mark as processed
				container.setAttribute('data-processed', 'true');
				
				// Create Svelte component instance using Svelte 5 mount
				const { mount: mountFile } = await import('svelte');
				mountFile(components.FileRenderer, {
					target: container,
					props: {
						content: `\`\`\`file\n${fileCode}\n\`\`\``
					}
				});
				
				container.removeAttribute('data-file-code');
			}
		} catch (error) {
			console.error('File rendering error:', error);
		}
	}

	// Render URL containers in the DOM - only when complete
	async function renderURLContainers() {
		if (!browser || !containerElement) return;

		const urlContainers = containerElement.querySelectorAll('.url-container:not([data-processed])');
		
		if (urlContainers.length === 0) return;
		
		try {
			const components = await importRendererComponents();
			if (!components) return;
			
			for (const container of urlContainers) {
				const urlCode = decodeURIComponent(container.getAttribute('data-url-code') || '');
				
				if (!urlCode.trim()) continue;

				// Only process complete code blocks
				if (!isCodeBlockComplete(containerElement, 'url')) {
					continue;
				}
				
				// Mark as processed
				container.setAttribute('data-processed', 'true');
				
				// Create Svelte component instance using Svelte 5 mount
				const { mount: mountURL } = await import('svelte');
				mountURL(components.URLPreviewRenderer, {
					target: container,
					props: {
						content: `\`\`\`url\n${urlCode}\n\`\`\``
					}
				});
				
				container.removeAttribute('data-url-code');
			}
		} catch (error) {
			console.error('URL rendering error:', error);
		}
	}

	async function renderMarkdown(text: string): Promise<string> {
		try {
			// First, process math formulas
			const textWithMath = processMathFormulas(text);
			
			// Parse markdown to HTML
			const html = await marked.parse(textWithMath);
			
			// Sanitize HTML to prevent XSS
			const cleanHtml = DOMPurify.sanitize(html, {
				ALLOWED_TAGS: [
					'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
					'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
					'ul', 'ol', 'li', 'blockquote',
					'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
					'hr', 'div', 'span', 'math', 'semantics', 'mrow', 'mi', 'mn', 'mo'
				],
				ALLOWED_ATTR: [
					'href', 'target', 'rel', 'title', 'alt', 'src',
					'class', 'id', 'style', 'data-mermaid-code', 'data-chart-code', 'data-marp-code', 
					'data-chart-content', 'data-marp-content', 'data-rendered', 'aria-hidden'
				],
				ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
			});

			return cleanHtml;
		} catch (error) {
			console.error('Markdown rendering error:', error);
			return `<p>Error rendering markdown: ${text}</p>`;
		}
	}

	let isRendering = false;
	let lastContent = '';

	async function renderContent() {
		if (!browser || isRendering || content === lastContent) return;
		
		isRendering = true;
		lastContent = content;
		
		try {
			initializeMermaid();
			renderedHtml = await renderMarkdown(content);
			// Use nextTick equivalent to ensure DOM is updated
			await new Promise(resolve => setTimeout(resolve, 0));
			await renderMermaidDiagrams();
			await renderChartContainers();
			await renderMarpContainers();
			await renderMediaContainers();
			await renderTimelineContainers();
			await renderTableContainers();
			await renderImageContainers();
			await renderPDFContainers();
			await renderFileContainers();
			await renderURLContainers();
		} catch (error) {
			console.error('Render error:', error);
		} finally {
			isRendering = false;
		}
	}

	// Simple global function for opening Marp presentations
	function setupGlobalMarpFunctions() {
		if (!browser) return;

		// @ts-ignore
		window.openMarpPresentation = (containerId: string) => {
			const container = document.getElementById(containerId);
			if (!container) return;
			
			const source = decodeURIComponent(container.getAttribute('data-marp-source') || '');
			if (!source) return;
			
			// Store source in session storage instead of URL
			const presentationId = `marp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			sessionStorage.setItem(presentationId, source);
			
			// Open presentation with just the ID
			const presentationUrl = `/presentation?id=${presentationId}`;
			window.open(presentationUrl, '_blank');
		};
	}

	onMount(() => {
		if (browser) {
			setupGlobalMarpFunctions();
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