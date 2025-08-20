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
	let chatHistory = $state<string[]>([]);
	let messagesContainer: HTMLDivElement;
	let renderingStrategy = 'stream-finish'; // Fixed strategy

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
	function newChat() {
		// Add current conversation to history if it has content
		if (messages.length > 1) { // More than just the initial message
			const lastUserMessage = messages.filter(m => m.sender === 'user').pop();
			if (lastUserMessage) {
				// Extract first few words for history title
				const historyTitle = lastUserMessage.text.length > 30 
					? lastUserMessage.text.substring(0, 30) + '...' 
					: lastUserMessage.text;
				chatHistory = [historyTitle, ...chatHistory];
			}
		}
		
		// Reset to initial state
		messages = [
			{ id: 1, text: "Hello! How can I help you today? I can render **markdown**, `code blocks`, mathematical formulas like $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$, and even Mermaid diagrams!", sender: 'ai' }
		];
		inputText = '';
	}

	async function loadTestContent() {
		try {
			const response = await fetch('/src/mock/resp_1.md');
			const testContent = await response.text();
			
			messages = [
				...messages,
				{ id: messages.length + 1, text: "Loading test content with multiple renderers...", sender: 'user' },
				{ id: messages.length + 2, text: testContent, sender: 'ai' }
			];
		} catch (error) {
			console.error('Failed to load test content:', error);
			messages = [
				...messages,
				{ id: messages.length + 1, text: "Load test content", sender: 'user' },
				{ id: messages.length + 2, text: "Failed to load test content. Here's a sample instead:\n\n```timeline\n[\n  {\n    \"id\": 1,\n    \"content\": \"Project Started\",\n    \"start\": \"2024-01-01\",\n    \"type\": \"point\"\n  }\n]\n```\n\n```chart\n{\n    \"type\": \"bar\",\n    \"data\": {\n        \"labels\": [\"Jan\", \"Feb\", \"Mar\"],\n        \"datasets\": [{ \"label\": \"Sales\", \"data\": [12, 19, 3] }]\n    }\n}\n```", sender: 'ai' }
			];
		}
	}


	async function sendMessage(event: SubmitEvent) {
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

		// Add empty AI message that will be filled by streaming
		const aiMessageId = Date.now() + 1;
		messages = [
			...messages,
			{ id: aiMessageId, text: '', sender: 'ai' }
		];

		try {
			// Start streaming response
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ 
					message: userInput,
					model: 'llama3.2'
				})
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			// Handle Server-Sent Events streaming
			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('No response body');
			}

			const decoder = new TextDecoder();
			let buffer = '';

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					// Decode chunk and add to buffer
					buffer += decoder.decode(value, { stream: true });
					
					// Process complete lines
					const lines = buffer.split('\n');
					buffer = lines.pop() || ''; // Keep incomplete line in buffer

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							try {
								const data = JSON.parse(line.slice(6));
								
								if (data.error) {
									console.error('Stream error:', data.error);
									continue;
								}
								
								if (data.done) {
									// Stream finished
									break;
								}
								
								if (data.content) {
									// Update the AI message with new content
									messages = messages.map(msg => 
										msg.id === aiMessageId 
											? { ...msg, text: msg.text + data.content }
											: msg
									);
								}
							} catch (e) {
								console.error('Error parsing SSE data:', e);
							}
						}
					}
				}
			} finally {
				reader.releaseLock();
			}

		} catch (error) {
			console.error('Failed to get AI response:', error);
			
			// Update the AI message with error
			messages = messages.map(msg => 
				msg.id === aiMessageId 
					? { ...msg, text: 'Sorry, I encountered an error. Please try again.' }
					: msg
			);
		}
	}
</script>

<!-- ChatGPT-like UI -->
<div class="chat-container">
	<!-- Sidebar -->
	<aside class="sidebar">
		<button class="new-chat-btn" onclick={newChat}>+ New Chat</button>
		<div class="chat-history">
			{#if chatHistory.length === 0}
				<div class="no-history">
					<p>Your chat history will appear here.</p>
					<div class="demo-help">
						<small><strong>Try these:</strong></small>
						<small>• Send "1" for mixed content demo</small>
						<small>• Send "2" for math formulas</small>
						<small>• Send "5" for presentations</small>
						<small>• Send "6" for PDF documents</small>
						<small>• Send "7" for files & URLs</small>
						<small>• Send any text for real AI chat</small>
					</div>
				</div>
			{:else}
				{#each chatHistory as chat}
					<div class="history-item">{chat}</div>
				{/each}
			{/if}
		</div>
	</aside>

	<!-- Main Chat -->
	<main class="main-chat">
		<!-- Rendering Strategy Control -->
		<div class="strategy-control">
			<label>
				<strong>Rendering Strategy:</strong>
				<select bind:value={renderingStrategy}>
					<option value="stream-finish">Stream Finish (Wait for complete)</option>
					<option value="realtime">Realtime (Render as typing)</option>
				</select>
			</label>
			<button onclick={loadTestContent} class="test-button">
				Load Test Content
			</button>
		</div>

		<!-- Messages -->
		<div class="messages" bind:this={messagesContainer}>
			{#each messages as msg}
				<MessageRenderer content={msg.text} sender={msg.sender} {renderingStrategy} />
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

<style>
	.no-history {
		padding: 1rem;
		text-align: center;
		color: #888;
	}

	.no-history p {
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.demo-help {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 6px;
		border-left: 3px solid #0b69a3;
	}

	.demo-help small {
		font-size: 0.75rem;
		line-height: 1.4;
		color: #aaa;
	}

	.demo-help strong {
		color: #fff;
	}

	.strategy-control {
		padding: 0.5rem 1rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.strategy-control label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.strategy-control select {
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}

	.test-button {
		background-color: #0b69a3;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
		cursor: pointer;
		margin-left: auto;
	}

	.test-button:hover {
		background-color: #0958a3;
	}
</style>