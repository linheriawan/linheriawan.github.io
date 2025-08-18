<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();
	let gridContainer: HTMLDivElement;
	let gridApi: any = null;
	let isLoading = $state<boolean>(true);
	let hasError = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let tableData = $state<{
		columnDefs: any[];
		rowData: any[];
		totalRows: number;
		hasHeaders: boolean;
	}>({
		columnDefs: [],
		rowData: [],
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
		console.log('Parsing table content:', content);
		try {
			// Try JSON first (chart data might be tables)
			if (content.startsWith('{') || content.startsWith('[')) {
				const jsonData = JSON.parse(content);
				
				if (Array.isArray(jsonData)) {
					// Array of objects
					if (jsonData.length > 0 && typeof jsonData[0] === 'object') {
						const columns = Object.keys(jsonData[0]).map(key => ({
							headerName: key.charAt(0).toUpperCase() + key.slice(1),
							field: key,
							sortable: true,
							filter: true,
							resizable: true,
							width: 150
						}));
						
						return {
							columnDefs: columns,
							rowData: jsonData,
							totalRows: jsonData.length,
							hasHeaders: true
						};
					}
				} else if (jsonData.data && Array.isArray(jsonData.data)) {
					// Chart.js format with data
					const data = jsonData.data;
					if (data.length > 0 && typeof data[0] === 'object') {
						const columns = Object.keys(data[0]).map(key => ({
							headerName: key.charAt(0).toUpperCase() + key.slice(1),
							field: key,
							sortable: true,
							filter: true,
							resizable: true,
							width: 150
						}));
						
						return {
							columnDefs: columns,
							rowData: data,
							totalRows: data.length,
							hasHeaders: true
						};
					}
				}
			}

			// Parse CSV/TSV format
			console.log('Parsing as CSV/TSV...');
			const lines = content.split('\n').filter(line => line.trim());
			console.log('Lines found:', lines.length, lines);
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

			console.log('Parsed rows:', rows);
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

			// Create column definitions
			const numCols = rows[0].length;
			const columnDefs = [];

			for (let i = 0; i < numCols; i++) {
				const headerName = hasHeaders && headerRowIndex >= 0 
					? rows[headerRowIndex][i] || `Column ${i + 1}`
					: `Column ${i + 1}`;
				
				columnDefs.push({
					headerName: headerName,
					field: `col${i}`,
					sortable: true,
					filter: true,
					resizable: true,
					width: 150,
					// Auto-detect number columns for better sorting
					type: 'text'
				});
			}

			// Create row data
			const dataRows = rows.slice(dataStartIndex);
			const rowData = dataRows.map((row, index) => {
				const rowObj: any = { id: index };
				for (let i = 0; i < numCols; i++) {
					const value = row[i] || '';
					rowObj[`col${i}`] = value;
					
					// Try to detect numeric columns for better UX
					if (!isNaN(Number(value)) && value !== '') {
						if (!columnDefs[i].type || columnDefs[i].type === 'text') {
							columnDefs[i].type = 'numericColumn';
							columnDefs[i].width = 120;
						}
					}
				}
				return rowObj;
			});

			const result = {
				columnDefs,
				rowData,
				totalRows: rowData.length,
				hasHeaders
			};
			console.log('Final table result:', result);
			return result;

		} catch (error: any) {
			console.error('Table parsing error:', error);
			console.error('Failed to parse content:', text);
			throw new Error(`Failed to parse table data: ${error.message}`);
		}
	}

	async function initializeGrid() {
		if (!browser || !gridContainer) {
			console.log('Browser or gridContainer not available:', { browser, gridContainer });
			isLoading = false;
			return;
		}

		try {
			isLoading = true;
			hasError = false;
			
			// Clean up any existing content
			if (gridContainer) {
				gridContainer.innerHTML = '';
			}
			
			console.log('Initializing grid with container:', gridContainer);

			// Parse the content
			console.log('Content to parse:', JSON.stringify(content));
			tableData = parseTableContent(content);
			console.log('Parsed table data:', tableData);

			if (tableData.rowData.length === 0) {
				console.error('No rows found in parsed data!');
				throw new Error('No data rows found');
			}

			console.log('Table data is valid, proceeding with grid creation...');

			// Dynamic import ag-grid with module registration
			let createGrid;
			try {
				const agGrid = await import('ag-grid-community');
				console.log('ag-grid import:', agGrid);
				
				// Register all community modules
				const { ModuleRegistry, AllCommunityModule } = agGrid;
				if (ModuleRegistry && AllCommunityModule) {
					console.log('Registering AllCommunityModule...');
					ModuleRegistry.registerModules([AllCommunityModule]);
					console.log('AllCommunityModule registered successfully');
				} else {
					console.warn('ModuleRegistry or AllCommunityModule not found:', {
						ModuleRegistry: !!ModuleRegistry,
						AllCommunityModule: !!AllCommunityModule
					});
				}
				
				// Get createGrid function
				createGrid = agGrid.createGrid || agGrid.default?.createGrid;
				
				if (!createGrid) {
					console.error('createGrid not found in ag-grid import:', Object.keys(agGrid));
					throw new Error('createGrid function not found');
				}
				console.log('Found createGrid function:', typeof createGrid);
			} catch (importError) {
				console.error('Failed to import ag-grid:', importError);
				throw importError;
			}

			// Convert reactive state to plain objects to avoid proxy issues
			const plainColumnDefs = JSON.parse(JSON.stringify(tableData.columnDefs));
			const plainRowData = JSON.parse(JSON.stringify(tableData.rowData));
			
			// Grid options - use plain objects instead of reactive ones
			const gridOptions = {
				columnDefs: plainColumnDefs,
				rowData: plainRowData,
				defaultColDef: {
					sortable: true,
					filter: true,
					resizable: true,
					minWidth: 100,
					flex: 1
				},
				rowSelection: 'multiple',
				enableRangeSelection: true,
				enableCellTextSelection: true,
				ensureDomOrder: true,
				animateRows: true,
				// Pagination for large datasets
				pagination: tableData.totalRows > 100,
				paginationPageSize: 50,
				// Auto-size columns to fit content
				onGridReady: (params) => {
					console.log('Grid ready callback triggered', params);
					gridApi = params.api;
					setTimeout(() => {
						if (gridApi) {
							gridApi.sizeColumnsToFit();
						}
					}, 100);
				},
				onFirstDataRendered: (params) => {
					console.log('First data rendered callback triggered', params);
					if (params.api) {
						params.api.sizeColumnsToFit();
					}
				}
			};

			// Import ag-grid CSS - load both base and dark theme
			const agGridCss = document.createElement('link');
			agGridCss.rel = 'stylesheet';
			agGridCss.href = 'https://cdn.jsdelivr.net/npm/ag-grid-community@34.0.0/styles/ag-grid.css';
			if (!document.head.querySelector('link[href*="ag-grid.css"]')) {
				document.head.appendChild(agGridCss);
			}
			
			const agThemeCss = document.createElement('link');
			agThemeCss.rel = 'stylesheet';
			agThemeCss.href = 'https://cdn.jsdelivr.net/npm/ag-grid-community@34.0.0/styles/ag-theme-quartz.css';
			if (!document.head.querySelector('link[href*="ag-theme-quartz.css"]')) {
				document.head.appendChild(agThemeCss);
			}
			
			// Wait a moment for CSS to be available
			await new Promise(resolve => setTimeout(resolve, 200));

			// Create grid
			console.log('Creating grid with container dimensions:', {
				width: gridContainer.offsetWidth,
				height: gridContainer.offsetHeight,
				containerRect: gridContainer.getBoundingClientRect()
			});
			console.log('Creating grid with options:', gridOptions);
			
			// Ensure container has dimensions
			if (gridContainer.offsetHeight === 0) {
				gridContainer.style.height = '400px';
			}
			if (gridContainer.offsetWidth === 0) {
				gridContainer.style.width = '100%';
			}
			
			console.log('Calling createGrid with:', { 
				container: gridContainer, 
				optionsKeys: Object.keys(gridOptions),
				containerDimensions: {
					width: gridContainer.offsetWidth,
					height: gridContainer.offsetHeight
				}
			});
			
			const api = createGrid(gridContainer, gridOptions);
			console.log('Grid created, API result:', {
				api: api,
				type: typeof api,
				isNull: api === null,
				isUndefined: api === undefined,
				keys: api ? Object.keys(api) : 'N/A'
			});
			
			console.log('Grid container after creation:', {
				width: gridContainer.offsetWidth,
				height: gridContainer.offsetHeight,
				children: gridContainer.children.length,
				innerHTML: gridContainer.innerHTML.length > 0 ? 'Has content' : 'Empty'
			});
			
			// Store grid API reference (it should be set in onGridReady callback)
			if (api) {
				gridApi = api;
				console.log('Grid API stored from return value');
			} else {
				console.warn('createGrid returned', api, ', waiting for onGridReady callback');
			}
			
			// Force grid to refresh and size columns
			setTimeout(() => {
				if (gridApi) {
					console.log('Refreshing grid and sizing columns...');
					gridApi.refreshCells();
					gridApi.sizeColumnsToFit();
					
					// Also try manual column sizing
					const allColumnIds = tableData.columnDefs.map(col => col.field);
					gridApi.autoSizeColumns(allColumnIds);
				}
			}, 300);

		} catch (error: any) {
			console.error('Grid initialization error:', error);
			
			// First, try HTML table fallback with actual data
			console.log('Trying HTML table fallback with actual data...');
			try {
				createHtmlTable();
				return; // Exit successfully if HTML table works
			} catch (htmlError) {
				console.error('HTML table fallback failed:', htmlError);
			}
			
			// Fallback test with hardcoded data to verify grid works
			console.log('Trying fallback with test data...');
			try {
				const testData = {
					columnDefs: [
						{ headerName: 'Name', field: 'name', sortable: true, filter: true },
						{ headerName: 'Age', field: 'age', sortable: true, filter: true },
						{ headerName: 'City', field: 'city', sortable: true, filter: true }
					],
					rowData: [
						{ name: 'John', age: 30, city: 'New York' },
						{ name: 'Jane', age: 25, city: 'San Francisco' },
						{ name: 'Bob', age: 35, city: 'Chicago' }
					],
					totalRows: 3,
					hasHeaders: true
				};
				
				const testOptions = {
					columnDefs: testData.columnDefs,
					rowData: testData.rowData,
					defaultColDef: {
						sortable: true,
						filter: true,
						resizable: true,
						minWidth: 100,
						flex: 1
					}
				};
				
				await Promise.all([
					import('ag-grid-community/styles/ag-grid.css'),
					import('ag-grid-community/styles/ag-theme-alpine.css')
				]);
				
				const agGrid = await import('ag-grid-community');
				
				// Register modules for fallback test too
				const { ModuleRegistry, AllCommunityModule, createGrid } = agGrid;
				if (ModuleRegistry && AllCommunityModule) {
					ModuleRegistry.registerModules([AllCommunityModule]);
				}
				
				const testApi = createGrid(gridContainer, testOptions);
				gridApi = testApi;
				console.log('Fallback test grid created successfully!');
				
			} catch (fallbackError) {
				console.error('Even fallback failed:', fallbackError);
				
				// Last resort: try to create a simple HTML table
				console.log('Trying HTML table fallback...');
				try {
					createHtmlTable();
				} catch (htmlError) {
					console.error('HTML table fallback also failed:', htmlError);
					hasError = true;
					errorMessage = `AG-Grid failed: ${error.message}`;
				}
			}
		} finally {
			isLoading = false;
		}
	}

	function exportToCsv() {
		if (gridApi) {
			gridApi.exportDataAsCsv({
				fileName: 'table-data.csv'
			});
		}
	}

	function copyTableData() {
		if (gridApi) {
			// Get all data and convert to CSV format
			const allData = gridApi.getSelectedRows().length > 0 
				? gridApi.getSelectedRows() 
				: tableData.rowData;
			
			const csvContent = [
				// Headers
				tableData.columnDefs.map(col => col.headerName).join('\t'),
				// Data rows
				...allData.map(row => 
					tableData.columnDefs.map(col => row[col.field] || '').join('\t')
				)
			].join('\n');

			navigator.clipboard.writeText(csvContent).then(() => {
				console.log('Table data copied to clipboard');
			}).catch(err => {
				console.error('Failed to copy table data:', err);
			});
		}
	}

	function createHtmlTable() {
		console.log('Creating HTML table fallback...');
		if (!gridContainer || !tableData.rowData.length) return;
		
		// Create a simple HTML table as fallback
		const table = document.createElement('table');
		table.style.cssText = `
			width: 100%;
			border-collapse: collapse;
			color: #e5e5e5;
			font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
			font-size: 13px;
		`;
		
		// Create header
		const thead = document.createElement('thead');
		const headerRow = document.createElement('tr');
		headerRow.style.cssText = 'background-color: rgba(0, 0, 0, 0.3);';
		
		tableData.columnDefs.forEach(col => {
			const th = document.createElement('th');
			th.textContent = col.headerName;
			th.style.cssText = `
				padding: 8px 12px;
				text-align: left;
				border: 1px solid rgba(255, 255, 255, 0.1);
				font-weight: 600;
			`;
			headerRow.appendChild(th);
		});
		thead.appendChild(headerRow);
		table.appendChild(thead);
		
		// Create body
		const tbody = document.createElement('tbody');
		tableData.rowData.forEach((row, index) => {
			const tr = document.createElement('tr');
			if (index % 2 === 1) {
				tr.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
			}
			tr.style.cssText += 'transition: background-color 0.2s ease;';
			tr.onmouseover = () => tr.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
			tr.onmouseout = () => tr.style.backgroundColor = index % 2 === 1 ? 'rgba(255, 255, 255, 0.02)' : '';
			
			tableData.columnDefs.forEach(col => {
				const td = document.createElement('td');
				td.textContent = row[col.field] || '';
				td.style.cssText = `
					padding: 8px 12px;
					border: 1px solid rgba(255, 255, 255, 0.1);
				`;
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		});
		table.appendChild(tbody);
		
		// Clear container and add table
		gridContainer.innerHTML = '';
		gridContainer.appendChild(table);
		
		console.log('HTML table fallback created successfully');
	}


	// Use effect to initialize when container is available
	$effect(() => {
		console.log('Table effect triggered');
		console.log('Browser available:', browser);
		console.log('Grid container:', gridContainer);
		console.log('Content:', content);
		console.log('Already initialized:', initialized);
		
		if (browser && gridContainer && content && !initialized) {
			console.log('All conditions met, initializing table grid');
			initialized = true;
			initializeGrid();
		}
		
		// Cleanup on component destroy
		return () => {
			console.log('Table cleanup');
			if (gridApi) {
				gridApi.destroy();
				gridApi = null;
			}
			initialized = true;
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
			<button class="retry-button" onclick={() => { hasError = false; isLoading = true; initializeGrid(); }}>
				Retry
			</button>
		</div>
	{:else}
		<div class="table-header">
			<div class="table-info">
				{#if !isLoading}
					<span class="table-stats">
						{tableData.totalRows} rows × {tableData.columnDefs.length} columns
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
						onclick={exportToCsv}
						title="Export CSV"
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

		<div class="grid-container" class:loading={isLoading}>
			{#if isLoading}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<span>Loading table...</span>
				</div>
			{/if}
			
			<div 
				bind:this={gridContainer}
				class="ag-theme-quartz-dark grid-wrapper"
				class:hidden={isLoading}
			></div>
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
		max-height: 200px;
		min-width: 700px;
		max-width: 95vw;
	}
	:global(.ag-root.ag-layout-normal){max-height:150px;overflow: scroll !important;}
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

	.grid-container {
		position: relative;
		height: 300px;
		min-height: 350px;
		max-height: 70vh;
		background-color: rgba(0, 0, 0, 0.1);
		width: 100%;
		overflow: hidden;
	}

	.grid-container.loading {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.grid-wrapper {
		width: 100%;
		height: 100%;
		min-height: 300px;
		box-sizing: border-box;
	}

	.grid-wrapper.hidden {
		display: none;
	}

	/* Ag-Grid Dark Theme Customizations - Force dark theme */
	:global(.ag-theme-quartz-dark) {
		background-color: #1a1a1a !important;
		--ag-background-color: #1a1a1a !important;
		--ag-header-background-color: #2d2d2d !important;
		--ag-odd-row-background-color: #222222 !important;
		--ag-row-hover-color: #333333 !important;
		--ag-selected-row-background-color: rgba(11, 105, 163, 0.4) !important;
		--ag-border-color: #444444 !important;
		--ag-header-column-separator-color: #444444 !important;
		--ag-font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
		--ag-font-size: 13px !important;
		--ag-foreground-color: #ffffff !important;
		--ag-data-color: #ffffff !important;
		--ag-header-foreground-color: #ffffff !important;
		--ag-disabled-foreground-color: #888888 !important;
		--ag-input-border-color: #444444 !important;
		--ag-checkbox-background-color: #2d2d2d !important;
		--ag-control-panel-background-color: #1a1a1a !important;
		--ag-tooltip-background-color: #2d2d2d !important;
	}

	:global(.ag-theme-quartz-dark .ag-header-cell-label) {
		color: #ffffff !important;
		font-weight: 600 !important;
	}
	
	:global(.ag-theme-quartz-dark .ag-cell) {
		color: #ffffff !important;
		background-color: #1a1a1a !important;
		border-color: #444444 !important;
	}

	:global(.ag-theme-quartz-dark .ag-header-cell) {
		background-color: #2d2d2d !important;
		border-color: #444444 !important;
		color: #ffffff !important;
	}

	:global(.ag-theme-quartz-dark .ag-row) {
		background-color: #1a1a1a !important;
		border-color: #444444 !important;
	}

	:global(.ag-theme-quartz-dark .ag-row-selected) {
		background-color: rgba(11, 105, 163, 0.4) !important;
		border-color: #0b69a3 !important;
	}

	:global(.ag-theme-quartz-dark .ag-row-even) {
		background-color: #1a1a1a !important;
	}

	:global(.ag-theme-quartz-dark .ag-row-odd) {
		background-color: #222222 !important;
	}

	:global(.ag-theme-quartz-dark .ag-row:hover) {
		background-color: #333333 !important;
	}

	:global(.ag-theme-quartz-dark .ag-icon) {
		color: #ffffff !important;
	}

	/* Fix filter and menu icons */
	:global(.ag-theme-quartz-dark .ag-header-cell-menu-button) {
		color: #ffffff !important;
	}

	:global(.ag-theme-quartz-dark .ag-filter-toolpanel-search) {
		background-color: #2d2d2d !important;
		color: #ffffff !important;
		border-color: #444444 !important;
	}
	/* Force override any white backgrounds */
	:global(.ag-theme-quartz-dark .ag-root-wrapper) {
		background-color: #1a1a1a !important;
	}

	:global(.ag-theme-quartz-dark .ag-root) {
		background-color: #1a1a1a !important;
	}

	:global(.ag-theme-quartz-dark .ag-body-viewport) {
		background-color: #1a1a1a !important;
	}

	:global(.ag-theme-quartz-dark .ag-center-cols-container) {
		background-color: #1a1a1a !important;
	}

	/* Ensure all text is readable */
	:global(.ag-theme-quartz-dark .ag-cell-value) {
		color: #ffffff !important;
	}

	:global(.ag-theme-quartz-dark .ag-header-cell-text) {
		color: #ffffff !important;
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
</style>