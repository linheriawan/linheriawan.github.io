<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		content: string; // File URL or file content with type info
	}

	let { content }: Props = $props();
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let fileData = $state<{
		url: string;
		filename: string;
		extension: string;
		type: string;
		size?: string;
		category: 'document' | 'archive' | 'code' | 'data' | 'font' | 'ebook' | 'other';
		icon: string;
		previewable: boolean;
		downloadable: boolean;
	}>({
		url: '',
		filename: '',
		extension: '',
		type: '',
		category: 'other',
		icon: '📄',
		previewable: false,
		downloadable: true
	});

	// File type configurations
	const fileTypes: Record<string, {
		category: 'document' | 'archive' | 'code' | 'data' | 'font' | 'ebook' | 'other';
		icon: string;
		type: string;
		previewable: boolean;
	}> = {
		// Documents
		'pdf': { category: 'document', icon: '📄', type: 'PDF Document', previewable: true },
		'doc': { category: 'document', icon: '📝', type: 'Word Document', previewable: false },
		'docx': { category: 'document', icon: '📝', type: 'Word Document', previewable: false },
		'ppt': { category: 'document', icon: '📊', type: 'PowerPoint Presentation', previewable: false },
		'pptx': { category: 'document', icon: '📊', type: 'PowerPoint Presentation', previewable: false },
		'xls': { category: 'document', icon: '📈', type: 'Excel Spreadsheet', previewable: false },
		'xlsx': { category: 'document', icon: '📈', type: 'Excel Spreadsheet', previewable: false },
		'txt': { category: 'document', icon: '📝', type: 'Text File', previewable: true },
		'rtf': { category: 'document', icon: '📝', type: 'Rich Text Document', previewable: false },
		'odt': { category: 'document', icon: '📝', type: 'OpenDocument Text', previewable: false },
		
		// Code files
		'js': { category: 'code', icon: '📜', type: 'JavaScript File', previewable: true },
		'ts': { category: 'code', icon: '📜', type: 'TypeScript File', previewable: true },
		'html': { category: 'code', icon: '🌐', type: 'HTML File', previewable: true },
		'css': { category: 'code', icon: '🎨', type: 'CSS File', previewable: true },
		'py': { category: 'code', icon: '🐍', type: 'Python File', previewable: true },
		'java': { category: 'code', icon: '☕', type: 'Java File', previewable: true },
		'cpp': { category: 'code', icon: '⚡', type: 'C++ File', previewable: true },
		'c': { category: 'code', icon: '⚡', type: 'C File', previewable: true },
		'php': { category: 'code', icon: '🐘', type: 'PHP File', previewable: true },
		'rb': { category: 'code', icon: '💎', type: 'Ruby File', previewable: true },
		'go': { category: 'code', icon: '🔷', type: 'Go File', previewable: true },
		'rs': { category: 'code', icon: '🦀', type: 'Rust File', previewable: true },
		'swift': { category: 'code', icon: '🦉', type: 'Swift File', previewable: true },
		'kt': { category: 'code', icon: '🏗️', type: 'Kotlin File', previewable: true },
		
		// Data files
		'json': { category: 'data', icon: '📋', type: 'JSON Data', previewable: true },
		'xml': { category: 'data', icon: '📋', type: 'XML Data', previewable: true },
		'csv': { category: 'data', icon: '📊', type: 'CSV Data', previewable: true },
		'tsv': { category: 'data', icon: '📊', type: 'TSV Data', previewable: true },
		'yaml': { category: 'data', icon: '📋', type: 'YAML Data', previewable: true },
		'yml': { category: 'data', icon: '📋', type: 'YAML Data', previewable: true },
		'toml': { category: 'data', icon: '📋', type: 'TOML Data', previewable: true },
		'ini': { category: 'data', icon: '⚙️', type: 'Configuration File', previewable: true },
		'cfg': { category: 'data', icon: '⚙️', type: 'Configuration File', previewable: true },
		'conf': { category: 'data', icon: '⚙️', type: 'Configuration File', previewable: true },
		
		// Archives
		'zip': { category: 'archive', icon: '🗜️', type: 'ZIP Archive', previewable: false },
		'rar': { category: 'archive', icon: '🗜️', type: 'RAR Archive', previewable: false },
		'7z': { category: 'archive', icon: '🗜️', type: '7-Zip Archive', previewable: false },
		'tar': { category: 'archive', icon: '🗜️', type: 'TAR Archive', previewable: false },
		'gz': { category: 'archive', icon: '🗜️', type: 'GZIP Archive', previewable: false },
		'bz2': { category: 'archive', icon: '🗜️', type: 'BZIP2 Archive', previewable: false },
		
		// Fonts
		'ttf': { category: 'font', icon: '🔤', type: 'TrueType Font', previewable: false },
		'otf': { category: 'font', icon: '🔤', type: 'OpenType Font', previewable: false },
		'woff': { category: 'font', icon: '🔤', type: 'Web Font', previewable: false },
		'woff2': { category: 'font', icon: '🔤', type: 'Web Font 2', previewable: false },
		
		// E-books
		'epub': { category: 'ebook', icon: '📖', type: 'EPUB eBook', previewable: false },
		'mobi': { category: 'ebook', icon: '📖', type: 'Mobipocket eBook', previewable: false },
		'azw': { category: 'ebook', icon: '📖', type: 'Kindle eBook', previewable: false },
		
		// Other
		'md': { category: 'document', icon: '📝', type: 'Markdown File', previewable: true },
		'log': { category: 'document', icon: '📜', type: 'Log File', previewable: true },
		'license': { category: 'document', icon: '📜', type: 'License File', previewable: true },
		'readme': { category: 'document', icon: '📖', type: 'Readme File', previewable: true }
	};

	// Extract content from code blocks
	function extractContent(text: string): string {
		// Extract from ```file code blocks
		const codeBlockMatch = text.match(/```file\s*([\s\S]*?)\s*```/i);
		if (codeBlockMatch) {
			return codeBlockMatch[1].trim();
		}
		return text.trim();
	}

	// Extract file info from content
	function extractFileInfo(text: string): { url: string; filename?: string } {
		const content = extractContent(text);
		const trimmed = content;
		
		// Direct file URL
		if (/^https?:\/\/[^\s]+\.[a-zA-Z0-9]+(\?[^\s]*)?$/i.test(trimmed)) {
			return { url: trimmed };
		}
		
		// Markdown link format [filename](url)
		const linkMatch = trimmed.match(/\[([^\]]*)\]\(([^)]+)\)/);
		if (linkMatch) {
			return { url: linkMatch[2], filename: linkMatch[1] };
		}
		
		// URL mentioned in text
		const urlMatch = trimmed.match(/(https?:\/\/[^\s]+\.[a-zA-Z0-9]+(\?[^\s]*)?)/i);
		if (urlMatch) {
			return { url: urlMatch[1] };
		}
		
		throw new Error('No valid file URL found in content');
	}

	function analyzeFile(url: string, filename?: string) {
		try {
			const urlObj = new URL(url);
			const pathname = urlObj.pathname;
			const extractedFilename = filename || pathname.split('/').pop() || 'unknown';
			const extension = extractedFilename.includes('.') 
				? extractedFilename.split('.').pop()?.toLowerCase() || '' 
				: '';
			
			const fileTypeInfo = fileTypes[extension] || {
				category: 'other' as const,
				icon: '📄',
				type: 'Unknown File',
				previewable: false
			};

			return {
				url,
				filename: extractedFilename,
				extension,
				type: fileTypeInfo.type,
				category: fileTypeInfo.category,
				icon: fileTypeInfo.icon,
				previewable: fileTypeInfo.previewable,
				downloadable: true,
				size: undefined // Would be fetched from server in real implementation
			};
		} catch (error) {
			throw new Error('Invalid file URL');
		}
	}

	function getCategoryColor(category: string): string {
		const colors: Record<string, string> = {
			'document': '#79c0ff',
			'code': '#4ac26b',
			'data': '#ffa657',
			'archive': '#d2a8ff',
			'font': '#ff7b72',
			'ebook': '#79c0ff',
			'other': '#a0a0a0'
		};
		return colors[category] || '#a0a0a0';
	}

	function getCategoryLabel(category: string): string {
		const labels: Record<string, string> = {
			'document': 'Document',
			'code': 'Code',
			'data': 'Data',
			'archive': 'Archive',
			'font': 'Font',
			'ebook': 'E-book',
			'other': 'File'
		};
		return labels[category] || 'File';
	}

	function downloadFile() {
		if (fileData.url) {
			const link = document.createElement('a');
			link.href = fileData.url;
			link.download = fileData.filename;
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}

	function copyUrl() {
		if (fileData.url) {
			navigator.clipboard.writeText(fileData.url).then(() => {
				// console.log('File URL copied to clipboard');
			}).catch(err => {
				console.error('Failed to copy URL:', err);
			});
		}
	}

	function previewFile() {
		if (fileData.url) {
			window.open(fileData.url, '_blank', 'noopener,noreferrer');
		}
	}

	async function loadFileInfo() {
		if (!browser) return;

		try {
			isLoading = true;
			hasError = false;
			
			const fileInfo = extractFileInfo(content);
			// console.log('Loading file info for:', fileInfo);

			// Simulate network delay
			await new Promise(resolve => setTimeout(resolve, 500));
			
			fileData = analyzeFile(fileInfo.url, fileInfo.filename);
			// console.log('File data:', fileData);

		} catch (error: any) {
			console.error('File analysis error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to analyze file';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadFileInfo();
	});
</script>

<div class="file-renderer renderer-content">
	{#if hasError}
		<div class="error-container">
			<div class="error-header">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				Failed to Load File
			</div>
			<div class="error-message">{errorMessage}</div>
			<button class="retry-button" onclick={() => { hasError = false; isLoading = true; loadFileInfo(); }}>
				Retry
			</button>
		</div>
	{:else if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<span>Analyzing file...</span>
		</div>
	{:else}
		<div class="file-card">
			<div class="file-header">
				<div class="file-info">
					<div class="file-icon" style="color: {getCategoryColor(fileData.category)}">{fileData.icon}</div>
					<div class="file-details">
						<div class="file-name" title={fileData.filename}>{fileData.filename}</div>
						<div class="file-meta">
							<span class="file-type">{fileData.type}</span>
							{#if fileData.extension}
								<span class="file-extension">.{fileData.extension.toUpperCase()}</span>
							{/if}
						</div>
					</div>
				</div>
				<div class="file-actions">
					<span class="category-badge" style="background-color: {getCategoryColor(fileData.category)}20; color: {getCategoryColor(fileData.category)}">
						{getCategoryLabel(fileData.category)}
					</span>
				</div>
			</div>

			<div class="file-content">
				<div class="file-description">
					<p>
						{#if fileData.category === 'document'}
							📝 This is a document file that can be opened with appropriate software.
						{:else if fileData.category === 'code'}
							💻 This is a source code file that can be viewed in any text editor or IDE.
						{:else if fileData.category === 'data'}
							📊 This is a data file containing structured information.
						{:else if fileData.category === 'archive'}
							🗜️ This is a compressed archive file that contains other files.
						{:else if fileData.category === 'font'}
							🔤 This is a font file that can be installed on your system.
						{:else if fileData.category === 'ebook'}
							📖 This is an electronic book file that can be read with e-reader software.
						{:else}
							📄 This is a file that can be downloaded and opened with appropriate software.
						{/if}
					</p>
				</div>

				<div class="file-url">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
						<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
					</svg>
					<span class="url-text">{fileData.url}</span>
				</div>

				<div class="action-buttons">
					{#if fileData.previewable}
						<button class="primary-button" onclick={previewFile}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
								<circle cx="12" cy="12" r="3"></circle>
							</svg>
							Preview
						</button>
					{/if}
					
					{#if fileData.downloadable}
						<button class="secondary-button" onclick={downloadFile}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
								<polyline points="7,10 12,15 17,10"></polyline>
								<line x1="12" y1="15" x2="12" y2="3"></line>
							</svg>
							Download
						</button>
					{/if}
					
					<button class="secondary-button" onclick={copyUrl}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
						</svg>
						Copy URL
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.file-renderer {
		margin: 0.8rem 0;
		border-radius: 8px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.file-card {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.file-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
		flex: 1;
	}

	.file-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.file-details {
		min-width: 0;
		flex: 1;
	}

	.file-name {
		font-weight: 600;
		font-size: 1rem;
		color: #ffffff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-bottom: 0.2rem;
	}

	.file-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.file-type {
		font-size: 0.8rem;
		color: #b0b0b0;
	}

	.file-extension {
		font-size: 0.7rem;
		color: #79c0ff;
		background-color: rgba(121, 192, 255, 0.1);
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-weight: 600;
	}

	.file-actions {
		flex-shrink: 0;
	}

	.category-badge {
		font-size: 0.7rem;
		padding: 0.3rem 0.6rem;
		border-radius: 12px;
		font-weight: 500;
		white-space: nowrap;
	}

	.file-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.file-description p {
		margin: 0;
		font-size: 0.85rem;
		color: #b0b0b0;
		line-height: 1.4;
	}

	.file-url {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.7rem;
		color: #666;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		padding: 0.5rem;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.url-text {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.primary-button {
		background-color: #0b69a3;
		color: white;
		border: none;
		padding: 0.6rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
		font-size: 0.85rem;
	}

	.primary-button:hover {
		background-color: #0958a3;
		transform: translateY(-1px);
	}

	.secondary-button {
		background-color: rgba(255, 255, 255, 0.1);
		color: #e5e5e5;
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.6rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
		font-size: 0.85rem;
	}

	.secondary-button:hover {
		background-color: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
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
		.file-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.file-info {
			width: 100%;
		}

		.file-actions {
			align-self: flex-end;
		}

		.action-buttons {
			flex-direction: column;
		}

		.primary-button,
		.secondary-button {
			width: 100%;
			justify-content: center;
		}
	}
</style>