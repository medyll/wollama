import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({request,fetch}) => {

    return fetch(`${config.ollama_server}/api/tags`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
		})
};