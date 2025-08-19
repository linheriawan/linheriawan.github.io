import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import fs from 'fs/promises';
import path from 'path';

// Mock responses mapped by number
const MOCK_RESPONSES = {
	'1': 'resp_1.md',      // Mixed content
	'2': 'resp_2_math.md', // Math formulas
	'3': 'resp_3_images.md', // Image gallery
	'4': 'resp_4_tables.md', // Data tables
	'5': 'resp_5_presentations.md', // Presentations
	'6': 'resp_6_pdfs.md', // PDF documents
	'7': 'resp_7_files.md', // File downloads
	'8': 'resp_8_urls.md'  // URL previews
};

async function getMockResponse(messageContent) {
	try {
		const message = messageContent.trim();
		
		// Check if message is a number 1-8
		let mockFile;
		if (MOCK_RESPONSES[message]) {
			mockFile = MOCK_RESPONSES[message];
		} else {
			// Default to mixed content for non-number messages (shouldn't reach here in practice)
			mockFile = MOCK_RESPONSES['1'];
		}
		
		const mockPath = path.join(process.cwd(), 'src', 'mock', mockFile);
		const mockContent = await fs.readFile(mockPath, 'utf-8');
		return mockContent;
	} catch (error) {
		console.error('Failed to load mock response:', error);
		return `I can render various types of content including:\n\n- **Timeline** visualizations\n- **Audio/Video** players\n- **Code** with syntax highlighting\n- **Charts** and graphs\n- **Mermaid** diagrams\n- **Math** formulas\n- And much more!`;
	}
}

async function callOpenAI(message) {
	if (!OPENAI_API_KEY) {
		throw new Error('OpenAI API key not configured');
	}

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model: 'gpt-3.5-turbo',
			messages: [{ role: 'user', content: message }]
		})
	});

	const data = await response.json();

	if (data.choices && data.choices.length > 0) {
		return data.choices[0].message.content;
	}
	
	throw new Error('No response from OpenAI');
}

async function* streamOllama(message, model = 'llama3.2') {
	// Default Ollama API endpoint (can be configured via env var)
	const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
	
	const response = await fetch(`${ollamaUrl}/api/generate`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: model,
			prompt: message,
			stream: true
		})
	});

	if (!response.body) {
		throw new Error('No response body from Ollama');
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			
			const chunk = decoder.decode(value);
			const lines = chunk.split('\n').filter(line => line.trim());
			
			for (const line of lines) {
				try {
					const data = JSON.parse(line);
					if (data.response) {
						yield data.response;
					}
				} catch (e) {
					// Ignore invalid JSON lines
					continue;
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

async function* streamMockResponse(content) {
	// Stream mock content word by word to simulate real AI streaming
	const words = content.split(' ');
	
	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		const isLast = i === words.length - 1;
		
		// Add space after word unless it's the last word
		yield word + (isLast ? '' : ' ');
		
		// Simulate typing delay
		await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
	}
}

export async function POST({ request, url }) {
	try {
		const { message, model = 'llama3.2' } = await request.json();

		// Check if message is a number (1-8) for mock responses
		const messageStr = message.toString().trim();
		const isMockNumber = /^[1-8]$/.test(messageStr);
		
		// Set up streaming response
		const stream = new ReadableStream({
			async start(controller) {
				try {
					if (isMockNumber) {
						// Stream mock response for numbers 1-8
						const mockContent = await getMockResponse(messageStr);
						
						for await (const chunk of streamMockResponse(mockContent)) {
							const data = JSON.stringify({ content: chunk });
							controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
						}
					} else {
						// Stream real Ollama response for other messages
						for await (const chunk of streamOllama(message, model)) {
							const data = JSON.stringify({ content: chunk });
							controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
						}
					}
					
					// Signal end of stream
					const endData = JSON.stringify({ done: true });
					controller.enqueue(new TextEncoder().encode(`data: ${endData}\n\n`));
					
				} catch (error) {
					console.error('Streaming error:', error);
					
					// Send error and fallback to mock
					const errorData = JSON.stringify({ 
						error: error.message,
						fallback: true
					});
					controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
					
					// Try to stream a fallback mock response
					try {
						const fallbackContent = await getMockResponse('1'); // Default mixed content
						for await (const chunk of streamMockResponse(fallbackContent)) {
							const data = JSON.stringify({ content: chunk });
							controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
						}
						
						const endData = JSON.stringify({ done: true });
						controller.enqueue(new TextEncoder().encode(`data: ${endData}\n\n`));
					} catch (fallbackError) {
						const finalErrorData = JSON.stringify({ 
							error: 'Service temporarily unavailable',
							done: true
						});
						controller.enqueue(new TextEncoder().encode(`data: ${finalErrorData}\n\n`));
					}
				} finally {
					controller.close();
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive'
			}
		});

	} catch (error) {
		console.error('Chat API initialization error:', error);
		return json({ 
			error: 'Failed to initialize chat stream',
			details: error.message 
		}, { status: 500 });
	}
}