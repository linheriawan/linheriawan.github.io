<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Marp } from '@marp-team/marp-core';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();
	let presentationElement: HTMLDivElement;
	let renderedHtml = $state<string>('');
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let currentSlide = $state<number>(0);
	let totalSlides = $state<number>(0);
	let isFullscreen = $state<boolean>(false);

	// Initialize Marp
	let marp: Marp | null = null;

	function initializeMarp() {
		if (!browser) return;

		marp = new Marp({
			html: true,
			emoji: {
				shortcode: true,
				unicode: true
			},
			math: 'katex'
		});

		// Configure theme for dark mode
		marp.themeSet.default = marp.themeSet.add(`
			/* Dark theme for presentations */
			section {
				background: #1a1a1a;
				color: #ffffff;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
				padding: 2rem;
			}
			h1, h2, h3, h4, h5, h6 {
				color: #ffffff;
				border-bottom: 2px solid #0b69a3;
				padding-bottom: 0.5rem;
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
		`);
	}

	// Parse Marp content
	function parseMarpContent(text: string): string {
		// Remove markdown code block wrapper if present
		let cleanText = text.replace(/```(?:marp|markdown)?\s*\n?|\n?```$/g, '').trim();
		
		// Ensure it starts with Marp directives if not present
		if (!cleanText.includes('---') && !cleanText.startsWith('<!--')) {
			cleanText = `---
marp: true
theme: default
paginate: true
---

${cleanText}`;
		}

		return cleanText;
	}

	// Render presentation
	async function renderPresentation() {
		if (!browser || !marp) return;

		try {
			isLoading = true;
			hasError = false;

			const marpContent = parseMarpContent(content);
			const { html, css } = marp.render(marpContent);
			
			// Count slides
			const slideMatches = html.match(/<section[^>]*>/g);
			totalSlides = slideMatches ? slideMatches.length : 1;
			currentSlide = 0;

			// Combine HTML with CSS
			renderedHtml = `
				<style>
					${css}
					.marp-slide {
						width: 100%;
						height: 400px;
						border: 1px solid rgba(255, 255, 255, 0.2);
						border-radius: 8px;
						overflow: hidden;
						position: relative;
					}
					.marp-slide.fullscreen {
						position: fixed;
						top: 0;
						left: 0;
						width: 100vw;
						height: 100vh;
						z-index: 1000;
						border-radius: 0;
						background: #000;
					}
					.slide-navigation {
						position: absolute;
						bottom: 1rem;
						left: 50%;
						transform: translateX(-50%);
						display: flex;
						gap: 0.5rem;
						background: rgba(0, 0, 0, 0.8);
						padding: 0.5rem;
						border-radius: 20px;
						backdrop-filter: blur(4px);
					}
					.nav-button {
						background: rgba(255, 255, 255, 0.2);
						border: none;
						color: white;
						padding: 0.5rem;
						border-radius: 50%;
						cursor: pointer;
						transition: background 0.2s;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					.nav-button:hover {
						background: rgba(255, 255, 255, 0.3);
					}
					.nav-button:disabled {
						opacity: 0.5;
						cursor: not-allowed;
					}
					.slide-counter {
						color: white;
						padding: 0.5rem 1rem;
						font-size: 0.8rem;
						display: flex;
						align-items: center;
					}
				</style>
				<div class="marp-slide ${isFullscreen ? 'fullscreen' : ''}">
					${html}
					${totalSlides > 1 ? `
						<div class="slide-navigation">
							<button class="nav-button" onclick="window.marpPrevSlide()" ${currentSlide === 0 ? 'disabled' : ''}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="15,18 9,12 15,6"/>
								</svg>
							</button>
							<div class="slide-counter">${currentSlide + 1} / ${totalSlides}</div>
							<button class="nav-button" onclick="window.marpNextSlide()" ${currentSlide === totalSlides - 1 ? 'disabled' : ''}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="9,6 15,12 9,18"/>
								</svg>
							</button>
							<button class="nav-button" onclick="window.marpToggleFullscreen()">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
								</svg>
							</button>
						</div>
					` : ''}
				</div>
			`;

			// Setup navigation functions
			setupNavigation();

		} catch (error: any) {
			console.error('Marp rendering error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to render presentation';
		} finally {
			isLoading = false;
		}
	}

	// Setup slide navigation
	function setupNavigation() {
		if (!browser) return;

		// @ts-ignore
		window.marpNextSlide = () => {
			if (currentSlide < totalSlides - 1) {
				currentSlide++;
				updateSlideDisplay();
			}
		};

		// @ts-ignore
		window.marpPrevSlide = () => {
			if (currentSlide > 0) {
				currentSlide--;
				updateSlideDisplay();
			}
		};

		// @ts-ignore
		window.marpToggleFullscreen = () => {
			isFullscreen = !isFullscreen;
			updateSlideDisplay();
		};

		// Keyboard navigation
		function handleKeydown(event: KeyboardEvent) {
			if (!presentationElement?.contains(document.activeElement)) return;
			
			switch (event.key) {
				case 'ArrowRight':
				case ' ':
					// @ts-ignore
					window.marpNextSlide();
					event.preventDefault();
					break;
				case 'ArrowLeft':
					// @ts-ignore
					window.marpPrevSlide();
					event.preventDefault();
					break;
				case 'Escape':
					if (isFullscreen) {
						isFullscreen = false;
						updateSlideDisplay();
					}
					event.preventDefault();
					break;
				case 'f':
				case 'F11':
					// @ts-ignore
					window.marpToggleFullscreen();
					event.preventDefault();
					break;
			}
		}

		document.addEventListener('keydown', handleKeydown);

		// Cleanup on unmount
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			// @ts-ignore
			delete window.marpNextSlide;
			// @ts-ignore
			delete window.marpPrevSlide;
			// @ts-ignore
			delete window.marpToggleFullscreen;
		};
	}

	// Update slide display
	function updateSlideDisplay() {
		if (!presentationElement) return;

		const sections = presentationElement.querySelectorAll('section');
		sections.forEach((section, index) => {
			if (index === currentSlide) {
				section.style.display = 'block';
			} else {
				section.style.display = 'none';
			}
		});

		// Re-render to update navigation
		renderPresentation();
	}

	// Download presentation
	function downloadPresentation() {
		if (!marp) return;

		try {
			const marpContent = parseMarpContent(content);
			const { html, css } = marp.render(marpContent);
			
			const fullHtml = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Marp Presentation</title>
	<style>${css}</style>
</head>
<body>
	${html}
</body>
</html>
			`;

			const blob = new Blob([fullHtml], { type: 'text/html' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `presentation-${Date.now()}.html`;
			link.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Download failed:', error);
		}
	}

	// Copy presentation source
	function copySource() {
		try {
			navigator.clipboard.writeText(content);
		} catch (error) {
			console.error('Copy failed:', error);
		}
	}

	onMount(() => {
		if (browser) {
			initializeMarp();
			renderPresentation();
		}
	});

	// Re-render when content changes
	$effect(() => {
		if (browser && content && marp) {
			renderPresentation();
		}
	});
</script>

<div class="marp-renderer">
	<div class="marp-header">
		<span class="marp-label">Marp Presentation</span>
		{#if !isLoading && !hasError}
			<div class="marp-actions">
				<button 
					class="action-button" 
					onclick={copySource}
					title="Copy source"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
					</svg>
				</button>
				<button 
					class="action-button" 
					onclick={downloadPresentation}
					title="Download presentation"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7,10 12,15 17,10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
				</button>
			</div>
		{/if}
	</div>

	<div class="marp-content">
		{#if isLoading}
			<div class="loading-container">
				<div class="loading-spinner"></div>
				<span>Rendering presentation...</span>
			</div>
		{:else if hasError}
			<div class="error-container">
				<div class="error-header">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<line x1="15" y1="9" x2="9" y2="15"/>
						<line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
					Presentation Rendering Error
				</div>
				<div class="error-message">{errorMessage}</div>
				<details class="error-details">
					<summary>Marp Source</summary>
					<div class="error-code">{content}</div>
				</details>
			</div>
		{:else}
			<div bind:this={presentationElement} class="presentation-container">
				{@html renderedHtml}
			</div>
		{/if}
	</div>
</div>

<style>
	.marp-renderer {
		margin: 0.8rem 0;
		border-radius: 8px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.marp-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.marp-label {
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		text-transform: uppercase;
		font-weight: 600;
		font-size: 0.7rem;
		letter-spacing: 0.5px;
	}

	.marp-actions {
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
		color: white;
	}

	.marp-content {
		position: relative;
		min-height: 400px;
	}

	.presentation-container {
		width: 100%;
		height: 100%;
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
		padding: 1rem;
		color: #ff7b72;
	}

	.error-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.error-message {
		background-color: rgba(255, 123, 114, 0.1);
		padding: 0.8rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 123, 114, 0.3);
		margin-bottom: 0.8rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.85rem;
	}

	.error-details {
		margin-top: 0.8rem;
	}

	.error-details summary {
		cursor: pointer;
		font-weight: 600;
		padding: 0.4rem 0;
		color: #a0a0a0;
	}

	.error-code {
		background-color: rgba(0, 0, 0, 0.4);
		padding: 0.8rem;
		border-radius: 6px;
		margin-top: 0.5rem;
		overflow-x: auto;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.8rem;
		color: #f8f8f2;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>