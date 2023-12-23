import { idbQuery } from '$lib/db/dbQuery';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    await request.json();
	idbQuery.insertChat();
    
	return new Response();
};
