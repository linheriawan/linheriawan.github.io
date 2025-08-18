<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		content: string; // URL to PDF or base64 PDF data
	}

	let { content }: Props = $props();
	let canvasContainer: HTMLDivElement;
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let currentPage = $state<number>(1);
	let totalPages = $state<number>(0);
	let zoomLevel = $state<number>(1.0);
	let pdfDoc: any = null;
	let renderingPage = $state<boolean>(false);
	let initialized = $state<boolean>(false);

	// Extract PDF URL from content
	function extractPdfUrl(text: string): string {
		// Extract from ```pdf code blocks
		const codeBlockMatch = text.match(/```pdf\s*([\s\S]*?)\s*```/i);
		if (codeBlockMatch) {
			return codeBlockMatch[1].trim();
		}

		const trimmed = text.trim();
		// Direct PDF URL
		if (trimmed.match(/^https?:\/\/[^\s]+\.pdf(\?[^\s]*)?$/i)) {
			return trimmed;
		}
		// URL in markdown link format [text](url)
		const linkMatch = trimmed.match(/\[([^\]]*)\]\(([^)]+\.pdf[^)]*)\)/i);
		if (linkMatch) {
			return linkMatch[2];
		}
		// URL mentioned in text
		const urlMatch = trimmed.match(/https?:\/\/[^\s]+\.pdf(\?[^\s]*)?/i);
		if (urlMatch) {
			return urlMatch[0];
		}
		
		throw new Error('No valid PDF URL found in content');
	}

	async function loadPDF() {
		if (!browser || !canvasContainer) {
			isLoading = false;
			return;
		}

		try {
			isLoading = true;
			hasError = false;
			
			// Clean up any existing content
			if (canvasContainer) {
				canvasContainer.innerHTML = '';
			}
			
			const pdfUrl = extractPdfUrl(content);
			console.log('Loading PDF from:', pdfUrl);

			// Dynamic import pdfjs-dist
			const pdfjsLib = await import('pdfjs-dist');
			
			// Set worker source - use the local package worker to ensure version compatibility
			pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

			// Load PDF document
			const loadingTask = pdfjsLib.getDocument({
				url: pdfUrl,
				cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
				cMapPacked: true
			});

			pdfDoc = await loadingTask.promise;
			totalPages = pdfDoc.numPages;
			
			console.log(`PDF loaded: ${totalPages} pages`);
			await renderPage(1);

		} catch (error: any) {
			console.error('PDF loading error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to load PDF';
		} finally {
			isLoading = false;
		}
	}

	async function renderPage(pageNum: number) {
		if (!pdfDoc || renderingPage) return;
		
		try {
			renderingPage = true;
			
			// Clear previous canvas
			canvasContainer.innerHTML = '';
			
			// Get page
			const page = await pdfDoc.getPage(pageNum);
			
			// Create canvas
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			canvasContainer.appendChild(canvas);

			// Calculate scale for responsive rendering
			const containerWidth = canvasContainer.clientWidth || 600; // fallback width
			const viewport = page.getViewport({ scale: 1 });
			console.log('Container width:', containerWidth, 'Viewport:', viewport.width, 'x', viewport.height);
			
			// Use a base scale that makes the PDF readable, then apply zoom
			const baseScale = Math.min((containerWidth - 40) / viewport.width, 1.5);
			const scale = Math.max(baseScale * zoomLevel, 0.5); // minimum 0.5x scale
			
			console.log('Calculated scale:', scale, 'Zoom level:', zoomLevel);
			
			const scaledViewport = page.getViewport({ scale });
			console.log('Scaled viewport:', scaledViewport.width, 'x', scaledViewport.height);
			
			// Set canvas size
			canvas.width = scaledViewport.width;
			canvas.height = scaledViewport.height;
			canvas.style.maxWidth = '100%';
			canvas.style.height = 'auto';
			canvas.style.border = '1px solid #ccc'; // visual border to see canvas

			// Render page
			const renderContext = {
				canvasContext: context,
				viewport: scaledViewport
			};

			await page.render(renderContext).promise;
			currentPage = pageNum;
			
		} catch (error: any) {
			console.error('Page rendering error:', error);
			hasError = true;
			errorMessage = `Failed to render page ${pageNum}: ${error.message}`;
		} finally {
			renderingPage = false;
		}
	}

	function goToPage(pageNum: number) {
		if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
			renderPage(pageNum);
		}
	}

	function previousPage() {
		if (currentPage > 1) {
			goToPage(currentPage - 1);
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			goToPage(currentPage + 1);
		}
	}

	function zoomIn() {
		if (zoomLevel < 3.0) {
			zoomLevel = Math.min(zoomLevel + 0.25, 3.0);
			renderPage(currentPage);
		}
	}

	function zoomOut() {
		if (zoomLevel > 0.5) {
			zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
			renderPage(currentPage);
		}
	}

	function resetZoom() {
		zoomLevel = 1.0;
		renderPage(currentPage);
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.target instanceof HTMLInputElement) return;
		
		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
				event.preventDefault();
				previousPage();
				break;
			case 'ArrowRight':
			case 'ArrowDown':
			case ' ':
				event.preventDefault();
				nextPage();
				break;
			case '=':
			case '+':
				event.preventDefault();
				zoomIn();
				break;
			case '-':
				event.preventDefault();
				zoomOut();
				break;
			case '0':
				event.preventDefault();
				resetZoom();
				break;
		}
	}

	// Re-render on zoom change
	$effect(() => {
		if (pdfDoc && !renderingPage) {
			renderPage(currentPage);
		}
	});

	// Use effect to initialize when container is available
	$effect(() => {
		console.log('PDF effect triggered');
		console.log('Browser available:', browser);
		console.log('Canvas container:', canvasContainer);
		console.log('Content:', content);
		console.log('Already initialized:', initialized);
		
		if (browser && canvasContainer && content && !initialized) {
			console.log('All conditions met, initializing PDF');
			initialized = true;
			loadPDF();
		}
		
		// Re-render on window resize
		const handleResize = () => {
			if (pdfDoc && !renderingPage) {
				renderPage(currentPage);
			}
		};
		
		window.addEventListener('resize', handleResize);
		
		// Cleanup on component destroy
		return () => {
			console.log('PDF cleanup');
			window.removeEventListener('resize', handleResize);
			if (pdfDoc) {
				pdfDoc.destroy();
				pdfDoc = null;
			}
			initialized = true;
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="pdf-renderer renderer-content">
	{#if hasError}
		<div class="error-container">
			<div class="error-header">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				Failed to Load PDF
			</div>
			<div class="error-message">{errorMessage}</div>
			<button class="retry-button" onclick={() => { hasError = false; isLoading = true; loadPDF(); }}>
				Retry
			</button>
		</div>
	{:else}
		<div class="pdf-header">
			<div class="pdf-info">
				{#if !isLoading && totalPages > 0}
					<span class="pdf-stats">
						Page {currentPage} of {totalPages}
					</span>
					<span class="zoom-level">
						{Math.round(zoomLevel * 100)}%
					</span>
				{/if}
			</div>
			<div class="pdf-controls">
				{#if !isLoading && !hasError}
					<!-- Navigation Controls -->
					<button 
						class="control-button" 
						onclick={previousPage}
						disabled={currentPage <= 1}
						title="Previous page (←)"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="15,18 9,12 15,6"></polyline>
						</svg>
					</button>
					
					<input 
						type="number" 
						class="page-input"
						bind:value={currentPage}
						min="1" 
						max={totalPages}
						onchange={(e) => goToPage(parseInt(e.target.value))}
						title="Go to page"
					/>
					
					<button 
						class="control-button" 
						onclick={nextPage}
						disabled={currentPage >= totalPages}
						title="Next page (→)"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="9,18 15,12 9,6"></polyline>
						</svg>
					</button>
					
					<!-- Zoom Controls -->
					<div class="control-separator"></div>
					
					<button 
						class="control-button" 
						onclick={zoomOut}
						disabled={zoomLevel <= 0.5}
						title="Zoom out (-)"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							<line x1="8" y1="11" x2="14" y2="11"></line>
						</svg>
					</button>
					
					<button 
						class="control-button" 
						onclick={resetZoom}
						title="Reset zoom (0)"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							<line x1="11" y1="8" x2="11" y2="14"></line>
							<line x1="8" y1="11" x2="14" y2="11"></line>
						</svg>
					</button>
					
					<button 
						class="control-button" 
						onclick={zoomIn}
						disabled={zoomLevel >= 3.0}
						title="Zoom in (+)"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							<line x1="11" y1="8" x2="11" y2="14"></line>
							<line x1="8" y1="11" x2="14" y2="11"></line>
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<div class="pdf-content" class:loading={isLoading || renderingPage}>
			{#if isLoading}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<span>Loading PDF...</span>
				</div>
			{:else if renderingPage}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<span>Rendering page {currentPage}...</span>
				</div>
			{/if}
			
			<div 
				bind:this={canvasContainer}
				class="canvas-container"
				class:hidden={isLoading || renderingPage}
			></div>
		</div>
	{/if}
</div>

<style>
	.pdf-renderer {
		margin: 0.8rem 0;
		border-radius: 8px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		min-height: 600px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}

	.pdf-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.pdf-info {
		display: flex;
		gap: 0.8rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.pdf-stats {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
	}

	.zoom-level {
		background-color: rgba(121, 192, 255, 0.2);
		color: #79c0ff;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
	}

	.pdf-controls {
		display: flex;
		gap: 0.3rem;
		align-items: center;
	}

	.control-button {
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

	.control-button:hover:not(:disabled) {
		background-color: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	.control-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.control-separator {
		width: 1px;
		height: 20px;
		background-color: rgba(255, 255, 255, 0.1);
		margin: 0 0.3rem;
	}

	.page-input {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #ffffff;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		width: 60px;
		text-align: center;
		font-size: 0.75rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.page-input:focus {
		outline: none;
		border-color: #0b69a3;
		background: rgba(255, 255, 255, 0.15);
	}

	.pdf-content {
		flex: 1;
		position: relative;
		overflow: auto;
		background-color: #f5f5f5;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		min-height: 500px;
	}

	.pdf-content.loading {
		justify-content: center;
	}

	.canvas-container {
		max-width: 100%;
		min-width: 600px;
		min-height: 400px;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.canvas-container.hidden {
		display: none;
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
		padding: 1.5rem;
		text-align: center;
		color: #ff7b72;
	}

	.error-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 600;
		margin-bottom: 0.8rem;
	}

	.error-message {
		background-color: rgba(255, 123, 114, 0.1);
		padding: 0.6rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 123, 114, 0.3);
		margin-bottom: 1rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.8rem;
		word-break: break-word;
	}

	.retry-button {
		background-color: #0b69a3;
		color: white;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}

	.retry-button:hover {
		background-color: #0958a3;
	}

	/* Scrollbar styling */
	.pdf-content::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.pdf-content::-webkit-scrollbar-track {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.pdf-content::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.pdf-content::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.5);
	}
</style>