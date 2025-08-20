<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();
	let tableContainer: HTMLDivElement;
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let tableData = $state<{
		columns: string[];
		rows: string[][];
		totalRows: number;
		hasHeaders: boolean;
	}>({
		columns: [],
		rows: [],
		totalRows: 0,
		hasHeaders: false
	});
	let initialized = $state<boolean>(false);

	// Extract content from code blocks
	function extractContent(text: string): string {
		// Extract from ```csv or ```table code blocks
		const codeBlockMatch = text.match(/```(?:csv|table)\s*([\s\S]*?)\s*```/i);
		if (codeBlockMatch) {
			return codeBlockMatch[1].trim();
		}
		return text.trim();
	}

	function parseTableContent(text: string) {
		const content = extractContent(text);
		
		try {
			// Try JSON first (chart data might be tables)
			if (content.startsWith('{') || content.startsWith('[')) {
				const jsonData = JSON.parse(content);
				
				if (Array.isArray(jsonData)) {
					// Array of objects
					if (jsonData.length > 0 && typeof jsonData[0] === 'object') {
						const columns = Object.keys(jsonData[0]);
						const rows = jsonData.map(obj => columns.map(col => String(obj[col] || '')));
						
						return {
							columns: columns.map(col => col.charAt(0).toUpperCase() + col.slice(1)),
							rows,
							totalRows: rows.length,
							hasHeaders: true
						};
					}
				} else if (jsonData.data && Array.isArray(jsonData.data)) {
					// Chart.js format with data
					const data = jsonData.data;
					if (data.length > 0 && typeof data[0] === 'object') {
						const columns = Object.keys(data[0]);
						const rows = data.map(obj => columns.map(col => String(obj[col] || '')));
						
						return {
							columns: columns.map(col => col.charAt(0).toUpperCase() + col.slice(1)),
							rows,
							totalRows: rows.length,
							hasHeaders: true
						};
					}
				}
			}

			// Parse CSV/TSV format
			const lines = content.split('\n').filter(line => line.trim());
			if (lines.length === 0) {
				throw new Error('No data found');
			}

			// Detect delimiter (comma, tab, pipe)
			const firstLine = lines[0];
			let delimiter = ',';
			if (firstLine.includes('\t')) delimiter = '\t';
			else if (firstLine.includes('|')) delimiter = '|';

			// Parse rows
			const rows = lines.map(line => {
				if (delimiter === '|') {
					// Markdown table format |col1|col2|col3|
					return line.split('|').map(cell => cell.trim()).filter(cell => cell);
				} else {
					return line.split(delimiter).map(cell => cell.trim());
				}
			});

			if (rows.length === 0 || rows[0].length === 0) {
				throw new Error('Invalid table format');
			}

			// Check if second row is markdown separator (---|---|---)
			let headerRowIndex = 0;
			let dataStartIndex = 1;
			let hasHeaders = true;

			if (rows.length > 1 && rows[1].every(cell => /^:?-+:?$/.test(cell))) {
				// Markdown table with separator row
				dataStartIndex = 2;
			} else if (rows.length > 1) {
				// Check if first row looks like headers (no numbers or contains non-numeric data)
				const firstRowValues = rows[0];
				const hasNonNumeric = firstRowValues.some(cell => 
					isNaN(Number(cell)) && 
					cell.toLowerCase() !== 'true' && 
					cell.toLowerCase() !== 'false'
				);
				hasHeaders = hasNonNumeric;
				
				if (!hasHeaders) {
					headerRowIndex = -1;
					dataStartIndex = 0;
				}
			}

			// Get columns and data rows
			const columns = hasHeaders && headerRowIndex >= 0 
				? rows[headerRowIndex] 
				: rows[0].map((_, i) => `Column ${i + 1}`);
			
			const dataRows = rows.slice(dataStartIndex);

			return {
				columns,
				rows: dataRows,
				totalRows: dataRows.length,
				hasHeaders
			};

		} catch (error: any) {
			console.error('Table parsing error:', error);
			throw new Error(`Failed to parse table data: ${error.message}`);
		}
	}

	function createHtmlTable() {
		if (!tableContainer || !tableData.rows.length) return;
		
		// Create a simple HTML table
		const table = document.createElement('table');
		table.className = 'native-table';
		
		// Create header if we have one
		if (tableData.hasHeaders && tableData.columns.length) {
			const thead = document.createElement('thead');
			const headerRow = document.createElement('tr');
			
			tableData.columns.forEach(colName => {
				const th = document.createElement('th');
				th.textContent = colName;
				headerRow.appendChild(th);
			});
			thead.appendChild(headerRow);
			table.appendChild(thead);
		}
		
		// Create body
		const tbody = document.createElement('tbody');
		tableData.rows.forEach(row => {
			const tr = document.createElement('tr');
			
			row.forEach(cellValue => {
				const td = document.createElement('td');
				td.textContent = cellValue;
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		});
		table.appendChild(tbody);
		
		// Clear container and add table
		tableContainer.innerHTML = '';
		tableContainer.appendChild(table);
	}

	function initializeTable() {
		if (!browser || !tableContainer) {
			isLoading = false;
			return;
		}

		try {
			isLoading = true;
			hasError = false;
			
			// Parse the content
			tableData = parseTableContent(content);

			if (tableData.rows.length === 0) {
				throw new Error('No data rows found');
			}

			// Create native HTML table
			createHtmlTable();
			
			console.log('✅ tablerenderer done rendering');

		} catch (error: any) {
			console.error('Table initialization error:', error);
			hasError = true;
			errorMessage = error.message || 'Failed to initialize table';
		} finally {
			isLoading = false;
		}
	}

	function copyTableData() {
		// Get all data and convert to CSV format
		const csvContent = [
			// Headers if present
			...(tableData.hasHeaders ? [tableData.columns.join('\t')] : []),
			// Data rows
			...tableData.rows.map(row => row.join('\t'))
		].join('\n');

		navigator.clipboard.writeText(csvContent).then(() => {
			// Table data copied to clipboard
		}).catch(err => {
			console.error('Failed to copy table data:', err);
		});
	}

	function downloadTableData() {
		const csvContent = [
			// Headers if present
			...(tableData.hasHeaders ? [tableData.columns.join(',')] : []),
			// Data rows (escape commas in CSV)
			...tableData.rows.map(row => 
				row.map(cell => cell.includes(',') ? `"${cell}"` : cell).join(',')
			)
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'table-data.csv';
		a.click();
		URL.revokeObjectURL(url);
	}

	// Use onMount to initialize when component is ready
	onMount(() => {
		if (browser) {
			console.log('🚀 tablerenderer is initialize');
			// Small delay to ensure DOM is ready
			setTimeout(() => {
				if (tableContainer && content && !initialized) {
						initialized = true;
					initializeTable();
				}
			}, 10);
		}
		
		// Cleanup on component destroy
		return () => {
			if (tableContainer) {
				tableContainer.innerHTML = '';
			}
		};
	});
</script>

<div class="table-renderer renderer-content">
	{#if hasError}
		<div class="error-container">
			<div class="error-header">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				Failed to Load Table
			</div>
			<div class="error-message">{errorMessage}</div>
			<button class="retry-button" onclick={() => { hasError = false; isLoading = true; initializeTable(); }}>
				Retry
			</button>
		</div>
	{:else}
		<div class="table-header">
			<div class="table-info">
				{#if !isLoading}
					<span class="table-stats">
						{tableData.totalRows} rows × {tableData.columns.length} columns
					</span>
					{#if tableData.hasHeaders}
						<span class="table-type">With Headers</span>
					{/if}
				{/if}
			</div>
			<div class="table-actions">
				{#if !isLoading && !hasError}
					<button 
						class="action-button" 
						onclick={copyTableData}
						title="Copy data"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
						</svg>
					</button>
					<button 
						class="action-button" 
						onclick={downloadTableData}
						title="Download CSV"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							<polyline points="7,10 12,15 17,10"></polyline>
							<line x1="12" y1="15" x2="12" y2="3"></line>
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<div class="table-content" class:loading={isLoading}>
			{#if isLoading}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<span>Loading table...</span>
				</div>
			{:else}
				<div 
					bind:this={tableContainer}
					class="table-container"
				></div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.table-renderer {
		margin: 0.8rem 0;
		border-radius: 8px;
		overflow: hidden;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		width: 100%;
		max-width: 100%;
	}

	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.table-info {
		display: flex;
		gap: 0.8rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: #a0a0a0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.table-stats {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
	}

	.table-type {
		background-color: rgba(121, 192, 255, 0.2);
		color: #79c0ff;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
	}

	.table-actions {
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

	.table-content {
		position: relative;
		background-color: rgba(0, 0, 0, 0.1);
		width: 100%;
		max-height: 400px;
		overflow: auto;
	}

	.table-content.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
	}

	.table-container {
		width: 100%;
		height: 100%;
		overflow: auto;
	}

	/* Native table styling */
	:global(.native-table) {
		width: 100%;
		border-collapse: collapse;
		color: #e5e5e5;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 13px;
		background-color: transparent;
	}

	:global(.native-table th) {
		padding: 8px 12px;
		text-align: left;
		border: 1px solid rgba(255, 255, 255, 0.1);
		font-weight: 600;
		background-color: rgba(0, 0, 0, 0.3);
		color: #ffffff;
		position: sticky;
		top: 0;
		z-index: 1;
	}

	:global(.native-table td) {
		padding: 8px 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #ffffff;
		background-color: rgba(0, 0, 0, 0.1);
	}

	:global(.native-table tbody tr:nth-child(even)) {
		background-color: rgba(255, 255, 255, 0.02);
	}

	:global(.native-table tbody tr:nth-child(odd)) {
		background-color: rgba(0, 0, 0, 0.1);
	}

	:global(.native-table tbody tr:hover) {
		background-color: rgba(255, 255, 255, 0.05);
	}

	:global(.native-table tbody tr:nth-child(even) td) {
		background-color: inherit;
	}

	:global(.native-table tbody tr:nth-child(odd) td) {
		background-color: inherit;
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

	/* Scrollbar styling */
	.table-content::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.table-content::-webkit-scrollbar-track {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.table-content::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.table-content::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.5);
	}
</style>