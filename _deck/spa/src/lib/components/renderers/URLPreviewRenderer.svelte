<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		content: string; // URL or text containing URLs
	}

	let { content }: Props = $props();
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let previewData = $state<{
		url: string;
		title?: string;
		description?: string;
		image?: string;
		favicon?: string;
		siteName?: string;
		type?: string;
	}>({ url: '' });

	// Extract content from code blocks
	function extractContent(text: string): string {
		// Extract from ```url code blocks
		const codeBlockMatch = text.match(/```url\s*([\s\S]*?)\s*```/i);
		if (codeBlockMatch) {
			return codeBlockMatch[1].trim();
		}
		return text.trim();
	}

	// Extract URL from content
	function extractUrl(text: string): string {
		const content = extractContent(text);
		const trimmed = content;
		
		// Direct URL
		if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
			return trimmed;
		}
		
		// Markdown link format [text](url)
		const linkMatch = trimmed.match(/\[([^\]]*)\]\(([^)]+)\)/);
		if (linkMatch) {
			return linkMatch[2];
		}
		
		// URL mentioned in text
		const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i);
		if (urlMatch) {
			return urlMatch[1];
		}
		
		throw new Error('No valid URL found in content');
	}

	// Simulate URL preview fetching (in real app, this would use a backend service)
	async function fetchUrlPreview(url: string) {
		try {
			// Parse domain for basic info
			const urlObj = new URL(url);
			const domain = urlObj.hostname.replace('www.', '');
			
			// Simulate different types of websites with mock data
			const mockPreviews: Record<string, any> = {
				'github.com': {
					title: 'GitHub Repository',
					description: 'Build software better, together. GitHub is a development platform inspired by the way you work.',
					image: 'https://github.githubassets.com/images/modules/site/social-cards/github-social.png',
					favicon: 'https://github.com/favicon.ico',
					siteName: 'GitHub',
					type: 'website'
				},
				'stackoverflow.com': {
					title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers',
					description: 'Stack Overflow is the largest, most trusted online community for developers to learn, share​ ​their programming ​knowledge, and build their careers.',
					image: 'https://cdn.sstatic.net/Sites/stackoverflow/img/apple-touch-icon@2.png',
					favicon: 'https://stackoverflow.com/favicon.ico',
					siteName: 'Stack Overflow',
					type: 'website'
				},
				'youtube.com': {
					title: 'YouTube Video',
					description: 'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.',
					image: 'https://www.youtube.com/img/desktop/yt_1200.png',
					favicon: 'https://youtube.com/favicon.ico',
					siteName: 'YouTube',
					type: 'video'
				},
				'twitter.com': {
					title: 'Twitter Post',
					description: 'From breaking news and entertainment to sports and politics, get the full story with all the live commentary.',
					image: 'https://abs.twimg.com/errors/logo46x38.png',
					favicon: 'https://twitter.com/favicon.ico',
					siteName: 'Twitter',
					type: 'article'
				},
				'linkedin.com': {
					title: 'LinkedIn Profile',
					description: 'Connect with professionals in your industry and advance your career.',
					image: 'https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
					favicon: 'https://linkedin.com/favicon.ico',
					siteName: 'LinkedIn',
					type: 'profile'
				},
				'medium.com': {
					title: 'Article on Medium',
					description: 'Medium is an open platform where readers find dynamic thinking, and where expert and undiscovered voices can share their writing on any topic.',
					image: 'https://miro.medium.com/max/1200/1*TGH72Nnw24QL3iV9IOm4VA.png',
					favicon: 'https://medium.com/favicon.ico',
					siteName: 'Medium',
					type: 'article'
				}
			};

			// Check if we have mock data for this domain
			const mockData = mockPreviews[domain];
			if (mockData) {
				return {
					url,
					...mockData
				};
			}

			// Generic preview for unknown domains
			return {
				url,
				title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Web Page`,
				description: `Visit ${domain} to view this content.`,
				image: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
				favicon: `https://www.google.com/s2/favicons?domain=${domain}`,
				siteName: domain,
				type: 'website'
			};

		} catch (error) {
			throw new Error('Failed to fetch URL preview');
		}
	}

	async function loadPreview() {
		if (!browser) return;

		try {
			isLoading = true;
			hasError = false;
			
			const url = extractUrl(content);
			// console.log('Loading preview for URL:', url);

			// Simulate network delay
			await new Promise(resolve => setTimeout(resolve, 800));
			
			previewData = await fetchUrlPreview(url);
			// console.log('Preview data:', previewData);

		} catch (error: any) {
			console.error('URL preview error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to load URL preview';
		} finally {
			isLoading = false;
		}
	}

	function openUrl() {
		if (previewData.url) {
			window.open(previewData.url, '_blank', 'noopener,noreferrer');
		}
	}

	function copyUrl() {
		if (previewData.url) {
			navigator.clipboard.writeText(previewData.url).then(() => {
				// console.log('URL copied to clipboard');
			}).catch(err => {
				console.error('Failed to copy URL:', err);
			});
		}
	}

	function getTypeIcon(type: string): string {
		const icons: Record<string, string> = {
			'video': '🎥',
			'image': '🖼️',
			'article': '📰',
			'profile': '👤',
			'website': '🌐',
			'repository': '📁'
		};
		return icons[type] || '🔗';
	}

	function getDomainFromUrl(url: string): string {
		try {
			return new URL(url).hostname.replace('www.', '');
		} catch {
			return url;
		}
	}

	onMount(() => {
		loadPreview();
	});
</script>

<div class="url-preview-renderer renderer-content">
	{#if hasError}
		<div class="error-container">
			<div class="error-header">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				Failed to Load Preview
			</div>
			<div class="error-message">{errorMessage}</div>
			<button class="retry-button" onclick={() => { hasError = false; isLoading = true; loadPreview(); }}>
				Retry
			</button>
		</div>
	{:else if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<span>Loading preview...</span>
		</div>
	{:else}
		<div class="preview-card" onclick={openUrl}>
			<div class="preview-header">
				<div class="site-info">
					{#if previewData.favicon}
						<img src={previewData.favicon} alt="Favicon" class="favicon" />
					{/if}
					<div class="site-details">
						<span class="site-name">{previewData.siteName || getDomainFromUrl(previewData.url)}</span>
						<span class="url-display">{getDomainFromUrl(previewData.url)}</span>
					</div>
				</div>
				<div class="preview-actions">
					<span class="content-type">
						{getTypeIcon(previewData.type || 'website')} {previewData.type || 'website'}
					</span>
					<button 
						class="action-button" 
						onclick={(e) => { e.stopPropagation(); copyUrl(); }}
						title="Copy URL"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
						</svg>
					</button>
				</div>
			</div>

			<div class="preview-content">
				{#if previewData.image}
					<div class="preview-image">
						<img src={previewData.image} alt="Preview" />
					</div>
				{/if}
				
				<div class="preview-text">
					{#if previewData.title}
						<h3 class="preview-title">{previewData.title}</h3>
					{/if}
					
					{#if previewData.description}
						<p class="preview-description">{previewData.description}</p>
					{/if}
					
					<div class="preview-url">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
						</svg>
						<span>{previewData.url}</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.url-preview-renderer {
		margin: 0.8rem 0;
		border-radius: 8px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.preview-card {
		cursor: pointer;
		transition: all 0.2s ease;
		background-color: rgba(0, 0, 0, 0.1);
	}

	.preview-card:hover {
		background-color: rgba(255, 255, 255, 0.05);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.site-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
		flex: 1;
	}

	.favicon {
		width: 20px;
		height: 20px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.site-details {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.site-name {
		font-weight: 600;
		font-size: 0.8rem;
		color: #ffffff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.url-display {
		font-size: 0.7rem;
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.content-type {
		font-size: 0.7rem;
		color: #79c0ff;
		background-color: rgba(121, 192, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		white-space: nowrap;
	}

	.action-button {
		background: none;
		border: none;
		color: #a0a0a0;
		cursor: pointer;
		padding: 0.2rem;
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.action-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	.preview-content {
		display: flex;
		gap: 1rem;
		padding: 1rem;
	}

	.preview-image {
		flex-shrink: 0;
		width: 120px;
		height: 80px;
		border-radius: 6px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 6px;
	}

	.preview-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.preview-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.preview-description {
		margin: 0;
		font-size: 0.85rem;
		color: #b0b0b0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.preview-url {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.7rem;
		color: #666;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		margin-top: auto;
	}

	.preview-url span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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

	/* Responsive design */
	@media (max-width: 480px) {
		.preview-content {
			flex-direction: column;
			gap: 0.75rem;
		}

		.preview-image {
			width: 100%;
			height: 120px;
		}

		.preview-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.preview-actions {
			align-self: flex-end;
		}
	}
</style>