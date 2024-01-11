import type { RequestHandler } from './$types';
import { error, json, text } from '@sveltejs/kit';

export const GET: RequestHandler = async (req) => {
	const res = await req
		.fetch(`http://127.0.0.1:11434/${req.params.api}`)
		.then((res) => res.json())
		.catch((err) => {
			return error(err);
		});

	return json(res);
};

export const POST: RequestHandler = async (req) => {
	const body = await req.request.json();

	const response = await req.fetch(`http://127.0.0.1:11434/${req.params.api}`, {
		body: JSON.stringify(body),
		headers: req.request.headers,
		method: 'POST'
	});

	if (!response.ok) {
		return new Response(null, { status: response.status, body: await response.text() });
	}

	return new Response(response.body, {
		status: response.status,
		headers: {
			'Content-Type': 'application/octet-stream'
		}
	});
};

export const DELETE: RequestHandler = async (req) => {
	const body = await req.request.json();
	// /api/delete
	const response = await req.fetch(`http://127.0.0.1:11434/${req.params.api}`, {
		body: JSON.stringify(body),
		headers: req.request.headers,
		method: 'POST'
	});

	if (!response.ok) {
		return new Response(null, { status: response.status, body: await response.text() });
	}

	return new Response(response.body, {
		status: response.status,
		headers: {
			'Content-Type': 'application/octet-stream'
		}
	});
};

/** @type {import('./$types').RequestHandler} */
export async function fallback({ request }) {
	return text(`I caught your ${request.method} request!`);
}
