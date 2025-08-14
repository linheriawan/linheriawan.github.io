import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	const { message } = await request.json();

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
		return json({ reply: data.choices[0].message.content });
	}

	return json({ error: 'Failed to get response' }, { status: 500 });
}