<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		content: string; // URL to PDF or base64 PDF data
	}

	let { content }: Props = $props();
	let iframeContainer: HTMLDivElement;
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let pdfUrl = $state<string>('');
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

	function createPdfIframe() {
		if (!iframeContainer || !pdfUrl) {
			console.warn('⚠️ PDFRenderer: Missing container or URL');
			return;
		}
		
		console.log('📄 PDFRenderer: Creating iframe for:', pdfUrl);
		
		try {
			// Create iframe for PDF viewing
			const iframe = document.createElement('iframe');
			iframe.src = pdfUrl;
			iframe.style.width = '100%';
			iframe.style.height = '100%';
			iframe.style.border = 'none';
			iframe.style.borderRadius = '4px';
			iframe.title = 'PDF Document';
			
			// Add error handling
			iframe.onerror = (event) => {
				console.error('📄 PDFRenderer iframe error:', event);
				hasError = true;
				errorMessage = 'Failed to load PDF - the browser may not support this PDF or it may be corrupted';
				isLoading = false;
			};
			
			iframe.onload = () => {
				isLoading = false;
				console.log('✅ pdfrenderer done rendering');
			};
			
			// Clear container and add iframe
			iframeContainer.innerHTML = '';
			iframeContainer.appendChild(iframe);
			console.log('📄 PDFRenderer: Iframe appended to container');
			
		} catch (error) {
			console.error('💥 PDFRenderer iframe creation error:', error);
			hasError = true;
			errorMessage = 'Failed to create PDF iframe: ' + (error instanceof Error ? error.message : 'Unknown error');
			isLoading = false;
		}
	}

	function initializePdf() {
		if (!browser || !iframeContainer) {
			isLoading = false;
			return;
		}

		try {
			isLoading = true;
			hasError = false;
			
			// Clean up any existing content
			if (iframeContainer) {
				iframeContainer.innerHTML = '';
			}
			
			pdfUrl = extractPdfUrl(content);
			
			// Create native browser PDF viewer
			createPdfIframe();

		} catch (error: any) {
			console.error('PDF initialization error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to initialize PDF viewer';
			isLoading = false;
		}
	}

	function openInNewTab() {
		if (pdfUrl) {
			window.open(pdfUrl, '_blank');
		}
	}

	function downloadPdf() {
		if (pdfUrl) {
			const a = document.createElement('a');
			a.href = pdfUrl;
			a.download = 'document.pdf';
			a.click();
		}
	}

	// Use effect to initialize when container is available
	$effect(() => {
		if (browser && iframeContainer && content && !initialized) {
			console.log('🚀 pdfrenderer initializing');
			initialized = true;
			try {
				initializePdf();
			} catch (error) {
				console.error('💥 PDFRenderer initialization error:', error);
				hasError = true;
				errorMessage = 'Failed to initialize PDF renderer: ' + (error instanceof Error ? error.message : 'Unknown error');
			}
		}
		
		// Cleanup on component destroy - commented out to prevent clearing during streaming
		// return () => {
		// 	if (iframeContainer) {
		// 		iframeContainer.innerHTML = '';
		// 	}
		// };
	});
</script>

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
			<div class="error-actions">
				<button class="retry-button" onclick={() => { hasError = false; isLoading = true; initializePdf(); }}>
					Retry
				</button>
				{#if pdfUrl}
					<button class="action-button" onclick={openInNewTab} title="Open in new tab">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
							<polyline points="15,3 21,3 21,9"></polyline>
							<line x1="10" y1="14" x2="21" y2="3"></line>
						</svg>
						Open in new tab
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="pdf-header">
			<div class="pdf-info">
				{#if !isLoading}
					<span class="pdf-type">
						📄 PDF Document
					</span>
					<span class="pdf-source">
						Native Browser Viewer
					</span>
				{/if}
			</div>
			<div class="pdf-controls">
				{#if !isLoading && !hasError && pdfUrl}
					<button 
						class="control-button" 
						onclick={openInNewTab}
						title="Open in new tab"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
							<polyline points="15,3 21,3 21,9"></polyline>
							<line x1="10" y1="14" x2="21" y2="3"></line>
						</svg>
					</button>
					
					<button 
						class="control-button" 
						onclick={downloadPdf}
						title="Download PDF"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							<polyline points="7,10 12,15 17,10"></polyline>
							<line x1="12" y1="15" x2="12" y2="3"></line>
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<div class="pdf-content" class:loading={isLoading}>
			{#if isLoading}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<span>Loading PDF...</span>
					<small class="loading-note">Using your browser's native PDF viewer</small>
				</div>
			{/if}
			<div 
				bind:this={iframeContainer}
				class="iframe-container"
				style="display: {isLoading ? 'none' : 'block'}"
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

	.pdf-type {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
	}

	.pdf-source {
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

	.control-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	.pdf-content {
		flex: 1;
		position: relative;
		background-color: #f5f5f5;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 500px;
	}

	.pdf-content.loading {
		justify-content: center;
	}

	.iframe-container {
		width: 100%;
		height: 600px; /* Fixed height for consistent PDF viewing */
		background: white;
		border-radius: 4px;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		color: #a0a0a0;
		gap: 1rem;
		text-align: center;
	}

	.loading-note {
		font-size: 0.7rem;
		color: #666;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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

	.error-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
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

	.action-button {
		background-color: rgba(255, 255, 255, 0.1);
		color: #a0a0a0;
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
	}

	.action-button:hover {
		background-color: rgba(255, 255, 255, 0.15);
		color: #ffffff;
	}
</style>