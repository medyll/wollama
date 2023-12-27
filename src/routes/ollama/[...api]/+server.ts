import { get } from 'http';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (req) => {
	// /api/tags
	// console.log('req')
	return new Response(JSON.stringify(req));
};

export const POST: RequestHandler = async (req) => {
	/* /api/generate
    /api/chat

    /api/create
    /api/show
    /api/copy
    /api/pull */

	return new Response();
	/* return fetch(`${config.ollama_server}/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/event-stream',
				...getHeader()
			},
			body: JSON.stringify(defaultOptions)
		});; */
};

export const DELETE: RequestHandler = async () => {
	// /api/delete
	return new Response();
};
