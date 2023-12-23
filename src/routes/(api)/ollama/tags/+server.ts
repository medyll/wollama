import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({request,fetch}) => {

    return fetch(`${process.env.PUBLIC_OLLAMA_SERVER_API}/api/tags`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
		})
};