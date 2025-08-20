<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		Chart,
		type ChartConfiguration,
		type ChartType,
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		Title,
		Tooltip,
		Legend,
		ArcElement
	} from 'chart.js';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();
	let chartElement: HTMLCanvasElement;
	let chartInstance: Chart | null = null;
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let chartType = $state<string>('');
	let chartData = $state<any>(null);

	// Register Chart.js components
	Chart.register(
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		Title,
		Tooltip,
		Legend,
		ArcElement
	);

	// Chart type detection and parsing
	function parseChartContent(text: string): { type: ChartType; data: any; options?: any } | null {
		try {
			// Remove markdown code block wrapper (only chart blocks)
			const cleanText = text.replace(/```chart\s*\n?|\n?```$/g, '').trim();
			
			// Try to parse as JSON first
			let parsed: any;
			try {
				parsed = JSON.parse(cleanText);
			} catch {
				// If not JSON, try to parse as simple format
				return parseSimpleChartFormat(cleanText);
			}

			// Validate chart data structure
			if (!parsed.type || !parsed.data) {
				throw new Error('Chart must have type and data properties');
			}

			// Validate chart type
			const validTypes = ['line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'];
			if (!validTypes.includes(parsed.type)) {
				throw new Error(`Unsupported chart type: ${parsed.type}`);
			}

			return {
				type: parsed.type as ChartType,
				data: parsed.data,
				options: parsed.options || getDefaultOptions(parsed.type)
			};
		} catch (error) {
			console.error('Chart parsing error:', error);
			return null;
		}
	}

	// Parse simple chart format: "type: data"
	function parseSimpleChartFormat(text: string): { type: ChartType; data: any; options?: any } | null {
		try {
			const lines = text.split('\n').filter(line => line.trim());
			if (lines.length < 2) return null;

			const typeMatch = lines[0].match(/^type:\s*(\w+)/i);
			if (!typeMatch) return null;

			const type = typeMatch[1].toLowerCase() as ChartType;
			const validTypes = ['line', 'bar', 'pie', 'doughnut'];
			if (!validTypes.includes(type)) return null;

			// Parse simple data format
			const dataLines = lines.slice(1);
			const labels: string[] = [];
			const values: number[] = [];

			for (const line of dataLines) {
				const match = line.match(/^([^:]+):\s*(.+)$/);
				if (match) {
					labels.push(match[1].trim());
					const value = parseFloat(match[2].trim());
					if (!isNaN(value)) {
						values.push(value);
					}
				}
			}

			if (labels.length === 0 || values.length === 0) return null;

			const data = {
				labels,
				datasets: [{
					label: 'Data',
					data: values,
					backgroundColor: generateColors(values.length),
					borderColor: generateColors(values.length, 0.8),
					borderWidth: 2
				}]
			};

			return { type, data, options: getDefaultOptions(type) };
		} catch (error) {
			console.error('Simple chart parsing error:', error);
			return null;
		}
	}

	// Generate color palette
	function generateColors(count: number, alpha: number = 0.6): string[] {
		const colors = [
			`rgba(255, 99, 132, ${alpha})`,
			`rgba(54, 162, 235, ${alpha})`,
			`rgba(255, 205, 86, ${alpha})`,
			`rgba(75, 192, 192, ${alpha})`,
			`rgba(153, 102, 255, ${alpha})`,
			`rgba(255, 159, 64, ${alpha})`,
			`rgba(199, 199, 199, ${alpha})`,
			`rgba(83, 102, 255, ${alpha})`
		];
		
		const result = [];
		for (let i = 0; i < count; i++) {
			result.push(colors[i % colors.length]);
		}
		return result;
	}

	// Default chart options for dark theme
	function getDefaultOptions(type: string) {
		const baseOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					labels: {
						color: '#ffffff'
					}
				},
				title: {
					color: '#ffffff'
				}
			},
			scales: type === 'pie' || type === 'doughnut' ? {} : {
				x: {
					ticks: { color: '#ffffff' },
					grid: { color: 'rgba(255, 255, 255, 0.1)' }
				},
				y: {
					ticks: { color: '#ffffff' },
					grid: { color: 'rgba(255, 255, 255, 0.1)' }
				}
			}
		};

		return baseOptions;
	}

	// Render chart
	async function renderChart() {
		if (!browser || !chartElement) return;

		try {
			isLoading = true;
			hasError = false;

			const parsed = parseChartContent(content);
			if (!parsed) {
				throw new Error('Unable to parse chart data');
			}

			chartType = parsed.type;
			chartData = parsed.data;

			// Destroy existing chart
			if (chartInstance) {
				chartInstance.destroy();
			}

			// Create new chart
			const config: ChartConfiguration = {
				type: parsed.type,
				data: parsed.data,
				options: parsed.options
			};

			chartInstance = new Chart(chartElement, config);
			console.log('✅ chartrenderer done rendering');
			
		} catch (error: any) {
			console.error('Chart rendering error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to render chart';
		} finally {
			isLoading = false;
		}
	}

	// Download chart as image
	function downloadChart() {
		if (!chartInstance) return;
		
		const url = chartInstance.toBase64Image();
		const link = document.createElement('a');
		link.href = url;
		link.download = `chart-${chartType}-${Date.now()}.png`;
		link.click();
	}

	// Copy chart data
	function copyChartData() {
		if (!chartData) return;
		
		try {
			const data = JSON.stringify({ type: chartType, data: chartData }, null, 2);
			navigator.clipboard.writeText(data);
		} catch (error) {
			console.error('Copy failed:', error);
		}
	}

	onMount(() => {
		if (browser) {
			console.log('🚀 chartrenderer is initialize');
			renderChart();
		}
	});

	// Re-render when content changes
	$effect(() => {
		if (browser && content) {
			renderChart();
		}
	});
</script>

<div class="chart-renderer">
	<div class="chart-header">
		<span class="chart-label">
			{#if chartType}
				{chartType.toUpperCase()} Chart
			{:else}
				Chart
			{/if}
		</span>
		{#if !isLoading && !hasError}
			<div class="chart-actions">
				<button 
					class="action-button" 
					onclick={copyChartData}
					title="Copy chart data"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
					</svg>
				</button>
				<button 
					class="action-button" 
					onclick={downloadChart}
					title="Download chart"
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

	<div class="chart-content">
		{#if isLoading}
			<div class="loading-container">
				<div class="loading-spinner"></div>
				<span>Rendering chart...</span>
			</div>
		{:else if hasError}
			<div class="error-container">
				<div class="error-header">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<line x1="15" y1="9" x2="9" y2="15"/>
						<line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
					Chart Rendering Error
				</div>
				<div class="error-message">{errorMessage}</div>
				<details class="error-details">
					<summary>Chart Data</summary>
					<div class="error-code">{content}</div>
				</details>
			</div>
		{:else}
			<canvas bind:this={chartElement} class="chart-canvas"></canvas>
		{/if}
	</div>
</div>

<style>
	.chart-renderer {
		margin: 0;
		border-radius: 8px 8px 0 0;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.chart-label {
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		text-transform: uppercase;
		font-weight: 600;
		font-size: 0.7rem;
		letter-spacing: 0.5px;
	}

	.chart-actions {
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

	.chart-content {
		position: relative;
		min-height: 300px;
		padding: 1rem;
	}

	.chart-canvas {
		width: 100% !important;
		height: 300px !important;
		max-width: 100%;
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