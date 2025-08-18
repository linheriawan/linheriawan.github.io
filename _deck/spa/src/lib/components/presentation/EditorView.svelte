<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import ScrollView from './ScrollView.svelte';

	interface Props {
		sessionId?: string;  // Optional - falls back to URL param
	}

	let { sessionId }: Props = $props();
	let marpSource = $state<string>('');
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let currentSessionId = $state<string>('');

	// Get session ID from prop or URL
	$effect(() => {
		if (browser) {
			const id = sessionId || $page.url.searchParams.get('id');
			if (id) {
				currentSessionId = id;
				loadFromSession(id);
			}
		}
	});

	// Auto-save to session storage when marpSource changes (seamless reactivity)
	$effect(() => {
		if (browser && currentSessionId && marpSource && !isLoading) {
			sessionStorage.setItem(currentSessionId, marpSource);
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
		} catch (error: any) {
			console.error('Load error:', error);
			hasError = true;
			errorMessage = error.message;
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		// Don't handle shortcuts when editing in textarea
		if (event.target instanceof HTMLTextAreaElement) {
			// Allow Tab for indentation
			if (event.key === 'Tab') {
				event.preventDefault();
				const textarea = event.target;
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				
				// Insert tab character
				textarea.value = textarea.value.substring(0, start) + '\t' + textarea.value.substring(end);
				textarea.selectionStart = textarea.selectionEnd = start + 1;
				
				// Update the reactive variable
				marpSource = textarea.value;
			}
			return;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="editor-view">
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<span>Loading presentation...</span>
		</div>
	{:else if hasError}
		<div class="error-container">
			<h3>Editor Error</h3>
			<p>{errorMessage}</p>
		</div>
	{:else}
		<div class="split-editor">
			<!-- Left Panel: Code Editor -->
			<div class="editor-panel">
				<div class="editor-toolbar">
					<span class="editor-label">Marp Source</span>
					<div class="editor-info">
						<span class="save-indicator">Auto-saving...</span>
					</div>
				</div>
				<textarea 
					bind:value={marpSource}
					class="editor-textarea"
					placeholder="Enter your Marp presentation content here...

Example:
---
marp: true
theme: dark
paginate: true
---

# Slide 1: Welcome
This is the first slide.

---

# Slide 2: Features
- **Math support**: $E = mc^2$
- **Code blocks**
- **Images and diagrams**

---

# Slide 3: Thank You
End of presentation!"
					spellcheck="false"
				></textarea>
			</div>

			<!-- Right Panel: Live Preview using ScrollView -->
			<div class="preview-panel">
				<div class="preview-toolbar">
					<span class="preview-label">Live Preview</span>
					<div class="preview-info">
						<span class="preview-indicator">Live updating</span>
					</div>
				</div>
				<div class="preview-content">
					<ScrollView sessionId={currentSessionId} />
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.editor-view {
		width: 100%;
		height: 100%;
		background: #1a1a1a;
		color: white;
		overflow: hidden;
	}

	.split-editor {
		display: flex;
		width: 100%;
		height: 100%;
	}

	.editor-panel {
		width: 50%;
		height: 100%;
		display: flex;
		flex-direction: column;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		background: #1a1a1a;
	}

	.preview-panel {
		width: 50%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #1a1a1a;
	}

	.editor-toolbar, .preview-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		height: 50px;
		box-sizing: border-box;
	}

	.editor-label, .preview-label {
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		text-transform: uppercase;
		font-weight: 600;
		font-size: 0.75rem;
		letter-spacing: 0.5px;
	}

	.editor-info, .preview-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.save-indicator, .preview-indicator {
		color: #4BC0C0;
		font-size: 0.7rem;
		font-weight: 500;
		opacity: 0.8;
	}

	.editor-textarea {
		flex: 1;
		width: 100%;
		background: #1a1a1a;
		color: #f8f8f2;
		border: none;
		outline: none;
		padding: 1rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9rem;
		line-height: 1.6;
		resize: none;
		box-sizing: border-box;
		tab-size: 2;
	}

	.editor-textarea::placeholder {
		color: #666;
		line-height: 1.4;
	}

	.preview-content {
		flex: 1;
		position: relative;
		overflow: hidden;
		background: #1a1a1a;
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