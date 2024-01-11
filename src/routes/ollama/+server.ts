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
	/* 
	/api/generate
    /api/chat
    /api/create
    /api/show
    /api/copy
    /api/pull */

	return req
		.fetch(`http;//127.0.0.1:11434/${req.params.api}`, {
			body: JSON.stringify(req),
			headers: req.request.headers,
			method: 'POST'
		})
		.then((res) => {
			return res.json();
		});
};

export const DELETE: RequestHandler = async () => {
	// /api/delete
	return new Response();
};

/** @type {import('./$types').RequestHandler} */
export async function fallback({ request }) {
	return text(`I caught your ${request.method} request!`);
}
