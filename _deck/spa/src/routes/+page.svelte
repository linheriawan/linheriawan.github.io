<script lang="ts">
	import MessageRenderer from '$lib/components/MessageRenderer.svelte';

	interface Message {
		id: number;
		text: string;
		sender: 'user' | 'ai';
	}

	let messages = $state<Message[]>([
		{ id: 1, text: "Hello! How can I help you today? I can render **markdown**, `code blocks`, mathematical formulas like $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$, and even Mermaid diagrams!", sender: 'ai' }
	]);
	let inputText = $state('');
	let chatHistory = $state([
		'Enhanced Image Gallery',
		'Mixed Content Demo',
		'Photo Gallery Test',
		'Math Formulas',
		'Code Blocks',
		'JSON Viewer Demo',
		'XML Viewer Demo',
		'Mermaid Diagrams',
		'Pie Charts',
		'Line Charts',
		'Presentations',
		'PDF Viewer Demo',
		'Video Player Demo',
		'Audio Player Demo',
		'Timeline Viz Demo',
		'Table CSV Data (TBF)',
		'Advanced Table Data (TBF)',
		'URL Preview Demo',
		'File Renderer Demo',
	]);
	let messagesContainer: HTMLDivElement;

	// Auto-scroll to bottom function
	function scrollToBottom() {
		if (messagesContainer) {
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 100);
		}
	}

	// Auto-scroll when messages change
	$effect(() => {
		messages; // Subscribe to messages changes
		scrollToBottom();
	});
	function preview(event: Event) {
		const target = event.target as HTMLElement;
		const historyText = target.textContent || '';
		
		// Map history items to keywords that trigger the sendMessage logic
		const keywordMap: Record<string, string> = {
			'Enhanced Image Gallery': 'Show me image gallery', // Will trigger image URL response
			'Table CSV Data': 'Show me table data', // Will trigger table response
			'Advanced Table Data': 'Show me advanced table data', // Will trigger table response
			'Mixed Content Demo': 'Show me mixed content', // Will trigger mixed response
			'Photo Gallery Test': 'Show me photo gallery', // Will trigger image URL response
			'Math Formulas': 'Show me math formulas', // Will trigger math response
			'Code Blocks': 'Show me code examples', // Will trigger code response
			'Mermaid Diagrams': 'Show me diagram flowcharts', // Will trigger diagram response
			'Pie Charts': 'Show me pie chart data', // Will trigger chart response
			'Line Charts': 'Show me line chart data', // Will trigger chart response
			'Presentations': 'Show me marp presentation', // Will trigger presentation response
			'PDF Viewer Demo': 'Show me pdf document', // Will trigger PDF responsoke
			'Video Player Demo': 'Show me video player', // Will trigger video response
			'Audio Player Demo': 'Show me audio player', // Will trigger audio response
			'Timeline Viz Demo': 'Show me timeline visualization', // Will trigger timeline response
			'URL Preview Demo': 'Show me url preview', // Will trigger URL preview response
			'File Renderer Demo': 'Show me file download', // Will trigger file response
			'JSON Viewer Demo': 'Show me json data', // Will trigger JSON response
			'XML Viewer Demo': 'Show me xml data' // Will trigger XML response
		};
		
		// Handle TBA and TBS items
		if (historyText.includes('(TBA)') || historyText.includes('(TBF)')) {
			inputText = historyText.replace(' (TBA)', '').replace(' (TBF)', '');
			const fakeEvent = new Event('submit') as SubmitEvent;
			fakeEvent.preventDefault = () => {};
			sendMessage(fakeEvent);
			return;
		}

		const keyword = keywordMap[historyText];
		if (keyword) {
			inputText = keyword;
			const fakeEvent = new Event('submit') as SubmitEvent;
			fakeEvent.preventDefault = () => {};
			sendMessage(fakeEvent);
		} else {
			// Fallback for unknown items
			inputText = historyText;
			const fakeEvent = new Event('submit') as SubmitEvent;
			fakeEvent.preventDefault = () => {};
			sendMessage(fakeEvent);
		}
	}
	function sendMessage(event: SubmitEvent) {
		event.preventDefault();
		if (!inputText.trim()) return;

		// Store the input text before clearing it
		const userInput = inputText;

		// Add user message
		messages = [
			...messages,
			{ id: Date.now(), text: userInput, sender: 'user' }
		];

		// Clear input immediately
		inputText = '';

		// Simulate AI response with sample content
		setTimeout(() => {
			let response = '';
			
			// Handle direct image URLs
			if (/^https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?[^\s]*)?$/i.test(userInput.trim())) {
				response = userInput; // Direct image URL - let ImageRenderer handle it
			}
			// Handle table data (CSV format)
			else if (userInput.includes('\n') && (userInput.includes(',') || userInput.includes('\t'))) {
				response = `Here's your table data:\n\n${userInput}`;
			}
			// Handle keyword-based responses
			else {
				response = `You said: "${userInput}".`;
				
				if (userInput.toLowerCase().includes('table') || userInput.toLowerCase().includes('csv')) {
					if (userInput.toLowerCase().includes('advanced')) {
						response = `\`\`\`csv
name,age,city,salary,department,hire_date
John Doe,30,New York,75000,Engineering,2022-01-15
Jane Smith,25,San Francisco,85000,Product,2023-03-20
Bob Johnson,35,Chicago,65000,Sales,2021-11-08
Alice Brown,28,Seattle,80000,Marketing,2022-09-12
Charlie Wilson,42,Austin,95000,Engineering,2020-05-25
Diana Lee,31,Portland,70000,Design,2023-01-30
\`\`\``;
					}else {
						response = `\`\`\`csv
Product,Price,Stock
Laptop,"$1299",15
Mouse,"$25",150
Keyboard,"$89",75
\`\`\``;
					}
				} else if (userInput.toLowerCase().includes('image') || userInput.toLowerCase().includes('gallery') || userInput.toLowerCase().includes('photo')) {
					response = userInput.toLowerCase().includes('gallery') ? `\`\`\`image
https://picsum.photos/800/600?random=1
\`\`\`` : `\`\`\`image
https://picsum.photos/600/400?random=2
\`\`\``;
				} else if (userInput.toLowerCase().includes('pdf') ) {
					response = `\`\`\`pdf
https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf
\`\`\``;
				} else if (userInput.toLowerCase().includes('timeline') ) {
					response = `\`\`\`timeline
{
  "title": "Project Development Timeline",
  "items": [
    {
      "id": 1,
      "content": "Project Kickoff",
      "start": "2024-01-15",
      "type": "point",
      "className": "milestone"
    },
    {
      "id": 2,
      "content": "Requirements Gathering",
      "start": "2024-01-16",
      "end": "2024-01-30",
      "type": "range",
      "className": "planning"
    },
    {
      "id": 3,
      "content": "UI/UX Design Phase",
      "start": "2024-02-01",
      "end": "2024-02-20",
      "type": "range",
      "className": "design-phase"
    },
    {
      "id": 4,
      "content": "Frontend Development",
      "start": "2024-02-21",
      "end": "2024-04-15",
      "type": "range",
      "className": "development"
    },
    {
      "id": 5,
      "content": "Backend Development",
      "start": "2024-03-01",
      "end": "2024-04-30",
      "type": "range",
      "className": "development"
    },
    {
      "id": 6,
      "content": "Integration Testing",
      "start": "2024-05-01",
      "end": "2024-05-15",
      "type": "range",
      "className": "testing"
    },
    {
      "id": 7,
      "content": "User Acceptance Testing",
      "start": "2024-05-16",
      "end": "2024-05-30",
      "type": "range",
      "className": "testing"
    },
    {
      "id": 8,
      "content": "Production Deployment",
      "start": "2024-06-01",
      "type": "point",
      "className": "milestone"
    },
    {
      "id": 9,
      "content": "Post-Launch Monitoring",
      "start": "2024-06-02",
      "end": "2024-06-16",
      "type": "range",
      "className": "monitoring"
    }
  ]
}
\`\`\``;
				} else if (userInput.toLowerCase().includes('video')) {
					response = `\`\`\`video
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
\`\`\``;
				} else if (userInput.toLowerCase().includes('audio') ) {
					response = `\`\`\`audio
https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3
\`\`\``;
				} else if (userInput.toLowerCase().includes('url') || userInput.toLowerCase().includes('preview') || userInput.toLowerCase().includes('website')) {
					response = `\`\`\`url
https://github.com/anthropics/claude-code
\`\`\``;
				} else if (userInput.toLowerCase().includes('file') || userInput.toLowerCase().includes('download')) {
					response = `\`\`\`file
https://example.com/sample-document.pdf
\`\`\``;
				} else if (userInput.toLowerCase().includes('json')) {
					response = `\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "developer",
      "active": true,
      "projects": ["web-app", "mobile-app"]
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "designer",
      "active": true,
      "projects": ["design-system"]
    }
  ],
  "total": 2,
  "status": "success"
}
\`\`\``;
				} else if (userInput.toLowerCase().includes('xml')) {
					response = `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="1">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <genre>Fiction</genre>
    <price currency="USD">12.99</price>
    <published>1925</published>
    <available>true</available>
  </book>
  <book id="2">
    <title>To Kill a Mockingbird</title>
    <author>Harper Lee</author>
    <genre>Fiction</genre>
    <price currency="USD">14.99</price>
    <published>1960</published>
    <available>false</available>
  </book>
</catalog>
\`\`\``;
				} else if (userInput.toLowerCase().includes('math')) {
					response += '\n\nHere\'s a mathematical formula: $$E = mc^2$$\n\nAnd inline math: $\\pi = 3.14159...$';
				} else if (userInput.toLowerCase().includes('code')) {
					response += '\n\nHere\'s some code:\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```';
				} else if (userInput.toLowerCase().includes('diagram')) {
					response += '\n\nHere\'s a Mermaid diagram:\n```mermaid\ngraph TD\n    A[Start] --> B{Is it working?}\n    B -->|Yes| C[Great!]\n    B -->|No| D[Debug it]\n    D --> A\n```';
				} else if (userInput.toLowerCase().includes('chart')) {
					if (userInput.toLowerCase().includes('pie')) {
					response += '\n\nHere\'s a pie chart:\n```chart\n{\n  "type": "pie",\n  "data": {\n    "labels": ["Red", "Blue", "Yellow", "Green", "Purple"],\n    "datasets": [{\n      "data": [12, 19, 3, 5, 2],\n      "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]\n    }]\n  }\n}\n```';
				} else if (userInput.toLowerCase().includes('line')) {
					response += '\n\nHere\'s a line chart:\n```chart\n{\n  "type": "line",\n  "data": {\n    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],\n    "datasets": [{\n      "label": "Revenue",\n      "data": [12, 19, 3, 17, 28, 24],\n      "borderColor": "#36A2EB",\n      "tension": 0.4\n    }]\n  }\n}\n```';
				} else if (userInput.toLowerCase().includes('simple')) {
					response += '\n\nHere\'s a simple chart format:\n```chart\ntype: bar\nJan: 65\nFeb: 59\nMar: 90\nApr: 81\nMay: 56\n```';
				} else {
					response += '\n\nHere\'s a bar chart:\n```chart\n{\n  "type": "bar",\n  "data": {\n    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],\n    "datasets": [{\n      "label": "Sales",\n      "data": [12, 19, 3, 5, 2],\n      "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]\n    }]\n  }\n}\n```';
				}
				} else if (userInput.toLowerCase().includes('presentation') || userInput.toLowerCase().includes('marp')) {
					response += '\n\nHere\'s a Marp presentation:\n```marp\n---\nmarp: true\ntheme: default\npaginate: true\n---\n\n# Slide 1: Welcome\nThis is the first slide of the presentation.\n\n---\n\n# Slide 2: Features\n- **Math support**: $E = mc^2$\n- **Code blocks**\n- **Images and diagrams**\n\n---\n\n# Slide 3: Thank You\nEnd of presentation!\n```';
				} else if (userInput.toLowerCase().includes('mixed') || userInput.toLowerCase().includes('both')) {
					response += '\n\nHere\'s mixed content with both math and a diagram:\n\nFirst, a mathematical formula: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$\n\nAnd here\'s a Mermaid diagram:\n```mermaid\ngraph LR\n    A[Math Formula] --> B{Process}\n    B --> C[Beautiful Result]\n    C --> D[Success!]\n```\n\nBoth rendered in the same message!';
				} else if (userInput.toLowerCase().includes('coming soon') || userInput.toLowerCase().includes('tba') || userInput.toLowerCase().includes('tbs')) {
					if (userInput.toLowerCase().includes('tbs')) {
						response += '\n\n🚧 **This feature has implementation issues (To Be Stabilized)** 🚧\n\nCurrently implemented features:\n- ✅ **Enhanced Image Gallery** with PhotoSwipe\n- ✅ **Timeline Visualization** with vis-timeline\n- ✅ **Video/Audio Player** with video.js\n- ✅ **URL Preview** with metadata extraction\n- ✅ **File Renderer** with type detection\n- ✅ **Math Formulas** with KaTeX\n- ✅ **Code Highlighting** with highlight.js\n- ✅ **Mermaid Diagrams**\n- ✅ **Charts** (pie, line, bar)\n- ✅ **Presentations** with Marp\n\n**To Be Stabilized (TBS):**\n- 🔧 **Advanced Table Data** (ag-grid rendering issues)\n- 🔧 **PDF Viewer** (worker configuration issues)';
					} else {
						response += '\n\n🎉 **All planned features are now implemented!** 🎉\n\nCurrently implemented features:\n- ✅ **Enhanced Image Gallery** with PhotoSwipe\n- ✅ **Timeline Visualization** with vis-timeline\n- ✅ **Video/Audio Player** with video.js\n- ✅ **URL Preview** with metadata extraction\n- ✅ **File Renderer** with type detection\n- ✅ **Math Formulas** with KaTeX\n- ✅ **Code Highlighting** with highlight.js\n- ✅ **Mermaid Diagrams**\n- ✅ **Charts** (pie, line, bar)\n- ✅ **Presentations** with Marp\n\n**To Be Stabilized (TBS):**\n- 🔧 **Advanced Table Data** (ag-grid rendering issues)\n- 🔧 **PDF Viewer** (worker configuration issues)';
					}
				} else {
					response += '\n\nI can help you with:\n- **Markdown** formatting\n- `Code` highlighting\n- Mathematical formulas\n- Mermaid diagrams\n- **Charts**: "chart", "pie chart", "line chart", "simple chart"\n- **Presentations** (try "marp" or "presentation")\n- Mixed content (try "both" or "mixed")\n- Images and more!';
				}
			}
			
			messages = [
				...messages,
				{
					id: Date.now(),
					text: response,
					sender: 'ai'
				}
			];
		}, 600);
	}
</script>

<!-- ChatGPT-like UI -->
<div class="chat-container">
	<!-- Sidebar -->
	<aside class="sidebar">
		<button class="new-chat-btn">+ New Chat</button>
		<div class="chat-history">
			{#each chatHistory as chat}
				<div class="history-item" class:tba={chat.includes('(TBA)')} onclick={preview}>{chat}</div>
			{/each}
		</div>
	</aside>

	<!-- Main Chat -->
	<main class="main-chat">
		<!-- Messages -->
		<div class="messages" bind:this={messagesContainer}>
			{#each messages as msg}
				<MessageRenderer content={msg.text} sender={msg.sender} />
			{/each}
		</div>

		<!-- Input -->
		<form onsubmit={sendMessage} class="input-form">
			<input
				bind:value={inputText}
				placeholder="Message..."
				class="input-field"
			/>
		</form>
	</main>
</div>