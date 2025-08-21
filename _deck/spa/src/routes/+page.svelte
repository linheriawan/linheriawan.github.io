<script lang="ts">
	import MessageRenderer from '$lib/components/MessageRenderer.svelte';

	interface Message {
		id: number;
		text: string;
		sender: 'user' | 'ai';
	}

	let messages = $state<Message[]>([]);
	let inputText = $state('');
	let chatHistory = $state<string[]>([]);
	let messagesContainer: HTMLDivElement;

	// Auto-scroll to bottom function
	function scrollToBottom() {
		if (messagesContainer) {
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 100);
		}
	}

	// Simulate streaming for demo content
	async function simulateStreaming(content: string, messageId: number) {
		const words = content.split(' ');
		const chunkSize = Math.max(1, Math.floor(words.length / 20)); // Send ~5% of words per chunk
		
		for (let i = 0; i < words.length; i += chunkSize) {
			const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
			
			messages = messages.map(msg => 
				msg.id === messageId 
					? { ...msg, text: msg.text + chunk }
					: msg
			);
			
			// Realistic delay to simulate AI response speed
			await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
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
		messages = [];
		inputText = '';
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

		// Check for exact demo commands (only single digits)
		const demoCommands = ['1', '2', '3','4'];
		if (demoCommands.includes(userInput.trim()) && userInput.trim().length === 1) {
			const command = userInput.trim();
			const fileMap = {
				'1': '/src/mock/resp_1.md',
				'2': '/src/mock/resp_2.md', 
				'3': '/src/mock/resp_3.md',
				'4': '/src/mock/resp_4.md'
			};
			
			// Add empty AI message that will be filled by streaming
			const aiMessageId = Date.now() + 1;
			messages = [
				...messages,
				{ id: aiMessageId, text: '', sender: 'ai' }
			];
			
			try {
				const response = await fetch(fileMap[command]);
				const testContent = await response.text();
								
				// Simulate streaming by adding content in chunks
				await simulateStreaming(testContent, aiMessageId);
				return;
			} catch (error) {
				console.error('Failed to load test content:', error);
				messages = messages.map(msg => 
					msg.id === aiMessageId 
						? { ...msg, text: 'Failed to load demo content. Please check if the file exists.' }
						: msg
				);
				return;
			}
		}

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
						<small>Send "1" for mixed content demo</small>
						<small>Send "2" for Presentations and Math formulas</small>
						<small>Send "3" for PDF documents, File downloads and URL previews</small>
						<small>Send "4" for debugging small amount of renderer</small>
						<small>Send any text for real AI chat</small>
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

		<!-- Messages -->
		<div class="messages" bind:this={messagesContainer}>
			{#each messages as msg (msg.id)}
				{#key `${msg.id}-${Math.floor(msg.text.length / 100)}`}
					<MessageRenderer content={msg.text} sender={msg.sender} />
				{/key}
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

</style>