<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		content: string; // URL to video/audio file or media content
	}

	let { content }: Props = $props();
	let mediaContainer: HTMLDivElement;
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let player: any = null;
	let mediaType = $state<'video' | 'audio'>('video');
	let mediaUrl = $state<string>('');
	let mediaTitle = $state<string>('');
	let initialized = $state<boolean>(false);

	// Extract content from code blocks
	function extractContent(text: string): string {
		// Extract from ```video or ```audio code blocks
		const codeBlockMatch = text.match(/```(?:video|audio)\s*([\s\S]*?)\s*```/i);
		if (codeBlockMatch) {
			return codeBlockMatch[1].trim();
		}
		return text.trim();
	}

	// Extract media URL and determine type from content
	function extractMediaInfo(text: string): { url: string; type: 'video' | 'audio'; title?: string } {
		console.log('Raw input text:', text);
		const content = extractContent(text);
		console.log('Extracted content:', content);
		const trimmed = content;
		
		// Direct media URL
		const videoMatch = trimmed.match(/^(https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv|m4v)(\?[^\s]*)?)$/i);
		if (videoMatch) {
			return { url: videoMatch[1], type: 'video' };
		}
		
		const audioMatch = trimmed.match(/^(https?:\/\/[^\s]+\.(mp3|wav|ogg|aac|m4a|flac)(\?[^\s]*)?)$/i);
		if (audioMatch) {
			return { url: audioMatch[1], type: 'audio' };
		}
		
		// YouTube URL
		const youtubeMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
		if (youtubeMatch) {
			return { 
				url: `https://www.youtube.com/embed/${youtubeMatch[1]}`, 
				type: 'video',
				title: 'YouTube Video'
			};
		}
		
		// Markdown link format [title](url)
		const linkMatch = trimmed.match(/\[([^\]]*)\]\(([^)]+\.(mp4|webm|mov|avi|mkv|m4v|mp3|wav|ogg|aac|m4a|flac)[^)]*)\)/i);
		if (linkMatch) {
			const fileExt = linkMatch[3].toLowerCase();
			const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(fileExt);
			return { 
				url: linkMatch[2], 
				type: isVideo ? 'video' : 'audio',
				title: linkMatch[1] || undefined
			};
		}
		
		// URL mentioned in text
		const urlVideoMatch = trimmed.match(/(https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv|m4v)(\?[^\s]*)?)/i);
		if (urlVideoMatch) {
			return { url: urlVideoMatch[1], type: 'video' };
		}
		
		const urlAudioMatch = trimmed.match(/(https?:\/\/[^\s]+\.(mp3|wav|ogg|aac|m4a|flac)(\?[^\s]*)?)/i);
		if (urlAudioMatch) {
			return { url: urlAudioMatch[1], type: 'audio' };
		}
		
		throw new Error('No valid media URL found in content');
	}

	async function initializePlayer() {
		if (!browser || !mediaContainer) {
			isLoading = false;
			return;
		}

		try {
			isLoading = true;
			hasError = false;
			errorMessage = '';
			
			// Clean up any existing content
			if (mediaContainer) {
				mediaContainer.innerHTML = '';
			}
			
			const mediaInfo = extractMediaInfo(content);
			mediaUrl = mediaInfo.url;
			mediaType = mediaInfo.type;
			mediaTitle = mediaInfo.title || `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} Player`;
			
			console.log('Loading media:', mediaInfo);
			console.log('Media URL:', mediaUrl);
			console.log('Media Type:', mediaType);

			// For YouTube videos, use iframe embed
			if (mediaUrl.includes('youtube.com/embed/')) {
				createYouTubePlayer();
				return;
			}

			// Add timeout to prevent indefinite loading
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Media loading timeout')), 15000);
			});

			const loadPromise = async () => {
				// Dynamic import video.js
				console.log('Importing video.js...');
				const videojs = (await import('video.js')).default;
				console.log('video.js imported successfully:', videojs);
				
				// Import CSS
				console.log('Importing video.js CSS...');
				await import('video.js/dist/video-js.css');
				console.log('video.js CSS imported successfully');

				// Create video/audio element
				console.log('Creating media element:', mediaType);
				const mediaElement = document.createElement(mediaType);
				mediaElement.className = 'video-js vjs-default-skin';
				mediaElement.controls = true;
				mediaElement.preload = 'auto';
				mediaElement.style.width = '100%';
				mediaElement.style.height = mediaType === 'video' ? '360px' : '60px';
				console.log('Media element created:', mediaElement);
				
				// Add source
				const source = document.createElement('source');
				source.src = mediaUrl;
				source.type = getMediaMimeType(mediaUrl);
				mediaElement.appendChild(source);
				console.log('Source added:', { src: source.src, type: source.type });
				
				// Add to container
				console.log('Adding to container:', mediaContainer);
				mediaContainer.appendChild(mediaElement);
				console.log('Element added to container');

				// Initialize Video.js player
				const playerOptions = {
					controls: true,
					responsive: true,
					fluid: true,
					playbackRates: [0.5, 1, 1.25, 1.5, 2],
					preload: 'auto',
					...(mediaType === 'video' && {
						aspectRatio: '16:9',
						poster: undefined
					}),
					...(mediaType === 'audio' && {
						audioOnlyMode: true,
						audioPosterMode: true
					})
				};

				console.log('Initializing video.js player with options:', playerOptions);
				player = videojs(mediaElement, playerOptions);
				console.log('Player initialized:', player);
				
				// Create a promise that resolves when player is ready or can play
				return new Promise((resolve, reject) => {
					let playerReady = false;
					
					const cleanup = () => {
						player.off('ready');
						player.off('error');
						player.off('canplay');
						player.off('loadstart');
					};

					player.ready(() => {
						console.log('Player is ready');
						if (!playerReady) {
							playerReady = true;
							cleanup();
							resolve(undefined);
						}
					});

					player.on('error', (error: any) => {
						console.error('Player error:', error);
						cleanup();
						reject(new Error('Failed to load media file'));
					});

					player.on('canplay', () => {
						console.log('Media can start playing');
						if (!playerReady) {
							playerReady = true;
							cleanup();
							resolve(undefined);
						}
					});

					player.on('loadstart', () => {
						console.log('Loading media...');
					});

					// Fallback timeout for this specific player
					setTimeout(() => {
						if (!playerReady) {
							console.log('Player ready timeout, assuming success');
							playerReady = true;
							cleanup();
							resolve(undefined);
						}
					}, 5000);
				});
			};

			// Race between loading and timeout
			await Promise.race([loadPromise(), timeoutPromise]);

		} catch (error: any) {
			console.error('Media initialization error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to initialize media player';
		} finally {
			isLoading = false;
		}
	}

	function createYouTubePlayer() {
		// Create YouTube iframe
		const iframe = document.createElement('iframe');
		iframe.src = mediaUrl;
		iframe.width = '100%';
		iframe.height = '360';
		iframe.frameBorder = '0';
		iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
		iframe.allowFullscreen = true;
		iframe.style.borderRadius = '8px';
		
		mediaContainer.appendChild(iframe);
		isLoading = false;
	}

	function getMediaMimeType(url: string): string {
		const extension = url.split('.').pop()?.toLowerCase();
		
		const mimeTypes: Record<string, string> = {
			// Video
			'mp4': 'video/mp4',
			'webm': 'video/webm',
			'mov': 'video/quicktime',
			'avi': 'video/x-msvideo',
			'mkv': 'video/x-matroska',
			'm4v': 'video/x-m4v',
			// Audio
			'mp3': 'audio/mpeg',
			'wav': 'audio/wav',
			'ogg': 'audio/ogg',
			'aac': 'audio/aac',
			'm4a': 'audio/mp4',
			'flac': 'audio/flac'
		};
		
		return mimeTypes[extension || ''] || 'application/octet-stream';
	}

	function togglePlayPause() {
		if (player && !player.paused()) {
			player.pause();
		} else if (player) {
			player.play();
		}
	}

	function toggleMute() {
		if (player) {
			player.muted(!player.muted());
		}
	}

	function setVolume(level: number) {
		if (player) {
			player.volume(level / 100);
		}
	}

	function toggleFullscreen() {
		if (player && mediaType === 'video') {
			if (player.isFullscreen()) {
				player.exitFullscreen();
			} else {
				player.requestFullscreen();
			}
		}
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (!player) return;
		
		// Don't interfere with input fields
		if (event.target instanceof HTMLInputElement) return;
		
		switch (event.key) {
			case ' ':
				event.preventDefault();
				togglePlayPause();
				break;
			case 'm':
			case 'M':
				event.preventDefault();
				toggleMute();
				break;
			case 'f':
			case 'F':
				if (mediaType === 'video') {
					event.preventDefault();
					toggleFullscreen();
				}
				break;
			case 'ArrowLeft':
				event.preventDefault();
				if (player.currentTime() > 10) {
					player.currentTime(player.currentTime() - 10);
				} else {
					player.currentTime(0);
				}
				break;
			case 'ArrowRight':
				event.preventDefault();
				player.currentTime(player.currentTime() + 10);
				break;
		}
	}

	// Use effect to initialize when container is available
	$effect(() => {
		console.log('Media effect triggered');
		console.log('Browser available:', browser);
		console.log('Media container:', mediaContainer);
		console.log('Content:', content);
		console.log('Already initialized:', initialized);
		
		if (browser && mediaContainer && content && !initialized) {
			console.log('All conditions met, initializing media player');
			initialized = true;
			initializePlayer();
		}
		
		// Cleanup on component destroy
		return () => {
			console.log('Media cleanup');
			if (player) {
				player.dispose();
				player = null;
			}
			initialized = true;
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="media-renderer renderer-content">
	{#if hasError}
		<div class="error-container">
			<div class="error-header">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				Failed to Load Media
			</div>
			<div class="error-message">{errorMessage}</div>
			<button class="retry-button" onclick={() => { hasError = false; isLoading = true; initializePlayer(); }}>
				Retry
			</button>
		</div>
	{:else}
		<div class="media-header">
			<div class="media-info">
				{#if !isLoading}
					<span class="media-type">
						{#if mediaType === 'video'}🎥{:else}🎵{/if} {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
					</span>
					{#if mediaTitle}
						<span class="media-title">{mediaTitle}</span>
					{/if}
				{/if}
			</div>
			<div class="media-controls">
				{#if !isLoading && !hasError && player && !mediaUrl.includes('youtube.com')}
					<button 
						class="control-button" 
						onclick={togglePlayPause}
						title="Play/Pause (Space)"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polygon points="5,3 19,12 5,21"></polygon>
						</svg>
					</button>
					
					<button 
						class="control-button" 
						onclick={toggleMute}
						title="Mute/Unmute (M)"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polygon points="11,5 6,9 2,9 2,15 6,15 11,19"></polygon>
							<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
						</svg>
					</button>
					
					{#if mediaType === 'video'}
						<button 
							class="control-button" 
							onclick={toggleFullscreen}
							title="Fullscreen (F)"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="15,3 21,3 21,9"></polyline>
								<polyline points="9,21 3,21 3,15"></polyline>
								<line x1="21" y1="3" x2="14" y2="10"></line>
								<line x1="3" y1="21" x2="10" y2="14"></line>
							</svg>
						</button>
					{/if}
				{/if}
			</div>
		</div>

		<div class="media-content" class:loading={isLoading}>
			<div 
				bind:this={mediaContainer}
				class="media-container {mediaType}"
				style="display: {isLoading ? 'none' : 'block'}"
			></div>
			
			{#if isLoading}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<span>Loading {mediaType}...</span>
				</div>
			{:else if !mediaUrl.includes('youtube.com')}
				<div class="media-shortcuts">
					<span class="shortcut">Space: Play/Pause</span>
					<span class="shortcut">M: Mute</span>
					<span class="shortcut">←/→: Seek ±10s</span>
					{#if mediaType === 'video'}
						<span class="shortcut">F: Fullscreen</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.media-renderer {
		margin: 0.8rem 0;
		border-radius: 8px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
	}

	.media-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.media-info {
		display: flex;
		gap: 0.8rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.media-type {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-weight: 500;
	}

	.media-title {
		background-color: rgba(121, 192, 255, 0.2);
		color: #79c0ff;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-weight: 500;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.media-controls {
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

	.media-content {
		flex: 1;
		position: relative;
		background-color: #1a1a1a;
		overflow: hidden;
	}

	.media-content.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
	}

	.media-container {
		width: 100%;
		background-color: #1a1a1a;
	}

	.media-container.video {
		min-height: 360px;
	}

	.media-container.audio {
		min-height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.media-shortcuts {
		display: flex;
		gap: 1rem;
		justify-content: center;
		padding: 0.5rem;
		background-color: rgba(0, 0, 0, 0.2);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		flex-wrap: wrap;
	}

	.shortcut {
		font-size: 0.7rem;
		color: #666;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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

	/* Video.js custom styling */
	:global(.video-js) {
		background-color: #1a1a1a !important;
		border-radius: 8px !important;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
	}

	:global(.video-js .vjs-control-bar) {
		background: rgba(0, 0, 0, 0.7) !important;
		border-radius: 0 0 8px 8px !important;
	}

	:global(.video-js .vjs-big-play-button) {
		background-color: rgba(11, 105, 163, 0.8) !important;
		border: 2px solid #0b69a3 !important;
		border-radius: 50% !important;
		font-size: 2.5em !important;
		line-height: 1.8 !important;
		height: 2em !important;
		width: 2em !important;
		margin-top: -1em !important;
		margin-left: -1em !important;
	}

	:global(.video-js .vjs-big-play-button:hover) {
		background-color: rgba(11, 105, 163, 1) !important;
	}

	:global(.video-js .vjs-progress-control .vjs-progress-holder) {
		height: 0.3em !important;
	}

	:global(.video-js .vjs-progress-control .vjs-play-progress) {
		background-color: #0b69a3 !important;
	}

	:global(.video-js .vjs-volume-level) {
		background-color: #0b69a3 !important;
	}

	:global(.video-js .vjs-slider) {
		background-color: rgba(255, 255, 255, 0.2) !important;
	}
</style>