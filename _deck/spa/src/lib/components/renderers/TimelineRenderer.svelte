<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		content: string; // Timeline data in JSON format or structured text
	}

	let { content }: Props = $props();
	let timelineContainer: HTMLDivElement;
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let timeline: any = null;
	let timelineData = $state<{
		items: any[];
		groups?: any[];
		title?: string;
		type?: string;
	}>({ items: [] });
	let initialized = $state<boolean>(false);

	// Extract content from code blocks
	function extractContent(text: string): string {
		// Extract from ```timeline code blocks
		const codeBlockMatch = text.match(/```timeline\s*([\s\S]*?)\s*```/i);
		if (codeBlockMatch) {
			return codeBlockMatch[1].trim();
		}
		return text.trim();
	}

	// Parse timeline content from various formats
	function parseTimelineContent(text: string) {
		const content = extractContent(text);
		console.log('Raw timeline input:', text.substring(0, 100) + '...');
		console.log('Extracted timeline content:', content);
		
		try {
			// Try JSON format first
			if (content.startsWith('{') || content.startsWith('[')) {
				const jsonData = JSON.parse(content);
				
				// Handle array of timeline items
				if (Array.isArray(jsonData)) {
					return {
						items: jsonData.map((item, index) => ({
							id: item.id || index,
							content: item.content || item.title || item.label || `Event ${index + 1}`,
							start: new Date(item.start || item.date || Date.now()),
							end: item.end ? new Date(item.end) : undefined,
							group: item.group || undefined,
							type: item.type || 'point',
							className: item.className || undefined
						})),
						groups: undefined,
						title: 'Timeline',
						type: 'parsed'
					};
				}
				
				// Handle object with items/groups structure
				if (jsonData.items) {
					const result = {
						items: jsonData.items.map((item: any, index: number) => ({
							id: item.id || index,
							content: item.content || item.title || item.label || `Event ${index + 1}`,
							start: new Date(item.start || item.date || Date.now()),
							end: item.end ? new Date(item.end) : undefined,
							group: item.group || undefined,
							type: item.type || 'point',
							className: item.className || undefined
						})),
						groups: jsonData.groups || undefined,
						title: jsonData.title || 'Timeline',
						type: 'parsed'
					};
					
					if (result.groups) {
						result.groups = result.groups.map((group: any, index: number) => ({
							id: group.id || index,
							content: group.content || group.name || `Group ${index + 1}`,
							className: group.className || undefined
						}));
					}
					
					return result;
				}
			}

			// Parse simple text format
			const lines = text.trim().split('\n').filter(line => line.trim());
			if (lines.length === 0) {
				throw new Error('No timeline data found');
			}

			// Simple format: "YYYY-MM-DD: Event description" or "Event description (YYYY-MM-DD)"
			const items = lines.map((line, index) => {
				const trimmedLine = line.trim();
				
				// Format: "YYYY-MM-DD: Event description"
				const dateFirstMatch = trimmedLine.match(/^(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)\s*:?\s*(.+)$/);
				if (dateFirstMatch) {
					return {
						id: index,
						content: dateFirstMatch[2],
						start: new Date(dateFirstMatch[1]),
						type: 'point'
					};
				}
				
				// Format: "Event description (YYYY-MM-DD)"
				const dateLastMatch = trimmedLine.match(/^(.+?)\s*\((\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)\)$/);
				if (dateLastMatch) {
					return {
						id: index,
						content: dateLastMatch[1],
						start: new Date(dateLastMatch[2]),
						type: 'point'
					};
				}
				
				// Fallback: use line as-is with today's date
				return {
					id: index,
					content: trimmedLine,
					start: new Date(),
					type: 'point'
				};
			});

			return {
				items,
				groups: undefined,
				title: 'Timeline',
				type: 'text'
			};

		} catch (error: any) {
			console.error('Timeline parsing error:', error);
			throw new Error(`Failed to parse timeline data: ${error.message}`);
		}
	}

	// Generate sample timeline data
	function generateSampleData() {
		const now = new Date();
		const items = [
			{
				id: 1,
				content: 'Project Started',
				start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
				type: 'point',
				className: 'milestone'
			},
			{
				id: 2,
				content: 'Design Phase',
				start: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
				end: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
				type: 'range',
				className: 'design-phase'
			},
			{
				id: 3,
				content: 'Development Sprint 1',
				start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
				end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
				type: 'range',
				className: 'development'
			},
			{
				id: 4,
				content: 'Testing Phase',
				start: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
				end: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
				type: 'range',
				className: 'testing'
			},
			{
				id: 5,
				content: 'Deployment',
				start: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
				type: 'point',
				className: 'milestone'
			},
			{
				id: 6,
				content: 'Future Feature',
				start: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
				type: 'point',
				className: 'future'
			}
		];

		return {
			items,
			groups: undefined,
			title: 'Sample Project Timeline',
			type: 'sample'
		};
	}

	async function initializeTimeline() {
		if (!browser || !timelineContainer) {
			isLoading = false;
			return;
		}

		try {
			isLoading = true;
			hasError = false;
			errorMessage = '';
			
			// Clean up any existing content
			if (timelineContainer) {
				timelineContainer.innerHTML = '';
				console.log('Timeline container dimensions:', {
					width: timelineContainer.offsetWidth,
					height: timelineContainer.offsetHeight,
					clientWidth: timelineContainer.clientWidth,
					clientHeight: timelineContainer.clientHeight
				});
			}
			
			// Parse the content or use sample data
			if (content && content.trim()) {
				console.log('Timeline: parsing content, length:', content.length);
				timelineData = parseTimelineContent(content);
			} else {
				console.log('Timeline: no content provided, using sample data');
				timelineData = generateSampleData();
			}

			console.log('Parsed timeline data:', timelineData);
			console.log('Timeline items count:', timelineData.items.length);

			if (timelineData.items.length === 0) {
				throw new Error('No timeline items found');
			}

			// Add timeout to prevent indefinite loading - reduced to 5 seconds
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => {
					console.log('TIMELINE TIMEOUT - initialization taking too long');
					reject(new Error('Timeline loading timeout (5s)'));
				}, 5000);
			});

			const loadPromise = async () => {
				// Dynamic import vis-timeline
				console.log('Step 1: Importing vis-timeline...');
				const { Timeline, DataSet } = await import('vis-timeline/standalone');
				console.log('Step 2: vis-timeline imported successfully:', { Timeline, DataSet });

				// Import CSS
				console.log('Step 3: Importing vis-timeline CSS...');
				await import('vis-timeline/styles/vis-timeline-graph2d.min.css');
				console.log('Step 4: CSS imported successfully');

				// Create datasets
				console.log('Step 5: Creating datasets...');
				console.log('Timeline items to process:', timelineData.items);
				const items = new DataSet(timelineData.items);
				console.log('Step 6: Items dataset created:', items);
				const groups = timelineData.groups ? new DataSet(timelineData.groups) : undefined;
				console.log('Step 7: Groups dataset created:', groups);

				// Timeline options
				const options = {
					width: '100%',
					height: '300px',
					margin: {
						item: 10,
						axis: 20
					},
					orientation: 'top',
					zoomable: true,
					moveable: true,
					selectable: true,
					multiselect: false,
					showCurrentTime: true,
					showTooltips: true,
					tooltip: {
						followMouse: true,
						overflowMethod: 'cap'
					},
					format: {
						minorLabels: {
							millisecond: 'SSS',
							second: 's',
							minute: 'HH:mm',
							hour: 'HH:mm',
							weekday: 'ddd D',
							day: 'D',
							week: 'w',
							month: 'MMM',
							year: 'YYYY'
						},
						majorLabels: {
							millisecond: 'HH:mm:ss',
							second: 'D MMMM HH:mm',
							minute: 'ddd D MMMM',
							hour: 'ddd D MMMM',
							weekday: 'MMMM YYYY',
							day: 'MMMM YYYY',
							week: 'MMMM YYYY',
							month: 'YYYY',
							year: ''
						}
					}
				};

				// Create timeline
				console.log('Creating timeline with container:', timelineContainer);
				console.log('Items dataset:', items);
				console.log('Groups dataset:', groups);
				console.log('Timeline options:', options);
				
				console.log('Step 8: Creating timeline instance...');
				try {
					timeline = new Timeline(timelineContainer, items, groups, options);
					console.log('Step 9: Timeline created successfully:', timeline);
				} catch (timelineError) {
					console.error('Failed to create timeline:', timelineError);
					throw timelineError;
				}

				console.log('Step 10: Adding event listeners...');
				// Add event listeners
				timeline.on('select', (properties: any) => {
					if (properties.items.length > 0) {
						const selectedId = properties.items[0];
						const selectedItem = timelineData.items.find(item => item.id === selectedId);
						if (selectedItem) {
							console.log('Selected timeline item:', selectedItem);
						}
					}
				});

				console.log('Step 11: Fitting timeline...');
				// Fit timeline to show all items
				timeline.fit();
				console.log('Step 12: Timeline fit and ready - INITIALIZATION COMPLETE');
			};

			// Race between loading and timeout
			await Promise.race([loadPromise(), timeoutPromise]);

		} catch (error: any) {
			console.error('Timeline initialization error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to initialize timeline';
			initialized = false; // Reset so it can be retried
			throw error; // Re-throw for the effect's catch handler
		} finally {
			isLoading = false;
		}
	}

	function zoomIn() {
		if (timeline) {
			timeline.zoomIn(0.2);
		}
	}

	function zoomOut() {
		if (timeline) {
			timeline.zoomOut(0.2);
		}
	}

	function fitToWindow() {
		if (timeline) {
			timeline.fit();
		}
	}

	function goToToday() {
		if (timeline) {
			const now = new Date();
			timeline.moveTo(now);
		}
	}

	// Use effect to initialize when container is available
	$effect(() => {
		console.log('Timeline effect triggered, content length:', content?.length || 0);
		console.log('Already initialized:', initialized, 'Timeline exists:', !!timeline);
		
		// Only initialize if we have all required conditions and haven't initialized yet
		if (browser && timelineContainer && content && content.trim() && !initialized && !timeline) {
			console.log('All conditions met, starting timeline initialization');
			initialized = true; // Set immediately to prevent race conditions
			initializeTimeline().catch(error => {
				console.error('Timeline initialization failed:', error);
				initialized = false; // Reset on error so it can be retried
			});
		}
		
		// Cleanup on component destroy
		return () => {
			console.log('Timeline cleanup - destroying timeline');
			if (timeline) {
				try {
					timeline.destroy();
				} catch (e) {
					console.warn('Error destroying timeline:', e);
				}
				timeline = null;
			}
			// Don't reset initialized here - let it stay true if successfully initialized
		};
	});
</script>

<div class="timeline-renderer renderer-content">
	{#if hasError}
		<div class="error-container">
			<div class="error-header">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				Failed to Load Timeline
			</div>
			<div class="error-message">{errorMessage}</div>
			<button class="retry-button" onclick={() => { hasError = false; isLoading = true; initializeTimeline(); }}>
				Retry
			</button>
		</div>
	{:else}
		<div class="timeline-header">
			<div class="timeline-info">
				{#if !isLoading && timelineData.items}
					<span class="timeline-stats">
						{timelineData.items.length} events
					</span>
					<span class="timeline-title">
						{timelineData.title || 'Timeline'}
					</span>
				{/if}
			</div>
			<div class="timeline-controls">
				{#if !isLoading && !hasError}
					<button 
						class="control-button" 
						onclick={zoomIn}
						title="Zoom in"
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
						onclick={zoomOut}
						title="Zoom out"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							<line x1="8" y1="11" x2="14" y2="11"></line>
						</svg>
					</button>
					
					<button 
						class="control-button" 
						onclick={fitToWindow}
						title="Fit to window"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="15,3 21,3 21,9"></polyline>
							<polyline points="9,21 3,21 3,15"></polyline>
							<line x1="21" y1="3" x2="14" y2="10"></line>
							<line x1="3" y1="21" x2="10" y2="14"></line>
						</svg>
					</button>
					
					<button 
						class="control-button" 
						onclick={goToToday}
						title="Go to today"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
							<line x1="16" y1="2" x2="16" y2="6"></line>
							<line x1="8" y1="2" x2="8" y2="6"></line>
							<line x1="3" y1="10" x2="21" y2="10"></line>
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<div class="timeline-content" class:loading={isLoading}>
			<div 
				bind:this={timelineContainer}
				class="timeline-container"
				style="display: {isLoading ? 'none' : 'block'}"
			></div>
			
			{#if isLoading}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<span>Loading timeline...</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.timeline-renderer {
		margin: 0;
		border-radius: 8px 8px 0 0;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		max-height: 70vh;
		display: flex;
		flex-direction: column;
	}

	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.timeline-info {
		display: flex;
		gap: 0.8rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.timeline-stats {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
	}

	.timeline-title {
		background-color: rgba(121, 192, 255, 0.2);
		color: #79c0ff;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-weight: 500;
	}

	.timeline-controls {
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

	.timeline-content {
		flex: 1;
		position: relative;
		background-color: #1a1a1a;
		overflow: hidden;
	}

	.timeline-content.loading {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.timeline-container {
		width: 100%;
		height: 300px;
		background-color: #1a1a1a;
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

	/* Custom timeline styling */
	:global(.vis-timeline) {
		background: #1a1a1a !important;
		border: none !important;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
	}

	:global(.vis-panel) {
		background: #1a1a1a !important;
		border: none !important;
	}

	:global(.vis-timeline .vis-time-axis) {
		background: rgba(0, 0, 0, 0.3) !important;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
	}

	:global(.vis-timeline .vis-text) {
		color: #e5e5e5 !important;
		font-size: 11px !important;
	}

	:global(.vis-timeline .vis-item) {
		background: rgba(11, 105, 163, 0.8) !important;
		border: 1px solid rgba(11, 105, 163, 1) !important;
		color: white !important;
		border-radius: 4px !important;
	}

	:global(.vis-timeline .vis-item.vis-selected) {
		background: rgba(121, 192, 255, 0.9) !important;
		border: 1px solid #79c0ff !important;
	}

	:global(.vis-timeline .vis-item.milestone) {
		background: rgba(255, 123, 114, 0.8) !important;
		border: 1px solid #ff7b72 !important;
	}

	:global(.vis-timeline .vis-item.design-phase) {
		background: rgba(210, 168, 255, 0.8) !important;
		border: 1px solid #d2a8ff !important;
	}

	:global(.vis-timeline .vis-item.development) {
		background: rgba(74, 194, 107, 0.8) !important;
		border: 1px solid #4ac26b !important;
	}

	:global(.vis-timeline .vis-item.testing) {
		background: rgba(255, 166, 87, 0.8) !important;
		border: 1px solid #ffa657 !important;
	}

	:global(.vis-timeline .vis-item.future) {
		background: rgba(130, 130, 130, 0.6) !important;
		border: 1px solid #888 !important;
		border-style: dashed !important;
	}

	:global(.vis-timeline .vis-current-time) {
		background: #ff7b72 !important;
		width: 2px !important;
	}

	:global(.vis-timeline .vis-custom-time) {
		background: #79c0ff !important;
		width: 2px !important;
	}
</style>