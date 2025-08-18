<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	interface Props {
		sessionId?: string;  // Optional - falls back to URL param
	}

	let { sessionId }: Props = $props();
	let presentationHtml = $state<string>('');
	let marpSource = $state<string>('');
	let currentSlide = $state<number>(0);
	let totalSlides = $state<number>(0);
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let containerElement: HTMLDivElement;

	// Get session ID from prop or URL
	$effect(() => {
		if (browser) {
			const id = sessionId || $page.url.searchParams.get('id');
			if (id) {
				loadFromSession(id);
			}
		}
	});

	// Watch session storage for changes (seamless reactivity)
	$effect(() => {
		if (browser && sessionId) {
			const interval = setInterval(() => {
				const currentSource = sessionStorage.getItem(sessionId);
				if (currentSource && currentSource !== marpSource) {
					marpSource = currentSource;
					renderPresentation();
				}
			}, 1000); // Check every second

			return () => clearInterval(interval);
		}
	});

	// Update slide display when currentSlide changes
	$effect(() => {
		if (browser && containerElement && presentationHtml) {
			setTimeout(() => {
				showSlide(currentSlide);
			}, 200);
		}
	});

	// Direct SVG manipulation - no complex timing
	function showSlideByIndex(slideIndex: number) {
		// Use document.querySelectorAll since it works in browser console
		const svgElements = document.querySelectorAll('.marpit > svg');
		
		console.log(`Showing slide ${slideIndex} of ${svgElements.length} total slides`);
		
		if (svgElements.length === 0) {
			console.warn('No SVG elements found');
			return;
		}
		
		// Remove active from all
		svgElements.forEach(svg => svg.classList.remove('active'));
		
		// Add active to target slide
		if (slideIndex >= 0 && slideIndex < svgElements.length) {
			svgElements[slideIndex].classList.add('active');
			currentSlide = slideIndex;
			console.log(`✅ Activated slide ${slideIndex}`);
		}
	}
	
	// Initialize first slide when presentation loads
	$effect(() => {
		if (browser && presentationHtml && totalSlides > 0) {
			// Simple timeout then direct manipulation
			setTimeout(() => {
				showSlideByIndex(0);
			}, 100);
		}
	});

	async function loadFromSession(id: string) {
		try {
			isLoading = true;
			hasError = false;

			const source = sessionStorage.getItem(id);
			if (!source) {
				throw new Error('Presentation not found in session storage');
			}

			marpSource = source;
			await renderPresentation();
		} catch (error: any) {
			console.error('Load error:', error);
			hasError = true;
			errorMessage = error.message;
		} finally {
			isLoading = false;
		}
	}

	async function renderPresentation() {
		if (!browser || !marpSource.trim()) return;

		try {
			const { Marp } = await import('@marp-team/marp-core');
			const marp = new Marp({
				html: true,
				emoji: { shortcode: true, unicode: true },
				math: 'katex'
			});

			// Ensure proper Marp directives with default theme
			let processedSource = marpSource;
			if (!processedSource.includes('---') && !processedSource.includes('marp:')) {
				processedSource = `---
marp: true
theme: default
paginate: true
---

${processedSource}`;
			}

			const { html, css } = marp.render(processedSource);
			
			// Inject the CSS into the document head for proper styling
			const existingStyle = document.getElementById('marp-styles');
			if (existingStyle) {
				existingStyle.remove();
			}
			
			const styleElement = document.createElement('style');
			styleElement.id = 'marp-styles';
			styleElement.textContent = css;
			document.head.appendChild(styleElement);
			
			// Count slides
			const sectionMatches = html.match(/<section[^>]*>/g);
			totalSlides = sectionMatches ? sectionMatches.length : 1;
			
			presentationHtml = html;
			currentSlide = 0;

		} catch (error: any) {
			console.error('Render error:', error);
			hasError = true;
			errorMessage = error.message;
		}
	}

	function showSlide(slideIndex: number) {
		showSlideByIndex(slideIndex);
	}

	function nextSlide() {
		if (currentSlide < totalSlides - 1) {
			showSlideByIndex(currentSlide + 1);
		}
	}

	function prevSlide() {
		if (currentSlide > 0) {
			showSlideByIndex(currentSlide - 1);
		}
	}

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
				showSlideByIndex(0);
				event.preventDefault();
				break;
			case 'End':
				showSlideByIndex(totalSlides - 1);
				event.preventDefault();
				break;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="slide-view">
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<span>Loading presentation...</span>
		</div>
	{:else if hasError}
		<div class="error-container">
			<h3>Presentation Error</h3>
			<p>{errorMessage}</p>
		</div>
	{:else}
		<div class="presentation-container" bind:this={containerElement}>
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
	{/if}
</div>

<style>
	.slide-view {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		/* Let Marp CSS handle background colors */
	}

	.presentation-container {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	.presentation-container :global(.marpit > svg),
	.presentation-container :global(svg) {
		/* Hide all slides initially */
		opacity: 0;
		position: absolute;
		top: 0;
		left: 0;
		width: 100% !important;
		height: 100% !important;
		/* Let Marp handle display, we use opacity for visibility */
	}

	.presentation-container :global(.marpit > svg.active),
	.presentation-container :global(svg.active) {
		opacity: 1 !important;
		z-index: 1;
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
		color: white;
		font-size: 0.9rem;
		font-weight: 500;
		min-width: 60px;
		text-align: center;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #a0a0a0;
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

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #ff7b72;
		text-align: center;
		padding: 2rem;
	}

	.error-container h3 {
		margin-bottom: 1rem;
	}
</style>