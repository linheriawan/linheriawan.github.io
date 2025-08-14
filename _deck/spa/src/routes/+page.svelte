<script>
	let messages = [
		{ id: 1, text: "Hello! How can I help you today?", sender: 'ai' }
	];
	let inputText = '';
	let chatHistory = ['New Chat', 'Yesterday: Summarize article', 'Last week: Fix code bug'];

	function sendMessage() {
		if (!inputText.trim()) return;

		// Add user message
		messages = [
			...messages,
			{ id: Date.now(), text: inputText, sender: 'user' }
		];

		// Simulate AI response
		setTimeout(() => {
			messages = [
				...messages,
				{
					id: Date.now(),
					text: `You said: "${inputText}". This is a mock response.`,
					sender: 'ai'
				}
			];
		}, 600);

		inputText = '';
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
		<div class="messages">
			{#each messages as msg}
				<div class={msg.sender === 'user' ? 'user-message' : 'ai-message'}>
					{msg.text}
				</div>
			{/each}
		</div>

		<!-- Input -->
		<form on:submit|preventDefault={sendMessage} class="input-form">
			<input
				bind:value={inputText}
				placeholder="Message ChatGPT..."
				class="input-field"
			/>
		</form>
	</main>
</div>

<style>
	.chat-container {
		display: flex;
		flex: 1;
		height: 100vh;
	}

	.sidebar {
		width: 260px;
		background-color: #202123;
		color: white;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.new-chat-btn {
		padding: 0.75rem;
		background-color: #343541;
		border: 1px solid #565869;
		color: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.history-item {
		padding: 0.75rem;
		font-size: 14px;
		color: #e5e5e5;
		cursor: pointer;
		border-radius: 6px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.history-item:hover {
		background-color: #343541;
	}

	.main-chat {
		flex: 1;
		display: flex;
		flex-direction: column;
		background-color: #343541;
		color: white;
		overflow: hidden;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.user-message, .ai-message {
		max-width: 80%;
		padding: 0.8rem 1rem;
		border-radius: 8px;
		line-height: 1.5;
	}

	.user-message {
		align-self: end;
		background-color: #0b69a3;
		color: white;
	}

	.ai-message {
		align-self: start;
		background-color: #444654;
		color: white;
	}

	.input-form {
		padding: 1rem;
		display: flex;
	}

	.input-field {
		flex: 1;
		padding: 0.8rem 1rem;
		border: 1px solid #565869;
		border-radius: 8px;
		background-color: #40414f;
		color: white;
		font-size: 16px;
		outline: none;
	}

	.input-field::placeholder {
		color: #b0b0b0;
	}
</style>