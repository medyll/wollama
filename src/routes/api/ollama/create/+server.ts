import { dbQuery } from '$lib/db/dbQuery';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    await request.json();
	dbQuery.insertChat();
    
	return new Response();
};
