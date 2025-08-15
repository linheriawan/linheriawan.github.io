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
	let chatHistory = $state(['New Chat', 'Yesterday: Summarize article', 'Last week: Fix code bug']);
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
			let response = `You said: "${userInput}".`;
			
			// Add sample content based on input keywords
			if (userInput.toLowerCase().includes('math')) {
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
			} else {
				response += '\n\nI can help you with:\n- **Markdown** formatting\n- `Code` highlighting\n- Mathematical formulas\n- Mermaid diagrams\n- **Charts**: "chart", "pie chart", "line chart", "simple chart"\n- **Presentations** (try "marp" or "presentation")\n- Mixed content (try "both" or "mixed")\n- Images and more!';
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
				<div class="history-item">{chat}</div>
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