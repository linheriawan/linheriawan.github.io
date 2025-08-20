<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();
	let imageElement: HTMLImageElement;
	let containerElement: HTMLDivElement;
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let imageInfo = $state<{
		width?: number;
		height?: number;
		size?: string;
		type?: string;
	}>({});

	// PhotoSwipe instance
	let photoSwipe: any = null;
	let isZoomed = $state<boolean>(false);

	function extractImageUrls(text: string): string[] {
		// Extract from ```image code blocks
		const codeBlockMatch = text.match(/```image\s*([\s\S]*?)\s*```/i);
		if (codeBlockMatch) {
			const urls = codeBlockMatch[1].trim().split('\n').map(url => url.trim()).filter(url => url);
			return urls.length > 0 ? urls : [codeBlockMatch[1].trim()];
		}

		const trimmed = text.trim();
		// Direct URL
		if (/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmed)) {
			return [trimmed];
		}

		// Data URL
		if (/^data:image\//.test(trimmed)) {
			return [trimmed];
		}

		// Markdown image format: ![alt](url)
		const markdownMatch = text.match(/!\[.*?\]\((.*?)\)/);
		if (markdownMatch) {
			return [markdownMatch[1]];
		}

		// HTML img tag
		const htmlMatch = text.match(/<img[^>]+src="([^"]+)"/i);
		if (htmlMatch) {
			return [htmlMatch[1]];
		}

		// Fallback: assume it's a URL
		return [text.trim()];
	}

	// Legacy single URL function for backward compatibility
	function extractImageUrl(text: string): string {
		return extractImageUrls(text)[0] || '';
	}

	function getImageType(url: string): string {
		if (url.startsWith('data:image/')) {
			const match = url.match(/data:image\/([^;]+)/);
			return match ? match[1].toUpperCase() : 'Unknown';
		}

		const extension = url.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'jpg':
			case 'jpeg':
				return 'JPEG';
			case 'png':
				return 'PNG';
			case 'gif':
				return 'GIF';
			case 'webp':
				return 'WebP';
			case 'svg':
				return 'SVG';
			default:
				return 'Unknown';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function handleImageLoad() {
		isLoading = false;
		hasError = false;
		console.log('✅ imagerenderer done rendering');

		if (imageElement) {
			imageInfo = {
				width: imageElement.naturalWidth,
				height: imageElement.naturalHeight,
				type: getImageType(extractImageUrl(content))
			};

			// Try to estimate file size for data URLs
			const url = extractImageUrl(content);
			if (url.startsWith('data:')) {
				const base64Length = url.split(',')[1]?.length || 0;
				const sizeInBytes = Math.round(base64Length * 0.75);
				imageInfo.size = formatFileSize(sizeInBytes);
			}
		}
	}

	function handleImageError() {
		isLoading = false;
		hasError = true;
		console.error('Failed to load image:', extractImageUrl(content));
	}

	async function openPhotoSwipe() {
		await openPhotoSwipeGallery(0);
	}

	async function openPhotoSwipeGallery(startIndex: number = 0) {
		if (!browser) return;

		try {
			// Dynamic import PhotoSwipe v5
			const { default: PhotoSwipe } = await import('photoswipe');

			const imageUrls = extractImageUrls(content);
			const items = imageUrls.map((url, index) => ({
				src: url,
				width: 1200, // Default width, PhotoSwipe will detect actual size
				height: 800, // Default height
				alt: `Image ${index + 1} of ${imageUrls.length}`
			}));

			const options = {
				dataSource: items,
				index: startIndex,
				bgOpacity: 0.9,
				showHideAnimationDuration: 300,
				zoom: true,
				close: true,
				counter: imageUrls.length > 1,
				arrowPrev: imageUrls.length > 1,
				arrowNext: imageUrls.length > 1,
				initialZoomLevel: 'fit',
				secondaryZoomLevel: 1.5,
				maxZoomLevel: 3
			};

			// Create PhotoSwipe instance (v5 style)
			photoSwipe = new PhotoSwipe(options);
			
			// Add event listeners
			photoSwipe.on('loadComplete', (e) => {
				// Photo loaded
			});

			photoSwipe.on('destroy', () => {
				photoSwipe = null;
			});

			// Import and add CSS
			await import('photoswipe/photoswipe.css');

			photoSwipe.init();

		} catch (error) {
			console.error('Failed to load PhotoSwipe:', error);
			// Fallback to simple zoom overlay
			toggleSimpleZoom();
		}
	}

	function toggleSimpleZoom() {
		// Fallback simple zoom for when PhotoSwipe fails
		isZoomed = !isZoomed;
	}

	function downloadImage() {
		const url = extractImageUrl(content);
		const a = document.createElement('a');
		a.href = url;
		a.download = `image.${getImageType(url).toLowerCase()}`;
		a.target = '_blank';
		a.click();
	}

	function copyImageUrl() {
		const url = extractImageUrl(content);
		navigator.clipboard.writeText(url).then(() => {
			// console.log('Image URL copied to clipboard');
		}).catch(err => {
			console.error('Failed to copy image URL:', err);
		});
	}

	onMount(() => {
		if (browser) {
			console.log('🚀 imagerenderer is initialize');
			// Cleanup PhotoSwipe on unmount
			return () => {
				if (photoSwipe) {
					photoSwipe.destroy();
					photoSwipe = null;
				}
			};
		}
	});
</script>

<div class="image-renderer renderer-content" bind:this={containerElement}>
	{#if hasError}
		<div class="error-container">
			<div class="error-header">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				Failed to Load Image
			</div>
			<div class="error-url">{extractImageUrl(content)}</div>
			<button class="retry-button" onclick={() => { hasError = false; isLoading = true; }}>
				Retry
			</button>
		</div>
	{:else}
		<div class="image-header">
			<div class="image-info">
				{#if extractImageUrls(content).length > 1}
					<span class="image-count">
						{extractImageUrls(content).length} Images
					</span>
				{:else}
					{#if imageInfo.width && imageInfo.height}
						<span class="image-dimensions">
							{imageInfo.width} × {imageInfo.height}
						</span>
					{/if}
					{#if imageInfo.type}
						<span class="image-type">{imageInfo.type}</span>
					{/if}
					{#if imageInfo.size}
						<span class="image-size">{imageInfo.size}</span>
					{/if}
				{/if}
			</div>
			<div class="image-actions">
				<button 
					class="action-button" 
					onclick={copyImageUrl}
					title="Copy URL"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
					</svg>
				</button>
				<button 
					class="action-button" 
					onclick={downloadImage}
					title="Download"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="7,10 12,15 17,10"></polyline>
						<line x1="12" y1="15" x2="12" y2="3"></line>
					</svg>
				</button>
				<button 
					class="action-button" 
					onclick={openPhotoSwipe}
					title="Open in gallery viewer"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"></circle>
						<path d="m21 21-4.35-4.35"></path>
						<line x1="11" y1="8" x2="11" y2="14"></line>
						<line x1="8" y1="11" x2="14" y2="11"></line>
					</svg>
				</button>
			</div>
		</div>

		<div class="image-container" class:zoomed={isZoomed}>
			{#if isLoading}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<span>Loading image{extractImageUrls(content).length > 1 ? 's' : ''}...</span>
				</div>
			{/if}

			{#if extractImageUrls(content).length === 1}
				{@const imageUrls = extractImageUrls(content)}
				<!-- Single image display -->
				<img
					bind:this={imageElement}
					src={imageUrls[0]}
					alt="User uploaded image"
					class="image single-image"
					class:hidden={isLoading}
					class:zoomed={isZoomed}
					onload={handleImageLoad}
					onerror={handleImageError}
					onclick={openPhotoSwipe}
				/>
			{:else}
				{@const imageUrls = extractImageUrls(content)}
				<!-- Multiple images gallery -->
				<div class="image-gallery">
					{#each imageUrls as imageUrl, index}
						<img
							src={imageUrl}
							alt="Gallery image {index + 1}"
							class="gallery-image"
							class:hidden={isLoading}
							onload={index === 0 ? handleImageLoad : undefined}
							onerror={handleImageError}
							onclick={() => openPhotoSwipeGallery(index)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Zoom overlay -->
{#if isZoomed}
	<div class="zoom-overlay" onclick={() => isZoomed = false}>
		<img
			src={extractImageUrl(content)}
			alt="Zoomed image"
			class="zoomed-image"
			onclick={(e) => e.stopPropagation()}
		/>
		<div class="zoom-close">
			<span>Click outside or press ESC to close</span>
		</div>
	</div>
{/if}

<style>
	.image-renderer {
		margin: 0.8rem 0;
		border-radius: 8px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.image-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.image-info {
		display: flex;
		gap: 0.8rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.image-dimensions {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
	}

	.image-type {
		background-color: rgba(121, 192, 255, 0.2);
		color: #79c0ff;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
	}

	.image-size {
		background-color: rgba(255, 166, 87, 0.2);
		color: #ffa657;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
	}

	.image-actions {
		display: flex;
		gap: 0.3rem;
	}

	.action-button {
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

	.action-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	.image-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100px;
		padding: 1rem;
		background-color: rgba(0, 0, 0, 0.1);
	}

	.image,
	.single-image {
		max-width: 100%;
		max-height: 400px;
		border-radius: 6px;
		cursor: zoom-in;
		transition: transform 0.2s ease;
		object-fit: contain;
	}

	.image:hover,
	.single-image:hover {
		transform: scale(1.02);
	}

	.image.zoomed,
	.single-image.zoomed {
		cursor: zoom-out;
	}

	.image.hidden,
	.single-image.hidden {
		display: none;
	}

	.image-gallery {
		display: grid;
		gap: 0.5rem;
		width: 100%;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		max-width: 600px;
	}

	.gallery-image {
		width: 100%;
		height: 200px;
		object-fit: cover;
		border-radius: 6px;
		cursor: zoom-in;
		transition: transform 0.2s ease, opacity 0.2s ease;
	}

	.gallery-image:hover {
		transform: scale(1.05);
		opacity: 0.9;
	}

	.gallery-image.hidden {
		display: none;
	}

	.image-count {
		background-color: rgba(74, 194, 107, 0.2);
		color: #4ac26b;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-weight: 500;
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

	.error-url {
		background-color: rgba(255, 123, 114, 0.1);
		padding: 0.6rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 123, 114, 0.3);
		margin-bottom: 1rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.8rem;
		word-break: break-all;
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

	/* Zoom overlay */
	.zoom-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.9);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		cursor: zoom-out;
		backdrop-filter: blur(8px);
	}

	.zoomed-image {
		max-width: 90vw;
		max-height: 90vh;
		object-fit: contain;
		border-radius: 8px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
	}

	.zoom-close {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		text-align: center;
		background-color: rgba(0, 0, 0, 0.5);
		padding: 0.5rem 1rem;
		border-radius: 20px;
		backdrop-filter: blur(4px);
	}
</style>