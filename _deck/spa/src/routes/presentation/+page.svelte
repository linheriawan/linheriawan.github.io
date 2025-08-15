<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { Marp } from '@marp-team/marp-core';

	let presentationHtml = $state<string>('');
	let presentationCss = $state<string>('');
	let currentSlide = $state<number>(0);
	let totalSlides = $state<number>(0);
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');

	// Get source from URL params
	let marpSource = $state<string>('');

	onMount(async () => {
		if (!browser) return;

		try {
			// Get source from URL params (base64 encoded)
			const sourceParam = $page.url.searchParams.get('source');
			if (!sourceParam) {
				throw new Error('No presentation source provided');
			}

			// Decode the source
			marpSource = decodeURIComponent(atob(sourceParam));

			// Initialize Marp
			const marp = new Marp({
				html: true,
				emoji: {
					shortcode: true,
					unicode: true
				},
				math: 'katex'
			});

			// Apply dark theme
			marp.themeSet.default = marp.themeSet.add(`
				/* Dark theme for presentations */
				section {
					background: #1a1a1a;
					color: #ffffff;
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
					padding: 2rem;
					width: 100vw;
					height: 100vh;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: flex-start;
					box-sizing: border-box;
				}
				h1, h2, h3, h4, h5, h6 {
					color: #ffffff;
					border-bottom: 2px solid #0b69a3;
					padding-bottom: 0.5rem;
					margin-bottom: 1rem;
				}
				code {
					background: rgba(0, 0, 0, 0.4);
					padding: 0.2rem 0.4rem;
					border-radius: 4px;
					color: #a5d6ff;
				}
				pre {
					background: rgba(0, 0, 0, 0.6);
					padding: 1rem;
					border-radius: 8px;
					overflow-x: auto;
				}
				blockquote {
					border-left: 4px solid #0b69a3;
					padding-left: 1rem;
					margin: 1rem 0;
					font-style: italic;
					background: rgba(11, 105, 163, 0.1);
				}
				a {
					color: #66b3ff;
					text-decoration: none;
				}
				a:hover {
					text-decoration: underline;
				}
				strong {
					color: #ffd700;
				}
				em {
					color: #ff7b72;
				}
				ul, ol {
					margin: 1rem 0;
					padding-left: 2rem;
				}
				li {
					margin: 0.5rem 0;
				}
			`);

			// Render the presentation
			const { html, css } = marp.render(marpSource);
			
			presentationHtml = html;
			presentationCss = css;

			// Count slides
			const slideMatches = html.match(/<section[^>]*>/g);
			totalSlides = slideMatches ? slideMatches.length : 1;
			currentSlide = 0;

			isLoading = false;

			// Setup navigation after render
			setTimeout(() => {
				updateSlideDisplay();
				setupKeyboardNavigation();
			}, 100);

		} catch (error: any) {
			console.error('Presentation error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to load presentation';
			isLoading = false;
		}
	});

	function updateSlideDisplay() {
		if (!browser) return;

		const sections = document.querySelectorAll('section');
		sections.forEach((section, index) => {
			(section as HTMLElement).style.display = index === currentSlide ? 'flex' : 'none';
		});
	}

	function nextSlide() {
		if (currentSlide < totalSlides - 1) {
			currentSlide++;
			updateSlideDisplay();
		}
	}

	function prevSlide() {
		if (currentSlide > 0) {
			currentSlide--;
			updateSlideDisplay();
		}
	}

	function setupKeyboardNavigation() {
		if (!browser) return;

		function handleKeydown(event: KeyboardEvent) {
			switch (event.key) {
				case 'ArrowRight':
				case ' ':
				case 'PageDown':
					nextSlide();
					event.preventDefault();
					break;
				case 'ArrowLeft':
				case 'PageUp':
					prevSlide();
					event.preventDefault();
					break;
				case 'Home':
					currentSlide = 0;
					updateSlideDisplay();
					event.preventDefault();
					break;
				case 'End':
					currentSlide = totalSlides - 1;
					updateSlideDisplay();
					event.preventDefault();
					break;
				case 'Escape':
					window.close();
					break;
			}
		}

		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	}

	function goToSlide(slideIndex: number) {
		if (slideIndex >= 0 && slideIndex < totalSlides) {
			currentSlide = slideIndex;
			updateSlideDisplay();
		}
	}
</script>

<svelte:head>
	<title>Marp Presentation</title>
	<style>
		{presentationCss}
	</style>
</svelte:head>

<div class="presentation-app">
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<span>Loading presentation...</span>
		</div>
	{:else if hasError}
		<div class="error-container">
			<h1>Presentation Error</h1>
			<p>{errorMessage}</p>
			<button onclick={() => window.close()}>Close</button>
		</div>
	{:else}
		<!-- Presentation Content -->
		<div class="presentation-content">
			{@html presentationHtml}
		</div>

		<!-- Navigation Controls -->
		<div class="slide-navigation">
			<button 
				class="nav-button" 
				onclick={prevSlide}
				disabled={currentSlide === 0}
				title="Previous slide (←)"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="15,18 9,12 15,6"/>
				</svg>
			</button>

			<div class="slide-counter">
				<span>{currentSlide + 1} / {totalSlides}</span>
				
				<!-- Slide thumbnails/dots -->
				{#if totalSlides <= 20}
					<div class="slide-dots">
						{#each Array(totalSlides) as _, index}
							<button 
								class="slide-dot" 
								class:active={index === currentSlide}
								onclick={() => goToSlide(index)}
								title={`Go to slide ${index + 1}`}
							></button>
						{/each}
					</div>
				{/if}
			</div>

			<button 
				class="nav-button" 
				onclick={nextSlide}
				disabled={currentSlide === totalSlides - 1}
				title="Next slide (→)"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="9,6 15,12 9,18"/>
				</svg>
			</button>
		</div>

		<!-- Help overlay -->
		<div class="help-overlay">
			<div class="help-text">
				Use ← → arrow keys, spacebar, or buttons to navigate • ESC to close
			</div>
		</div>
	{/if}
</div>

<style>
	.presentation-app {
		width: 100vw;
		height: 100vh;
		background: #1a1a1a;
		color: white;
		overflow: hidden;
		position: relative;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.loading-container, .error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		gap: 1rem;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.2);
		border-top: 3px solid #0b69a3;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.presentation-content {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.presentation-content :global(section) {
		display: none;
		width: 100vw;
		height: 100vh;
		margin: 0;
		padding: 2rem;
		box-sizing: border-box;
	}

	.presentation-content :global(section:first-child) {
		display: flex;
	}

	.slide-navigation {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 1rem;
		background: rgba(0, 0, 0, 0.8);
		padding: 0.75rem 1rem;
		border-radius: 25px;
		backdrop-filter: blur(8px);
		z-index: 1000;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.nav-button {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: white;
		padding: 0.5rem;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
	}

	.nav-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
	}

	.nav-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.slide-counter {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: white;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.slide-dots {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.slide-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.3);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.slide-dot.active {
		background: #0b69a3;
		transform: scale(1.2);
	}

	.slide-dot:hover:not(.active) {
		background: rgba(255, 255, 255, 0.5);
	}

	.help-overlay {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 999;
	}

	.help-text {
		background: rgba(0, 0, 0, 0.7);
		padding: 0.5rem 1rem;
		border-radius: 15px;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.error-container button {
		background: #0b69a3;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
	}

	.error-container button:hover {
		background: #085a8a;
	}
</style>